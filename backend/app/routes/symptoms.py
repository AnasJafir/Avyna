from flask import Blueprint, request, jsonify, current_app, g
from app.utils.auth_decorator import jwt_required
from app import db
from app.models.symptom_log import SymptomLog
from app.models.ai_recommendation import AIRecommendation
from datetime import datetime
import google.generativeai as genai
import openai

symptoms_bp = Blueprint('symptoms', __name__)

def generate_ai_recommendation_for_log(log):
    """
    Generate a recommendation for a user's symptom log using the Gemini AI model.

    This function will attempt to generate a recommendation using the Gemini AI model. If the AI model fails,
    it will fallback to generating a recommendation using a mock algorithm.

    Args:
        log (SymptomLog): The symptom log to generate a recommendation for.

    Returns:
        tuple: A tuple containing a boolean indicating success and a dictionary with the generated recommendation.
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

Based on this, provide a concise recommendation in three categories:
1. Diet: [specific dietary recommendations]
2. Exercise: [specific exercise recommendations]
3. Wellness tips: [specific wellness recommendations]

Please format your response clearly with numbered sections.
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
        parsed = parse_ai_response(content)

        recommendation = AIRecommendation(
            log_id=log.id,
            diet=parsed['diet'],
            exercise=parsed['exercise'],
            wellness=parsed['wellness'],
            generated_at=datetime.utcnow()
        )
        db.session.add(recommendation)
        db.session.commit()

        return True, parsed

    except Exception as e:
        current_app.logger.error(f"Failed to parse or save Gemini recommendation: {e}")
        return generate_fallback_recommendation(log)


def parse_ai_response(content):
    """Parse the AI response to extract diet, exercise, and wellness recommendations."""
    parsed = {"diet": "", "exercise": "", "wellness": ""}
    
    # Convert to lowercase for easier parsing
    content_lower = content.lower()
    lines = content.split('\n')
    
    current_section = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        line_lower = line.lower()
        
        # Identify sections
        if any(keyword in line_lower for keyword in ['1. diet', 'diet:', 'dietary']):
            current_section = 'diet'
            # Extract content after the section header
            if ':' in line:
                parsed['diet'] = line.split(':', 1)[1].strip()
            continue
        elif any(keyword in line_lower for keyword in ['2. exercise', 'exercise:', 'physical']):
            current_section = 'exercise'
            if ':' in line:
                parsed['exercise'] = line.split(':', 1)[1].strip()
            continue
        elif any(keyword in line_lower for keyword in ['3. wellness', 'wellness:', 'well-being', 'wellbeing']):
            current_section = 'wellness'
            if ':' in line:
                parsed['wellness'] = line.split(':', 1)[1].strip()
            continue
        
        # Add content to current section
        if current_section and line:
            if parsed[current_section]:
                parsed[current_section] += f" {line}"
            else:
                parsed[current_section] = line
    
    # Ensure all sections have content
    for key in parsed:
        if not parsed[key]:
            parsed[key] = get_default_recommendation(key)
    
    return parsed

def get_default_recommendation(category):
    """Provide default recommendations based on category."""
    defaults = {
        'diet': 'Focus on anti-inflammatory foods like leafy greens, fatty fish, and nuts. Limit processed foods and sugar.',
        'exercise': 'Engage in gentle activities like walking, yoga, or swimming for 20-30 minutes daily.',
        'wellness': 'Maintain regular sleep schedule, practice stress management, and consider mindfulness techniques.'
    }
    return defaults.get(category, 'Consult with your healthcare provider for personalized advice.')

def generate_fallback_recommendation(log):
    """Generate condition-specific fallback recommendations when AI fails."""
    condition_lower = log.condition.lower() if log.condition else ""
    
    if 'pcos' in condition_lower:
        mock = {
            "diet": "Focus on low-glycemic foods, lean proteins, and anti-inflammatory options like berries and leafy greens.",
            "exercise": "Combine cardio with strength training. Consider activities like brisk walking or cycling.",
            "wellness": "Manage stress through meditation and ensure 7-8 hours of sleep. Consider supplements like inositol."
        }
    elif 'endometriosis' in condition_lower:
        mock = {
            "diet": "Emphasize omega-3 rich foods, fiber, and antioxidants. Limit red meat and processed foods.",
            "exercise": "Gentle yoga, stretching, and low-impact activities during flare-ups.",
            "wellness": "Heat therapy for pain relief, stress reduction techniques, and adequate rest."
        }
    else:
        mock = {
            "diet": "Maintain a balanced diet rich in fruits, vegetables, and whole grains.",
            "exercise": "Engage in regular physical activity suitable for your comfort level.",
            "wellness": "Prioritize sleep, stress management, and regular medical check-ups."
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

# Original OpenAI implementation - COMMENTED OUT
"""
def generate_ai_recommendation_for_log(log):
    openai.api_key = current_app.config['OPENAI_API_KEY']

    prompt = f'''
    User reported the following symptoms:
    - Condition: {log.condition}
    - Symptoms: {log.symptoms}
    - Pain level: {log.pain_level}/10
    - Mood: {log.mood}
    - Cycle day: {log.cycle_day}

    Based on this, provide a concise recommendation in three categories:
    1. Diet
    2. Exercise
    3. Wellness tips
    '''

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a medical assistant helping users with PCOS and endometriosis."},
                {"role": "user", "content": prompt}
            ]
        )
        content = response.choices[0].message.content
        sections = content.split("\\n\\n")
        parsed = {"diet": "", "exercise": "", "wellness": ""}
        for section in sections:
            if section.lower().startswith("1. diet"):
                parsed["diet"] = section.split("Diet")[-1].strip()
            elif section.lower().startswith("2. exercise"):
                parsed["exercise"] = section.split("Exercise")[-1].strip()
            elif section.lower().startswith("3. wellness"):
                parsed["wellness"] = section.split("Wellness")[-1].strip()

        recommendation = AIRecommendation(
            log_id=log.id,
            diet=parsed['diet'],
            exercise=parsed['exercise'],
            wellness=parsed['wellness'],
            generated_at=datetime.utcnow()
        )
        db.session.add(recommendation)
        db.session.commit()

        return True, parsed

    except Exception as e:
        current_app.logger.error(f"AI recommendation generation failed: {e}")
        # Mocked response
        mock = {
            "diet": "Increase intake of anti-inflammatory foods like leafy greens and turmeric.",
            "exercise": "Consider gentle yoga or walking for 20 minutes daily.",
            "wellness": "Maintain a consistent sleep schedule and try stress-reducing activities like journaling."
        }

        # Save mocked recommendation to the DB for demo purposes
        recommendation = AIRecommendation(
            log_id=log.id,
            diet=mock['diet'],
            exercise=mock['exercise'],
            wellness=mock['wellness'],
            generated_at=datetime.utcnow()
        )
        db.session.add(recommendation)
        db.session.commit()

        return False, mock
"""

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
        recommendation if successful. If AI recommendation generation fails, returns 
        an error message along with the created log ID.

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

    # Génération AI automatique
    success, result = generate_ai_recommendation_for_log(log)
    if success:
        return jsonify({
            "message": "Symptom log created and recommendation generated",
            "log_id": log.id,
            "recommendation": result
        }), 201
    else:
        # On peut quand même renvoyer la création du log mais signaler l'erreur AI
        return jsonify({
            "message": "Symptom log created but failed to generate recommendation",
            "log_id": log.id,
            "error": result
        }), 201
