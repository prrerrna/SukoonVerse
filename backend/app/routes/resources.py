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
            "name": "KIRAN National Mental Health Helpline (India)",
            "contact": "tel:18005990019",
            "type": "helpline",
            "cost": "free"
        },
        {
            "name": "iCALL (TISS) Counselling Helpline",
            "contact": "tel:9152987821",
            "type": "helpline",
            "cost": "low"
        },
        {
            "name": "Emergency Services (India)",
            "contact": "tel:112",
            "type": "emergency",
            "cost": "free"
        }
    ]

    return jsonify(resources_data)
