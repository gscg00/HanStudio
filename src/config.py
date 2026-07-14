from __future__ import annotations

import json
import os
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

from dotenv import load_dotenv, set_key


PROJECT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_DIR / "data"
LIBRARY_DIR = PROJECT_DIR / "library"
MASTER_AUDIO_DIR = LIBRARY_DIR / "master_audio"
BOOKS_DIR = LIBRARY_DIR / "books"
EXPORTS_DIR = LIBRARY_DIR / "exports"
CONFIG_FILE = DATA_DIR / "config.json"
VOICE_PROFILES_FILE = DATA_DIR / "voice_profiles.json"
DATABASE_FILE = DATA_DIR / "hanstory.db"
ENV_FILE = PROJECT_DIR / ".env"


@dataclass
class AppSettings:
    model_id: str = "eleven_multilingual_v2"
    stability: float = 0.5
    similarity_boost: float = 0.75
    style: float = 0.0
    use_speaker_boost: bool = True
    pause_seconds: float = 0.2
    safe_mode: bool = True
    rename_lesson_audio: bool = True


def ensure_app_structure() -> None:
    for path in (DATA_DIR, MASTER_AUDIO_DIR, BOOKS_DIR, EXPORTS_DIR):
        path.mkdir(parents=True, exist_ok=True)
    if not CONFIG_FILE.exists():
        save_settings(AppSettings())
    if not VOICE_PROFILES_FILE.exists():
        save_voice_profiles(
            {"default": {"voice_id": "", "description": "Voz por defecto"}}
        )


def load_settings() -> AppSettings:
    ensure_parent_only()
    if not CONFIG_FILE.exists():
        return AppSettings()
    raw = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
    allowed = AppSettings.__dataclass_fields__
    return AppSettings(**{key: value for key, value in raw.items() if key in allowed})


def save_settings(settings: AppSettings) -> None:
    ensure_parent_only()
    CONFIG_FILE.write_text(
        json.dumps(asdict(settings), ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def load_voice_profiles() -> dict[str, dict[str, str]]:
    ensure_parent_only()
    if not VOICE_PROFILES_FILE.exists():
        return {"default": {"voice_id": "", "description": "Voz por defecto"}}
    raw: Any = json.loads(VOICE_PROFILES_FILE.read_text(encoding="utf-8"))
    if not isinstance(raw, dict):
        raise ValueError("voice_profiles.json debe contener un objeto JSON.")
    profiles: dict[str, dict[str, str]] = {}
    for name, profile in raw.items():
        if isinstance(name, str) and isinstance(profile, dict):
            profiles[name] = {
                "voice_id": str(profile.get("voice_id", "")).strip(),
                "description": str(profile.get("description", "")).strip(),
            }
    profiles.setdefault("default", {"voice_id": "", "description": "Voz por defecto"})
    profiles.setdefault("Narrador", {"voice_id": "", "description": "Voz para audiolibro y escenas"})
    profiles.setdefault("Profesor", {"voice_id": "", "description": "Voz para explicaciones en español"})
    return profiles


def save_voice_profiles(profiles: dict[str, dict[str, str]]) -> None:
    ensure_parent_only()
    cleaned = {
        name.strip(): {
            "voice_id": profile.get("voice_id", "").strip(),
            "description": profile.get("description", "").strip(),
        }
        for name, profile in profiles.items()
        if name.strip()
    }
    cleaned.setdefault("default", {"voice_id": "", "description": "Voz por defecto"})
    cleaned.setdefault("Narrador", {"voice_id": "", "description": "Voz para audiolibro y escenas"})
    cleaned.setdefault("Profesor", {"voice_id": "", "description": "Voz para explicaciones en español"})
    VOICE_PROFILES_FILE.write_text(
        json.dumps(cleaned, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def voice_id_for(speaker: str, profiles: dict[str, dict[str, str]]) -> str:
    wanted = speaker.strip().casefold()
    for name, profile in profiles.items():
        if name.casefold() == wanted and profile.get("voice_id"):
            return profile["voice_id"].strip()
    return profiles.get("default", {}).get("voice_id", "").strip()


def get_api_key() -> str:
    load_dotenv(ENV_FILE, override=True)
    return os.getenv("ELEVENLABS_API_KEY", "").strip()


def save_api_key(api_key: str) -> None:
    if not ENV_FILE.exists():
        ENV_FILE.touch(mode=0o600)
    set_key(str(ENV_FILE), "ELEVENLABS_API_KEY", api_key.strip())
    try:
        ENV_FILE.chmod(0o600)
    except OSError:
        pass


def get_creative_api_key() -> str:
    load_dotenv(ENV_FILE, override=True)
    return os.getenv("CREATIVE_ENGINE_API_KEY", "").strip()


def save_creative_api_key(api_key: str) -> None:
    if not ENV_FILE.exists():
        ENV_FILE.touch(mode=0o600)
    set_key(str(ENV_FILE), "CREATIVE_ENGINE_API_KEY", api_key.strip())
    try:
        ENV_FILE.chmod(0o600)
    except OSError:
        pass


def get_openai_api_key() -> str:
    load_dotenv(ENV_FILE, override=True)
    return os.getenv("OPENAI_API_KEY", "").strip()


def save_openai_api_key(api_key: str) -> None:
    if not ENV_FILE.exists():
        ENV_FILE.touch(mode=0o600)
    set_key(str(ENV_FILE), "OPENAI_API_KEY", api_key.strip())
    try:
        ENV_FILE.chmod(0o600)
    except OSError:
        pass


def ensure_parent_only() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
