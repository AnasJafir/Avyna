# --- Models ---

# app/models/user.py
from datetime import datetime
from app import db

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=True)
    has_pcos = db.Column(db.Boolean, nullable=True)
    has_endometriosis = db.Column(db.Boolean, nullable=True)
    subscription_plan = db.Column(db.String(20), default='free', nullable=False)  # 'free' or 'paid'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    symptom_logs = db.relationship('SymptomLog', backref='user', lazy=True)

    def to_dict(self):
        """Convert user object to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'email': self.email,
            'full_name': self.full_name,
            'age': self.age,
            'has_pcos': self.has_pcos,
            'has_endometriosis': self.has_endometriosis,
            'subscription_plan': self.subscription_plan,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }