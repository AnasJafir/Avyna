# --- Routes: AI Recommendation Generation ---
# app/routes/recommendations.py
from flask import Blueprint, request, jsonify, current_app, g
from app.utils.auth_decorator import jwt_required
from app.models.symptom_log import SymptomLog
from app.models.ai_recommendation import AIRecommendation
from flask import g
from app import db
import openai
from datetime import datetime

recommendations_bp = Blueprint('recommendations', __name__)

@recommendations_bp.route('/<int:log_id>', methods=['GET'])
@jwt_required
def get_recommendation(log_id):
    """
    Returns the AI recommendation for a given symptom log,
    including a markdown-formatted version dynamically assembled.

    Args:
        log_id (int): ID of the symptom log to retrieve the recommendation for

    Returns:
        JSON with the following structure:
            {
                "recommendation": {
                    "diet": str,
                    "exercise": str,
                    "wellness": str,
                    "markdown": str,
                    "generated_at": str (ISO-formatted datetime)
                }
            }

    Raises:
        404: If the symptom log is not found or access is denied
    """
    log = SymptomLog.query.filter_by(id=log_id, user_id=g.current_user.id).first()
    if not log:
        return jsonify({"error": "Symptom log not found or access denied"}), 404

    recommendation = AIRecommendation.query.filter_by(log_id=log.id).first()
    if not recommendation:
        return jsonify({"error": "No recommendation found for this symptom log"}), 404

    # Generate markdown dynamically (clean and safe)
    markdown = f"""### 🥗 Diet
{recommendation.diet}

### 🏃 Exercise
{recommendation.exercise}

### 🧘 Wellness
{recommendation.wellness}"""

    data = {
        "diet": recommendation.diet,
        "exercise": recommendation.exercise,
        "wellness": recommendation.wellness,
        "markdown": markdown,
        "generated_at": recommendation.generated_at.isoformat()
    }

    return jsonify({"recommendation": data}), 200
