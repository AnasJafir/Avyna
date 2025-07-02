# app/utils/cloudinary_utils.py
import cloudinary
import cloudinary.uploader
import cloudinary.api
from flask import current_app
import os
from werkzeug.utils import secure_filename
import base64
import io
from PIL import Image

def configure_cloudinary():
    """Configure Cloudinary with environment variables"""
    cloudinary.config(
        cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
        api_key=os.getenv('CLOUDINARY_API_KEY'),
        api_secret=os.getenv('CLOUDINARY_API_SECRET'),
        secure=True
    )

def upload_profile_picture(file_data, user_id):
    """
    Upload profile picture to Cloudinary
    
    Args:
        file_data: Either file object or base64 string
        user_id: User ID for unique naming
        
    Returns:
        dict: Contains 'url' and 'public_id' or 'error'
    """
    try:
        configure_cloudinary()
        
        # Create a unique public_id based on user_id
        public_id = f"user_{user_id}"
        
        # Upload options
        upload_options = {
            'public_id': public_id,
            'overwrite': True,  # Replace existing image
            'resource_type': 'image',
            'transformation': [
                {'width': 300, 'height': 300, 'crop': 'fill', 'gravity': 'face'},
                {'quality': 'auto:good'},
                {'format': 'jpg'}
            ],
            'folder': 'avyna/profile_pictures'
        }
        
        # Handle different input types
        if isinstance(file_data, str):
            # Handle base64 string
            if file_data.startswith('data:image'):
                # Remove data:image/jpeg;base64, prefix
                file_data = file_data.split(',')[1]
            
            # Decode base64
            image_data = base64.b64decode(file_data)
            
            # Upload from base64
            result = cloudinary.uploader.upload(
                f"data:image/jpg;base64,{base64.b64encode(image_data).decode()}",
                **upload_options
            )
        else:
            # Handle file object
            result = cloudinary.uploader.upload(file_data, **upload_options)
        
        return {
            'url': result['secure_url'],
            'public_id': result['public_id']
        }
        
    except Exception as e:
        print(f"Cloudinary upload error: {str(e)}")
        return {'error': f'Image upload failed: {str(e)}'}

def delete_profile_picture(public_id):
    """
    Delete profile picture from Cloudinary
    
    Args:
        public_id: Cloudinary public_id of the image
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        configure_cloudinary()
        result = cloudinary.uploader.destroy(public_id)
        return result.get('result') == 'ok'
    except Exception as e:
        print(f"Cloudinary delete error: {str(e)}")
        return False

def validate_image_file(file):
    """
    Validate uploaded image file
    
    Args:
        file: Uploaded file object
        
    Returns:
        dict: Contains 'valid' boolean and 'error' message if invalid
    """
    if not file:
        return {'valid': False, 'error': 'No file provided'}
    
    if not file.filename:
        return {'valid': False, 'error': 'No file selected'}
    
    # Check file extension first
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    filename = secure_filename(file.filename.lower())
    
    if '.' not in filename:
        return {'valid': False, 'error': 'Invalid file type. Only PNG, JPG, JPEG, GIF, and WebP are allowed'}
    
    file_extension = filename.rsplit('.', 1)[1].lower()
    if file_extension not in allowed_extensions:
        return {'valid': False, 'error': 'Invalid file type. Only PNG, JPG, JPEG, GIF, and WebP are allowed'}
    
    # Check file size (max 5MB)
    file.seek(0, 2)  # Seek to end
    file_size = file.tell()
    file.seek(0)  # Reset to beginning
    
    if file_size > 5 * 1024 * 1024:  # 5MB limit
        return {'valid': False, 'error': 'File size must be less than 5MB'}
    
    if file_size == 0:
        return {'valid': False, 'error': 'File is empty'}
    
    try:
        # Try to open with PIL to verify it's a valid image
        image = Image.open(file)
        image.verify()
        file.seek(0)  # Reset file pointer after verification
        return {'valid': True}
    except Exception as e:
        return {'valid': False, 'error': 'Invalid image file or corrupted file'}

def validate_base64_image(base64_string):
    """
    Validate base64 image string
    
    Args:
        base64_string: Base64 encoded image string
        
    Returns:
        dict: Contains 'valid' boolean and 'error' message if invalid
    """
    try:
        # Remove data URL prefix if present
        if base64_string.startswith('data:image'):
            base64_string = base64_string.split(',')[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_string)
        
        # Check size (max 5MB)
        if len(image_data) > 5 * 1024 * 1024:
            return {'valid': False, 'error': 'Image size must be less than 5MB'}
        
        # Try to open with PIL
        image = Image.open(io.BytesIO(image_data))
        image.verify()
        
        return {'valid': True}
        
    except Exception as e:
        return {'valid': False, 'error': 'Invalid base64 image data'}