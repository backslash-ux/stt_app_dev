# backend/models/user.py

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)

    transcriptions = relationship(
        "TranscriptionHistory", back_populates="user")
    content_generations = relationship(
        "ContentGeneration", back_populates="user")
