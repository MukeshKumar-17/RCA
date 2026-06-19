"""
Incidents Router
~~~~~~~~~~~~~~~~
Accepts raw incident data (logs, timeline, diff, user_context),
runs the full orchestrator pipeline, persists the result locally,
and returns the incident id + status.

Routes
------
POST /incidents — run full RCA pipeline and save locally
"""

import json
import logging
import uuid
import jwt
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field
from typing import Optional

from app.agents import orchestrator
from app.mcp.local_store import store

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Incidents"])

def get_user_id(authorization: str = Header(None)) -> str | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    try:
        claims = jwt.decode(token, options={"verify_signature": False})
        return claims.get("sub")
    except Exception:
        return None


# ── Request schema ─────────────────────────────────────────────────────
class IncidentRequest(BaseModel):
    """Payload for creating and analysing an incident in one shot."""

    logs: str = Field(default="", description="Raw log text")
    timeline: str = Field(default="", description="Incident timeline description")
    diff: str = Field(default="", description="Git diff text")
    user_context: str = Field(
        default="",
        description="Free-text context: incident title, description, or notes",
    )
    incident_date: Optional[str] = Field(
        default=None,
        description="Incident date in YYYY-MM-DD format (optional)",
    )


# ── POST /incidents ────────────────────────────────────────────────────
@router.post("/incidents", status_code=201)
async def create_and_analyze_incident(
    payload: IncidentRequest,
    user_id: str | None = Depends(get_user_id)
):
    """Run the full RCA pipeline and persist the result locally.

    Steps
    -----
    1. Validate that at least one data source is provided.
    2. Run ``orchestrator.run()`` with the raw inputs.
    3. Save the complete result to the local store.
    4. Return the incident ``id`` and ``status``.
    """
    # ── Validate: at least one source must be non-empty ────────────────
    if not any([
        payload.logs.strip(),
        payload.timeline.strip(),
        payload.diff.strip(),
    ]):
        raise HTTPException(
            status_code=400,
            detail="At least one data source (logs, timeline, or diff) must be provided.",
        )

    # ── Run the orchestrator pipeline ──────────────────────────────────
    logger.info("incidents: starting orchestrator pipeline")
    try:
        result = await orchestrator.run(
            raw_logs=payload.logs,
            raw_timeline=payload.timeline,
            raw_diff=payload.diff,
            incident_date=payload.incident_date,
            user_context=payload.user_context,
        )
    except Exception as exc:
        logger.error("incidents: orchestrator failed — %s", exc)
        raise HTTPException(
            status_code=500,
            detail=f"Analysis pipeline failed: {exc}",
        )

    # ── Persist locally and to Inforge ─────────────────────────────────
    incident_id = str(uuid.uuid4())
    status = result.get("status", "COMPLETE")

    from app.mcp.tools import save_incident_to_mcp
    await save_incident_to_mcp(
        incident_id=incident_id,
        user_context=payload.user_context,
        status=status,
        rca=result.get("rca"),
        evidence_completeness=result.get("evidence_completeness", 0),
        confidence_ceiling=result.get("confidence_ceiling"),
        agent_outputs=result.get("agent_outputs"),
        user_id=user_id,
    )
    logger.info("incidents: saved to MCP — id=%s", incident_id)

    return {
        "id": incident_id,
        "status": status,
        "evidence_completeness": result.get("evidence_completeness"),
    }


# ── GET /incidents ────────────────────────────────────────────────────
@router.get("/incidents")
async def list_incidents():
    """List all incidents from the database (bypasses RLS)."""
    from app.mcp.tools import list_incidents_from_mcp
    incidents = await list_incidents_from_mcp()
    return {"incidents": incidents, "total": len(incidents)}
