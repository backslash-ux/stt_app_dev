# backend/crud/history_crud.py
import json
from sqlalchemy.orm import Session
from backend.models.transcription import TranscriptionHistory


def create_history_record(
    db: Session,
    user_id: int,
    source: str,
    video_url: str,
    transcript: str,
    title: str = None,
    segments: str = None    # NEW parameter for segmentation data
):
    history = TranscriptionHistory(
        user_id=user_id,
        source=source,
        video_url=video_url,
        transcript=transcript,
        title=title,
        segments=segments      # Store segments (as a JSON string)
    )
    db.add(history)
    db.commit()
    db.refresh(history)
    return history
