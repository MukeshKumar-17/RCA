"""
Git Agent
~~~~~~~~~
Sends a git diff to Gemini with the GIT_AGENT prompts and returns
risk-assessed change analysis.
"""

import json
import logging

from app.ai.gemini_client import gemini
from app.agents.prompts import GIT_AGENT_SYSTEM, GIT_AGENT_USER

logger = logging.getLogger(__name__)

_EMPTY_RESULT: dict = {
    "diff_summary": {
        "files_changed": 0,
        "lines_added": 0,
        "lines_removed": 0,
        "deployment_risk_score": 0,
        "risk_rationale": "No diff data provided.",
    },
    "changes": [],
    "most_likely_cause": None,
    "analyst_notes": "No diff data provided.",
}


async def run(raw_diff: str, incident_context: str = "") -> dict:
    """Analyse *raw_diff* for risky changes that may have caused an incident.

    Returns the empty-result sentinel when the input is blank or when
    the model response cannot be parsed.
    """
    if not raw_diff or not raw_diff.strip():
        logger.info("git_agent: no diff data — returning empty result")
        return _EMPTY_RESULT

    prompt = (
        f"SYSTEM:\n{GIT_AGENT_SYSTEM}\n\n"
        f"USER:\n{GIT_AGENT_USER.format(raw_diff=raw_diff, incident_context=incident_context)}"
    )

    try:
        raw_response = await gemini.generate_json(prompt)
        return json.loads(raw_response)
    except json.JSONDecodeError as exc:
        logger.error("git_agent: failed to parse JSON response — %s", exc)
        return _EMPTY_RESULT
    except Exception as exc:
        logger.error("git_agent: Gemini call failed — %s", exc)
        return _EMPTY_RESULT
