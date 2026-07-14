from __future__ import annotations

import csv
import html
import json
import re
import shutil
import subprocess
import tempfile
import time
import wave
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable

from .book_manager import Book
from .config import AppSettings, get_api_key, get_openai_api_key
from .creative_engine import get_engine
from .csv_loader import AudioRow, load_audio_csv
from .elevenlabs_client import ElevenLabsClient
from .project_config import ProjectConfig, character_voice_id, load_project_config
from .technical_parser import parse_technical_file


PODCAST_COLUMNS = (
    "id",
    "type",
    "speaker_or_blank",
    "text",
    "translation_or_blank",
    "text_tts",
    "lesson",
    "section",
    "pause_after_ms",
    "repeat_count",
    "repeat_style",
    "is_key_phrase",
    "playback_speed_hint",
)
PODCAST_MODES = ("Audiolibro", "Podcast explicado", "Shadowing", "Repaso rápido")
PODCAST_SECTIONS = (
    "intro",
    "scene",
    "explanation",
    "breakdown",
    "word_repeat",
    "phrase_repeat",
    "grammar",
    "review",
    "outro",
    # Se conservan por compatibilidad con guiones antiguos.
    "vocab",
    "shadowing",
)
PODCAST_AUDIO_OUTPUT_MODES = (
    "Audios separados por línea",
    "Un audio por lección",
    "Un audio por capítulo",
    "Un audio completo del proyecto/libro",
    "Generar separados + generar unidos",
)
ACTIVE_LISTENING_PRESETS = (
    "Escucha normal",
    "Repite conmigo",
    "Dictado suave",
    "Frases clave intensivo",
)
ID_SAFE = re.compile(r"[^A-Za-z0-9_-]+")
FORBIDDEN_EXPLANATION_PHRASES = (
    "palabra importante según el contexto",
    "bloque importante de la frase",
    "revisa su sentido dentro del contexto",
    "se usa para expresar esta idea de forma natural",
    "literalmente sería algo como: palabra importante",
)
PENDING_EXPLANATION = "Explicación pendiente: requiere motor creativo o revisión manual."
KOREAN_PARTICLES = ("에서", "하고", "에게", "한테", "으로", "로", "은", "는", "이", "가", "을", "를", "에", "도", "만", "과", "와")
KOREAN_PARTICLE_EXPLANATIONS = {
    "은": "은 es una partícula de tema. Marca de qué estamos hablando.",
    "는": "는 es una partícula de tema. Marca de qué estamos hablando.",
    "이": "이 es una partícula de sujeto. Puede marcar sujeto, foco o la entidad que existe o se describe, según el contexto.",
    "가": "가 es una partícula de sujeto. Puede marcar sujeto, foco o la entidad que existe o se describe, según el contexto.",
    "을": "을 es una partícula de objeto. Marca lo que recibe la acción.",
    "를": "를 es una partícula de objeto. Marca lo que recibe la acción.",
    "에": "에 suele marcar lugar, destino, tiempo o ubicación.",
    "에서": "에서 marca el lugar donde ocurre una acción.",
    "도": "도 significa “también” o “incluso”, según el contexto.",
    "만": "만 significa “solo” o “solamente”.",
    "하고": "하고 significa “y” o “con”, en estilo conversacional.",
    "과": "과 significa “y” o “con”. Se usa después de consonante.",
    "와": "와 significa “y” o “con”. Se usa después de vocal.",
}
KOREAN_ENDING_EXPLANATIONS = {
    "-지만": "-지만 significa “pero” o “aunque”. Une una idea con contraste; no debe explicarse como 만 = “solo”.",
}
KOREAN_WORD_HINTS = {
    "저기": "allá, ahí lejos",
    "여기": "aquí",
    "거기": "ahí",
    "사람": "persona",
    "한국어": "coreano, idioma coreano",
    "몰라요": "no sé, no entiendo",
    "알아요": "sé, entiendo",
    "있어요": "hay, existe, está",
    "없어요": "no hay, no existe, no está",
    "스킵": "saltar, skip",
    "수": "posibilidad o capacidad",
    "없습니다": "no hay, no existe; en esta estructura indica que no se puede",
    "할": "hacer, en forma que conecta con 수",
}


@dataclass(frozen=True)
class PodcastRow:
    audio_id: str
    audio_type: str
    speaker: str
    text: str
    translation: str = ""
    text_tts: str = ""
    lesson: int = 0
    section: str = "scene"
    pause_after_ms: int = 0
    repeat_count: int = 1
    repeat_style: str = "normal"
    is_key_phrase: bool = False
    playback_speed_hint: str = "normal"

    def text_for_tts(self, acting_mode: bool) -> str:
        value = self.text_tts.strip() or self.text
        if acting_mode and self.text_tts.strip():
            return value
        return re.sub(r"\s*\[[^\]\r\n]+\]\s*", " ", value).strip()


@dataclass
class PodcastOptions:
    mode: str = "Podcast explicado"
    lesson_start: int | None = None
    lesson_end: int | None = None
    id_prefix: str = ""
    pause_seconds: int = 1
    output_mode: str = "conservar audios separados"
    shadowing_repetitions: int = 2
    include_anki_suggestions: bool = False
    active_listening_enabled: bool = False
    active_preset: str = "Repite conmigo"
    phrase_pause_ms: int = 1000
    repeat_pause_ms: int = 3000
    key_phrase_repetitions: int = 2
    include_slow_version: bool = True
    include_natural_version: bool = True
    include_brief_translation: bool = True
    include_repeat_instruction: bool = True
    audio_output_mode: str = "Un audio por lección"
    generate_lines_and_joined: bool = True
    use_multispeaker_v3: bool = False
    multispeaker_max_chars: int = 4500
    word_breakdown_enabled: bool = True


@dataclass
class PodcastPackage:
    rows: list[PodcastRow]
    output_dir: Path
    csv_path: Path
    technical_path: Path
    script_path: Path
    report_path: Path
    required_voices: list[str]
    missing_voices: list[str]


@dataclass
class PodcastAudioResult:
    generated: list[str] = field(default_factory=list)
    existing: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    missing_voices: list[str] = field(default_factory=list)
    dry_run: bool = False
    character_count: int = 0
    silence_files: list[str] = field(default_factory=list)
    joined_files: list[str] = field(default_factory=list)
    full_audio: str = ""
    playlist: str = ""
    blocks_sent: int = 0
    block_characters: list[int] = field(default_factory=list)
    generation_mode_used: str = "línea por línea"
    fallback_warnings: list[str] = field(default_factory=list)


ProgressCallback = Callable[[int, int, str], None]


def podcast_paths(book: Book) -> dict[str, Path]:
    return {
        "root": book.output_dir / "Podcast",
        "audio": book.output_dir / "Podcast" / "podcast_lines",
        "legacy_audio": book.output_dir / "Podcast" / "Audio",
        "lines": book.output_dir / "Podcast" / "podcast_lines",
        "by_lesson": book.output_dir / "Podcast" / "podcast_by_lesson",
        "full": book.output_dir / "Podcast" / "podcast_full",
        "playlists": book.output_dir / "Podcast" / "playlists",
        "drafts": book.output_dir / "Podcast" / "drafts",
        "silences": book.output_dir / "Podcast" / "Silences",
        "csv": book.folder / "Podcast_Master.csv",
        "technical": book.folder / "Podcast_Tecnico.txt",
        "script": book.folder / "Podcast_Guion.txt",
        "report": book.folder / "Podcast_Report.txt",
    }


def default_podcast_prefix(book: Book, config: ProjectConfig | None = None) -> str:
    configured = (config.podcast_id_prefix if config else "").strip()
    if configured:
        return _safe_prefix(configured)
    code = _safe_prefix(book.code).upper()
    digits = "".join(re.findall(r"\d+", code))
    if digits:
        return f"PODB{int(digits):02d}"
    return f"POD{code or 'BOOK'}"


def _safe_prefix(value: str) -> str:
    return ID_SAFE.sub("", value.strip()).upper() or "POD"


def podcast_draft_path(book: Book, lesson_number: int) -> Path:
    return podcast_paths(book)["drafts"] / f"lesson_{lesson_number:02d}.json"


def load_podcast_draft(book: Book, lesson_number: int) -> dict:
    path = podcast_draft_path(book, lesson_number)
    if not path.exists():
        return {}
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(f"No se pudo leer el borrador de podcast: {exc}") from exc
    if not isinstance(payload, dict):
        raise ValueError("El borrador de podcast no contiene JSON válido.")
    return payload


def save_podcast_draft(book: Book, lesson_number: int, payload: dict) -> Path:
    path = podcast_draft_path(book, lesson_number)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path


def set_podcast_draft_status(book: Book, lesson_number: int, status: str) -> dict:
    payload = load_podcast_draft(book, lesson_number)
    if not payload:
        raise ValueError("No hay borrador para esta lección.")
    payload["hanstory_status"] = status
    for phrase in payload.get("key_phrases", []):
        if isinstance(phrase, dict) and phrase.get("hanstory_status") in {"Explicada por OpenAI", "Revisada"}:
            phrase["hanstory_status"] = "Aprobada" if status in {"Listo para podcast", "Guion generado"} else "Revisada"
    save_podcast_draft(book, lesson_number, payload)
    return payload


def lesson_scene_rows(book: Book, lesson_number: int) -> list[AudioRow]:
    rows = load_audio_csv(book.csv_path)
    row_by_id = {row.audio_id.casefold(): row for row in rows}
    lessons = parse_technical_file(book.technical_path)
    if lesson_number not in lessons:
        raise ValueError(f"No existe la Lección {lesson_number:02d} en Audios_Tecnico.txt.")
    return [
        row_by_id[audio_id.casefold()]
        for audio_id in lessons[lesson_number]
        if audio_id.casefold() in row_by_id
    ]


def generate_podcast_explanation_with_openai(
    book: Book,
    config: ProjectConfig,
    lesson_number: int,
    *,
    phrase_filter: str = "",
) -> dict:
    if config.creative_provider_name != "OpenAI":
        raise ValueError(
            "Para generar explicaciones didácticas reales necesitas seleccionar OpenAI "
            "en Fuentes → Motor creativo."
        )
    api_key = get_openai_api_key()
    if not api_key:
        raise ValueError(
            "Falta OPENAI_API_KEY. Configúrala en Fuentes → Motor creativo antes de generar Podcast explicado."
        )
    if not config.creative_model_name.strip():
        raise ValueError("Selecciona un modelo de OpenAI en Fuentes → Motor creativo.")
    scene_rows = lesson_scene_rows(book, lesson_number)
    if phrase_filter.strip():
        wanted = phrase_filter.strip()
        scene_rows = [row for row in scene_rows if row.text.strip() == wanted]
        if not scene_rows:
            raise ValueError("No encontré esa frase exacta en la lección.")
    scene_text = "\n".join(
        f"{row.speaker or 'Narrador'}: {row.text}"
        + (f" — {row.translation}" if row.translation else "")
        for row in scene_rows
    )
    engine = get_engine("OpenAI")
    if not hasattr(engine, "generate_structured_json"):
        raise ValueError("El proveedor OpenAI instalado no soporta JSON estructurado para podcast.")
    payload = engine.generate_structured_json(
        api_key=api_key,
        model_name=config.creative_model_name,
        instructions=PODCAST_OPENAI_INSTRUCTIONS,
        prompt=podcast_openai_prompt(book, config, lesson_number, scene_text, phrase_filter),
        temperature=config.creative_temperature,
        max_tokens=max(config.creative_max_tokens, 6000),
    )
    payload.setdefault("lesson_number", lesson_number)
    payload.setdefault("lesson_title", f"Lección {lesson_number:02d}")
    payload["hanstory_status"] = "Borrador generado por OpenAI"
    payload["hanstory_validation_errors"] = validate_podcast_draft_quality(payload, scene_rows)
    for phrase in payload.get("key_phrases", []):
        if isinstance(phrase, dict):
            phrase.setdefault(
                "hanstory_status",
                "Requiere revisión manual" if payload["hanstory_validation_errors"] else "Explicada por OpenAI",
            )
    save_podcast_draft(book, lesson_number, payload)
    return payload


PODCAST_OPENAI_INSTRUCTIONS = """Eres un profesor experto de coreano para hispanohablantes. Vas a crear una lección en escucha tipo podcast a partir de una escena en coreano.

Reglas:
- Explica en español claro y natural.
- No traduzcas toda la escena línea por línea, salvo que el modo del proyecto lo permita.
- Sí puedes traducir frases clave.
- No uses explicaciones genéricas.
- Nunca escribas “palabra importante según el contexto”.
- Nunca escribas “bloque importante de la frase”.
- Nunca escribas “revisa su sentido dentro del contexto”.
- Si no estás seguro, marca “requiere revisión”.
- Divide frases largas en oraciones más pequeñas.
- Para cada frase clave, explica significado natural, literal si ayuda, palabra por palabra, partículas, patrones gramaticales, tono, cómo escucharla y cómo repetirla.
- Para frases largas, primero desglosa palabra por palabra y luego repite la frase completa.
- No separes mecánicamente terminaciones como -지만 en 지 + 만 si eso causa una explicación falsa.
- No expliques nombres propios como vocabulario salvo que sea útil.
- El resultado debe sonar como una clase real de audio, no como una tabla automática.

Patrones coreanos a detectar:
- -아/어야 하다 = tener que / deber
- -고 싶다 = querer
- -ㄹ/을 거예요 = futuro / intención
- -ㄹ/을 것 같아요 = parece que / creo que
- -아/어 보다 = probar / intentar
- -아/어 본 적이 있다/없다 = haber tenido o no experiencia
- -지만 = pero / aunque
- -으면/면 = si
- -까지 = hasta
- -부터 = desde
- -하고 = y / con
- -도 = también
- -은/는 = tema o contraste
- -이/가 = sujeto, foco o existencia según contexto
- -을/를 = objeto
- -에 = lugar, destino o tiempo según contexto
- -에서 = lugar donde ocurre una acción
- -잖아요 = “ya sabes”, “¿verdad?”, busca acuerdo

Devuelve exclusivamente JSON válido con esta forma:
{
  "lesson_number": 1,
  "lesson_title": "...",
  "scene_summary_es": "...",
  "key_phrases": [
    {
      "speaker": "...",
      "phrase": "...",
      "natural_translation_es": "...",
      "literal_note_es": "...",
      "tone_es": "...",
      "breakdown": [
        {"korean": "...", "meaning_es": "...", "function_es": "..."}
      ],
      "grammar_notes": [
        {"pattern": "...", "explanation_es": "..."}
      ],
      "listening_steps": [
        {"type": "teacher_explanation", "text": "..."},
        {"type": "word_repeat", "speaker": "...", "text": "...", "style": "slow", "pause_after_ms": 1500},
        {"type": "word_explanation", "text": "..."},
        {"type": "phrase_repeat", "speaker": "...", "text": "...", "style": "slow", "pause_after_ms": 3000},
        {"type": "phrase_repeat", "speaker": "...", "text": "...", "style": "natural", "pause_after_ms": 1500}
      ]
    }
  ],
  "review_section": {
    "teacher_text_es": "...",
    "phrases": []
  }
}"""


def podcast_openai_prompt(
    book: Book,
    config: ProjectConfig,
    lesson_number: int,
    scene_text: str,
    phrase_filter: str = "",
) -> str:
    no_translation = (
        "El proyecto tiene activado 'sin traducción completa': NO traduzcas toda la escena; "
        "sí traduce y explica frases clave."
        if config.no_full_translation_enabled
        else "Puedes usar traducción natural cuando sea pedagógicamente útil."
    )
    phrase_line = f"Regenera solo esta frase exacta: {phrase_filter}\n" if phrase_filter.strip() else ""
    return f"""Libro: {book.title}
Lección: {lesson_number:02d}
Idioma objetivo: {config.target_language}
Idioma de explicación: {config.explanation_language}
{no_translation}
{phrase_line}
Escena original:
---
{scene_text}
---

Genera un borrador didáctico real para Podcast explicado. Conserva los speakers originales cuando aparezcan.
"""


def validate_podcast_draft_quality(payload: dict, original_rows: list[AudioRow]) -> list[str]:
    errors: list[str] = []
    text_blob = json.dumps(payload, ensure_ascii=False).casefold()
    for phrase in FORBIDDEN_EXPLANATION_PHRASES:
        if phrase.casefold() in text_blob:
            errors.append(f"Contiene frase prohibida: {phrase}")
    originals = {row.text.strip() for row in original_rows}
    key_phrases = payload.get("key_phrases")
    if not isinstance(key_phrases, list) or not key_phrases:
        errors.append("No contiene key_phrases.")
        return errors
    for index, item in enumerate(key_phrases, start=1):
        if not isinstance(item, dict):
            errors.append(f"Frase clave {index}: formato inválido.")
            continue
        phrase = str(item.get("phrase", "")).strip()
        if not phrase:
            errors.append(f"Frase clave {index}: falta phrase.")
        elif phrase not in originals:
            errors.append(f"Frase clave {index}: la frase no coincide con la escena original: {phrase}")
        if not str(item.get("speaker", "")).strip():
            errors.append(f"Frase clave {index}: falta speaker.")
        if not str(item.get("natural_translation_es", "")).strip():
            errors.append(f"Frase clave {index}: falta natural_translation_es.")
        breakdown = item.get("breakdown")
        if not isinstance(breakdown, list) or not breakdown:
            errors.append(f"Frase clave {index}: falta breakdown.")
        else:
            for part in breakdown:
                if not isinstance(part, dict):
                    errors.append(f"Frase clave {index}: breakdown inválido.")
                    continue
                if not str(part.get("korean", "")).strip():
                    errors.append(f"Frase clave {index}: breakdown sin korean.")
                meaning = str(part.get("meaning_es", "")).strip()
                function = str(part.get("function_es", "")).strip()
                if _needs_manual_review(meaning):
                    errors.append(f"Frase clave {index}: meaning_es requiere revisión.")
                if _needs_manual_review(function):
                    errors.append(f"Frase clave {index}: function_es requiere revisión.")
        grammar = item.get("grammar_notes", [])
        if grammar:
            for note in grammar:
                if isinstance(note, dict):
                    explanation = str(note.get("explanation_es", "")).strip()
                    if _needs_manual_review(explanation):
                        errors.append(f"Frase clave {index}: grammar_note requiere revisión.")
        steps = item.get("listening_steps")
        if not isinstance(steps, list) or not steps:
            errors.append(f"Frase clave {index}: faltan listening_steps.")
        if "지만" in phrase:
            for part in item.get("breakdown", []) if isinstance(item.get("breakdown"), list) else []:
                if isinstance(part, dict) and part.get("korean") == "만" and "solo" in str(part.get("meaning_es", "")).casefold():
                    errors.append("Explica -지만 como 만 = solo, lo cual es incorrecto.")
    return errors


def _needs_manual_review(value: str) -> bool:
    cleaned = (value or "").strip().casefold()
    if not cleaned:
        return True
    return (
        "requiere revisión" in cleaned
        or "requiere motor creativo" in cleaned
        or cleaned in {"pendiente", "revisión pendiente"}
    )


def load_podcast_csv(path: str | Path) -> list[PodcastRow]:
    rows: list[PodcastRow] = []
    seen: set[str] = set()
    with Path(path).open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        headers = tuple(reader.fieldnames or ())
        required = PODCAST_COLUMNS[:8]
        missing = [column for column in required if column not in headers]
        if missing:
            raise ValueError("Faltan columnas en Podcast_Master.csv: " + ", ".join(missing))
        for line_number, raw in enumerate(reader, start=2):
            audio_id = (raw.get("id") or "").strip()
            text = (raw.get("text") or "").strip()
            section = (raw.get("section") or "scene").strip() or "scene"
            try:
                lesson = int((raw.get("lesson") or "0").strip() or "0")
                pause_after_ms = max(0, int((raw.get("pause_after_ms") or "0").strip() or "0"))
                repeat_count = max(1, int((raw.get("repeat_count") or "1").strip() or "1"))
            except ValueError as exc:
                raise ValueError(f"La fila {line_number} tiene números inválidos.") from exc
            if not audio_id:
                raise ValueError(f"La fila {line_number} no tiene id.")
            if audio_id.casefold() in seen:
                raise ValueError(f"El id de podcast '{audio_id}' está repetido.")
            if ID_SAFE.search(audio_id):
                raise ValueError(f"El id de podcast '{audio_id}' no es seguro.")
            if (raw.get("type") or "").strip().casefold() != "podcast":
                raise ValueError(f"La fila {line_number} debe tener type=podcast.")
            if not text:
                raise ValueError(f"La fila {line_number} ({audio_id}) no tiene texto.")
            if section not in PODCAST_SECTIONS:
                raise ValueError(f"La sección '{section}' no es válida en {audio_id}.")
            seen.add(audio_id.casefold())
            rows.append(
                PodcastRow(
                    audio_id=audio_id,
                    audio_type="podcast",
                    speaker=(raw.get("speaker_or_blank") or "").strip(),
                    text=text,
                    translation=(raw.get("translation_or_blank") or "").strip(),
                    text_tts=(raw.get("text_tts") or "").strip(),
                    lesson=lesson,
                    section=section,
                    pause_after_ms=pause_after_ms,
                    repeat_count=repeat_count,
                    repeat_style=(raw.get("repeat_style") or "normal").strip() or "normal",
                    is_key_phrase=_truthy(raw.get("is_key_phrase") or ""),
                    playback_speed_hint=(raw.get("playback_speed_hint") or "normal").strip()
                    or "normal",
                )
            )
    return rows


def generate_podcast_package(
    book: Book,
    config: ProjectConfig,
    options: PodcastOptions,
    profiles: dict[str, dict[str, str]] | None = None,
) -> PodcastPackage:
    rows = build_podcast_rows(book, config, options)
    quality_errors = validate_podcast_rows_quality(rows)
    if quality_errors:
        raise ValueError(
            "El guion de podcast no pasó validación de calidad: "
            + "; ".join(quality_errors)
        )
    paths = podcast_paths(book)
    paths["root"].mkdir(parents=True, exist_ok=True)
    paths["audio"].mkdir(parents=True, exist_ok=True)
    paths["by_lesson"].mkdir(parents=True, exist_ok=True)
    paths["full"].mkdir(parents=True, exist_ok=True)
    paths["playlists"].mkdir(parents=True, exist_ok=True)
    paths["drafts"].mkdir(parents=True, exist_ok=True)
    paths["silences"].mkdir(parents=True, exist_ok=True)
    write_podcast_csv(paths["csv"], rows)
    required = required_podcast_voices(rows)
    missing = missing_podcast_voices(rows, profiles or {}, config)
    paths["script"].write_text(build_podcast_script(book, rows, options), encoding="utf-8")
    paths["technical"].write_text(
        build_podcast_technical(book, rows, options),
        encoding="utf-8",
    )
    ensure_silence_files(paths["silences"], rows)
    paths["report"].write_text(
        build_podcast_report(book, rows, options, required, missing, generated=[], errors=[]),
        encoding="utf-8",
    )
    return PodcastPackage(
        rows=rows,
        output_dir=paths["root"],
        csv_path=paths["csv"],
        technical_path=paths["technical"],
        script_path=paths["script"],
        report_path=paths["report"],
        required_voices=required,
        missing_voices=missing,
    )


def validate_podcast_rows_quality(rows: list[PodcastRow]) -> list[str]:
    errors: list[str] = []
    blob = "\n".join(f"{row.text}\n{row.text_tts}\n{row.translation}" for row in rows).casefold()
    for phrase in FORBIDDEN_EXPLANATION_PHRASES:
        if phrase.casefold() in blob:
            errors.append(f"Contiene frase prohibida: {phrase}")
    if "지만" in blob and "만 significa “solo" in blob:
        errors.append("El guion parece explicar -지만 como 만 = solo.")
    if "requiere motor creativo" in blob or "requiere revisión manual" in blob:
        errors.append("El guion contiene explicaciones pendientes; revisa el borrador antes de generar audio.")
    return errors


def build_rows_from_approved_draft(
    book: Book,
    config: ProjectConfig,
    options: PodcastOptions,
    lesson_number: int,
    add,
) -> bool:
    draft = load_podcast_draft(book, lesson_number)
    if not draft:
        return False
    validation_errors = draft.get("hanstory_validation_errors") or []
    if validation_errors:
        raise ValueError(
            f"Lección {lesson_number:02d}: el borrador didáctico requiere revisión: "
            + "; ".join(str(error) for error in validation_errors)
        )
    allowed_statuses = {"Revisado por usuario", "Listo para podcast", "Guion generado"}
    if draft.get("hanstory_status") not in allowed_statuses and not config.allow_unreviewed_drafts:
        raise ValueError(
            f"Lección {lesson_number:02d}: el borrador de OpenAI existe pero no está revisado. "
            "Márcalo como revisado/listo o activa explícitamente 'Permitir usar borradores no revisados'."
        )
    title = str(draft.get("lesson_title") or f"Lección {lesson_number:02d}")
    add(
        lesson_number,
        "intro",
        "Profesor",
        f"Vamos a estudiar {title}. Primero escucha la escena completa.",
        "",
        f"[teacherly] Vamos a estudiar {title}. Primero escucha la escena completa.",
        pause_after_ms=500,
    )
    for source_row in lesson_scene_rows(book, lesson_number):
        add(
            lesson_number,
            "scene",
            source_row.speaker or "Narrador",
            source_row.text,
            source_row.translation,
            source_row.text_tts or f"[natural] {source_row.text}",
            pause_after_ms=options.phrase_pause_ms if options.active_listening_enabled else 0,
        )
    summary = str(draft.get("scene_summary_es") or "").strip()
    if summary:
        add(
            lesson_number,
            "explanation",
            "Profesor",
            summary,
            "",
            f"[teacherly] {summary}",
            pause_after_ms=800,
        )
    for phrase in draft.get("key_phrases", []):
        if not isinstance(phrase, dict):
            continue
        _add_key_phrase_from_draft(add, lesson_number, phrase)
    review = draft.get("review_section") if isinstance(draft.get("review_section"), dict) else {}
    teacher_text = str(review.get("teacher_text_es") or "Repaso final: escucha las frases clave y repítelas una vez más.").strip()
    add(lesson_number, "review", "Profesor", teacher_text, "", f"[teacherly] {teacher_text}", pause_after_ms=800)
    add(
        lesson_number,
        "outro",
        "Profesor",
        "Buen trabajo. Esta lección ya está lista para escuchar de nuevo.",
        "",
        "[teacherly] Buen trabajo. Esta lección ya está lista para escuchar de nuevo.",
    )
    draft["hanstory_status"] = "Guion generado"
    save_podcast_draft(book, lesson_number, draft)
    return True


def _add_key_phrase_from_draft(add, lesson_number: int, phrase: dict) -> None:
    speaker = str(phrase.get("speaker") or "Narrador").strip() or "Narrador"
    original = str(phrase.get("phrase") or "").strip()
    translation = str(phrase.get("natural_translation_es") or "").strip()
    intro_parts = [
        f"La frase importante es {original}.",
        f"Significa “{translation}”." if translation else "",
        str(phrase.get("literal_note_es") or "").strip(),
        str(phrase.get("tone_es") or "").strip(),
    ]
    intro = " ".join(part for part in intro_parts if part).strip()
    if intro:
        add(
            lesson_number,
            "explanation",
            "Profesor",
            intro,
            translation,
            f"[teacherly] {intro}",
            pause_after_ms=800,
            is_key_phrase=True,
        )
    breakdown = phrase.get("breakdown") if isinstance(phrase.get("breakdown"), list) else []
    steps = phrase.get("listening_steps") if isinstance(phrase.get("listening_steps"), list) else []
    if breakdown:
        add(
            lesson_number,
            "breakdown",
            "Profesor",
            "Primero vamos palabra por palabra.",
            "",
            "[teacherly] Primero vamos palabra por palabra.",
            pause_after_ms=500,
        )
        if not steps:
            for part in breakdown:
                if not isinstance(part, dict):
                    continue
                korean = str(part.get("korean") or "").strip()
                meaning = str(part.get("meaning_es") or "").strip()
                function = str(part.get("function_es") or "").strip()
                if not korean:
                    continue
                add(
                    lesson_number,
                    "word_repeat",
                    speaker,
                    korean,
                    meaning,
                    f"[slowly] {korean}",
                    pause_after_ms=1500,
                    repeat_style="slow",
                    is_key_phrase=True,
                    playback_speed_hint="slow",
                )
                explanation = f"{korean} significa “{meaning}”."
                if function:
                    explanation += f" Su función aquí: {function}."
                add(
                    lesson_number,
                    "explanation",
                    "Profesor",
                    explanation,
                    "",
                    f"[teacherly] {explanation}",
                    pause_after_ms=700,
                )
    grammar = phrase.get("grammar_notes") if isinstance(phrase.get("grammar_notes"), list) else []
    for note in grammar:
        if not isinstance(note, dict):
            continue
        pattern = str(note.get("pattern") or "").strip()
        explanation = str(note.get("explanation_es") or "").strip()
        if explanation:
            text = f"{pattern}: {explanation}" if pattern else explanation
            add(lesson_number, "grammar", "Profesor", text, "", f"[teacherly] {text}", pause_after_ms=800)
    if steps:
        for step in steps:
            if isinstance(step, dict):
                _add_listening_step(add, lesson_number, step, speaker, translation)
    elif original:
        add(lesson_number, "phrase_repeat", speaker, original, translation, f"[slowly] {original}", pause_after_ms=3000, repeat_style="slow", is_key_phrase=True, playback_speed_hint="slow")
        add(lesson_number, "phrase_repeat", speaker, original, translation, f"[natural] {original}", pause_after_ms=1500, repeat_style="natural", is_key_phrase=True)


def _add_listening_step(add, lesson_number: int, step: dict, fallback_speaker: str, translation: str) -> None:
    step_type = str(step.get("type") or "").strip()
    text = str(step.get("text") or "").strip()
    if not text:
        return
    speaker = str(step.get("speaker") or fallback_speaker).strip() or fallback_speaker
    style = str(step.get("style") or "").strip()
    pause = max(0, int(step.get("pause_after_ms") or 0))
    section = {
        "teacher_explanation": "explanation",
        "word_explanation": "explanation",
        "word_repeat": "word_repeat",
        "phrase_repeat": "phrase_repeat",
        "grammar": "grammar",
    }.get(step_type, "explanation")
    row_speaker = "Profesor" if step_type in {"teacher_explanation", "word_explanation", "grammar"} else speaker
    tts_style = "slowly" if style == "slow" else (style or "natural")
    tts_marker = "[teacherly]" if row_speaker == "Profesor" else f"[{tts_style}]"
    add(
        lesson_number,
        section,
        row_speaker,
        text,
        translation if section == "phrase_repeat" else "",
        f"{tts_marker} {text}",
        pause_after_ms=pause,
        repeat_style=style or "normal",
        is_key_phrase=section in {"word_repeat", "phrase_repeat"},
        playback_speed_hint="slow" if style == "slow" else "normal",
    )


def build_podcast_rows(book: Book, config: ProjectConfig, options: PodcastOptions) -> list[PodcastRow]:
    source_rows, lessons = _load_book_material(book)
    selected_lessons = _selected_lessons(lessons, options)
    prefix = _safe_prefix(options.id_prefix or default_podcast_prefix(book, config))
    options = _options_with_preset(options)
    rows: list[PodcastRow] = []
    sequence = 1

    def add(
        lesson: int,
        section: str,
        speaker: str,
        text: str,
        translation: str = "",
        text_tts: str = "",
        pause_after_ms: int = 0,
        repeat_count: int = 1,
        repeat_style: str = "normal",
        is_key_phrase: bool = False,
        playback_speed_hint: str = "normal",
    ) -> None:
        nonlocal sequence
        cleaned = _clean_text(text)
        if not cleaned:
            return
        rows.append(
            PodcastRow(
                audio_id=f"{prefix}{sequence:04d}",
                audio_type="podcast",
                speaker=speaker,
                text=cleaned,
                translation=translation.strip(),
                text_tts=text_tts.strip(),
                lesson=lesson,
                section=section,
                pause_after_ms=max(0, int(pause_after_ms)),
                repeat_count=max(1, int(repeat_count)),
                repeat_style=repeat_style,
                is_key_phrase=is_key_phrase,
                playback_speed_hint=playback_speed_hint,
            )
        )
        sequence += 1

    def add_active_sequence(lesson: int, row: AudioRow, *, section: str = "shadowing") -> None:
        if not options.active_listening_enabled:
            return
        if options.include_brief_translation:
            teacher_text = f"La frase importante es {row.text}."
            if row.translation:
                teacher_text += f" Significa “{row.translation}”."
            add(
                lesson,
                "explanation" if section != "shadowing" else section,
                "Profesor",
                teacher_text,
                row.translation,
                f"[teacherly] {teacher_text}",
                pause_after_ms=options.phrase_pause_ms,
                repeat_style="normal",
                is_key_phrase=True,
            )
        if options.include_repeat_instruction:
            add(
                lesson,
                section,
                "Profesor",
                "Repite después de mí.",
                "",
                "[teacherly] Repite después de mí.",
                pause_after_ms=500,
                repeat_style="normal",
            )
        repetitions = max(1, options.key_phrase_repetitions)
        if options.include_slow_version:
            for _ in range(repetitions):
                add(
                    lesson,
                    section,
                    row.speaker or "Narrador",
                    row.text,
                    row.translation,
                    f"[slowly] {row.text}",
                    pause_after_ms=options.repeat_pause_ms,
                    repeat_style="slow",
                    is_key_phrase=True,
                    playback_speed_hint="slow",
                )
        if options.include_natural_version:
            if options.active_preset == "Frases clave intensivo":
                natural_repetitions = repetitions + 1
            elif options.active_preset == "Dictado suave":
                natural_repetitions = max(2, repetitions)
            else:
                natural_repetitions = 1
            for index in range(natural_repetitions):
                pause = options.repeat_pause_ms if index < natural_repetitions - 1 else options.phrase_pause_ms
                add(
                    lesson,
                    section,
                    row.speaker or "Narrador",
                    row.text,
                    row.translation,
                    f"[natural] {row.text}",
                    pause_after_ms=pause,
                    repeat_style="natural",
                    is_key_phrase=True,
                    playback_speed_hint="normal",
                )

    def add_didactic_explanation(lesson: int, row: AudioRow) -> None:
        tokens = phrase_tokens(row.text, config.target_language)
        explanation = didactic_phrase_explanation(row, tokens, config)
        add(
            lesson,
            "explanation",
            "Profesor",
            explanation,
            row.translation,
            f"[teacherly] {explanation}",
            pause_after_ms=options.phrase_pause_ms if options.active_listening_enabled else 500,
            is_key_phrase=True,
        )
        should_break_down = options.word_breakdown_enabled and len(tokens) >= 3
        if should_break_down:
            intro = "Primero vamos palabra por palabra."
            add(
                lesson,
                "breakdown",
                "Profesor",
                intro,
                "",
                f"[teacherly] {intro}",
                pause_after_ms=500,
            )
            for token in tokens:
                add(
                    lesson,
                    "word_repeat",
                    row.speaker or "Narrador",
                    token,
                    token_meaning(token, config.target_language),
                    f"[slowly] {token}",
                    pause_after_ms=1500 if token not in KOREAN_PARTICLE_EXPLANATIONS else 1000,
                    repeat_style="slow",
                    is_key_phrase=True,
                    playback_speed_hint="slow",
                )
                token_text = token_explanation_sentence(token, config.target_language)
                add(
                    lesson,
                    "explanation",
                    "Profesor",
                    token_text,
                    "",
                    f"[teacherly] {token_text}",
                    pause_after_ms=700,
                )
            grammar = grammar_explanation(row.text, tokens, config.target_language)
            if grammar:
                add(
                    lesson,
                    "grammar",
                    "Profesor",
                    grammar,
                    "",
                    f"[teacherly] {grammar}",
                    pause_after_ms=800,
                )
        elif len(tokens) == 2:
            intro = "Esta frase tiene dos bloques importantes."
            add(lesson, "breakdown", "Profesor", intro, "", f"[teacherly] {intro}", pause_after_ms=500)
            for token in tokens:
                token_text = token_explanation_sentence(token, config.target_language)
                add(
                    lesson,
                    "explanation",
                    "Profesor",
                    token_text,
                    "",
                    f"[teacherly] {token_text}",
                    pause_after_ms=700,
                )
        repeat_intro = "Ahora escucha la frase completa lentamente."
        add(
            lesson,
            "phrase_repeat",
            "Profesor",
            repeat_intro,
            "",
            f"[teacherly] {repeat_intro}",
            pause_after_ms=500,
        )
        add(
            lesson,
            "phrase_repeat",
            row.speaker or "Narrador",
            row.text,
            row.translation,
            f"[slowly] {row.text}",
            pause_after_ms=options.repeat_pause_ms if options.active_listening_enabled else 2500,
            repeat_style="slow",
            is_key_phrase=True,
            playback_speed_hint="slow",
        )
        add(
            lesson,
            "phrase_repeat",
            row.speaker or "Narrador",
            row.text,
            row.translation,
            f"[natural] {row.text}",
            pause_after_ms=options.phrase_pause_ms if options.active_listening_enabled else 1000,
            repeat_style="natural",
            is_key_phrase=True,
            playback_speed_hint="normal",
        )

    for lesson_number in selected_lessons:
        lesson_rows = [source_rows[audio_id.casefold()] for audio_id in lessons[lesson_number] if audio_id.casefold() in source_rows]
        title = f"Lección {lesson_number:02d}"
        if options.mode == "Audiolibro":
            add(lesson_number, "intro", "Narrador", f"{title}. Escucha la escena completa.", text_tts=f"[calm narrator] {title}. Escucha la escena completa.", pause_after_ms=options.phrase_pause_ms if options.active_listening_enabled else 0)
            for row in lesson_rows:
                add(lesson_number, "scene", row.speaker or "Narrador", row.text, row.translation, _acting_tts(row, "calm narrator"), pause_after_ms=options.phrase_pause_ms if options.active_listening_enabled else 0)
            add(lesson_number, "outro", "Narrador", "Fin de la lección.", text_tts="[calm narrator] Fin de la lección.")
        elif options.mode == "Shadowing":
            add(lesson_number, "intro", "Profesor", f"{title}. Repite después de mí.", text_tts=f"[teacherly] {title}. Repite después de mí.")
            for row in _key_rows(lesson_rows, limit=10):
                if options.active_listening_enabled:
                    add_active_sequence(lesson_number, row, section="shadowing")
                else:
                    add(lesson_number, "shadowing", "Profesor", "Escucha y repite.", text_tts="[teacherly] Escucha y repite.")
                    for _ in range(max(1, options.shadowing_repetitions)):
                        add(lesson_number, "shadowing", row.speaker or "Narrador", row.text, row.translation, _acting_tts(row, "slowly"))
            add(lesson_number, "outro", "Profesor", "Buen trabajo. Repite esta lección mañana para fijarla.", text_tts="[teacherly] Buen trabajo. Repite esta lección mañana para fijarla.")
        elif options.mode == "Repaso rápido":
            add(lesson_number, "intro", "Profesor", f"Repaso rápido de {title}.", text_tts=f"[teacherly] Repaso rápido de {title}.")
            for row in _key_rows(lesson_rows, limit=8):
                if options.active_listening_enabled:
                    add_active_sequence(lesson_number, row, section="review")
                    continue
                explanation = f"{row.text}"
                if row.translation:
                    explanation += f". Frase clave: {row.translation}."
                add(lesson_number, "review", "Profesor", explanation, row.translation, text_tts=f"[teacherly] {explanation}")
            add(lesson_number, "outro", "Profesor", "Eso es todo por ahora. Escucha otra vez si quieres practicar sin mirar.", text_tts="[teacherly] Eso es todo por ahora. Escucha otra vez si quieres practicar sin mirar.")
        else:
            if build_rows_from_approved_draft(book, config, options, lesson_number, add):
                continue
            raise ValueError(
                f"Lección {lesson_number:02d}: Podcast explicado necesita una explicación aprobada "
                "del Motor creativo/OpenAI. Usa 'Generar explicación con OpenAI', revisa el borrador "
                "y luego 'Aplicar explicación al guion de podcast'."
            )
    if not rows:
        raise ValueError("No se pudo crear el podcast: no hay lecciones o frases seleccionadas.")
    return rows


def write_podcast_csv(path: str | Path, rows: list[PodcastRow]) -> None:
    with Path(path).open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(PODCAST_COLUMNS)
        for row in rows:
            writer.writerow(
                (
                    row.audio_id,
                    "podcast",
                    row.speaker,
                    row.text,
                    row.translation,
                    row.text_tts,
                    row.lesson,
                    row.section,
                    row.pause_after_ms,
                    row.repeat_count,
                    row.repeat_style,
                    "true" if row.is_key_phrase else "false",
                    row.playback_speed_hint,
                )
            )


def build_podcast_script(book: Book, rows: list[PodcastRow], options: PodcastOptions) -> str:
    lines = [
        f"Podcast / Lección en escucha — {book.title}",
        f"Modo: {options.mode}",
        "",
    ]
    current_lesson = None
    for row in rows:
        if row.lesson != current_lesson:
            current_lesson = row.lesson
            lines.extend(["", f"### Lección {row.lesson:02d}"])
        lines.append(f"[{row.section}] {row.audio_id} — {row.speaker or 'default'}: {row.text}")
        if row.text_tts and row.text_tts != row.text:
            lines.append(f"    TTS: {row.text_tts}")
        if row.pause_after_ms:
            lines.append(f"    [Pausa {row.pause_after_ms / 1000:.1f}s]")
    return "\n".join(lines).strip() + "\n"


def build_podcast_technical(book: Book, rows: list[PodcastRow], options: PodcastOptions) -> str:
    lines = [
        f"# Podcast_Tecnico — {book.title}",
        f"Modo: {options.mode}",
        f"Pausa entre líneas: {options.pause_seconds} segundo(s)",
        f"Salida solicitada: {options.output_mode}",
        "",
        "Nota: el orden exacto se expresa con cada ID y cada PAUSE en milisegundos.",
        "Si usas audios separados, la carpeta Silences contiene WAV silenciosos por duración.",
        "",
    ]
    by_lesson: dict[int, list[PodcastRow]] = {}
    for row in rows:
        by_lesson.setdefault(row.lesson, []).append(row)
    for lesson, lesson_rows in sorted(by_lesson.items()):
        lines.append(f"### Lección {lesson:02d}")
        for row in lesson_rows:
            lines.append(row.audio_id)
            if row.pause_after_ms:
                lines.append(f"PAUSE {row.pause_after_ms}")
        lines.append("")
    return "\n".join(lines).strip() + "\n"


def build_podcast_report(
    book: Book,
    rows: list[PodcastRow],
    options: PodcastOptions,
    required_voices: list[str],
    missing_voices: list[str],
    generated: list[str],
    errors: list[str],
    joined_files: list[str] | None = None,
    full_audio: str = "",
    playlist: str = "",
    blocks_sent: int = 0,
    block_characters: list[int] | None = None,
    generation_mode_used: str = "línea por línea",
    fallback_warnings: list[str] | None = None,
) -> str:
    lessons = sorted({row.lesson for row in rows})
    characters = sum(len(row.text_for_tts(True)) for row in rows)
    pauses = [row.pause_after_ms for row in rows if row.pause_after_ms]
    pause_total_ms = sum(pauses)
    repeated_key_rows = [row for row in rows if row.is_key_phrase]
    estimated_audio_ms = sum(max(1200, int(len(row.text) * 95)) for row in rows)
    estimated_total_ms = estimated_audio_ms + pause_total_ms
    joined_files = joined_files or []
    block_characters = block_characters or []
    fallback_warnings = fallback_warnings or []
    lines = [
        f"Podcast_Report — {book.title}",
        f"Modo usado: {options.mode}",
        f"Modo de generación ElevenLabs: {generation_mode_used}",
        f"Salida de audio: {options.audio_output_mode}",
        f"Multi-speaker ElevenLabs v3 solicitado: {'Sí' if options.use_multispeaker_v3 else 'No'}",
        f"Bloques enviados a ElevenLabs: {blocks_sent}",
        f"Caracteres por bloque: {', '.join(str(value) for value in block_characters) or 'Ninguno'}",
        f"Escucha activa: {'Activada' if options.active_listening_enabled else 'Desactivada'}",
        f"Preset escucha activa: {options.active_preset}",
        f"Lecciones incluidas: {', '.join(f'{lesson:02d}' for lesson in lessons) or 'Ninguna'}",
        f"Cantidad de líneas: {len(rows)}",
        f"Cantidad de caracteres estimados para ElevenLabs: {characters}",
        f"Pausas usadas: {', '.join(str(ms) + 'ms' for ms in sorted(set(pauses))) or 'Ninguna'}",
        f"Repeticiones generadas: {len(repeated_key_rows)}",
        f"Cantidad de silencios insertados: {len(pauses)}",
        f"Duración estimada total: {_format_duration_ms(estimated_total_ms)}",
        f"Frases clave repetidas: {len({row.text for row in repeated_key_rows})}",
        f"Voces requeridas: {', '.join(required_voices) or 'Ninguna'}",
        f"Voces faltantes: {', '.join(missing_voices) or 'Ninguna'}",
        f"Audios separados generados: {len(generated)}",
        f"Audios existentes: {len(rows) - len(generated) - len(errors)}",
        f"Audios unidos generados: {len(joined_files)}",
        f"Archivo completo generado: {full_audio or 'No'}",
        f"Playlist generada: {playlist or 'No'}",
        f"Errores: {len(errors)}",
        "",
        "Advertencias:",
    ]
    if missing_voices:
        lines.append("Faltan voces para generar todos los audios.")
    if options.output_mode != "conservar audios separados":
        lines.append("La salida final por lección/sección queda descrita en Podcast_Tecnico.txt.")
    if fallback_warnings:
        lines.extend(fallback_warnings)
    if options.include_anki_suggestions:
        lines.append("Anki de podcast solicitado: crea tarjetas separadas tipo audio lesson.")
    if not missing_voices and options.output_mode == "conservar audios separados" and not options.include_anki_suggestions:
        lines.append("Ninguna.")
    lines.extend(["", "Errores:", *(errors or ["Ninguno"])])
    return "\n".join(lines).strip() + "\n"


def required_podcast_voices(rows: list[PodcastRow]) -> list[str]:
    return sorted({row.speaker.strip() for row in rows if row.speaker.strip()}, key=str.casefold)


def missing_podcast_voices(
    rows: list[PodcastRow],
    profiles: dict[str, dict[str, str]],
    config: ProjectConfig,
) -> list[str]:
    missing = []
    for speaker in required_podcast_voices(rows):
        if not character_voice_id(speaker, profiles, config, audio_type="phrase"):
            missing.append(speaker)
    return missing


def generate_podcast_audio(
    book: Book,
    profiles: dict[str, dict[str, str]],
    settings: AppSettings,
    *,
    dry_run: bool = True,
    regenerate_existing: bool = False,
    progress: ProgressCallback | None = None,
    project_config: ProjectConfig | None = None,
) -> PodcastAudioResult:
    config = project_config or load_project_config(book)
    model_id = config.elevenlabs_model_id.strip()
    if not model_id:
        raise ValueError("El model_id de ElevenLabs está vacío. Selecciona un modelo antes de generar.")
    paths = podcast_paths(book)
    if not paths["csv"].exists():
        raise ValueError("Falta Podcast_Master.csv. Primero genera o guarda el guion de podcast.")
    rows = load_podcast_csv(paths["csv"])
    result = PodcastAudioResult(dry_run=dry_run)
    result.missing_voices = missing_podcast_voices(rows, profiles, config)
    if result.missing_voices:
        result.errors.append("Faltan voces: " + ", ".join(result.missing_voices))
        _rewrite_report_after_audio(book, rows, result, config)
        return result
    if not dry_run and not get_api_key():
        result.errors.append("Falta la API key de ElevenLabs. Configúrala en Voces y ajustes.")
        _rewrite_report_after_audio(book, rows, result, config)
        return result

    paths["audio"].mkdir(parents=True, exist_ok=True)
    paths["by_lesson"].mkdir(parents=True, exist_ok=True)
    paths["full"].mkdir(parents=True, exist_ok=True)
    paths["playlists"].mkdir(parents=True, exist_ok=True)
    paths["silences"].mkdir(parents=True, exist_ok=True)
    result.silence_files = ensure_silence_files(paths["silences"], rows)
    client = None if dry_run else ElevenLabsClient(get_api_key(), settings)

    if project_config and project_config.podcast_use_multispeaker_v3 and not dry_run:
        result.generation_mode_used = "multi-speaker ElevenLabs v3"
        try:
            assert client is not None
            _generate_multispeaker_blocks(book, rows, profiles, config, client, result)
        except Exception as exc:
            result.fallback_warnings.append(
                "Fallback multi-speaker: " + str(exc)
            )
            result.generation_mode_used = "línea por línea"

    for index, row in enumerate(rows, start=1):
        if progress:
            progress(index, len(rows), row.audio_id)
        destination = paths["audio"] / f"{row.audio_id}.mp3"
        if destination.exists() and not regenerate_existing:
            result.existing.append(row.audio_id)
            continue
        tts_text = row.text_for_tts(config.acting_mode_enabled)
        result.character_count += len(tts_text)
        if dry_run:
            result.generated.append(row.audio_id)
            continue
        try:
            voice_id = character_voice_id(row.speaker, profiles, config, audio_type="phrase")
            assert client is not None
            client.generate_mp3(tts_text, voice_id, destination, model_id=model_id)
            result.generated.append(row.audio_id)
        except Exception as exc:
            result.errors.append(f"{row.audio_id}: {exc}")
        if settings.pause_seconds > 0 and index < len(rows):
            time.sleep(settings.pause_seconds)
    if not dry_run and not result.errors:
        joined = assemble_podcast_audio(book, rows, config)
        result.joined_files = [str(path.relative_to(paths["root"])) for path in joined["lesson_files"]]
        result.full_audio = (
            str(joined["full_file"].relative_to(paths["root"]))
            if joined.get("full_file")
            else ""
        )
        result.playlist = (
            str(joined["playlist"].relative_to(paths["root"]))
            if joined.get("playlist")
            else ""
        )
        result.fallback_warnings.extend(joined["warnings"])
    _rewrite_report_after_audio(book, rows, result, config)
    return result


def assemble_podcast_audio(
    book: Book,
    rows: list[PodcastRow],
    config: ProjectConfig,
) -> dict[str, object]:
    paths = podcast_paths(book)
    mode = config.podcast_audio_output_mode
    should_by_lesson = mode in {
        "Un audio por lección",
        "Un audio por capítulo",
        "Generar separados + generar unidos",
    }
    should_full = mode in {
        "Un audio completo del proyecto/libro",
        "Generar separados + generar unidos",
    }
    if mode == "Audios separados por línea":
        should_by_lesson = should_full = False
    lesson_files: list[Path] = []
    warnings: list[str] = []
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        warnings.append(
            "Advertencia: ffmpeg no está instalado; se usó unión básica de MP3. "
            "Las pausas quedan documentadas en Podcast_Tecnico.txt y Silences."
        )
    by_lesson = _rows_by_lesson(rows)
    if should_by_lesson:
        paths["by_lesson"].mkdir(parents=True, exist_ok=True)
        for order, (lesson, lesson_rows) in enumerate(sorted(by_lesson.items()), start=1):
            destination = paths["by_lesson"] / f"{order:03d}_Leccion_{lesson:02d}.mp3"
            _join_rows_to_mp3(lesson_rows, destination, paths, ffmpeg, warnings)
            lesson_files.append(destination)
    full_file: Path | None = None
    if should_full:
        paths["full"].mkdir(parents=True, exist_ok=True)
        full_file = paths["full"] / "999_Libro_Completo.mp3"
        if lesson_files:
            _join_files_to_mp3(lesson_files, full_file, ffmpeg, warnings)
        else:
            _join_rows_to_mp3(rows, full_file, paths, ffmpeg, warnings)
    playlist = _write_playlist(paths, lesson_files, full_file)
    return {
        "lesson_files": lesson_files,
        "full_file": full_file,
        "playlist": playlist,
        "warnings": warnings,
    }


def _rewrite_report_after_audio(
    book: Book,
    rows: list[PodcastRow],
    result: PodcastAudioResult,
    config: ProjectConfig,
) -> None:
    options = PodcastOptions(
        mode="Desde Podcast_Master.csv",
        id_prefix=config.podcast_id_prefix,
        pause_seconds=config.podcast_pause_seconds,
        output_mode=config.podcast_output_mode,
        audio_output_mode=config.podcast_audio_output_mode,
        generate_lines_and_joined=config.podcast_generate_lines_and_joined,
        use_multispeaker_v3=config.podcast_use_multispeaker_v3,
        multispeaker_max_chars=config.podcast_multispeaker_max_chars,
        word_breakdown_enabled=config.podcast_word_breakdown_enabled,
        active_listening_enabled=config.podcast_active_listening_enabled,
        active_preset=config.podcast_active_preset,
        phrase_pause_ms=config.podcast_phrase_pause_ms,
        repeat_pause_ms=config.podcast_repeat_pause_ms,
        key_phrase_repetitions=config.podcast_key_phrase_repetitions,
        include_slow_version=config.podcast_include_slow_version,
        include_natural_version=config.podcast_include_natural_version,
        include_brief_translation=config.podcast_include_brief_translation,
        include_repeat_instruction=config.podcast_include_repeat_instruction,
    )
    paths = podcast_paths(book)
    paths["report"].write_text(
        build_podcast_report(
            book,
            rows,
            options,
            required_podcast_voices(rows),
            result.missing_voices,
            result.generated,
            result.errors,
            joined_files=result.joined_files,
            full_audio=result.full_audio,
            playlist=result.playlist,
            blocks_sent=result.blocks_sent,
            block_characters=result.block_characters,
            generation_mode_used=result.generation_mode_used,
            fallback_warnings=result.fallback_warnings,
        ),
        encoding="utf-8",
    )


def _load_book_material(book: Book) -> tuple[dict[str, AudioRow], dict[int, list[str]]]:
    if book.csv_path.exists() and book.technical_path.exists():
        rows = load_audio_csv(book.csv_path)
        row_by_id = {row.audio_id.casefold(): row for row in rows}
        return row_by_id, parse_technical_file(book.technical_path)
    html_path = book.folder / "book.html"
    if html_path.exists():
        text = _html_to_text(html_path.read_text(encoding="utf-8", errors="ignore"))
        fallback_rows = [
            AudioRow(f"HTML{i:04d}", "phrase", "Narrador", sentence, "")
            for i, sentence in enumerate(_sentences(text), start=1)
        ]
        if not fallback_rows:
            raise ValueError("book.html existe, pero no encontré texto útil.")
        return {row.audio_id.casefold(): row for row in fallback_rows}, {1: [row.audio_id for row in fallback_rows]}
    raise ValueError("Necesito Audio_Master.csv y Audios_Tecnico.txt, o un book.html con texto.")


def _selected_lessons(lessons: dict[int, list[str]], options: PodcastOptions) -> list[int]:
    selected = []
    for lesson in sorted(lessons):
        if options.lesson_start is not None and lesson < options.lesson_start:
            continue
        if options.lesson_end is not None and lesson > options.lesson_end:
            continue
        selected.append(lesson)
    return selected


def ensure_silence_files(directory: Path, rows: list[PodcastRow]) -> list[str]:
    directory.mkdir(parents=True, exist_ok=True)
    created: list[str] = []
    for duration_ms in sorted({row.pause_after_ms for row in rows if row.pause_after_ms > 0}):
        path = directory / f"silence_{duration_ms}ms.wav"
        if not path.exists():
            _write_silence_wav(path, duration_ms)
        created.append(path.name)
    return created


def _rows_by_lesson(rows: list[PodcastRow]) -> dict[int, list[PodcastRow]]:
    grouped: dict[int, list[PodcastRow]] = {}
    for row in rows:
        grouped.setdefault(row.lesson, []).append(row)
    return grouped


def _line_audio_path(row: PodcastRow, paths: dict[str, Path]) -> Path:
    current = paths["audio"] / f"{row.audio_id}.mp3"
    if current.exists():
        return current
    legacy = paths["legacy_audio"] / f"{row.audio_id}.mp3"
    if legacy.exists():
        return legacy
    return current


def _join_rows_to_mp3(
    rows: list[PodcastRow],
    destination: Path,
    paths: dict[str, Path],
    ffmpeg: str | None,
    warnings: list[str],
) -> None:
    parts: list[tuple[Path, int]] = []
    for row in rows:
        source = _line_audio_path(row, paths)
        if not source.exists():
            warnings.append(f"No se pudo unir {destination.name}: falta {source.name}.")
            return
        parts.append((source, row.pause_after_ms))
    _join_parts_to_mp3(parts, destination, ffmpeg, warnings)


def _join_files_to_mp3(
    files: list[Path],
    destination: Path,
    ffmpeg: str | None,
    warnings: list[str],
) -> None:
    _join_parts_to_mp3([(path, 1500) for path in files], destination, ffmpeg, warnings)


def _join_parts_to_mp3(
    parts: list[tuple[Path, int]],
    destination: Path,
    ffmpeg: str | None,
    warnings: list[str],
) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    if not parts:
        return
    if ffmpeg:
        try:
            _join_with_ffmpeg(parts, destination, ffmpeg)
            return
        except Exception as exc:
            warnings.append(
                f"ffmpeg falló al unir {destination.name}; se usó unión básica. Detalle: {exc}"
            )
    with destination.open("wb") as output:
        for source, _pause in parts:
            output.write(source.read_bytes())


def _join_with_ffmpeg(parts: list[tuple[Path, int]], destination: Path, ffmpeg: str) -> None:
    with tempfile.TemporaryDirectory() as tmp:
        tmpdir = Path(tmp)
        concat_file = tmpdir / "concat.txt"
        lines: list[str] = []
        for index, (source, pause_ms) in enumerate(parts, start=1):
            lines.append(f"file '{_ffmpeg_path(source)}'")
            if pause_ms > 0:
                silence = tmpdir / f"silence_{index}_{pause_ms}.mp3"
                _make_silence_mp3(ffmpeg, silence, pause_ms)
                lines.append(f"file '{_ffmpeg_path(silence)}'")
        concat_file.write_text("\n".join(lines) + "\n", encoding="utf-8")
        temporary = destination.with_suffix(".mp3.part")
        command = [
            ffmpeg,
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat_file),
            "-c",
            "copy",
            str(temporary),
        ]
        subprocess.run(command, check=True)
        temporary.replace(destination)


def _make_silence_mp3(ffmpeg: str, destination: Path, duration_ms: int) -> None:
    duration = max(0.05, duration_ms / 1000)
    command = [
        ffmpeg,
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-f",
        "lavfi",
        "-i",
        "anullsrc=r=44100:cl=mono",
        "-t",
        f"{duration:.3f}",
        "-q:a",
        "9",
        "-acodec",
        "libmp3lame",
        str(destination),
    ]
    subprocess.run(command, check=True)


def _ffmpeg_path(path: Path) -> str:
    return str(path.resolve()).replace("'", "'\\''")


def _write_playlist(paths: dict[str, Path], lesson_files: list[Path], full_file: Path | None) -> Path:
    paths["playlists"].mkdir(parents=True, exist_ok=True)
    playlist = paths["playlists"] / "HanStory_Podcast.m3u"
    root = paths["root"]
    entries = [str(path.relative_to(root)) for path in lesson_files]
    if full_file is not None and full_file.exists():
        entries.append(str(full_file.relative_to(root)))
    playlist.write_text("#EXTM3U\n" + "\n".join(entries) + ("\n" if entries else ""), encoding="utf-8")
    return playlist


def _generate_multispeaker_blocks(
    book: Book,
    rows: list[PodcastRow],
    profiles: dict[str, dict[str, str]],
    config: ProjectConfig,
    client: ElevenLabsClient,
    result: PodcastAudioResult,
) -> None:
    paths = podcast_paths(book)
    blocks = _multispeaker_blocks(rows, config.podcast_multispeaker_max_chars)
    for block_index, block in enumerate(blocks, start=1):
        text = _multispeaker_dialogue_text(block)
        result.blocks_sent += 1
        result.block_characters.append(len(text))
        voice_ids = {
            speaker: character_voice_id(speaker, profiles, config, audio_type="phrase")
            for speaker in {row.speaker or "Narrador" for row in block}
        }
        destination = paths["audio"] / f"MS_BLOCK_{block_index:04d}.mp3"
        client.generate_multispeaker_mp3(
            text,
            voice_ids,
            destination,
            model_id=config.elevenlabs_model_id,
        )


def _multispeaker_blocks(rows: list[PodcastRow], max_chars: int) -> list[list[PodcastRow]]:
    max_chars = max(500, int(max_chars or 4500))
    blocks: list[list[PodcastRow]] = []
    current: list[PodcastRow] = []
    current_size = 0
    current_lesson = rows[0].lesson if rows else 0
    current_section = rows[0].section if rows else ""
    for row in rows:
        line_size = len(row.text_tts or row.text) + len(row.speaker) + 16
        boundary = row.lesson != current_lesson or row.section != current_section
        if current and (boundary or current_size + line_size > max_chars):
            blocks.append(current)
            current = []
            current_size = 0
        current.append(row)
        current_size += line_size
        current_lesson = row.lesson
        current_section = row.section
    if current:
        blocks.append(current)
    return blocks


def _multispeaker_dialogue_text(rows: list[PodcastRow]) -> str:
    lines: list[str] = []
    current_speaker = ""
    for row in rows:
        speaker = row.speaker or "Narrador"
        if speaker != current_speaker:
            lines.append("")
            lines.append(f"Speaker: {speaker}")
            current_speaker = speaker
        lines.append(row.text_tts.strip() or row.text)
    return "\n".join(lines).strip() + "\n"


def _write_silence_wav(path: Path, duration_ms: int) -> None:
    sample_rate = 44100
    frames = int(sample_rate * duration_ms / 1000)
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(sample_rate)
        handle.writeframes(b"\x00\x00" * frames)


def _options_with_preset(options: PodcastOptions) -> PodcastOptions:
    preset = options.active_preset
    if preset == "Escucha normal":
        options.phrase_pause_ms = 1000
        options.repeat_pause_ms = 1000
        options.key_phrase_repetitions = 1
        options.include_slow_version = False
        options.include_natural_version = True
        options.include_brief_translation = False
        options.include_repeat_instruction = False
    elif preset == "Repite conmigo":
        options.key_phrase_repetitions = max(options.key_phrase_repetitions, 2)
        options.include_slow_version = True
        options.include_natural_version = True
        options.include_repeat_instruction = True
    elif preset == "Dictado suave":
        options.repeat_pause_ms = 4000
        options.phrase_pause_ms = 2000
        options.key_phrase_repetitions = max(2, options.key_phrase_repetitions)
        options.include_slow_version = False
        options.include_natural_version = True
        options.include_brief_translation = True
        options.include_repeat_instruction = False
    elif preset == "Frases clave intensivo":
        options.key_phrase_repetitions = max(options.key_phrase_repetitions, 2)
        options.include_slow_version = True
        options.include_natural_version = True
        options.include_brief_translation = True
    return options


def _key_rows(rows: list[AudioRow], *, limit: int) -> list[AudioRow]:
    phrases = [row for row in rows if row.audio_type == "phrase"]
    return phrases[:limit] or rows[:limit]


def phrase_tokens(text: str, language: str) -> list[str]:
    raw_tokens = [token.strip(" .,!?¿¡\"'“”‘’()[]{}") for token in text.split()]
    raw_tokens = [token for token in raw_tokens if token]
    if "korean" not in language.casefold() and "coreano" not in language.casefold():
        return raw_tokens
    tokens: list[str] = []
    for token in raw_tokens:
        split = _split_korean_particle(token)
        tokens.extend(split)
    return tokens or raw_tokens


def _split_korean_particle(token: str) -> list[str]:
    if token in KOREAN_PARTICLE_EXPLANATIONS:
        return [token]
    if token.endswith("지만") and len(token) > 2:
        stem = token[:-2]
        if stem:
            return [f"{stem}다", "-지만"]
    for particle in KOREAN_PARTICLES:
        if token.endswith(particle) and len(token) > len(particle) + 1:
            stem = token[: -len(particle)]
            # Evita partir formas verbales comunes por accidente.
            if stem and not stem.endswith(("있", "없", "하", "되")):
                return [stem, particle]
    return [token]


def token_meaning(token: str, language: str) -> str:
    if token in KOREAN_PARTICLE_EXPLANATIONS:
        match = re.search(r"significa “([^”]+)”|significa '([^']+)'|significa ([^.]+)", KOREAN_PARTICLE_EXPLANATIONS[token])
        return match.group(1) if match and match.group(1) else "partícula"
    if token in KOREAN_ENDING_EXPLANATIONS:
        return "pero / aunque"
    if "korean" in language.casefold() or "coreano" in language.casefold():
        return KOREAN_WORD_HINTS.get(token, PENDING_EXPLANATION)
    return PENDING_EXPLANATION


def token_explanation_sentence(token: str, language: str) -> str:
    if "korean" in language.casefold() or "coreano" in language.casefold():
        if token in KOREAN_PARTICLE_EXPLANATIONS:
            return KOREAN_PARTICLE_EXPLANATIONS[token]
        if token in KOREAN_ENDING_EXPLANATIONS:
            return KOREAN_ENDING_EXPLANATIONS[token]
        meaning = KOREAN_WORD_HINTS.get(token)
        if meaning:
            return f"{token} significa “{meaning}”."
    return f"{token}: {PENDING_EXPLANATION}"


def didactic_phrase_explanation(row: AudioRow, tokens: list[str], config: ProjectConfig) -> str:
    phrase = row.text.strip()
    natural = row.translation.strip() or "la idea principal de la frase"
    literal = literal_hint(tokens, config.target_language)
    tone = tone_hint(phrase, config.target_language)
    use = use_hint(phrase, config.target_language)
    words = words_summary(tokens, config.target_language)
    grammar = grammar_explanation(phrase, tokens, config.target_language)
    parts = [
        f"La frase importante es {phrase}. Significa “{natural}”.",
        f"Suena {tone}.",
        use,
    ]
    if literal:
        parts.append(f"Literalmente sería algo como: “{literal}”.")
    if words:
        parts.append(words)
    if grammar:
        parts.append(grammar)
    if config.no_full_translation_enabled:
        parts.append("Aunque el proyecto no muestra traducción completa de la escena, esta frase clave sí se explica para que puedas reconocerla al escuchar.")
    return " ".join(part for part in parts if part).strip()


def literal_hint(tokens: list[str], language: str) -> str:
    if not tokens:
        return ""
    if "korean" in language.casefold() or "coreano" in language.casefold():
        meanings = [token_meaning(token, language) for token in tokens]
        if any(PENDING_EXPLANATION in meaning for meaning in meanings):
            return ""
        return ", ".join(meanings)
    return ""


def tone_hint(phrase: str, language: str) -> str:
    if "korean" in language.casefold() or "coreano" in language.casefold():
        if phrase.endswith(("습니다", "습니까", "ㅂ니다")):
            return "formal y educada"
        if phrase.endswith("요"):
            return "educado y natural, útil en conversación diaria"
        if phrase.endswith("?"):
            return "como pregunta natural"
    return "pendiente de revisión según el contexto"


def use_hint(phrase: str, language: str) -> str:
    if "korean" in language.casefold() or "coreano" in language.casefold():
        if "있" in phrase:
            return "Se usa para decir que algo o alguien existe, está presente o está en cierto lugar."
        if "없" in phrase:
            return "Se usa para decir que algo no existe, no está disponible o no se puede hacer."
        if "몰라" in phrase:
            return "Se usa para decir que no sabes o no entiendes algo."
    return PENDING_EXPLANATION


def words_summary(tokens: list[str], language: str) -> str:
    if not tokens:
        return ""
    if "korean" in language.casefold() or "coreano" in language.casefold():
        summaries = []
        for token in tokens:
            if token in KOREAN_PARTICLE_EXPLANATIONS:
                summaries.append(f"{token} es partícula")
            else:
                summaries.append(f"{token} = {token_meaning(token, language)}")
        return "Palabras y bloques importantes: " + "; ".join(summaries) + "."
    return ""


def grammar_explanation(phrase: str, tokens: list[str], language: str) -> str:
    if "korean" not in language.casefold() and "coreano" not in language.casefold():
        return ""
    details: list[str] = []
    particles = [token for token in tokens if token in KOREAN_PARTICLE_EXPLANATIONS]
    if particles:
        details.append(
            "Las partículas importantes aquí son "
            + ", ".join(particles)
            + ". En coreano, las partículas muestran la función de cada palabra."
        )
    if "있어요" in tokens or "있어요" in phrase:
        details.append("있어요 puede significar “hay”, “existe” o “está”, dependiendo del contexto.")
    if "없어요" in tokens or "없" in phrase:
        details.append("없어요 o 없습니다 expresan ausencia: “no hay”, “no existe” o “no se puede”, según la estructura.")
    if "몰라요" in tokens or "몰라" in phrase:
        details.append("몰라요 viene de 모르다 y significa “no sé” o “no entiendo”.")
    if "수" in tokens and ("없습니다" in tokens or "없" in phrase):
        details.append("La estructura verbo + 수 없습니다 significa que algo no se puede hacer.")
    return " ".join(details)


def _acting_tts(row: AudioRow, marker: str) -> str:
    if row.text_tts.strip():
        return row.text_tts.strip()
    return f"[{marker}] {row.text}"


def _context_explanation(book: Book, lesson: int, config: ProjectConfig) -> str:
    if config.no_full_translation_enabled:
        return (
            f"Esta parte resume el contexto de la lección {lesson:02d} sin leer una "
            "traducción completa. Escucha la escena y pon atención a las frases clave."
        )
    return (
        f"En la lección {lesson:02d}, escucha cómo se usan las frases dentro de la escena. "
        "Después repasaremos el sentido de las expresiones más importantes."
    )


def _clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def _html_to_text(value: str) -> str:
    value = re.sub(r"<(script|style).*?</\1>", " ", value, flags=re.IGNORECASE | re.DOTALL)
    value = re.sub(r"<br\s*/?>", "\n", value, flags=re.IGNORECASE)
    value = re.sub(r"</(p|div|section|article|h[1-6]|li)>", "\n", value, flags=re.IGNORECASE)
    value = re.sub(r"<[^>]+>", " ", value)
    return _clean_text(value)


def _sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?。！？])\s+", text)
    return [_clean_text(part) for part in parts if _clean_text(part)]


def _truthy(value: str) -> bool:
    return value.strip().casefold() in {"1", "true", "yes", "sí", "si", "y"}


def _format_duration_ms(duration_ms: int) -> str:
    seconds = max(0, int(round(duration_ms / 1000)))
    minutes, seconds = divmod(seconds, 60)
    return f"{minutes}m {seconds:02d}s"
