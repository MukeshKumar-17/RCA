"""
Timeline Agent
~~~~~~~~~~~~~~
Sends an incident timeline description to Gemini with the TIMELINE_AGENT
prompts and returns a structured, chronologically ordered timeline.
"""

import json
import logging

from app.ai.gemini_client import gemini
from app.agents.prompts import TIMELINE_AGENT_SYSTEM, TIMELINE_AGENT_USER

logger = logging.getLogger(__name__)

_EMPTY_RESULT: dict = {
    "incident_date": None,
    "timeline": [],
    "metrics": {
        "detection_to_first_mitigation_minutes": None,
        "mitigation_to_resolution_minutes": None,
        "total_incident_minutes": None,
        "first_signal_timestamp": None,
        "resolution_timestamp": None,
    },
    "timeline_gaps": [],
    "analyst_notes": "No timeline data provided.",
}


async def run(raw_timeline: str, incident_date: str | None = None) -> dict:
    """Parse *raw_timeline* into structured JSON findings.

    Returns the empty-result sentinel when the input is blank or when
    the model response cannot be parsed.
    """
    if not raw_timeline or not raw_timeline.strip():
        logger.info("timeline_agent: no timeline data — returning empty result")
        return _EMPTY_RESULT

    date_ctx = incident_date or "unknown"

    prompt = (
        f"SYSTEM:\n{TIMELINE_AGENT_SYSTEM}\n\n"
        f"USER:\n{TIMELINE_AGENT_USER.format(raw_timeline=raw_timeline, incident_date=date_ctx)}"
    )

    try:
        raw_response = await gemini.generate_json(prompt)
        return json.loads(raw_response)
    except json.JSONDecodeError as exc:
        logger.error("timeline_agent: failed to parse JSON response — %s", exc)
        return _EMPTY_RESULT
    except Exception as exc:
        logger.error("timeline_agent: Gemini call failed — %s", exc)
        return _EMPTY_RESULT
