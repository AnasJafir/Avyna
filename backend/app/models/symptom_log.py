# app/models/symptom_log.py
from app import db
from datetime import datetime

class SymptomLog(db.Model):
    __tablename__ = 'symptom_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.Date, default=datetime.utcnow)
    condition = db.Column(db.Text)
    symptoms = db.Column(db.Text)
    pain_level = db.Column(db.Integer)
    mood = db.Column(db.String(50))
    cycle_day = db.Column(db.Integer)
    notes = db.Column(db.Text)

    recommendation = db.relationship('AIRecommendation', backref='log', uselist=False)