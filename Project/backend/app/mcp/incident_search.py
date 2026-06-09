"""
Incident Search (Local Store)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Queries the local in-memory store to find past completed incidents
that match a given user context string.

Usage:
    from app.mcp.incident_search import search_similar_incidents

    matches = search_similar_incidents("database connection pool exhaustion")
"""

import logging
from typing import Any

from app.mcp.local_store import store

logger = logging.getLogger(__name__)


async def search_similar_incidents(
    user_context: str,
    limit: int = 3,
) -> list[dict[str, Any]]:
    """Search past completed incidents by matching on *user_context* text.

    Parameters
    ----------
    user_context : str
        Free-text search string (e.g. incident title or description).
    limit : int
        Maximum number of results to return (default 3).

    Returns
    -------
    list[dict]
        Up to *limit* matching rows.
    """
    return store.search(user_context, limit=limit)


async def search_by_text(
    search_text: str,
    limit: int = 3,
) -> list[dict[str, Any]]:
    """Simpler text search — matches any single keyword in user_context.

    Parameters
    ----------
    search_text : str
        Free-text to search for.
    limit : int
        Maximum results (default 3).

    Returns
    -------
    list[dict]
        Matching rows.
    """
    return store.search(search_text, limit=limit)
