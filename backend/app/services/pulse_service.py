"""
pulse_service.py: In-memory storage and aggregation for Sukoon Pulse, plus AI summary generation.

This keeps anonymous, aggregate-only data per region. No raw text is stored.
"""
from __future__ import annotations

import os
import time
import json
from collections import Counter, defaultdict
from typing import Dict, List, Any, Tuple

try:
    import google.generativeai as genai
except Exception:
    genai = None  # Will handle gracefully if not available


# Allowed theme chips to prevent raw-text storage
ALLOWED_THEMES = {
    "exam", "sleep", "family", "peer pressure", "loneliness", "friends", "relationships",
    "stress", "social", "money", "health", "career"
}

# In-memory store: region -> list of events
_EVENTS: Dict[str, List[Dict[str, Any]]] = defaultdict(list)

# Cache: region -> {"data": dict, "expires_at": ts}
_CACHE: Dict[str, Dict[str, Any]] = {}

_TTL_SECONDS = int(os.environ.get("PULSE_CACHE_TTL", "1800"))  # default 30 min


def _now() -> float:
    return time.time()


def _clamp_score(x: Any) -> int:
    try:
        xi = int(x)
    except Exception:
        xi = 5
    return max(1, min(10, xi))


def report_event(region: str, mood_score: Any, themes: List[str], sid_hash: str) -> None:
    region_key = (region or "default").strip() or "default"
    score = _clamp_score(mood_score)
    # Filter themes to allowed set and limit to 5
    clean_themes = [t for t in (themes or []) if isinstance(t, str) and t.strip().lower() in ALLOWED_THEMES]
    # Deduplicate while keeping order
    seen = set()
    dedup_themes = []
    for t in clean_themes:
        if t not in seen:
            dedup_themes.append(t)
            seen.add(t)
        if len(dedup_themes) >= 5:
            break

    _EVENTS[region_key].append({
        "ts": _now(),
        "score": score,
        "themes": dedup_themes,
        "sid": sid_hash,
    })

    # Trim to last 7 days window on insert
    cutoff = _now() - 7 * 24 * 3600
    _EVENTS[region_key] = [e for e in _EVENTS[region_key] if e["ts"] >= cutoff]

    # Invalidate cache for region
    _CACHE.pop(region_key, None)


def _aggregate_region(region: str) -> Dict[str, Any]:
    region_key = (region or "default").strip() or "default"
    events = _EVENTS.get(region_key, [])
    if not events:
        return {
            "region": region_key,
            "pulse_score": 0,
            "trend": "flat",
            "top_themes": [],
            "counts": 0,
        }

    # Average across last 7 days
    scores = [e["score"] for e in events]
    avg = round(sum(scores) / len(scores), 1)

    # Trend: compare avg of last 3 days vs previous 3 days
    now = _now()
    day_secs = 24 * 3600
    def avg_for_window(start_offset_days: int, length_days: int) -> float:
        start = now - start_offset_days * day_secs
        end = start - length_days * day_secs
        # Window is (end, start]
        xs = [e["score"] for e in events if end < e["ts"] <= start]
        return (sum(xs) / len(xs)) if xs else 0.0

    recent = avg_for_window(0, 3)
    prev = avg_for_window(3, 3)
    delta = recent - prev
    trend = "flat"
    if delta > 0.2:
        trend = "up"
    elif delta < -0.2:
        trend = "down"

    # Top themes
    theme_counter = Counter()
    for e in events:
        theme_counter.update(e.get("themes", []))
    top = sorted(theme_counter.items(), key=lambda x: (-x[1], x[0]))[:5]
    top_themes = [{"name": k, "count": v} for k, v in top]

    return {
        "region": region_key,
        "pulse_score": avg,
        "trend": trend,
        "top_themes": top_themes,
        "counts": len(events),
    }


def _ensure_genai_configured() -> bool:
    if genai is None:
        return False
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return False
    try:
        genai.configure(api_key=api_key)
        return True
    except Exception:
        return False


def _call_gemini(summary: Dict[str, Any]) -> Dict[str, Any]:
    if not _ensure_genai_configured():
        # Fallback safe defaults
        return {
            "ai_summary": "Community pulse available. Try a 60s breathing break and a short study sprint.",
            "ai_actions": [
                {"id": "a1", "title": "60s box breathing", "description": "Inhale 4, hold 4, exhale 4, hold 4.", "time_estimate": "1", "type": "breathing"},
                {"id": "a2", "title": "25m study sprint", "description": "Pick one topic; 25 minutes focus.", "time_estimate": "25", "type": "pomodoro"},
                {"id": "a3", "title": "Text a friend", "description": "Send a quick check-in message.", "time_estimate": "3", "type": "social"},
            ],
            "safety": "low",
        }

    model = genai.GenerativeModel("gemini-2.5-flash")
    system = (
        "You are Sakhi, an empathetic, culturally-aware wellness companion for Indian students. "
        "You receive an anonymous 7-day community aggregate for a region: average mood (1–10), trend (up|down|flat), and top 5 themes (from a fixed list, no raw text). "
        "Produce JSON only with keys: ai_summary (2–3 sentences, destigmatizing, no medical claims), ai_actions (1–3 items with id,title(<=10 words),description(<=20 words),time_estimate in minutes, type in [breathing|pomodoro|social|sleep|movement|professional]), safety in [low|medium|high]. "
        "If mood <=3 or trend=down, set safety medium/high and include helpline/professional guidance and one grounding action. JSON only."
    )
    user = (
        f"Region: \"{summary['region']}\". Avg mood: {summary['pulse_score']}. Trend: \"{summary['trend']}\". "
        f"Themes: {[t['name'] for t in summary.get('top_themes', [])]}. Generate brief ai_summary and 3 ai_actions."
    )
    prompt = system + "\n\n" + user

    try:
        resp = model.generate_content(prompt)
        raw = (resp.text or "").strip()
        data = None
        try:
            data = json.loads(raw)
        except Exception:
            # Try extract first JSON object
            start = raw.find("{")
            end = raw.rfind("}")
            if start != -1 and end != -1 and end > start:
                try:
                    data = json.loads(raw[start:end+1])
                except Exception:
                    data = None
        if not isinstance(data, dict):
            raise ValueError("Invalid AI response")

        # Validate
        ai_summary = str(data.get("ai_summary", "")).strip()
        actions = data.get("ai_actions", [])
        if not isinstance(actions, list):
            actions = []
        cleaned_actions = []
        for i, a in enumerate(actions[:3]):
            if not isinstance(a, dict):
                continue
            cleaned_actions.append({
                "id": str(a.get("id") or f"a{i+1}"),
                "title": str(a.get("title", "")).strip()[:60],
                "description": str(a.get("description", "")).strip()[:120],
                "time_estimate": str(a.get("time_estimate", ""))[:8],
                "type": str(a.get("type", "breathing")),
            })
        safety = str(data.get("safety", "low")).lower()
        if safety not in {"low", "medium", "high"}:
            safety = "low"

        return {
            "ai_summary": ai_summary or "Community care ideas are ready.",
            "ai_actions": cleaned_actions or [
                {"id": "a1", "title": "60s box breathing", "description": "Inhale 4, hold 4, exhale 4, hold 4.", "time_estimate": "1", "type": "breathing"}
            ],
            "safety": safety,
        }
    except Exception:
        # Fallback
        return {
            "ai_summary": "Community pulse available. Try a 60s breathing break and a short study sprint.",
            "ai_actions": [
                {"id": "a1", "title": "60s box breathing", "description": "Inhale 4, hold 4, exhale 4, hold 4.", "time_estimate": "1", "type": "breathing"}
            ],
            "safety": "low",
        }


def get_or_build_summary(region: str) -> Dict[str, Any]:
    region_key = (region or "default").strip() or "default"

    # Cache hit
    cached = _CACHE.get(region_key)
    if cached and cached.get("expires_at", 0) > _now():
        out = dict(cached["data"])  # shallow copy
        out["cached"] = True
        return out

    summary = _aggregate_region(region_key)
    ai = _call_gemini(summary)
    payload = {**summary, **ai}

    _CACHE[region_key] = {"data": payload, "expires_at": _now() + _TTL_SECONDS}

    out = dict(payload)
    out["cached"] = False
    return out
