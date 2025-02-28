# backend/routers/history.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.database import SessionLocal
from backend.models.transcription import TranscriptionHistory
from backend.models.content_generation import ContentGeneration
from backend.models.user import User
from backend.utils.dependencies import get_current_user

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=List[dict])
def get_my_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve transcription history for the logged-in user, sorted latest to oldest."""
    history_records = (
        db.query(TranscriptionHistory)
        .filter(TranscriptionHistory.user_id == current_user.id)
        .order_by(TranscriptionHistory.created_at.desc())
        .all()
    )

    if not history_records:
        return []

    return [
        {
            "id": record.id,
            "title": record.title if record.title else "Untitled Transcription",
            "source": record.source,
            "video_url": record.video_url,
            "transcript": record.transcript,
            "segments": record.segments,  # <-- Add this line
            "created_at": record.created_at
        }
        for record in history_records
    ]


@router.get("/content", response_model=List[dict])
def get_content_generation_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve content generation history for the logged-in user."""
    content_records = db.query(ContentGeneration).filter(
        ContentGeneration.user_id == current_user.id
    ).all()

    # Return an empty list if no content records are found instead of raising an error
    if not content_records:
        return []

    return [
        {
            "id": record.id,
            "title": record.title,
            "transcription_history_id": record.transcription_history_id,
            "generated_content": record.generated_content,
            "created_at": record.created_at,
            "config": record.config  # Include the user configuration
        }
        for record in content_records
    ]
