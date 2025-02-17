# backend/models/transcription.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from backend.database import Base


class TranscriptionHistory(Base):
    __tablename__ = 'transcription_history'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    source = Column(String, nullable=False, default="YouTube")  # Default added
    video_url = Column(Text)
    title = Column(String, nullable=True)  # ✅ Added title field
    transcript = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    user = relationship("User", back_populates="transcriptions")
    content_generations = relationship(
        "ContentGeneration", back_populates="transcription_history")
