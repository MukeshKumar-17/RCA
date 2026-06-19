"""
database package — public API
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Re-exports everything consumers need so they can write:

    from app.database import Base, engine, get_db, init_db
    from app.database import User, Incident, Upload, Report, HistoricalIncident
"""

# Connection primitives
from app.database.connection import (  # noqa: F401
    Base,
    engine,
    async_session_factory,
    get_db,
    init_db,
)

# ORM models
from app.database.models import (  # noqa: F401
    User,
    Incident,
    Upload,
    Report,
    HistoricalIncident,
    SeverityEnum,
    StatusEnum,
    FileTypeEnum,
)
