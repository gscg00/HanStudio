#!/usr/bin/env python3
"""Genera un paquete HanStory desde texto autorizado y revisado a mano.

El importador no descarga ni extrae texto de sitios externos. El JSON de entrada
debe contener el OCR, la versión corregida por una persona y una referencia a
la fuente de cada línea. La salida queda lista para incorporarse a un libro;
el reproductor puede usar TTS del navegador mientras no haya MP3.
"""

from __future__ import annotations

import argparse
import csv
import difflib
import html
import json
import re
import shutil
from pathlib import Path


SAFE_CODE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*$")


def _text(value: object) -> str:
    return str(value or "").strip()


def _slug(value: str) -> str:
    value = re.sub(r"[^A-Za-z0-9]+", "_", value).strip("_")
    return value or "Book"


def _fail(message: str) -> None:
    raise ValueError(message)


def load_and_validate(path: Path) -> dict:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        _fail(f"No se pudo leer el JSON de entrada: {exc}")
    if not isinstance(data, dict):
        _fail("La raíz del JSON debe ser un objeto.")

    rights = data.get("rights")
    if not isinstance(rights, dict) or rights.get("confirmed") is not True:
        _fail("Falta rights.confirmed=true: no se genera un paquete sin confirmar autorización.")
    if not _text(rights.get("holder")) or not _text(rights.get("basis")):
        _fail("rights.holder y rights.basis son obligatorios para dejar trazabilidad.")

    code = _text(data.get("code"))
    if not SAFE_CODE.fullmatch(code):
        _fail("code debe contener solo letras, números, punto, guion o guion bajo.")
    title = _text(data.get("title"))
    if not title:
        _fail("Falta title.")
    target_language = _text(data.get("target_language")) or "German"
    if target_language.casefold() != "german":
        _fail("Este importador está reservado para paquetes de alemán (target_language=German).")

    chapters = data.get("chapters")
    if not isinstance(chapters, list) or not chapters:
        _fail("chapters debe ser una lista no vacía.")

    seen_ids: set[str] = set()
    normalized_chapters = []
    report_lines = []
    for chapter_index, chapter in enumerate(chapters, 1):
        if not isinstance(chapter, dict):
            _fail(f"El capítulo {chapter_index} no es un objeto.")
        try:
            number = int(chapter.get("number", chapter_index))
        except (TypeError, ValueError):
            _fail(f"Número de capítulo inválido en la posición {chapter_index}.")
        if number < 1:
            _fail(f"El capítulo {chapter_index} debe tener un número positivo.")
        chapter_title = _text(chapter.get("title")) or f"Capítulo {number:02d}"
        tracks = chapter.get("tracks")
        if not isinstance(tracks, list) or not tracks:
            _fail(f"El capítulo {number} no tiene tracks.")
        normalized_tracks = []
        for sequence, track in enumerate(tracks, 1):
            if not isinstance(track, dict):
                _fail(f"El track {number}/{sequence} no es un objeto.")
            track_id = _text(track.get("id"))
            if not track_id or track_id.casefold() in seen_ids:
                _fail(f"ID ausente o duplicado en el capítulo {number}, posición {sequence}.")
            seen_ids.add(track_id.casefold())
            ocr_text = _text(track.get("ocr_text"))
            reviewed_text = _text(track.get("reviewed_text"))
            translation = _text(track.get("translation"))
            source_ref = _text(track.get("source_ref"))
            track_type = _text(track.get("type")) or "phrase"
            if track_type not in {"phrase", "word"}:
                _fail(f"{track_id}: type debe ser phrase o word.")
            if not ocr_text or not reviewed_text:
                _fail(f"{track_id}: ocr_text y reviewed_text son obligatorios.")
            if not translation:
                _fail(f"{track_id}: falta translation en español.")
            if not source_ref:
                _fail(f"{track_id}: falta source_ref para poder auditar la línea.")
            if track.get("manual_reviewed") is not True:
                _fail(f"{track_id}: manual_reviewed debe ser true; el OCR no se acepta sin revisión humana.")
            speaker = _text(track.get("speaker"))
            changed = ocr_text != reviewed_text
            similarity = round(difflib.SequenceMatcher(None, ocr_text, reviewed_text).ratio(), 4)
            report_lines.append(
                {
                    "id": track_id,
                    "chapter": number,
                    "sequence": sequence,
                    "speaker": speaker,
                    "type": track_type,
                    "source_ref": source_ref,
                    "ocr_text": ocr_text,
                    "reviewed_text": reviewed_text,
                    "changed": changed,
                    "similarity": similarity,
                    "diff": list(difflib.ndiff(ocr_text, reviewed_text)) if changed else [],
                }
            )
            normalized_tracks.append(
                {
                    "id": track_id,
                    "speaker": speaker,
                    "type": track_type,
                    "section": "vocabulary" if track_type == "word" else "scene",
                    "text": reviewed_text,
                    "translation": translation,
                }
            )
        normalized_chapters.append({"number": number, "title": chapter_title, "summary": _text(chapter.get("summary")), "tracks": normalized_tracks})

    return {
        "code": code,
        "title": title,
        "subtitle": _text(data.get("subtitle")) or "Alemán",
        "description": _text(data.get("description")),
        "explanation_language": _text(data.get("explanation_language")) or "Spanish",
        "rights": {"holder": _text(rights["holder"]), "basis": _text(rights["basis"])},
        "chapters": normalized_chapters,
        "report_lines": report_lines,
    }


def _write_csv(destination: Path, chapters: list[dict]) -> None:
    with destination.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["id", "type", "speaker_or_blank", "text", "translation_or_blank"])
        writer.writeheader()
        for chapter in chapters:
            for track in chapter["tracks"]:
                writer.writerow({"id": track["id"], "type": track["type"], "speaker_or_blank": track["speaker"], "text": track["text"], "translation_or_blank": track["translation"]})


def _write_technical(destination: Path, chapters: list[dict]) -> None:
    lines = ["# Orden técnico generado desde texto autorizado y revisión humana", ""]
    for chapter in chapters:
        lines += [f"## Lección {chapter['number']}: {chapter['title']}", ""]
        for track in chapter["tracks"]:
            speaker = f" [{track['speaker']}]" if track["speaker"] else ""
            lines.append(f"{track['id']}{speaker} {track['text']}")
        lines.append("")
    destination.write_text("\n".join(lines), encoding="utf-8")


def _write_html(destination: Path, book: dict) -> None:
    e = html.escape
    body = [
        "<!doctype html><html lang='es'><head><meta charset='utf-8'>",
        "<meta name='viewport' content='width=device-width,initial-scale=1'>",
        f"<title>{e(book['title'])}</title>",
        "<style>body{font-family:system-ui,sans-serif;line-height:1.6;max-width:900px;margin:auto;padding:2rem;background:#fbfaf7;color:#222}.lesson{margin-top:3rem}.box{background:#fff;border:1px solid #ddd;border-radius:12px;padding:1rem;margin:1rem 0}.de{font-size:1.08em;font-weight:600}.es{color:#555}.id{font-size:.8em;color:#777}</style></head><body>",
        f"<h1>{e(book['title'])}</h1><p>{e(book['description'])}</p>",
    ]
    for chapter in book["chapters"]:
        body.append(f"<section class='lesson'><h2>Capítulo {chapter['number']:02d} — {e(chapter['title'])}</h2>")
        if chapter["summary"]:
            body.append(f"<p class='box'>{e(chapter['summary'])}</p>")
        body.append("<div class='box'><h3>Frases revisadas</h3>")
        for track in chapter["tracks"]:
            speaker = f"<strong>{e(track['speaker'])}</strong><br>" if track["speaker"] else ""
            body.append(f"<p>{speaker}<span class='de' lang='de'>{e(track['text'])}</span><br><span class='es'>{e(track['translation'])}</span><br><span class='id'>{e(track['id'])}</span></p>")
        body.append("</div></section>")
    body.append("</body></html>")
    destination.write_text("".join(body), encoding="utf-8")


def build_package(source: Path, output_root: Path) -> Path:
    book = load_and_validate(source)
    folder = output_root / f"{book['code']}_{_slug(book['title'])}"
    if folder.exists():
        _fail(f"La salida ya existe; elige otra ruta o elimínala manualmente: {folder}")
    folder.mkdir(parents=True)
    try:
        (folder / "book.json").write_text(json.dumps({"code": book["code"], "title": book["title"], "level": book["subtitle"], "description": book["description"]}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        (folder / "project_config.json").write_text(json.dumps({"elevenlabs_model_id": "eleven_multilingual_v2", "elevenlabs_model_name": "Eleven Multilingual v2", "elevenlabs_language_code": "de", "web_tts_fallback_enabled": True, "source_language": "German", "target_language": "German", "explanation_language": book["explanation_language"], "allow_unreviewed_drafts": False, "character_voice_map": {}}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        _write_csv(folder / "Audio_Master.csv", book["chapters"])
        _write_technical(folder / "Audios_Tecnico.txt", book["chapters"])
        _write_html(folder / "book.html", book)
        report = {"schema_version": 1, "rights": book["rights"], "manual_review_required": True, "total_tracks": len(book["report_lines"]), "changed_by_review": sum(1 for line in book["report_lines"] if line["changed"]), "lines": book["report_lines"]}
        (folder / "review_report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        tracks = []
        lessons = []
        for chapter in book["chapters"]:
            ids = []
            for sequence, track in enumerate(chapter["tracks"], 1):
                ids.append(track["id"])
                tracks.append({"id": track["id"], "lesson": chapter["number"], "sequence": sequence, "speaker": track["speaker"], "text": track["text"], "translation": track["translation"], "audio_path": "", "tts_fallback": True, "section": track["section"], "type": track["type"]})
            lessons.append({"number": chapter["number"], "title": chapter["title"], "track_ids": ids})
        manifest = {"schema_version": 1, "project_code": book["code"], "title": book["title"], "subtitle": book["subtitle"], "description": book["description"], "version": "0.1.0-import", "source_language": "German", "target_language": "German", "explanation_language": book["explanation_language"], "audio_mode": "browser_tts_fallback", "total_lessons": len(lessons), "total_tracks": len(tracks), "cover": "", "available_playback_modes": ["Frases"], "lessons": lessons, "tracks": tracks, "import_note": "Texto proporcionado y revisado por el usuario; validar derechos antes de publicar."}
        (folder / "hanstory_manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    except Exception:
        shutil.rmtree(folder)
        raise
    return folder


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="JSON con texto autorizado, OCR y revisión humana")
    parser.add_argument("--output-dir", type=Path, required=True, help="Directorio de staging para el paquete generado")
    args = parser.parse_args()
    try:
        destination = build_package(args.source.resolve(), args.output_dir.resolve())
    except ValueError as exc:
        parser.error(str(exc))
    print(f"Paquete generado: {destination}")
    print("Siguiente paso: revisar review_report.json y después importar/publicar desde HanStory Studio.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
