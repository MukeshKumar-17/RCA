"""
Copilot Service
~~~~~~~~~~~~~~~
Core service layer for the AI Copilot chat feature.

Responsibilities:
  1. Fetch investigation context from the local incident store
  2. Assemble the system prompt with full investigation data
  3. Build the OpenAI-compatible messages array
  4. Stream LLM responses via the GeminiClient
  5. Extract source references from the response
  6. Save messages to the conversation store
  7. Dynamic suggestion generation based on actual incident content

This module does NOT duplicate any existing agent — it reuses
the investigation pipeline outputs stored by the orchestrator.
"""

import json
import logging
import re
from typing import AsyncGenerator

from app.ai.gemini_client import gemini
from app.mcp.tools import get_incident_from_mcp, search_historical_incidents
from app.services.conversation_store import conversations
from app.agents.copilot_prompts import (
    COPILOT_SYSTEM,
    INVESTIGATION_CONTEXT_TEMPLATE,
    NO_INVESTIGATION_CONTEXT,
    DEFAULT_SUGGESTIONS,
    INVESTIGATION_SUGGESTIONS,
)

logger = logging.getLogger(__name__)


def _format_rca_summary(rca: dict | None) -> str:
    """Format the RCA dict into a readable summary for the system prompt."""
    if not rca:
        return "No RCA generated yet."

    parts = []
    root_cause = rca.get("root_cause", {})
    if root_cause:
        parts.append(f"**Root Cause:** {root_cause.get('title', 'Unknown')}")
        parts.append(f"**Confidence:** {root_cause.get('confidence', 0)}%")
        parts.append(f"**Description:** {root_cause.get('description', 'N/A')}")
        chain = root_cause.get("causal_chain", [])
        if chain:
            parts.append("**Causal Chain:**")
            for i, step in enumerate(chain, 1):
                parts.append(f"  {i}. {step}")
        evidence = root_cause.get("evidence", [])
        if evidence:
            parts.append(f"**Evidence References:** {', '.join(evidence)}")

    meta = rca.get("rca_metadata", {})
    if meta:
        parts.append(f"\n**Overall Confidence:** {meta.get('overall_confidence', 0)}%")
        parts.append(f"**Severity:** {meta.get('severity', 'Unknown')}")
        services = meta.get("affected_services", [])
        if services:
            parts.append(f"**Affected Services:** {', '.join(services)}")

    summary = rca.get("executive_summary", "")
    if summary:
        parts.append(f"\n**Executive Summary:** {summary}")

    action_items = rca.get("action_items", [])
    if action_items:
        parts.append("\n**Action Items:**")
        for item in action_items[:5]:
            parts.append(
                f"  - [{item.get('priority', 'N/A')}] {item.get('title', 'N/A')} "
                f"(Owner: {item.get('owner_role', 'Unassigned')})"
            )

    return "\n".join(parts) if parts else "No RCA generated yet."


def _format_evidence_chain(rca: dict | None) -> str:
    """Extract and format the evidence chain from RCA."""
    if not rca:
        return "No evidence chain available."

    parts = []

    # Root cause evidence
    root_evidence = rca.get("root_cause", {}).get("evidence", [])
    if root_evidence:
        parts.append(f"Root cause evidence: {', '.join(root_evidence)}")

    # Contributing factors evidence
    for factor in rca.get("contributing_factors", []):
        factor_evidence = factor.get("evidence", [])
        if factor_evidence:
            parts.append(
                f"{factor.get('title', 'Factor')}: {', '.join(factor_evidence)}"
            )

    return "\n".join(parts) if parts else "No evidence chain available."


def _format_contributing_factors(rca: dict | None) -> str:
    """Format contributing factors with confidence scores."""
    if not rca:
        return "No contributing factors identified."

    factors = rca.get("contributing_factors", [])
    if not factors:
        return "No contributing factors identified."

    parts = []
    for f in factors:
        parts.append(
            f"- **{f.get('title', 'Unknown')}** ({f.get('confidence', 0)}%): "
            f"{f.get('description', 'N/A')}"
        )
        evidence = f.get("evidence", [])
        if evidence:
            parts.append(f"  Evidence: {', '.join(evidence)}")

    return "\n".join(parts)


def _format_prevention(rca: dict | None) -> str:
    """Format prevention plan from RCA."""
    if not rca:
        return "No prevention plan available."

    prevention = rca.get("prevention", {})
    if not prevention:
        return "No prevention plan available."

    parts = []
    for key in ["detection_improvements", "prevention_improvements", "process_improvements"]:
        items = prevention.get(key, [])
        if items:
            label = key.replace("_", " ").title()
            parts.append(f"**{label}:**")
            for item in items:
                parts.append(f"  - {item}")

    return "\n".join(parts) if parts else "No prevention plan available."


def _format_what_went_well(rca: dict | None) -> str:
    """Format what went well from RCA."""
    if not rca:
        return "Not available."

    items = rca.get("what_went_well", [])
    if not items:
        return "Not available."

    return "\n".join(f"- {item}" for item in items)


def _format_open_questions(rca: dict | None) -> str:
    """Format open questions from RCA."""
    if not rca:
        return "None."

    items = rca.get("open_questions", [])
    if not items:
        return "None."

    return "\n".join(f"- {item}" for item in items)


def _format_agent_output(agent_key: str, outputs: dict | None) -> str:
    """Format a specific agent's output for the system prompt."""
    if not outputs or agent_key not in outputs:
        return "No data available."

    data = outputs[agent_key]
    if not data:
        return "No data available."

    # Truncate to avoid hitting token limits
    raw = json.dumps(data, indent=2)
    if len(raw) > 3000:
        raw = raw[:3000] + "\n... (truncated)"
    return raw


def _format_historical(outputs: dict | None) -> str:
    """Format MCP historical matches for the system prompt."""
    if not outputs:
        return "No historical matches found."

    matches = outputs.get("mcp_matches", [])
    if not matches:
        return "No historical matches found."

    parts = []
    for i, match in enumerate(matches, 1):
        ctx = match.get("user_context", "Unknown")
        rca = match.get("rca", {})
        root_cause = ""
        confidence = 0
        if isinstance(rca, dict):
            rc = rca.get("root_cause", {})
            root_cause = rc.get("title", "")
            confidence = rc.get("confidence", 0)
        parts.append(
            f"{i}. \"{ctx}\" — root cause: {root_cause or 'N/A'} "
            f"(confidence: {confidence}%)"
        )

    return "\n".join(parts) if parts else "No historical matches found."


async def _build_system_prompt(incident_id: str | None) -> str:
    """Build the full system prompt with investigation context."""
    if not incident_id:
        context = NO_INVESTIGATION_CONTEXT
    else:
        record = await get_incident_from_mcp(incident_id)
        if not record:
            context = NO_INVESTIGATION_CONTEXT
        else:
            rca = record.get("rca")
            outputs = record.get("agent_outputs")
            context = INVESTIGATION_CONTEXT_TEMPLATE.format(
                user_context=record.get("user_context", "Unknown incident"),
                status=record.get("status", "Unknown"),
                evidence_completeness=record.get("evidence_completeness", 0),
                confidence_ceiling=record.get("confidence_ceiling", 0),
                rca_summary=_format_rca_summary(rca),
                evidence_chain=_format_evidence_chain(rca),
                contributing_factors=_format_contributing_factors(rca),
                log_findings=_format_agent_output("logs", outputs),
                timeline_findings=_format_agent_output("timeline", outputs),
                git_findings=_format_agent_output("git", outputs),
                historical_matches=_format_historical(outputs),
                prevention_plan=_format_prevention(rca),
                what_went_well=_format_what_went_well(rca),
                open_questions=_format_open_questions(rca),
            )

    return COPILOT_SYSTEM.format(investigation_context=context)


def _extract_sources(text: str) -> list[str]:
    """Extract evidence IDs (LOG-XXX, TL-XXX, GIT-XXX, etc.) from response text."""
    pattern = r"\b(LOG-\d+|TL-\d+|GIT-\d+|CF-\d+|AI-\d+|AW-\d+)\b"
    return list(set(re.findall(pattern, text)))


async def stream_chat(
    incident_id: str | None,
    user_message: str,
    conversation_id: str | None = None,
) -> AsyncGenerator[str, None]:
    """Stream a copilot response as SSE events.

    Yields SSE-formatted strings ready to be sent over the wire.

    Parameters
    ----------
    incident_id : str or None
        The incident to load context for. None for general chat.
    user_message : str
        The user's question.
    conversation_id : str or None
        Conversation key. Defaults to incident_id or a new UUID.
    """
    import uuid

    conv_id = conversation_id or incident_id or str(uuid.uuid4())

    # Save the user message
    conversations.save_message(conv_id, "user", user_message)

    # Build messages array
    system_prompt = await _build_system_prompt(incident_id)
    history = conversations.get_openai_messages(conv_id)

    messages = [{"role": "system", "content": system_prompt}] + history

    # Stream from LLM
    full_response = ""
    try:
        async for token in gemini.generate_stream(messages):
            full_response += token
            yield f"event: token\ndata: {json.dumps({'content': token, 'type': 'token'})}\n\n"

    except Exception as exc:
        logger.error("copilot_service: stream failed — %s", exc)
        error_msg = f"I'm sorry, I encountered an error while processing your request: {exc}"
        full_response = error_msg
        yield f"event: error\ndata: {json.dumps({'error': str(exc)})}\n\n"

    # Extract sources from the full response
    sources = _extract_sources(full_response)
    if sources:
        yield f"event: sources\ndata: {json.dumps({'sources': sources})}\n\n"

    # Generate follow-up suggestions
    suggestions = await get_suggestions(incident_id)
    yield f"event: suggestions\ndata: {json.dumps({'suggestions': suggestions})}\n\n"

    # Save the assistant message
    msg = conversations.save_message(
        conv_id, "assistant", full_response, sources=sources
    )

    yield f"event: done\ndata: {json.dumps({'message_id': msg['message_id'], 'conversation_id': conv_id})}\n\n"


def get_history(incident_id: str) -> list[dict]:
    """Get conversation history for an incident."""
    return conversations.get_history(incident_id)


async def get_suggestions(incident_id: str | None) -> list[str]:
    """Get context-aware suggested questions.

    Generates dynamic suggestions based on actual incident data —
    not a static list. Falls back to defaults when appropriate.
    """
    if not incident_id:
        return DEFAULT_SUGGESTIONS

    record = await get_incident_from_mcp(incident_id)
    if not record:
        return DEFAULT_SUGGESTIONS

    rca = record.get("rca")
    status = record.get("status", "")

    # If still running, suggest status questions
    if status != "COMPLETE":
        return [
            "What is the current investigation status?",
            "What evidence has been collected so far?",
            "How does RootLens work?",
        ]

    # Build dynamic suggestions based on what data exists
    suggestions = []

    # Always include the core question
    suggestions.append("Why did this incident happen?")

    # If root cause exists, ask about it
    if rca and rca.get("root_cause"):
        suggestions.append("What evidence supports this root cause?")
        suggestions.append("What is the confidence score and why?")

    # If contributing factors exist
    if rca and rca.get("contributing_factors"):
        suggestions.append("What were the contributing factors?")

    # Historical matches
    outputs = record.get("agent_outputs", {})
    if outputs.get("mcp_matches"):
        suggestions.append("Have we seen this before?")
    else:
        suggestions.append("Show similar incidents.")

    # Git changes
    if outputs.get("git", {}).get("changes"):
        suggestions.append("What was the riskiest code change?")

    # Prevention
    if rca and rca.get("prevention"):
        suggestions.append("How can we prevent this?")
    else:
        suggestions.append("What prevention steps should we take?")

    # Always offer management summary
    suggestions.append("Explain this RCA to management.")

    # Action items
    if rca and rca.get("action_items"):
        suggestions.append("What are the immediate action items?")

    return suggestions[:9]  # Cap at 9


async def search_similar_for_copilot(query: str, limit: int = 5) -> list[dict]:
    """Search historical incidents for the copilot sidebar.

    Returns simplified incident records with key fields only.
    """
    search_res = await search_historical_incidents(query, limit=limit)
    matches = search_res.get("matches", [])
    results = []
    for m in matches:
        rca = m.get("rca", {})
        root_cause_title = ""
        confidence = 0
        if isinstance(rca, dict) and rca.get("root_cause"):
            root_cause_title = rca["root_cause"].get("title", "")
            confidence = rca["root_cause"].get("confidence", 0)

        results.append({
            "id": m.get("id"),
            "user_context": m.get("user_context", "Untitled"),
            "status": m.get("status"),
            "root_cause": root_cause_title,
            "confidence": confidence,
            "created_at": m.get("created_at"),
        })

    return results
