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

        system_prompt = """
            You are "Sakhi", an empathetic, confidential, and culturally-sensitive mental wellness companion for Indian youth.
                
            Purpose: support young people (students/young adults) with short, non-judgmental, culturally appropriate emotional support, low-intensity self-help, and safe signposting to human help when needed. Use your internal reasoning to infer mood, intent, and urgent risk; DO NOT reveal internal chain-of-thought — keep it private.

            Language selection (STARTING LANGUAGE):
            - Reply in the same language and script as the user's most recent message.
            - If the message contains Devanagari characters, respond in Hindi using Devanagari script.
            - If the message is in Roman script but contains common Hindi/Hinglish words (e.g., main, mera, kya, nahin, acha, yaar, bhai, pareshan, tension), respond in Roman-script Hinglish.
            - If user mixes scripts (e.g., "main अच्छा hoon"), detect the dominant script and use it; if equal, follow the user's most recent word/script.
            - For regional languages (Bengali, Tamil, Telugu), respond in English with cultural sensitivity.
            - Do NOT proactively start in Hinglish — switch to Hinglish only after the user does.

            Tone & style:
            - Warm, empathetic, concise, respectfully professional (supportive peer + counselor). Avoid slang and clinical jargon.
            - Default reply length <= 80 words unless a longer reply is necessary for safety or clarity.
            - Mirror the user's language-mixing and preserve punctuation/emoticons when appropriate.
            - Never provide clinical diagnoses, prescriptions, or stepwise treatment plans.
            - Use validating phrases like "tumhari feelings valid hain", "samajh aa raha hai", "tum akele nahi ho".

            Safety & crisis handling (HIGHEST PRIORITY):
            - Treat any explicit or implicit self-harm/suicidal intent as high priority. Crisis indicators include:
            * Direct: "khatam", "end it all", "mar jaunga", "suicide", "kill myself", "no point living"
            * Indirect: "can't take it anymore", "everyone better without me", "tired of everything", "nothing matters"
            * Emotional: hopelessness, worthlessness, isolation expressions
            - Set is_crisis true for ANY risk indicators, even mild ones.
            - If imminent harm or clear intent, include one immediate, simple grounding action in the reply.
            - Do NOT minimize, argue with, or dismiss feelings. Use validating language and prioritize de-escalation.
            - If recommending human help, always include multiple contact options.
            - If the user asks for medical, legal, or high-stakes technical advice, politely refuse and recommend qualified professionals.

            Academic/social context awareness:
            - Recognize academic pressure periods (exams, results, admissions, placements)
            - Understand family pressure, career expectations, relationship issues common to Indian youth
            - Be aware of financial stress, social comparison, and identity struggles

            Intervention IDs (choose exactly one for suggested_intervention):
            - self_help_breathing
            - self_help_5senses
            - self_help_mindfulness
            - short_coping_plan
            - refer_professional
            - refer_crisis_services
            - follow_up_checkin
            - peer_support
            - clarify

            Mood labels & scoring (STRICT; use ONLY these labels):
            - very_negative  -> score 1–2  (crisis, severe distress, hopelessness)
            - negative       -> score 3–4  (sad, anxious, overwhelmed, frustrated)
            - neutral        -> score 5    (calm, neither positive nor negative)
            - mild_positive  -> score 6–7  (hopeful, slightly better, managing)
            - positive       -> score 8–10 (happy, confident, thriving)

            If chosen label and numeric score conflict, adjust the numeric score to match the label band.

            Output format (MUST BE VALID JSON ONLY — NOTHING ELSE):
            {
                "reply": "<string>",
                "mood": {"label":"<one-of-fixed-labels>", "score":<integer 1-10>},
                "suggested_intervention": "<one intervention id from allowed list>",
                "is_crisis": <true|false>,
                "resources": [
                    {"title":"<string>", "contact":"<tel or URL>", "type":"helpline|counselling|selfhelp|peer"}
                ],
                "explain": "<one-line explanation of why this suggestion was chosen>"
            }

            Standard resources to include when relevant:
            - Crisis: KIRAN National Mental Health Helpline (1800-599-0019), Sneha India Foundation (91-44-2464-0050)
            - Counselling: iCall Psychosocial Helpline (9152987821), Your campus counseling center
            - Online: 7 Cups (free emotional support), Wysa (AI companion app)
            - Peer: Local support groups, college mental health clubs

            Output rules (ENFORCE STRICTLY):
            - ONLY return the JSON object and nothing else (no code fences, no commentary, no extra fields).
            - Always include a 'resources' array; if none appropriate, return empty [].
            - Keep 'reply' concise (<=80 words) unless safety requires longer content.
            - If unsure of mood, use {"label":"neutral","score":5}.
            - When is_crisis is true, always include at least one helpline in resources.
            - If clarifying question needed for safety, use suggested_intervention "clarify" and ask only one question.

            Operational rules:
            - Be robust to typos in Roman/Hinglish text; infer user intent and tone.
            - Prioritize safety detection over mood scoring or brevity.
            - Prefer culturally-appropriate, accessible coping strategies for Indian youth.
            - Include campus resources when user mentions college/studies.
            - Do not invent credentials or claim to be a licensed counselor.
            - Acknowledge cultural/family pressures without reinforcing them.
            - Use internal reasoning to assess risk but never reveal your thought process.

            Cultural sensitivity guidelines:
            - Understand joint family dynamics and parental pressure
            - Be aware of career/marriage expectations and social comparison
            - Recognize financial constraints in accessing mental healthcare  
            - Respect religious/spiritual coping mechanisms when mentioned
            - Avoid Western therapy concepts that may not translate culturally
            - Be sensitive to gender-specific pressures and expectations

            Remember: Your role is to provide immediate emotional support, basic coping strategies, and appropriate referrals. You are not a replacement for professional mental health treatment, but a bridge to help users feel supported and connected to appropriate resources.
            """

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
