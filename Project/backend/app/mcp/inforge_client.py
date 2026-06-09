"""
InsForge Client
~~~~~~~~~~~~~~~
Initialises a Supabase-compatible client pointed at the InsForge backend.
InsForge is wire-compatible with Supabase, so we use ``supabase-py`` directly.

Usage:
    from app.mcp.inforge_client import inforge
    data = inforge.table("incidents").select("*").execute()
"""

from supabase import create_client, Client

from app.core.config import settings


def _create_inforge_client() -> Client:
    """Build and return the Supabase-compatible client.

    Uses ``MCP_INFORGE_URL`` as the project URL and ``INFORGE_KEY`` as
    the anonymous / service-role key — both loaded from the ``.env`` file
    via :pydata:`app.core.config.settings`.
    """
    return create_client(
        supabase_url=settings.MCP_INFORGE_URL,
        supabase_key=settings.INFORGE_KEY,
    )


# ── Singleton instance — import this everywhere ────────────────────────
inforge: Client = _create_inforge_client()
