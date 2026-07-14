from __future__ import annotations

import csv
import re
from dataclasses import dataclass
from pathlib import Path


REQUIRED_COLUMNS = ("id", "type", "speaker_or_blank", "text", "translation_or_blank")
SAFE_ID = re.compile(r"^[A-Za-z0-9_-]+$")
VALID_TYPES = {"phrase", "word"}


@dataclass(frozen=True)
class AudioRow:
    audio_id: str
    audio_type: str
    speaker: str
    text: str
    translation: str
    text_tts: str = ""

    def text_for_tts(self, acting_mode: bool) -> str:
        value = self.text_tts.strip() or self.text
        if acting_mode and self.text_tts.strip():
            return value
        return re.sub(r"\s*\[[^\]\r\n]+\]\s*", " ", value).strip()


def load_audio_csv(path: str | Path) -> list[AudioRow]:
    rows: list[AudioRow] = []
    seen_ids: set[str] = set()
    with Path(path).open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        headers = tuple(reader.fieldnames or ())
        missing = [name for name in REQUIRED_COLUMNS if name not in headers]
        if missing:
            raise ValueError("Faltan columnas en el CSV: " + ", ".join(missing))
        for line_number, raw in enumerate(reader, start=2):
            audio_id = (raw.get("id") or "").strip()
            audio_type = (raw.get("type") or "").strip().casefold()
            text = (raw.get("text") or "").strip()
            if not audio_id:
                raise ValueError(f"La fila {line_number} no tiene id.")
            if not SAFE_ID.fullmatch(audio_id):
                raise ValueError(f"El id '{audio_id}' de la fila {line_number} no es seguro.")
            if audio_id.casefold() in seen_ids:
                raise ValueError(f"El id '{audio_id}' está repetido (fila {line_number}).")
            if audio_type not in VALID_TYPES:
                raise ValueError(
                    f"El type de {audio_id} debe ser 'phrase' o 'word', no '{audio_type}'."
                )
            if not text:
                raise ValueError(f"La fila {line_number} ({audio_id}) no tiene texto.")
            seen_ids.add(audio_id.casefold())
            rows.append(
                AudioRow(
                    audio_id, audio_type, (raw.get("speaker_or_blank") or "").strip(),
                    text, (raw.get("translation_or_blank") or "").strip(),
                    (raw.get("text_tts") or "").strip(),
                )
            )
    if not rows:
        raise ValueError("El CSV está vacío.")
    return rows
