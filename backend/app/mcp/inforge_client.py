"""
InForge Client — Local PostgreSQL
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Replaces the old Supabase REST client with direct SQLAlchemy async
queries against the local PostgreSQL database.

Usage:
    from app.mcp.inforge_client import inforge
    result = await inforge.save_incident(data)
"""

import logging
from typing import Any

from sqlalchemy import select, or_, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import async_session_factory
from app.database.models import HistoricalIncident

logger = logging.getLogger(__name__)


class InforgeClient:
    """Async PostgreSQL client for historical incident storage.

    Uses SQLAlchemy AsyncSession to query the local ``historical_incidents``
    table. Sessions are created internally from the shared session factory.
    """

    async def save_incident(self, data: dict[str, Any]) -> dict[str, Any]:
        """Insert a new HistoricalIncident row.

        Parameters
        ----------
        data : dict
            Must include ``title``, ``root_cause``, ``resolution``, ``summary``, ``user_id``.

        Returns
        -------
        dict
            The saved row as a dict, or ``{}`` on failure.
        """
        async with async_session_factory() as db:
            try:
                # Use raw SQL to insert so we don't need to modify models.py for user_id
                stmt = text("""
                    INSERT INTO historical_incidents (title, root_cause, resolution, summary, user_id)
                    VALUES (:title, :root_cause, :resolution, :summary, CAST(:user_id AS uuid))
                    RETURNING id, title, root_cause, resolution, summary, occurred_at
                """)
                result = await db.execute(stmt, {
                    "title": data.get("title", "Untitled"),
                    "root_cause": data.get("root_cause", ""),
                    "resolution": data.get("resolution", ""),
                    "summary": data.get("summary", ""),
                    "user_id": data.get("user_id")
                })
                await db.commit()
                row = result.fetchone()
                if row:
                    logger.info("inforge: saved historical incident %s", row[0])
                    return {
                        "id": str(row[0]),
                        "title": row[1],
                        "root_cause": row[2],
                        "resolution": row[3],
                        "summary": row[4],
                        "occurred_at": str(row[5]) if row[5] else None,
                    }
                return {}
            except Exception as exc:
                await db.rollback()
                logger.error("inforge: failed to save historical incident — %s", exc)
                return {}

    async def save_raw_incident(self, data: dict[str, Any]) -> bool:
        """Insert a full raw incident into the incidents table.
        
        This enables the frontend to query the incidents table directly using RLS.
        """
        import json
        async with async_session_factory() as db:
            try:
                stmt = text("""
                    INSERT INTO incidents (id, user_context, status, evidence_completeness, confidence_ceiling, rca, agent_outputs, created_at, user_id)
                    VALUES (:id, :user_context, :status, :evidence_completeness, :confidence_ceiling, CAST(:rca AS jsonb), CAST(:agent_outputs AS jsonb), CAST(:created_at AS timestamptz), CAST(:user_id AS uuid))
                    ON CONFLICT (id) DO UPDATE SET
                        status = EXCLUDED.status,
                        evidence_completeness = EXCLUDED.evidence_completeness,
                        confidence_ceiling = EXCLUDED.confidence_ceiling,
                        rca = EXCLUDED.rca,
                        agent_outputs = EXCLUDED.agent_outputs
                """)
                await db.execute(stmt, {
                    "id": data.get("id"),
                    "user_context": data.get("user_context", ""),
                    "status": data.get("status", "COMPLETE"),
                    "evidence_completeness": data.get("evidence_completeness", 0),
                    "confidence_ceiling": data.get("confidence_ceiling"),
                    "rca": json.dumps(data.get("rca", {})) if data.get("rca") else None,
                    "agent_outputs": json.dumps(data.get("agent_outputs", {})) if data.get("agent_outputs") else None,
                    "created_at": data.get("created_at"),
                    "user_id": data.get("user_id")
                })
                await db.commit()
                return True
            except Exception as exc:
                await db.rollback()
                logger.error("inforge: failed to save raw incident — %s", exc)
                return False

    async def get_incident(self, incident_id: str) -> dict[str, Any]:
        """Query HistoricalIncident by id.

        Returns
        -------
        dict
            The row as a dict, or ``{}`` if not found.
        """
        async with async_session_factory() as db:
            try:
                stmt = select(HistoricalIncident).where(
                    HistoricalIncident.id == incident_id
                )
                result = await db.execute(stmt)
                row = result.scalar_one_or_none()
                if not row:
                    return {}
                return {
                    "id": str(row.id),
                    "title": row.title,
                    "root_cause": row.root_cause,
                    "resolution": row.resolution,
                    "summary": row.summary,
                    "occurred_at": row.occurred_at.isoformat() if row.occurred_at else None,
                }
            except Exception as exc:
                logger.error("inforge: failed to get incident %s — %s", incident_id, exc)
                return {}

    async def search_incidents(
        self, query: str, limit: int = 5
    ) -> list[dict[str, Any]]:
        """Search HistoricalIncident table using ilike for case-insensitive match.

        Filters where title OR root_cause OR summary contains the query string.

        Returns
        -------
        list[dict]
            Up to ``limit`` matching rows.
        """
        async with async_session_factory() as db:
            try:
                pattern = f"%{query}%"
                stmt = (
                    select(HistoricalIncident)
                    .where(
                        or_(
                            HistoricalIncident.title.ilike(pattern),
                            HistoricalIncident.root_cause.ilike(pattern),
                            HistoricalIncident.summary.ilike(pattern),
                        )
                    )
                    .order_by(HistoricalIncident.occurred_at.desc())
                    .limit(limit)
                )
                result = await db.execute(stmt)
                rows = result.scalars().all()
                return [
                    {
                        "id": str(r.id),
                        "title": r.title,
                        "root_cause": r.root_cause,
                        "resolution": r.resolution,
                        "summary": r.summary,
                        "occurred_at": r.occurred_at.isoformat() if r.occurred_at else None,
                    }
                    for r in rows
                ]
            except Exception as exc:
                logger.error("inforge: search failed — %s", exc)
                return []


# ── Singleton instance — import this everywhere ────────────────────────
inforge = InforgeClient()
