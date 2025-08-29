# mood.py: Defines the mood API endpoints for the Flask backend.
from flask import Blueprint, request, jsonify, session, current_app
import re
import json
from datetime import datetime, timedelta

mood_bp = Blueprint('mood_bp', __name__)

# Keywords for mood detection
MOOD_KEYWORDS = {
    "very_sad": ["devastated", "miserable", "heartbroken", "depressed", "hopeless", "terrible", "awful", "horrible"],
    "sad": ["sad", "unhappy", "down", "blue", "upset", "disappointed", "gloomy", "low"],
    "anxious": ["anxious", "worried", "nervous", "stressed", "tense", "afraid", "panic", "uneasy", "fearful"],
    "frustrated": ["frustrated", "annoyed", "irritated", "angry", "mad", "infuriated", "impatient", "agitated"],
    "neutral": ["neutral", "okay", "fine", "alright", "so-so", "indifferent"],
    "calm": ["calm", "relaxed", "peaceful", "composed", "tranquil", "serene", "quiet"],
    "content": ["content", "satisfied", "pleased", "comfortable", "at ease", "gratified"],
    "happy": ["happy", "glad", "cheerful", "joy", "pleased", "delighted", "content", "smile"],
    "joyful": ["joyful", "thrilled", "ecstatic", "excited", "elated", "overjoyed"],
    "elated": ["elated", "euphoric", "blissful", "on top of the world", "over the moon"]
}

MOOD_SCORES = {
    "very_sad": 1,
    "sad": 2,
    "anxious": 3,
    "frustrated": 4,
    "neutral": 5,
    "calm": 6,
    "content": 7,
    "happy": 8,
    "joyful": 9,
    "elated": 10
}

def analyze_text_mood(message):
    """
    Analyzes mood from text using keyword matching.
    
    This is a simple implementation. In a production environment,
    this would use a trained ML model for more accurate sentiment analysis.
    
    Returns:
        tuple: (label, score) - The mood label and score (1-10)
    """
    if not message:
        return "neutral", 5
        
    message = message.lower()
    
    # Count matches for each mood category
    scores = {mood: 0 for mood in MOOD_KEYWORDS}
    for mood, keywords in MOOD_KEYWORDS.items():
        for word in keywords:
            if re.search(r'\b' + re.escape(word) + r'\b', message):
                scores[mood] += 1
    
    # Find mood with most keyword matches
    max_score = 0
    detected_mood = "neutral"  # default
    
    for mood, count in scores.items():
        if count > max_score:
            max_score = count
            detected_mood = mood
    
    # Convert mood to proper format
    label = detected_mood.replace("_", " ")
    score = MOOD_SCORES.get(detected_mood, 5)
    
    return label, score

@mood_bp.route('/mood', methods=['POST'])
def analyze_mood():
    """
    Endpoint to analyze mood from text.
    
    Request JSON format:
    {
        "message": "string containing the user's message"
    }
    
    Response JSON format:
    {
        "label": "mood label (string)",
        "score": numerical score from 1-10,
        "confidence": confidence level of prediction (0-1)
    }
    """
    data = request.get_json()
    message = data.get('message', '')

    if not message:
        return jsonify({"error": "message is required"}), 400
    
    # Use enhanced mood analysis
    label, score = analyze_text_mood(message)
    mood_data = {
        "label": label,
        "score": score
    }
        
    # Store mood history in session
    if 'mood_history' not in session:
        session['mood_history'] = []
    
    # Add to mood history with timestamp
    mood_entry = {
        "timestamp": datetime.now().isoformat(),
        "label": mood_data["label"],
        "score": mood_data["score"],
        "source": "api"  # Source is API instead of chat or manual
    }
    
    session['mood_history'] = session.get('mood_history', [])[-9:] + [mood_entry]
    
    return jsonify(mood_data)
    
@mood_bp.route('/mood/history', methods=['GET'])
def get_mood_history():
    """
    Endpoint to retrieve the user's mood history from session.
    
    Query parameters:
    - days: Number of days to retrieve (default: 7)
    
    Response JSON format:
    {
        "history": [
            {
                "timestamp": ISO timestamp,
                "label": mood label,
                "score": numerical score 1-10,
                "source": source of mood detection
            },
            ...
        ]
    }
    """
    days = request.args.get('days', 7, type=int)
    
    # Get mood history from session
    mood_history = session.get('mood_history', [])
    
    # Filter entries to only include those from the last 'days' days
    cutoff_date = datetime.now() - timedelta(days=days)
    filtered_history = [
        entry for entry in mood_history 
        if datetime.fromisoformat(entry["timestamp"]) >= cutoff_date
    ]
    
    return jsonify({"history": filtered_history})
