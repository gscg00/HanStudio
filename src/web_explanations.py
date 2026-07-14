from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

from .book_manager import Book
from .config import PROJECT_DIR, get_openai_api_key
from .creative_engine import get_engine
from .project_config import load_project_config

CACHE_DIR = PROJECT_DIR / "project_cache" / "explanations"
FORBIDDEN = ("palabra importante según el contexto", "bloque importante", "revisa su sentido", "se usa para expresar esta idea de forma natural")


def now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def source_hash(track: dict, target_language: str, explanation_language: str) -> str:
    value = "\x1f".join(str(track.get(k, "")).strip() for k in ("id", "text", "translation")) + f"\x1f{target_language}\x1f{explanation_language}"
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def cache_path(code: str) -> Path:
    return CACHE_DIR / f"{code}_track_explanations.json"


def load_explanations(book: Book, published_path: Path | None = None) -> dict:
    for path in (cache_path(book.code), published_path):
        if path and path.exists():
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
                if isinstance(data.get("items"), dict): return data
            except (OSError, json.JSONDecodeError): pass
    return {"schema_version": 1, "project_code": book.code, "items": {}}


@dataclass
class ExplanationPlan:
    total: int = 0
    existing: int = 0
    reused: int = 0
    missing: int = 0
    outdated: int = 0
    selected: int = 0
    estimated_characters: int = 0
    estimated_tokens: int = 0
    model: str = ""

    def text(self) -> str:
        return "\n".join((f"Frases totales: {self.total}", f"Explicaciones existentes: {self.existing}", f"Explicaciones reutilizadas: {self.reused}", f"Explicaciones faltantes: {self.missing}", f"Requieren actualización: {self.outdated}", f"Se enviarán: {self.selected}", f"Caracteres estimados: {self.estimated_characters}", f"Tokens estimados: {self.estimated_tokens}", f"Modelo OpenAI: {self.model or 'no configurado'}", "Costo estimado: consulta la tarifa vigente del modelo seleccionado."))


@dataclass
class ExplanationReport:
    model: str = ""
    processed: int = 0
    reused: int = 0
    new: int = 0
    regenerated: int = 0
    errors: list[str] = field(default_factory=list)
    failed_ids: list[str] = field(default_factory=list)
    estimated_tokens: int = 0

    def text(self, book: Book, version: str) -> str:
        return "\n".join(("HanStory Web — Explicaciones", f"Libro: {book.title} ({book.code})", f"Versión: {version}", f"Modelo: {self.model}", f"Frases procesadas: {self.processed}", f"Frases reutilizadas: {self.reused}", f"Frases nuevas: {self.new}", f"Frases regeneradas: {self.regenerated}", f"Tokens estimados: {self.estimated_tokens}", f"IDs fallidos: {', '.join(self.failed_ids) or 'ninguno'}", "Errores:", *[f"- {e}" for e in self.errors])) + "\n"


def phrase_tracks(manifest: dict) -> list[dict]:
    return [t for t in manifest.get("tracks", []) if t.get("type") == "phrase" and str(t.get("text", "")).strip()]


def plan_explanations(book: Book, manifest: dict, *, regenerate: bool = False, lesson: int | None = None, selected_ids: set[str] | None = None) -> tuple[ExplanationPlan, dict]:
    config = load_project_config(book); data = load_explanations(book); items = data.get("items", {}); tracks = phrase_tracks(manifest)
    plan = ExplanationPlan(total=len(tracks), model=config.creative_model_name)
    for track in tracks:
        old = items.get(str(track["id"])); digest = source_hash(track, manifest.get("target_language", ""), manifest.get("explanation_language", "")); eligible = (lesson is None or track.get("lesson") == lesson) and (not selected_ids or str(track["id"]) in selected_ids)
        if old: plan.existing += 1
        if old and old.get("source_hash") == digest and not regenerate: plan.reused += 1
        elif old: plan.outdated += 1
        else: plan.missing += 1
        if eligible and (regenerate or not old or old.get("source_hash") != digest):
            plan.selected += 1; plan.estimated_characters += len(str(track.get("text", ""))) + len(str(track.get("translation", ""))) + 900
    plan.estimated_tokens = max(1, plan.estimated_characters // 4) if plan.selected else 0
    return plan, data


def _validate(payload: dict, track: dict) -> list[str]:
    errors = []
    if str(payload.get("id", track["id"])) != str(track["id"]): errors.append("OpenAI devolvió un ID distinto.")
    combined = json.dumps(payload, ensure_ascii=False).casefold()
    for phrase in FORBIDDEN:
        if phrase in combined: errors.append(f"Frase genérica prohibida: {phrase}")
    if not str(payload.get("natural_meaning_es", "")).strip(): errors.append("Falta natural_meaning_es.")
    if not str(payload.get("explanation_es", "")).strip(): errors.append("Falta explanation_es.")
    if len(str(track.get("text", "")).split()) > 2 and not payload.get("breakdown"): errors.append("El desglose está vacío.")
    if payload.get("text") and payload["text"] != track.get("text"): errors.append("La respuesta cambió el texto original.")
    return errors


def _normalize_payload(payload: dict) -> dict:
    payload = dict(payload)
    payload["breakdown"] = [{"text": str(item.get("text") or item.get("korean") or item.get("part") or item.get("word") or ""), "romanization": str(item.get("romanization") or ""), "meaning_es": str(item.get("meaning_es") or item.get("meaning") or ""), "function_es": str(item.get("function_es") or item.get("type") or item.get("function") or "")} for item in payload.get("breakdown", []) if isinstance(item, dict)]
    payload["grammar_notes"] = [{"pattern": str(item.get("pattern") or item.get("point") or item.get("form") or ""), "explanation_es": str(item.get("explanation_es") or item.get("detail") or item.get("explanation") or "")} for item in payload.get("grammar_notes", []) if isinstance(item, dict)]
    if isinstance(payload.get("usage_notes_es"), list): payload["usage_notes_es"] = "\n".join(f"• {value}" for value in payload["usage_notes_es"] if str(value).strip())
    return payload


def generate_explanations(book: Book, manifest: dict, *, regenerate: bool = False, lesson: int | None = None, selected_ids: set[str] | None = None, version: str = "1.0.0") -> tuple[dict, ExplanationReport]:
    config = load_project_config(book)
    if config.creative_provider_name != "OpenAI": raise ValueError("Selecciona OpenAI como Motor creativo para generar explicaciones.")
    api_key = get_openai_api_key()
    if not api_key: raise ValueError("Falta OPENAI_API_KEY.")
    if not config.creative_model_name: raise ValueError("Selecciona un modelo de OpenAI.")
    plan, data = plan_explanations(book, manifest, regenerate=regenerate, lesson=lesson, selected_ids=selected_ids); items = data.setdefault("items", {}); engine = get_engine("OpenAI"); report = ExplanationReport(model=config.creative_model_name, estimated_tokens=plan.estimated_tokens)
    instructions = f"Eres un profesor experto de {manifest.get('target_language','idiomas')} para hablantes de {manifest.get('explanation_language','Spanish')}. Devuelve exclusivamente JSON válido. Explica de forma clara, específica, útil y natural. No inventes contenido fuera de la frase. No uses estas expresiones: {', '.join(FORBIDDEN)}. Si hay duda, marca requires_review=true."
    for track in phrase_tracks(manifest):
        track_id = str(track["id"]); digest = source_hash(track, manifest.get("target_language", ""), manifest.get("explanation_language", "")); old = items.get(track_id); eligible = (lesson is None or track.get("lesson") == lesson) and (not selected_ids or track_id in selected_ids)
        if not eligible or (old and old.get("source_hash") == digest and not regenerate): report.reused += bool(old); continue
        prompt = json.dumps({"task": "Explica únicamente esta frase", "required_keys": ["id", "natural_meaning_es", "literal_note_es", "explanation_es", "breakdown", "grammar_notes", "usage_notes_es", "listening_tip_es", "requires_review"], "track": {k: track.get(k) for k in ("id", "speaker", "lesson", "sequence", "text", "translation")}}, ensure_ascii=False)
        try:
            payload = _normalize_payload(engine.generate_structured_json(api_key=api_key, model_name=config.creative_model_name, instructions=instructions, prompt=prompt, temperature=0.2, max_tokens=1800))
            errors = _validate(payload, track); payload.update({k: track.get(k) for k in ("id", "speaker", "lesson", "sequence", "text", "translation")}); payload["source_hash"] = digest; payload["difficulty"] = book.level or ""; payload["requires_review"] = bool(payload.get("requires_review")) or bool(errors)
            if errors: payload["validation_errors"] = errors; report.errors.extend(f"{track_id}: {e}" for e in errors)
            items[track_id] = payload; report.regenerated += bool(old); report.new += not bool(old); report.processed += 1
        except Exception as exc:
            report.failed_ids.append(track_id); report.errors.append(f"{track_id}: {exc}")
    data.update({"schema_version": 1, "project_code": book.code, "target_language": manifest.get("target_language", ""), "explanation_language": manifest.get("explanation_language", ""), "generated_at": now(), "model": config.creative_model_name})
    CACHE_DIR.mkdir(parents=True, exist_ok=True); cache_path(book.code).write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    report_path = book.reports_dir / "Web_Explanations_Report.txt"; report_path.parent.mkdir(parents=True, exist_ok=True); report_path.write_text(report.text(book, version), encoding="utf-8")
    return data, report
