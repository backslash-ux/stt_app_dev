# backend/routers/content_history.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.database import SessionLocal
from backend.models.user import User
from backend.models.content_generation import ContentGeneration
from backend.models.transcription import TranscriptionHistory
from backend.utils.dependencies import get_current_user

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=List[dict])
def get_content_generation_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve generated content history for the logged-in user, sorted latest to oldest."""
    content_records = (
        db.query(ContentGeneration)
        .filter(ContentGeneration.user_id == current_user.id)
        .order_by(ContentGeneration.created_at.desc())  # Sort by latest
        .all()
    )

    # Instead of raising an error if no records are found, return an empty list
    if not content_records:
        return []

    return [
        {
            "id": record.id,
            "title": record.title,
            "transcription_history_id": record.transcription_history_id,
            "transcription_title": db.query(TranscriptionHistory.title)
            .filter(TranscriptionHistory.id == record.transcription_history_id)
            .scalar(),
            "generated_content": record.generated_content,
            "created_at": record.created_at,
            "config": record.config,
        }
        for record in content_records
    ]
