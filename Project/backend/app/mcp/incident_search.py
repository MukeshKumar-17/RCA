"""
Incident Search
~~~~~~~~~~~~~~~~
Queries the local PostgreSQL database to find past completed incidents
that match a given search string, with basic similarity scoring.

Usage:
    from app.mcp.incident_search import search_similar_incidents

    matches = search_similar_incidents("database connection pool exhaustion")
"""

import logging
from typing import Any

from app.mcp.inforge_client import inforge

logger = logging.getLogger(__name__)


async def search_similar_incidents(
    user_context: str,
    limit: int = 3,
) -> list[dict[str, Any]]:
    """Search past completed incidents by matching on *user_context* text.

    For each result, computes a basic similarity score based on how many
    words from the query appear in the result's root_cause field.

    Parameters
    ----------
    user_context : str
        Free-text search string (e.g. incident title or description).
    limit : int
        Maximum number of results to return (default 3).

    Returns
    -------
    list[dict]
        Up to *limit* matching rows, each with a ``similarity_score``.
    """
    if not user_context or not user_context.strip():
        return []

    try:
        # Extract meaningful keywords for search
        keywords = [w for w in user_context.split() if len(w) > 3]
        search_query = " ".join(keywords) if keywords else user_context

        results = await inforge.search_incidents(search_query, limit=limit * 2)

        # Compute similarity scores
        query_words = set(w.lower() for w in search_query.split() if len(w) > 2)
        total_query_words = len(query_words) if query_words else 1

        scored_results = []
        for r in results:
            root_cause_text = (r.get("root_cause") or "").lower()
            matched = sum(1 for w in query_words if w in root_cause_text)
            score = round((matched / total_query_words) * 100)

            scored_results.append({
                "id": r.get("id"),
                "title": r.get("title", ""),
                "root_cause": r.get("root_cause", ""),
                "resolution": r.get("resolution", ""),
                "summary": r.get("summary", ""),
                "similarity_score": score,
            })

        # Sort by similarity descending and limit
        scored_results.sort(key=lambda x: x["similarity_score"], reverse=True)
        return scored_results[:limit]

    except Exception as exc:
        logger.error("incident_search: search failed — %s", exc)
        return []


async def search_by_text(
    search_text: str,
    limit: int = 3,
) -> list[dict[str, Any]]:
    """Simpler text search — matches any keyword in the historical DB.

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
    try:
        return await inforge.search_incidents(search_text, limit=limit)
    except Exception as exc:
        logger.error("incident_search: search_by_text failed — %s", exc)
        return []
