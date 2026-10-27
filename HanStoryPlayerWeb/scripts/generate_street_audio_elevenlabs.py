#!/usr/bin/env python3
"""Genera con ElevenLabs el audio de los videos «De la calle» (street.json).

Cada expresión se guarda en audio/street-<hash>.mp3 y queda anotada en el mapa
«audio» de su tema. Usa eleven_v4, el idioma del curso y la voz del curso. Las ya
generadas se saltan, así que se puede volver a ejecutar tras añadir temas.

    .venv/bin/python HanStoryPlayerWeb/scripts/generate_street_audio_elevenlabs.py --dry-run
    .venv/bin/python HanStoryPlayerWeb/scripts/generate_street_audio_elevenlabs.py --language Korean
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT))

from src.config import get_api_key, load_settings  # noqa: E402
from src.elevenlabs_client import ElevenLabsClient, ElevenLabsError  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent))
from upgrade_macos_audio_elevenlabs import blocked_voices, choose_voice, language_code  # noqa: E402

COURSES = PROJECT / "HanStoryPlayerWeb" / "library" / "courses"
MODEL = "eleven_v4"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--language", default="Korean")
    parser.add_argument("--budget", type=int, default=1500)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    root = COURSES / args.language
    path = root / "street.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    pending = [(topic, item["target"]) for topic in data["topics"] for item in topic["items"]
               if not (root / topic.get("audio", {}).get(item["target"], "missing")).is_file()]
    chars = sum(len(text) for _, text in pending)
    print(f"{len(pending)} audios pendientes · {chars} caracteres · presupuesto {args.budget}")
    if args.dry_run or not pending:
        return 0

    client = ElevenLabsClient(get_api_key(), load_settings())
    blocked = blocked_voices(get_api_key())
    code = language_code(args.language)
    spent = 0
    for topic, text in pending:
        if spent + len(text) > args.budget:
            print(f"Presupuesto alcanzado: {spent} caracteres.")
            break
        voice = choose_voice(args.language, text, blocked)
        relative = "audio/street-" + hashlib.sha256(f"{code}|{voice}|{text}|{MODEL}".encode("utf-8")).hexdigest()[:24] + ".mp3"
        try:
            client.generate_mp3(text, voice, root / relative, model_id=MODEL, language_code=code)
        except ElevenLabsError as error:
            print(f"  «{text}»: {error}")
            continue
        topic.setdefault("audio", {})[text] = relative
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        spent += len(text)
    print(f"Terminado: {spent} caracteres.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
