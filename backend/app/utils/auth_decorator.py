# --- Utils: JWT Decorator ---
# app/utils/auth_decorator.py
from functools import wraps
from flask import request, jsonify, current_app, g
import jwt
from app.models.user import User

def jwt_required(f):
    """
    Decorator that checks if a valid JWT token is provided in the request headers.
    If a valid token is found, it sets the `g.current_user` attribute to the user
    instance associated with the token. If the token is invalid or missing,
    it returns a 401 error with a descriptive message.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        """
        Checks if a valid JWT token is provided in the request headers.
        If a valid token is found, it sets the `g.current_user` attribute to the user
        instance associated with the token. If the token is invalid or missing,
        it returns a 401 error with a descriptive message.
        """
        token = None
        if 'Authorization' in request.headers:
            bearer = request.headers['Authorization']
            token = bearer.replace("Bearer ", "")
        if not token:
            return jsonify({"error": "Token is missing"}), 401

        try:
            data = jwt.decode(token, current_app.config['JWT_SECRET'], algorithms=["HS256"])
            user = User.query.get(data['user_id'])
            if not user:
                raise Exception("User not found")
            g.current_user = user
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except Exception as e:
            return jsonify({"error": f"Invalid token: {str(e)}"}), 401

        return f(*args, **kwargs)
    return decorated_function