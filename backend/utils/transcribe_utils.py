# backend/utils/transcribe_utils.py

import os
import requests
import subprocess
from typing import List
from backend.config import settings

# Maximum allowed file size: 25 MB
MAX_SIZE = 25 * 1024 * 1024  # 25 MB in bytes


def transcribe_audio_with_whisper(audio_file_path: str) -> str:
    file_size = os.path.getsize(audio_file_path)
    if file_size <= MAX_SIZE:
        # File size is within the allowed limit; transcribe directly.
        return transcribe_single_file(audio_file_path)
    else:
        # File is too large; split it into smaller chunks and transcribe each one.
        chunk_paths = split_audio_file(
            audio_file_path, segment_duration=300)  # 300 seconds = 5 minutes
        transcripts = []
        for chunk in chunk_paths:
            transcript = transcribe_single_file(chunk)
            transcripts.append(transcript)
        # Join the chunk transcripts (you may add delimiters or timestamps if needed)
        return "\n".join(transcripts)


def transcribe_single_file(audio_file_path: str) -> str:
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
            "file": (os.path.basename(audio_file_path), f, "audio/mpeg")
        }
        response = requests.post(url, headers=headers, data=data, files=files)

    if response.status_code != 200:
        raise ValueError(
            f"Whisper API error {response.status_code}: {response.text}"
        )

    result = response.json()
    return result.get("text", "")


def split_audio_file(audio_file_path: str, segment_duration: int) -> List[str]:
    """
    Splits the audio file into segments of a specified duration (in seconds) using FFmpeg.
    Returns a list of file paths for the generated chunks.
    """
    output_dir = os.path.join(os.path.dirname(audio_file_path), "chunks")
    os.makedirs(output_dir, exist_ok=True)
    base_name = os.path.splitext(os.path.basename(audio_file_path))[0]
    output_pattern = os.path.join(output_dir, f"{base_name}_chunk_%03d.mp3")

    command = [
        "ffmpeg",
        "-i", audio_file_path,
        "-f", "segment",
        "-segment_time", str(segment_duration),
        "-c", "copy",
        output_pattern
    ]
    subprocess.run(command, check=True)

    # List and sort the generated chunk files.
    chunk_files = sorted(
        [os.path.join(output_dir, f) for f in os.listdir(output_dir)
         if f.startswith(f"{base_name}_chunk_") and f.endswith(".mp3")]
    )
    return chunk_files
