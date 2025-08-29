# chat.py: Defines the chat API endpoint for the Flask backend.
from flask import Blueprint, request, jsonify, current_app, session
from app.safety.prefilter import check_for_crisis
from app.llm.client_gemini import get_gemini_response

chat_bp = Blueprint('chat_bp', __name__)

@chat_bp.route('/chat', methods=['POST'])
def chat():
    data = request.get_json(force=True, silent=True) or {}
    message = (data.get('message') or '').strip()

    if not message:
        return jsonify({"error": "message is required"}), 400

    # 1. Safety Prefilter (defense-in-depth)
    is_crisis, crisis_type = check_for_crisis(message)
    if is_crisis:
        # Immediately return crisis response without calling LLM
        return jsonify({
            "reply": "It sounds like you are going through a lot right now. It's important to talk to someone who can help. Here is a resource for you.",
            "mood": {"label": "distressed", "score": 10},
            "is_crisis": True,
            "suggested_intervention": "crisis_protocol",
            "resources": [{"title": "Emergency Helpline", "contact": "tel:9152987821", "type": "helpline"}]
        })

    # 2. Manage conversation history
    # Retrieve history from session, defaulting to an empty list
    chat_history = session.get('chat_history', [])
    
    # Add the new user message to the history
    chat_history.append({"role": "user", "parts": [{"text": message}]})

    # 3. Route to Gemini client
    try:
        current_app.logger.debug(f"[chat] routing to Gemini client with history.")
        
        # Pass the entire history to the client
        llm_response = get_gemini_response(chat_history)
        
        # Add the assistant's response to the history
        chat_history.append({"role": "model", "parts": [{"text": llm_response.get('reply', '')}]})

        # Keep the history from growing too large (e.g., last 10 messages)
        if len(chat_history) > 10:
            chat_history = chat_history[-10:]
        
        # Save the updated history back to the session
        session['chat_history'] = chat_history

        return jsonify(llm_response)

    except Exception as e:
        current_app.logger.exception("Error while generating LLM response")
        return jsonify({
            "reply": "Sorry, I'm having trouble responding right now. Please try again in a moment.",
            "mood": {"label": "error", "score": 0},
            "is_crisis": False
        }), 500
