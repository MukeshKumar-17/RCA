"""
RootLens AI — Application Configuration
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Pydantic BaseSettings class that loads every tuneable value from
environment variables (or a .env file at the project root).

Usage:
    from app.core.config import settings
    print(settings.DATABASE_URL)
"""

from pathlib import Path
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


# ── Resolve project root (.env lives next to the backend/ folder) ──────
_PROJECT_ROOT = Path(__file__).resolve().parents[3]  # backend/app/core → rootlens-ai


class Settings(BaseSettings):
    """Central configuration sourced from environment / .env file."""

    model_config = SettingsConfigDict(
        env_file=str(_PROJECT_ROOT / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # ── Database ────────────────────────────────────────────────────────
    DATABASE_URL: str = Field(
        ...,
        description="PostgreSQL connection string  (postgresql://user:pass@host:port/dbname)",
    )

    # ── OpenRouter / AI ──────────────────────────────────────────────
    OPENROUTER_API_KEY: str = Field(
        ...,
        description="API key for OpenRouter",
    )
    LLM_MODEL: str = Field(
        default="meta-llama/llama-3.3-70b-instruct:free",
        description="LLM model identifier to use for RCA analysis",
    )

    # ── InsForge (MCP backend) ──────────────────────────────────────────
    MCP_INFORGE_URL: str = Field(
        ...,
        description="InsForge backend base URL (https://<app>.<region>.insforge.app)",
    )
    INFORGE_KEY: str = Field(
        ...,
        description="InsForge anon/service key for supabase-py client",
    )

    # ── File storage ────────────────────────────────────────────────────
    UPLOAD_DIR: str = Field(
        default="./storage",
        description="Local directory for uploaded incident artefacts",
    )

    # ── Security ────────────────────────────────────────────────────────
    SECRET_KEY: str = Field(
        ...,
        description="Secret key for signing tokens / sessions",
    )


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (parsed once per process)."""
    return Settings()


# Convenience singleton — import this everywhere
settings: Settings = get_settings()
