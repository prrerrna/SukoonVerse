"""Gemini client utilities."""
import os
import json
import re
import sys
import google.generativeai as genai


def get_gemini_response(chat_history: list):
    """
    Generate a response from Gemini using the provided conversation history.

    chat_history format (consistent with routes/chat.py):
      [
        {"role": "user", "parts": [{"text": "..."}]},
        {"role": "model", "parts": [{"text": "..."}]},
        ...
      ]
    Returns a dict: { reply, mood, is_crisis, resources?, suggested_intervention?, explain? }
    Never returns None.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {
            "reply": "Gemini not configured. Please set GEMINI_API_KEY.",
            "mood": {"label": "error", "score": 0},
            "is_crisis": False,
        }

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")

        # History before the last message
        prior = chat_history[:-1] if chat_history else []
        chat = model.start_chat(history=prior)

        user_message = chat_history[-1]["parts"][0]["text"] if chat_history else ""

        system_prompt = (
            "You are \"Sakhi\", an empathetic, culturally-aware mental wellness companion for Indian youth. "
            "Follow rules exactly:\n\n"
            "1) Tone & style:\n"
            "   - Warm, non-judgmental, concise. Keep the user-facing reply <= 80 words.\n"
            "   - Support English, Hindi, and Hinglish mixing naturally.\n"
            "   - Never provide clinical diagnoses, prescriptions, or treatment plans.\n"
            "   - Encourage seeking professionals when needed.\n\n"
            "2) Safety & crisis:\n"
            "   - If user expresses self-harm or imminent danger, set is_crisis true and include immediate grounding action + helpline in resources.\n"
            "   - Do NOT minimize feelings.\n\n"
            "3) Output format (MUST BE VALID JSON ONLY — NOTHING ELSE):\n"
            "   {\n"
            "     \"reply\": \"<string>\",\n"
            "     \"mood\": {\"label\":\"<one-word>\",\"score\":<integer 1-10>},\n"
            "     \"suggested_intervention\": \"<id>\",\n"
            "     \"is_crisis\": <true|false>,\n"
            "     \"resources\": [{\"title\":\"<string>\",\"contact\":\"<tel/URL>\",\"type\":\"helpline|counselling|selfhelp\"}],\n"
            "     \"explain\": \"<one-line explanation of why suggestion>\"\n"
            "   }\n\n"
            "4) Scoring rules (STRICT — map label to 1–10 scale):\n"
            "   - Very negative (\"distressed\", \"very sad\"): score must be 1–2\n"
            "   - Negative (\"sad\", \"anxious\", \"frustrated\"): score must be 3–4\n"
            "   - Neutral (\"neutral\"): score must be 5\n"
            "   - Mild positive (\"calm\", \"content\"): score must be 6–7\n"
            "   - Positive (\"happy\", \"joyful\", \"elated\"): score must be 8–10\n"
            "   - If label and score conflict, adjust score to match the band above.\n\n"
            "5) Response rules:\n"
            "   - Only return the JSON object and nothing else.\n"
            "   - Keep values short and safe.\n"
            "   - If unsure of mood, use label \"neutral\" and score 5.\n"
            "   - If recommending human help, include at least one helpline in resources.\n"
            "        - Do NOT include any explanations or extra text outside the JSON.\n\n"
            "6) Efficiency:\n"
            "   - Avoid long histories; use last user message only + system prompt + 1–2 few-shots.\n\n"
            "End of system prompt."
        )

        few_shots = (
            "Examples (for your reference; DO NOT include these in output):\n"
            "User: I'm feeling really sad today. Nothing seems to help.\n"
            "Ideal JSON:\n"
            "{\n"
            "    \"reply\": \"I'm really sorry you're feeling this way. Want to try a 2‑minute grounding or share what made today heavy?\",\n"
            "    \"mood\": {\"label\": \"sad\", \"score\": 3},\n"
            "    \"suggested_intervention\": \"grounding_5_4_3_2_1\",\n"
            "    \"is_crisis\": false,\n"
            "    \"resources\": [],\n"
            "    \"explain\": \"Low mood; gentle grounding helps\"\n"
            "}\n\n"
            "User: My heart is racing, I'm panicking before an exam.\n"
            "Ideal JSON:\n"
            "{\n"
            "    \"reply\": \"Exam jitters are tough. Try box breathing with me for 1 minute? Inhale 4, hold 4, exhale 4, hold 4.\",\n"
            "    \"mood\": {\"label\": \"anxious\", \"score\": 3},\n"
            "    \"suggested_intervention\": \"breathing_box\",\n"
            "    \"is_crisis\": false,\n"
            "    \"resources\": [],\n"
            "    \"explain\": \"Anxiety indicators; breathing recommended\"\n"
            "}\n\n"
            "User: I had a great day with friends; feeling light!\n"
            "Ideal JSON:\n"
            "{\n"
            "    \"reply\": \"Love that! Want to capture a highlight so future‑you can revisit this moment?\",\n"
            "    \"mood\": {\"label\": \"happy\", \"score\": 9},\n"
            "    \"suggested_intervention\": \"savoring_exercise\",\n"
            "    \"is_crisis\": false,\n"
            "    \"resources\": [],\n"
            "    \"explain\": \"Positive affect; savoring reinforces\"\n"
            "}"
        )

        full_prompt = f"{system_prompt}\n\n{few_shots}\n\nUser: {user_message}"

        resp = chat.send_message(full_prompt)
        raw_text = (resp.text or "").strip()

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

        if not parsed or not isinstance(parsed, dict):
            return {
                "reply": "Thanks for sharing — I hear you. Would you like a quick breathing exercise?",
                "mood": {"label": "neutral", "score": 5},
                "is_crisis": False,
            }

        mood = parsed.get("mood")
        if not isinstance(mood, dict):
            mood = {"label": "neutral", "score": 5}
        if "label" not in mood:
            mood["label"] = "neutral"
        if "score" not in mood:
            mood["score"] = 5
        try:
            mood["score"] = max(1, min(10, int(mood.get("score", 5))))
        except Exception:
            mood["score"] = 5

        if str(os.environ.get("SAKHI_MOOD_NORMALIZE", "false")).lower() == "true":
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
            "is_crisis": str(parsed.get("is_crisis", False)).lower() == "true",
            "resources": parsed.get("resources", []),
            "suggested_intervention": parsed.get("suggested_intervention", ""),
            "explain": parsed.get("explain", ""),
        }

    except Exception as e:
        print(f"Gemini API error: {e}", file=sys.stderr)
        return {
            "reply": "Sorry, I'm having trouble contacting the AI service right now. Can I offer a simple breathing exercise?",
            "mood": {"label": "error", "score": 0},
            "is_crisis": False,
        }


def generate_short_title(text: str, max_words: int = 5) -> str | None:
    """
    Use Gemini to generate a concise chat title (3–5 words) for the first message.
    Returns a cleaned title string or None on failure/misconfiguration.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")
        prompt = (
            "You will create a concise chat session title based on the user's first message.\n"
            "Rules:\n"
            "- 3 to 5 words\n"
            "- Title Case (Capitalize Important Words)\n"
            "- No quotes, emojis, or trailing punctuation\n"
            "- Return ONLY the title text, nothing else.\n\n"
            f"User's first message:\n{text}\n\nTitle:"
        )
        resp = model.generate_content(prompt)
        raw = (resp.text or "").strip()
        first_line = raw.splitlines()[0].strip()
        cleaned = first_line.strip('"\'` “”‘’')
        words = re.findall(r"[A-Za-z0-9][A-Za-z0-9\-\']*", cleaned)
        if not words:
            return None
        limited = " ".join(words[:max_words])
        small = {"a", "an", "the", "and", "or", "but", "for", "nor", "on", "at", "to", "from", "by", "of", "in", "with"}
        parts = limited.split()
        titled = []
        for i, w in enumerate(parts):
            wl = w.lower()
            if i != 0 and wl in small:
                titled.append(wl)
            else:
                titled.append(wl.capitalize())
        title = " ".join(titled).strip()
        return title or None
    except Exception:
        return None
