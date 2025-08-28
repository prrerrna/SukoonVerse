# flag.py: Defines the crisis flag API endpoint for the Flask backend.
from flask import Blueprint, request, jsonify
import hashlib
import time

flag_bp = Blueprint('flag_bp', __name__)

@flag_bp.route('/flag', methods=['POST'])
def flag_crisis():
    # This is a route handler, which is a required function by Flask.
    # All logic is inline as requested.
    data = request.get_json()
    session_id = data.get('session_id')
    flag_type = data.get('flag_type')
    hashed_context = data.get('hashed_context')

    if not all([session_id, flag_type, hashed_context]):
        return jsonify({"error": "session_id, flag_type, and hashed_context are required"}), 400

    # In a real application, this is where you would log the anonymized flag
    # to a secure database for monitoring and analysis.
    # For this scaffold, we just print it to the console.
    
    log_entry = {
        "timestamp": time.time(),
        "session_id_hashed": hashlib.sha256(session_id.encode()).hexdigest(),
        "flag_type": flag_type,
        "hashed_context": hashed_context
    }
    
    print(f"CRISIS FLAG LOGGED: {log_entry}")

    return jsonify({"ok": True})
