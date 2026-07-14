from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

import requests

from .config import AppSettings


class ElevenLabsError(RuntimeError):
    pass


@dataclass(frozen=True)
class ElevenLabsModel:
    model_id: str
    name: str


class ElevenLabsClient:
    BASE_URL = "https://api.elevenlabs.io/v1/text-to-speech"
    MODELS_URL = "https://api.elevenlabs.io/v1/models"

    def __init__(self, api_key: str, settings: AppSettings) -> None:
        if not api_key.strip():
            raise ValueError("Falta la API key de ElevenLabs.")
        self.api_key = api_key.strip()
        self.settings = settings

    def list_models(self) -> list[ElevenLabsModel]:
        try:
            response = requests.get(
                self.MODELS_URL,
                headers={"xi-api-key": self.api_key, "Accept": "application/json"},
                timeout=(15, 60),
            )
        except requests.RequestException as exc:
            raise ElevenLabsError(f"No se pudo conectar con ElevenLabs: {exc}") from exc
        if not response.ok:
            detail = response.text[:500].replace("\n", " ")
            raise ElevenLabsError(
                f"No se pudieron cargar los modelos. ElevenLabs respondió "
                f"{response.status_code}: {detail}"
            )
        try:
            payload = response.json()
        except ValueError as exc:
            raise ElevenLabsError("ElevenLabs devolvió una lista de modelos inválida.") from exc
        if not isinstance(payload, list):
            raise ElevenLabsError("ElevenLabs devolvió una lista de modelos inválida.")
        models: list[ElevenLabsModel] = []
        for item in payload:
            if not isinstance(item, dict) or not item.get("can_do_text_to_speech", False):
                continue
            model_id = str(item.get("model_id", "")).strip()
            name = str(item.get("name", "")).strip()
            if model_id:
                models.append(ElevenLabsModel(model_id, name or model_id))
        if not models:
            raise ElevenLabsError("Tu cuenta no devolvió modelos disponibles para Text to Speech.")
        return sorted(models, key=lambda model: (model.name.casefold(), model.model_id))

    def generate_mp3(
        self, text: str, voice_id: str, destination: Path, *, model_id: str | None = None
    ) -> None:
        voice_id = voice_id.strip()
        if not re.fullmatch(r"[A-Za-z0-9_-]+", voice_id):
            raise ValueError("El Voice ID está vacío o contiene caracteres no permitidos.")
        temporary = destination.with_suffix(".mp3.part")
        try:
            response = requests.post(
                f"{self.BASE_URL}/{voice_id}",
                params={"output_format": "mp3_44100_128"},
                headers={
                    "xi-api-key": self.api_key, "Content-Type": "application/json",
                    "Accept": "audio/mpeg",
                },
                json={
                    "text": text,
                    "model_id": (model_id or self.settings.model_id).strip()
                    or "eleven_multilingual_v2",
                    "voice_settings": {
                        "stability": self.settings.stability,
                        "similarity_boost": self.settings.similarity_boost,
                        "style": self.settings.style,
                        "use_speaker_boost": self.settings.use_speaker_boost,
                    },
                },
                timeout=(15, 180),
            )
        except requests.RequestException as exc:
            raise ElevenLabsError(f"No se pudo conectar con ElevenLabs: {exc}") from exc
        if not response.ok:
            detail = response.text[:500].replace("\n", " ")
            if response.status_code in (400, 422):
                requested_model = (model_id or self.settings.model_id).strip()
                raise ElevenLabsError(
                    f"ElevenLabs rechazó el modelo '{requested_model}'. Verifica el model_id "
                    f"en la configuración del libro. Detalle: {detail}"
                )
            raise ElevenLabsError(f"ElevenLabs respondió {response.status_code}: {detail}")
        if not response.content:
            raise ElevenLabsError("ElevenLabs devolvió un archivo vacío.")
        destination.parent.mkdir(parents=True, exist_ok=True)
        try:
            temporary.write_bytes(response.content)
            temporary.replace(destination)
        finally:
            temporary.unlink(missing_ok=True)

    def generate_multispeaker_mp3(
        self,
        dialogue_text: str,
        speaker_voice_ids: dict[str, str],
        destination: Path,
        *,
        model_id: str | None = None,
    ) -> None:
        # ElevenLabs ha movido/limitado históricamente las APIs de diálogo
        # multi-speaker por cuenta/modelo. HanStory mantiene esta interfaz para
        # poder activarla cuando esté disponible, pero nunca debe bloquear el
        # flujo principal: el generador de podcast hace fallback automático a
        # línea por línea y concatenación local.
        if not speaker_voice_ids:
            raise ValueError("No hay voces asignadas para el diálogo multi-speaker.")
        raise ElevenLabsError(
            "La generación multi-speaker de ElevenLabs v3 no está disponible en "
            "este cliente local. Se usará fallback línea por línea."
        )
