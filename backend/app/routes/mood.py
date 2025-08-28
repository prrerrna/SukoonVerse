# mood.py: Defines the mood API endpoint for the Flask backend.
from flask import Blueprint, request, jsonify

mood_bp = Blueprint('mood_bp', __name__)

@mood_bp.route('/mood', methods=['POST'])
def mood():
    # This is a route handler, which is a required function by Flask.
    # All logic is inline as requested.
    data = request.get_json()
    message = data.get('message', '')

    if not message:
        return jsonify({"error": "message is required"}), 400

    # In a real implementation, this would use a smaller, faster model
    # or a keyword-based classifier to extract mood.
    # Here, we are just providing a stubbed response.
    
    # Simple keyword-based logic for stub
    if 'sad' in message.lower() or 'unhappy' in message.lower():
        label = "sad"
        score = 3
    elif 'happy' in message.lower() or 'joy' in message.lower():
        label = "happy"
        score = 8
    elif 'anxious' in message.lower() or 'worried' in message.lower():
        label = "anxious"
        score = 6
    else:
        label = "neutral"
        score = 5
        
    response_data = {
        "label": label,
        "score": score
    }

    return jsonify(response_data)
