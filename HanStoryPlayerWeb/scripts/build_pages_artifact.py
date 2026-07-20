#!/usr/bin/env python3
"""Construye el artefacto público de GitHub Pages para HanStory Web Player."""
from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path, PurePosixPath


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_ROOT_FILES = {".nojekyll", "index.html", "manifest.webmanifest", "service-worker.js"}
PUBLIC_DIRECTORIES = ("assets", "src", "library")
PUBLIC_SUFFIXES = {
    ".css", ".html", ".ico", ".jpeg", ".jpg", ".js", ".json",
    ".m4a", ".mp3", ".ogg", ".opus", ".otf", ".png", ".svg",
    ".ttf", ".webmanifest", ".webp", ".woff", ".woff2",
    ".wav",
}
FORBIDDEN_PARTS = {
    ".git", ".github", ".pytest_cache", "__pycache__", "node_modules",
    "scripts", "tests", "tmp", "temp", "backups",
}
FORBIDDEN_NAMES = {
    ".DS_Store", "PUBLISH_REPORT.txt", "Web_Explanations_Report.txt",
    "Audios_Tecnico.txt", "Podcast_Tecnico.txt", "Audio_Master.csv",
    "Podcast_Master.csv",
}
FORBIDDEN_SUFFIXES = {
    ".db", ".env", ".key", ".log", ".p12", ".pem", ".py", ".pyc",
    ".sqlite", ".zip",
}
SENSITIVE_MARKERS = (
    "service_role", "client_secret", "private_key",
    "database password", "google client secret",
)


def _safe_manifest_asset(manifest: Path, relative_value: object, root: Path) -> Path | None:
    value = str(relative_value or "").strip()
    if not value:
        return None
    relative = PurePosixPath(value)
    if relative.is_absolute() or ".." in relative.parts:
        raise RuntimeError(f"Ruta de audio insegura en {manifest.relative_to(root)}: {value}")
    destination = (manifest.parent / Path(*relative.parts)).resolve()
    try:
        destination.relative_to(root.resolve())
    except ValueError as exc:
        raise RuntimeError(f"Ruta de audio fuera del Web Player: {value}") from exc
    return destination


def referenced_audio_files(root: Path = ROOT) -> set[Path]:
    references: set[Path] = set()
    for manifest in (root / "library" / "courses").glob("*/audio_manifest.json"):
        payload = json.loads(manifest.read_text(encoding="utf-8"))
        for value in payload.get("items", {}).values():
            destination = _safe_manifest_asset(manifest, value, root)
            if destination:
                references.add(destination)
    for manifest in (root / "library" / "books").glob("*/hanstory_manifest.json"):
        payload = json.loads(manifest.read_text(encoding="utf-8"))
        for track in payload.get("tracks", []):
            destination = _safe_manifest_asset(
                manifest, track.get("audio_path") or track.get("audio"), root
            )
            if destination:
                references.add(destination)
    return references


def referenced_course_unit_files(root: Path = ROOT) -> set[Path]:
    """Devuelve solo los manifiestos de unidad que están activos en course.json.

    Los borradores de autoría pueden permanecer en el repositorio sin terminar
    accidentalmente en GitHub Pages ni en la caché offline de los alumnos.
    """
    references: set[Path] = set()
    courses_root = root / "library" / "courses"
    for course_path in courses_root.glob("*/course.json"):
        payload = json.loads(course_path.read_text(encoding="utf-8"))
        for unit in payload.get("units", []):
            destination = _safe_manifest_asset(course_path, unit.get("manifest"), root)
            if destination:
                references.add(destination)
    return references


def is_public_file(
    path: Path,
    root: Path = ROOT,
    referenced_audio: set[Path] | None = None,
    referenced_course_units: set[Path] | None = None,
) -> bool:
    relative = path.relative_to(root)
    if any(part in FORBIDDEN_PARTS for part in relative.parts):
        return False
    if path.name in FORBIDDEN_NAMES or path.name.startswith(".env"):
        return False
    if path.suffix.lower() in FORBIDDEN_SUFFIXES:
        return False
    relative_parts = relative.parts
    if (
        len(relative_parts) >= 5
        and relative_parts[0:2] == ("library", "courses")
        and relative_parts[3] == "units"
        and path.suffix.lower() == ".json"
    ):
        references = (
            referenced_course_units
            if referenced_course_units is not None
            else referenced_course_unit_files(root)
        )
        return path.resolve() in references
    # Los audios editados nuevos se guardan en MP3, pero mantenemos compatibilidad
    # con recortes WAV antiguos. Solo publicamos un WAV cuando algún manifiesto lo
    # utiliza, para no confundir originales de producción con audios finales.
    if path.suffix.lower() == ".wav":
        references = referenced_audio if referenced_audio is not None else referenced_audio_files(root)
        return path.resolve() in references
    return path.suffix.lower() in PUBLIC_SUFFIXES


def build(output: Path) -> list[Path]:
    output = output.resolve()
    if output == ROOT or output in (ROOT / name for name in PUBLIC_DIRECTORIES):
        raise ValueError("La salida no puede reemplazar una carpeta fuente pública.")
    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True)

    copied: list[Path] = []
    referenced_audio = referenced_audio_files(ROOT)
    referenced_course_units = referenced_course_unit_files(ROOT)
    for name in PUBLIC_ROOT_FILES:
        source = ROOT / name
        if not source.is_file():
            raise FileNotFoundError(f"Falta el recurso público obligatorio: {name}")
        destination = output / name
        shutil.copy2(source, destination)
        copied.append(destination)

    for directory in PUBLIC_DIRECTORIES:
        source_root = ROOT / directory
        if not source_root.is_dir():
            raise FileNotFoundError(f"Falta la carpeta pública: {directory}")
        for source in source_root.rglob("*"):
            if not source.is_file() or not is_public_file(
                source,
                referenced_audio=referenced_audio,
                referenced_course_units=referenced_course_units,
            ):
                continue
            destination = output / source.relative_to(ROOT)
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, destination)
            copied.append(destination)

    validate(output)
    return copied


def validate(output: Path) -> None:
    required = [output / name for name in PUBLIC_ROOT_FILES]
    required += [output / "assets/styles.css", output / "src/app.js", output / "library/library.json"]
    missing = [str(path.relative_to(output)) for path in required if not path.is_file()]
    if missing:
        raise RuntimeError("Faltan recursos en el artefacto: " + ", ".join(missing))

    forbidden: list[str] = []
    for path in output.rglob("*"):
        if not path.is_file():
            continue
        relative = path.relative_to(output)
        if (
            any(part in FORBIDDEN_PARTS for part in relative.parts)
            or path.name in FORBIDDEN_NAMES
            or path.name.startswith(".env")
            or path.suffix.lower() in FORBIDDEN_SUFFIXES
        ):
            forbidden.append(relative.as_posix())
    if forbidden:
        raise RuntimeError("El artefacto contiene archivos privados o de desarrollo: " + ", ".join(forbidden))

    sensitive: list[str] = []
    text_suffixes = {".css", ".html", ".js", ".json", ".svg", ".webmanifest"}
    for path in output.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in text_suffixes:
            continue
        content = path.read_text(encoding="utf-8", errors="ignore").lower()
        if any(marker in content for marker in SENSITIVE_MARKERS):
            sensitive.append(path.relative_to(output).as_posix())
    if sensitive:
        raise RuntimeError("Se detectaron marcadores de credenciales privadas en: " + ", ".join(sensitive))

    library = json.loads((output / "library/library.json").read_text(encoding="utf-8"))
    for book in library.get("books", []):
        manifest = PurePosixPath("library") / PurePosixPath(book["manifest"])
        if manifest.is_absolute() or ".." in manifest.parts or not (output / manifest).is_file():
            raise RuntimeError(f"Manifest público inexistente o inseguro: {manifest}")

    guided_languages = (
        "English", "Korean", "Russian", "Italian", "French", "German",
        "Japanese", "Chinese", "Portuguese", "Arabic",
    )
    missing_courses = [
        language for language in guided_languages
        if not (output / "library" / "courses" / language / "course.json").is_file()
    ]
    if missing_courses:
        raise RuntimeError("Faltan cursos guiados en el artefacto: " + ", ".join(missing_courses))

    missing_units: list[str] = []
    for course_path in (output / "library" / "courses").glob("*/course.json"):
        payload = json.loads(course_path.read_text(encoding="utf-8"))
        for unit in payload.get("units", []):
            destination = _safe_manifest_asset(course_path, unit.get("manifest"), output)
            if destination and not destination.is_file():
                missing_units.append(f"{course_path.parent.name}: {unit.get('manifest')}")
    if missing_units:
        raise RuntimeError("Faltan unidades activas en el artefacto: " + ", ".join(missing_units))

    missing_audio: list[str] = []
    for manifest in (output / "library" / "courses").glob("*/audio_manifest.json"):
        payload = json.loads(manifest.read_text(encoding="utf-8"))
        for text, value in payload.get("items", {}).items():
            destination = _safe_manifest_asset(manifest, value, output)
            if destination and not destination.is_file():
                missing_audio.append(f"{manifest.parent.name}: {text} -> {value}")
    for manifest in (output / "library" / "books").glob("*/hanstory_manifest.json"):
        payload = json.loads(manifest.read_text(encoding="utf-8"))
        for track in payload.get("tracks", []):
            value = track.get("audio_path") or track.get("audio")
            destination = _safe_manifest_asset(manifest, value, output)
            if destination and not destination.is_file():
                missing_audio.append(f"{manifest.parent.name}: {track.get('id', '?')} -> {value}")
    if missing_audio:
        preview = ", ".join(missing_audio[:12])
        remainder = len(missing_audio) - 12
        suffix = f" (+{remainder} más)" if remainder > 0 else ""
        raise RuntimeError("Audios referenciados que no entrarían al sitio: " + preview + suffix)


def directory_size(path: Path) -> int:
    return sum(item.stat().st_size for item in path.rglob("*") if item.is_file())


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=ROOT / ".pages-dist")
    parser.add_argument("--validate-only", action="store_true")
    args = parser.parse_args()
    if args.validate_only:
        validate(args.output.resolve())
        files = [item for item in args.output.rglob("*") if item.is_file()]
    else:
        files = build(args.output)
    size = directory_size(args.output)
    print(f"Artefacto público verificado: {len(files)} archivos · {size / 1024 / 1024:.1f} MB")
    print(f"Salida: {args.output.resolve()}")


if __name__ == "__main__":
    main()
