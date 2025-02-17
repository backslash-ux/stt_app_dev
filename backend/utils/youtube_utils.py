import os
import re
import yt_dlp


def sanitize_filename(filename: str) -> str:
    """
    Replaces all non-alphanumeric, non-underscore, non-dash characters 
    with underscores and strips trailing underscores.
    """
    return re.sub(r'[^a-zA-Z0-9_-]', '_', filename).strip('_')


def download_youtube_audio(youtube_url: str, output_path: str = "downloads") -> str:
    """
    Downloads the YouTube audio as an MP3 using yt-dlp, ensuring the
    final file has a proper `.mp3` extension (rather than `_mp3`).
    Returns the full path to the downloaded .mp3 file.

    If the environment variable YOUTUBE_COOKIES is set to a file path,
    that cookies file will be used for authentication.
    """
    # Base yt_dlp options
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': f"{output_path}/%(title)s.%(ext)s",
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
    }

    # If a cookies file is provided via the environment variable, add it to options
    youtube_cookies = os.environ.get("YOUTUBE_COOKIES")
    if youtube_cookies and os.path.exists(youtube_cookies):
        ydl_opts["cookiefile"] = youtube_cookies

    os.makedirs(output_path, exist_ok=True)

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(youtube_url, download=True)
        # e.g., "downloads/Menperin Kasih Bocoran Soal Pabrik Mobil Nasional.webm"
        raw_filename = ydl.prepare_filename(info)

    # Split the raw filename into (base, extension)
    base, ext = os.path.splitext(raw_filename)

    # If the postprocessor left .webm or .m4a, force ".mp3"
    if ext.lower() in (".webm", ".m4a"):
        ext = ".mp3"

    # Extract just the base name (no directories), then sanitize that portion
    base_name_only = os.path.basename(base)
    sanitized_base = sanitize_filename(base_name_only)

    # Rebuild the final filename with sanitized base + ".mp3"
    final_filename = f"{sanitized_base}{ext}"
    final_path = os.path.join(output_path, final_filename)

    # Attempt to rename the file from its raw name to the new sanitized name
    if os.path.exists(raw_filename):
        os.rename(raw_filename, final_path)
    else:
        # The file may have been directly converted to .mp3
        mp3_version = f"{base}.mp3"
        if os.path.exists(mp3_version):
            os.rename(mp3_version, final_path)
        else:
            raise FileNotFoundError(
                f"Downloaded file not found: {raw_filename} or {mp3_version}"
            )

    return final_path
