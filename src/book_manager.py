from __future__ import annotations

import json
import re
import shutil
import unicodedata
from dataclasses import dataclass
from pathlib import Path

from .config import BOOKS_DIR
from .database import create_book_record, get_book_record, list_book_records


@dataclass(frozen=True)
class Book:
    book_id: int
    code: str
    title: str
    level: str
    description: str
    folder: Path

    @property
    def csv_path(self) -> Path:
        return self.folder / "Audio_Master.csv"

    @property
    def technical_path(self) -> Path:
        return self.folder / "Audios_Tecnico.txt"

    @property
    def output_dir(self) -> Path:
        return self.folder / "output"

    @property
    def reports_dir(self) -> Path:
        return self.output_dir / "Reports"

    @property
    def project_config_path(self) -> Path:
        return self.folder / "project_config.json"


def safe_folder_name(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    cleaned = re.sub(r"[^A-Za-z0-9_-]+", "_", normalized).strip("_")
    return cleaned or "Libro"


def _from_record(record) -> Book:
    return Book(
        book_id=int(record["id"]), code=record["code"], title=record["title"],
        level=record["level"], description=record["description"],
        folder=BOOKS_DIR / record["folder_name"],
    )


def create_book(title: str, code: str, level: str = "", description: str = "") -> Book:
    title, code = title.strip(), code.strip()
    if not title or not code:
        raise ValueError("Título y código interno son obligatorios.")
    folder_name = safe_folder_name(f"{code}_{title}")
    folder = BOOKS_DIR / folder_name
    if folder.exists():
        raise ValueError(f"Ya existe la carpeta del libro: {folder_name}")
    folder.mkdir(parents=True)
    (folder / "output" / "Por_Personaje").mkdir(parents=True)
    (folder / "output" / "Lecciones").mkdir(parents=True)
    (folder / "output" / "Reports").mkdir(parents=True)
    try:
        book_id = create_book_record(code, title, level.strip(), description.strip(), folder_name)
    except Exception:
        shutil.rmtree(folder)
        raise
    metadata = {
        "book_id": book_id, "code": code, "title": title,
        "level": level.strip(), "description": description.strip(),
    }
    (folder / "book.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (folder / "project_config.json").write_text(
        json.dumps(
            {
                "elevenlabs_model_id": "eleven_multilingual_v2",
                "elevenlabs_model_name": "Eleven Multilingual v2",
                "acting_mode_enabled": False,
                "allow_default_voice": False,
                "character_voice_map": {},
                "source_language": "Korean",
                "target_language": "Korean",
                "explanation_language": "Spanish",
                "romanization_enabled": False,
                "script_type": "Auto",
                "creative_provider_name": "Manual / Placeholder",
                "creative_model_name": "",
                "creative_temperature": 0.3,
                "creative_max_tokens": 4000,
                "allow_unreviewed_drafts": False,
                "no_full_translation_enabled": False,
                "podcast_id_prefix": "",
                "podcast_pause_seconds": 1,
                "podcast_output_mode": "conservar audios separados",
                "podcast_audio_output_mode": "Un audio por lección",
                "podcast_generate_lines_and_joined": True,
                "podcast_use_multispeaker_v3": False,
                "podcast_multispeaker_max_chars": 4500,
                "podcast_word_breakdown_enabled": True,
                "podcast_active_listening_enabled": False,
                "podcast_active_preset": "Repite conmigo",
                "podcast_phrase_pause_ms": 1000,
                "podcast_repeat_pause_ms": 3000,
                "podcast_key_phrase_repetitions": 2,
                "podcast_include_slow_version": True,
                "podcast_include_natural_version": True,
                "podcast_include_brief_translation": True,
                "podcast_include_repeat_instruction": True,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    return Book(book_id, code, title, level.strip(), description.strip(), folder)


def list_books() -> list[Book]:
    return [_from_record(record) for record in list_book_records()]


def get_book(book_id: int) -> Book:
    record = get_book_record(book_id)
    if record is None:
        raise ValueError("El libro seleccionado ya no existe.")
    return _from_record(record)


def import_book_file(book: Book, source: str | Path, kind: str) -> Path:
    names = {
        "csv": "Audio_Master.csv", "technical": "Audios_Tecnico.txt",
        "html": "book.html", "cover": "cover" + Path(source).suffix.lower(),
    }
    if kind not in names:
        raise ValueError(f"Tipo de archivo desconocido: {kind}")
    source_path = Path(source).resolve()
    if not source_path.is_file():
        raise ValueError("El archivo seleccionado no existe.")
    destination = book.folder / names[kind]
    if source_path != destination.resolve():
        shutil.copy2(source_path, destination)
    return destination
