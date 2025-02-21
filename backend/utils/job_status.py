# backend/utils/job_status.py
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.models.job import Job


def create_job(job_id: str, user_id: str, title: str, db: Session):  # Add title parameter
    """Initialize a new job with 'pending' status in the database."""
    job = Job(id=job_id, user_id=user_id, status="pending", title=title)
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def update_job(job_id: str, status: str, transcript: str = None, db: Session = None):
    """Update job status and optionally transcript in the database."""
    if db is None:
        raise ValueError("Database session is required")
    job = db.query(Job).filter(Job.id == job_id).first()
    if job:
        job.status = status
        if transcript:
            job.transcript = transcript
        if status == "completed" and not job.completed_at:
            job.completed_at = func.now()
        db.commit()
        db.refresh(job)
    return job


def get_job(job_id: str, db: Session):
    """Retrieve job status from the database."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if job:
        return {
            "status": job.status,
            "transcript": job.transcript,
            "created_at": job.created_at.isoformat() if job.created_at else None,
            "completed_at": job.completed_at.isoformat() if job.completed_at else None,
            "title": job.title,  # Include title
        }
    return None
