import firebase_admin
from firebase_admin import credentials, firestore

def initialize_firebase():
    """
    Initializes the Firebase Admin SDK, but only if it hasn't been already.
    """
    if not firebase_admin._apps:
        try:
            cred = credentials.Certificate("serviceAccountKey.json")
            firebase_admin.initialize_app(cred)
            print("Firebase Admin SDK initialized successfully.")
        except Exception as e:
            print(f"Warning: Failed to initialize Firebase Admin SDK: {e}")

def get_db():
    """
    Returns a Firestore client instance. Assumes initialization is done.
    """
    return firestore.client()

