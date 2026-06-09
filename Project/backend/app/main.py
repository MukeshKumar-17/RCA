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
    allow_origins=["*"],
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
