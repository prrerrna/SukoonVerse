# app.py: Main Flask application entry point.
import os
from flask import Flask
from flask_cors import CORS

# Import routes (Blueprints)
from app.routes.chat import chat_bp
from app.routes.mood import mood_bp
from app.routes.resources import resources_bp
from app.routes.flag import flag_bp

# Flask app initialization
app = Flask(__name__)

# In a real app, you'd want to restrict this more carefully
CORS(app) 

# Register Blueprints
app.register_blueprint(chat_bp, url_prefix='/api')
app.register_blueprint(mood_bp, url_prefix='/api')
app.register_blueprint(resources_bp, url_prefix='/api')
app.register_blueprint(flag_bp, url_prefix='/api')

@app.route('/')
def index():
    return "Welcome to the Sakhi GenAI Backend!"

if __name__ == '__main__':
    # The app runs on port 5000 by default
    app.run(host='0.0.0.0')
