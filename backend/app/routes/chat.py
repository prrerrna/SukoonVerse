# chat.py: Defines the chat API endpoint for the Flask backend.
from flask import Blueprint, request, jsonify, current_app, session
from app.safety.prefilter import check_for_crisis
from app.llm.client_gemini import get_gemini_response, generate_short_title

chat_bp = Blueprint('chat_bp', __name__)

@chat_bp.route('/chat', methods=['POST'])
def chat():
    data = request.get_json(force=True, silent=True) or {}
    message = (data.get('message') or '').strip()
    chat_id = (data.get('chat_id') or 'default').strip() or 'default'

    if not message:
        return jsonify({"error": "message is required"}), 400

    # 1. Safety Prefilter (defense-in-depth)
    is_crisis, crisis_type = check_for_crisis(message)
    if is_crisis:
        # Immediately return crisis response without calling LLM
        return jsonify({
            "reply": "It sounds like you are going through a lot right now. It's important to talk to someone who can help. Here is a resource for you.",
            "mood": {"label": "distressed", "score": 2},
            "is_crisis": True,
            "suggested_intervention": "crisis_protocol",
            "resources": [{"title": "Emergency Helpline", "contact": "tel:9152987821", "type": "helpline"}]
        })

    # 2. Manage conversation history (per chat_id)
    hist_map = session.get('chat_histories', {})
    chat_history = hist_map.get(chat_id, [])

    # 2a. Explicit user memory (opt-in)
    user_memory = session.get('user_memory', [])  # list[str]
    lower_msg = message.lower()
    if lower_msg.startswith('remember:') or lower_msg.startswith('remember that'):
        # Extract memory content after ':' or after 'remember that'
        content = message
        if ':' in message:
            content = message.split(':', 1)[1]
        elif lower_msg.startswith('remember that'):
            content = message[len('remember that'):]
        mem = content.strip()
        if mem:
            # Deduplicate and cap memory size
            if mem not in user_memory:
                user_memory.append(mem)
                if len(user_memory) > 20:
                    user_memory = user_memory[-20:]
            session['user_memory'] = user_memory
            return jsonify({
                "reply": "Got it. I’ll remember that.",
                "mood": {"label": "ack", "score": 7},
                "is_crisis": False,
                "remembered": mem
            })
        else:
            return jsonify({
                "reply": "Please tell me what to remember, e.g., ‘remember: my best friend is Muskan’.",
                "mood": {"label": "neutral", "score": 5},
                "is_crisis": False
            })
    if lower_msg.startswith('forget all memory'):
        session['user_memory'] = []
        return jsonify({
            "reply": "Okay, I’ve cleared all remembered info.",
            "mood": {"label": "neutral", "score": 5},
            "is_crisis": False
        })
    if lower_msg.startswith('forget last memory'):
        if user_memory:
            removed = user_memory.pop()
            session['user_memory'] = user_memory
            return jsonify({
                "reply": f"Forgot: {removed}",
                "mood": {"label": "neutral", "score": 5},
                "is_crisis": False
            })
        return jsonify({
            "reply": "There’s nothing to forget.",
            "mood": {"label": "neutral", "score": 5},
            "is_crisis": False
        })

    # Add memory context (read-only) and current user message
    effective_history = []
    if user_memory:
        mem_text = "Persistent user memory (use discreetly):\n- " + "\n- ".join(user_memory)
        effective_history.append({"role": "user", "parts": [{"text": mem_text}]})
    # Append prior conversation
    effective_history.extend(chat_history)
    # Append new user message
    effective_history.append({"role": "user", "parts": [{"text": message}]})

    # 3. Route to Gemini client
    try:
        current_app.logger.debug(f"[chat] routing to Gemini client with history.")

        # Pass the entire history (with memory preface if present) to the client
        llm_response = get_gemini_response(effective_history)
        if not isinstance(llm_response, dict):
            llm_response = {
                "reply": "Thanks for sharing — I’m here. Would you like a quick grounding exercise?",
                "mood": {"label": "neutral", "score": 5},
                "is_crisis": False,
            }

        # Add the assistant's response to the history
        chat_history.append({"role": "user", "parts": [{"text": message}]})
        assistant_text = str(llm_response.get('reply', '') or '')
        chat_history.append({"role": "model", "parts": [{"text": assistant_text}]})

        # Keep the history from growing too large (e.g., last 10 messages)
        if len(chat_history) > 10:
            chat_history = chat_history[-10:]

        # Save the updated history back to the session map
        hist_map[chat_id] = chat_history
        session['chat_histories'] = hist_map

        # Log detected mood for analytics and debugging
        mood = llm_response.get('mood') if isinstance(llm_response, dict) else None
        if isinstance(mood, dict):
            current_app.logger.info(f"Mood detected: {mood.get('label')} ({mood.get('score')})")

        return jsonify(llm_response)

    except Exception as e:
        current_app.logger.exception("Error while generating LLM response")
        return jsonify({
            "reply": "Sorry, I'm having trouble responding right now. Please try again in a moment.",
            "mood": {"label": "error", "score": 0},
            "is_crisis": False
        }), 500


@chat_bp.route('/chat/title', methods=['POST'])
def chat_title():
    data = request.get_json(force=True, silent=True) or {}
    message = (data.get('message') or '').strip()
    if not message:
        return jsonify({"error": "message is required"}), 400

    # Optional safety prefilter: avoid generating titles for explicit crisis text, just return fallback hint
    is_crisis, _ = check_for_crisis(message)
    if is_crisis:
        # Let frontend fallback to heuristic
        return jsonify({"title": None, "note": "crisis_detected"})

    title = generate_short_title(message, max_words=5)
    if not title:
        return jsonify({"title": None}), 502
    return jsonify({"title": title})
