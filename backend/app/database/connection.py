"""
RootLens AI — Async Database Connection
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
SQLAlchemy async engine (asyncpg), session factory, FastAPI dependency,
and a startup helper that creates all tables from ORM metadata.
"""

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


# ── Engine ──────────────────────────────────────────────────────────────
# Convert postgresql:// → postgresql+asyncpg:// if the user supplied
# a plain DSN so asyncpg is always the driver.
_raw_url = settings.DATABASE_URL
if _raw_url.startswith("postgresql://"):
    _async_url = _raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif _raw_url.startswith("postgresql+asyncpg://"):
    _async_url = _raw_url
else:
    _async_url = _raw_url  # pass through; let SQLAlchemy raise if invalid

# asyncpg doesn't support 'sslmode' in the query string, it expects connect_args
connect_args = {}
if "?sslmode=require" in _async_url:
    _async_url = _async_url.replace("?sslmode=require", "")
    connect_args["ssl"] = "require"

engine = create_async_engine(
    _async_url,
    echo=False,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    connect_args=connect_args,
)


# ── Declarative Base ───────────────────────────────────────────────────
class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass


# ── Session factory ────────────────────────────────────────────────────
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# ── FastAPI dependency ──────────────────────────────────────────────────
async def get_db() -> AsyncSession:
    """Yield an async session and guarantee cleanup on exit."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ── Startup helper ──────────────────────────────────────────────────────
async def init_db() -> None:
    """Create all tables that don't yet exist (idempotent).

    Call this from the FastAPI lifespan / startup event:

        @app.on_event("startup")
        async def on_startup():
            await init_db()
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
