# chat.py: Defines the chat API endpoint for the Flask backend.
import os
from flask import Blueprint, request, jsonify
from app.safety.prefilter import check_for_crisis
from app.llm.client_local import get_local_llm_response
from app.llm.client_gemini import get_gemini_response

chat_bp = Blueprint('chat_bp', __name__)

@chat_bp.route('/chat', methods=['POST'])
def chat():
    # This is a route handler, which is a required function by Flask.
    # All logic is inline as requested.
    data = request.get_json()
    session_id = data.get('session_id')
    message = data.get('message', '').strip()
    lang_hint = data.get('lang_hint', 'en')

    if not session_id or not message:
        return jsonify({"error": "session_id and message are required"}), 400

    # 1. Safety Prefilter
    is_crisis, crisis_type = check_for_crisis(message)
    if is_crisis:
        # Immediately return crisis response without calling LLM
        response_data = {
            "reply": "It sounds like you are going through a lot right now. It's important to talk to someone who can help. Here is a resource for you.",
            "mood": {"label": "distressed", "score": 10},
            "is_crisis": True,
            "suggested_intervention": "crisis_protocol"
        }
        return jsonify(response_data)

    # 2. Call LLM based on environment configuration
    llm_choice = os.environ.get('BACKEND_LLM', 'local')
    
    if llm_choice == 'gemini':
        # Placeholder for Gemini client call
        llm_reply, mood = get_gemini_response(message)
    else:
        # Default to local stubbed client
        llm_reply, mood = get_local_llm_response(message)

    # 3. Postprocess and formulate final response
    final_response = {
        "reply": llm_reply,
        "mood": mood,
        "is_crisis": False,
        "suggested_intervention": "breathing_60s" # Example suggestion
    }

    return jsonify(final_response)
