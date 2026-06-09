"""
Orchestrator
~~~~~~~~~~~~
Full RCA pipeline controller — runs the three specialist agents, performs
an evidence-completeness routing check via Gemini, and synthesises the
final RCA document.

All calls use the async Gemini client (google-generativeai SDK).
"""

import json
import logging

from app.ai.gemini_client import gemini
from app.agents.prompts import ORCHESTRATOR_SYSTEM, ORCHESTRATOR_USER
from app.agents import log_agent, timeline_agent, git_agent, rca_agent
from app.mcp.tools import search_historical_incidents

logger = logging.getLogger(__name__)


async def _routing_check(
    log_out: dict, timeline_out: dict, git_out: dict
) -> dict:
    """Ask Gemini whether evidence is sufficient to proceed to RCA."""
    log_summary = json.dumps(log_out.get("log_summary", {}))
    timeline_summary = json.dumps(timeline_out.get("metrics", {}))
    git_summary = json.dumps(git_out.get("diff_summary", {}))

    prompt = (
        f"SYSTEM:\n{ORCHESTRATOR_SYSTEM}\n\n"
        f"USER:\n{ORCHESTRATOR_USER.format(log_summary=log_summary, timeline_summary=timeline_summary, git_summary=git_summary)}"
    )

    try:
        raw_response = await gemini.generate_json(prompt)
        return json.loads(raw_response)
    except Exception as exc:
        logger.warning("orchestrator: routing check failed (%s) — proceeding anyway", exc)
        return {
            "evidence_completeness": 50,
            "sources_present": {
                "logs": bool(log_out.get("events")),
                "timeline": bool(timeline_out.get("timeline")),
                "diff": bool(git_out.get("changes")),
            },
            "routing_decision": "PROCEED_TO_RCA",
            "clarification_needed": None,
            "confidence_ceiling": 70,
            "confidence_ceiling_reason": "Routing check skipped due to error.",
            "orchestrator_notes": "Routing check skipped due to error.",
        }


async def run(
    raw_logs: str = "",
    raw_timeline: str = "",
    raw_diff: str = "",
    incident_date: str | None = None,
    user_context: str = "",
) -> dict:
    """Full RCA pipeline.

    Steps
    -----
    1. Run all three specialist agents (log, timeline, git).
       If any single agent fails, log the failure but continue
       with empty output for that agent — do not abort.
    2. Ask the orchestrator LLM whether evidence is sufficient.
    3. If sufficient → run the RCA agent with all findings.
    4. Return the complete result package.

    Returns
    -------
    dict
        A result envelope with keys: ``status``, ``evidence_completeness``,
        ``confidence_ceiling``, ``agent_outputs``, and ``rca``.
    """
    logger.info("orchestrator: starting full pipeline")

    # ── Step 1: specialist agents (fault-tolerant) ─────────────────────
    logger.info("orchestrator: running log_agent")
    try:
        log_out = await log_agent.run(raw_logs)
    except Exception as exc:
        logger.error("orchestrator: log_agent failed — %s", exc)
        log_out = log_agent._EMPTY_RESULT

    logger.info("orchestrator: running timeline_agent")
    try:
        timeline_out = await timeline_agent.run(raw_timeline, incident_date)
    except Exception as exc:
        logger.error("orchestrator: timeline_agent failed — %s", exc)
        timeline_out = timeline_agent._EMPTY_RESULT

    # Give git_agent a one-line incident context to focus its analysis
    incident_context = (
        user_context[:200]
        if user_context
        else log_out.get("log_summary", {}).get("dominant_service", "")
    )
    logger.info("orchestrator: running git_agent")
    try:
        git_out = await git_agent.run(raw_diff, incident_context)
    except Exception as exc:
        logger.error("orchestrator: git_agent failed — %s", exc)
        git_out = git_agent._EMPTY_RESULT

    # ── Step 2: MCP historical search ──────────────────────────────────
    logger.info("orchestrator: searching historical incidents via MCP")
    search_query = user_context or incident_context
    mcp_result = await search_historical_incidents(search_query, limit=3)
    mcp_matches = mcp_result.get("matches", [])
    logger.info(
        "orchestrator: MCP returned %d historical matches",
        len(mcp_matches),
    )

    # ── Step 3: routing check ──────────────────────────────────────────
    logger.info("orchestrator: running routing check")
    routing = await _routing_check(log_out, timeline_out, git_out)
    logger.info(
        "orchestrator: evidence_completeness=%d, decision=%s",
        routing.get("evidence_completeness", 0),
        routing.get("routing_decision"),
    )

    if routing.get("routing_decision") == "REQUEST_CLARIFICATION":
        return {
            "status": "NEEDS_CLARIFICATION",
            "clarification_needed": routing.get("clarification_needed"),
            "evidence_completeness": routing.get("evidence_completeness"),
            "confidence_ceiling": routing.get("confidence_ceiling"),
            "agent_outputs": {
                "logs": log_out,
                "timeline": timeline_out,
                "git": git_out,
                "mcp_matches": mcp_matches,
            },
            "rca": None,
        }

    # ── Step 4: RCA synthesis ──────────────────────────────────────────
    # Enrich user_context with MCP historical findings so the RCA agent
    # can reference past incidents in its analysis.
    enriched_context = user_context
    if mcp_matches:
        mcp_summary = "\n\nHistorical incidents found via MCP:\n"
        for i, match in enumerate(mcp_matches, 1):
            match_ctx = match.get("user_context", "Unknown")
            match_rca = match.get("rca", {})
            root_cause = ""
            if isinstance(match_rca, dict):
                root_cause = match_rca.get("root_cause", {}).get("title", "")
            mcp_summary += (
                f"  {i}. \"{match_ctx}\" — root cause: {root_cause or 'N/A'}\n"
            )
        enriched_context = (user_context or "") + mcp_summary

    logger.info("orchestrator: running rca_agent")
    rca_out = await rca_agent.run(
        log_out, timeline_out, git_out, enriched_context
    )

    # ── Step 5: return complete package ────────────────────────────────
    return {
        "status": "COMPLETE",
        "evidence_completeness": routing.get("evidence_completeness"),
        "confidence_ceiling": routing.get("confidence_ceiling"),
        "agent_outputs": {
            "logs": log_out,
            "timeline": timeline_out,
            "git": git_out,
            "mcp_matches": mcp_matches,
        },
        "rca": rca_out,
    }
