"""
auth.py: Firebase authentication middleware for the Flask application.

This module provides functions to verify Firebase ID tokens and
protect API routes that require authentication.
"""

import os
from functools import wraps
from flask import request, jsonify, g
from firebase_admin import auth

SKIP_AUTH = os.environ.get('SKIP_FIREBASE_AUTH', '').lower() in ('1', 'true', 'yes')

# Firebase Admin initialization is handled centrally in app.db.initialize_firebase()

def verify_firebase_token():
    """
    Middleware function to verify Firebase ID token from Authorization header.
    Adds the decoded token to Flask's g object for route handlers to access.
    
    Returns None if verification succeeds, or a tuple (response, status_code) on failure.
    """
    # If dev bypass is enabled, set a test user and skip verification
    if SKIP_AUTH:
        g.user_id = os.environ.get('DEV_USER_ID', 'dev-user-1')
        g.user_email = os.environ.get('DEV_USER_EMAIL', 'dev@example.com')
        g.user_name = os.environ.get('DEV_USER_NAME', 'Dev User')
        return None

    # Get token from Authorization header
    auth_header = request.headers.get('Authorization', '')

    if not auth_header.startswith('Bearer '):
        return jsonify({"error": "Missing or invalid Authorization header"}), 401

    token = auth_header.split('Bearer ')[1]

    try:
        # Verify the token
        decoded_token = auth.verify_id_token(token)

        # Store user info in Flask's g object
        g.user_id = decoded_token['uid']
        g.user_email = decoded_token.get('email', '')
        g.user_name = decoded_token.get('name', '')

        # Continue to the route handler
        return None
    except Exception as e:
        print(f"Token verification failed: {str(e)}")
        return jsonify({"error": f"Invalid token: {str(e)}"}), 401

def auth_required(f):
    """
    Decorator for routes that require authentication.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        result = verify_firebase_token()
        if result is not None:
            return result
        return f(*args, **kwargs)
    return decorated_function

def verify_token(f):
    """
    Decorator to verify Firebase ID token for securing API endpoints.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Dev bypass
        if SKIP_AUTH:
            decoded_token = {
                'uid': os.environ.get('DEV_USER_ID', 'dev-user-1'),
                'email': os.environ.get('DEV_USER_EMAIL', 'dev@example.com'),
                'name': os.environ.get('DEV_USER_NAME', 'Dev User'),
            }
            return f(decoded_token, *args, **kwargs)

        token = None
        if 'Authorization' in request.headers:
            parts = request.headers['Authorization'].split(' ')
            if len(parts) == 2 and parts[0] == 'Bearer':
                token = parts[1]

        if not token:
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            decoded_token = auth.verify_id_token(token)
        except Exception as e:
            return jsonify({'message': 'Token is invalid!', 'error': str(e)}), 401

        return f(decoded_token, *args, **kwargs)

    return decorated_function