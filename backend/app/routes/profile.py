# --- Routes: Profile ---
# app/routes/profile.py (Optional separate file for better organization)
from flask import Blueprint, request, jsonify, g
from werkzeug.security import generate_password_hash, check_password_hash
from app import db
from app.models.user import User
from app.utils.auth_decorator import jwt_required

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/', methods=['GET'])
@jwt_required
def get_profile():
    """Get current user's profile information"""
    return jsonify({"user": g.current_user.to_dict()}), 200


@profile_bp.route('/', methods=['PUT'])
@jwt_required
def update_profile():
    """Update current user's profile information"""
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    user = g.current_user
    
    # Update full name if provided
    if 'full_name' in data:
        if not data['full_name'] or len(data['full_name'].strip()) < 2:
            return jsonify({"error": "Full name must be at least 2 characters long"}), 400
        user.full_name = data['full_name'].strip()
    
    # Update email if provided
    if 'email' in data:
        if not data['email']:
            return jsonify({"error": "Email cannot be empty"}), 400
        
        # Check if the new email is already taken by another user
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user and existing_user.id != user.id:
            return jsonify({"error": "Email already registered"}), 409
        
        user.email = data['email']
    
    # Update age if provided
    if 'age' in data:
        if data['age'] is not None:
            if not isinstance(data['age'], int) or data['age'] < 10 or data['age'] > 100:
                return jsonify({"error": "Age must be a number between 10 and 100"}), 400
        user.age = data['age']
    
    # Update PCOS status if provided
    if 'has_pcos' in data:
        if data['has_pcos'] is not None and not isinstance(data['has_pcos'], bool):
            return jsonify({"error": "PCOS status must be true, false, or null"}), 400
        user.has_pcos = data['has_pcos']
    
    # Update Endometriosis status if provided
    if 'has_endometriosis' in data:
        if data['has_endometriosis'] is not None and not isinstance(data['has_endometriosis'], bool):
            return jsonify({"error": "Endometriosis status must be true, false, or null"}), 400
        user.has_endometriosis = data['has_endometriosis']
    
    # Update subscription plan if provided
    if 'subscription_plan' in data:
        if data['subscription_plan'] not in ['free', 'paid']:
            return jsonify({"error": "Subscription plan must be 'free' or 'paid'"}), 400
        user.subscription_plan = data['subscription_plan']
    
    try:
        db.session.commit()
        return jsonify({
            "message": "Profile updated successfully",
            "user": user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Profile update failed. Please try again."}), 500


@profile_bp.route('/change-password', methods=['PUT'])
@jwt_required
def change_password():
    """Change current user's password"""
    data = request.get_json()
    
    if not data.get('current_password') or not data.get('new_password'):
        return jsonify({"error": "Current password and new password are required"}), 400
    
    user = g.current_user
    
    # Verify current password
    if not check_password_hash(user.password_hash, data['current_password']):
        return jsonify({"error": "Current password is incorrect"}), 400
    
    # Validate new password (you can add more validation rules here)
    if len(data['new_password']) < 6:
        return jsonify({"error": "New password must be at least 6 characters long"}), 400
    
    try:
        user.password_hash = generate_password_hash(data['new_password'])
        db.session.commit()
        
        return jsonify({"message": "Password changed successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Password change failed. Please try again."}), 500


@profile_bp.route('/subscription', methods=['PUT'])
@jwt_required
def update_subscription():
    """Update user's subscription plan"""
    data = request.get_json()
    
    if not data or 'subscription_plan' not in data:
        return jsonify({"error": "Subscription plan is required"}), 400
    
    if data['subscription_plan'] not in ['free', 'paid']:
        return jsonify({"error": "Subscription plan must be 'free' or 'paid'"}), 400
    
    user = g.current_user
    user.subscription_plan = data['subscription_plan']
    
    try:
        db.session.commit()
        return jsonify({
            "message": "Subscription updated successfully",
            "user": user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Subscription update failed. Please try again."}), 500