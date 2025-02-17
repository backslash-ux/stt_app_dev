# backend/utils/job_status.py
job_status = {}  # Stores job_id -> status


def create_job(job_id: str):
    """Initialize a new job with 'pending' status."""
    job_status[job_id] = {"status": "pending", "transcript": None}


def update_job(job_id: str, status: str, transcript: str = None):
    """Update job status globally."""
    if job_id in job_status:
        job_status[job_id]["status"] = status
        if transcript:
            job_status[job_id]["transcript"] = transcript


def get_job(job_id: str):
    """Retrieve job status."""
    return job_status.get(job_id)
