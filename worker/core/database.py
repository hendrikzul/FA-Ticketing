"""
Database connection for Worker service.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from config import settings

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://aicop:aicop_secret@localhost:5432/aicop",
)

engine = create_engine(DATABASE_URL, pool_size=5, max_overflow=10)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db_session() -> Session:
    """Get a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db() -> Session:
    """Get a direct database session (non-generator)."""
    return SessionLocal()
