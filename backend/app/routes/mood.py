# mood.py: Defines the mood API endpoints for the Flask backend.
from flask import Blueprint, request, jsonify, session, current_app
import re
import json
from datetime import datetime, timedelta
from app.auth import verify_token
from app.db import get_db
from firebase_admin import firestore
import logging
import uuid

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
    
# ===============================
# Cloud-based Mood Tracking APIs
# ===============================

@mood_bp.route('/mood/cloud', methods=['POST'])
@verify_token
def save_mood_to_cloud(decoded_token):
    """
    Authenticated endpoint to save a mood entry to the user's Firestore document.
    
    Request JSON format:
    {
        "label": "mood label",
        "score": numerical score (1-10),
        "journal": "optional journal text",
        "source": "manual" or "chat",
        "themes": ["theme1", "theme2"] (optional)
    }
    
    Response JSON format:
    {
        "id": "mood entry id",
        "timestamp": ISO timestamp
    }
    """
    db = get_db()
    user_id = decoded_token['uid']
    data = request.get_json()
    
    # Validate required fields
    if not all(k in data for k in ['label', 'score']):
        return jsonify({"error": "label and score are required"}), 400
    
    # Ensure score is within range
    if not isinstance(data['score'], (int, float)) or data['score'] < 1 or data['score'] > 10:
        return jsonify({"error": "score must be a number between 1 and 10"}), 400
    
    # Create mood entry document
    mood_entry = {
        "label": data['label'],
        "score": data['score'],
        "timestamp": firestore.SERVER_TIMESTAMP,
        "source": data.get('source', 'manual')
    }
    
    # Add optional fields if present
    if 'journal' in data and data['journal']:
        mood_entry['journal'] = data['journal']
    
    if 'themes' in data and isinstance(data['themes'], list):
        mood_entry['themes'] = data['themes']
    
    try:
        # Add the mood entry to Firestore
        entry_ref = db.collection('users').document(user_id).collection('moods').document()
        entry_ref.set(mood_entry)
        
        # Return the entry ID for client-side reference
        return jsonify({
            "id": entry_ref.id,
            "success": True,
            "message": "Mood entry saved to cloud"
        }), 201
        
    except Exception as e:
        logging.exception("Error saving mood entry to Firestore")
        return jsonify({"error": str(e)}), 500

@mood_bp.route('/mood/cloud/history', methods=['GET'])
@verify_token
def get_cloud_mood_history(decoded_token):
    """
    Authenticated endpoint to retrieve mood history from Firestore.
    
    Query parameters:
    - days: Number of days to retrieve (default: 7)
    - limit: Maximum number of entries to retrieve (default: 100)
    
    Response JSON format:
    {
        "history": [
            {
                "id": "entry id",
                "timestamp": ISO timestamp,
                "label": "mood label",
                "score": numerical score,
                "journal": "optional journal entry",
                "source": "manual" or "chat",
                "themes": ["theme1", "theme2"] (if present)
            },
            ...
        ]
    }
    """
    db = get_db()
    user_id = decoded_token['uid']
    
    days = request.args.get('days', 7, type=int)
    limit = request.args.get('limit', 100, type=int)
    
    try:
        # Calculate the cutoff timestamp for the requested number of days
        cutoff_date = datetime.now() - timedelta(days=days)
        
        # Query Firestore for mood entries
        query = (db.collection('users')
                 .document(user_id)
                 .collection('moods')
                 .where('timestamp', '>=', cutoff_date)
                 .order_by('timestamp', direction='DESCENDING')
                 .limit(limit))
        
        entries = []
        for doc in query.stream():
            entry = doc.to_dict()
            
            # Convert Firestore timestamp to ISO string
            if 'timestamp' in entry and hasattr(entry['timestamp'], 'isoformat'):
                entry['timestamp'] = entry['timestamp'].isoformat()
                
            # Add the document ID
            entry['id'] = doc.id
            entries.append(entry)
        
        return jsonify({"history": entries}), 200
        
    except Exception as e:
        logging.exception("Error retrieving mood history from Firestore")
        return jsonify({"error": str(e)}), 500

@mood_bp.route('/mood/cloud/<entry_id>', methods=['PUT'])
@verify_token
def update_mood_entry(decoded_token, entry_id):
    """
    Update an existing mood entry in Firestore.
    
    Request JSON format:
    {
        "label": "updated label" (optional),
        "score": updated score (optional),
        "journal": "updated journal" (optional),
        "themes": ["theme1", "theme2"] (optional)
    }
    
    At least one field must be provided to update.
    """
    db = get_db()
    user_id = decoded_token['uid']
        
    data = request.get_json()
    if not data:
        return jsonify({"error": "No update data provided"}), 400
        
    # Fields that can be updated
    allowed_fields = ['label', 'score', 'journal', 'themes']
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    
    if not update_data:
        return jsonify({"error": "No valid fields to update"}), 400
        
    # Validate score if provided
    if 'score' in update_data:
        if not isinstance(update_data['score'], (int, float)) or update_data['score'] < 1 or update_data['score'] > 10:
            return jsonify({"error": "score must be a number between 1 and 10"}), 400
            
    try:
        # Add last updated timestamp
        update_data['updated_at'] = firestore.SERVER_TIMESTAMP
        
        # Update the document
        entry_ref = db.collection('users').document(user_id).collection('moods').document(entry_id)
        entry_ref.update(update_data)
        
        return jsonify({
            "success": True,
            "message": "Mood entry updated successfully"
        }), 200
        
    except Exception as e:
        logging.exception(f"Error updating mood entry {entry_id}")
        return jsonify({"error": str(e)}), 500

@mood_bp.route('/mood/cloud/<entry_id>', methods=['DELETE'])
@verify_token
def delete_mood_entry(decoded_token, entry_id):
    """
    Delete a mood entry from Firestore.
    """
    db = get_db()
    user_id = decoded_token['uid']
        
    try:
        entry_ref = db.collection('users').document(user_id).collection('moods').document(entry_id)
        entry_ref.delete()
        
        return jsonify({
            "success": True,
            "message": "Mood entry deleted successfully"
        }), 200
        
    except Exception as e:
        logging.exception(f"Error deleting mood entry {entry_id}")
        return jsonify({"error": str(e)}), 500

@mood_bp.route('/mood/cloud/stats', methods=['GET'])
@verify_token
def get_mood_stats(decoded_token):
    """
    Get mood statistics for the authenticated user.
    
    Response includes:
    - Weekly average
    - Daily averages
    - Streak information
    - Best and worst days
    - Entry counts
    """
    db = get_db()
    user_id = decoded_token['uid']
        
    days = request.args.get('days', 7, type=int)
    
    try:
        # Calculate the cutoff timestamp for the requested number of days
        cutoff_date = datetime.now() - timedelta(days=days)
        
        # Query Firestore for mood entries
        query = (db.collection('users')
                 .document(user_id)
                 .collection('moods')
                 .where('timestamp', '>=', cutoff_date)
                 .order_by('timestamp'))
        
        entries = []
        for doc in query.stream():
            entry = doc.to_dict()
            if 'timestamp' in entry:
                entries.append({
                    'id': doc.id,
                    'timestamp': entry['timestamp'],
                    'score': entry['score'],
                    'label': entry['label'],
                    'source': entry.get('source', 'manual')
                })
        
        # Group entries by date
        daily_entries = {}
        for entry in entries:
            # Convert Firestore timestamp to date string
            date_str = entry['timestamp'].date().isoformat() if hasattr(entry['timestamp'], 'date') else datetime.fromisoformat(entry['timestamp']).date().isoformat()
            
            if date_str not in daily_entries:
                daily_entries[date_str] = []
                
            daily_entries[date_str].append(entry)
        
        # Calculate daily averages
        daily_averages = {}
        for date_str, day_entries in daily_entries.items():
            scores = [e['score'] for e in day_entries]
            daily_averages[date_str] = sum(scores) / len(scores)
        
        # Calculate overall weekly average
        all_scores = [e['score'] for e in entries]
        weekly_avg = sum(all_scores) / len(all_scores) if all_scores else None
        
        # Calculate streak (consecutive days with entries)
        dates = sorted(daily_entries.keys(), reverse=True)
        streak = 0
        today = datetime.now().date().isoformat()
        
        # Check if there's an entry for today first
        if dates and dates[0] == today:
            streak = 1
            for i in range(len(dates) - 1):
                date1 = datetime.fromisoformat(dates[i]).date()
                date2 = datetime.fromisoformat(dates[i+1]).date()
                if (date1 - date2).days == 1:
                    streak += 1
                else:
                    break
        
        # Find best and worst days
        best_day = max(daily_averages.items(), key=lambda x: x[1]) if daily_averages else None
        worst_day = min(daily_averages.items(), key=lambda x: x[1]) if daily_averages else None
        
        stats = {
            "weekly_avg": round(weekly_avg, 1) if weekly_avg is not None else None,
            "daily_averages": {date: round(avg, 1) for date, avg in daily_averages.items()},
            "streak": streak,
            "entry_count": len(entries),
            "best_day": {"date": best_day[0], "score": round(best_day[1], 1)} if best_day else None,
            "worst_day": {"date": worst_day[0], "score": round(worst_day[1], 1)} if worst_day else None
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        logging.exception("Error retrieving mood statistics from Firestore")
        return jsonify({"error": str(e)}), 500
