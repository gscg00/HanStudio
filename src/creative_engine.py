from __future__ import annotations

import csv
import json
import re
from abc import ABC, abstractmethod
from dataclasses import asdict, dataclass
from pathlib import Path

import requests

from .book_manager import Book
from .config import get_creative_api_key, get_openai_api_key
from .project_config import ProjectConfig, load_project_config
from .source_manager import SourceRecord, SourceSegment, save_segments


@dataclass(frozen=True)
class CreativeRequest:
    source_text: str
    source_language: str
    target_language: str
    explanation_language: str
    level: str
    mode: str
    no_full_translation: bool = False
    allow_original_dialogue: bool = False
    model_name: str = ""
    temperature: float = 0.3
    max_tokens: int = 4000
    api_key: str = ""


@dataclass(frozen=True)
class CreativeDraft:
    target_text: str
    explanation: str
    key_phrases: str
    vocabulary: str
    mini_practice: str
    notes: str
    warnings: tuple[str, ...] = ()


@dataclass(frozen=True)
class CreativeRuntime:
    provider_name: str
    model_name: str
    api_key: str
    temperature: float
    max_tokens: int

    @property
    def openai_ready(self) -> bool:
        return self.provider_name == "OpenAI" and bool(self.model_name) and bool(self.api_key)


_CONNECTION_STATUS: dict[tuple[str, str], bool] = {}


def load_creative_runtime(book: Book) -> CreativeRuntime:
    """Single shared source of truth for every creative-engine consumer."""
    config = load_project_config(book)
    engine = get_engine(config.creative_provider_name)
    return CreativeRuntime(config.creative_provider_name, config.creative_model_name, engine.get_api_key() if engine.sends_data_externally else "", config.creative_temperature, config.creative_max_tokens)


def test_creative_runtime(book: Book) -> str:
    runtime = load_creative_runtime(book)
    if runtime.provider_name != "OpenAI": raise ValueError("Selecciona OpenAI como proveedor primero.")
    result = get_engine("OpenAI").test_connection(runtime.api_key, runtime.model_name)
    _CONNECTION_STATUS[(book.code, runtime.model_name)] = True
    return result


def creative_runtime_connected(book: Book, runtime: CreativeRuntime | None = None) -> bool:
    runtime = runtime or load_creative_runtime(book)
    return _CONNECTION_STATUS.get((book.code, runtime.model_name), False)


class CreativeEngine(ABC):
    provider_name = ""
    sends_data_externally = False

    def get_api_key(self) -> str:
        return get_creative_api_key()

    def test_connection(self, api_key: str, model_name: str) -> str:
        raise NotImplementedError("Este proveedor no ofrece una prueba de conexión.")

    @abstractmethod
    def generate_translation(self, request: CreativeRequest) -> CreativeDraft:
        raise NotImplementedError

    @abstractmethod
    def generate_lesson(self, request: CreativeRequest) -> CreativeDraft:
        raise NotImplementedError

    @abstractmethod
    def generate_vocab(self, request: CreativeRequest) -> str:
        raise NotImplementedError

    @abstractmethod
    def generate_explanations(self, request: CreativeRequest) -> str:
        raise NotImplementedError


class ManualPlaceholderEngine(CreativeEngine):
    provider_name = "Manual / Placeholder"

    def _draft(self, request: CreativeRequest, action: str) -> CreativeDraft:
        same_language = request.source_language.casefold() == request.target_language.casefold()
        target = request.source_text.strip() if same_language else ""
        warning = (
            f"Proveedor manual: escribe y revisa el texto en {request.target_language}. "
            "No se realizó ninguna llamada externa."
        )
        return CreativeDraft(
            target_text=target,
            explanation=(
                f"Borrador manual pendiente en {request.explanation_language}. "
                f"Modo solicitado: {action}; nivel {request.level}."
            ),
            key_phrases="Pendiente: selecciona las frases clave después de revisar el texto objetivo.",
            vocabulary=self.generate_vocab(request),
            mini_practice="Pendiente: agrega una pregunta de comprensión y una práctica breve.",
            notes=warning,
            warnings=(warning,),
        )

    def generate_translation(self, request: CreativeRequest) -> CreativeDraft:
        return self._draft(request, "Traducción fiel")

    def generate_lesson(self, request: CreativeRequest) -> CreativeDraft:
        return self._draft(request, request.mode)

    def generate_vocab(self, request: CreativeRequest) -> str:
        words = re.findall(r"[^\W\d_]{3,}", request.source_text, flags=re.UNICODE)
        unique = list(dict.fromkeys(words))[:12]
        return "\n".join(f"• {word} — pendiente de explicación" for word in unique)

    def generate_explanations(self, request: CreativeRequest) -> str:
        return f"Explicación manual pendiente en {request.explanation_language}."


class OpenAICreativeEngine(CreativeEngine):
    provider_name = "OpenAI"
    sends_data_externally = True
    BASE_URL = "https://api.openai.com/v1"

    def get_api_key(self) -> str:
        return get_openai_api_key()

    def test_connection(self, api_key: str, model_name: str) -> str:
        api_key = api_key.strip()
        model_name = model_name.strip()
        if not api_key:
            raise ValueError("Falta OPENAI_API_KEY.")
        if not model_name:
            raise ValueError("Selecciona un modelo de OpenAI.")
        try:
            response = requests.get(
                f"{self.BASE_URL}/models/{model_name}",
                headers={"Authorization": f"Bearer {api_key}"},
                timeout=(15, 60),
            )
        except requests.RequestException as exc:
            raise RuntimeError(f"No se pudo conectar con OpenAI: {exc}") from exc
        if not response.ok:
            detail = response.text[:500].replace("\n", " ")
            raise RuntimeError(f"OpenAI respondió {response.status_code}: {detail}")
        payload = response.json()
        return f"Conexión correcta. Modelo disponible: {payload.get('id', model_name)}"

    def generate_translation(self, request: CreativeRequest) -> CreativeDraft:
        return self._generate(request, "Traducción fiel")

    def generate_lesson(self, request: CreativeRequest) -> CreativeDraft:
        return self._generate(request, request.mode)

    def generate_vocab(self, request: CreativeRequest) -> str:
        return self._generate(request, "Vocabulario en contexto").vocabulary

    def generate_explanations(self, request: CreativeRequest) -> str:
        return self._generate(request, "Explicación gramatical").explanation

    def generate_structured_json(
        self,
        *,
        api_key: str,
        model_name: str,
        instructions: str,
        prompt: str,
        temperature: float = 0.2,
        max_tokens: int = 6000,
    ) -> dict:
        api_key = api_key.strip()
        model_name = model_name.strip()
        if not api_key:
            raise ValueError("Falta OPENAI_API_KEY.")
        if not model_name:
            raise ValueError("Selecciona un modelo de OpenAI.")
        body = {
            "model": model_name,
            "instructions": instructions,
            "input": prompt,
            "max_output_tokens": max_tokens,
            "temperature": temperature,
        }
        try:
            response = requests.post(
                f"{self.BASE_URL}/responses",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=body,
                timeout=(15, 240),
            )
        except requests.RequestException as exc:
            raise RuntimeError(f"No se pudo conectar con OpenAI: {exc}") from exc
        if not response.ok:
            detail = response.text[:800].replace("\n", " ")
            raise RuntimeError(f"OpenAI respondió {response.status_code}: {detail}")
        text = self._response_text(response.json()).strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.IGNORECASE)
        try:
            payload = json.loads(text)
        except json.JSONDecodeError as exc:
            raise RuntimeError("OpenAI devolvió una respuesta que no es JSON válido.") from exc
        if not isinstance(payload, dict):
            raise RuntimeError("OpenAI devolvió JSON, pero no es un objeto.")
        return payload

    def _generate(self, request: CreativeRequest, task: str) -> CreativeDraft:
        if not request.api_key.strip():
            raise ValueError("Falta OPENAI_API_KEY.")
        if not request.model_name.strip():
            raise ValueError("Selecciona un modelo de OpenAI.")
        no_translation = (
            "No incluyas una traducción completa. Incluye traducción solo en frases clave, "
            "además de explicaciones, vocabulario y comprensión."
            if request.no_full_translation
            else "Puedes incluir una traducción completa cuando sea pedagógicamente útil."
        )
        original_dialogue = (
            "Puedes crear diálogos originales inspirados en la escena."
            if request.allow_original_dialogue
            else "No inventes diálogos nuevos; trabaja solo con el contenido dado."
        )
        instructions = (
            "Eres el Motor creativo de HanStory Studio. Devuelve exclusivamente un objeto JSON "
            "válido, sin Markdown, con estas claves de texto: target_text, explanation, "
            "key_phrases, vocabulary, mini_practice, notes. Todo es un BORRADOR que será "
            "revisado por una persona. No afirmes que ya fue revisado."
        )
        prompt = f"""Tarea: {task}
Modo: {request.mode}
Nivel objetivo: {request.level}
Idioma fuente: {request.source_language}
Idioma objetivo: {request.target_language}
Idioma de explicación: {request.explanation_language}
{no_translation}
{original_dialogue}

Texto fuente:
---
{request.source_text}
---

Requisitos:
- target_text: traducción, adaptación o lección en el idioma objetivo según la tarea.
- explanation: explicación gramatical y didáctica en el idioma de explicación.
- key_phrases: frases clave con traducción breve cuando corresponda.
- vocabulary: vocabulario en contexto con significado.
- mini_practice: preguntas de comprensión o práctica breve.
- notes: decisiones, dudas y advertencias para revisión humana.
"""
        body = {
            "model": request.model_name,
            "instructions": instructions,
            "input": prompt,
            "max_output_tokens": request.max_tokens,
            "temperature": request.temperature,
        }
        try:
            response = requests.post(
                f"{self.BASE_URL}/responses",
                headers={
                    "Authorization": f"Bearer {request.api_key}",
                    "Content-Type": "application/json",
                },
                json=body,
                timeout=(15, 240),
            )
        except requests.RequestException as exc:
            raise RuntimeError(f"No se pudo conectar con OpenAI: {exc}") from exc
        if not response.ok:
            detail = response.text[:800].replace("\n", " ")
            raise RuntimeError(f"OpenAI respondió {response.status_code}: {detail}")
        text = self._response_text(response.json())
        try:
            cleaned = text.strip()
            if cleaned.startswith("```"):
                cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", cleaned, flags=re.IGNORECASE)
            payload = json.loads(cleaned)
        except (TypeError, json.JSONDecodeError) as exc:
            raise RuntimeError("OpenAI devolvió un borrador que no pudo interpretarse como JSON.") from exc
        if not isinstance(payload, dict):
            raise RuntimeError("OpenAI devolvió un borrador con formato inesperado.")
        return CreativeDraft(
            target_text=self._field(payload.get("target_text")),
            explanation=self._field(payload.get("explanation")),
            key_phrases=self._field(payload.get("key_phrases")),
            vocabulary=self._field(payload.get("vocabulary")),
            mini_practice=self._field(payload.get("mini_practice")),
            notes=self._field(payload.get("notes")),
            warnings=("Borrador generado por OpenAI: requiere revisión humana.",),
        )

    @staticmethod
    def _field(value) -> str:
        if isinstance(value, list):
            return "\n".join(f"• {item}" for item in value)
        return str(value or "").strip()

    @staticmethod
    def _response_text(payload: dict) -> str:
        if isinstance(payload.get("output_text"), str):
            return payload["output_text"]
        parts: list[str] = []
        for output in payload.get("output", []):
            if not isinstance(output, dict):
                continue
            for content in output.get("content", []):
                if isinstance(content, dict) and content.get("type") in {"output_text", "text"}:
                    parts.append(str(content.get("text", "")))
        if not parts:
            raise RuntimeError("OpenAI no devolvió texto para el borrador.")
        return "\n".join(parts)


_ENGINES: dict[str, CreativeEngine] = {}


def register_engine(engine: CreativeEngine) -> None:
    if not engine.provider_name.strip():
        raise ValueError("El proveedor creativo necesita un nombre.")
    _ENGINES[engine.provider_name] = engine


def available_engines() -> list[str]:
    return sorted(_ENGINES, key=str.casefold)


def get_engine(provider_name: str) -> CreativeEngine:
    try:
        return _ENGINES[provider_name]
    except KeyError as exc:
        raise ValueError(
            f"El proveedor creativo '{provider_name}' no está instalado. "
            "Selecciona Manual / Placeholder o instala un conector compatible."
        ) from exc


def process_segment(
    book: Book,
    record: SourceRecord,
    segments: list[SourceSegment],
    segment_index: int,
    config: ProjectConfig,
    *,
    action: str,
    level: str,
    mode: str,
    no_full_translation: bool,
    allow_original_dialogue: bool = False,
    external_consent: bool = False,
) -> tuple[SourceSegment, CreativeDraft, Path]:
    if segment_index < 0 or segment_index >= len(segments):
        raise ValueError("Selecciona un segmento válido.")
    segment = segments[segment_index]
    engine = get_engine(config.creative_provider_name)
    api_key = ""
    if engine.sends_data_externally:
        if not external_consent:
            raise PermissionError(
                "Debes confirmar explícitamente que este texto puede enviarse al proveedor externo."
            )
        api_key = engine.get_api_key()
        if not api_key:
            raise ValueError("Falta la API key del proveedor creativo.")
    request = CreativeRequest(
        source_text=segment.source_text,
        source_language=config.source_language,
        target_language=config.target_language,
        explanation_language=config.explanation_language,
        level=level,
        mode=mode,
        no_full_translation=no_full_translation,
        allow_original_dialogue=allow_original_dialogue,
        model_name=config.creative_model_name,
        temperature=config.creative_temperature,
        max_tokens=config.creative_max_tokens,
        api_key=api_key,
    )
    if action == "translation":
        draft = engine.generate_translation(request)
    elif action == "vocab":
        draft = CreativeDraft(
            segment.target_text, segment.explanation, segment.key_phrases,
            engine.generate_vocab(request), segment.mini_practice, segment.notes,
        )
    elif action == "explanations":
        draft = CreativeDraft(
            segment.target_text, engine.generate_explanations(request), segment.key_phrases,
            segment.vocabulary, segment.mini_practice, segment.notes,
        )
    else:
        draft = engine.generate_lesson(request)
    segment.target_text = draft.target_text
    segment.explanation = draft.explanation
    segment.key_phrases = draft.key_phrases
    segment.vocabulary = draft.vocabulary
    segment.mini_practice = draft.mini_practice
    segment.notes = draft.notes
    segment.status = "Borrador generado"
    save_segments(book, record.source_id, segments)
    output = write_partial_outputs(book, record, segment, segment_index + 1, config, draft)
    return segment, draft, output


def write_partial_outputs(
    book: Book,
    record: SourceRecord,
    segment: SourceSegment,
    lesson_number: int,
    config: ProjectConfig,
    draft: CreativeDraft,
) -> Path:
    output = book.folder / "sources" / record.source_id / "creative" / segment.segment_id
    output.mkdir(parents=True, exist_ok=True)
    sentences = [
        item.strip()
        for item in re.split(r"(?<=[.!?。！？])\s+|\n+", segment.target_text)
        if item.strip()
    ]
    ids: list[str] = []
    with (output / "Audio_Master.csv").open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(("id", "type", "speaker_or_blank", "text", "translation_or_blank", "text_tts"))
        for sequence, sentence in enumerate(sentences, start=1):
            audio_id = f"SRC-{record.source_id.upper()}-{lesson_number:03d}-{sequence:03d}"
            ids.append(audio_id)
            writer.writerow((audio_id, "phrase", "Narrador", sentence, "", sentence))
    (output / "Audios_Tecnico.txt").write_text(
        f"### Lección {lesson_number:02d}\nFrases: {', '.join(ids)}\n", encoding="utf-8"
    )
    (output / "creative_draft.json").write_text(
        json.dumps(
            {
                "provider": config.creative_provider_name,
                "segment": asdict(segment),
                "draft": asdict(draft),
            },
            ensure_ascii=False,
            indent=2,
        ) + "\n",
        encoding="utf-8",
    )
    return output


register_engine(ManualPlaceholderEngine())
register_engine(OpenAICreativeEngine())
