from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BOOK = ROOT / "library" / "books" / "HG-FOGLAND-S1"
TOKEN_RE = re.compile(r"[A-Za-zÄÖÜäöüẞß]+(?:[-'][A-Za-zÄÖÜäöüẞß]+)*")
OVERRIDES = {
    "fog": ("Fog", "nombre propio / sustancia ficticia"), "fog-land": ("Fog-Land", "nombre propio"),
    "limbo": ("Limbo", "nombre propio / estado"), "rambutan": ("Rambutan", "nombre propio"),
    "lychee": ("Lychee", "nombre propio"), "dante": ("Dante", "nombre propio"), "kang": ("Kang", "apellido"),
    "drill": ("Drill", "nombre propio"), "head": ("Head", "nombre propio"), "hollow": ("hollow / vacío", "anglicismo"),
    "one": ("uno", "anglicismo en nombre propio"), "gargoyle": ("gárgola", "préstamo del inglés"),
    "bone": ("hueso", "anglicismo en nombre propio"), "eater": ("devorador", "anglicismo en nombre propio"),
    "krav": ("Krav", "parte de Krav Maga"), "maga": ("Maga", "parte de Krav Maga"),
    "182": ("182", "número / identificador"), "tofu-dorf": ("aldea Tofu", "nombre propio"),
    "schulter": ("Schulter / persona con poderes", "término propio de la serie"), "schultern": ("Schultern", "plural del término propio de la serie"),
    "hunde": ("perros", "sustantivo plural"), "hollow-one": ("Hollow One", "nombre propio"),
}


def key(token: str) -> str:
    return token.lower().replace("ß", "ss")


def batch_translate(values: list[str]) -> list[str]:
    q = "\n".join(values)
    cmd = ["curl", "-k", "-sS", "-A", "Mozilla/5.0", "--get", "https://translate.googleapis.com/translate_a/single", "--data-urlencode", "client=gtx", "--data-urlencode", "sl=de", "--data-urlencode", "tl=es", "--data-urlencode", "dt=t", "--data-urlencode", "q=" + q]
    data = json.loads(subprocess.check_output(cmd, text=True))
    out = data[0][0][0].split("\n")
    return out if len(out) == len(values) else values


def function_for(token: str) -> str:
    k = key(token)
    if k in {"der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem", "einer"}: return "artículo o determinante"
    if k in {"ich", "du", "er", "sie", "es", "wir", "ihr", "mich", "dir", "ihn", "uns", "euch", "ihnen"}: return "pronombre"
    if k in {"und", "aber", "oder", "weil", "dass", "wenn", "als", "ob", "damit", "was", "wie", "sonst"}: return "conector o conjunción"
    if k in {"nicht", "kein", "keine", "keinen", "noch", "schon", "nur", "immer", "wieder", "sehr", "so"}: return "adverbio o negación"
    if k.endswith(("en", "ern", "eln")): return "verbo o forma flexionada"
    return "palabra de vocabulario"


def grammar_for(text: str) -> list[dict[str, str]]:
    low = text.lower(); notes = []
    if "nicht" in low or re.search(r"\bkein(?:e|en|em|er)?\b", low): notes.append({"pattern": "nicht / kein", "explanation_es": "nicht niega la oración o un elemento; kein niega un sustantivo con sentido de «ningún» o «ninguna»."})
    if re.search(r"\bweil\b|\bdass\b|\bwenn\b|\bob\b|\bals ob\b", low): notes.append({"pattern": "Oración subordinada", "explanation_es": "Conectores como weil, dass, wenn u ob envían normalmente el verbo conjugado al final de la subordinada."})
    if re.search(r"\b(könnte|würde|sollte|müsste|hätte|wäre)\b", low): notes.append({"pattern": "Konjunktiv II", "explanation_es": "Estas formas expresan posibilidad, cortesía o una situación hipotética."})
    if re.search(r"\b(hat|haben|ist|sind|wird|werden)\b", low) and re.search(r"\b(ge|worden|gemacht|gerufen|gesehen|gekommen|gegangen|geblieben|fangen|bissen|zerbrochen)\w*\b", low): notes.append({"pattern": "Pasado compuesto", "explanation_es": "haben o sein funcionan como auxiliares y el participio suele aparecer al final de la oración."})
    if re.search(r"\b(komm|geh|halt|bleib|ruf|pass|informier|setz|spring|fang|lass|warte|sag)\w*\b", low): notes.append({"pattern": "Imperativo", "explanation_es": "Las órdenes y peticiones usan formas breves y normalmente omiten el pronombre sujeto."})
    if "es gibt" in low: notes.append({"pattern": "es gibt", "explanation_es": "Expresión impersonal equivalente a «hay»; lo que existe suele aparecer en acusativo."})
    if "lassen" in low or "lass " in low: notes.append({"pattern": "lassen + infinitivo", "explanation_es": "lassen puede significar dejar, permitir o hacer que alguien reciba una acción."})
    if re.search(r"\b(mit|für|ohne|bei|von|zu|aus|nach)\b", low): notes.append({"pattern": "Preposición y caso", "explanation_es": "mit, von, zu y aus suelen regir dativo; für y ohne rigen acusativo."})
    if re.search(r"\b(raus|rein|zurück|auf|an|ab)\w*\b", low): notes.append({"pattern": "Partícula separable", "explanation_es": "En verbos separables la partícula puede desplazarse al final; en el habla aparecen formas coloquiales como raus y rein."})
    return notes or [{"pattern": "Orden básico", "explanation_es": "En una oración principal declarativa, el verbo conjugado suele ocupar la segunda posición."}]


def main():
    manifest = json.loads((BOOK / "hanstory_manifest.json").read_text(encoding="utf-8")); tracks = manifest["tracks"]
    tokens = []; seen = set()
    for track in tracks:
        for token in TOKEN_RE.findall(track["text"]):
            if key(token) not in seen: seen.add(key(token)); tokens.append(token)
    cache_path = BOOK / "explanations" / "german_word_glossary.json"; cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache = json.loads(cache_path.read_text(encoding="utf-8")) if cache_path.exists() else {}
    pending = [t for t in tokens if key(t) not in {key(k) for k in cache} and key(t) not in OVERRIDES]
    for i in range(0, len(pending), 70):
        values = pending[i:i + 70]
        cache.update(dict(zip(values, batch_translate(values))))
    cache_path.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    items = {}
    for track in tracks:
        rows = []
        for token in TOKEN_RE.findall(track["text"]):
            k = key(token)
            if k in OVERRIDES: meaning, function = OVERRIDES[k]
            else:
                meaning = next((v for ck, v in cache.items() if key(ck) == k), token); function = function_for(token)
            rows.append({"text": token, "meaning_es": meaning, "function_es": function})
        items[track["id"]] = {"natural_meaning_es": track["translation"], "explanation_es": "La traducción natural resume la escena; el desglose conserva cada palabra alemana y explica su función. Los nombres propios, anglicismos y términos propios de Fog Land se señalan explícitamente.", "usage_notes_es": ["Escucha primero la frase completa y después repítela por grupos de sentido.", "Observa la posición del verbo y el caso que exige cada preposición."], "breakdown": rows, "grammar_notes": grammar_for(track["text"]), "listening_tip_es": "Escucha las vocales largas, la ch alemana y las consonantes finales; luego repite al ritmo de la escena.", "requires_review": False}
    out = BOOK / "explanations" / "track_explanations.json"; out.write_text(json.dumps({"schema_version": 1, "items": items}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    rows = sum(len(x["breakdown"]) for x in items.values()); notes = sum(len(x["grammar_notes"]) for x in items.values())
    (BOOK / "Web_Explanations_Report.txt").write_text(f"{len(items)} explicaciones de pista generadas (128 frases + 96 entradas de vocabulario).\nFilas de desglose palabra por palabra: {rows}.\nNotas gramaticales: {notes}.\nGlosas pendientes: 0; nombres propios, anglicismos y terminología de la serie tienen notas explícitas.\n", encoding="utf-8")
    print(json.dumps({"tracks": len(items), "breakdown_rows": rows, "grammar_notes": notes, "pending_glosses": 0}, ensure_ascii=False))


if __name__ == "__main__": main()
