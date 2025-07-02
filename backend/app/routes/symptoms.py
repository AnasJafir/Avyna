from flask import Blueprint, request, jsonify, current_app, g
from app.utils.auth_decorator import jwt_required
from app import db
from app.models.symptom_log import SymptomLog
from app.models.ai_recommendation import AIRecommendation
from app.models.user import User
from datetime import datetime
from datetime import timedelta
from sqlalchemy import func
import google.generativeai as genai
import openai
import re

symptoms_bp = Blueprint('symptoms', __name__)

def generate_ai_recommendation_for_log(log):
    """
    Generate a recommendation for a user's symptom log using the Gemini AI model.
    Now includes user profile information for more personalized recommendations.
    If the AI fails, fallback content will be used. The result includes a Markdown version.
    """
    try:
        # Get user profile information
        user = User.query.get(log.user_id)
        if not user:
            current_app.logger.error(f"User not found for log ID: {log.id}")
            return generate_fallback_recommendation(log)

        # Initialize Gemini
        gemini_api_key = current_app.config.get('GEMINI_API_KEY')
        genai.configure(api_key=gemini_api_key)

        model = genai.GenerativeModel('gemini-2.0-flash')

        # Build comprehensive prompt with profile information
        prompt = build_personalized_prompt(log, user)

        response = model.generate_content(prompt)

        if response and response.text:
            content = response.text
        else:
            raise Exception("Empty response from Gemini")

    except Exception as e:
        current_app.logger.error(f"Gemini API error: {e}")
        return generate_fallback_recommendation(log, user)

    try:
        parsed = parse_ai_response_to_markdown(content)

        # Assemble markdown full output
        markdown = f"""### 🥗 Diet
{parsed['diet']}

### 🏃 Exercise
{parsed['exercise']}

### 🧘 Wellness
{parsed['wellness']}"""

        # Save to DB
        recommendation = AIRecommendation(
            log_id=log.id,
            diet=parsed['diet'],
            exercise=parsed['exercise'],
            wellness=parsed['wellness'],
            generated_at=datetime.utcnow()
        )
        db.session.add(recommendation)
        db.session.commit()

        return True, {
            "diet": parsed['diet'],
            "exercise": parsed['exercise'],
            "wellness": parsed['wellness'],
            "markdown": markdown
        }

    except Exception as e:
        current_app.logger.error(f"Failed to parse or save Gemini recommendation: {e}")
        return generate_fallback_recommendation(log, user)


def build_personalized_prompt(log, user):
    """
    Build a comprehensive prompt that includes both symptom log and user profile information.
    """
    # Base symptom information
    prompt = f"""You are a medical assistant specializing in women's health, particularly PCOS and endometriosis. 

SYMPTOM LOG INFORMATION:
- Condition: {log.condition}
- Symptoms: {log.symptoms}
- Pain level: {log.pain_level}/10
- Mood: {log.mood}
- Cycle day: {log.cycle_day}
- Additional notes: {log.notes or 'None'}

USER PROFILE INFORMATION:
"""

    # Add age-specific considerations
    if user.age:
        prompt += f"- Age: {user.age} years\n"
        if user.age < 20:
            prompt += "  → Focus on gentle, age-appropriate recommendations for teenage health\n"
        elif user.age >= 40:
            prompt += "  → Consider perimenopause/menopause factors and age-related health needs\n"
    else:
        prompt += "- Age: Not specified\n"

    # Add PCOS-specific information
    if user.has_pcos is True:
        prompt += "- CONFIRMED PCOS diagnosis\n"
        prompt += "  → Prioritize insulin resistance management, anti-inflammatory approaches\n"
    elif user.has_pcos is False:
        prompt += "- No PCOS diagnosis\n"
    else:
        prompt += "- PCOS status: Unknown/Not specified\n"

    # Add Endometriosis-specific information
    if user.has_endometriosis is True:
        prompt += "- CONFIRMED Endometriosis diagnosis\n"
        prompt += "  → Focus on anti-inflammatory diet, pain management, gentle exercise\n"
    elif user.has_endometriosis is False:
        prompt += "- No Endometriosis diagnosis\n"
    else:
        prompt += "- Endometriosis status: Unknown/Not specified\n"

    # Add subscription-based personalization
    if user.subscription_plan == 'paid':
        prompt += "- Subscription: Premium user\n"
        prompt += "  → Provide detailed, comprehensive recommendations with advanced tips\n"
    else:
        prompt += "- Subscription: Free user\n"
        prompt += "  → Provide helpful but concise recommendations\n"

    # Add the main instruction
    prompt += f"""
PERSONALIZATION REQUIREMENTS:
- Tailor all recommendations based on the user's age, medical conditions, and symptoms
- If PCOS is confirmed, emphasize insulin sensitivity, low-glycemic foods, and hormone balance
- If Endometriosis is confirmed, prioritize anti-inflammatory approaches and pain management
- Consider the user's current pain level ({log.pain_level}/10) when suggesting exercise intensity
- Account for the reported mood ({log.mood}) in wellness recommendations
- If cycle day is provided ({log.cycle_day}), consider menstrual cycle phase in recommendations

Based on this comprehensive information, provide personalized recommendations in three categories with clear markdown formatting:

## Diet
[Provide specific dietary recommendations tailored to the user's conditions, age, and current symptoms - use bullet points]

## Exercise  
[Provide specific exercise recommendations considering pain level, age, conditions, and current symptoms - use bullet points]

## Wellness Tips
[Provide specific wellness recommendations based on mood, conditions, age, and overall health profile - use bullet points]

Please format your response using proper markdown with headers (##) and bullet points (-) for each recommendation. Make the advice specific and actionable based on the user's individual profile and current symptoms."""

    return prompt


def parse_ai_response_to_markdown(content):
    """Parse the AI response and format it as clean markdown."""
    parsed = {"diet": "", "exercise": "", "wellness": ""}
    
    # Clean up the content
    content = content.strip()
    
    # Split content by markdown headers
    sections = re.split(r'##\s*(Diet|Exercise|Wellness\s*Tips?)', content, flags=re.IGNORECASE)
    
    current_section = None
    for i, section in enumerate(sections):
        section = section.strip()
        if not section:
            continue
            
        # Check if this is a header
        if re.match(r'^(diet|exercise|wellness\s*tips?)$', section, re.IGNORECASE):
            current_section = section.lower().replace(' tips', '').replace('tips', '').strip()
            if current_section == 'wellness':
                current_section = 'wellness'
            continue
        
        # This is content for the current section
        if current_section and section:
            formatted_content = format_section_content(section)
            parsed[current_section] = formatted_content
    
    # Fallback parsing if markdown headers aren't found
    if not any(parsed.values()):
        parsed = fallback_parse_ai_response(content)
    
    # Ensure all sections have content and are properly formatted
    for key in parsed:
        if not parsed[key]:
            parsed[key] = get_default_recommendation_markdown(key)
        else:
            # Ensure content is properly formatted as markdown
            parsed[key] = ensure_markdown_formatting(parsed[key])
    
    return parsed


def format_section_content(content):
    """Format section content as clean markdown."""
    lines = content.split('\n')
    formatted_lines = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Convert numbered lists to bullet points
        line = re.sub(r'^\d+\.\s*', '- ', line)
        
        # Ensure bullet points are properly formatted
        if not line.startswith('-') and not line.startswith('*') and line:
            line = f"- {line}"
        
        formatted_lines.append(line)
    
    return '\n'.join(formatted_lines)


def fallback_parse_ai_response(content):
    """Fallback parsing method if markdown headers aren't detected."""
    parsed = {"diet": "", "exercise": "", "wellness": ""}
    
    lines = content.split('\n')
    current_section = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        line_lower = line.lower()
        
        # Identify sections
        if any(keyword in line_lower for keyword in ['diet', 'dietary', 'nutrition']):
            if any(starter in line_lower for starter in ['1.', '##', 'diet:']):
                current_section = 'diet'
                continue
        elif any(keyword in line_lower for keyword in ['exercise', 'physical', 'activity']):
            if any(starter in line_lower for starter in ['2.', '##', 'exercise:']):
                current_section = 'exercise'
                continue
        elif any(keyword in line_lower for keyword in ['wellness', 'well-being', 'wellbeing']):
            if any(starter in line_lower for starter in ['3.', '##', 'wellness:']):
                current_section = 'wellness'
                continue
        
        # Add content to current section
        if current_section and line:
            formatted_line = line
            if not formatted_line.startswith('-') and not formatted_line.startswith('*'):
                formatted_line = f"- {formatted_line}"
            
            if parsed[current_section]:
                parsed[current_section] += f"\n{formatted_line}"
            else:
                parsed[current_section] = formatted_line
    
    return parsed


def ensure_markdown_formatting(content):
    """Ensure content is properly formatted as markdown."""
    if not content:
        return content
    
    lines = content.split('\n')
    formatted_lines = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Ensure bullet points
        if not line.startswith('-') and not line.startswith('*') and not line.startswith('#'):
            line = f"- {line}"
        
        formatted_lines.append(line)
    
    return '\n'.join(formatted_lines)


def get_default_recommendation_markdown(category):
    """Provide default recommendations in markdown format based on category."""
    defaults = {
        'diet': """- Focus on anti-inflammatory foods like leafy greens, fatty fish, and nuts
- Limit processed foods and added sugars
- Include complex carbohydrates and lean proteins
- Stay hydrated with plenty of water""",
        
        'exercise': """- Engage in gentle activities like walking, yoga, or swimming
- Aim for 20-30 minutes of daily movement
- Listen to your body and adjust intensity as needed
- Include both cardio and strength training when possible""",
        
        'wellness': """- Maintain a regular sleep schedule (7-8 hours nightly)
- Practice stress management techniques like meditation
- Consider mindfulness and relaxation exercises
- Keep a symptom diary to track patterns"""
    }
    return defaults.get(category, '- Consult with your healthcare provider for personalized advice')


def generate_fallback_recommendation(log, user=None):
    """Generate condition-specific fallback recommendations in markdown format when AI fails."""
    # If user is not provided, try to get it from the log
    if not user:
        user = User.query.get(log.user_id)
    
    condition_lower = log.condition.lower() if log.condition else ""
    
    # Determine primary condition based on profile and reported condition
    has_pcos = user.has_pcos if user else False
    has_endo = user.has_endometriosis if user else False
    user_age = user.age if user else None
    
    # Customize recommendations based on confirmed conditions from profile
    if has_pcos or 'pcos' in condition_lower:
        mock = generate_pcos_recommendations(user_age, log.pain_level)
    elif has_endo or 'endometriosis' in condition_lower:
        mock = generate_endometriosis_recommendations(user_age, log.pain_level)
    else:
        mock = generate_general_recommendations(user_age, log.pain_level)

    # Save fallback recommendation to database
    try:
        recommendation = AIRecommendation(
            log_id=log.id,
            diet=mock['diet'],
            exercise=mock['exercise'],
            wellness=mock['wellness'],
            generated_at=datetime.utcnow()
        )
        db.session.add(recommendation)
        db.session.commit()
    except Exception as e:
        current_app.logger.error(f"Failed to save fallback recommendation: {e}")

    return False, mock


def generate_pcos_recommendations(age, pain_level):
    """Generate age and pain-adjusted PCOS recommendations."""
    base_diet = """- Focus on low-glycemic foods like quinoa, sweet potatoes, and oats
- Include lean proteins such as chicken, fish, and legumes
- Add anti-inflammatory foods like berries, leafy greens, and nuts
- Limit refined sugars and processed foods
- Consider cinnamon and spearmint tea for hormonal balance"""
    
    if age and age < 25:
        base_diet += "\n- Ensure adequate calcium and iron for young adult development"
    elif age and age > 35:
        base_diet += "\n- Focus on bone health with calcium-rich foods and vitamin D"
    
    exercise_intensity = "moderate" if pain_level and pain_level > 6 else "regular"
    base_exercise = f"""- Combine cardio with strength training for insulin sensitivity
- Try brisk walking, cycling, or swimming for 30 minutes daily
- Include resistance exercises 2-3 times per week
- Practice yoga for stress reduction and flexibility"""
    
    if pain_level and pain_level > 7:
        base_exercise += "\n- Focus on gentle stretching and restorative yoga during high pain days"
    
    base_wellness = """- Manage stress through meditation and deep breathing
- Ensure 7-8 hours of quality sleep nightly
- Consider supplements like inositol and vitamin D (consult doctor first)
- Track your menstrual cycle and symptoms
- Build a support network of friends, family, or support groups"""
    
    return {"diet": base_diet, "exercise": base_exercise, "wellness": base_wellness}


def generate_endometriosis_recommendations(age, pain_level):
    """Generate age and pain-adjusted Endometriosis recommendations."""
    base_diet = """- Emphasize omega-3 rich foods like salmon, walnuts, and flaxseeds
- Include high-fiber foods to support hormone balance
- Add antioxidant-rich foods like berries, dark chocolate, and green tea
- Limit red meat and processed foods which may increase inflammation
- Consider an anti-inflammatory diet approach"""
    
    if age and age < 25:
        base_diet += "\n- Ensure adequate nutrition for energy and healing"
    elif age and age > 35:
        base_diet += "\n- Focus on foods that support hormonal balance during potential perimenopause"
    
    base_exercise = """- Practice gentle yoga and stretching during flare-ups
- Try low-impact activities like swimming or walking
- Include pelvic floor exercises and core strengthening
- Listen to your body and rest when needed"""
    
    if pain_level and pain_level > 7:
        base_exercise = """- Focus on very gentle movement like stretching or short walks
- Practice restorative yoga poses
- Avoid high-intensity workouts during severe pain
- Consider physical therapy for pelvic floor support"""
    
    base_wellness = """- Use heat therapy for pain relief (heating pad, warm baths)
- Practice stress reduction techniques like meditation
- Ensure adequate rest and sleep
- Consider acupuncture or massage therapy
- Connect with endometriosis support groups for emotional support"""
    
    return {"diet": base_diet, "exercise": base_exercise, "wellness": base_wellness}


def generate_general_recommendations(age, pain_level):
    """Generate general health recommendations adjusted for age and pain level."""
    base_diet = """- Maintain a balanced diet rich in fruits and vegetables
- Include whole grains and lean proteins
- Limit processed foods and excessive sugar
- Stay hydrated throughout the day
- Consider consulting a nutritionist for personalized advice"""
    
    if age and age < 25:
        base_diet += "\n- Focus on nutrients important for development and energy"
    elif age and age > 35:
        base_diet += "\n- Include foods rich in antioxidants and anti-inflammatory properties"
    
    base_exercise = """- Engage in regular physical activity suitable for your comfort level
- Start with gentle activities like walking or stretching
- Gradually increase intensity as tolerated
- Include both cardio and strength training
- Make movement enjoyable by choosing activities you like"""
    
    if pain_level and pain_level > 6:
        base_exercise += "\n- Adjust exercise intensity based on pain levels\n- Focus on gentle stretching and movement on difficult days"
    
    base_wellness = """- Prioritize sleep hygiene and consistent sleep schedule
- Practice stress management techniques
- Maintain regular medical check-ups
- Keep a health journal to track symptoms and triggers
- Build a strong support system"""
    
    return {"diet": base_diet, "exercise": base_exercise, "wellness": base_wellness}


@symptoms_bp.route('/', methods=['POST'])
@jwt_required
def log_symptom():
    """
    Logs a user's symptoms and generates a personalized AI-based recommendation.

    This endpoint allows an authenticated user to log their symptoms. Upon logging,
    it attempts to generate a recommendation using AI that takes into account both
    the symptom log and the user's profile information (age, PCOS status, 
    endometriosis status, etc.). The recommendation focuses on diet, exercise, 
    and wellness based on the user's comprehensive health profile.

    The function stores the symptom log in the database and tries to create a 
    personalized AI recommendation. If the AI recommendation generation fails, 
    it provides personalized fallback recommendations based on the user's profile.

    Returns:
        JSON response containing a success message, log ID, and the AI-generated 
        recommendation in clean markdown format. The recommendations are now 
        personalized based on user profile information.

    Raises:
        201: Symptom log created, with personalized recommendation (AI or fallback).
    """

    data = request.get_json()
    log = SymptomLog(
        user_id=g.current_user.id,
        date=datetime.utcnow().date(),
        condition=data.get('condition'),
        symptoms=data.get('symptoms'),
        pain_level=data.get('pain_level'),
        mood=data.get('mood'),
        cycle_day=data.get('cycle_day'),
        notes=data.get('notes')
    )
    db.session.add(log)
    db.session.commit()

    # Generate personalized AI recommendation automatically
    success, result = generate_ai_recommendation_for_log(log)
    if success:
        print("\n=== PERSONALIZED MARKDOWN RENDER TEST ===\n")
        print(result["markdown"])
        print("\n========================================\n")
        return jsonify({
            "message": "Symptom log created and personalized recommendation generated",
            "log_id": log.id,
            "recommendation": result
        }), 201
    else:
        # Still return the log creation with personalized fallback recommendations
        return jsonify({
            "message": "Symptom log created with personalized fallback recommendation",
            "log_id": log.id,
            "recommendation": result  # This will contain personalized fallback markdown recommendations
        }), 201
        
# Add these routes to your symptoms.py file after the existing POST route

@symptoms_bp.route('/', methods=['GET'])
@jwt_required
def get_user_symptom_logs():
    """
    Retrieve all symptom logs for the authenticated user with optional filtering.
    
    Query parameters:
    - limit: Number of logs to return (default: 50, max: 100)
    - offset: Number of logs to skip for pagination (default: 0)
    - start_date: Filter logs from this date (format: YYYY-MM-DD)
    - end_date: Filter logs until this date (format: YYYY-MM-DD)
    - condition: Filter by specific condition
    - sort: Sort order - 'desc' for newest first, 'asc' for oldest first (default: desc)
    
    Returns:
        JSON response containing user's symptom logs with recommendations
    """
    # Get query parameters
    limit = min(int(request.args.get('limit', 50)), 100)  # Max 100 logs per request
    offset = int(request.args.get('offset', 0))
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    condition = request.args.get('condition')
    sort_order = request.args.get('sort', 'desc')
    
    # Build query
    query = SymptomLog.query.filter_by(user_id=g.current_user.id)
    
    # Apply date filters
    if start_date:
        try:
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
            query = query.filter(SymptomLog.date >= start_date_obj)
        except ValueError:
            return jsonify({"error": "Invalid start_date format. Use YYYY-MM-DD"}), 400
    
    if end_date:
        try:
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
            query = query.filter(SymptomLog.date <= end_date_obj)
        except ValueError:
            return jsonify({"error": "Invalid end_date format. Use YYYY-MM-DD"}), 400
    
    # Apply condition filter
    if condition:
        query = query.filter(SymptomLog.condition.ilike(f'%{condition}%'))
    
    # Apply sorting
    if sort_order.lower() == 'asc':
        query = query.order_by(SymptomLog.date.asc(), SymptomLog.id.asc())
    else:
        query = query.order_by(SymptomLog.date.desc(), SymptomLog.id.desc())
    
    # Apply pagination
    logs = query.offset(offset).limit(limit).all()
    
    # Convert to JSON format
    logs_data = []
    for log in logs:
        log_data = {
            "id": log.id,
            "date": log.date.isoformat(),
            "condition": log.condition,
            "symptoms": log.symptoms,
            "pain_level": log.pain_level,
            "mood": log.mood,
            "cycle_day": log.cycle_day,
            "notes": log.notes,
            "recommendation": None
        }
        
        # Include recommendation if exists
        if log.recommendation:
            log_data["recommendation"] = {
                "diet": log.recommendation.diet,
                "exercise": log.recommendation.exercise,
                "wellness": log.recommendation.wellness,
                "generated_at": log.recommendation.generated_at.isoformat(),
                "markdown": f"""### 🥗 Diet
{log.recommendation.diet}

### 🏃 Exercise
{log.recommendation.exercise}

### 🧘 Wellness
{log.recommendation.wellness}"""
            }
        
        logs_data.append(log_data)
    
    # Get total count for pagination info
    total_count = SymptomLog.query.filter_by(user_id=g.current_user.id).count()
    
    return jsonify({
        "logs": logs_data,
        "pagination": {
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "has_more": offset + limit < total_count
        }
    }), 200


@symptoms_bp.route('/<int:log_id>', methods=['GET'])
@jwt_required
def get_symptom_log_by_id(log_id):
    """
    Retrieve a specific symptom log by ID for the authenticated user.
    
    Args:
        log_id: The ID of the symptom log to retrieve
        
    Returns:
        JSON response containing the specific symptom log with recommendation
    """
    log = SymptomLog.query.filter_by(
        id=log_id, 
        user_id=g.current_user.id
    ).first()
    
    if not log:
        return jsonify({"error": "Symptom log not found"}), 404
    
    log_data = {
        "id": log.id,
        "date": log.date.isoformat(),
        "condition": log.condition,
        "symptoms": log.symptoms,
        "pain_level": log.pain_level,
        "mood": log.mood,
        "cycle_day": log.cycle_day,
        "notes": log.notes,
        "recommendation": None
    }
    
    # Include recommendation if exists
    if log.recommendation:
        log_data["recommendation"] = {
            "diet": log.recommendation.diet,
            "exercise": log.recommendation.exercise,
            "wellness": log.recommendation.wellness,
            "generated_at": log.recommendation.generated_at.isoformat(),
            "markdown": f"""### 🥗 Diet
{log.recommendation.diet}

### 🏃 Exercise
{log.recommendation.exercise}

### 🧘 Wellness
{log.recommendation.wellness}"""
        }
    
    return jsonify({"log": log_data}), 200


@symptoms_bp.route('/recent', methods=['GET'])
@jwt_required
def get_recent_symptom_logs():
    """
    Retrieve the most recent symptom logs for the authenticated user.
    Useful for dashboard/summary views.
    
    Query parameters:
    - days: Number of days to look back (default: 7, max: 30)
    
    Returns:
        JSON response containing recent symptom logs
    """
    days = min(int(request.args.get('days', 7)), 30)  # Max 30 days
    
    from datetime import timedelta
    cutoff_date = datetime.utcnow().date() - timedelta(days=days)
    
    logs = SymptomLog.query.filter(
        SymptomLog.user_id == g.current_user.id,
        SymptomLog.date >= cutoff_date
    ).order_by(SymptomLog.date.desc()).all()
    
    logs_data = []
    for log in logs:
        log_data = {
            "id": log.id,
            "date": log.date.isoformat(),
            "condition": log.condition,
            "symptoms": log.symptoms,
            "pain_level": log.pain_level,
            "mood": log.mood,
            "cycle_day": log.cycle_day,
            "notes": log.notes,
            "has_recommendation": log.recommendation is not None
        }
        logs_data.append(log_data)
    
    return jsonify({
        "logs": logs_data,
        "period_days": days,
        "total_logs": len(logs_data)
    }), 200


@symptoms_bp.route('/analytics', methods=['GET'])
@jwt_required
def get_symptom_analytics():
    """
    Get analytics and insights about the user's symptom patterns.
    
    Query parameters:
    - days: Number of days to analyze (default: 30, max: 90)
    
    Returns:
        JSON response containing symptom analytics
    """
    days = min(int(request.args.get('days', 30)), 90)  # Max 90 days
    
    from datetime import timedelta
    from sqlalchemy import func
    
    cutoff_date = datetime.utcnow().date() - timedelta(days=days)
    
    # Get logs for analysis
    logs = SymptomLog.query.filter(
        SymptomLog.user_id == g.current_user.id,
        SymptomLog.date >= cutoff_date
    ).all()
    
    if not logs:
        return jsonify({
            "message": "No symptom logs found for the specified period",
            "analytics": None
        }), 200
    
    # Calculate analytics
    total_logs = len(logs)
    
    # Pain level analytics
    pain_levels = [log.pain_level for log in logs if log.pain_level is not None]
    avg_pain = sum(pain_levels) / len(pain_levels) if pain_levels else 0
    max_pain = max(pain_levels) if pain_levels else 0
    
    # Mood analytics
    moods = [log.mood for log in logs if log.mood]
    mood_counts = {}
    for mood in moods:
        mood_counts[mood] = mood_counts.get(mood, 0) + 1
    
    # Condition analytics
    conditions = [log.condition for log in logs if log.condition]
    condition_counts = {}
    for condition in conditions:
        condition_counts[condition] = condition_counts.get(condition, 0) + 1
    
    # Most common symptoms
    all_symptoms = []
    for log in logs:
        if log.symptoms:
            # Split symptoms by common delimiters
            symptoms = [s.strip() for s in log.symptoms.replace(',', ';').split(';')]
            all_symptoms.extend(symptoms)
    
    symptom_counts = {}
    for symptom in all_symptoms:
        if symptom:  # Skip empty strings
            symptom_counts[symptom.lower()] = symptom_counts.get(symptom.lower(), 0) + 1
    
    # Get top 5 symptoms
    top_symptoms = sorted(symptom_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    
    analytics = {
        "period_days": days,
        "total_logs": total_logs,
        "pain_analytics": {
            "average_pain": round(avg_pain, 1),
            "max_pain": max_pain,
            "total_pain_entries": len(pain_levels)
        },
        "mood_distribution": mood_counts,
        "condition_distribution": condition_counts,
        "top_symptoms": [{"symptom": symptom, "count": count} for symptom, count in top_symptoms],
        "logging_frequency": round(total_logs / days, 2)  # logs per day
    }
    
    return jsonify({"analytics": analytics}), 200