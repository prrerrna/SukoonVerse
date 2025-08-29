# chat.py: Defines the chat API endpoint for the Flask backend.
from flask import Blueprint, request, jsonify, current_app
from app.safety.prefilter import check_for_crisis
from app.llm.client_gemini import get_gemini_response

chat_bp = Blueprint('chat_bp', __name__)

@chat_bp.route('/chat', methods=['POST'])
def chat():
    # Compact, robust chat endpoint: validates input, runs safety prefilter,
    # routes to the chosen LLM backend, and returns a stable JSON shape.
    data = request.get_json(force=True, silent=True) or {}
    session_id = data.get('session_id')
    message = (data.get('message') or '').strip()
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

    # 2. Route to Gemini client
    try:
        current_app.logger.debug("[chat] routing to Gemini client")
        llm_reply, mood = get_gemini_response(message)

        final_response = {
            "reply": llm_reply,
            "mood": mood,
            "is_crisis": False,
            "suggested_intervention": "breathing_60s" 
        }
        return jsonify(final_response)

    except Exception as e:
        # Log internally but return a safe, user-friendly message
        current_app.logger.exception("Error while generating LLM response")
        return jsonify({
            "reply": "Sorry, I'm having trouble responding right now. Please try again in a moment.",
            "mood": {"label": "unknown", "score": 0},
            "is_crisis": False,
            "suggested_intervention": None
        }), 500
