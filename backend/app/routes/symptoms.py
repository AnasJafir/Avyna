from flask import Blueprint, request, jsonify, current_app, g
from app.utils.auth_decorator import jwt_required
from app import db
from app.models.symptom_log import SymptomLog
from app.models.ai_recommendation import AIRecommendation
from datetime import datetime
import google.generativeai as genai
import openai
import re

symptoms_bp = Blueprint('symptoms', __name__)

def generate_ai_recommendation_for_log(log):
    """
    Generate a recommendation for a user's symptom log using the Gemini AI model.
    If the AI fails, fallback content will be used. The result includes a Markdown version.
    """
    try:
        # Initialize Gemini
        gemini_api_key = current_app.config.get('GEMINI_API_KEY')
        genai.configure(api_key=gemini_api_key)

        model = genai.GenerativeModel('gemini-2.0-flash')

        prompt = f"""You are a medical assistant helping users with PCOS and endometriosis. 

User reported the following symptoms:
- Condition: {log.condition}
- Symptoms: {log.symptoms}
- Pain level: {log.pain_level}/10
- Mood: {log.mood}
- Cycle day: {log.cycle_day}

Based on this, provide a concise recommendation in three categories with clear markdown formatting:

## Diet
[Provide specific dietary recommendations with bullet points]

## Exercise
[Provide specific exercise recommendations with bullet points]

## Wellness Tips
[Provide specific wellness recommendations with bullet points]

Please format your response using proper markdown with headers (##) and bullet points (-) for each recommendation.
"""

        response = model.generate_content(prompt)

        if response and response.text:
            content = response.text
        else:
            raise Exception("Empty response from Gemini")

    except Exception as e:
        current_app.logger.error(f"Gemini API error: {e}")
        return generate_fallback_recommendation(log)

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
        return generate_fallback_recommendation(log)


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


def generate_fallback_recommendation(log):
    """Generate condition-specific fallback recommendations in markdown format when AI fails."""
    condition_lower = log.condition.lower() if log.condition else ""
    
    if 'pcos' in condition_lower:
        mock = {
            "diet": """- Focus on low-glycemic foods like quinoa, sweet potatoes, and oats
- Include lean proteins such as chicken, fish, and legumes
- Add anti-inflammatory foods like berries, leafy greens, and nuts
- Limit refined sugars and processed foods
- Consider cinnamon and spearmint tea for hormonal balance""",
            
            "exercise": """- Combine cardio with strength training for insulin sensitivity
- Try brisk walking, cycling, or swimming for 30 minutes daily
- Include resistance exercises 2-3 times per week
- Practice yoga for stress reduction and flexibility
- Avoid overexercising which can increase cortisol""",
            
            "wellness": """- Manage stress through meditation and deep breathing
- Ensure 7-8 hours of quality sleep nightly
- Consider supplements like inositol and vitamin D (consult doctor first)
- Track your menstrual cycle and symptoms
- Build a support network of friends, family, or support groups"""
        }
    elif 'endometriosis' in condition_lower:
        mock = {
            "diet": """- Emphasize omega-3 rich foods like salmon, walnuts, and flaxseeds
- Include high-fiber foods to support hormone balance
- Add antioxidant-rich foods like berries, dark chocolate, and green tea
- Limit red meat and processed foods which may increase inflammation
- Consider an anti-inflammatory diet approach""",
            
            "exercise": """- Practice gentle yoga and stretching during flare-ups
- Try low-impact activities like swimming or walking
- Avoid high-intensity workouts during painful periods
- Include pelvic floor exercises and core strengthening
- Listen to your body and rest when needed""",
            
            "wellness": """- Use heat therapy for pain relief (heating pad, warm baths)
- Practice stress reduction techniques like meditation
- Ensure adequate rest and sleep
- Consider acupuncture or massage therapy
- Connect with endometriosis support groups for emotional support"""
        }
    else:
        mock = {
            "diet": """- Maintain a balanced diet rich in fruits and vegetables
- Include whole grains and lean proteins
- Limit processed foods and excessive sugar
- Stay hydrated throughout the day
- Consider consulting a nutritionist for personalized advice""",
            
            "exercise": """- Engage in regular physical activity suitable for your comfort level
- Start with gentle activities like walking or stretching
- Gradually increase intensity as tolerated
- Include both cardio and strength training
- Make movement enjoyable by choosing activities you like""",
            
            "wellness": """- Prioritize sleep hygiene and consistent sleep schedule
- Practice stress management techniques
- Maintain regular medical check-ups
- Keep a health journal to track symptoms and triggers
- Build a strong support system"""
        }

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


@symptoms_bp.route('/', methods=['POST'])
@jwt_required
def log_symptom():
    """
    Logs a user's symptoms and generates an AI-based recommendation.

    This endpoint allows an authenticated user to log their symptoms. Upon logging,
    it attempts to generate a recommendation using AI. The recommendation focuses on 
    diet, exercise, and wellness based on the user's reported symptoms and condition.

    The function stores the symptom log in the database and tries to create an AI 
    recommendation. If the AI recommendation generation fails, it still returns the 
    logged symptoms with an error message regarding the AI failure.

    Returns:
        JSON response containing a success message, log ID, and the AI-generated 
        recommendation in clean markdown format. If AI recommendation generation fails, 
        returns an error message along with the created log ID.

    Raises:
        201: Symptom log created, with or without a successful recommendation.
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

    # Generate AI recommendation automatically
    success, result = generate_ai_recommendation_for_log(log)
    if success:
        print("\n=== MARKDOWN RENDER TEST ===\n")
        print(result["markdown"])
        print("\n============================\n")
        return jsonify({
            "message": "Symptom log created and recommendation generated",
            "log_id": log.id,
            "recommendation": result
        }), 201
    else:
        # Still return the log creation but signal AI error
        return jsonify({
            "message": "Symptom log created but failed to generate recommendation",
            "log_id": log.id,
            "recommendation": result  # This will contain the fallback markdown recommendations
        }), 201