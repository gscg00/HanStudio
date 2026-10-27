#!/usr/bin/env python3
"""Sustituye los audios generados con las voces de macOS (item_voices «macos:…»)
por audios de ElevenLabs con las mismas voces que el resto de cada curso.

Prioriza palabras y frases de los cursos. Nunca gasta más de --budget caracteres
y guarda el manifiesto después de cada audio, así que se puede interrumpir y
volver a ejecutar sin repetir trabajo.

    .venv/bin/python HanStoryPlayerWeb/scripts/upgrade_macos_audio_elevenlabs.py --dry-run
    .venv/bin/python HanStoryPlayerWeb/scripts/upgrade_macos_audio_elevenlabs.py --budget 7500
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT))

from src.config import get_api_key, get_japanese_course_voice_id, load_settings  # noqa: E402
from src.elevenlabs_client import ElevenLabsClient, ElevenLabsError  # noqa: E402
from src.guided_course_audio import COURSE_VOICES, VARIETY_VOICES, _audio_name, _stable_short_text, voice_for_text  # noqa: E402
import hashlib  # noqa: E402
import requests  # noqa: E402

COURSES = PROJECT / "HanStoryPlayerWeb" / "library" / "courses"
# Japonés y coreano primero: sus voces del sistema son las más alejadas del resto del curso.
ORDER = ["Korean", "Japanese", "Chinese", "Arabic", "Russian", "German", "French", "Italian", "Portuguese", "English"]


def blocked_voices(api_key: str) -> set[str]:
    """Voces que el plan no permite (clones instantáneos)."""
    response = requests.get("https://api.elevenlabs.io/v1/voices", headers={"xi-api-key": api_key}, timeout=30)
    response.raise_for_status()
    return {voice["voice_id"] for voice in response.json()["voices"] if voice.get("category") == "cloned"}


def language_code(language: str) -> str:
    return "ja" if language == "Japanese" else str(COURSE_VOICES[language]["code"])


def choose_voice(language: str, text: str, blocked: set[str]) -> str:
    """La misma voz que usaría el curso; si el plan no la permite, otra del mismo idioma."""
    if language == "Japanese":
        return get_japanese_course_voice_id()
    voice = voice_for_text(language, text)
    if voice not in blocked:
        return voice
    allowed = [v for v in (*COURSE_VOICES[language]["primary"], *VARIETY_VOICES) if v not in blocked]
    digest = int(hashlib.sha256(f"{language}|{text}".encode("utf-8")).hexdigest()[:8], 16)
    return allowed[digest % len(allowed)]


def pending(language: str) -> list[str]:
    manifest = json.loads((COURSES / language / "audio_manifest.json").read_text(encoding="utf-8"))
    return [text for text, voice in manifest.get("item_voices", {}).items() if str(voice).startswith("macos:")]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--model", default="eleven_v4")
    parser.add_argument("--budget", type=int, default=7500, help="Máximo de caracteres a gastar en esta ejecución")
    parser.add_argument("--languages", nargs="*", default=ORDER)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    plan = [(language, text) for language in args.languages for text in pending(language)]
    total = sum(len(_stable_short_text(language, text)) for language, text in plan)
    print(f"{len(plan)} audios de macOS por sustituir · {total} caracteres · presupuesto {args.budget}")
    for language in args.languages:
        items = [text for lang, text in plan if lang == language]
        if items:
            print(f"  {language:10} {len(items):4} audios · {sum(len(_stable_short_text(language, t)) for t in items)} caracteres")
    if args.dry_run or not plan:
        return 0

    client = ElevenLabsClient(get_api_key(), load_settings())
    blocked = blocked_voices(get_api_key())
    spent = done = 0
    for language in args.languages:
        root = COURSES / language
        manifest_path = root / "audio_manifest.json"
        code = language_code(language)
        for text in pending(language):
            spoken = _stable_short_text(language, text)
            if spent + len(spoken) > args.budget:
                print(f"Presupuesto alcanzado: {spent} caracteres, {done} audios sustituidos.")
                return 0
            voice = choose_voice(language, text, blocked)
            relative = f"audio/{_audio_name(code, voice, text)}"
            try:
                client.generate_mp3(spoken, voice, root / relative, model_id=args.model, language_code=code)
            except ElevenLabsError as error:
                print(f"  {language} «{text}»: {error}")
                continue
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            old = manifest["items"].get(text, "")
            manifest["items"][text] = relative
            manifest["item_voices"][text] = voice
            manifest.setdefault("item_models", {})[text] = args.model
            manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            if old.startswith("audio/tts-") and old != relative:
                (root / old).unlink(missing_ok=True)
            spent += len(spoken)
            done += 1
        print(f"  {language}: listo ({done} audios, {spent} caracteres en total)")
    print(f"Terminado: {done} audios sustituidos con {args.model}, {spent} caracteres.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
