from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv()

# --- Initialize Extensions ---
db = SQLAlchemy()

# --- Application Factory ---
def create_app():
    app = Flask(__name__)
    CORS(app)

    # --- Configurations ---
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL", "sqlite:///avyna.db")
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # AI Configuration
    app.config['GEMINI_API_KEY'] = os.getenv("GEMINI_API_KEY")
    # app.config['OPENAI_API_KEY'] = os.getenv("OPENAI_API_KEY")  # Preserved OpenAI config (commented)
    
    # JWT Configuration
    app.config['JWT_SECRET'] = os.getenv("JWT_SECRET", "supersecret")
    
    # Cloudinary Configuration
    app.config['CLOUDINARY_CLOUD_NAME'] = os.getenv("CLOUDINARY_CLOUD_NAME")
    app.config['CLOUDINARY_API_KEY'] = os.getenv("CLOUDINARY_API_KEY")
    app.config['CLOUDINARY_API_SECRET'] = os.getenv("CLOUDINARY_API_SECRET")
    
    # File upload configuration
    app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB max file size

    # --- Initialize extensions ---
    db.init_app(app)

    # --- Register blueprints ---
    from app.routes.auth import auth_bp
    from app.routes.symptoms import symptoms_bp
    from app.routes.recommendations import recommendations_bp
    from app.routes.profile import profile_bp
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(symptoms_bp, url_prefix="/api/symptoms")
    app.register_blueprint(recommendations_bp, url_prefix="/api/recommendations")
    app.register_blueprint(profile_bp, url_prefix="/api/profile")
    
    # --- Global Error Handlers ---
    @app.errorhandler(400)
    def bad_request(error):
        response = {
            "error": "Bad Request",
            "message": str(error.description) if hasattr(error, 'description') else str(error)
        }
        return response, 400

    @app.errorhandler(404)
    def not_found(error):
        response = {
            "error": "Not Found",
            "message": str(error)
        }
        return response, 404

    @app.errorhandler(500)
    def internal_error(error):
        response = {
            "error": "Internal Server Error",
            "message": str(error)
        }
        return response, 500

    @app.errorhandler(Exception)
    def handle_exception(error):
        code = 500
        if hasattr(error, 'code'):
            code = error.code
        response = {
            "error": str(error)
        }
        return response, code

    # --- Create database tables if not exist ---
    with app.app_context():
        from app.models import user, symptom_log, ai_recommendation
        db.create_all()

    return app