# backend/config.py
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
import logging

# Configure logging centrally
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Adjusts to your project root
BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    OPENAI_API_KEY: str
    APP_HOST: str
    APP_PORT: int
    DATABASE_URL: str
    SECRET_KEY: str
    CLIENT_HOST: str
    MAX_FILE_SIZE: int = 256 * 1024 * 1024  # 256 MB
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8"
    )


settings = Settings()

print("APP_HOST from settings:", settings.APP_HOST)
print("APP_PORT from settings:", settings.APP_PORT)
