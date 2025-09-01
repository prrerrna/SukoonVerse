"""
pulse.py: Blueprint for Sukoon Pulse endpoints
"""
from flask import Blueprint, request, jsonify
from app.utils.encryption import hash_string
from app.services.pulse_service import report_event, get_or_build_summary, ALLOWED_THEMES

pulse_bp = Blueprint('pulse_bp', __name__)


@pulse_bp.route('/pulse/report', methods=['POST'])
def pulse_report():
    data = request.get_json(force=True, silent=True) or {}
    session_id = (data.get('session_id') or '').strip()
    region = (data.get('region') or 'default').strip() or 'default'
    mood_score = data.get('mood_score')
    themes = data.get('themes') or []

    if not session_id or mood_score is None:
        return jsonify({"error": "session_id and mood_score are required"}), 400

    # sanitize themes to allowed
    clean_themes = []
    for t in themes:
        if isinstance(t, str) and t.strip().lower() in ALLOWED_THEMES:
            clean_themes.append(t.strip().lower())

    sid_hash = hash_string(session_id)
    report_event(region, mood_score, clean_themes, sid_hash)
    return jsonify({"ok": True})


@pulse_bp.route('/pulse/summary', methods=['GET'])
def pulse_summary():
    region = request.args.get('region', 'default').strip() or 'default'
    data = get_or_build_summary(region)
    return jsonify(data)


@pulse_bp.route('/feedback', methods=['POST'])
def pulse_feedback():
    data = request.get_json(force=True, silent=True) or {}
    session_id = (data.get('session_id') or '').strip()
    region = (data.get('region') or 'default').strip() or 'default'
    suggestion_id = (data.get('suggestion_id') or '').strip()
    value = int(data.get('value') or 0)

    if not session_id or not suggestion_id or value not in (-1, 1):
        return jsonify({"error": "session_id, suggestion_id, and value (1 or -1) are required"}), 400

    # For hackathon MVP, log to stdout as anonymized record
    sid_hash = hash_string(session_id)
    print(f"PULSE_FEEDBACK: region={region} sid={sid_hash[:10]} suggestion={suggestion_id} value={value}")
    return jsonify({"ok": True})
