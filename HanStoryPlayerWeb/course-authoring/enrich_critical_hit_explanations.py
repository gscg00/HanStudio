from __future__ import annotations

import json
import re
import ssl
import sys
import unicodedata
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen

from french_word_explanations import TOKEN_RE, _lookup


ROOT = Path(__file__).resolve().parents[1]
BOOK = ROOT / "library" / "books" / "HF-CRITICAL-S1"
OVERRIDES = {
    "scratch": ("ras / sonido de raspar", "onomatopeya"), "wouah": ("guau", "interjección"),
    "splash": ("chapuzón", "onomatopeya"), "obito": ("Obito", "nombre propio"),
    "kaguya": ("Kaguya", "nombre propio"), "paviane": ("Paviane", "nombre propio"),
    "senseï": ("sensei / maestro", "sustantivo"), "h": ("horas", "abreviatura"),
    "deck": ("mazo", "anglicismo de juegos de cartas"), "streaming": ("streaming", "anglicismo"),
    "appart": ("departamento", "forma coloquial de appartement"), "bouquin": ("libro", "sustantivo coloquial"),
    "cafard": ("cucaracha", "sustantivo"), "boulot": ("trabajo", "sustantivo coloquial"),
    "chérie": ("cariño", "vocativo afectivo"), "putains": ("malditos", "insulto/adjetivo coloquial"),
    "concentration": ("concentración", "sustantivo"), "appartement": ("departamento", "sustantivo"),
    "cet": ("este", "determinante demostrativo"), "heureusement": ("por suerte", "adverbio"),
    "son": ("su", "posesivo masculino"), "parfois": ("a veces", "adverbio"), "quand": ("cuando", "conector temporal"),
    "depuis": ("desde", "preposición temporal"), "l'emballage": ("el envoltorio", "le/la + emballage; elisión"),
    "corps": ("cuerpo", "sustantivo"), "humain": ("humano", "adjetivo"), "difficile": ("difícil", "adjetivo"),
    "satisfaire": ("satisfacer", "verbo en infinitivo"), "destiné": ("destinado", "participio/adjetivo"),
    "forme": ("forma", "sustantivo"), "gêne": ("incomodidad", "sustantivo femenino"), "moche": ("feo", "adjetivo coloquial"),
    "ressens": ("siento", "ressentir, presente"), "absolument": ("absolutamente", "adverbio"), "existence": ("existencia", "sustantivo"),
    "mon": ("mi", "determinante posesivo"), "sommeil": ("sueño", "sustantivo"), "panne": ("avería", "sustantivo en être en panne"),
    "relation": ("relación", "sustantivo"), "particulière": ("particular", "adjetivo"), "appartement": ("departamento", "sustantivo"),
    "concentration": ("concentración", "sustantivo"), "intense": ("intenso", "adjetivo"), "cet": ("este", "determinante demostrativo"),
}


def normalize(value: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", value.lower()) if unicodedata.category(c) != "Mn")


def function_for(token: str) -> str:
    key = token.lower().replace("’", "'")
    if key in OVERRIDES:
        return OVERRIDES[key][1]
    if "'" in key:
        return "contracción o forma elidida"
    if key.endswith(("er", "ir", "re")):
        return "verbo en infinitivo o palabra de vocabulario"
    if key.endswith(("e", "es", "ent", "ais", "ait", "ions", "ez")):
        return "forma verbal o palabra de vocabulario"
    return "palabra de vocabulario"


def google_gloss(token: str) -> str:
    url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=fr&tl=es&dt=t&q=" + quote(token)
    request = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(request, timeout=20, context=ssl._create_unverified_context()) as response:
        data = json.loads(response.read().decode("utf-8"))
    return "".join(part[0] for part in data[0] if part and part[0]).strip()


def grammar_for(text: str) -> list[dict[str, str]]:
    low = text.lower()
    notes = []
    if re.search(r"\bne\s|\bn['’]", low):
        notes.append({"pattern": "ne ... pas / ne ... plus", "explanation_es": "La negación rodea al verbo; en el habla coloquial, ne puede omitirse."})
    if re.search(r"\bon\s", low):
        notes.append({"pattern": "on", "explanation_es": "En conversación, on suele equivaler a «nosotros», aunque literalmente también puede significar «uno»."})
    if re.search(r"\bsi\s|\bsi\?", low):
        notes.append({"pattern": "si", "explanation_es": "Introduce una condición o una posibilidad: «si ...»."})
    if "il faut" in low or "faut " in low:
        notes.append({"pattern": "il faut + infinitivo", "explanation_es": "Expresa una obligación impersonal: «hay que ...»."})
    if "plus je" in low or "plus elles" in low:
        notes.append({"pattern": "plus ..., plus ...", "explanation_es": "Construcción correlativa: «cuanto más ..., más ...»."})
    if "c'est" in low or "c’est" in low:
        notes.append({"pattern": "c'est", "explanation_es": "Presenta o identifica algo: «es / esto es»."})
    if re.search(r"\bpour\s|\bpourquoi", low):
        notes.append({"pattern": "pour", "explanation_es": "Pour expresa finalidad o destinatario: «para»; en pourquoi forma «por qué»."})
    if "qu'est-ce" in low or text.rstrip().endswith("?"):
        notes.append({"pattern": "Pregunta hablada", "explanation_es": "La entonación y expresiones como qu'est-ce que marcan una pregunta natural en francés."})
    if "quand " in low or "depuis " in low or "à chaque" in low:
        notes.append({"pattern": "Expresión temporal", "explanation_es": "La frase sitúa la acción en el tiempo mediante «cuando», «desde» o «cada vez que»."})
    return notes


def main() -> int:
    manifest = json.loads((BOOK / "hanstory_manifest.json").read_text(encoding="utf-8"))
    tracks = manifest["tracks"]
    tokens = []
    for track in tracks:
        for token in TOKEN_RE.findall(track["text"]):
            if token.lower() not in {x.lower() for x in tokens}:
                tokens.append(token)

    cache_path = BOOK / "explanations" / "french_word_glossary.json"
    cache = json.loads(cache_path.read_text(encoding="utf-8")) if cache_path.exists() else {}
    pending = [token for token in tokens if token.lower() not in {k.lower() for k in cache} and not _lookup(token) and token.lower() not in OVERRIDES]
    print(f"Glosses cached: {len(cache)}; pending translation: {len(pending)}")

    def get_gloss(token: str):
        try:
            return token, google_gloss(token)
        except Exception as exc:
            return token, f"[glosa pendiente: {token}]"

    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = [pool.submit(get_gloss, token) for token in pending]
        for future in as_completed(futures):
            token, gloss = future.result()
            cache[token] = gloss

    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    items = {}
    for track in tracks:
        breakdown = []
        for token in TOKEN_RE.findall(track["text"]):
            key = token.lower().replace("’", "'")
            found = _lookup(token)
            if found:
                meaning, function = found
            elif key in OVERRIDES:
                meaning, function = OVERRIDES[key]
            else:
                meaning, function = cache.get(token, cache.get(key, f"[glosa pendiente: {token}]")), function_for(token)
            breakdown.append({"text": token, "meaning_es": meaning, "function_es": function})
        items[track["id"]] = {
            "natural_meaning_es": track["translation"],
            "explanation_es": "La traducción resume el sentido de la escena; el desglose conserva cada palabra o contracción francesa y explica su función.",
            "usage_notes_es": ["Escucha primero la frase completa y después repítela palabra por palabra.", "Las formas coloquiales se mantienen porque son las que aparecen en el webtoon."],
            "breakdown": breakdown,
            "grammar_notes": grammar_for(track["text"]),
            "listening_tip_es": "Une las palabras pequeñas a la palabra tónica y repite con el ritmo de la escena.",
            "requires_review": any("[glosa pendiente:" in row["meaning_es"] for row in breakdown),
        }
    explanation_path = BOOK / "explanations" / "track_explanations.json"
    explanation_path.write_text(json.dumps({"schema_version": 1, "items": items}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    pending_final = [row["text"] for item in items.values() for row in item["breakdown"] if "[glosa pendiente:" in row["meaning_es"]]
    report = BOOK / "Web_Explanations_Report.txt"
    report.write_text(
        f"{len(items)} explicaciones de pista generadas (200 frases + 150 entradas de vocabulario).\n"
        f"Filas de desglose palabra por palabra: {sum(len(item['breakdown']) for item in items.values())}.\n"
        f"Notas gramaticales: {sum(len(item['grammar_notes']) for item in items.values())}.\n"
        f"Glosas pendientes: {len(pending_final)}.\nLas entradas están enlazadas por ID al manifest.\n",
        encoding="utf-8",
    )
    print(json.dumps({"tracks": len(items), "breakdown_rows": sum(len(item["breakdown"]) for item in items.values()), "pending_glosses": len(pending_final)}, ensure_ascii=False))
    return 0 if not pending_final else 2


if __name__ == "__main__":
    raise SystemExit(main())
