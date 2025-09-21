# app.py: Main Flask application entry point.
import os
from datetime import timedelta
from uuid import uuid4
from flask import Flask, session, send_from_directory
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

# Flask app initialization (also serves built frontend from /app/static)
app = Flask(__name__, static_folder='static', static_url_path='/')

# Set a secret key for session management. In a production environment,
# this should be a long, random, and securely stored value.
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'dev-secret-key-for-testing')
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
app.config['SESSION_PERMANENT'] = True

# CORS configuration: allow specific origins via ALLOWED_ORIGINS env (comma-separated)
allowed_origins = os.environ.get('ALLOWED_ORIGINS')
if allowed_origins:
    origins = [o.strip() for o in allowed_origins.split(',') if o.strip()]
    CORS(app, resources={r"/api/*": {"origins": origins}}, supports_credentials=True)
else:
    # Dev friendly default; tighten in production by setting ALLOWED_ORIGINS
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
    index_path = os.path.join(app.static_folder or '', 'index.html')
    if os.path.exists(index_path):
        return send_from_directory(app.static_folder, 'index.html')
    return "Welcome to the Sakhi GenAI Backend!"

# Explicit SPA routes to ensure client-side routing works in Cloud Run
for _path in ['login', 'chat', 'mood', 'pulse', 'share', 'settings']:
    app.add_url_rule(f'/{_path}', f'spa_{_path}', index)

# SPA fallback: serve index.html for non-API routes so client routing works
@app.route('/<path:path>')
def serve_spa(path: str):
    if path.startswith('api'):
        # Let API blueprints handle these
        return ("Not Found", 404)
    file_path = os.path.join(app.static_folder or '', path)
    if os.path.exists(file_path):
        # Serve actual static asset if it exists
        return send_from_directory(app.static_folder, path)
    # Otherwise return index.html for SPA routing
    index_path = os.path.join(app.static_folder or '', 'index.html')
    if os.path.exists(index_path):
        return send_from_directory(app.static_folder, 'index.html')
    return ("Not Found", 404)

@app.route('/api/session', methods=['GET'])
def get_session_id():
    # Expose a stable id for this server run (useful for front-end testing)
    return {"session_id": SERVER_RUN_SESSION_ID}

@app.route('/api/health', methods=['GET', 'HEAD'])
def health():
    return {"status": "ok"}, 200

if __name__ == '__main__':
    # The app runs on port 5000 by default
    app.run(host='0.0.0.0')
