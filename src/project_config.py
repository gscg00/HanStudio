from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field

from .book_manager import Book
from .config import MASTER_AUDIO_DIR
from .csv_loader import load_audio_csv


DEFAULT_MODEL_ID = "eleven_multilingual_v2"


@dataclass
class ProjectConfig:
    elevenlabs_model_id: str = DEFAULT_MODEL_ID
    elevenlabs_model_name: str = "Eleven Multilingual v2"
    acting_mode_enabled: bool = False
    allow_default_voice: bool = False
    character_voice_map: dict[str, str] = field(default_factory=dict)
    source_language: str = "Korean"
    target_language: str = "Korean"
    explanation_language: str = "Spanish"
    romanization_enabled: bool = False
    script_type: str = "Auto"
    creative_provider_name: str = "Manual / Placeholder"
    creative_model_name: str = ""
    creative_temperature: float = 0.3
    creative_max_tokens: int = 4000
    allow_unreviewed_drafts: bool = False
    no_full_translation_enabled: bool = False
    podcast_id_prefix: str = ""
    podcast_pause_seconds: int = 1
    podcast_output_mode: str = "conservar audios separados"
    podcast_audio_output_mode: str = "Un audio por lección"
    podcast_generate_lines_and_joined: bool = True
    podcast_use_multispeaker_v3: bool = False
    podcast_multispeaker_max_chars: int = 4500
    podcast_word_breakdown_enabled: bool = True
    podcast_active_listening_enabled: bool = False
    podcast_active_preset: str = "Repite conmigo"
    podcast_phrase_pause_ms: int = 1000
    podcast_repeat_pause_ms: int = 3000
    podcast_key_phrase_repetitions: int = 2
    podcast_include_slow_version: bool = True
    podcast_include_natural_version: bool = True
    podcast_include_brief_translation: bool = True
    podcast_include_repeat_instruction: bool = True


def load_project_config(book: Book) -> ProjectConfig:
    path = book.folder / "project_config.json"
    if not path.exists():
        # Compatibilidad: un proyecto clásico ya generado podía depender de la voz
        # default. Solo se conserva esa conducta cuando todos sus MP3 ya existen;
        # un proyecto pendiente de generar sigue el modo estricto actual.
        legacy_csv = book.csv_path
        legacy_allow_default = False
        if legacy_csv.exists():
            try:
                with legacy_csv.open(encoding="utf-8-sig") as handle:
                    first_line = handle.readline()
                is_classic_csv = "text_tts" not in {
                    column.strip() for column in first_line.strip().split(",")
                }
                rows = load_audio_csv(legacy_csv)
                legacy_allow_default = bool(rows) and is_classic_csv and all(
                    (MASTER_AUDIO_DIR / f"{row.audio_id}.mp3").exists() for row in rows
                )
            except (OSError, ValueError):
                pass
        return ProjectConfig(allow_default_voice=legacy_allow_default)
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(f"No se pudo leer project_config.json: {exc}") from exc
    if not isinstance(raw, dict):
        raise ValueError("project_config.json no contiene una configuración válida.")
    voice_map = raw.get("character_voice_map", {})
    if not isinstance(voice_map, dict):
        voice_map = {}
    return ProjectConfig(
        elevenlabs_model_id=str(raw.get("elevenlabs_model_id", "")).strip()
        or DEFAULT_MODEL_ID,
        elevenlabs_model_name=str(raw.get("elevenlabs_model_name", "")).strip()
        or (
            "Eleven Multilingual v2"
            if str(raw.get("elevenlabs_model_id", "")).strip() in ("", DEFAULT_MODEL_ID)
            else "Modelo personalizado"
        ),
        acting_mode_enabled=bool(raw.get("acting_mode_enabled", False)),
        allow_default_voice=bool(raw.get("allow_default_voice", False)),
        character_voice_map={
            str(name).strip(): str(voice_id).strip()
            for name, voice_id in voice_map.items()
            if str(name).strip() and str(voice_id).strip()
        },
        source_language=str(raw.get("source_language", "Korean")).strip() or "Korean",
        target_language=str(raw.get("target_language", "Korean")).strip() or "Korean",
        explanation_language=str(raw.get("explanation_language", "Spanish")).strip() or "Spanish",
        romanization_enabled=bool(raw.get("romanization_enabled", False)),
        script_type=str(raw.get("script_type", "Auto")).strip() or "Auto",
        creative_provider_name=str(raw.get("creative_provider_name", "Manual / Placeholder")).strip() or "Manual / Placeholder",
        creative_model_name=str(raw.get("creative_model_name", "")).strip(),
        creative_temperature=float(raw.get("creative_temperature", 0.3)),
        creative_max_tokens=int(raw.get("creative_max_tokens", 4000)),
        allow_unreviewed_drafts=bool(raw.get("allow_unreviewed_drafts", False)),
        no_full_translation_enabled=bool(raw.get("no_full_translation_enabled", False)),
        podcast_id_prefix=str(raw.get("podcast_id_prefix", "")).strip(),
        podcast_pause_seconds=int(raw.get("podcast_pause_seconds", 1)),
        podcast_output_mode=str(raw.get("podcast_output_mode", "conservar audios separados")).strip()
        or "conservar audios separados",
        podcast_audio_output_mode=str(raw.get("podcast_audio_output_mode", "Un audio por lección")).strip()
        or "Un audio por lección",
        podcast_generate_lines_and_joined=bool(raw.get("podcast_generate_lines_and_joined", True)),
        podcast_use_multispeaker_v3=bool(raw.get("podcast_use_multispeaker_v3", False)),
        podcast_multispeaker_max_chars=max(500, int(raw.get("podcast_multispeaker_max_chars", 4500))),
        podcast_word_breakdown_enabled=bool(raw.get("podcast_word_breakdown_enabled", True)),
        podcast_active_listening_enabled=bool(raw.get("podcast_active_listening_enabled", False)),
        podcast_active_preset=str(raw.get("podcast_active_preset", "Repite conmigo")).strip()
        or "Repite conmigo",
        podcast_phrase_pause_ms=int(raw.get("podcast_phrase_pause_ms", 1000)),
        podcast_repeat_pause_ms=int(raw.get("podcast_repeat_pause_ms", 3000)),
        podcast_key_phrase_repetitions=int(raw.get("podcast_key_phrase_repetitions", 2)),
        podcast_include_slow_version=bool(raw.get("podcast_include_slow_version", True)),
        podcast_include_natural_version=bool(raw.get("podcast_include_natural_version", True)),
        podcast_include_brief_translation=bool(raw.get("podcast_include_brief_translation", True)),
        podcast_include_repeat_instruction=bool(raw.get("podcast_include_repeat_instruction", True)),
    )


def save_project_config(book: Book, config: ProjectConfig) -> None:
    config.elevenlabs_model_id = config.elevenlabs_model_id.strip() or DEFAULT_MODEL_ID
    config.elevenlabs_model_name = config.elevenlabs_model_name.strip() or (
        "Eleven Multilingual v2"
        if config.elevenlabs_model_id == DEFAULT_MODEL_ID
        else "Modelo personalizado"
    )
    path = book.folder / "project_config.json"
    path.write_text(
        json.dumps(asdict(config), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def matching_profile_voice(
    speaker: str, profiles: dict[str, dict[str, str]]
) -> str:
    wanted = speaker.strip().casefold()
    for name, profile in profiles.items():
        if name.strip().casefold() == wanted:
            return profile.get("voice_id", "").strip()
    return ""


def character_voice_id(
    speaker: str,
    profiles: dict[str, dict[str, str]],
    config: ProjectConfig,
    *,
    audio_type: str = "phrase",
) -> str:
    wanted = speaker.strip().casefold()
    for name, voice_id in config.character_voice_map.items():
        if name.strip().casefold() == wanted and voice_id.strip():
            return voice_id.strip()
    legacy_voice = matching_profile_voice(speaker, profiles)
    if legacy_voice:
        return legacy_voice
    if audio_type.casefold() == "word" or config.allow_default_voice:
        return profiles.get("default", {}).get("voice_id", "").strip()
    return ""
