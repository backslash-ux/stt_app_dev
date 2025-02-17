# backend/utils/transcribe_utils.py

import os
import requests
from backend.config import settings


def transcribe_audio_with_whisper(audio_file_path: str) -> str:
    api_key = settings.OPENAI_API_KEY
    url = "https://api.openai.com/v1/audio/transcriptions"
    headers = {
        "Authorization": f"Bearer {api_key}"
    }
    data = {
        "model": "whisper-1"
    }

    with open(audio_file_path, "rb") as f:
        files = {
            "file": (audio_file_path, f, "audio/mpeg")
        }
        response = requests.post(url, headers=headers, data=data, files=files)

    if response.status_code != 200:
        raise ValueError(
            f"Whisper API error {response.status_code}: {response.text}"
        )

    result = response.json()
    return result.get("text", "")
