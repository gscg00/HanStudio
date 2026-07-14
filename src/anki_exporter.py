from __future__ import annotations

import csv
import hashlib
import html
import re
import shutil
import unicodedata
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

from .book_manager import Book
from .config import EXPORTS_DIR, MASTER_AUDIO_DIR
from .csv_loader import AudioRow, load_audio_csv
from .reports import write_report
from .technical_parser import parse_technical_file


ANKI_MODEL_ID = 1842037401
ANKI_MODEL_NAME = "HanStory Korean Audio Card"
FRONT_TEMPLATE = """<div class="audio">{{Audio}}</div>
<div class="korean">{{Korean}}</div>
<div class="speaker">{{Speaker}}</div>"""
BACK_TEMPLATE = """{{FrontSide}}
<hr>
<div class="spanish">{{Spanish}}</div>"""
CARD_CSS = """.card {
  font-family: Arial, sans-serif;
  font-size: 24px;
  text-align: center;
}
.korean {
  font-size: 36px;
  margin-top: 20px;
  line-height: 1.4;
}
.spanish {
  font-size: 24px;
  margin-top: 20px;
}
.speaker {
  color: #777;
  font-size: 16px;
  margin-top: 12px;
}
"""


@dataclass(frozen=True)
class AnkiExportOptions:
    deck_name: str
    include_audio: bool = True
    phrases_only: bool = True
    create_tsv: bool = True
    order: str = "technical"


@dataclass
class AnkiCardData:
    row: AudioRow
    lesson_number: int | None
    audio_source: Path | None = None
    media_name: str = ""

    @property
    def speaker(self) -> str:
        return self.row.speaker.strip() or "Narrador"

    @property
    def lesson(self) -> str:
        return (
            f"Lección {self.lesson_number:02d}"
            if self.lesson_number is not None
            else "Sin lección"
        )


@dataclass
class AnkiExportPlan:
    cards: list[AnkiCardData] = field(default_factory=list)
    missing_audio_ids: list[str] = field(default_factory=list)

    @property
    def found_audio_count(self) -> int:
        return sum(card.audio_source is not None for card in self.cards)


@dataclass(frozen=True)
class AnkiExportResult:
    export_dir: Path
    apkg_path: Path | None
    tsv_path: Path | None
    media_dir: Path | None
    report_path: Path
    cards_created: int
    audio_found: int
    missing_audio_ids: list[str]


def default_deck_name(book: Book) -> str:
    return f"HanStory::{book.code}::{book.title}"


def anki_export_dir(book: Book) -> Path:
    return EXPORTS_DIR / book.folder.name / "Anki"


def _id_in_filename(audio_id: str, filename: str) -> bool:
    pattern = rf"(?<![A-Za-z0-9_-]){re.escape(audio_id)}(?![A-Za-z0-9_-])"
    return re.search(pattern, filename, flags=re.IGNORECASE) is not None


def find_audio_for_card(book: Book, audio_id: str, lesson_number: int | None) -> Path | None:
    lesson_root = book.output_dir / "Lecciones"
    search_dirs: list[Path] = []
    if lesson_number is not None:
        search_dirs.append(lesson_root / f"Leccion_{lesson_number:02d}")
    if lesson_root.exists():
        search_dirs.extend(
            path for path in sorted(lesson_root.glob("Leccion_*")) if path not in search_dirs
        )
    for directory in search_dirs:
        if not directory.is_dir():
            continue
        for candidate in sorted(directory.glob("*.mp3")):
            if _id_in_filename(audio_id, candidate.name):
                return candidate
    master = MASTER_AUDIO_DIR / f"{audio_id}.mp3"
    return master if master.is_file() else None


def safe_media_name(audio_id: str, speaker: str) -> str:
    ascii_speaker = unicodedata.normalize("NFKD", speaker).encode("ascii", "ignore").decode()
    safe_speaker = re.sub(r"[^A-Za-z0-9_-]+", "_", ascii_speaker).strip("_")
    safe_id = re.sub(r"[^A-Za-z0-9_-]+", "_", audio_id).strip("_") or "audio"
    fallback_speaker = "Narrador" if not speaker.strip() or speaker == "Narrador" else "Personaje"
    return f"{safe_id}_{safe_speaker or fallback_speaker}.mp3"


def _ordered_rows(
    book: Book, rows: list[AudioRow], order: str
) -> list[tuple[AudioRow, int | None]]:
    rows_by_id = {row.audio_id.casefold(): row for row in rows}
    ordered: list[tuple[AudioRow, int | None]] = []
    used: set[str] = set()
    lessons: dict[int, list[str]] = {}
    if book.technical_path.exists():
        try:
            lessons = parse_technical_file(book.technical_path)
        except ValueError:
            lessons = {}
    lesson_by_id: dict[str, int] = {}
    for lesson_number, audio_ids in lessons.items():
        for audio_id in audio_ids:
            lesson_by_id.setdefault(audio_id.casefold(), lesson_number)
    if order == "technical":
        for lesson_number, audio_ids in lessons.items():
            for audio_id in audio_ids:
                key = audio_id.casefold()
                row = rows_by_id.get(key)
                if row is not None and key not in used:
                    ordered.append((row, lesson_number))
                    used.add(key)
    ordered.extend(
        (row, lesson_by_id.get(row.audio_id.casefold()))
        for row in rows
        if row.audio_id.casefold() not in used
    )
    return ordered


def build_anki_plan(book: Book, options: AnkiExportOptions) -> AnkiExportPlan:
    if not book.csv_path.exists():
        raise ValueError("Falta Audio_Master.csv en el libro seleccionado.")
    rows = load_audio_csv(book.csv_path)
    if options.phrases_only:
        rows = [row for row in rows if row.audio_type == "phrase"]
    if not rows:
        raise ValueError("No hay frases disponibles para crear tarjetas Anki.")
    plan = AnkiExportPlan()
    used_media_names: set[str] = set()
    for row, lesson_number in _ordered_rows(book, rows, options.order):
        source = (
            find_audio_for_card(book, row.audio_id, lesson_number)
            if options.include_audio
            else None
        )
        media_name = ""
        if source is not None:
            media_name = safe_media_name(row.audio_id, row.speaker.strip() or "Narrador")
            if media_name.casefold() in used_media_names:
                stem = Path(media_name).stem
                suffix = 2
                while f"{stem}_{suffix}.mp3".casefold() in used_media_names:
                    suffix += 1
                media_name = f"{stem}_{suffix}.mp3"
            used_media_names.add(media_name.casefold())
        elif options.include_audio:
            plan.missing_audio_ids.append(row.audio_id)
        plan.cards.append(AnkiCardData(row, lesson_number, source, media_name))
    return plan


def _stable_anki_id(value: str) -> int:
    digest = hashlib.sha256(value.encode("utf-8")).digest()
    return (int.from_bytes(digest[:4], "big") & 0x3FFFFFFF) + (1 << 30)


def _html_field(value: str) -> str:
    return html.escape(value).replace("\r\n", "\n").replace("\r", "\n").replace("\n", "<br>")


def _safe_tag(value: str) -> str:
    value = re.sub(r"\s+", "_", value.strip())
    return re.sub(r"[^\w-]+", "_", value, flags=re.UNICODE).strip("_") or "Sin_dato"


def _series_tag(code: str) -> str:
    match = re.match(r"(.+?)-S\d+E\d+$", code, flags=re.IGNORECASE)
    return _safe_tag(match.group(1)) if match else ""


def _tags_for(book: Book, card: AnkiCardData) -> list[str]:
    tags = ["HanStory", _safe_tag(book.code), _safe_tag(card.speaker)]
    series = _series_tag(book.code)
    if series:
        tags.append(series)
    tags.append(
        f"Leccion_{card.lesson_number:02d}"
        if card.lesson_number is not None
        else "Sin_leccion"
    )
    return tags


def _write_tsv(path: Path, cards: list[AnkiCardData]) -> None:
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.writer(handle, delimiter="\t", lineterminator="\n")
        writer.writerow(("Audio", "Korean", "Spanish", "Speaker", "Lesson", "AudioID"))
        for card in cards:
            audio = f"[sound:{card.media_name}]" if card.media_name else ""
            writer.writerow(
                (
                    audio,
                    card.row.text,
                    card.row.translation,
                    card.speaker,
                    card.lesson,
                    card.row.audio_id,
                )
            )


def create_anki_export(
    book: Book,
    options: AnkiExportOptions,
    plan: AnkiExportPlan | None = None,
) -> AnkiExportResult:
    plan = plan or build_anki_plan(book, options)
    deck_name = options.deck_name.strip()
    if not deck_name:
        raise ValueError("El nombre del mazo no puede estar vacío.")
    genanki = None
    apkg_error = ""
    try:
        import genanki as genanki_module

        genanki = genanki_module
    except ImportError:
        apkg_error = (
            "Falta la dependencia genanki. Cierra y vuelve a abrir HanStory Studio "
            "con conexión a internet para instalarla."
        )
        if not options.create_tsv:
            raise RuntimeError(apkg_error)

    export_dir = anki_export_dir(book)
    export_dir.mkdir(parents=True, exist_ok=True)
    media_dir = export_dir / "media_for_anki" if options.create_tsv else export_dir / ".anki_media"
    if media_dir.exists():
        shutil.rmtree(media_dir)
    media_files: list[str] = []
    media_mapping: list[str] = []
    if options.create_tsv or options.include_audio:
        media_dir.mkdir(parents=True)
    if options.include_audio:
        for card in plan.cards:
            if card.audio_source is None or not card.media_name:
                continue
            destination = media_dir / card.media_name
            shutil.copy2(card.audio_source, destination)
            media_files.append(str(destination))
            media_mapping.append(f"{card.audio_source.name} -> {card.media_name}")

    apkg_path: Path | None = None
    if genanki is not None:
        model = genanki.Model(
            ANKI_MODEL_ID,
            ANKI_MODEL_NAME,
            fields=[
                {"name": "Audio"},
                {"name": "Korean"},
                {"name": "Spanish"},
                {"name": "Speaker"},
                {"name": "Lesson"},
                {"name": "AudioID"},
            ],
            templates=[
                {"name": "HanStory Audio Card", "qfmt": FRONT_TEMPLATE, "afmt": BACK_TEMPLATE}
            ],
            css=CARD_CSS,
        )
        deck = genanki.Deck(_stable_anki_id(f"HanStory::{book.code}"), deck_name)
        for position, card in enumerate(plan.cards, start=1):
            audio = f"[sound:{card.media_name}]" if card.media_name else ""
            note = genanki.Note(
                model=model,
                fields=[
                    audio,
                    _html_field(card.row.text),
                    _html_field(card.row.translation),
                    _html_field(card.speaker),
                    card.lesson,
                    card.row.audio_id,
                ],
                tags=_tags_for(book, card),
                guid=genanki.guid_for(book.code, card.row.audio_id),
                due=position,
            )
            deck.add_note(note)

        apkg_path = export_dir / f"{book.folder.name}_Anki.apkg"
        package = genanki.Package(deck)
        package.media_files = media_files
        package.write_to_file(str(apkg_path))

    tsv_path: Path | None = None
    if options.create_tsv:
        tsv_path = export_dir / f"{book.folder.name}_Anki.tsv"
        _write_tsv(tsv_path, plan.cards)
    elif media_dir.exists():
        shutil.rmtree(media_dir)
        media_dir = None

    report_lines = [
        f"Proyecto: {book.code} — {book.title}",
        f"Fecha: {datetime.now().astimezone().isoformat(timespec='seconds')}",
        f"Nombre del mazo: {deck_name}",
        f"Total de frases: {len(plan.cards)}",
        f"Tarjetas creadas: {len(plan.cards)}",
        f"Audios encontrados: {plan.found_audio_count if options.include_audio else 0}",
        f"Audios faltantes: {len(plan.missing_audio_ids)}",
        f"Archivo .apkg creado: {apkg_path or 'No'}",
        f"Detalle .apkg: {apkg_error or 'Creado correctamente'}",
        f"Archivo TSV: {tsv_path or 'No solicitado'}",
        f"Carpeta media_for_anki: {media_dir if options.create_tsv else 'No solicitada'}",
        "",
        "IDs faltantes:",
        *(plan.missing_audio_ids or ["Ninguno"]),
        "",
        "Correspondencia de nombres de audio:",
        *(media_mapping or ["Ninguna"]),
    ]
    report_path = write_report(export_dir, "Anki_Export_Report.txt", report_lines)
    write_report(book.reports_dir, "Anki_Export_Report.txt", report_lines)
    return AnkiExportResult(
        export_dir=export_dir,
        apkg_path=apkg_path,
        tsv_path=tsv_path,
        media_dir=media_dir if options.create_tsv else None,
        report_path=report_path,
        cards_created=len(plan.cards),
        audio_found=plan.found_audio_count if options.include_audio else 0,
        missing_audio_ids=list(plan.missing_audio_ids),
    )
