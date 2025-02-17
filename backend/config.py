# backend/config.py
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Adjusts to your project root
BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    OPENAI_API_KEY: str
    APP_HOST: str
    APP_PORT: int
    DATABASE_URL: str

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8"
    )


settings = Settings()

print("APP_HOST from settings:", settings.APP_HOST)
print("APP_PORT from settings:", settings.APP_PORT)
