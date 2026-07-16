from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass, field
from pathlib import Path

from .config import PROJECT_DIR, get_api_key, get_japanese_course_voice_id, load_settings
from .elevenlabs_client import ElevenLabsClient


WEB_ROOT = PROJECT_DIR / "HanStoryPlayerWeb"
COURSE_ROOT = WEB_ROOT / "library" / "courses" / "Japanese"
MANIFEST = COURSE_ROOT / "audio_manifest.json"
AUDIO_ROOT = COURSE_ROOT / "audio"
JAPANESE_COURSE_MODEL_ID = "eleven_v3"


@dataclass
class JapaneseAudioReport:
    model_id: str = JAPANESE_COURSE_MODEL_ID
    total: int = 0
    cached: int = 0
    generated: int = 0
    characters: int = 0
    errors: list[str] = field(default_factory=list)

    @property
    def missing(self) -> int:
        return self.total - self.cached - self.generated

    def text(self, *, dry_run: bool) -> str:
        action = "REVISAR" if dry_run else "GENERAR"
        return "\n".join((
            f"Curso japonés · ElevenLabs · {action}",
            f"Modelo: Eleven v3 ({self.model_id})",
            f"Audios requeridos: {self.total}",
            f"Ya existentes: {self.cached}",
            f"Generados ahora: {self.generated}",
            f"Pendientes: {self.missing}",
            f"Caracteres pendientes estimados: {self.characters}",
            f"Errores: {len(self.errors)}",
            *(f"- {error}" for error in self.errors),
        ))


def _section(text: str, start: str, end: str) -> str:
    return text.split(start, 1)[1].split(end, 1)[0]


def _row_speech(block: str) -> list[str]:
    values: list[str] = []
    chunks = re.findall(r"`([^`]*)`", block, flags=re.DOTALL) or [block]
    for chunk in chunks:
        for line in chunk.splitlines():
            if "|" not in line:
                continue
            parts = line.strip().strip("`),").split("|")
            if len(parts) > 1 and parts[1].strip():
                values.append(parts[1].strip())
    return values


def japanese_course_texts() -> list[str]:
    beginner = (WEB_ROOT / "src" / "beginner_courses.js").read_text(encoding="utf-8")
    extra = (WEB_ROOT / "src" / "data" / "zero_courses.js").read_text(encoding="utf-8")
    values = _row_speech(_section(beginner, "Japanese:{", "  Chinese:"))
    for chunk in re.findall(r"stage\('Japanese'[^`]*`([^`]*)`", extra, flags=re.DOTALL):
        values += _row_speech(chunk)
    values += _row_speech(_section(extra, "Japanese:`", "Chinese:`"))
    unit_root = COURSE_ROOT / "units"
    for unit_file in unit_root.glob("*.json") if unit_root.exists() else ():
        try:
            unit = json.loads(unit_file.read_text(encoding="utf-8"))
            for lesson in unit.get("lessons", []):
                for activity in lesson.get("activities", []):
                    values.extend(filter(None, (activity.get("audio"), activity.get("slow_audio"))))
        except (OSError, ValueError, TypeError):
            continue
    expanded: list[str] = []
    for value in values:
        expanded.append(value)
        if any(mark in value for mark in ("、", " / ")):
            expanded.extend(part.strip() for part in re.split(r"[、]|\s+/\s+", value) if part.strip())
        if "。" in value:
            expanded.extend(part.strip() + "。" for part in value.split("。") if part.strip())
    return list(dict.fromkeys(value for value in expanded if re.search(r"[ぁ-んァ-ヶ一-龯]", value)))


def _audio_name(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:20] + ".mp3"


def _manifest(items: dict[str, str], model_id: str, voice_id: str) -> dict:
    return {
        "schema_version": 1,
        "provider": "ElevenLabs",
        "language": "Japanese",
        "model_id": model_id,
        "voice_id": voice_id,
        "items": items,
    }


def generate_japanese_course_audio(*, dry_run: bool = True) -> JapaneseAudioReport:
    texts = japanese_course_texts()
    settings = load_settings()
    voice_id = get_japanese_course_voice_id()
    existing: dict[str, str] = {}
    if MANIFEST.exists():
        try:
            previous = json.loads(MANIFEST.read_text(encoding="utf-8"))
            if previous.get("model_id") == JAPANESE_COURSE_MODEL_ID:
                existing = previous.get("items", {})
        except (OSError, ValueError, TypeError):
            existing = {}
    report = JapaneseAudioReport(total=len(texts))
    pending: list[str] = []
    for text in texts:
        relative = existing.get(text, "")
        if relative and (COURSE_ROOT / relative).is_file():
            report.cached += 1
        else:
            pending.append(text)
    report.characters = sum(len(text) for text in pending)
    if dry_run:
        return report
    api_key = get_api_key()
    if not api_key:
        report.errors.append("Falta ELEVENLABS_API_KEY. Guárdala en Voces y ajustes.")
        return report
    if not voice_id:
        report.errors.append("Falta la Voice ID japonesa. Escríbela en Biblioteca web.")
        return report
    client = ElevenLabsClient(api_key, settings)
    for text in pending:
        filename = _audio_name(text)
        try:
            client.generate_mp3(text, voice_id, AUDIO_ROOT / filename, model_id=JAPANESE_COURSE_MODEL_ID)
            existing[text] = f"audio/{filename}"
            report.generated += 1
        except Exception as exc:
            report.errors.append(f"{text}: {exc}")
    COURSE_ROOT.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(
        json.dumps(_manifest(existing, JAPANESE_COURSE_MODEL_ID, voice_id), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return report
