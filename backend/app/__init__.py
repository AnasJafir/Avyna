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
    """
    Application factory.

    This function creates a Flask application, initializes the database connection,
    sets up CORS, and registers the blueprints for the API endpoints.

    Returns:
        app: A Flask application instance.
    """
    app = Flask(__name__)
    CORS(app)

    # --- Configurations ---
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL", "sqlite:///avyna.db")
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    #app.config['OPENAI_API_KEY'] = os.getenv("OPENAI_API_KEY")
    app.config['GEMINI_API_KEY'] = os.getenv("GEMINI_API_KEY")
    app.config['JWT_SECRET'] = os.getenv("JWT_SECRET", "supersecret")

    # --- Initialize extensions ---
    db.init_app(app)

    # --- Register blueprints ---
    from app.routes.auth import auth_bp
    from app.routes.symptoms import symptoms_bp
    from app.routes.recommendations import recommendations_bp
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(symptoms_bp, url_prefix="/api/symptoms")
    app.register_blueprint(recommendations_bp, url_prefix="/api/recommendations")

    # --- Create database tables if not exist ---
    with app.app_context():
        from app.models import user, symptom_log, ai_recommendation
        db.create_all()

    return app