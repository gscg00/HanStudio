#!/usr/bin/env python3
"""Comprueba que index.html referencia recursos locales existentes y seguros."""
from __future__ import annotations

import re
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"


def referenced_assets(html: str) -> list[str]:
    values = re.findall(r"(?:href|src)=[\"']([^\"']+)[\"']", html, re.I)
    return [value.split("?", 1)[0] for value in values if not re.match(r"^(?:https?:|data:|#)", value)]


def check() -> list[str]:
    errors: list[str] = []
    if not INDEX.exists(): return ["Falta index.html"]
    html = INDEX.read_text(encoding="utf-8")
    required = ("./assets/styles.css", "./src/app.js", "./manifest.webmanifest")
    for value in required:
        if value not in html: errors.append(f"index.html no referencia {value}")
    if "Cocoa HTML Writer" in html or "HTML 4.01" in html: errors.append("index.html fue convertido a texto enriquecido")
    for value in referenced_assets(html):
        relative = PurePosixPath(value.removeprefix("./"))
        if relative.is_absolute() or ".." in relative.parts: errors.append(f"Ruta insegura: {value}")
        elif not (ROOT / relative).is_file(): errors.append(f"Ruta rota: {value}")
    return errors


if __name__ == "__main__":
    problems = check()
    if problems:
        print("\n".join(f"ERROR: {p}" for p in problems)); raise SystemExit(1)
    print("OK: index.html y todos sus recursos locales son válidos.")
