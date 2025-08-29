# client_gemini.py: Provides a client for the Google Gemini API.
import os
import google.generativeai as genai

# This file integrates with the Google Gemini API.
# It uses the google-generativeai library to make API calls.

def get_gemini_response(message: str):
    """
    Generates a response from the Gemini API.

    Args:
        message: The user's message.

    Returns:
        A tuple containing the model's reply and the extracted mood.
    """
    
    api_key = os.environ.get("GEMINI_API_KEY")

    if not api_key:
        # Fallback if Gemini is not configured
        return "Gemini client is not configured. Please set GEMINI_API_KEY.", {"label": "error", "score": 0}

    genai.configure(api_key=api_key)

    # The system prompt provides context for the model.
    system_prompt = """
    You are "Sakhi", an empathetic, culturally-aware mental wellness companion for Indian youth. 
    Use a warm, non-judgmental tone. Keep replies short and actionable. Do not provide medical diagnoses. 
    If the user expresses self-harm or imminent danger, follow crisis protocol.
    Support English, Hindi and Hinglish mixing. Use simple language; avoid clinical terms.
    """

    model = genai.GenerativeModel('gemini-1.5-flash')
    
    try:
        response = model.generate_content(f"{system_prompt}\n\nUser: {message}")
        
        # For now, we'll return the text and a placeholder mood.
        # In a real application, you would add logic to parse the mood from the response if the model provides it.
        reply = response.text
        mood = {"label": "neutral", "score": 5} # Placeholder mood

        return reply, mood
    except Exception as e:
        # Handle potential API errors
        print(f"An error occurred: {e}")
        return "Sorry, I'm having trouble connecting to the Gemini service right now.", {"label": "error", "score": 0}
