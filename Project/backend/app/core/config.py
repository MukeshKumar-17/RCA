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

    # ── Gemini AI ──────────────────────────────────────────────
    GEMINI_API_KEY: str = Field(
        ...,
        description="API key for Google Gemini",
    )
    GEMINI_MODEL: str = Field(
        default="gemini-2.5-flash",
        description="Gemini model identifier to use for RCA analysis",
    )

    # ── Legacy (kept for backward compat, no longer used) ────
    OPENROUTER_API_KEY: str = Field(
        default="",
        description="(Deprecated) API key for OpenRouter",
    )
    LLM_MODEL: str = Field(
        default="gemini-2.5-flash",
        description="(Deprecated) LLM model identifier",
    )

    # ── InsForge (Legacy — no longer used, kept for compat) ────────────
    MCP_INFORGE_URL: str = Field(
        default="",
        description="(Deprecated) InsForge backend base URL",
    )
    INFORGE_KEY: str = Field(
        default="",
        description="(Deprecated) InsForge anon/service key",
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

    # ── Gemini Multi-Key Pool ──────────────────────────────────────────
    GEMINI_API_KEY_1: str = Field(
        default="",
        description="Gemini API key #1 for round-robin pool",
    )
    GEMINI_API_KEY_2: str = Field(
        default="",
        description="Gemini API key #2 for round-robin pool",
    )
    GEMINI_API_KEY_3: str = Field(
        default="",
        description="Gemini API key #3 for round-robin pool",
    )

    # ── SendGrid Email ─────────────────────────────────────────────────
    SENDGRID_API_KEY: str = Field(
        default="",
        description="SendGrid API key for sending email reports",
    )
    EMAIL_FROM: str = Field(
        default="",
        description="Verified sender email address for SendGrid",
    )

@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (parsed once per process)."""
    return Settings()


# Convenience singleton — import this everywhere
settings: Settings = get_settings()
