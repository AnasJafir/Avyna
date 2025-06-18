# --- Routes: Authentication ---
# app/routes/auth.py
from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
import jwt as pyjwt
from datetime import datetime, timedelta
from app import db
from app.models.user import User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validate required fields
    if not data.get('email') or not data.get('password') or not data.get('full_name'):
        return jsonify({"error": "Email, password, and full name are required"}), 400
    
    # Validate full name (at least 2 characters)
    if len(data['full_name'].strip()) < 2:
        return jsonify({"error": "Full name must be at least 2 characters long"}), 400

    # Check if email already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Email already registered"}), 409

    # Create new user
    hashed_password = generate_password_hash(data['password'])
    user = User(
        email=data['email'], 
        password_hash=hashed_password,
        full_name=data['full_name'].strip()
    )
    
    try:
        db.session.add(user)
        db.session.commit()
        
        # Generate JWT token for automatic login after registration
        token = pyjwt.encode({
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, current_app.config['JWT_SECRET'], algorithm='HS256')
        
        return jsonify({
            "message": "User registered successfully",
            "token": token,
            "user": user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data.get('email') or not data.get('password'):
        return jsonify({"error": "Email and password required"}), 400

    user = User.query.filter_by(email=data['email']).first()
    if user and check_password_hash(user.password_hash, data['password']):
        token = pyjwt.encode({
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, current_app.config['JWT_SECRET'], algorithm='HS256')
        
        return jsonify({
            "token": token,
            "user": user.to_dict()
        }), 200
    else:
        return jsonify({"error": "Invalid credentials"}), 401