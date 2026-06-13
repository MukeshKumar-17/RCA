"""
Local Incident Store
~~~~~~~~~~~~~~~~~~~~
In-memory store for incident records, replacing the InsForge dependency.
Persists for the lifetime of the server process.

Usage:
    from app.mcp.local_store import store

    store.save(record)
    record = store.get("some-id")
    matches = store.search("database connection")
"""

import logging
from typing import Any

logger = logging.getLogger(__name__)


class LocalIncidentStore:
    """Thread-safe in-memory incident store."""

    def __init__(self) -> None:
        self._data: dict[str, dict[str, Any]] = {}

    def save(self, record: dict[str, Any]) -> None:
        """Save an incident record (upsert by id)."""
        incident_id = record.get("id")
        if not incident_id:
            raise ValueError("Record must have an 'id' field.")
        self._data[incident_id] = record
        logger.info("local_store: saved incident %s", incident_id)

    def get(self, incident_id: str) -> dict[str, Any] | None:
        """Fetch a single incident by id."""
        return self._data.get(incident_id)

    def search(self, query: str, limit: int = 3) -> list[dict[str, Any]]:
        """Search incidents by matching keywords in user_context.

        Returns up to *limit* matching records sorted by creation time (newest first).
        """
        if not query or not query.strip():
            return []

        keywords = [w.lower() for w in query.strip().split() if len(w) > 2]
        if not keywords:
            return []

        results = []
        for record in self._data.values():
            ctx = (record.get("user_context") or "").lower()
            # Match if ANY keyword is found in the context
            if any(kw in ctx for kw in keywords):
                results.append(record)

        # Sort by created_at descending (newest first)
        results.sort(key=lambda r: r.get("created_at", ""), reverse=True)
        return results[:limit]

    def list_all(self, limit: int = 50) -> list[dict[str, Any]]:
        """Return all incidents (newest first)."""
        all_records = list(self._data.values())
        all_records.sort(key=lambda r: r.get("created_at", ""), reverse=True)
        return all_records[:limit]

    @property
    def count(self) -> int:
        return len(self._data)


# ── Singleton ──────────────────────────────────────────────────────────
store = LocalIncidentStore()
