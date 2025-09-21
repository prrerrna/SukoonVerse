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
            IMPORTANT: Your role includes accurately detecting the user's emotional state (mood) from their messages. This is critical for providing appropriate support and tracking their emotional wellbeing.
            
            You are "Sakhi", an empathetic, confidential, and culturally-sensitive mental wellness companion for Indian youth.
                
            Purpose: support young people (students/young adults) with short, non-judgmental, culturally appropriate emotional support, low-intensity self-help, and safe signposting to human help when needed. Use your internal reasoning to infer mood, intent, and urgent risk; DO NOT reveal internal chain-of-thought — keep it private.

            Language selection (STARTING LANGUAGE):
            - Always reply in English or Roman-script Hinglish only. DO NOT use Hindi or Devanagari script.
            - If the message is in Roman script but contains common Hindi/Hinglish words (e.g., main, mera, kya, nahin, acha, yaar, bhai, pareshan, tension), respond in Roman-script Hinglish.
            - If the message is in pure English, respond in English.
            - If user mixes scripts, always respond in Roman script English or Hinglish only.
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
            - distressed     -> score 1-2  (crisis, severe distress, hopelessness, suicidal thoughts)
            - very_sad       -> score 3    (deep sadness, grief, serious depression symptoms)
            - sad            -> score 4    (generally unhappy, melancholy, down)
            - anxious        -> score 4    (worry, nervousness, fear, tension)
            - frustrated     -> score 4    (irritation, annoyance, feeling stuck)
            - neutral        -> score 5    (calm, neither positive nor negative, okay)
            - calm           -> score 6    (relaxed, at ease, steady)
            - content        -> score 7    (satisfied, comfortable, stable)
            - happy          -> score 8    (pleased, cheerful, feeling good)
            - joyful         -> score 9    (delighted, excited, very happy)
            - elated         -> score 10   (ecstatic, thrilled, extremely happy)
            
            Important: Carefully analyze the message content and context to detect the user's emotional state.
            Look for emotional keywords, tone, intensity markers, and context clues.
            If chosen label and numeric score conflict, adjust the numeric score to match the label band.
            If uncertain, default to "neutral" with score 5.

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
            "You will create a meaningful, emotionally relevant chat session title based on the user's first message.\n"
            "Rules:\n"
            "- Create a title that captures the emotional core or main topic of the message\n"
            "- 3 to 5 words maximum\n"
            "- Title Case (Capitalize Important Words)\n"
            "- Be specific and descriptive (avoid generic titles like 'Feeling Sad' or 'Daily Chat')\n"
            "- If the message mentions a specific concern, include it (e.g., 'Exam Stress Management')\n"
            "- If the message mentions a specific emotion, incorporate it (e.g., 'Overcoming Anxiety Today')\n"
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


def detect_crisis(message: str) -> tuple:
    """
    Dedicated function for crisis detection using Gemini API.
    Uses a specialized prompt designed specifically for crisis detection.
    
    Args:
        message: User message to check for crisis indicators
        
    Returns:
        Tuple of (is_crisis: bool, confidence: float, reasoning: str)
        - is_crisis: True if crisis detected
        - confidence: Score from 0-1 indicating confidence level
        - reasoning: Brief explanation of why this was classified as crisis or not
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return False, 0.0, "No API key configured"

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")  # Using faster model for quick detection
        
        crisis_prompt = """
        ROLE: You are a crisis detection specialist focused on identifying signs of potential self-harm, suicidal ideation, or severe mental health crisis in short messages.
        
        TASK: Evaluate the following message for crisis indicators. Your ONLY job is to detect crisis signals.
        
        CRISIS INDICATORS (any of these should raise a flag):
        - Explicit mention of suicide, self-harm, or wanting to die
        - Statements about ending one's life or hurting oneself
        - Expressions of hopelessness paired with desire to end suffering
        - Specific plans or methods for self-harm
        - Giving away possessions or saying goodbye
        - Expressions that indicate the person sees no future or way out
        - Statements about being a burden to others and they'd be better off without them
        - Indirect references to ending suffering permanently
        - Phrases like "I want to die", "I think I want to die", "I can't go on", etc.
        - In Hindi/Hinglish: "mujhe marna hai", "main mar jana chahta hun", etc.
        
        NON-CRISIS (do NOT flag):
        - General sadness or everyday problems without suicidal/self-harm content
        - Expressions like "dying of embarrassment" or metaphorical uses of "die"
        - Frustration or anger without suicidal intent
        - Statements with "don't want to die" or clearly negating crisis intent
        
        The user message is: "{message}"
        
        Respond ONLY with the following JSON format and NOTHING ELSE:
        {{
          "is_crisis": <true or false>,
          "confidence": <number between 0 and 1>,
          "reasoning": "<brief 1-2 sentence explanation>"
        }}
        """
        
        crisis_prompt = crisis_prompt.format(message=message)
        response = model.generate_content(crisis_prompt)
        
        try:
            response_text = response.text
            result = json.loads(response_text)
            is_crisis = result.get("is_crisis", False)
            confidence = result.get("confidence", 0.0)
            reasoning = result.get("reasoning", "")
            
            return is_crisis, confidence, reasoning
            
        except (json.JSONDecodeError, AttributeError) as e:
            print(f"Error parsing crisis detection response: {e}", file=sys.stderr)
            # Extract possible json from text
            match = re.search(r"\{.*\}", response.text, re.DOTALL)
            if match:
                try:
                    result = json.loads(match.group(0))
                    return result.get("is_crisis", False), result.get("confidence", 0.0), result.get("reasoning", "")
                except:
                    pass
            
            # If we can't parse the response, check for basic keywords as fallback
            text_lower = message.lower()
            crisis_keywords = ["suicide", "kill myself", "want to die", "end my life"]
            for keyword in crisis_keywords:
                if keyword in text_lower:
                    return True, 0.9, f"Contains crisis keyword: {keyword}"
            
            return False, 0.0, "Failed to analyze message"
            
    except Exception as e:
        print(f"Crisis detection error: {e}", file=sys.stderr)
        return False, 0.0, f"Error: {str(e)}"
