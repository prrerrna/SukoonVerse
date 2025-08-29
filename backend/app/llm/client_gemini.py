# client_gemini.py: Provides a client for the Google Gemini API.
import os
import json
import re
import sys
import google.generativeai as genai

def get_gemini_response(chat_history: list):
    """
    Generates a response from the Gemini API using conversation history.

    Args:
        chat_history: A list of messages in the conversation.

    Returns:
        A dictionary containing the parsed JSON response from the model,
        or a fallback dictionary if an error occurs.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {
            "reply": "Gemini not configured. Please set GEMINI_API_KEY.",
            "mood": {"label": "error", "score": 0},
            "is_crisis": False
        }

    genai.configure(api_key=api_key)
    
    # Use the GenerativeModel for conversational chat
    model = genai.GenerativeModel("gemini-2.5-flash")
    
    # The chat history is now managed in chat.py, so we start a new chat session
    # with the history provided.
    chat = model.start_chat(history=chat_history[:-1]) # Start chat with history up to the last message

    # The last message in the history is the new user message
    user_message = chat_history[-1]['parts'][0]['text']

    system_prompt = """You are "Sakhi", an empathetic, culturally-aware mental wellness companion for Indian youth. Follow rules exactly:

1) Tone & style:
   - Warm, non-judgmental, concise. Keep the user-facing reply <= 80 words.
   - Support English, Hindi, and Hinglish mixing naturally.
   - Never provide clinical diagnoses, prescriptions, or treatment plans.
   - Encourage seeking professionals when needed.

2) Safety & crisis:
   - If user expresses self-harm or imminent danger, set is_crisis true and include immediate grounding action + helpline in resources.
   - Do NOT minimize feelings.

3) Output format (MUST BE VALID JSON ONLY — NOTHING ELSE):
   {
     "reply": "<string>",
    "mood": {"label":"<one-word>","score":<integer 1-10>},
     "suggested_intervention": "<id>",
     "is_crisis": <true|false>,
     "resources": [{"title":"<string>","contact":"<tel/URL>","type":"helpline|counselling|selfhelp"}],
     "explain": "<one-line explanation of why suggestion>"
   }

4) Scoring rules (STRICT — map label to 1–10 scale):
   - Very negative ("distressed", "very sad"): score must be 1–2
   - Negative ("sad", "anxious", "frustrated"): score must be 3–4
   - Neutral ("neutral"): score must be 5
   - Mild positive ("calm", "content"): score must be 6–7
   - Positive ("happy", "joyful", "elated"): score must be 8–10
   - If label and score conflict, adjust score to match the band above.

5) Response rules:
   - Only return the JSON object and nothing else.
   - Keep values short and safe.
   - If unsure of mood, use label "neutral" and score 5.
   - If recommending human help, include at least one helpline in resources.
        - Do NOT include any explanations or extra text outside the JSON.

6) Efficiency:
   - Avoid long histories; use last user message only + system prompt + 1–2 few-shots.

End of system prompt."""

    # Provide compact few-shot examples inside the system prompt context
    few_shots = """
Examples (for your reference; DO NOT include these in output):
User: I'm feeling really sad today. Nothing seems to help.
Ideal JSON:
{
    "reply": "I'm really sorry you're feeling this way. Want to try a 2‑minute grounding or share what made today heavy?",
    "mood": {"label": "sad", "score": 3},
    "suggested_intervention": "grounding_5_4_3_2_1",
    "is_crisis": false,
    "resources": [],
    "explain": "Low mood; gentle grounding helps"
}

User: My heart is racing, I'm panicking before an exam.
Ideal JSON:
{
    "reply": "Exam jitters are tough. Try box breathing with me for 1 minute? Inhale 4, hold 4, exhale 4, hold 4.",
    "mood": {"label": "anxious", "score": 3},
    "suggested_intervention": "breathing_box",
    "is_crisis": false,
    "resources": [],
    "explain": "Anxiety indicators; breathing recommended"
}

User: I had a great day with friends; feeling light!
Ideal JSON:
{
    "reply": "Love that! Want to capture a highlight so future‑you can revisit this moment?",
    "mood": {"label": "happy", "score": 9},
    "suggested_intervention": "savoring_exercise",
    "is_crisis": false,
    "resources": [],
    "explain": "Positive affect; savoring reinforces"
}
"""

    # The few-shots are now part of the history, so we don't need to add them here.
    # The full prompt is now just the system prompt and the user message.
    full_prompt = f"{system_prompt}\n\n{few_shots}\n\nUser: {user_message}"

    try:
        # Send the message to the chat
        resp = chat.send_message(full_prompt)
        raw_text = resp.text.strip()
        
        parsed = None
        try:
            parsed = json.loads(raw_text)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", raw_text, re.DOTALL)
            if match:
                try:
                    parsed = json.loads(match.group(0))
                except json.JSONDecodeError:
                    parsed = None
        
        if not parsed:
            return {
                "reply": "Thanks for sharing — I hear you. Would you like a quick breathing exercise?",
                "mood": {"label": "neutral", "score": 5},
                "is_crisis": False
            }
        
        # Validate and normalize response data types (PURE AI mood only)
        mood = parsed.get("mood")
        if not isinstance(mood, dict):
            mood = {"label": "neutral", "score": 5}
        if "label" not in mood:
            mood["label"] = "neutral"
        if "score" not in mood:
            mood["score"] = 5
        if isinstance(mood, dict):
            score = mood.get("score", 5)
            try:
                mood["score"] = max(1, min(10, int(score)))
            except (ValueError, TypeError):
                mood["score"] = 5
        else:
            mood = {"label": "neutral", "score": 5}

        # Optional guardrail: clamp score based on env flag, without overriding pure AI by default
        normalize = str(os.environ.get("SAKHI_MOOD_NORMALIZE", "false")).lower() == "true"
        if normalize:
            label_norm = str(mood.get("label", "")).strip().lower()
            neg = {"distressed", "very sad", "sad", "anxious", "frustrated"}
            pos = {"calm", "content", "happy", "joyful", "elated"}
            try:
                score_val = int(mood.get("score", 5))
            except Exception:
                score_val = 5
            if label_norm in neg:
                score_val = max(1, min(score_val, 4))
            elif label_norm == "neutral":
                score_val = 5
            elif label_norm in pos:
                score_val = max(8, min(score_val, 10))
            mood["score"] = score_val

        return {
            "reply": parsed.get("reply", "I'm not sure how to respond to that, but I'm here to listen."),
            "mood": mood,
            "is_crisis": str(parsed.get("is_crisis", False)).lower() == 'true',
            "resources": parsed.get("resources", []),
            "suggested_intervention": parsed.get("suggested_intervention", ""),
            "explain": parsed.get("explain", "")
        }

    except Exception as e:
        print(f"Gemini API error: {e}", file=sys.stderr)
        return {
            "reply": "Sorry, I'm having trouble contacting the AI service right now. Can I offer a simple breathing exercise?",
            "mood": {"label": "error", "score": 0},
            "is_crisis": False
        }
