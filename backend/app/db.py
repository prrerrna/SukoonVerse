import os
import firebase_admin
from firebase_admin import credentials, firestore

def initialize_firebase():
    """
    Initialize Firebase Admin SDK once using Application Default Credentials (ADC)
    when available. Falls back to a service account JSON if explicitly provided
    via GOOGLE_APPLICATION_CREDENTIALS or if a local serviceAccountKey.json exists.
    """
    if firebase_admin._apps:
        return
    try:
        cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        else:
            if os.path.exists("serviceAccountKey.json"):
                cred = credentials.Certificate("serviceAccountKey.json")
                firebase_admin.initialize_app(cred)
            else:
                try:
                    cred = credentials.ApplicationDefault()
                    firebase_admin.initialize_app(cred)
                except Exception:
                    firebase_admin.initialize_app()
        print("Firebase Admin SDK initialized.")
    except Exception as e:
        print(f"Warning: Failed to initialize Firebase Admin SDK: {e}")

def get_db():
    """
    Returns a Firestore client instance. Assumes initialization is done.
    """
    return firestore.client()

