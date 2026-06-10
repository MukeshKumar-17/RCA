"""
RootLens AI — ORM Models
~~~~~~~~~~~~~~~~~~~~~~~~~
All SQLAlchemy ORM models for the RootLens AI investigation platform.

Tables
------
- users            – registered platform users
- incidents        – incident investigations
- uploads          – uploaded artefacts (logs / timelines / diffs)
- reports          – AI-generated RCA reports
- historical_incidents – past incidents for similarity search
"""

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    Boolean,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.database.connection import Base


# ── Helpers ─────────────────────────────────────────────────────────────
def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _new_uuid() -> uuid.UUID:
    return uuid.uuid4()


# ── Enums ───────────────────────────────────────────────────────────────
class SeverityEnum(str, enum.Enum):
    """Incident severity levels."""
    P1 = "P1"
    P2 = "P2"
    P3 = "P3"
    P4 = "P4"


class StatusEnum(str, enum.Enum):
    """Investigation pipeline status."""
    pending = "pending"
    running = "running"
    complete = "complete"
    failed = "failed"


class FileTypeEnum(str, enum.Enum):
    """Upload artefact categories."""
    log = "log"
    timeline = "timeline"
    diff = "diff"


# ── Models ──────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_new_uuid)
    email = Column(String(320), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    # relationships
    incidents = relationship("Incident", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User {self.email}>"


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_new_uuid)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(String(500), nullable=False)
    severity = Column(
        Enum(SeverityEnum, name="severity_enum", create_constraint=True),
        nullable=False,
    )
    status = Column(
        Enum(StatusEnum, name="status_enum", create_constraint=True),
        nullable=False,
        default=StatusEnum.pending,
    )
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    # relationships
    user = relationship("User", back_populates="incidents")
    uploads = relationship("Upload", back_populates="incident", cascade="all, delete-orphan")
    report = relationship("Report", back_populates="incident", uselist=False, cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Incident {self.title!r} [{self.severity.value}]>"


class Upload(Base):
    __tablename__ = "uploads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_new_uuid)
    incident_id = Column(
        UUID(as_uuid=True),
        ForeignKey("incidents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    file_type = Column(
        Enum(FileTypeEnum, name="file_type_enum", create_constraint=True),
        nullable=False,
    )
    file_path = Column(String(1024), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    # relationships
    incident = relationship("Incident", back_populates="uploads")

    def __repr__(self) -> str:
        return f"<Upload {self.file_type.value} → {self.file_path}>"


class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_new_uuid)
    incident_id = Column(
        UUID(as_uuid=True),
        ForeignKey("incidents.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    root_cause = Column(Text, nullable=False)
    confidence_score = Column(Integer, nullable=False, default=0)
    evidence_chain = Column(JSONB, nullable=False, default=list)
    executive_summary = Column(Text, nullable=False, default="")
    prevention_plan = Column(JSONB, nullable=False, default=list)
    generated_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    # relationships
    incident = relationship("Incident", back_populates="report")

    def __repr__(self) -> str:
        return f"<Report incident={self.incident_id} confidence={self.confidence_score}%>"


class HistoricalIncident(Base):
    __tablename__ = "historical_incidents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_new_uuid)
    title = Column(String(500), nullable=False)
    root_cause = Column(Text, nullable=False)
    resolution = Column(Text, nullable=False)
    summary = Column(Text, nullable=False, default="")
    occurred_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<HistoricalIncident {self.title!r}>"
