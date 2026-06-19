"""
Upload Router
~~~~~~~~~~~~~
Lightweight endpoints that accept raw text or small files and return
the content as stored text. The frontend sends these text blobs to the
``/incidents`` endpoint when it's ready to run the analysis.

Routes
------
POST /upload/logs      — plain text or .log / .txt file
POST /upload/timeline  — plain text
POST /upload/diff      — plain text or .diff / .txt file
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, UploadFile, File, Form

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/upload", tags=["Upload"])

# Allowed file extensions per endpoint
_LOG_EXTENSIONS = {".log", ".txt"}
_DIFF_EXTENSIONS = {".diff", ".txt", ".patch"}


async def _read_file_or_text(
    text: Optional[str],
    file: Optional[UploadFile],
    allowed_exts: set[str] | None = None,
) -> str:
    """Return content from either *text* body or *file* upload.

    Exactly one of the two must be provided. If a file is supplied and
    ``allowed_exts`` is given, the extension is validated.
    """
    if text and file:
        raise HTTPException(
            status_code=400,
            detail="Provide either 'text' or 'file', not both.",
        )

    if text:
        return text.strip()

    if file:
        if allowed_exts:
            ext = "." + (file.filename or "").rsplit(".", 1)[-1].lower()
            if ext not in allowed_exts:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid file type '{ext}'. Allowed: {', '.join(sorted(allowed_exts))}",
                )
        content = await file.read()
        return content.decode("utf-8", errors="replace").strip()

    raise HTTPException(
        status_code=400,
        detail="Either 'text' or 'file' must be provided.",
    )


# ── POST /upload/logs ──────────────────────────────────────────────────
@router.post("/logs")
async def upload_logs(
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    """Accept raw log text or a .log/.txt file, return stored text."""
    content = await _read_file_or_text(text, file, _LOG_EXTENSIONS)
    logger.info("upload/logs: received %d characters", len(content))
    return {"type": "logs", "content": content, "length": len(content)}


# ── POST /upload/timeline ──────────────────────────────────────────────
@router.post("/timeline")
async def upload_timeline(
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    """Accept raw timeline text, return stored text."""
    content = await _read_file_or_text(text, file, None)
    logger.info("upload/timeline: received %d characters", len(content))
    return {"type": "timeline", "content": content, "length": len(content)}


# ── POST /upload/diff ──────────────────────────────────────────────────
@router.post("/diff")
async def upload_diff(
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    """Accept raw diff text or a .diff/.txt file, return stored text."""
    content = await _read_file_or_text(text, file, _DIFF_EXTENSIONS)
    logger.info("upload/diff: received %d characters", len(content))
    return {"type": "diff", "content": content, "length": len(content)}
