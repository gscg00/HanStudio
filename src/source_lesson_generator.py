from __future__ import annotations

import csv
import html
import json
import re
import shutil
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path

from .book_manager import Book
from .project_config import ProjectConfig
from .reports import write_report
from .source_manager import SourceRecord, SourceSegment, review_summary


@dataclass(frozen=True)
class LessonGenerationOptions:
    level: str = "A1"
    style: str = "HanStory normal"
    mode: str = "extraer frases y explicar"
    no_full_translation: bool = False
    create_anki: bool = False
    allow_unreviewed_drafts: bool = False


@dataclass(frozen=True)
class LessonGenerationResult:
    output_dir: Path
    html_path: Path
    csv_path: Path
    technical_path: Path
    readme_path: Path
    anki_path: Path | None
    audio_count: int


def apply_generated_package(book: Book, output_dir: str | Path) -> Path:
    output = Path(output_dir)
    required = (output / "Audio_Master.csv", output / "Audios_Tecnico.txt", output / "lessons.html")
    if not all(path.is_file() for path in required):
        raise ValueError("La salida seleccionada no contiene un paquete HanStory completo.")
    backup = book.folder / "source_import_backups" / datetime.now().strftime("%Y%m%d_%H%M%S")
    backup.mkdir(parents=True, exist_ok=False)
    destinations = (
        (output / "Audio_Master.csv", book.csv_path),
        (output / "Audios_Tecnico.txt", book.technical_path),
        (output / "lessons.html", book.folder / "book.html"),
    )
    for _source, destination in destinations:
        if destination.exists():
            shutil.copy2(destination, backup / destination.name)
    for source, destination in destinations:
        shutil.copy2(source, destination)
    return backup


def _sentences(text: str) -> list[str]:
    lines = []
    for paragraph in re.split(r"\n+", text):
        lines.extend(re.split(r"(?<=[.!?。！？])\s+", paragraph.strip()))
    return [line.strip() for line in lines if line.strip()]


def _target_text(segment: SourceSegment, config: ProjectConfig) -> str:
    if segment.target_text.strip():
        return segment.target_text.strip()
    if config.source_language.casefold() == config.target_language.casefold():
        return segment.source_text.strip()
    raise ValueError(
        f"{segment.title}: falta el texto en {config.target_language}. "
        "Revísalo en Fuentes → Segmentos. HanStory no inventará una traducción sin un motor de IA."
    )


def generate_lessons_from_source(
    book: Book,
    record: SourceRecord,
    segments: list[SourceSegment],
    config: ProjectConfig,
    options: LessonGenerationOptions,
) -> LessonGenerationResult:
    if not segments:
        raise ValueError("Primero divide la fuente en segmentos.")
    allowed_statuses = {"Revisado por usuario", "Listo para aplicar", "Aplicado al proyecto"}
    unreviewed = [segment.title for segment in segments if segment.status not in allowed_statuses]
    if unreviewed and not options.allow_unreviewed_drafts:
        raise ValueError(
            "No se puede generar el paquete final: hay segmentos no revisados: "
            + ", ".join(unreviewed[:8])
            + ("…" if len(unreviewed) > 8 else "")
        )
    targets = [_target_text(segment, config) for segment in segments]
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output = book.folder / "generated_from_sources" / f"{record.source_id}_{timestamp}"
    output.mkdir(parents=True, exist_ok=False)
    rows: list[tuple[str, str, str, str, str, str]] = []
    lessons: list[tuple[int, list[str]]] = []
    for lesson_number, (segment, target) in enumerate(zip(segments, targets), start=1):
        ids = []
        for sequence, sentence in enumerate(_sentences(target), start=1):
            audio_id = f"SRC-{record.source_id.upper()}-{lesson_number:03d}-{sequence:03d}"
            translation = ""
            if not options.no_full_translation and len(_sentences(target)) == 1:
                translation = segment.source_text.strip()
            elif sequence == 1 and segment.key_translation.strip():
                translation = segment.key_translation.strip()
            rows.append((audio_id, "phrase", "Narrador", sentence, translation, sentence))
            ids.append(audio_id)
        lessons.append((lesson_number, ids))

    csv_path = output / "Audio_Master.csv"
    with csv_path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(("id", "type", "speaker_or_blank", "text", "translation_or_blank", "text_tts"))
        writer.writerows(rows)
    technical_path = output / "Audios_Tecnico.txt"
    technical_path.write_text(
        "\n\n".join(
            f"### Lección {number:02d}\nFrases: {', '.join(ids)}"
            for number, ids in lessons
        ) + "\n",
        encoding="utf-8",
    )
    html_path = output / "lessons.html"
    html_path.write_text(_build_html(book, segments, targets, config, options), encoding="utf-8")
    summary = review_summary(record, segments)
    readme_path = output / "README.txt"
    readme_path.write_text(
        "\n".join(
            [
                "PAQUETE HANSTORY GENERADO DESDE FUENTE",
                f"Proyecto: {book.code} — {book.title}",
                f"Fuente: {record.original_path}",
                f"Idiomas: {config.source_language} → {config.target_language}",
                f"Explicaciones: {config.explanation_language}",
                f"Nivel: {options.level}",
                f"Estilo: {options.style}",
                f"Modo: {options.mode}",
                f"Segmentos: {len(segments)}",
                f"Audios estimados: {len(rows)}",
                "",
                "Este paquete es un borrador revisado localmente. Importa Audio_Master.csv y",
                "Audios_Tecnico.txt al proyecto solo después de comprobar su contenido.",
                "La romanización y las explicaciones deben revisarse manualmente.",
                "",
                "Advertencias:",
                *(summary["warnings"] or ["Ninguna"]),
            ]
        ) + "\n",
        encoding="utf-8",
    )
    (output / "generation_config.json").write_text(
        json.dumps(
            {"project": asdict(config), "generation": asdict(options)},
            ensure_ascii=False,
            indent=2,
        ) + "\n",
        encoding="utf-8",
    )
    anki_path = _create_anki(output, book, rows, lessons) if options.create_anki else None
    report_lines = _creative_report_lines(book, record, segments, config, options, [])
    write_report(output, "Creative_Generation_Report.txt", report_lines)
    write_report(book.reports_dir, "Creative_Generation_Report.txt", report_lines)
    return LessonGenerationResult(
        output, html_path, csv_path, technical_path, readme_path, anki_path, len(rows)
    )


def _creative_report_lines(
    book: Book,
    record: SourceRecord,
    segments: list[SourceSegment],
    config: ProjectConfig,
    options: LessonGenerationOptions,
    errors: list[str],
) -> list[str]:
    return [
        f"Proyecto: {book.code} — {book.title}",
        f"Fuente usada: {record.original_path}",
        f"Idiomas: {config.source_language} → {config.target_language}",
        f"Idioma de explicación: {config.explanation_language}",
        f"Proveedor: {config.creative_provider_name}",
        f"Modo: {options.mode}",
        f"Nivel: {options.level}",
        f"Segmentos procesados: {len(segments)}",
        f"Segmentos revisados: {sum(s.status in {'Revisado por usuario', 'Listo para aplicar', 'Aplicado al proyecto'} for s in segments)}",
        f"Segmentos aplicados: {sum(s.status == 'Aplicado al proyecto' for s in segments)}",
        f"Borradores no revisados permitidos: {'Sí' if options.allow_unreviewed_drafts else 'No'}",
        "",
        "Advertencias:",
        *(["Se usaron borradores no revisados."] if options.allow_unreviewed_drafts else ["Ninguna"]),
        "",
        "Errores:",
        *(errors or ["Ninguno"]),
    ]


def write_creative_report(
    book: Book,
    record: SourceRecord,
    segments: list[SourceSegment],
    config: ProjectConfig,
    options: LessonGenerationOptions,
    errors: list[str] | None = None,
    output_dir: Path | None = None,
) -> Path:
    lines = _creative_report_lines(book, record, segments, config, options, errors or [])
    path = write_report(book.reports_dir, "Creative_Generation_Report.txt", lines)
    if output_dir is not None:
        write_report(output_dir, "Creative_Generation_Report.txt", lines)
    return path


def _build_html(
    book: Book,
    segments: list[SourceSegment],
    targets: list[str],
    config: ProjectConfig,
    options: LessonGenerationOptions,
) -> str:
    sections = []
    for number, (segment, target) in enumerate(zip(segments, targets), start=1):
        translation = ""
        if not options.no_full_translation:
            translation = f'<div class="translation"><h3>{html.escape(config.source_language)}</h3><p>{html.escape(segment.source_text)}</p></div>'
        key_content = segment.key_phrases.strip() or segment.key_translation.strip()
        key = (
            f'<div class="key"><h3>Frases clave</h3><p>{html.escape(key_content).replace(chr(10), "<br>")}</p></div>'
            if key_content else ""
        )
        explanation = html.escape(segment.explanation) if segment.explanation else "Pendiente de revisión manual."
        vocabulary = html.escape(segment.vocabulary).replace(chr(10), "<br>") if segment.vocabulary else "Pendiente de revisión."
        practice = html.escape(segment.mini_practice).replace(chr(10), "<br>") if segment.mini_practice else "Escribe una pregunta basada en esta unidad."
        romanization = '<p class="romanization">Romanización: pendiente de revisión.</p>' if config.romanization_enabled else ""
        sections.append(
            f'<section><h2>Lección {number:02d}: {html.escape(segment.title)}</h2>'
            f'<div class="target">{html.escape(target).replace(chr(10), "<br>")}</div>{romanization}'
            f'{translation}{key}<div class="explanation"><h3>Explicación ({html.escape(config.explanation_language)})</h3><p>{explanation}</p></div>'
            f'<h3>Vocabulario</h3><p>{vocabulary}</p>'
            f'<h3>Comprensión</h3><p>{practice}</p></section>'
        )
    notice = (
        "Usa esta función solo con material propio, material de dominio público o material que "
        "tengas derecho a transformar para uso personal. Para materiales comerciales, se "
        "recomienda generar lecciones basadas en fragmentos o escenas, no recrear libros completos."
    )
    return f"""<!doctype html><html lang="{html.escape(config.target_language)}"><head><meta charset="utf-8">
<title>{html.escape(book.title)}</title><style>body{{font-family:Arial,sans-serif;max-width:850px;margin:auto;padding:30px;line-height:1.6}}section{{border-bottom:1px solid #ddd;padding:20px 0}}.target{{font-size:1.65rem}}.translation{{color:#555}}.notice{{background:#fff3cd;padding:12px}}</style></head>
<body><h1>{html.escape(book.title)}</h1><p>{html.escape(options.style)} · {html.escape(options.level)}</p>
<p class="notice">{html.escape(notice)}</p>{''.join(sections)}</body></html>"""


def _create_anki(
    output: Path,
    book: Book,
    rows: list[tuple[str, str, str, str, str, str]],
    lessons: list[tuple[int, list[str]]],
) -> Path:
    try:
        import genanki
    except ImportError as exc:
        raise RuntimeError("No se puede crear Anki: falta genanki.") from exc
    model = genanki.Model(
        1842037401,
        "HanStory Korean Audio Card",
        fields=[{"name": name} for name in ("Audio", "Korean", "Spanish", "Speaker", "Lesson", "AudioID")],
        templates=[{"name": "Card 1", "qfmt": '<div class="korean">{{Korean}}</div><div>{{Speaker}}</div>', "afmt": '{{FrontSide}}<hr><div>{{Spanish}}</div>'}],
        css=".card{font-family:Arial;font-size:24px;text-align:center}.korean{font-size:36px}",
    )
    deck_id = (int.from_bytes(book.code.encode("utf-8")[:4].ljust(4, b"0"), "big") & 0x3FFFFFFF) + (1 << 30)
    deck = genanki.Deck(deck_id, f"HanStory::{book.code}::{book.title}::Source Draft")
    lesson_by_id = {audio_id: number for number, ids in lessons for audio_id in ids}
    for position, row in enumerate(rows, start=1):
        audio_id, _, speaker, text, translation, _ = row
        number = lesson_by_id[audio_id]
        deck.add_note(genanki.Note(
            model=model,
            fields=["", html.escape(text), html.escape(translation), speaker, f"Lección {number:02d}", audio_id],
            tags=["HanStory", book.code.replace(" ", "_"), f"Leccion_{number:02d}"],
            guid=genanki.guid_for(book.code, audio_id),
            due=position,
        ))
    path = output / "Anki_Draft.apkg"
    genanki.Package(deck).write_to_file(str(path))
    return path
