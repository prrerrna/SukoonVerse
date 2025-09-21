"""
user_routes.py: Routes for user authentication and profile management.

This module defines API endpoints for user registration, login, and profile management.
Uses Firestore for storing user details.
"""

import json
from datetime import datetime
from flask import Blueprint, request, jsonify, g
from app.auth import verify_token
from app.db import get_db

# User blueprint for auth and profile management
user_bp = Blueprint('user', __name__)

@user_bp.route('/register', methods=['POST'])
@user_bp.route('/user/register', methods=['POST'])
@verify_token
def register_user(decoded_token):
    """
    Register a new user after Firebase authentication.
    This creates a user record in Firestore linked to the Firebase UID.
    """
    data = request.json
    if not data:
        return jsonify({"error": "Missing request data"}), 400
    
    # Get user info from Firebase token (stored by verify_token decorator)
    firebase_uid = decoded_token['uid']
    email = decoded_token.get('email')
    
    # Check if a profile was provided
    profile = data.get('profile', {})
    name = profile.get('name', '') or email.split('@')[0] if email else ''
    preferred_name = profile.get('preferredName', '')
    mobile = profile.get('mobile', '')
    region = profile.get('region', '')
    language = profile.get('language', 'en')
    session_id = data.get('session_id', '')
    
    # Get Firestore instance
    db = get_db()
    user_ref = db.collection('userinfo').document(firebase_uid)
    
    # Check if user already exists in Firestore
    user_doc = user_ref.get()
    if user_doc.exists:
        return jsonify({"error": "User already registered"}), 409

    # Create new user in Firestore
    now = datetime.now().isoformat()
    user_data = {
        'firebase_uid': firebase_uid,
        'session_id': session_id,
        'email': email,
        'name': name,
        'mobile': mobile,
        'preferred_name': preferred_name,
        'region': region,
        'language': language,
        'created_at': now,
        'updated_at': now,
    }
    
    user_ref.set(user_data)
    
    # Return user profile
    return jsonify({
        "message": "User registered successfully",
        "profile": {
            "name": name,
            "mobile": mobile,
            "preferredName": preferred_name,
            "region": region,
            "language": language
        }
    })

@user_bp.route('/profile', methods=['GET'])
@user_bp.route('/user/profile', methods=['GET'])
@verify_token
def get_profile(decoded_token):
    """
    Get the user's profile from Firestore.
    """
    firebase_uid = decoded_token['uid']
    
    # Get Firestore instance
    db = get_db()
    user_ref = db.collection('userinfo').document(firebase_uid)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        return jsonify({"error": "User not found"}), 404

    user_data = user_doc.to_dict()
    return jsonify({
        "profile": {
            "name": user_data.get('name'),
            "mobile": user_data.get('mobile'),
            "preferredName": user_data.get('preferred_name'),
            "region": user_data.get('region'),
            "language": user_data.get('language'),
            "dob": user_data.get('dob')
        }
    })

@user_bp.route('/profile', methods=['POST'])
@user_bp.route('/user/profile', methods=['POST'])
@verify_token
def update_profile(decoded_token):
    """
    Update the user's profile in Firestore.
    """
    data = request.json
    if not data or 'profile' not in data:
        return jsonify({"error": "Missing profile data"}), 400

    firebase_uid = decoded_token['uid']
    profile = data['profile']
    
    print(f"Updating profile for user {firebase_uid}")
    print(f"Profile data received: {profile}")
    
    # Get Firestore instance
    db = get_db()
    user_ref = db.collection('userinfo').document(firebase_uid)
    user_doc = user_ref.get()
    
    now = datetime.now().isoformat()
    if not user_doc.exists:
        # Create new user document
        user_data = {
            'firebase_uid': firebase_uid,
            'email': g.user_email if hasattr(g, 'user_email') else '',
            'name': profile.get('name', ''),
            'mobile': profile.get('mobile', ''),
            'dob': profile.get('dob', ''),
            'preferred_name': profile.get('preferredName', ''),
            'region': profile.get('region', ''),
            'language': profile.get('language', 'en'),
            'created_at': now,
            'updated_at': now,
        }
        print(f"Creating new user document in userinfo collection: {user_data}")
        user_ref.set(user_data)
        print(f"Document created successfully")
    else:
        # Get existing user data
        user_data = user_doc.to_dict()
        
        # Update with new values or keep existing ones
        update_data = {
            'name': profile.get('name', user_data.get('name', '')),
            'mobile': profile.get('mobile', user_data.get('mobile', '')),
            'dob': profile.get('dob', user_data.get('dob', '')),
            'preferred_name': profile.get('preferredName', user_data.get('preferred_name', '')),
            'region': profile.get('region', user_data.get('region', '')),
            'language': profile.get('language', user_data.get('language', 'en')),
            'updated_at': now
        }
        
        print(f"Updating existing user document: {update_data}")
        # Update document
        user_ref.update(update_data)
        print(f"Document updated successfully")
        
        # Get the updated data for response
        user_data.update(update_data)

    return jsonify({
        "message": "Profile updated successfully",
        "profile": {
            "name": profile.get('name', user_data.get('name', '')),
            "mobile": profile.get('mobile', user_data.get('mobile', '')),
            "dob": profile.get('dob', user_data.get('dob', '')),
            "preferredName": profile.get('preferredName', user_data.get('preferred_name', '')),
            "region": profile.get('region', user_data.get('region', '')),
            "language": profile.get('language', user_data.get('language', 'en'))
        }
    })