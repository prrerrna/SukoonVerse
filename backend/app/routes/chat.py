# chat.py: Defines the chat API endpoint for the Flask backend.
from flask import Blueprint, request, jsonify, current_app, session
from app.safety.prefilter import check_for_crisis
from app.llm.client_gemini import get_gemini_response, generate_short_title
from app.auth import verify_token
from app.db import get_db
from firebase_admin import firestore
from datetime import datetime

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

    # 2. Manage conversation history (per chat_id) - FOR GUESTS ONLY
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

        # Log detected mood for analytics and debugging
        mood = llm_response.get('mood') if isinstance(llm_response, dict) else None
        if isinstance(mood, dict):
            current_app.logger.info(f"Mood detected: {mood.get('label')} ({mood.get('score')})")
            
            # Store mood entry in session history
            if 'mood_history' not in session:
                session['mood_history'] = []
            
            # Add to mood history with timestamp and message
            mood_entry = {
                "timestamp": datetime.now().isoformat(),
                "label": mood.get('label', 'neutral'),
                "score": mood.get('score', 5),
                "source": "chat",
                "message": message  # Store the user message that triggered this mood detection
            }
            
            # Add to session mood history
            session['mood_history'] = session.get('mood_history', [])[-9:] + [mood_entry]

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


@chat_bp.route('/chat/new', methods=['POST'])
@verify_token
def create_new_chat(decoded_token):
    """
    Creates a new chat session and processes the first message in one call.
    This endpoint handles:
    1. Creating a new chat session in Firestore
    2. Generating a title based on the first message
    3. Getting an AI response to the message
    4. Saving both messages to the session
    5. Returning the sessionId, title, and initialResponse
    """
    db = get_db()
    user_id = decoded_token['uid']
    data = request.get_json()
    message_text = data.get('message', '')

    if not message_text:
        return jsonify({"error": "message is required"}), 400

    try:
        # 1. Create a new chat session with a temporary title
        session_ref = db.collection('users').document(user_id).collection('sessions').document()
        temp_title = "New Chat"
        session_ref.set({
            'title': temp_title,
            'createdAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP
        })
        session_id = session_ref.id

        # 2. Save the user's message
        user_message_ref = db.collection('users').document(user_id).collection('sessions').document(session_id).collection('messages').document()
        user_message_ref.set({
            'author': 'user',
            'text': message_text,
            'timestamp': firestore.SERVER_TIMESTAMP
        })

        # 3. Generate a response with the Gemini model
        chat_history = [{"role": "user", "parts": [{"text": message_text}]}]
        llm_response = get_gemini_response(chat_history)
        
        # 4. Save the model's response
        bot_message_ref = db.collection('users').document(user_id).collection('sessions').document(session_id).collection('messages').document()
        bot_message_ref.set({
            'author': 'bot',
            'text': llm_response.get('reply', ''),
            'timestamp': firestore.SERVER_TIMESTAMP
        })
        
        # Process and save mood data from first message if available
        mood = llm_response.get('mood') if isinstance(llm_response, dict) else None
        if isinstance(mood, dict) and 'label' in mood and 'score' in mood:
            try:
                # Save mood to Firestore
                mood_ref = db.collection('users').document(user_id).collection('moods').document()
                mood_ref.set({
                    'label': mood.get('label', 'neutral'),
                    'score': mood.get('score', 5),
                    'timestamp': firestore.SERVER_TIMESTAMP,
                    'source': 'chat',
                    'message': message_text,
                    'sessionId': session_id
                })
                current_app.logger.info(f"Saved mood entry from initial message to Firestore for user {user_id}")
            except Exception as e:
                current_app.logger.error(f"Error saving initial mood entry to Firestore: {str(e)}")
        else:
            current_app.logger.debug("No valid mood data in initial LLM response")

        # 5. Generate a title based on the first message
        title = generate_short_title(message_text, max_words=5)
        if not title:
            title = temp_title
        
        # 6. Update the session with the generated title
        session_ref.update({
            'title': title
        })

        # 7. Return the new session details and initial response
        return jsonify({
            'sessionId': session_id,
            'title': title,
            'initialResponse': llm_response.get('reply', '')
        }), 201

    except Exception as e:
        current_app.logger.exception("Error in create_new_chat")
        return jsonify({"error": str(e)}), 500


@chat_bp.route('/chat/<session_id>', methods=['POST'])
@verify_token
def add_message_to_session(decoded_token, session_id):
    db = get_db()
    """
    Adds a message to an existing chat session and gets a response from the LLM.
    """
    user_id = decoded_token['uid']
    data = request.get_json()
    message_text = data.get('message', '')

    if not message_text:
        return jsonify({"error": "message is required"}), 400

    try:
        # Save user message to Firestore
        user_message_ref = db.collection('users').document(user_id).collection('sessions').document(session_id).collection('messages').document()
        user_message_ref.set({
            'author': 'user',
            'text': message_text,
            'timestamp': firestore.SERVER_TIMESTAMP
        })

        # Get chat history from Firestore to provide context to the LLM
        messages_ref = db.collection('users').document(user_id).collection('sessions').document(session_id).collection('messages').order_by('timestamp').stream()
        
        # Convert Firestore messages to the format expected by the Gemini client
        chat_history = []
        for msg in messages_ref:
            msg_data = msg.to_dict()
            role = 'user' if msg_data.get('author') == 'user' else 'model'
            chat_history.append({
                'role': role,
                'parts': [{'text': msg_data.get('text', '')}]
            })

        # Get response from LLM
        # The user's new message is already in chat_history from the loop above
        llm_response = get_gemini_response(chat_history)

        # Save bot message to Firestore
        bot_message_ref = db.collection('users').document(user_id).collection('sessions').document(session_id).collection('messages').document()
        bot_message_ref.set({
            'author': 'bot',
            'text': llm_response.get('reply', ''),
            'timestamp': firestore.SERVER_TIMESTAMP
        })
        
        # Process and save mood data if available
        mood = llm_response.get('mood') if isinstance(llm_response, dict) else None
        if isinstance(mood, dict) and 'label' in mood and 'score' in mood:
            try:
                # Save mood to Firestore
                mood_ref = db.collection('users').document(user_id).collection('moods').document()
                mood_ref.set({
                    'label': mood.get('label', 'neutral'),
                    'score': mood.get('score', 5),
                    'timestamp': firestore.SERVER_TIMESTAMP,
                    'source': 'chat',
                    'message': message_text,
                    'sessionId': session_id
                })
                current_app.logger.info(f"Saved mood entry from chat to Firestore for user {user_id}")
            except Exception as e:
                current_app.logger.error(f"Error saving mood entry to Firestore: {str(e)}")
        else:
            current_app.logger.debug("No valid mood data in LLM response")

        return jsonify(llm_response)

    except Exception as e:
        current_app.logger.exception("Error in chat operation")
        return jsonify({"error": str(e)}), 500
