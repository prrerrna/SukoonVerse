"""
User module with routes for authentication and user profile management.
"""

from flask import Blueprint
from app.routes.user import user_bp

# Re-export the user blueprint for registration in the main app