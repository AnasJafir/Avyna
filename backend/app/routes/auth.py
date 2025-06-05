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
    """
    Register a new user.
    ---
    post:
      summary: Register a new user
      description: Creates a new user with the provided email and password.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - email
                - password
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  format: password
      responses:
        201:
          description: User registered successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
        400:
          description: Email and password required
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
        409:
          description: Email already registered
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
    """
    data = request.get_json()
    if not data.get('email') or not data.get('password'):
        return jsonify({"error": "Email and password required"}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Email already registered"}), 409

    hashed_password = generate_password_hash(data['password'])
    user = User(email=data['email'], password_hash=hashed_password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Authenticates a user using their email and password.

    Request Body:
        {
            "email": string,
            "password": string
        }

    Returns:
        {
            "token": string (JWT token)
        }

    Raises:
        400: Bad request (email and password required)
        401: Unauthorized (invalid credentials)

    """
    data = request.get_json()
    if not data.get('email') or not data.get('password'):
        return jsonify({"error": "Email and password required"}), 400

    user = User.query.filter_by(email=data['email']).first()
    if user and check_password_hash(user.password_hash, data['password']):
        token = pyjwt.encode({
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, current_app.config['JWT_SECRET'], algorithm='HS256')
        return jsonify({"token": token}), 200
    else:
        return jsonify({"error": "Invalid credentials"}), 401