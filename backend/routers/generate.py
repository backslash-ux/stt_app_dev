# backend/routers/generate.py
from openai import OpenAI, OpenAIError
from backend.config import settings
from backend.utils.job_status import create_job, update_job
# Add BackgroundTasks
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.models.user import User
from backend.models.content_generation import ContentGeneration
from backend.models.transcription import TranscriptionHistory
from backend.utils.dependencies import get_current_user
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

client = OpenAI(api_key=settings.OPENAI_API_KEY)
router = APIRouter()


class ArticleRequest(BaseModel):
    job_id: str
    transcription_id: int
    transcription: str
    gaya_bahasa: str
    kepadatan_informasi: str
    sentimen: str
    gaya_penyampaian: str
    format_output: str
    gaya_kutipan: str
    bahasa: str
    penyuntingan: str
    catatan_tambahan: str = ""
    config: dict = {}


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def generate_article_background(
    job_id: str,
    transcription_id: int,
    transcription: str,
    gaya_bahasa: str,
    kepadatan_informasi: str,
    sentimen: str,
    gaya_penyampaian: str,
    format_output: str,
    gaya_kutipan: str,
    bahasa: str,
    penyuntingan: str,
    catatan_tambahan: str,
    config: dict,
    user_id: int,
    db: Session
):
    """Background task to generate article content."""
    update_job(job_id, "processing", db=db)
    try:
        prompt = f"""
        Anda adalah seorang jurnalis yang ahli dalam membuat artikel/berita/blog berdasarkan transkripsi. Berikut adalah detailnya:
        Transkripsi: {transcription}
        Gaya bahasa: {gaya_bahasa}
        Kepadatan informasi: {kepadatan_informasi}
        Sentimen: {sentimen}
        Gaya penyampaian: {gaya_penyampaian}
        Format output: {format_output}
        Gaya kutipan: {gaya_kutipan}
        Bahasa: {bahasa}
        Penyuntingan: {penyuntingan}
        Periksalah fakta-fakta, terutama nama yang salah harap dikoreksi. Tolong hasilkan artikel dalam format HTML yang kaya, dengan elemen-elemen seperti <h1>, <p>, <strong>, <em>, dan elemen HTML lainnya sesuai kebutuhan jika ada. Tidak diperlukan tag seperti <html>, <head>, <body> atau <style>.
        """
        if catatan_tambahan.strip():
            prompt += f"\nCatatan tambahan: {catatan_tambahan}\n"

        logger.info(f"Generating article for job {job_id}")
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}]
        )
        article_content = response.choices[0].message.content.strip()

        transcription = db.query(TranscriptionHistory).filter(
            TranscriptionHistory.id == transcription_id
        ).first()
        content_generation_record = ContentGeneration(
            user_id=user_id,
            transcription_history_id=transcription_id,
            generated_content=article_content,
            title=transcription.title if transcription else None,
            config=config
        )
        db.add(content_generation_record)
        db.commit()
        db.refresh(content_generation_record)

        update_job(job_id, "completed", article_content, db=db)
        logger.info(f"Completed job {job_id}")

    except OpenAIError as e:
        logger.error(f"OpenAI API error for job {job_id}: {str(e)}")
        update_job(job_id, "failed", db=db)
    except Exception as e:
        logger.error(f"Unexpected error for job {job_id}: {str(e)}")
        update_job(job_id, "failed", db=db)


@router.post("/")
async def generate_article(
    background_tasks: BackgroundTasks,  # Add BackgroundTasks
    request: ArticleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    transcription = db.query(TranscriptionHistory).filter(
        TranscriptionHistory.id == request.transcription_id
    ).first()
    title = transcription.title if transcription else "Untitled Content"
    create_job(request.job_id, current_user.id, f"Content: {title}", db)
    logger.info(f"Created job {request.job_id} for user {current_user.id}")

    # Offload generation to background task
    background_tasks.add_task(
        generate_article_background,
        request.job_id,
        request.transcription_id,
        request.transcription,
        request.gaya_bahasa,
        request.kepadatan_informasi,
        request.sentimen,
        request.gaya_penyampaian,
        request.format_output,
        request.gaya_kutipan,
        request.bahasa,
        request.penyuntingan,
        request.catatan_tambahan,
        request.config,
        current_user.id,
        db
    )

    return {
        "message": "Content generation started!",
        "job_id": request.job_id
    }
