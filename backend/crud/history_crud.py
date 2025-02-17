# backend/crud/history_crud.py

from sqlalchemy.orm import Session
from backend.routers.history import TranscriptionHistory


def create_history_record(db: Session, user_id: int, source: str, video_url: str, transcript: str, title: str = None):
    history = TranscriptionHistory(
        user_id=user_id,
        source=source,
        video_url=video_url,
        transcript=transcript,
        title=title  # set title here
    )
    db.add(history)
    db.commit()
    db.refresh(history)
    return history


def get_user_history(db: Session, user_id: int):
    return db.query(TranscriptionHistory).filter(TranscriptionHistory.user_id == user_id).all()
