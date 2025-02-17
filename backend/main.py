# backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from backend.config import settings
from backend.routers import youtube, generate, auth, history, upload, content_history
from backend.database import init_db
from backend.utils.job_status import get_job

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
        allow_origins=["*"],
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
    async def get_global_job_status(job_id: str):
        job = get_job(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job ID not found")
        return job

    return app


app = create_app()

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host=settings.APP_HOST,
                port=int(settings.APP_PORT))
