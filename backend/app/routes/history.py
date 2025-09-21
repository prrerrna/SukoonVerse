import os
from flask import Blueprint, request, jsonify
from app.auth import verify_token
from app.db import get_db
from firebase_admin import firestore
import logging

history_bp = Blueprint('history_bp', __name__)
SKIP_AUTH = os.environ.get('SKIP_FIREBASE_AUTH', '').lower() in ('1', 'true', 'yes')

@history_bp.route('/history/session', methods=['POST'])
@verify_token
def create_chat_session(decoded_token):
    """
    Creates a new chat session in Firestore.
    """
    if SKIP_AUTH:
        return jsonify({'sessionId': 'dev-session'}), 201
    db = get_db()
    user_id = decoded_token['uid']
    data = request.get_json()
    title = data.get('title', 'New Chat')

    try:
        # Add a new document with a generated ID
        session_ref = db.collection('users').document(user_id).collection('sessions').document()
        session_ref.set({
            'title': title,
            'createdAt': firestore.SERVER_TIMESTAMP
        })
        return jsonify({'sessionId': session_ref.id}), 201
    except Exception as e:
        logging.exception("Error creating chat session in Firestore")
        return jsonify({'error': str(e)}), 500

@history_bp.route('/history/sessions', methods=['GET'])
@verify_token
def get_chat_sessions(decoded_token):
    """
    Retrieves all chat sessions for the logged-in user.
    """
    if SKIP_AUTH:
        return jsonify([]), 200
    db = get_db()
    user_id = decoded_token['uid']
    try:
        sessions_ref = db.collection('users').document(user_id).collection('sessions').stream()
        sessions = []
        for session in sessions_ref:
            session_data = session.to_dict()
            # Convert timestamp to ISO 8601 string format
            if 'createdAt' in session_data and hasattr(session_data['createdAt'], 'isoformat'):
                session_data['createdAt'] = session_data['createdAt'].isoformat()
            sessions.append({'id': session.id, **session_data})
        return jsonify(sessions), 200
    except Exception as e:
        logging.exception("Error retrieving chat sessions from Firestore")
        return jsonify({'error': str(e)}), 500

@history_bp.route('/history/messages/<session_id>', methods=['GET'])
@verify_token
def get_messages(decoded_token, session_id):
    """
    Retrieves all messages for a specific chat session.
    """
    if SKIP_AUTH:
        return jsonify([]), 200
    db = get_db()
    user_id = decoded_token['uid']
    try:
        messages_ref = db.collection('users').document(user_id).collection('sessions').document(session_id).collection('messages').order_by('timestamp').stream()
        messages = []
        for msg in messages_ref:
            msg_data = msg.to_dict()
            if 'timestamp' in msg_data and hasattr(msg_data['timestamp'], 'isoformat'):
                msg_data['timestamp'] = msg_data['timestamp'].isoformat()
            messages.append({'id': msg.id, **msg_data})
        return jsonify(messages), 200
    except Exception as e:
        logging.exception("Error retrieving messages from Firestore")
        return jsonify({'error': str(e)}), 500

@history_bp.route('/history/sessions/<session_id>', methods=['DELETE'])
@verify_token
def delete_chat_session(decoded_token, session_id):
    """
    Deletes a specific chat session and all its messages.
    """
    if SKIP_AUTH:
        return jsonify({"success": True, "message": "Chat session deleted successfully (dev)"}), 200
    db = get_db()
    user_id = decoded_token['uid']
    
    try:
        # Get reference to the session
        session_ref = db.collection('users').document(user_id).collection('sessions').document(session_id)
        
        # Delete all messages in the session (subcollection)
        messages_ref = session_ref.collection('messages').stream()
        for message in messages_ref:
            message.reference.delete()
        
        # Delete the session document itself
        session_ref.delete()
        
        return jsonify({"success": True, "message": "Chat session deleted successfully"}), 200
    except Exception as e:
        logging.exception(f"Error deleting chat session {session_id}")
        return jsonify({'error': str(e)}), 500
