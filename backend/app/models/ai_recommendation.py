# app/models/ai_recommendation.py
from app import db
from datetime import datetime

class AIRecommendation(db.Model):
    __tablename__ = 'ai_recommendations'
    id = db.Column(db.Integer, primary_key=True)
    log_id = db.Column(db.Integer, db.ForeignKey('symptom_logs.id'), nullable=False, unique=True)
    diet = db.Column(db.Text)
    exercise = db.Column(db.Text)
    wellness = db.Column(db.Text)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)