# backend/main.py
from fastapi import Depends, FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from backend.config import settings
from backend.routers import youtube, generate, auth, history, upload, content_history
from backend.database import init_db
from backend.utils.dependencies import get_db, get_current_user
from backend.utils.job_status import get_job
from backend.models.user import User
from backend.models.job import Job
from sqlalchemy.orm import Session
from typing import List

print("DEBUG: DATABASE_URL is:", settings.DATABASE_URL)


def create_app() -> FastAPI:
    app = FastAPI(
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json"
    )

    @app.on_event("startup")
    def on_startup():
        init_db()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.CLIENT_HOST],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router, prefix="/auth", tags=["Auth"])
    app.include_router(youtube.router, prefix="/youtube", tags=["YouTube"])
    app.include_router(generate.router, prefix="/generate", tags=["Generate"])
    app.include_router(history.router, prefix="/history", tags=["History"])
    app.include_router(upload.router, prefix="/upload", tags=["Upload"])
    app.include_router(content_history.router,
                       prefix="/content-history", tags=["Content History"])
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

    @app.get("/jobs/{job_id}/status")
    async def get_global_job_status(job_id: str, db: Session = Depends(get_db)):
        job = get_job(job_id, db)
        if not job:
            raise HTTPException(status_code=404, detail="Job ID not found")
        return job

    @app.get("/jobs/ongoing/", response_model=List[dict])
    async def get_ongoing_jobs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
        """Retrieve all ongoing jobs (pending or processing) for the authenticated user."""
        jobs = db.query(Job).filter(
            Job.user_id == current_user.id,
            Job.status.in_(["pending", "processing"])
        ).all()
        return [
            {
                "job_id": job.id,
                "status": job.status,
                "created_at": job.created_at.isoformat() if job.created_at else None,
                "completed_at": job.completed_at.isoformat() if job.completed_at else None,
                "title": job.title,  # Include title
            }
            for job in jobs
        ]

    return app


app = create_app()

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host=settings.APP_HOST,
                port=int(settings.APP_PORT))
