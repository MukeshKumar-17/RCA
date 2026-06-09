"""
MCP Tool Definitions
~~~~~~~~~~~~~~~~~~~~
High-level tool functions that the orchestrator calls during the
RCA pipeline. Each tool wraps local storage operations
and returns a structured result the agents can consume.

Tools
-----
search_historical_incidents : find similar past incidents in Inforge / local store
save_incident_to_mcp       : persist a completed incident to Inforge / local store
"""

import logging
from typing import Any

from app.mcp.local_store import store
from app.mcp.inforge_client import inforge

logger = logging.getLogger(__name__)


# ── Tool: search historical incidents ──────────────────────────────────

async def search_historical_incidents(
    user_context: str,
    limit: int = 3,
) -> dict[str, Any]:
    """Search for similar past incidents in Inforge, with fallback to local store.

    Called by the orchestrator between the specialist agents and the
    RCA agent so that historical intelligence informs root cause analysis.

    Parameters
    ----------
    user_context : str
        Free-text description of the current incident (title, symptoms, etc.)
    limit : int
        Maximum number of similar incidents to return.

    Returns
    -------
    dict
        ``{"matches": [...], "match_count": int, "search_query": str}``
        Each match contains ``id``, ``user_context``, and ``rca``.
    """
    logger.info("mcp_tool: searching historical incidents for '%s'", user_context[:80])

    matches = []
    try:
        keywords = [w for w in user_context.split() if len(w) > 3]
        search_query = " | ".join(keywords) if keywords else user_context
        
        response = inforge.table("incidents").select("*").text_search(
            "searchable_text", search_query
        ).limit(limit).execute()
        
        matches = response.data
        logger.info("mcp_tool: found %d historical matches from inforge", len(matches))
    except Exception as exc:
        logger.warning("mcp_tool: inforge search failed, falling back to local store — %s", exc)
        matches = store.search(user_context, limit=limit)
        logger.info("mcp_tool: found %d historical matches from local store", len(matches))

    return {
        "matches": matches,
        "match_count": len(matches),
        "search_query": user_context,
    }


# ── Tool: save incident to MCP ────────────────────────────────────────

async def save_incident_to_mcp(
    incident_id: str,
    user_context: str,
    status: str,
    rca: dict | None,
    evidence_completeness: int = 0,
    confidence_ceiling: int | None = None,
    agent_outputs: dict | None = None,
) -> dict[str, Any]:
    """Persist a completed incident record to Inforge and local store.

    Parameters
    ----------
    incident_id : str
        Unique incident identifier.
    user_context : str
        Incident title / description.
    status : str
        Pipeline status (COMPLETE, NEEDS_CLARIFICATION, etc.)
    rca : dict or None
        The full RCA output from the RCA agent.
    evidence_completeness : int
        Evidence completeness score (0–100).
    confidence_ceiling : int or None
        Maximum confidence the RCA can achieve given available evidence.
    agent_outputs : dict or None
        Raw outputs from the specialist agents.

    Returns
    -------
    dict
        ``{"success": bool, "id": str, "error": str|None}``
    """
    from datetime import datetime, timezone
    import json

    record = {
        "id": incident_id,
        "user_context": user_context or "Untitled incident",
        "status": status,
        "evidence_completeness": evidence_completeness,
        "confidence_ceiling": confidence_ceiling,
        "rca": rca,
        "agent_outputs": agent_outputs,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    # Prepare for text search in Inforge
    searchable_parts = [user_context or "Untitled incident"]
    if rca:
        if isinstance(rca, dict):
            if rca.get("root_cause"):
                searchable_parts.append(str(rca["root_cause"].get("title", "")))
                searchable_parts.append(str(rca["root_cause"].get("description", "")))
            if rca.get("executive_summary"):
                searchable_parts.append(str(rca["executive_summary"]))

    inforge_record = dict(record)
    inforge_record["searchable_text"] = " ".join(searchable_parts)

    error = None
    try:
        inforge.table("incidents").upsert(inforge_record).execute()
        logger.info("mcp_tool: saved incident %s to Inforge", incident_id)
    except Exception as exc:
        logger.error("mcp_tool: failed to save incident to Inforge — %s", exc)
        error = str(exc)

    try:
        store.save(record)
        logger.info("mcp_tool: saved incident %s to local store cache", incident_id)
        if not error:
            return {"success": True, "id": incident_id, "error": None}
    except Exception as exc:
        logger.error("mcp_tool: failed to save incident to local store — %s", exc)
        error = str(exc)

    if error:
        return {"success": False, "id": incident_id, "error": error}
    return {"success": True, "id": incident_id, "error": None}


# ── Tool: get incident from MCP ───────────────────────────────────────

async def get_incident_from_mcp(incident_id: str) -> dict[str, Any] | None:
    """Fetch a single incident by id from Inforge, fallback to local store.

    Returns
    -------
    dict or None
        The incident record, or None if not found.
    """
    try:
        res = inforge.table("incidents").select("*").eq("id", incident_id).execute()
        if res.data:
            return res.data[0]
    except Exception as exc:
        logger.warning("mcp_tool: inforge get failed, falling back to local store — %s", exc)
    
    return store.get(incident_id)
