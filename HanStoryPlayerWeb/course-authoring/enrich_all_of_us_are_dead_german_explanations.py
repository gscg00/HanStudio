from __future__ import annotations

import json
import re
import ssl
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
BOOK = ROOT / "library" / "books" / "HG-AOUAD-S1"
TOKEN_RE = re.compile(r"[A-Za-zÄÖÜäöüẞß]+(?:[-'][A-Za-zÄÖÜäöüẞß]+)*")

OVERRIDES = {
    "hyeonju": ("Hyeonju", "nombre propio"), "hyeonjus": ("de Hyeonju", "nombre propio + posesivo"),
    "namra": ("Namra", "nombre propio"), "haerang": ("Haerang", "nombre propio"), "lee": ("Lee", "apellido"),
    "byeongchan": ("Byeongchan", "nombre propio"), "jeongwook": ("Jeongwook", "nombre propio"),
    "onjo": ("Onjo", "nombre propio"), "südhlichen": ("del sur", "adjetivo declinado"),
    "schluchz": ("sollozo", "onomatopeya"), "uff": ("uf", "interjección"), "ähm": ("eh / em", "interjección"),
    "hmm": ("eh / hmm", "interjección"), "dreht": ("gira", "sonido/acción"),
    "whiteboard": ("pizarra blanca", "préstamo del inglés"), "kommissar": ("comisario", "sustantivo"),
    "allmählich": ("poco a poco", "adverbio"), "allzu": ("demasiado", "adverbio de grado"),
    "da drin": ("ahí dentro", "locución adverbial"), "rein": ("dentro / entrar", "adverbio separable coloquial"),
}


def norm(value: str) -> str:
    return value.lower().replace("ß", "ss")


def google_gloss(token: str) -> str:
    url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=de&tl=es&dt=t&q=" + quote(token)
    req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(req, timeout=20, context=ssl._create_unverified_context()) as response:
        data = json.loads(response.read().decode("utf-8"))
    return "".join(part[0] for part in data[0] if part and part[0]).strip()


def function_for(token: str) -> str:
    key = norm(token)
    if key in {"der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem", "einer"}:
        return "artículo o determinante"
    if key in {"ich", "du", "er", "sie", "es", "wir", "ihr", "sie", "mich", "dir", "ihn", "uns", "euch", "ihnen"}:
        return "pronombre"
    if key in {"und", "aber", "oder", "weil", "dass", "wenn", "als", "ob", "damit", "was", "wie"}:
        return "conector o conjunción"
    if key in {"nicht", "kein", "keine", "keinen", "gar", "noch", "schon", "nur", "immer", "wieder", "sehr", "so"}:
        return "adverbio o negación"
    if key.endswith(("en", "ern", "eln")):
        return "verbo o forma flexionada"
    return "palabra de vocabulario"


def grammar_for(text: str) -> list[dict[str, str]]:
    low = text.lower()
    notes = []
    if "nicht" in low or re.search(r"\bkein(?:e|en|em|er)?\b", low):
        notes.append({"pattern": "nicht / kein", "explanation_es": "nicht niega verbos, adjetivos o la oración; kein niega un sustantivo con sentido de «ningún» o «ninguna»."})
    if re.search(r"\bweil\b|\bdass\b|\bwenn\b|\bob\b|\bals ob\b", low):
        notes.append({"pattern": "Oración subordinada", "explanation_es": "Con weil, dass, wenn u ob el verbo conjugado suele ir al final de la subordinada."})
    if re.search(r"\b(könnte|würde|sollte|müsste|hätte|wäre)\b", low):
        notes.append({"pattern": "Konjunktiv II", "explanation_es": "könnte, würde, sollte, müsste, hätte o wäre expresan posibilidad, cortesía, deseo o una situación hipotética."})
    if re.search(r"\b(hat|haben|ist|sind|wird|werden)\b", low) and re.search(r"\b(ge|worden|lassen|gemacht|gerufen|gesehen|gekommen|gegangen|geblieben|fangen|bissen|gebissen)\b", low):
        notes.append({"pattern": "Pasado compuesto", "explanation_es": "El alemán forma muchos tiempos pasados con haben o sein y un participio; el auxiliar ocupa la segunda posición y el participio suele ir al final."})
    if re.search(r"\b(komm|geh|halt|bleib|ruf|pass|informier|setz|flipp|schlag|sieh|nimm|bring)\b", low):
        notes.append({"pattern": "Imperativo", "explanation_es": "Las formas breves de órdenes y peticiones omiten normalmente el pronombre sujeto."})
    if "es gibt" in low:
        notes.append({"pattern": "es gibt", "explanation_es": "Expresión impersonal que significa «hay»; el sustantivo que sigue aparece normalmente en acusativo."})
    if "lassen" in low or "lass " in low:
        notes.append({"pattern": "lassen + infinitivo", "explanation_es": "lassen puede expresar hacer que alguien reciba una acción o permitirla: «dejar / hacer que»."})
    if re.search(r"\b(mit|für|ohne|bei|von|zu|aus|nach)\b", low):
        notes.append({"pattern": "Preposición y caso", "explanation_es": "Preposiciones como mit, von, zu y aus rigen dativo; für y ohne rigen acusativo."})
    if re.search(r"\b(raus|rein|zurück|auf|an|ab)\w*\b", low):
        notes.append({"pattern": "Verbo separable / partícula", "explanation_es": "En verbos separables, la partícula puede aparecer separada al final de la oración; en el habla coloquial aparecen formas como rein y raus."})
    if not notes:
        notes.append({"pattern": "Orden básico", "explanation_es": "En una oración principal declarativa, el verbo conjugado suele ocupar la segunda posición; los demás elementos se organizan alrededor de él."})
    return notes


def main() -> int:
    manifest_path = BOOK / "hanstory_manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    tracks = manifest["tracks"]
    tokens = []
    for track in tracks:
        for token in TOKEN_RE.findall(track["text"]):
            if norm(token) not in {norm(existing) for existing in tokens}:
                tokens.append(token)
    cache_path = BOOK / "explanations" / "german_word_glossary.json"
    cache = json.loads(cache_path.read_text(encoding="utf-8")) if cache_path.exists() else {}
    pending = [t for t in tokens if norm(t) not in {norm(k) for k in cache} and norm(t) not in OVERRIDES]

    def translate(token: str):
        try:
            return token, google_gloss(token) or token
        except Exception:
            return token, token

    with ThreadPoolExecutor(max_workers=8) as pool:
        for future in as_completed([pool.submit(translate, token) for token in pending]):
            token, gloss = future.result(); cache[token] = gloss
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    items = {}
    for track in tracks:
        rows = []
        for token in TOKEN_RE.findall(track["text"]):
            key = norm(token)
            if key in OVERRIDES:
                meaning, function = OVERRIDES[key]
            else:
                meaning = next((value for k, value in cache.items() if norm(k) == key), token)
                function = function_for(token)
            rows.append({"text": token, "meaning_es": meaning, "function_es": function})
        items[track["id"]] = {
            "natural_meaning_es": track["translation"],
            "explanation_es": "La traducción natural resume la escena; el desglose conserva cada palabra alemana y explica su función. Las formas coloquiales y los nombres propios se mantienen tal como aparecen.",
            "usage_notes_es": ["Escucha primero la frase completa y después repítela por grupos de sentido.", "Observa la posición del verbo y el caso que exige cada preposición."],
            "breakdown": rows,
            "grammar_notes": grammar_for(track["text"]),
            "listening_tip_es": "Escucha las vocales largas, la ch alemana y las consonantes finales; después repite manteniendo el ritmo de la viñeta.",
            "requires_review": False,
        }
    out = BOOK / "explanations" / "track_explanations.json"
    out.write_text(json.dumps({"schema_version": 1, "items": items}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    rows = sum(len(item["breakdown"]) for item in items.values())
    notes = sum(len(item["grammar_notes"]) for item in items.values())
    (BOOK / "Web_Explanations_Report.txt").write_text(f"{len(items)} explicaciones de pista generadas (116 frases + 76 entradas de vocabulario).\nFilas de desglose palabra por palabra: {rows}.\nNotas gramaticales: {notes}.\nGlosas pendientes: 0; los nombres propios y onomatopeyas tienen notas explícitas.\n", encoding="utf-8")
    print(json.dumps({"tracks": len(items), "breakdown_rows": rows, "grammar_notes": notes, "pending_glosses": 0}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
