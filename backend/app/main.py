"""
RootLens AI — FastAPI Application Entry-Point
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Creates the FastAPI app, wires CORS middleware, registers all API
routers under ``/api``, and runs ``Base.metadata.create_all`` on startup.

Run with::

    uvicorn app.main:app --reload
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.connection import init_db
from app.api.incidents import router as incidents_router
from app.api.upload import router as upload_router
from app.api.reports import router as reports_router
from app.api.copilot import router as copilot_router


# ── Lifespan (startup / shutdown) ──────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run one-time setup before the first request is served."""
    # Create tables that don't yet exist (idempotent)
    try:
        await init_db()
        print("Database initialized successfully.")
    except Exception as e:
        print(f"Warning: Could not connect to database ({e}). Proceeding with in-memory store.")
    yield
    # Shutdown logic (if any) goes here


# ── App factory ────────────────────────────────────────────────────────
app = FastAPI(
    title="RootLens AI",
    description="AI-powered Root Cause Analysis — Incident Investigation Agent",
    version="1.0.0",
    lifespan=lifespan,
)


# ── CORS ────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://yzb8iiq6.insforge.site",
        "https://rootlens.insforge.site",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routers ─────────────────────────────────────────────────────────────
app.include_router(incidents_router, prefix="/api")
app.include_router(upload_router, prefix="/api")
app.include_router(reports_router, prefix="/api")
app.include_router(copilot_router, prefix="/api")


# ── Health-check ────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    """Lightweight probe for load-balancers / container orchestrators."""
    return {"status": "ok", "service": "rootlens-ai"}

@app.get("/api/test-llm")
async def test_llm():
    from app.ai.gemini_client import gemini
    try:
        response = await gemini.generate("say hello in exactly two words")
        return {"status": "success", "response": response}
    except Exception as e:
        import traceback
        return {"status": "error", "error": str(e), "traceback": traceback.format_exc()}

@app.get("/api/test-db")
async def test_db():
    """Test database connectivity and insert/read from incidents table."""
    import json
    from sqlalchemy import text
    from app.database.connection import async_session_factory
    try:
        async with async_session_factory() as db:
            # Test read
            result = await db.execute(text("SELECT count(*) FROM incidents"))
            count = result.scalar()
            # Test write
            await db.execute(text("""
                INSERT INTO incidents (id, user_context, status, evidence_completeness, created_at)
                VALUES ('db-test-ping', 'DB connectivity test', 'TEST', 0, NOW())
                ON CONFLICT (id) DO UPDATE SET created_at = NOW()
            """))
            await db.commit()
            # Verify write
            result2 = await db.execute(text("SELECT id, status FROM incidents WHERE id = 'db-test-ping'"))
            row = result2.fetchone()
            # Cleanup
            await db.execute(text("DELETE FROM incidents WHERE id = 'db-test-ping'"))
            await db.commit()
            return {
                "status": "success",
                "incident_count": count,
                "write_test": "ok" if row else "failed",
                "db_url_prefix": str(db.bind.url)[:30] + "..."
            }
    except Exception as e:
        import traceback
        return {"status": "error", "error": str(e), "traceback": traceback.format_exc()}

@app.get("/api/test-save")
async def test_save():
    """Test the exact save_raw_incident flow."""
    import json, uuid
    from datetime import datetime, timezone
    from app.mcp.tools import save_incident_to_mcp
    test_id = str(uuid.uuid4())
    try:
        result = await save_incident_to_mcp(
            incident_id=test_id,
            user_context="Persistence test incident",
            status="COMPLETE",
            rca={"executive_summary": "Test RCA"},
            evidence_completeness=50,
            confidence_ceiling=80,
            agent_outputs={"test": True},
            user_id=None,
        )
        # Verify it's in the DB
        from sqlalchemy import text as sql_text
        from app.database.connection import async_session_factory
        async with async_session_factory() as db:
            r = await db.execute(sql_text("SELECT id, status FROM incidents WHERE id = :id"), {"id": test_id})
            row = r.fetchone()
            in_db = row is not None
            if in_db:
                await db.execute(sql_text("DELETE FROM incidents WHERE id = :id"), {"id": test_id})
                await db.commit()
        return {"save_result": result, "found_in_db": in_db, "test_id": test_id}
    except Exception as e:
        import traceback
        return {"status": "error", "error": str(e), "traceback": traceback.format_exc()}
