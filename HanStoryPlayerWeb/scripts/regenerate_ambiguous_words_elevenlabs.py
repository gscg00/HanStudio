#!/usr/bin/env python3
"""Regenera con ElevenLabs las palabras sueltas que también existen en inglés
(«pain», «main», «Gift»…), que a veces se pronunciaban a la inglesa.

Usa eleven_v4, el idioma del curso y una frase de contexto que no se pronuncia
(previous_text). Conserva la voz de cada palabra. Se puede interrumpir y volver
a ejecutar: las ya regeneradas quedan marcadas en item_models.

    .venv/bin/python HanStoryPlayerWeb/scripts/regenerate_ambiguous_words_elevenlabs.py --dry-run
    .venv/bin/python HanStoryPlayerWeb/scripts/regenerate_ambiguous_words_elevenlabs.py --budget 3500
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT))

from src.config import get_api_key, load_settings  # noqa: E402
from src.elevenlabs_client import ElevenLabsClient, ElevenLabsError  # noqa: E402
from src.guided_course_audio import COURSE_VOICES, _stable_short_text  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent))
from upgrade_macos_audio_elevenlabs import blocked_voices, choose_voice  # noqa: E402

COURSES = PROJECT / "HanStoryPlayerWeb" / "library" / "courses"
MARK = "eleven_v4+context"
CONTEXT = {
    "French": "Un mot en français :",
    "German": "Ein deutsches Wort:",
    "Italian": "Una parola in italiano:",
    "Portuguese": "Uma palavra em português europeu:",
}
ENGLISH = {line.strip().lower() for line in Path("/usr/share/dict/words").read_text(encoding="utf-8", errors="ignore").splitlines()}


def ambiguous(language: str) -> list[str]:
    manifest = json.loads((COURSES / language / "audio_manifest.json").read_text(encoding="utf-8"))
    done = manifest.get("item_models", {})
    # Los audios marcados «manual» se prepararon a mano a propósito: no se tocan.
    manual = {key for key, voice in manifest.get("item_voices", {}).items() if voice == "manual"}
    return [key for key in manifest["items"] if key not in manual
            and re.fullmatch(r"[A-Za-zÀ-ÿ'’-]{2,}[.!?]?", key.strip())
            and key.strip(".!?").lower() in ENGLISH and done.get(key) != MARK]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--budget", type=int, default=3500)
    parser.add_argument("--languages", nargs="*", default=list(CONTEXT))
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    plan = {language: ambiguous(language) for language in args.languages}
    total = sum(len(_stable_short_text(language, text)) for language, items in plan.items() for text in items)
    print(f"{sum(map(len, plan.values()))} palabras ambiguas · {total} caracteres · presupuesto {args.budget}")
    for language, items in plan.items():
        print(f"  {language:10} {len(items):4} · {', '.join(items[:12])}{' …' if len(items) > 12 else ''}")
    if args.dry_run:
        return 0

    client = ElevenLabsClient(get_api_key(), load_settings())
    blocked = blocked_voices(get_api_key())
    spent = done = 0
    for language, items in plan.items():
        root = COURSES / language
        manifest_path = root / "audio_manifest.json"
        code = str(COURSE_VOICES[language]["code"])
        for text in items:
            spoken = _stable_short_text(language, text)
            if spent + len(spoken) > args.budget:
                print(f"Presupuesto alcanzado: {spent} caracteres, {done} palabras.")
                return 0
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            voice = manifest.get("item_voices", {}).get(text, "")
            if not voice or voice in blocked or voice.startswith("macos:"):
                voice = choose_voice(language, text, blocked)
            relative = "audio/" + hashlib.sha256(f"{code}|{voice}|{text}|{MARK}".encode("utf-8")).hexdigest()[:24] + ".mp3"
            try:
                client.generate_mp3(spoken, voice, root / relative, model_id="eleven_v4", language_code=code,
                                    previous_text=CONTEXT[language])
            except ElevenLabsError as error:
                print(f"  {language} «{text}»: {error}")
                continue
            old = manifest["items"].get(text, "")
            manifest["items"][text] = relative
            manifest["item_voices"][text] = voice
            manifest.setdefault("item_models", {})[text] = MARK
            manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            # El archivo anterior solo se borra si ninguna otra clave lo usa.
            if old and old != relative and old not in manifest["items"].values():
                (root / old).unlink(missing_ok=True)
            spent += len(spoken)
            done += 1
        print(f"  {language}: listo ({done} palabras, {spent} caracteres en total)")
    print(f"Terminado: {done} palabras regeneradas, {spent} caracteres.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
