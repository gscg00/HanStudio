from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from .config import PROJECT_DIR

WEB_LIBRARY = PROJECT_DIR / "HanStoryPlayerWeb" / "library"
TOPIC_CACHE = PROJECT_DIR / "project_cache" / "topics"
CLASSIFICATION_VERSION = 2

KOREAN_TOPICS = {
    "obligation": ("Obligación / Tener que", "Frases para expresar que alguien tiene que hacer algo.", ["-아/어야 하다", "해야 해요", "해야 한다"], ["해야", "해야 해", "해야 한다", "가져가야", "챙겨야", "어야 해", "아야 해"]),
    "permission": ("Permiso / Posibilidad", "Permiso, capacidad y posibilidad.", ["-아/어도 돼요", "-(으)ㄹ 수 있어요", "못"], ["도 돼", "수 있어", "수 없", "못 "]),
    "places": ("Lugares", "Ubicar personas, objetos y destinos.", ["여기", "거기", "저기", "어디"], ["여기", "거기", "저기", "어디", "이곳", " 밖", " 안", "집", "마을"]),
    "directions": ("Direcciones", "Moverse y explicar hacia dónde ir.", ["이쪽", "저쪽", "오른쪽", "왼쪽"], ["이쪽", "저쪽", "오른쪽", "왼쪽", "앞으로", "뒤로", "가요", "와요", "가야"]),
    "shopping": ("Compras / Mercado", "Preguntar precios, comprar y pedir productos.", ["얼마예요", "주세요"], ["얼마", "주세요", "사다", "팔다", "돈", "가격", "시장"]),
    "past": ("Tiempo pasado", "Hablar de acciones y estados pasados.", ["-았/었어요", "했어요"], ["았어요", "었어요", "했어요", "갔어요", "먹었어요"]),
    "future": ("Futuro / Intención", "Planes, promesas e intenciones.", ["-(으)ㄹ 거예요", "-(으)ㄹ게요"], ["거예요", "갈게요", "할게요", "볼게요"]),
    "wanting": ("Querer", "Expresar deseos y cosas que se quieren hacer.", ["-고 싶어요"], ["고 싶"]),
    "existence": ("Existencia", "Decir que algo existe, está o no está.", ["있어요", "없어요"], ["있어요", "없어요", "있나요", "없나요"]),
    "negation": ("Negación", "Negar acciones, estados o posibilidades.", ["안", "못", "-지 않아요"], [" 안 ", "못 ", "지 않", "아니요"]),
    "experience": ("Experiencia", "Hablar de experiencias previas.", ["-아/어 본 적이 있어요/없어요"], ["본 적", "해 본", "가 본"]),
    "contrast": ("Comparación / Contraste", "Contrastar ideas y añadir matices.", ["-지만", "그런데", "그래도"], ["지만", "그런데", "그래도"]),
    "requests": ("Ayuda / Peticiones", "Pedir ayuda o solicitar una acción cortésmente.", ["-아/어 주세요"], ["도와주세요", "말해 주세요", "기다려 주세요", "주세요"]),
    "food": ("Comida y bebida", "Vocabulario y frases para comer, beber y pedir alimentos.", ["먹다", "마시다"], ["물", "음식", "먹", "마시", "배고파"]),
}

UNIVERSAL_TRANSLATION_RULES = {
    "obligation": ["tener que", "tengo que", "tienes que", "tiene que", "tenemos que", "debe", "debemos", "hay que", "necesita"],
    "permission": ["puede ", "puedo ", "permitido", "es posible", "no puede"],
    "places": ["aquí", "allí", "dónde", "lugar", "casa", "aldea", "pueblo", "ciudad", "dentro", "fuera"],
    "directions": ["derecha", "izquierda", "delante", "detrás", "hacia", "camino", "ir ", "venir ", "llegar"],
    "shopping": ["cuánto", "precio", "comprar", "vender", "dinero", "mercado", "cuesta"],
    "past": ["ayer", "antes", "pasado", "fui ", "hice ", "comí ", "estaba", "era "],
    "future": ["mañana", "voy a", "vamos a", "haré", "será", "estará"],
    "wanting": ["quiero", "quiere", "queremos", "me gustaría"],
    "existence": ["hay ", "existe", "no hay", "está aquí", "está allí"],
    "negation": [" no ", "nunca", "tampoco", "nadie", "nada"],
    "experience": ["alguna vez", "he estado", "he visto", "he probado", "experiencia"],
    "contrast": ["pero", "sin embargo", "aunque", "aun así", "en cambio"],
    "requests": ["por favor", "ayúd", "dime", "dígame", "espera", "espere", "dame", "deme"],
    "food": ["agua", "comida", "comer", "beber", "bebida", "hambre", "restaurante"],
}


def now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def classification_hash(track: dict, language: str) -> str:
    # Audio path deliberately excluded: replacing audio must not invalidate classification.
    value = f"v{CLASSIFICATION_VERSION}\x1f{track.get('id','')}\x1f{track.get('text','')}\x1f{track.get('translation','')}\x1f{language}"
    return hashlib.sha256(value.encode()).hexdigest()


def classify_track(track: dict, language: str) -> dict:
    text = str(track.get("text", "")); topics = []; grammar = []
    if language.casefold() == "korean":
        padded = f" {text} "
        for topic_id, (_title, _description, patterns, needles) in KOREAN_TOPICS.items():
            if any(needle in padded for needle in needles): topics.append(topic_id); grammar.extend(pattern for pattern in patterns if any(part in text for part in pattern.replace("-", "").split("/") if len(part) > 1))
    translation = f" {str(track.get('translation', '')).casefold()} "
    for topic_id, needles in UNIVERSAL_TRANSLATION_RULES.items():
        if topic_id not in topics and any(needle in translation for needle in needles): topics.append(topic_id)
    for topic_id in track.get("topics", []):
        normalized = str(topic_id).casefold().strip()
        if normalized in KOREAN_TOPICS and normalized not in topics: topics.append(normalized)
    grammar.extend(str(value) for value in track.get("grammar_patterns", []) if str(value).strip())
    return {"source_hash": classification_hash(track, language), "difficulty": track.get("difficulty", "") or "A1", "topics": topics, "grammar_patterns": list(dict.fromkeys(grammar)), "vocabulary_tags": [], "function_tags": topics[:]}


def rebuild_topics(web_library: Path = WEB_LIBRARY) -> dict:
    books_root = web_library / "books"; topics_root = web_library / "topics"; TOPIC_CACHE.mkdir(parents=True, exist_ok=True); topics_root.mkdir(parents=True, exist_ok=True)
    grouped: dict[str, dict[str, list[dict]]] = {}; manifests = list(books_root.glob("*/hanstory_manifest.json")) if books_root.exists() else []
    for manifest_path in manifests:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8")); code = manifest.get("project_code", manifest_path.parent.name); language = manifest.get("target_language", "Unknown"); cache_path = TOPIC_CACHE / f"{code}_topics.json"
        try: cache = json.loads(cache_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError): cache = {"items": {}}
        cache_items = cache.setdefault("items", {}); explanation_path = manifest_path.parent / "explanations/track_explanations.json"
        try: explanations = json.loads(explanation_path.read_text(encoding="utf-8")).get("items", {})
        except (OSError, json.JSONDecodeError): explanations = {}
        for track in manifest.get("tracks", []):
            if track.get("type") != "phrase": continue
            track_id = str(track.get("id", "")); digest = classification_hash(track, language); classification = cache_items.get(track_id)
            if not classification or classification.get("source_hash") != digest: classification = classify_track(track, language); cache_items[track_id] = classification
            track.update({"language": language, "difficulty": classification.get("difficulty", ""), "topics": classification.get("topics", []), "grammar_patterns": classification.get("grammar_patterns", []), "vocabulary_tags": classification.get("vocabulary_tags", []), "function_tags": classification.get("function_tags", []), "source_book_code": code, "source_lesson": track.get("lesson", 0), "source_track_id": track_id})
            for topic_id in classification.get("topics", []):
                grouped.setdefault(language, {}).setdefault(topic_id, []).append({"book_code": code, "book_title": manifest.get("title", code), "track_id": track_id, "lesson": track.get("lesson", 0), "sequence": track.get("sequence", 0), "speaker": track.get("speaker", ""), "text": track.get("text", ""), "translation": track.get("translation", ""), "audio_path": f"books/{code}/{track.get('audio_path','')}", "pattern": (classification.get("grammar_patterns") or [""])[0], "difficulty": classification.get("difficulty", ""), "explanation_ref": track_id, "has_explanation": track_id in explanations})
        cache.update({"schema_version": 1, "project_code": code, "language": language, "updated_at": now()}); cache_path.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"); manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    index = {"schema_version": 1, "updated_at": now(), "languages": {}}
    for language, topics in grouped.items():
        entries = []
        for topic_id, items in topics.items():
            definition = KOREAN_TOPICS.get(topic_id, (topic_id.title(), "", [], [])); topic_patterns = definition[2] if language.casefold() == "korean" else sorted({item["pattern"] for item in items if item.get("pattern")}); data = {"schema_version": 1, "language": language, "id": f"{language[:2].casefold()}_{topic_id}", "title": definition[0], "description": definition[1], "patterns": topic_patterns, "items": sorted(items, key=lambda x: (x["difficulty"], x["book_code"], x["lesson"], x["sequence"]))}
            relative = Path("topics") / language / f"{data['id']}.json"; target = web_library / relative; target.parent.mkdir(parents=True, exist_ok=True); target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            entries.append({"id": data["id"], "title": data["title"], "description": data["description"], "patterns": data["patterns"], "track_count": len(items), "manifest": relative.as_posix()})
        index["languages"][language] = {"topics": sorted(entries, key=lambda x: x["title"])}
    (topics_root / "topic_index.json").write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return index
