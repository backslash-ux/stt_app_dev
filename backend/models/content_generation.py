# backend/models/content_generation.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSON
from backend.database import Base


class ContentGeneration(Base):
    __tablename__ = 'content_generation'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    transcription_history_id = Column(Integer, ForeignKey(
        'transcription_history.id'), nullable=False)
    title = Column(String, nullable=True)
    generated_content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now())

    # New column to store user config
    config = Column(JSON, nullable=True)

    user = relationship("User", back_populates="content_generations")
    transcription_history = relationship(
        "TranscriptionHistory", back_populates="content_generations")
