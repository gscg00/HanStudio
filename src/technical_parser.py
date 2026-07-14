from __future__ import annotations

import re
from pathlib import Path


LESSON_HEADER = re.compile(r"^\s*#{1,6}\s*Lecci[oó]n\s+(\d+)\s*$", re.IGNORECASE)
ID_TOKEN = re.compile(r"\b[A-Za-z0-9_-]+\b")


def parse_technical_file(path: str | Path) -> dict[int, list[str]]:
    lessons: dict[int, list[str]] = {}
    current: int | None = None
    with Path(path).open("r", encoding="utf-8-sig") as handle:
        for raw_line in handle:
            line = raw_line.strip()
            match = LESSON_HEADER.match(line)
            if match:
                current = int(match.group(1))
                lessons.setdefault(current, [])
                continue
            if current is None or ":" not in line:
                continue
            for audio_id in ID_TOKEN.findall(line.split(":", 1)[1]):
                lessons[current].append(audio_id)
    if not lessons:
        raise ValueError("No encontré secciones como '### Lección 01'.")
    return lessons
