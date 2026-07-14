from __future__ import annotations

import re
import shutil
import unicodedata
from pathlib import Path

from .book_manager import Book
from .config import MASTER_AUDIO_DIR, load_settings
from .csv_loader import AudioRow, load_audio_csv
from .database import link_audio_to_book, replace_lesson_links
from .reports import ensure_reports, write_report
from .technical_parser import parse_technical_file


def clean_filename_part(value: str, limit: int = 70) -> str:
    value = re.sub(r"[\\/:*?\"<>|\n\r\t]+", " ", value)
    value = re.sub(r"\s+", " ", value).strip(" .")
    return (value or "Sin_texto")[:limit]


def speaker_folder(row: AudioRow) -> str:
    if row.audio_type == "word":
        return "Palabras_Importantes"
    name = row.speaker.strip() or "default"
    if name.casefold() == "niño de la aldea".casefold():
        return "Nino"
    ascii_name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    return re.sub(r"[^A-Za-z0-9_-]+", "_", ascii_name).strip("_") or "default"


def organized_filename(row: AudioRow) -> str:
    speaker = row.speaker.strip() or ("Palabra" if row.audio_type == "word" else "default")
    return f"{row.audio_id} - {clean_filename_part(speaker)} - {clean_filename_part(row.text)}.mp3"


def lesson_filename(row: AudioRow, lesson_number: int, sequence_number: int) -> str:
    speaker = "WORD" if row.audio_type == "word" else (row.speaker.strip() or "default")
    return (
        f"L{lesson_number:02d}-{sequence_number:02d} - {row.audio_id} - "
        f"{clean_filename_part(speaker)} - {clean_filename_part(row.text)}.mp3"
    )


def organize_book_audio(
    book: Book, *, rename_by_sequence: bool | None = None
) -> tuple[int, list[str]]:
    if rename_by_sequence is None:
        rename_by_sequence = load_settings().rename_lesson_audio
    rows = load_audio_csv(book.csv_path)
    row_by_id = {row.audio_id.casefold(): row for row in rows}
    lessons = parse_technical_file(book.technical_path)
    character_root = book.output_dir / "Por_Personaje"
    lesson_root = book.output_dir / "Lecciones"
    character_root.mkdir(parents=True, exist_ok=True)
    lesson_root.mkdir(parents=True, exist_ok=True)
    # Elimina copias anteriores para evitar duplicados al cambiar el orden o el formato.
    # Nunca toca library/master_audio.
    for old_lesson_dir in lesson_root.glob("Leccion_*"):
        if old_lesson_dir.is_dir():
            for old_audio in old_lesson_dir.glob("*.mp3"):
                old_audio.unlink()
    ensure_reports(book.reports_dir)
    copied = 0
    missing: list[str] = []

    for row in rows:
        source = MASTER_AUDIO_DIR / f"{row.audio_id}.mp3"
        if not source.exists():
            missing.append(f"Personaje: falta {row.audio_id}")
            continue
        destination_dir = character_root / speaker_folder(row)
        destination_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination_dir / organized_filename(row))
        link_audio_to_book(book.book_id, row.audio_id)
        copied += 1

    distribution: list[str] = []
    for lesson_number, audio_ids in lessons.items():
        destination_dir = lesson_root / f"Leccion_{lesson_number:02d}"
        destination_dir.mkdir(parents=True, exist_ok=True)
        distribution.append(f"Lección {lesson_number:02d}: {', '.join(audio_ids)}")
        for sequence_number, audio_id in enumerate(audio_ids, start=1):
            row = row_by_id.get(audio_id.casefold())
            source = MASTER_AUDIO_DIR / f"{audio_id}.mp3"
            if row is None:
                missing.append(f"Lección {lesson_number:02d}: {audio_id} no está en el CSV")
            elif not source.exists():
                missing.append(f"Lección {lesson_number:02d}: falta {audio_id}.mp3")
            else:
                filename = (
                    lesson_filename(row, lesson_number, sequence_number)
                    if rename_by_sequence
                    else organized_filename(row)
                )
                shutil.copy2(source, destination_dir / filename)
                copied += 1

    replace_lesson_links(book.book_id, lessons)
    write_report(book.reports_dir, "audios_faltantes.txt", missing)
    write_report(book.reports_dir, "distribucion_por_leccion.txt", distribution)
    return copied, missing
