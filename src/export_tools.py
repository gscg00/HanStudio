from __future__ import annotations

import shutil
from pathlib import Path

from .book_manager import Book
from .config import EXPORTS_DIR, MASTER_AUDIO_DIR
from .csv_loader import load_audio_csv


def export_book_zip(book: Book) -> Path:
    EXPORTS_DIR.mkdir(parents=True, exist_ok=True)
    archive = shutil.make_archive(str(EXPORTS_DIR / book.folder.name), "zip", book.folder)
    return Path(archive)


def export_book_audio_zip(book: Book) -> Path:
    staging = EXPORTS_DIR / f"{book.folder.name}_audios"
    if staging.exists():
        shutil.rmtree(staging)
    staging.mkdir(parents=True)
    for row in load_audio_csv(book.csv_path):
        source = MASTER_AUDIO_DIR / f"{row.audio_id}.mp3"
        if source.exists():
            shutil.copy2(source, staging / source.name)
    archive = shutil.make_archive(str(staging), "zip", staging)
    shutil.rmtree(staging)
    return Path(archive)


def export_book_html(book: Book) -> Path:
    source = book.folder / "book.html"
    if not source.exists():
        raise ValueError("Este libro no tiene book.html.")
    destination = EXPORTS_DIR / book.folder.name / "book.html"
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)
    return destination


# Puntos de extensión deliberados: export_epub() y export_pdf().
# La exportación completa de Anki vive en anki_exporter.py.
