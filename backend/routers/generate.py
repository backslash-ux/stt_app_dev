# backend/routers/generate.py
from openai import OpenAI
from backend.config import settings  # Import settings before usage
from backend.utils.job_status import create_job, update_job
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.database import SessionLocal  # <-- Ensure correct import order
from backend.models.user import User
from backend.models.content_generation import ContentGeneration
from backend.models.transcription import TranscriptionHistory
from backend.utils.dependencies import get_current_user  # Import the new model

# Initialize OpenAI client with API key from settings
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


@router.post("/")
async def generate_article(
    request: ArticleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Register the job using the provided job_id
        create_job(request.job_id)
        update_job(request.job_id, "processing")

        prompt = f"""
        Anda adalah seorang jurnalis yang ahli dalam membuat artikel/berita/blog berdasarkan transkripsi. Berikut adalah detailnya:
        Transkripsi: {request.transcription}

        Gaya bahasa: {request.gaya_bahasa}
        Kepadatan informasi: {request.kepadatan_informasi}
        Sentimen: {request.sentimen}
        Gaya penyampaian: {request.gaya_penyampaian}
        Format output: {request.format_output}
        Gaya kutipan: {request.gaya_kutipan}
        Bahasa: {request.bahasa}
        Penyuntingan: {request.penyuntingan}

        Periksalah fakta-fakta, terutama nama yang salah harap dikoreksi. Tolong hasilkan artikel dalam format HTML yang kaya, dengan elemen-elemen seperti <h1>, <p>, <strong>, <em>, dan elemen HTML lainnya sesuai kebutuhan jika ada. Tidak diperlukan tag seperti <html>, <head>, <body> atau <style>.
        """

        if request.catatan_tambahan.strip():
            prompt += f"\nCatatan tambahan: {request.catatan_tambahan}\n"

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}]
        )
        article_content = response.choices[0].message.content.strip()

        transcription = db.query(TranscriptionHistory).filter(
            TranscriptionHistory.id == request.transcription_id
        ).first()
        content_generation_record = ContentGeneration(
            user_id=current_user.id,
            transcription_history_id=request.transcription_id,
            generated_content=article_content,
            title=transcription.title if transcription else None,
            config=request.config  # Store the user configuration
        )
        db.add(content_generation_record)
        db.commit()
        db.refresh(content_generation_record)

        # Update job status to completed with the generated article content
        update_job(request.job_id, "completed", article_content)

        return {"article": article_content, "content_id": content_generation_record.id}

    except Exception as e:
        update_job(request.job_id, "failed")
        raise HTTPException(status_code=500, detail=str(e))
