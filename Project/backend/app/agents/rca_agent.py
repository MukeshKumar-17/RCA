"""
RCA Agent
~~~~~~~~~
Synthesises outputs from the three specialist agents (log, timeline, git)
into a complete Root Cause Analysis document via Gemini.
"""

import json
import logging

from app.ai.gemini_client import gemini
from app.agents.prompts import RCA_AGENT_SYSTEM, RCA_AGENT_USER

logger = logging.getLogger(__name__)

_EMPTY_RESULT: dict = {
    "rca_metadata": {
        "incident_date": None,
        "incident_duration": None,
        "severity": None,
        "affected_services": [],
        "overall_confidence": 0,
    },
    "executive_summary": "Insufficient data to generate an RCA.",
    "timeline": [],
    "root_cause": {
        "title": "Unknown — insufficient evidence",
        "confidence": 0,
        "description": "Not enough data was provided to determine a root cause.",
        "evidence": [],
        "causal_chain": [],
    },
    "contributing_factors": [],
    "impact": {
        "user_impact": "Unknown",
        "duration_minutes": 0,
        "services_affected": [],
        "data_integrity": "UNCERTAIN",
    },
    "action_items": [],
    "prevention": {
        "detection_improvements": [],
        "prevention_improvements": [],
        "process_improvements": [],
    },
    "what_went_well": [],
    "open_questions": ["All evidence sources were empty or missing."],
}


async def run(
    log_findings: dict,
    timeline_findings: dict,
    git_findings: dict,
    user_context: str = "",
) -> dict:
    """Synthesise all agent outputs into a final RCA document.

    Returns the empty-result sentinel when all inputs are trivially
    empty or the model response cannot be parsed.
    """
    # Quick check: if every specialist returned nothing useful, bail early
    has_logs = bool(log_findings.get("events"))
    has_timeline = bool(timeline_findings.get("timeline"))
    has_diff = bool(git_findings.get("changes"))

    if not has_logs and not has_timeline and not has_diff:
        logger.warning("rca_agent: all agent outputs are empty — returning stub RCA")
        return _EMPTY_RESULT

    prompt = (
        f"SYSTEM:\n{RCA_AGENT_SYSTEM}\n\n"
        f"USER:\n{RCA_AGENT_USER.format(log_findings=json.dumps(log_findings, indent=2), timeline_findings=json.dumps(timeline_findings, indent=2), git_findings=json.dumps(git_findings, indent=2), user_context=user_context or 'No additional context provided.')}"
    )

    try:
        raw_response = await gemini.generate_json(prompt)
        return json.loads(raw_response)
    except json.JSONDecodeError as exc:
        logger.error("rca_agent: failed to parse JSON response — %s", exc)
        return _EMPTY_RESULT
    except Exception as exc:
        logger.error("rca_agent: Gemini call failed — %s", exc)
        return _EMPTY_RESULT
