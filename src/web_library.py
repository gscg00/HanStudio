from __future__ import annotations

import csv
import hashlib
import json
import re
import shutil
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath

from .book_manager import Book
from .config import MASTER_AUDIO_DIR, PROJECT_DIR
from .project_config import load_project_config

WEB_ROOT = PROJECT_DIR / "HanStoryPlayerWeb"
WEB_LIBRARY = WEB_ROOT / "library"
SAFE_CODE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*$")
SECRET_PATTERNS = (re.compile(r"sk-[A-Za-z0-9_-]{16,}"), re.compile(r"api[_-]?key\s*[:=]", re.I))
PUBLIC_FILES = {"Audio_Master.csv", "Podcast_Master.csv", "Audios_Tecnico.txt", "Podcast_Tecnico.txt", "book.html"}
AUDIO_EXTENSIONS = {".mp3", ".m4a", ".wav", ".aac", ".ogg"}
TRACK_ID_PATTERN = re.compile(r"(?<![A-Za-z0-9])([A-Za-z][A-Za-z0-9]*\d)(?![A-Za-z0-9])", re.I)


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def natural_key(value: str) -> list[object]:
    return [int(part) if part.isdigit() else part.casefold() for part in re.split(r"(\d+)", value)]


def _library_sort_key(entry: dict) -> tuple:
    """Keep each language in its chosen reading order."""
    try:
        position = int(entry.get("display_order", 0))
    except (TypeError, ValueError):
        position = 0
    return (
        str(entry.get("target_language", "")).casefold(),
        position if position > 0 else 1_000_000,
        natural_key(str(entry.get("title", ""))),
        natural_key(str(entry.get("code", ""))),
    )


def bump_version(version: str, part: str = "patch") -> str:
    numbers = [int(x) for x in (version or "1.0.0").split(".")[:3]]
    numbers += [0] * (3 - len(numbers))
    index = {"major": 0, "minor": 1, "patch": 2}.get(part, 2)
    numbers[index] += 1
    for i in range(index + 1, 3):
        numbers[i] = 0
    return ".".join(map(str, numbers))


def is_safe_relative(path: str) -> bool:
    candidate = PurePosixPath(path.replace("\\", "/"))
    return bool(path) and not candidate.is_absolute() and ".." not in candidate.parts


@dataclass
class PublishReport:
    action: str = "VALIDAR"
    ok: bool = False
    title: str = ""
    code: str = ""
    version: str = ""
    destination: str = ""
    files: list[str] = field(default_factory=list)
    excluded: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    total_bytes: int = 0
    audio_count: int = 0
    folder_created: bool = False
    library_updated: bool = False
    books_before: int = 0
    books_after: int = 0

    def text(self) -> str:
        lines = [f"HanStory Web — {'LISTO' if self.ok else 'REVISAR'}", f"Acción ejecutada: {self.action}", f"{self.title} ({self.code})", f"Versión: {self.version}", f"Ruta real de salida: {self.destination}", f"Carpeta creada: {'sí' if self.folder_created else 'no'}", f"Archivos copiados: {len(self.files) if self.action == 'PUBLICAR' else 0}", f"Audios copiados: {self.audio_count if self.action == 'PUBLICAR' else 0}", f"library.json actualizado: {'sí' if self.library_updated else 'no'}", f"Libros en library.json antes/después: {self.books_before}/{self.books_after}", f"Tamaño previsto/real: {self.total_bytes / 1048576:.1f} MB"]
        if self.action == "VALIDAR": lines += ["", "Validación completada. No se publicaron archivos."]
        if self.errors: lines += ["", "Errores:", *[f"- {x}" for x in self.errors]]
        if self.warnings: lines += ["", "Advertencias:", *[f"- {x}" for x in self.warnings]]
        if self.excluded: lines += ["", "Excluidos:", *[f"- {x}" for x in self.excluded]]
        lines += ["", "Los archivos publicados en un sitio público podrán ser accesibles mediante internet. Publica únicamente contenido propio o contenido que tengas autorización para distribuir."]
        return "\n".join(lines) + "\n"


def _read_rows(path: Path) -> list[dict[str, str]]:
    if not path.exists(): return []
    with path.open(encoding="utf-8-sig", newline="") as handle:
        return [{str(k): str(v or "").strip() for k, v in row.items()} for row in csv.DictReader(handle)]


def _technical_ids(path: Path) -> list[str]:
    if not path.exists(): return []
    result = []
    for line in path.read_text(encoding="utf-8-sig").splitlines():
        if line.lstrip().startswith("#"): continue
        match = TRACK_ID_PATTERN.search(line)
        if match: result.append(match.group(1))
    return result


def _technical_layout(path: Path) -> dict[str, tuple[int, int]]:
    """Resolve lesson and within-lesson sequence from technical headings/lists."""
    if not path.exists(): return {}
    result: dict[str, tuple[int, int]] = {}; lesson = 0; sequence = 0
    for line in path.read_text(encoding="utf-8-sig").splitlines():
        heading = re.search(r"(?i)^\s*#{2,4}\s*Lecci[oó]n\s+(\d+)", line)
        if heading: lesson = int(heading.group(1)); sequence = 0; continue
        if not lesson or line.lstrip().startswith("#"): continue
        for audio_id in TRACK_ID_PATTERN.findall(line):
            sequence += 1; result.setdefault(audio_id.casefold(), (lesson, sequence))
    return result


def _filename_layout(path: Path) -> tuple[int, int]:
    value = path.as_posix()
    track = re.search(r"(?i)(?:^|/)L0*(\d+)[_-]+0*(\d+)(?:\s*-|[_ -])", value)
    if track: return (int(track.group(1)), int(track.group(2)))
    folder = re.search(r"(?i)(?:^|/)Lecci[oó]n[_ -]*0*(\d+)(?:/|$)", value)
    return (int(folder.group(1)), 0) if folder else (0, 0)


def _audio_catalog(book: Book) -> list[Path]:
    candidates: list[Path] = []
    for root in (book.output_dir, MASTER_AUDIO_DIR):
        if root.exists():
            candidates.extend(p for p in root.rglob("*") if p.is_file() and p.suffix.lower() in AUDIO_EXTENSIONS)
    return candidates


def _find_audio(catalog: list[Path], audio_id: str) -> Path | None:
    pattern = re.compile(rf"(^|[^A-Za-z0-9]){re.escape(audio_id)}([^A-Za-z0-9]|$)", re.I)
    candidates = [p for p in catalog if p.stem.casefold() == audio_id.casefold() or pattern.search(p.stem)]
    return sorted(candidates, key=lambda p: (0 if _filename_layout(p)[0] else 1, len(p.name), natural_key(p.name)))[0] if candidates else None


def build_manifest(book: Book, version: str = "1.0.0") -> tuple[dict, dict[str, Path], list[str]]:
    config = load_project_config(book); rows = _read_rows(book.csv_path) + _read_rows(book.folder / "Podcast_Master.csv")
    by_id: dict[str, dict[str, str]] = {}; warnings = []
    for row in rows:
        key = row.get("id", "").casefold()
        if key in by_id: raise ValueError(f"ID duplicado: {row.get('id')}")
        if key: by_id[key] = row
    ordered = _technical_ids(book.folder / "Podcast_Tecnico.txt") + _technical_ids(book.technical_path); catalog = _audio_catalog(book)
    technical_layout = _technical_layout(book.folder / "Podcast_Tecnico.txt"); technical_layout.update(_technical_layout(book.technical_path))
    rank = {value.casefold(): i for i, value in enumerate(ordered)}
    files: dict[str, Path] = {}; tracks = []
    for row in rows:
        audio_id = row.get("id", ""); source = _find_audio(catalog, audio_id)
        if not source:
            warnings.append(f"Audio no encontrado: {audio_id}"); continue
        kind = "podcast" if audio_id.casefold().startswith("pod") or "podcast" in source.as_posix().casefold() else row.get("type", "phrase")
        filename_lesson, filename_sequence = _filename_layout(source); technical_lesson, technical_sequence = technical_layout.get(audio_id.casefold(), (0, 0))
        lesson_raw = row.get("lesson") or row.get("lesson_number") or ""; csv_match = re.search(r"\d+", lesson_raw)
        lesson = technical_lesson or filename_lesson or (int(csv_match.group()) if csv_match else 0)
        sequence = technical_sequence or filename_sequence or rank.get(audio_id.casefold(), len(rank) + len(tracks))
        folder = "podcast_by_lesson" if kind == "podcast" else "audio"
        relative = f"{folder}/{source.name}" if filename_lesson else f"{folder}/{audio_id}{source.suffix.lower()}"
        files[relative] = source
        tracks.append({"id": audio_id, "lesson": lesson, "sequence": sequence, "speaker": row.get("speaker_or_blank") or row.get("speaker", ""), "text": row.get("text", ""), "translation": row.get("translation_or_blank") or row.get("translation", ""), "audio_path": relative, "section": row.get("section", "scene" if kind == "phrase" else "podcast"), "type": kind})
    tracks.sort(key=lambda t: (t["lesson"] or 999999, t["sequence"], natural_key(t["id"])))
    lesson_numbers = sorted({t["lesson"] for t in tracks})
    now = utc_now(); modes = sorted({"Podcast por lección" if t["type"] == "podcast" else "Frases" for t in tracks})
    manifest = {"schema_version": 1, "project_code": book.code, "title": book.title, "subtitle": book.level, "description": book.description, "version": version, "source_language": config.source_language, "target_language": config.target_language, "explanation_language": config.explanation_language, "total_lessons": len([n for n in lesson_numbers if n > 0]), "total_tracks": len(tracks), "cover": "cover.jpg" if any((book.folder / n).exists() for n in ("cover.jpg", "cover.png", "portada.jpg", "portada.png")) else "", "available_playback_modes": modes, "lessons": [{"number": n, "title": f"Lección {n}" if n else "Sin lección", "track_ids": [t["id"] for t in tracks if t["lesson"] == n]} for n in lesson_numbers], "tracks": tracks, "technical_order_source": "hanstory_manifest.json > Podcast_Tecnico.txt > Audios_Tecnico.txt > lesson+sequence > ID natural > nombre natural", "published_at": now, "updated_at": now}
    return manifest, files, warnings


def validate_book(book: Book, version: str = "1.0.0") -> PublishReport:
    report = PublishReport(action="VALIDAR", title=book.title, code=book.code, version=version, destination=str(WEB_LIBRARY / "books" / book.code))
    if not book.code or not SAFE_CODE.fullmatch(book.code): report.errors.append("El código falta o no es seguro para una ruta web.")
    if not book.title.strip(): report.errors.append("Falta el título.")
    try:
        manifest, files, warnings = build_manifest(book, version)
        report.warnings += warnings
        sample = " ".join(str(track.get("text", "")) for track in manifest.get("tracks", [])[:80])
        if manifest.get("target_language") == "Korean" and sample and not re.search(r"[가-힣]", sample):
            report.warnings.append("El proyecto está configurado como Korean, pero las frases examinadas no contienen coreano. Revisa Fuentes → Idiomas antes de publicar.")
        if not manifest["tracks"]: report.errors.append("No se encontró ningún audio publicable.")
        for track in manifest["tracks"]:
            if not is_safe_relative(track["audio_path"]): report.errors.append(f"Ruta inválida: {track['audio_path']}")
        report.files = sorted(files); report.audio_count = len(files); report.total_bytes = sum(p.stat().st_size for p in files.values())
    except (OSError, ValueError) as exc: report.errors.append(str(exc))
    for path in book.folder.rglob("*"):
        rel = path.relative_to(book.folder).as_posix()
        if path.name == ".env" or path.suffix.lower() in {".pdf", ".epub", ".mobi"} or any(part in {"sources", "ocr", "tmp", "temp", "__pycache__"} for part in path.parts):
            report.excluded.append(rel)
            if path.is_file() and path.stat().st_size < 2_000_000:
                content = path.read_text(encoding="utf-8", errors="ignore")
                if any(p.search(content) for p in SECRET_PATTERNS): report.errors.append(f"Posible secreto detectado en {rel}")
        elif path.is_file() and path.stat().st_size < 2_000_000 and path.suffix.lower() in {".txt", ".json", ".csv"}:
            content = path.read_text(encoding="utf-8", errors="ignore")
            if any(p.search(content) for p in SECRET_PATTERNS): report.errors.append(f"Posible secreto detectado en {rel}")
    report.ok = not report.errors
    return report


def publish_book(book: Book, version: str = "1.0.0", bump: str | None = None, *, generate_web_explanations: bool = False, regenerate_explanations: bool = False, explanation_lesson: int | None = None, explanation_ids: set[str] | None = None) -> PublishReport:
    index_path = WEB_LIBRARY / "library.json"; index = json.loads(index_path.read_text(encoding="utf-8")) if index_path.exists() else {"schema_version": 1, "books": []}
    books_before = len(index.get("books", [])); previous = next((x for x in index["books"] if x.get("code") == book.code), None)
    if previous and version == "1.0.0": version = previous.get("version", version)
    if bump: version = bump_version(version, bump)
    report = validate_book(book, version); report.action = "PUBLICAR"; report.books_before = books_before; report.books_after = books_before
    if not report.ok:
        report.files = []; report.audio_count = 0; report.total_bytes = 0
        return report
    destination = WEB_LIBRARY / "books" / book.code
    try:
        manifest, audio_files, warnings = build_manifest(book, version); report.warnings = warnings
        previous_manifest_path = destination / "hanstory_manifest.json"
        if previous_manifest_path.exists():
            try:
                previous_manifest = json.loads(previous_manifest_path.read_text(encoding="utf-8"))
                for key in ("display_order",):
                    if key in previous_manifest: manifest[key] = previous_manifest[key]
                # A title edited in Biblioteca web is an intentional public override.
                if previous_manifest.get("public_title"):
                    manifest["public_title"] = previous_manifest["public_title"]
                    manifest["title"] = previous_manifest["public_title"]
            except (OSError, json.JSONDecodeError):
                pass
        from .web_explanations import cache_path, generate_explanations
        if generate_web_explanations:
            _, explanation_report = generate_explanations(book, manifest, regenerate=regenerate_explanations, lesson=explanation_lesson, selected_ids=explanation_ids, version=version)
            report.warnings.append(f"Explicaciones: {explanation_report.new} nuevas, {explanation_report.regenerated} regeneradas, {explanation_report.reused} reutilizadas, {len(explanation_report.failed_ids)} fallidas.")
        destination.mkdir(parents=True, exist_ok=True); keep = {"hanstory_manifest.json"}
        for relative, source in audio_files.items():
            target = destination / relative; target.parent.mkdir(parents=True, exist_ok=True); shutil.copy2(source, target); keep.add(relative)
        for name in PUBLIC_FILES:
            source = book.folder / name
            if source.exists(): shutil.copy2(source, destination / name); keep.add(name)
        explanation_source = cache_path(book.code)
        if explanation_source.exists():
            explanation_target = destination / "explanations" / "track_explanations.json"; explanation_target.parent.mkdir(parents=True, exist_ok=True); shutil.copy2(explanation_source, explanation_target); keep.add("explanations/track_explanations.json")
        explanation_report_source = book.reports_dir / "Web_Explanations_Report.txt"
        if explanation_report_source.exists(): shutil.copy2(explanation_report_source, destination / "Web_Explanations_Report.txt"); keep.add("Web_Explanations_Report.txt")
        for cover_name in ("cover.jpg", "cover.png", "portada.jpg", "portada.png"):
            source = book.folder / cover_name
            if source.exists(): shutil.copy2(source, destination / "cover.jpg"); keep.add("cover.jpg"); break
        for existing in sorted(destination.rglob("*"), reverse=True):
            rel = existing.relative_to(destination).as_posix()
            if existing.is_file() and rel not in keep: existing.unlink()
            elif existing.is_dir() and not any(existing.iterdir()): existing.rmdir()
        manifest["checksums"] = {rel: hashlib.sha256((destination / rel).read_bytes()).hexdigest() for rel in sorted(keep - {"hanstory_manifest.json"})}
        manifest_path = destination / "hanstory_manifest.json"; manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        entry = _library_entry(manifest, book.code)
        index["books"] = sorted([x for x in index["books"] if x.get("code") != book.code] + [entry], key=_library_sort_key); index["updated_at"] = utc_now()
        index_path.parent.mkdir(parents=True, exist_ok=True); index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        from .web_topics import rebuild_topics
        rebuild_topics(WEB_LIBRARY)
        disk_index = json.loads(index_path.read_text(encoding="utf-8")); disk_entry = next((x for x in disk_index.get("books", []) if x.get("code") == book.code), None)
        referenced = WEB_LIBRARY / disk_entry["manifest"] if disk_entry else None
        actual_files = sorted(p.relative_to(destination).as_posix() for p in destination.rglob("*") if p.is_file()) if destination.is_dir() else []
        verified = destination.is_dir() and bool(actual_files) and manifest_path.is_file() and disk_entry is not None and referenced is not None and referenced.is_file()
        report.folder_created = destination.is_dir(); report.files = actual_files; report.audio_count = sum(1 for p in destination.rglob("*") if p.is_file() and p.suffix.lower() in AUDIO_EXTENSIONS); report.total_bytes = sum(p.stat().st_size for p in destination.rglob("*") if p.is_file()); report.library_updated = disk_entry is not None; report.books_after = len(disk_index.get("books", [])); report.ok = verified
        if not verified: report.errors.append("Publicación fallida: los archivos no fueron copiados.")
    except (OSError, ValueError, json.JSONDecodeError, KeyError) as exc:
        actual = sorted(p.relative_to(destination).as_posix() for p in destination.rglob("*") if p.is_file()) if destination.is_dir() else []
        report.folder_created = destination.is_dir(); report.files = actual; report.audio_count = sum(1 for p in destination.rglob("*") if p.is_file() and p.suffix.lower() in AUDIO_EXTENSIONS) if destination.is_dir() else 0; report.total_bytes = sum(p.stat().st_size for p in destination.rglob("*") if p.is_file()) if destination.is_dir() else 0; report.ok = False; report.errors.append(f"Publicación fallida: los archivos no fueron copiados. {exc}")
    if report.ok: (destination / "PUBLISH_REPORT.txt").write_text(report.text(), encoding="utf-8")
    return report


def _library_entry(manifest: dict, code: str) -> dict:
    return {"code": code, "title": manifest.get("public_title") or manifest.get("title", code), "display_order": manifest.get("display_order", 0), "type": "Libro", "series": "HanStory", "target_language": manifest.get("target_language", ""), "explanation_language": manifest.get("explanation_language", ""), "version": manifest.get("version", "1.0.0"), "cover": f"books/{code}/cover.jpg" if manifest.get("cover") else "", "manifest": f"books/{code}/hanstory_manifest.json", "updated_at": manifest.get("updated_at", utc_now())}


def published_books() -> list[dict]:
    """Return the real published catalog for Studio's metadata editor."""
    index_path = WEB_LIBRARY / "library.json"
    if not index_path.exists(): return []
    try:
        return sorted(json.loads(index_path.read_text(encoding="utf-8")).get("books", []), key=_library_sort_key)
    except (OSError, json.JSONDecodeError):
        return []


def update_published_book(code: str, title: str, display_order: int = 0) -> dict:
    """Edit public presentation metadata without copying or changing audio."""
    title = title.strip()
    if not SAFE_CODE.fullmatch(code): raise ValueError("El código del libro no es válido.")
    if not title: raise ValueError("El título visible no puede estar vacío.")
    if display_order < 0: raise ValueError("El orden debe ser cero o un número positivo.")
    manifest_path = WEB_LIBRARY / "books" / code / "hanstory_manifest.json"
    if not manifest_path.is_file(): raise FileNotFoundError("El libro publicado no tiene hanstory_manifest.json.")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest.setdefault("source_title", manifest.get("title", code))
    manifest["public_title"] = title
    manifest["title"] = title
    manifest["display_order"] = display_order
    manifest["updated_at"] = utc_now()
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    index_path = WEB_LIBRARY / "library.json"
    index = json.loads(index_path.read_text(encoding="utf-8")) if index_path.exists() else {"schema_version": 1, "books": []}
    entry = _library_entry(manifest, code)
    index["books"] = sorted([book for book in index.get("books", []) if book.get("code") != code] + [entry], key=_library_sort_key)
    index["updated_at"] = utc_now()
    index_path.parent.mkdir(parents=True, exist_ok=True)
    index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return entry


def rebuild_library() -> PublishReport:
    index_path = WEB_LIBRARY / "library.json"; before = 0
    if index_path.exists():
        try: before = len(json.loads(index_path.read_text(encoding="utf-8")).get("books", []))
        except (OSError, json.JSONDecodeError): pass
    report = PublishReport(action="RECONSTRUIR", title="Biblioteca web", code="*", destination=str(WEB_LIBRARY), books_before=before)
    books = []
    try:
        for path in sorted((WEB_LIBRARY / "books").glob("*/hanstory_manifest.json")):
            manifest = json.loads(path.read_text(encoding="utf-8")); code = str(manifest.get("project_code") or path.parent.name)
            if SAFE_CODE.fullmatch(code): books.append(_library_entry(manifest, code))
            else: report.errors.append(f"Código inválido en {path}")
        data = {"schema_version": 1, "updated_at": utc_now(), "books": sorted(books, key=_library_sort_key)}
        index_path.parent.mkdir(parents=True, exist_ok=True); index_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        report.library_updated = True; report.books_after = len(books); report.folder_created = (WEB_LIBRARY / "books").is_dir(); report.files = [str(p.relative_to(WEB_LIBRARY)) for p in (WEB_LIBRARY / "books").glob("*/hanstory_manifest.json")]; report.ok = not report.errors
    except (OSError, json.JSONDecodeError) as exc: report.errors.append(str(exc)); report.ok = False
    return report


def remove_book(code: str) -> None:
    index_path = WEB_LIBRARY / "library.json"
    if index_path.exists():
        index = json.loads(index_path.read_text(encoding="utf-8")); index["books"] = [x for x in index.get("books", []) if x.get("code") != code]; index["updated_at"] = utc_now(); index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    destination = WEB_LIBRARY / "books" / code
    if destination.exists(): shutil.rmtree(destination)
