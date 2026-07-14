#!/usr/bin/env python3
"""Publica o valida un libro de HanStory Studio sin subirlo a internet."""
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from src.book_manager import list_books  # noqa: E402
from src.web_library import WEB_ROOT, publish_book, remove_book, validate_book  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("code"); parser.add_argument("--validate", action="store_true"); parser.add_argument("--remove", action="store_true")
    parser.add_argument("--version", default="1.0.0"); parser.add_argument("--bump", choices=("patch", "minor", "major")); parser.add_argument("--git-status", action="store_true"); parser.add_argument("--commit", metavar="MESSAGE"); parser.add_argument("--push", action="store_true")
    args = parser.parse_args(); book = next((b for b in list_books() if b.code.casefold() == args.code.casefold()), None)
    if not book: parser.error(f"No existe el libro {args.code}")
    if args.remove: remove_book(book.code); print(f"Retirado: {book.code}"); return 0
    report = validate_book(book, args.version) if args.validate else publish_book(book, args.version, args.bump); print(report.text())
    if not report.ok: return 1
    if args.git_status: subprocess.run(["git", "status", "--short", "HanStoryPlayerWeb"], cwd=ROOT, check=False)
    if args.commit:
        subprocess.run(["git", "add", "HanStoryPlayerWeb"], cwd=ROOT, check=True); subprocess.run(["git", "commit", "-m", args.commit], cwd=ROOT, check=True)
    if args.push:
        answer = input("¿Confirmas push de la rama actual? Escribe PUBLICAR: ")
        if answer == "PUBLICAR": subprocess.run(["git", "push"], cwd=ROOT, check=True)
        else: print("Push cancelado.")
    return 0

if __name__ == "__main__": raise SystemExit(main())
