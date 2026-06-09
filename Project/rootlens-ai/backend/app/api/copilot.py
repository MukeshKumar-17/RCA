"""
Copilot Router
~~~~~~~~~~~~~~
SSE streaming chat endpoint + conversation history + suggestions.

Routes
------
POST /copilot/chat                      — send a message, receive SSE stream
GET  /copilot/history/{incident_id}     — fetch conversation history
GET  /copilot/suggestions/{incident_id} — get context-aware suggested questions
DELETE /copilot/history/{incident_id}   — clear conversation history
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.services import copilot_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Copilot"])


# ── Request schema ─────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    """Payload for sending a message to the Copilot."""

    incident_id: Optional[str] = Field(
        default=None,
        description="Incident ID to load investigation context for. "
                    "None for general (context-free) chat.",
    )
    message: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="The user's message to the Copilot.",
    )
    conversation_id: Optional[str] = Field(
        default=None,
        description="Optional conversation key. Defaults to incident_id.",
    )


# ── POST /copilot/chat ────────────────────────────────────────────────

@router.post("/copilot/chat")
async def chat(payload: ChatRequest):
    """Send a message to the Copilot and receive a streaming SSE response.

    The response is a ``text/event-stream`` with the following event types:

    - ``token``       — individual content token from the LLM
    - ``sources``     — evidence IDs referenced in the response
    - ``suggestions`` — follow-up question suggestions
    - ``done``        — stream complete, includes message_id
    - ``error``       — an error occurred during streaming
    """
    logger.info(
        "copilot: chat request — incident=%s, message_len=%d",
        payload.incident_id,
        len(payload.message),
    )

    return StreamingResponse(
        copilot_service.stream_chat(
            incident_id=payload.incident_id,
            user_message=payload.message,
            conversation_id=payload.conversation_id,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ── GET /copilot/history/{incident_id} ────────────────────────────────

@router.get("/copilot/history/{incident_id}")
async def get_history(incident_id: str):
    """Fetch the full conversation history for an incident.

    Returns an array of messages with role, content, sources, and timestamp.
    """
    history = copilot_service.get_history(incident_id)
    return {
        "incident_id": incident_id,
        "messages": history,
        "message_count": len(history),
    }


# ── GET /copilot/suggestions/{incident_id} ────────────────────────────

@router.get("/copilot/suggestions/{incident_id}")
async def get_suggestions(incident_id: str):
    """Get context-aware suggested questions for an incident.

    Returns investigation-specific suggestions if the incident exists,
    otherwise returns general SRE/incident management suggestions.
    """
    suggestions = await copilot_service.get_suggestions(incident_id)
    return {
        "incident_id": incident_id,
        "suggestions": suggestions,
    }


# ── GET /copilot/suggestions ──────────────────────────────────────────

@router.get("/copilot/suggestions")
async def get_general_suggestions():
    """Get general suggested questions (no incident context)."""
    suggestions = await copilot_service.get_suggestions(None)
    return {
        "incident_id": None,
        "suggestions": suggestions,
    }


# ── DELETE /copilot/history/{incident_id} ─────────────────────────────

@router.delete("/copilot/history/{incident_id}")
async def clear_history(incident_id: str):
    """Clear conversation history for an incident."""
    from app.services.conversation_store import conversations
    conversations.clear(incident_id)
    return {"status": "cleared", "incident_id": incident_id}


# ── POST /copilot/search ──────────────────────────────────────────────

class SearchRequest(BaseModel):
    """Payload for searching historical incidents from the copilot."""

    query: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Search query for finding similar incidents.",
    )
    limit: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Maximum number of results to return.",
    )


@router.post("/copilot/search")
async def search_incidents(payload: SearchRequest):
    """Search historical incidents for the copilot sidebar.

    Returns simplified incident records with root cause and confidence.
    """
    results = await copilot_service.search_similar_for_copilot(
        query=payload.query,
        limit=payload.limit,
    )
    return {
        "query": payload.query,
        "results": results,
        "count": len(results),
    }


# ── GET /copilot/context/{incident_id} ────────────────────────────────

@router.get("/copilot/context/{incident_id}")
async def get_context(incident_id: str):
    """Get investigation context summary for the copilot sidebar.

    Returns key fields from the incident for display in the UI,
    without the full agent outputs (which would be too large).
    """
    from app.mcp.tools import get_incident_from_mcp

    record = await get_incident_from_mcp(incident_id)
    if not record:
        raise HTTPException(
            status_code=404,
            detail=f"Incident '{incident_id}' not found.",
        )

    rca = record.get("rca", {})
    outputs = record.get("agent_outputs", {})

    # Build a lightweight context summary
    root_cause = {}
    if isinstance(rca, dict) and rca.get("root_cause"):
        rc = rca["root_cause"]
        root_cause = {
            "title": rc.get("title", "Unknown"),
            "confidence": rc.get("confidence", 0),
            "evidence": rc.get("evidence", []),
        }

    return {
        "incident_id": incident_id,
        "user_context": record.get("user_context", "Untitled"),
        "status": record.get("status", "Unknown"),
        "evidence_completeness": record.get("evidence_completeness", 0),
        "confidence_ceiling": record.get("confidence_ceiling", 0),
        "root_cause": root_cause,
        "has_logs": bool(outputs.get("logs", {}).get("events")),
        "has_timeline": bool(outputs.get("timeline", {}).get("timeline")),
        "has_git": bool(outputs.get("git", {}).get("changes")),
        "has_mcp_matches": bool(outputs.get("mcp_matches")),
        "mcp_match_count": len(outputs.get("mcp_matches", [])),
        "action_item_count": len(rca.get("action_items", [])) if isinstance(rca, dict) else 0,
        "contributing_factor_count": len(rca.get("contributing_factors", [])) if isinstance(rca, dict) else 0,
    }

