"""
api package
"""

from app.api.upload import router as upload_router  # noqa: F401
from app.api.incidents import router as incidents_router  # noqa: F401
from app.api.reports import router as reports_router  # noqa: F401
