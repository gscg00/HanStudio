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
    ".sqlite", ".wav", ".zip",
}
SENSITIVE_MARKERS = (
    "service_role", "client_secret", "private_key",
    "database password", "google client secret",
)


def is_public_file(path: Path, root: Path = ROOT) -> bool:
    relative = path.relative_to(root)
    if any(part in FORBIDDEN_PARTS for part in relative.parts):
        return False
    if path.name in FORBIDDEN_NAMES or path.name.startswith(".env"):
        return False
    if path.suffix.lower() in FORBIDDEN_SUFFIXES:
        return False
    return path.suffix.lower() in PUBLIC_SUFFIXES


def build(output: Path) -> list[Path]:
    output = output.resolve()
    if output == ROOT or output in (ROOT / name for name in PUBLIC_DIRECTORIES):
        raise ValueError("La salida no puede reemplazar una carpeta fuente pública.")
    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True)

    copied: list[Path] = []
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
            if not source.is_file() or not is_public_file(source):
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

    if not (output / "library/courses/Japanese/course.json").is_file():
        raise RuntimeError("El curso guiado de japonés no está en el artefacto.")


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
