# client_local.py: Provides a stubbed local LLM client for development.
import random

# This file simulates a local LLM client like CodeLlama running in LM Studio.
# It returns canned responses to demonstrate the application flow without a real LLM.

def get_local_llm_response(message: str):
    # This function is a placeholder for a real LLM call.
    # The logic is kept simple and returns a canned response.
    
    empathetic_responses = [
        "I hear you. It sounds like things are really tough right now.",
        "That sounds incredibly stressful. Thanks for sharing that with me.",
        "It takes courage to talk about this. I'm here to listen.",
        "I understand. Let's try to work through this together."
    ]
    
    # Simple mood detection stub
    if "anxious" in message.lower() or "worried" in message.lower():
        mood = {"label": "anxious", "score": 7}
    elif "sad" in message.lower() or "down" in message.lower():
        mood = {"label": "sad", "score": 4}
    else:
        mood = {"label": "neutral", "score": 5}
        
    # Select a random empathetic response
    reply = random.choice(empathetic_responses)
    
    return reply, mood
