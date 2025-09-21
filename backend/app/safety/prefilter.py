# prefilter.py: Implements a crisis detection filter using Gemini API.

# This module contains the logic to check for crisis messages using a dedicated
# Gemini API function optimized specifically for crisis detection.

import os
import sys
from ..llm.client_gemini import detect_crisis

# Keeping minimal fallback keywords for cases where API fails
FALLBACK_CRISIS_KEYWORDS = [
    "suicide", "kill myself", "end my life", "i want to die", 
    "mujhe marna hai", "mujhe marna h"
]

# These phrases should be excluded even if they contain keywords
EXCLUSION_PHRASES = [
    "don't want to die", "do not want to die", 
    "die of embarrassment", "die of laughter"
]

# Regular expressions with context and negative lookaheads to avoid false positives
CRISIS_PATTERNS = [
    # "I want to die" variations (but NOT "I don't want to die" or "die of embarrassment")
    r"(?<!don't\s)(?<!do\snot\s)(?<!didn't\s)(?<!did\snot\s)(?<!won't\s)(?<!will\snot\s)\b(?:i|me)\b.*?\b(?:want|think|feel|going)\b.*?\bto\sdie\b(?!\sof\s)(?!\sfrom\s)",
    
    # "Kill myself" variations 
    r"\b(?:i|me)\b.*?\b(?:want|think\sabout|going\sto|plan\sto)\b.*?\b(?:kill(?:\smyself)?|suicide|end\sit\sall)\b",
    
    # "Want to end it" variations
    r"\b(?:i|me)\b.*?\b(?:want|think\sabout|going\sto|plan\sto)\b.*?\bend\s(?:it|my\slife|everything)\b",
    
    # "No reason to live" variations
    r"\b(?:no\sreason|no\spoint|nothing)\b.*?\b(?:to\slive|in\sliving|to\scontinue)\b",
    
    # "Can't go on" variations
    r"\b(?:can't|cannot|can\snot)\b.*?\b(?:go\son|continue|take\sit|live\slike\sthis)\b",
    
    # "Think I want to die" variations
    r"\bi\sthink\si\s(?:want|need|have)\sto\sdie\b"
]

def check_for_crisis(message: str):
    """
    Enhanced function to check for crisis messages using a dedicated Gemini function.
    The function uses a specialized prompt designed specifically for crisis detection.
    
    Args:
        message: The user message to check
        
    Returns:
        A tuple of (is_crisis, reason)
    """
    if not message or not message.strip():
        return False, None
    
    message_lower = message.lower()
    
    # Check for exclusion phrases first
    for phrase in EXCLUSION_PHRASES:
        if phrase.lower() in message_lower:
            print(f"Not a crisis: contains exclusion phrase - '{phrase}'")
            return False, None
    
    # First try the dedicated Gemini crisis detection function
    is_crisis, confidence, reasoning = detect_crisis(message)
    
    if is_crisis:
        confidence_pct = int(confidence * 100)
        print(f"Crisis detected by Gemini API: {confidence_pct}% confidence - {reasoning}")
        return True, f"gemini_crisis_detection:{confidence_pct}"
    
    # Fallback: Basic keyword matching if for some reason Gemini doesn't detect it
    for keyword in FALLBACK_CRISIS_KEYWORDS:
        if keyword.lower() in message_lower:
            print(f"Crisis detected by fallback keyword: {keyword}")
            return True, "fallback_keyword_match"
    
    # No crisis detected
    return False, None
