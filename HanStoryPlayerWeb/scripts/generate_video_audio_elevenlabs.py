#!/usr/bin/env python3
"""Genera con ElevenLabs el audio que les falta a los videos por tema (videos.json),
normalmente palabras añadidas por correcciones de profesor
(course-authoring/videos/<Idioma>.json). Cada audio se añade al audio_manifest
del curso con la voz del curso y eleven_v4, así que también sirve en las lecciones.
Después hay que volver a ejecutar build_topic_videos.mjs.

    .venv/bin/python HanStoryPlayerWeb/scripts/generate_video_audio_elevenlabs.py --dry-run
    .venv/bin/python HanStoryPlayerWeb/scripts/generate_video_audio_elevenlabs.py --languages Korean French
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT))

from src.config import get_api_key, load_settings  # noqa: E402
from src.elevenlabs_client import ElevenLabsClient, ElevenLabsError  # noqa: E402
from src.guided_course_audio import _audio_name  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent))
from upgrade_macos_audio_elevenlabs import blocked_voices, choose_voice, language_code  # noqa: E402

COURSES = PROJECT / "HanStoryPlayerWeb" / "library" / "courses"
MODEL = "eleven_v4"


def missing(language: str) -> list[str]:
    videos = json.loads((COURSES / language / "videos.json").read_text(encoding="utf-8"))
    seen: list[str] = []
    for topic in videos["topics"]:
        if topic.get("mode") == "dialogue":
            continue
        for item in topic["items"]:
            if "audio" not in item and item["target"] not in seen:
                seen.append(item["target"])
    return seen


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--languages", nargs="*", default=["Korean", "French", "English", "German", "Italian", "Portuguese", "Russian", "Arabic", "Chinese", "Japanese"])
    parser.add_argument("--budget", type=int, default=2500)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    plan = {language: missing(language) for language in args.languages}
    print(f"{sum(map(len, plan.values()))} audios · {sum(len(t) for items in plan.values() for t in items)} caracteres")
    for language, items in plan.items():
        print(f"  {language}: {', '.join(items)}")
    if args.dry_run:
        return 0

    client = ElevenLabsClient(get_api_key(), load_settings())
    blocked = blocked_voices(get_api_key())
    spent = 0
    for language, items in plan.items():
        root = COURSES / language
        manifest_path = root / "audio_manifest.json"
        code = language_code(language)
        for text in items:
            if spent + len(text) > args.budget:
                print(f"Presupuesto alcanzado: {spent} caracteres.")
                return 0
            voice = choose_voice(language, text, blocked)
            relative = f"audio/{_audio_name(code, voice, text)}"
            try:
                client.generate_mp3(text, voice, root / relative, model_id=MODEL, language_code=code)
            except ElevenLabsError as error:
                print(f"  {language} «{text}»: {error}")
                continue
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            manifest["items"][text] = relative
            manifest.setdefault("item_voices", {})[text] = voice
            manifest.setdefault("item_models", {})[text] = MODEL
            manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            spent += len(text)
    print(f"Terminado: {spent} caracteres.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
