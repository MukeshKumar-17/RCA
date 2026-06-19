"""
Log Agent
~~~~~~~~~
Sends raw log text to Gemini with the LOG_AGENT prompts and returns
structured JSON findings.
"""

import json
import logging

from app.ai.gemini_client import gemini
from app.agents.prompts import LOG_AGENT_SYSTEM, LOG_AGENT_USER

logger = logging.getLogger(__name__)

_EMPTY_RESULT: dict = {
    "log_summary": {
        "total_lines": 0,
        "time_range_start": None,
        "time_range_end": None,
        "dominant_service": None,
        "overall_health": "HEALTHY",
    },
    "events": [],
    "anomaly_windows": [],
    "analyst_notes": "No log data provided.",
}


async def run(raw_logs: str) -> dict:
    """Analyse *raw_logs* and return structured findings.

    Returns the empty-result sentinel when the input is blank or when
    the model response cannot be parsed.
    """
    if not raw_logs or not raw_logs.strip():
        logger.info("log_agent: no log data — returning empty result")
        return _EMPTY_RESULT

    prompt = (
        f"SYSTEM:\n{LOG_AGENT_SYSTEM}\n\n"
        f"USER:\n{LOG_AGENT_USER.format(raw_logs=raw_logs)}"
    )

    try:
        raw_response = await gemini.generate_json(prompt)
        return json.loads(raw_response)
    except json.JSONDecodeError as exc:
        logger.error("log_agent: failed to parse JSON response — %s", exc)
        return _EMPTY_RESULT
    except Exception as exc:
        logger.error("log_agent: Gemini call failed — %s", exc)
        return _EMPTY_RESULT
