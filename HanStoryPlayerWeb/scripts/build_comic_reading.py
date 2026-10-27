#!/usr/bin/env python3
"""Construye las tarjetas de «Lectura real» a partir de las traducciones de
cómics hechas con manga-lingua (Library/Application Support/manga-lingua/Cache).

- Publica una SELECCIÓN por obra (MAX_PER_WORK frases), no las obras enteras:
  fragmentos cortos para estudiar, priorizando los que usan vocabulario del curso.
- Calcula con el corpus COMPLETO cuántas veces aparece cada palabra del curso en
  tus cómics (frequency.json: solo conteos, sin texto).
- Conserva las tarjetas existentes y sus ids.

    python3 HanStoryPlayerWeb/scripts/build_comic_reading.py --dry-run
    python3 HanStoryPlayerWeb/scripts/build_comic_reading.py
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

WEB_ROOT = Path(__file__).resolve().parent.parent
CACHE = Path.home() / "Library/Application Support/manga-lingua/Cache"
CARDS = WEB_ROOT / "library/personal_manga/cards.json"
FREQUENCY = WEB_ROOT / "library/personal_manga/frequency.json"
# Frases descartadas en la revisión de calidad: el constructor no las vuelve a añadir.
EXCLUDED = WEB_ROOT / "library/personal_manga/excluded.json"
MAX_PER_WORK = 150

LANGUAGES = {"한국어": "Korean", "korean": "Korean", "ko": "Korean", "deutsch": "German", "de": "German", "german": "German",
             "français": "French", "francais": "French", "fr": "French", "french": "French", "english": "English", "en": "English"}

# Título visible de cada archivo (los que ya existían conservan su nombre).
SOURCES = [
    (r"^lux-ko", "Lux"), (r"^science", "놓지 마 과학!"), (r"^vocabulary", "놓지마 어휘"), (r"^english\.cbz", "놓지마 영어"),
    (r"jangnaneul jalcineun takagi", "장난을 잘 치는 타카기 양"), (r"라멘 아카네코", "라멘 아카네코"), (r"yoceubarang", "요츠바랑!"),
    (r"^ashe-fr", "Ashe"), (r"Choujin X", "Choujin X"), (r"^kda-de", "K/DA"), (r"Kleine Katze Chi", "Kleine Katze Chi"),
    (r"Fate Rewinder", "Fate Rewinder"), (r"Schl", "Die Schlümpfe"), (r"Young Donald Duck|LTB Young", "Young Donald Duck"),
    (r"Kapitel 0", "Kapitel 0"), (r"Dungeon Reset", "Dungeon Reset"), (r"Pokemon Reisen", "Pokémon Reisen"),
]
# Mismos filtros de calidad que tests/personal_manga_cards.test.mjs.
EDITORIAL = re.compile(r"^(?:inhalt|extra|kapitel|episode|tokio\b|chef de guerre|chi.?s sweet home|mein ärgster bester freund)", re.I)
KOREAN_NOISE = re.compile(r"(?:^출처:|^제작|@|\]\s*만|(?:^|\s)ep\d|^정신이의 과학 노트[!.]*$|^잘 치는 타)")
UNRELIABLE = re.compile(r"(?:imposible interpretarlo|impide interpretarlo|no se puede interpretar|parece enumerar)", re.I)
HANGUL = re.compile(r"[\uac00-\ud7a3]")


def studiable(phrase: dict) -> bool:
    text, language = phrase["text"], phrase["language"]
    if not re.search(r"[^\W\d_]", text) or EDITORIAL.search(text) or KOREAN_NOISE.search(text) or UNRELIABLE.search(phrase["note"]):
        return False
    # Ruido de reconocimiento de texto: sílabas sueltas separadas («고 기 밥») o cifras de viñeta al inicio.
    words = text.split()
    if re.match(r"^\d+\s", text) or (language == "Korean" and len(words) >= 3 and sum(len(w) == 1 for w in words) / len(words) > 0.5):
        return False
    # El texto tiene que estar escrito en su idioma (hay líneas mal etiquetadas).
    if (language == "Korean") != bool(HANGUL.search(text)):
        return False
    return all(part["term"].strip() and part["meaning"].strip() for part in phrase["breakdown"])


SKIP_NOTE = re.compile(r"t[ií]tulo|firma|cr[eé]ditos|onomatopeya|sonido|marca de la editorial|n[uú]mero de p[aá]gina|ilegible", re.I)


def decode_name(path: Path) -> str:
    try:
        return base64.urlsafe_b64decode(path.stem + "==").decode("utf-8")
    except Exception:
        return ""


def source_title(name: str) -> str | None:
    file = name.split(":", 1)[1] if ":" in name else name
    for pattern, title in SOURCES:
        if re.search(pattern, file):
            return title
    return None


def slug(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-") or "obra"


def card_id(language: str, source: str, page: int, text: str) -> str:
    """Id estable y único: no depende de cuántas tarjetas haya ni del orden."""
    work = slug(source)
    if work == "obra":  # títulos sin letras latinas (coreano)
        work = "w" + hashlib.sha1(source.encode("utf-8")).hexdigest()[:6]
    return f"{language.lower()}-{work}-{page}-{hashlib.sha1(text.encode('utf-8')).hexdigest()[:8]}"


def load_corpus() -> list[dict]:
    """Frases traducidas de los cachés v4 (los más completos), sin duplicados."""
    phrases, seen = [], set()
    for path in sorted(CACHE.glob("*.json")):
        name = decode_name(path)
        if not name.startswith("v4-es:"):
            continue
        title = source_title(name)
        if not title:
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        page_of = {}
        for page, boxes in (data.get("dialogues") or {}).items():
            for box in boxes or []:
                page_of.setdefault(box.get("text", ""), int(page) if str(page).isdigit() else 0)
        for text, info in (data.get("translations") or {}).items():
            if not isinstance(info, dict):
                continue
            language = LANGUAGES.get(str(info.get("language", "")).strip().lower())
            key = (language, text.strip())
            if not language or key in seen or not info.get("translation"):
                continue
            seen.add(key)
            phrases.append({"language": language, "source": title, "page": page_of.get(text, 0), "text": text.strip(),
                            "translation": info["translation"].strip(), "note": (info.get("note") or "").strip(),
                            "breakdown": [{"term": b.get("term", ""), "meaning": b.get("meaning", ""), "note": b.get("note", "")}
                                          for b in info.get("breakdown") or [] if b.get("term")]})
    return phrases


def course_items(language: str) -> list[str]:
    course = WEB_ROOT / "library/courses" / language
    order = json.loads((course / "course.json").read_text(encoding="utf-8"))
    items = []
    for level in order["levels"]:
        for unit_id in level["unitIds"]:
            # Las unidades de alfabeto enseñan letras y sílabas sueltas, no palabras.
            if re.search(r"reading|hangul|hiragana|katakana|rhythm|alphabet", unit_id):
                continue
            unit = json.loads((course / "units" / f"{unit_id}.json").read_text(encoding="utf-8"))
            for lesson in unit["lessons"]:
                for activity in lesson["activities"]:
                    target = str(activity.get("target") or "").strip().strip(".!?¿¡")
                    if activity.get("type", "").startswith("teach_") and target and not re.search(r"[+→=]", target) and target not in items:
                        items.append(target)
    return items


LATIN = re.compile(r"[A-Za-zÀ-ÿ]")
WORD = re.compile(r"[\wÀ-ÿ'’-]+")
PARTICLES = "(?:은|는|이|가|을|를|에|에서|에게|도|의|로|으로|와|과|하고|만|요|야|아)"


def tokens(text: str) -> str:
    """Texto en minúsculas con espacios en los bordes: « palabra » se busca entera."""
    return " " + " ".join(WORD.findall(text.lower())) + " "


def contains(text: str, item: str, tokenized: str | None = None) -> bool:
    tokenized = tokenized or tokens(text)
    if LATIN.search(item):
        return f" {' '.join(WORD.findall(item.lower()))} " in tokenized
    if " " in item:
        return item in text
    # Coreano: una sílaba suelta (이, 나, 일) solo cuenta como palabra entera o
    # seguida de partícula; las más largas, al inicio del bloque (물 → 물을).
    if len(item) == 1:
        return re.search(rf" {re.escape(item)}{PARTICLES}? ", tokenized) is not None
    return f" {item}" in tokenized


def level_for(phrase: dict) -> int:
    size = len(phrase["text"])
    return 1 if size <= 14 else 2 if size <= 30 else 3 if size <= 55 else 4


def select(phrases: list[dict], items: list[str], existing: set[str]) -> list[dict]:
    known = items[:]
    def score(phrase):
        hits = sum(1 for item in known if contains(phrase["text"], item, phrase.get("_tok")))
        size = len(phrase["text"])
        return hits * 3 + (2 if 8 <= size <= 50 else 0) + min(3, len(phrase["breakdown"])) * 0.3
    usable = [p for p in phrases if 4 <= len(p["text"]) <= 90 and not SKIP_NOTE.search(p["note"]) and len(p["breakdown"]) >= 2 and studiable(p)
              and p["text"] not in existing]
    by_work = defaultdict(list)
    for phrase in usable:
        by_work[phrase["source"]].append(phrase)
    chosen = []
    for work, group in by_work.items():
        room = MAX_PER_WORK - sum(1 for text in existing if text.startswith(f"{work}\x00"))
        ranked = sorted(group, key=lambda p: (-score(p), p["page"], p["text"]))
        chosen.extend(sorted(ranked[:max(0, room)], key=lambda p: (p["page"], p["text"])))
    return chosen


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    data = json.loads(CARDS.read_text(encoding="utf-8"))
    cards = data["cards"]
    corpus = load_corpus()
    by_language = defaultdict(list)
    for phrase in corpus:
        by_language[phrase["language"]].append(phrase)

    # Rango de desbloqueo de las tarjetas existentes por nivel, para las nuevas.
    spans = defaultdict(list)
    for card in cards:
        spans[card.get("level", 2)].append(card.get("unlockAfter", 100))
    span = {level: (min(values), max(values)) for level, values in spans.items()}

    frequency, added = {}, Counter()
    existing_texts = {card["text"] for card in cards}
    if EXCLUDED.exists():
        existing_texts |= set(json.loads(EXCLUDED.read_text(encoding="utf-8")).get("texts", []))
    existing_by_work = {f"{card['source']}\x00{card['text']}" for card in cards}
    for language, phrases in sorted(by_language.items()):
        items = course_items(language)
        for p in phrases:
            p.setdefault("_tok", tokens(p["text"]))
        counts = {item: sum(1 for p in phrases if contains(p["text"], item, p["_tok"])) for item in items}
        frequency[language] = {item: count for item, count in counts.items() if count}
        for phrase in select(phrases, items, existing_by_work | existing_texts):
            if phrase["text"] in existing_texts:
                continue
            level = level_for(phrase)
            low, high = span.get(level, (40, 450))
            cards.append({"id": card_id(language, phrase["source"], phrase["page"], phrase["text"]), "language": language,
                          "source": phrase["source"], "page": phrase["page"], "text": phrase["text"], "translation": phrase["translation"],
                          "note": phrase["note"], "breakdown": phrase["breakdown"], "level": level,
                          "unlockAfter": max(2, int(low + (high - low) * min(1, len(phrase["text"]) / 90))), "priority": 1})
            existing_texts.add(phrase["text"])
            added[(language, phrase["source"])] += 1

    print(f"Corpus: {len(corpus)} frases · tarjetas antes: {len(data['cards']) - sum(added.values())} · nuevas: {sum(added.values())}")
    for (language, source), count in sorted(added.items()):
        print(f"  {language:8} {source:28} +{count}")
    for language, counts in frequency.items():
        top = sorted(counts.items(), key=lambda kv: -kv[1])[:8]
        print(f"  frecuencia {language}: {len(counts)} palabras del curso aparecen · " + ", ".join(f"{k}×{v}" for k, v in top))
    if args.dry_run:
        return 0
    CARDS.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    # La app descarga solo el idioma que estudias (cards-Korean.json, …).
    for language in sorted({card["language"] for card in cards}):
        subset = {**{k: v for k, v in data.items() if k != "cards"}, "cards": [card for card in cards if card["language"] == language]}
        (CARDS.parent / f"cards-{language}.json").write_text(json.dumps(subset, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    FREQUENCY.write_text(json.dumps({"generated_from": "manga-lingua cache (corpus completo, solo conteos)", "languages": frequency},
                                    ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
