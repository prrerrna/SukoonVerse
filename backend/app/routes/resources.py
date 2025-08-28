# resources.py: Defines the resources API endpoint for the Flask backend.
from flask import Blueprint, request, jsonify

resources_bp = Blueprint('resources_bp', __name__)

@resources_bp.route('/resources', methods=['GET'])
def get_resources():
    # This is a route handler, which is a required function by Flask.
    # All logic is inline as requested.
    
    # The region parameter is not used in this stub, but could be used
    # to filter resources by state or city in a real implementation.
    region = request.args.get('region', 'default')

    # Stubbed data based on project brief
    resources_data = [
        {
            "name": "National Suicide Prevention Lifeline",
            "contact": "tel:988",
            "type": "helpline",
            "cost": "free"
        },
        {
            "name": "Crisis Text Line",
            "contact": "sms:741741",
            "type": "textline",
            "cost": "free"
        },
        {
            "name": "College Counselling Center (Example)",
            "contact": "tel:1800-123-4567",
            "type": "helpline",
            "cost": "low"
        }
    ]

    return jsonify(resources_data)
