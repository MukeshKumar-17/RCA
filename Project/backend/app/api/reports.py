"""
Reports Router
~~~~~~~~~~~~~~
Fetches completed RCA reports and similar historical incidents from Inforge / local store.

Routes
------
GET /report/{id}              — fetch a full RCA report by incident id
GET /similar-incidents/{id}   — fetch similar historical incidents
"""

import logging

from fastapi import APIRouter, HTTPException

from app.mcp.tools import get_incident_from_mcp, search_historical_incidents

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Reports"])


# ── GET /report/{id} ──────────────────────────────────────────────────
@router.get("/report/{incident_id}")
async def get_report(incident_id: str):
    """Fetch a completed incident report by its id.

    Returns the full RCA JSON plus evidence_completeness and status.
    Returns 404 if the incident is not found.
    """
    record = await get_incident_from_mcp(incident_id)

    if not record:
        raise HTTPException(
            status_code=404,
            detail=f"Incident '{incident_id}' not found.",
        )

    return {
        "id": record.get("id"),
        "user_context": record.get("user_context"),
        "status": record.get("status"),
        "evidence_completeness": record.get("evidence_completeness"),
        "confidence_ceiling": record.get("confidence_ceiling"),
        "rca": record.get("rca"),
        "agent_outputs": record.get("agent_outputs"),
        "created_at": record.get("created_at"),
    }


# ── GET /similar-incidents/{id} ───────────────────────────────────────
@router.get("/similar-incidents/{incident_id}")
async def get_similar_incidents(incident_id: str):
    """Fetch similar historical incidents for a given incident id.

    Looks up the incident's user_context, then searches
    for similar completed incidents via MCP tools.
    Returns an array of matches with similarity context and resolutions.
    """
    record = await get_incident_from_mcp(incident_id)

    if not record:
        raise HTTPException(
            status_code=404,
            detail=f"Incident '{incident_id}' not found.",
        )

    user_context = record.get("user_context", "")

    # Search for similar incidents
    search_result = await search_historical_incidents(user_context, limit=6)
    matches = search_result.get("matches", [])

    # Filter out the current incident from results
    matches = [m for m in matches if m.get("id") != incident_id][:5]

    return {
        "incident_id": incident_id,
        "matches": matches,
        "match_count": len(matches),
        "source": "mcp",
    }
