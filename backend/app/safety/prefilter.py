# prefilter.py: Implements a conservative keyword-based crisis detection filter.

# This module contains the list of crisis keywords and the logic to check for them.
# This is a simple, fast pre-filter to catch obvious crisis language before calling an LLM.

# Keywords are kept in lowercase for case-insensitive matching.
CRISIS_KEYWORDS_EN = [
    "suicide", "kill myself", "end my life", "hurt myself", 
    "cut myself", "die", "want to die", "i can't go on", 
    "i will kill myself"
]

CRISIS_KEYWORDS_HI = [
    "marna", "zindagi khatam", "apni jaan", "khud ko nuksan", 
    "mar jaaun", "jeena nahi"
]

ALL_CRISIS_KEYWORDS = CRISIS_KEYWORDS_EN + CRISIS_KEYWORDS_HI

def check_for_crisis(message: str):
    """
    Checks a message for crisis-related keywords.
    This is a simple function, not a class method, to keep it straightforward.
    """
    message_lower = message.lower()
    for keyword in ALL_CRISIS_KEYWORDS:
        if keyword in message_lower:
            return True, "keyword_match"
    
    return False, None
