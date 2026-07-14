from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Callable

from .book_manager import Book
from .config import MASTER_AUDIO_DIR, AppSettings, get_api_key
from .database import link_audio_to_book, register_audio_asset
from .elevenlabs_client import ElevenLabsClient
from .reports import ensure_reports, write_report
from .validators import ValidationResult, validate_book
from .project_config import ProjectConfig, character_voice_id, load_project_config


ProgressCallback = Callable[[int, int, str], None]


@dataclass
class GenerationResult:
    generated: list[str] = field(default_factory=list)
    existing: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    dry_run: bool = False
    used_text_tts: int = 0
    used_normal_text: int = 0
    model_id: str = ""
    acting_mode: bool = False


def _write_generation_report(
    book: Book,
    result: GenerationResult,
    validation: ValidationResult,
    project_config: ProjectConfig,
) -> None:
    write_report(
        book.reports_dir,
        "reporte_generacion.txt",
        [
            f"Modelo usado: {project_config.elevenlabs_model_name} ({result.model_id})",
            f"Acting / Variety Mode: {'Sí' if project_config.acting_mode_enabled else 'No'}",
            f"Audios que usaron text_tts: {result.used_text_tts}",
            f"Audios que usaron texto normal: {result.used_normal_text}",
            f"Personajes detectados: {', '.join(validation.detected_characters) or 'Ninguno'}",
            f"Personajes sin voz: {', '.join(validation.missing_characters) or 'Ninguno'}",
            f"Audios generados: {len(result.generated)}",
            f"Audios reutilizados: {len(result.existing)}",
            f"Errores: {len(result.errors)}",
            "",
            *(result.errors or ["Sin errores."]),
        ],
    )


def generate_book_audio(
    book: Book,
    profiles: dict[str, dict[str, str]],
    settings: AppSettings,
    *,
    dry_run: bool = False,
    regenerate_existing: bool = False,
    progress: ProgressCallback | None = None,
    project_config: ProjectConfig | None = None,
) -> tuple[GenerationResult, ValidationResult]:
    project_config = project_config or load_project_config(book)
    model_id = project_config.elevenlabs_model_id.strip()
    if not model_id:
        raise ValueError(
            "El model_id de ElevenLabs está vacío. Selecciona un modelo antes de generar."
        )
    validation = validate_book(book, profiles, project_config)
    result = GenerationResult(
        dry_run=dry_run,
        model_id=model_id,
        acting_mode=project_config.acting_mode_enabled,
    )
    ensure_reports(book.reports_dir)
    write_report(book.reports_dir, "resumen_libro.txt", validation.summary_lines())
    if not validation.is_valid:
        result.errors.extend(validation.errors)
        write_report(book.reports_dir, "errores.txt", result.errors)
        _write_generation_report(book, result, validation, project_config)
        return result, validation

    if regenerate_existing and settings.safe_mode and validation.existing and not dry_run:
        result.errors.append(
            "El modo seguro impide sobrescribir audios existentes. Desactívalo en Ajustes "
            "solo si realmente necesitas regenerarlos."
        )
        write_report(book.reports_dir, "errores.txt", result.errors)
        _write_generation_report(book, result, validation, project_config)
        return result, validation

    if not dry_run and not get_api_key():
        result.errors.append("Falta la API key de ElevenLabs. Configúrala en Voces y ajustes.")
        write_report(book.reports_dir, "errores.txt", result.errors)
        _write_generation_report(book, result, validation, project_config)
        return result, validation
    client = None if dry_run else ElevenLabsClient(get_api_key(), settings)
    existing_ids = set(validation.existing)
    for index, row in enumerate(validation.rows, start=1):
        if progress:
            progress(index, len(validation.rows), row.audio_id)
        destination = MASTER_AUDIO_DIR / f"{row.audio_id}.mp3"
        is_existing = row.audio_id in existing_ids
        if dry_run:
            if is_existing and not regenerate_existing:
                result.existing.append(row.audio_id)
            else:
                result.generated.append(row.audio_id)
                if row.text_tts.strip():
                    result.used_text_tts += 1
                else:
                    result.used_normal_text += 1
            continue
        if is_existing and not regenerate_existing:
            result.existing.append(row.audio_id)
            link_audio_to_book(book.book_id, row.audio_id)
            continue

        voice_id = character_voice_id(
            row.speaker, profiles, project_config, audio_type=row.audio_type
        )
        tts_text = row.text_for_tts(project_config.acting_mode_enabled)
        try:
            assert client is not None
            client.generate_mp3(tts_text, voice_id, destination, model_id=model_id)
            register_audio_asset(
                audio_id=row.audio_id, audio_type=row.audio_type, speaker=row.speaker,
                text=row.text, translation=row.translation, voice_id=voice_id,
                model_id=model_id, file_name=destination.name, tts_text=row.text_tts,
            )
            link_audio_to_book(book.book_id, row.audio_id)
            result.generated.append(row.audio_id)
            if row.text_tts.strip():
                result.used_text_tts += 1
            else:
                result.used_normal_text += 1
        except Exception as exc:
            result.errors.append(f"{row.audio_id}: {exc}")
        if settings.pause_seconds > 0 and index < len(validation.rows):
            time.sleep(settings.pause_seconds)

    if dry_run:
        prefix = "SIMULACIÓN — se generaría: "
        write_report(book.reports_dir, "audios_generados.txt", [prefix + item for item in result.generated])
    else:
        write_report(book.reports_dir, "audios_generados.txt", result.generated)
    write_report(book.reports_dir, "audios_existentes.txt", result.existing)
    write_report(book.reports_dir, "errores.txt", result.errors)
    _write_generation_report(book, result, validation, project_config)
    return result, validation
