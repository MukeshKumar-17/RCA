"""
Upload Schemas
~~~~~~~~~~~~~~
Pydantic models for file-upload responses.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.database.models import FileTypeEnum


class UploadResponse(BaseModel):
    """Serialised upload record returned after a successful file upload."""

    id: UUID
    incident_id: UUID
    file_type: FileTypeEnum
    file_path: str
    uploaded_at: datetime

    model_config = {"from_attributes": True}
