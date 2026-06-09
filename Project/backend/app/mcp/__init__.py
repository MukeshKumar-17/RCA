"""
mcp package — Local incident storage & search
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    from app.mcp import store, search_similar_incidents
"""

from app.mcp.local_store import store  # noqa: F401
from app.mcp.incident_search import (  # noqa: F401
    search_similar_incidents,
    search_by_text,
)
