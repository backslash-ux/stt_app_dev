# backend/routers/upload.py

from backend.config import settings
from backend.utils.job_status import create_job, update_job, get_job
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException, Depends
from sqlalchemy.orm import Session
import os
import shutil
import uuid
from backend.utils.transcribe_utils import transcribe_audio_with_whisper
from backend.utils.dependencies import get_current_user
from backend.utils.youtube_utils import sanitize_filename
from backend.crud.history_crud import create_history_record
from backend.database import SessionLocal
from backend.models.user import User

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def process_transcription(file_path: str, user_id: int, db_session: Session, job_id: str):
    update_job(job_id, "processing")
    try:
        transcription_text = transcribe_audio_with_whisper(file_path)

        file_title = os.path.basename(file_path)
        public_url = f"http://{settings.APP_HOST}:{settings.APP_PORT}/uploads/{file_title}"
        create_history_record(db_session, user_id, "Upload",
                              public_url, transcription_text, title=file_title)

        update_job(job_id, "completed", transcription_text)

        print(f"✅ Transcription completed for {file_path}")

    except Exception as e:
        update_job(job_id, "failed")
        print(f"❌ Error during transcription: {e}")


@router.post("/upload-audio/")
async def upload_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        allowed_extensions = {".mp3", ".mp4", ".wav", ".webm"}
        ext = os.path.splitext(file.filename)[1]
        if ext.lower() not in allowed_extensions:
            raise HTTPException(
                status_code=400, detail="Unsupported file type")

        base_name = os.path.splitext(file.filename)[0]
        sanitized_base = sanitize_filename(base_name)
        new_filename = f"{sanitized_base}{ext}"
        file_path = os.path.join(UPLOAD_DIR, new_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        job_id = str(uuid.uuid4())
        create_job(job_id)
        background_tasks.add_task(
            process_transcription, file_path, current_user.id, db, job_id)

        return {
            "message": "File uploaded successfully, transcription is processing in the background!",
            "job_id": job_id
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/jobs/{job_id}/status")
async def get_job_status(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job ID not found")
    return job
