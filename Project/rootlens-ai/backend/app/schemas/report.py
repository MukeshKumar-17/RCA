"""
Report Schemas
~~~~~~~~~~~~~~
Pydantic models for RCA report responses.
"""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class ReportResponse(BaseModel):
    """Serialised AI-generated RCA report."""

    id: UUID
    incident_id: UUID
    root_cause: str
    confidence_score: int = Field(..., ge=0, le=100, description="0-100 confidence percentage")
    evidence_chain: list[Any] = Field(default_factory=list, description="Ordered evidence artefacts")
    executive_summary: str
    prevention_plan: list[Any] = Field(default_factory=list, description="Actionable prevention steps")
    generated_at: datetime

    model_config = {"from_attributes": True}
