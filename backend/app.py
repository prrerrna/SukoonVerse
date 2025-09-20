# app.py: Main Flask application entry point.
import os
from datetime import timedelta
from uuid import uuid4
from flask import Flask, session
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Import routes (Blueprints)
from app.routes.chat import chat_bp
from app.routes.mood import mood_bp
from app.routes.resources import resources_bp
from app.routes.flag import flag_bp
from app.routes.pulse import pulse_bp
from app.routes.user import user_bp
from app.routes.history import history_bp  # New import for history blueprint
from app.db import initialize_firebase

# Flask app initialization
app = Flask(__name__)

# Set a secret key for session management. In a production environment,
# this should be a long, random, and securely stored value.
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'dev-secret-key-for-testing')
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
app.config['SESSION_PERMANENT'] = True

# In a real app, you'd want to restrict this more carefully
CORS(app, supports_credentials=True) 

# Initialize Firebase Admin SDK
initialize_firebase()

# Generate a single server-run session id that lasts until the backend restarts
SERVER_RUN_SESSION_ID = os.environ.get('SERVER_RUN_SESSION_ID') or str(uuid4())

@app.before_request
def make_session_permanent():
    # Ensure Flask session cookie persists per configured lifetime
    session.permanent = True

# Register Blueprints
app.register_blueprint(chat_bp, url_prefix='/api')
app.register_blueprint(mood_bp, url_prefix='/api')
app.register_blueprint(resources_bp, url_prefix='/api')
app.register_blueprint(flag_bp, url_prefix='/api')
app.register_blueprint(pulse_bp, url_prefix='/api')
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(history_bp, url_prefix='/api')  # Registering the new history blueprint

@app.route('/')
def index():
    return "Welcome to the Sakhi GenAI Backend!"

@app.route('/api/session', methods=['GET'])
def get_session_id():
    # Expose a stable id for this server run (useful for front-end testing)
    return {"session_id": SERVER_RUN_SESSION_ID}

if __name__ == '__main__':
    # The app runs on port 5000 by default
    app.run(host='0.0.0.0')
