# --- Routes: Profile ---
# app/routes/profile.py (Optional separate file for better organization)
from flask import Blueprint, request, jsonify, g
from werkzeug.security import generate_password_hash, check_password_hash
from app import db
from app.models.user import User
from app.utils.auth_decorator import jwt_required
from app.utils.cloudinary_utils import (
    upload_profile_picture, 
    delete_profile_picture, 
    validate_image_file, 
    validate_base64_image
)

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


@profile_bp.route('/debug-upload', methods=['POST'])
@jwt_required
def debug_upload():
    """Debug endpoint to check request format"""
    print(f"DEBUG: Content-Type: {request.content_type}")
    print(f"DEBUG: Headers: {dict(request.headers)}")
    print(f"DEBUG: Files: {list(request.files.keys())}")
    
    if request.files:
        for key, file in request.files.items():
            print(f"DEBUG: File key: {key}, filename: {file.filename}, content_type: {file.content_type}")
    
    if request.json:
        print(f"DEBUG: JSON data: {request.json}")
    
    return jsonify({
        "content_type": request.content_type,
        "files": list(request.files.keys()),
        "has_json": request.json is not None
    }), 200


@profile_bp.route('/upload-picture', methods=['POST'])
@jwt_required
def upload_profile_picture_route():
    """Upload or update user's profile picture"""
    user = g.current_user
    
    try:
        # Check if request contains multipart file or JSON with base64
        if request.files:
            # Handle file upload (check for files directly instead of content-type)
            print(f"DEBUG: Handling file upload for user {user.id}")
            
            if 'profile_picture' not in request.files:
                print("DEBUG: No 'profile_picture' key in request.files")
                return jsonify({"error": "No file provided"}), 400
            
            file = request.files['profile_picture']
            print(f"DEBUG: File received - filename: {file.filename}, content_type: {file.content_type}")
            
            if file.filename == '':
                print("DEBUG: Empty filename")
                return jsonify({"error": "No file selected"}), 400
            
            # Validate file
            validation = validate_image_file(file)
            print(f"DEBUG: Validation result: {validation}")
            
            if not validation['valid']:
                print(f"DEBUG: File validation failed: {validation['error']}")
                return jsonify({"error": validation['error']}), 400
            
            # Upload to Cloudinary
            print("DEBUG: Starting Cloudinary upload...")
            upload_result = upload_profile_picture(file, user.id)
            print(f"DEBUG: Cloudinary upload result: {upload_result}")
            
        else:
            # Handle JSON with base64 image
            print(f"DEBUG: Handling base64 upload for user {user.id}")
            data = request.get_json()
            
            if not data or 'image' not in data:
                return jsonify({"error": "No image data provided"}), 400
            
            # Validate base64 image
            validation = validate_base64_image(data['image'])
            print(f"DEBUG: Base64 validation result: {validation}")
            
            if not validation['valid']:
                return jsonify({"error": validation['error']}), 400
            
            # Upload to Cloudinary
            upload_result = upload_profile_picture(data['image'], user.id)
        
        # Check for upload errors
        if 'error' in upload_result:
            print(f"DEBUG: Upload error: {upload_result['error']}")
            return jsonify({"error": upload_result['error']}), 500
        
        # Delete old profile picture if exists
        if user.profile_picture_public_id:
            print(f"DEBUG: Deleting old picture: {user.profile_picture_public_id}")
            delete_profile_picture(user.profile_picture_public_id)
        
        # Update user record
        try:
            user.profile_picture_url = upload_result['url']
            user.profile_picture_public_id = upload_result['public_id']
            db.session.commit()
            print(f"DEBUG: Database updated successfully")
            
            return jsonify({
                "message": "Profile picture updated successfully",
                "profile_picture_url": upload_result['url'],
                "user": user.to_dict()
            }), 200
            
        except Exception as e:
            print(f"DEBUG: Database update error: {str(e)}")
            db.session.rollback()
            # Try to delete the uploaded image since database update failed
            delete_profile_picture(upload_result['public_id'])
            return jsonify({"error": "Failed to update profile picture. Please try again."}), 500
    
    except Exception as e:
        print(f"DEBUG: Unexpected error in upload_profile_picture_route: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500


@profile_bp.route('/delete-picture', methods=['DELETE'])
@jwt_required
def delete_profile_picture_route():
    """Delete user's profile picture"""
    user = g.current_user
    
    if not user.profile_picture_public_id:
        return jsonify({"error": "No profile picture to delete"}), 400
    
    # Delete from Cloudinary
    if delete_profile_picture(user.profile_picture_public_id):
        try:
            # Update user record
            user.profile_picture_url = None
            user.profile_picture_public_id = None
            db.session.commit()
            
            return jsonify({
                "message": "Profile picture deleted successfully",
                "user": user.to_dict()
            }), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "Failed to delete profile picture. Please try again."}), 500
    else:
        return jsonify({"error": "Failed to delete profile picture from cloud storage"}), 500


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