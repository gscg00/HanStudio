from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

from .book_manager import Book
from .config import MASTER_AUDIO_DIR
from .csv_loader import AudioRow, load_audio_csv
from .database import get_audio_asset
from .technical_parser import parse_technical_file
from .project_config import ProjectConfig, character_voice_id, load_project_config


@dataclass
class ValidationResult:
    rows: list[AudioRow] = field(default_factory=list)
    lessons: dict[int, list[str]] = field(default_factory=dict)
    existing: list[str] = field(default_factory=list)
    new: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    detected_characters: list[str] = field(default_factory=list)
    missing_characters: list[str] = field(default_factory=list)

    @property
    def is_valid(self) -> bool:
        return not self.errors

    def summary_lines(self) -> list[str]:
        return [
            f"Total de filas: {len(self.rows)}",
            f"Audios existentes: {len(self.existing)}",
            f"Audios nuevos: {len(self.new)}",
            f"Errores: {len(self.errors)}",
            f"Warnings: {len(self.warnings)}",
            f"Personajes detectados: {', '.join(self.detected_characters) or 'Ninguno'}",
            f"Personajes sin voz: {', '.join(self.missing_characters) or 'Ninguno'}",
            "",
            "ERRORES",
            *(self.errors or ["Ninguno"]),
            "",
            "WARNINGS",
            *(self.warnings or ["Ninguno"]),
        ]


def asset_matches(row: AudioRow, asset) -> bool:
    return (
        asset["audio_type"].casefold() == row.audio_type.casefold()
        and asset["speaker"].strip().casefold() == row.speaker.strip().casefold()
        and asset["text"].strip() == row.text.strip()
        and asset["tts_text"].strip() == row.text_tts.strip()
    )


def validate_book(
    book: Book,
    profiles: dict[str, dict[str, str]],
    project_config: ProjectConfig | None = None,
) -> ValidationResult:
    result = ValidationResult()
    project_config = project_config or load_project_config(book)
    if not book.csv_path.exists():
        result.errors.append("Falta Audio_Master.csv.")
        return result
    try:
        result.rows = load_audio_csv(book.csv_path)
    except Exception as exc:
        result.errors.append(str(exc))
        return result

    result.detected_characters = sorted(
        {row.speaker.strip() for row in result.rows if row.audio_type == "phrase" and row.speaker.strip()},
        key=str.casefold,
    )
    result.missing_characters = [
        speaker
        for speaker in result.detected_characters
        if not character_voice_id(speaker, profiles, project_config, audio_type="phrase")
    ]
    if result.missing_characters:
        result.errors.append(
            "Faltan voces para estos personajes: "
            + ", ".join(result.missing_characters)
            + ". Asígnalas en Audios → Personajes y voces."
        )

    if not book.technical_path.exists():
        result.errors.append("Falta Audios_Tecnico.txt.")
    else:
        try:
            result.lessons = parse_technical_file(book.technical_path)
            csv_ids = {row.audio_id.casefold(): row.audio_id for row in result.rows}
            for lesson, audio_ids in result.lessons.items():
                for audio_id in audio_ids:
                    canonical_id = csv_ids.get(audio_id.casefold())
                    if canonical_id is None:
                        result.errors.append(
                            f"Lección {lesson:02d}: {audio_id} aparece en el técnico pero no en el CSV."
                        )
                    elif canonical_id != audio_id:
                        result.errors.append(
                            f"Lección {lesson:02d}: usa '{canonical_id}' con las mismas mayúsculas "
                            f"que el CSV, no '{audio_id}'."
                        )
        except Exception as exc:
            result.errors.append(str(exc))

    for row in result.rows:
        asset = get_audio_asset(row.audio_id)
        if asset is not None and asset["audio_id"] != row.audio_id:
            result.errors.append(
                f"{row.audio_id}: el catálogo ya usa '{asset['audio_id']}'. "
                "Conserva exactamente las mismas mayúsculas y minúsculas."
            )
            continue
        audio_file = MASTER_AUDIO_DIR / (asset["file_name"] if asset is not None else f"{row.audio_id}.mp3")
        if asset is not None and not asset_matches(row, asset):
            result.errors.append(
                f"COLISIÓN {row.audio_id}: ya pertenece a otro texto, tipo o personaje. "
                "Usa un ID globalmente único."
            )
            continue
        if audio_file.exists() and asset is None:
            result.errors.append(
                f"{row.audio_id}.mp3 existe pero no está registrado en la biblioteca. "
                "No se reutilizará hasta verificarlo."
            )
            continue
        if asset is not None and not audio_file.exists():
            result.warnings.append(f"{row.audio_id}: está catalogado pero falta el MP3; se regenerará.")
            result.new.append(row.audio_id)
        elif asset is not None and audio_file.exists():
            result.existing.append(row.audio_id)
        else:
            result.new.append(row.audio_id)
        if row.audio_id in result.new and not character_voice_id(
            row.speaker, profiles, project_config, audio_type=row.audio_type
        ):
            if row.audio_type == "phrase" and row.speaker in result.missing_characters:
                continue
            result.errors.append(
                f"{row.audio_id}: falta Voice ID para '{row.speaker or 'default'}'."
            )
    return result
