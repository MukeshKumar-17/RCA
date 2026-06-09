"""
Upload Service
~~~~~~~~~~~~~~
File-system persistence and database record creation for uploaded
incident artefacts (logs, timelines, git diffs).
"""

import os
import uuid
from pathlib import Path

import aiofiles
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.database.models import Upload, FileTypeEnum
from app.schemas.upload import UploadResponse


# ── Allowed extensions ──────────────────────────────────────────────────
ALLOWED_EXTENSIONS: set[str] = {".log", ".txt", ".diff"}


def _validate_extension(filename: str) -> None:
    """Raise ``ValueError`` if the file extension is not in the allow-list."""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"File type '{ext}' is not allowed. "
            f"Accepted extensions: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )


# ── File-system helpers ────────────────────────────────────────────────
async def save_file(
    file: UploadFile,
    incident_id: uuid.UUID,
    file_type: FileTypeEnum,
) -> str:
    """Persist an uploaded file to disk.

    Directory layout::

        ./storage/<incident_id>/<file_type>/<original_filename>

    Creates intermediate directories if they don't exist.

    Parameters
    ----------
    file : UploadFile
        The incoming file from the request.
    incident_id : uuid.UUID
        Owning incident.
    file_type : FileTypeEnum
        Category sub-folder (log / timeline / diff).

    Returns
    -------
    str
        The relative path to the saved file (from the project root).

    Raises
    ------
    ValueError
        If the file extension is not in ``ALLOWED_EXTENSIONS``.
    """
    _validate_extension(file.filename)

    # Build target directory  →  ./storage/<incident_id>/<file_type>/
    target_dir = Path(settings.UPLOAD_DIR) / str(incident_id) / file_type.value
    target_dir.mkdir(parents=True, exist_ok=True)

    # Avoid collisions by prefixing with a short UUID fragment
    safe_name = f"{uuid.uuid4().hex[:8]}_{file.filename}"
    target_path = target_dir / safe_name

    # Stream-write the file asynchronously
    async with aiofiles.open(target_path, "wb") as out:
        while chunk := await file.read(1024 * 256):  # 256 KB chunks
            await out.write(chunk)

    return str(target_path)


# ── Database helpers ───────────────────────────────────────────────────
async def create_upload_record(
    db: AsyncSession,
    incident_id: uuid.UUID,
    file_type: FileTypeEnum,
    file_path: str,
) -> UploadResponse:
    """Insert an ``Upload`` row and return the serialised response.

    Parameters
    ----------
    db : AsyncSession
        Active database session (from ``get_db`` dependency).
    incident_id : uuid.UUID
        FK to the parent incident.
    file_type : FileTypeEnum
        Artefact category.
    file_path : str
        Path on disk where the file was saved.

    Returns
    -------
    UploadResponse
        Pydantic model ready for JSON serialisation.
    """
    upload = Upload(
        incident_id=incident_id,
        file_type=file_type,
        file_path=file_path,
    )
    db.add(upload)
    await db.flush()          # populate server-side defaults (id, uploaded_at)
    await db.refresh(upload)  # reload all columns

    return UploadResponse.model_validate(upload)
