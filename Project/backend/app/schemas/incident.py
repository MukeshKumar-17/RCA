"""
Incident Schemas
~~~~~~~~~~~~~~~~
Pydantic models for incident creation, response serialisation,
and the analyse-request payload.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.database.models import SeverityEnum, StatusEnum


# ── Request schemas ─────────────────────────────────────────────────────
class IncidentCreate(BaseModel):
    """Payload for creating a new incident investigation."""

    title: str = Field(..., min_length=1, max_length=500, description="Short incident title")
    severity: SeverityEnum = Field(..., description="Severity level (P1–P4)")

    model_config = {"from_attributes": True}


class AnalyzeRequest(BaseModel):
    """Payload to kick off the AI-driven RCA analysis pipeline."""

    incident_id: UUID = Field(..., description="UUID of the incident to analyse")


# ── Response schemas ────────────────────────────────────────────────────
class IncidentResponse(BaseModel):
    """Serialised incident returned by the API."""

    id: UUID
    user_id: UUID
    title: str
    severity: SeverityEnum
    status: StatusEnum
    created_at: datetime

    model_config = {"from_attributes": True}
