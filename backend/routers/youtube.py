# backend/routers/youtube.py

from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
import uuid
import yt_dlp
import json
from backend.utils.youtube_utils import download_youtube_audio
from backend.utils.job_status import create_job, update_job, get_job
from backend.utils.transcribe_utils import transcribe_audio_with_whisper
from backend.utils.dependencies import get_current_user
from backend.crud.history_crud import create_history_record
from backend.database import SessionLocal
from backend.models.user import User

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def process_youtube_transcription(youtube_url: str, user_id: int, db: Session, job_id: str):
    update_job(job_id, "processing", db=db)
    try:
        with yt_dlp.YoutubeDL({"quiet": True}) as ydl:
            info = ydl.extract_info(youtube_url, download=False)
            youtube_title = info.get("title") or youtube_url

        file_path = download_youtube_audio(youtube_url)
        result = transcribe_audio_with_whisper(file_path)
        transcription_text = result.get("text", "")
        segments = result.get("segments", None)

        create_history_record(
            db,
            user_id,
            "YouTube",
            youtube_url,
            transcription_text,
            title=youtube_title,
            segments=json.dumps(segments) if segments else None
        )

        update_job(job_id, "completed", transcript=transcription_text, db=db)
        print(f"✅ YouTube transcription completed for '{youtube_title}'")

    except Exception as e:
        update_job(job_id, "failed", db=db)
        print(f"❌ Error during YouTube transcription: {e}")


class YouTubeRequest(BaseModel):
    youtube_url: str


@router.post("/process-youtube/")
async def process_youtube(
    background_tasks: BackgroundTasks,
    request: YouTubeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        with yt_dlp.YoutubeDL({"quiet": True}) as ydl:
            info = ydl.extract_info(request.youtube_url, download=False)
            youtube_title = info.get("title") or request.youtube_url
    except Exception:
        youtube_title = request.youtube_url

    job_id = str(uuid.uuid4())
    create_job(job_id, current_user.id, f"YouTube: {youtube_title}", db)

    background_tasks.add_task(
        process_youtube_transcription,
        request.youtube_url,
        current_user.id,
        db,
        job_id
    )

    return {
        "message": "YouTube transcription started!",
        "job_id": job_id,
        "youtube_title": youtube_title,
    }


@router.get("/jobs/{job_id}/status")
# Add db dependency
async def get_youtube_job_status(job_id: str, db: Session = Depends(get_db)):
    job = get_job(job_id, db)  # Pass db
    if not job:
        raise HTTPException(status_code=404, detail="Job ID not found")
    return job
