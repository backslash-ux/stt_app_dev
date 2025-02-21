# backend/models/job.py
from sqlalchemy import Column, String, Text, DateTime, func, ForeignKey
from backend.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(String, nullable=False, default="pending")
    title = Column(String, nullable=True)  # Add title field
    transcript = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime, nullable=True)
