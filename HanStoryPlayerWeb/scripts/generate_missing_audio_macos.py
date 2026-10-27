#!/usr/bin/env python3
"""Genera con las voces del sistema de macOS (`say`) los audios que faltan en
el manifiesto de un curso guiado y los registra como MP3.

Sin coste: usa las voces Premium/Mejoradas instaladas en el Mac. Los audios de
ElevenLabs existentes no se tocan.

    python3 HanStoryPlayerWeb/scripts/generate_missing_audio_macos.py Korean --voice "Yuna (Premium)" --dry-run
    python3 HanStoryPlayerWeb/scripts/generate_missing_audio_macos.py Korean --voice "Yuna (Premium)"
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

WEB_ROOT = Path(__file__).resolve().parent.parent
AUDIO_FIELDS = ("audio", "slow_audio")


def missing_keys(language: str) -> list[str]:
    """Claves de audio citadas por las actividades que no están en el manifiesto."""
    output = subprocess.run(
        ["node", str(WEB_ROOT / "scripts" / "audit_guided_courses.mjs")],
        cwd=WEB_ROOT, capture_output=True, text=True, check=False,
    ).stdout
    report = json.loads(output)
    keys: list[str] = []
    for issue in report.get("issues", []):
        if issue.get("code") != "missing_audio_manifest_entry" or issue.get("language") != language:
            continue
        match = re.search(r"«(.+?)»", issue.get("message", ""))
        if match and match.group(1) not in keys:
            keys.append(match.group(1))
    return keys


def synthesize(text: str, voice: str, target: Path) -> None:
    with tempfile.TemporaryDirectory() as tmp:
        aiff = Path(tmp) / "voice.aiff"
        subprocess.run(["say", "-v", voice, "-o", str(aiff), "--", text], check=True)
        # Mono, 44,1 kHz y ~64 kbps: igual de ligero que el resto del curso.
        subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-y", "-i", str(aiff), "-ac", "1", "-ar", "44100",
             "-af", "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,apad=pad_dur=0.12",
             "-codec:a", "libmp3lame", "-b:a", "64k", str(target)],
            check=True,
        )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("language", help="Carpeta del curso, p. ej. Korean")
    parser.add_argument("--voice", required=True, help='Voz de `say -v "?"`, p. ej. "Yuna (Premium)"')
    parser.add_argument("--dry-run", action="store_true", help="Solo lista lo que falta")
    args = parser.parse_args()

    course = WEB_ROOT / "library" / "courses" / args.language
    manifest_path = course / "audio_manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    keys = [key for key in missing_keys(args.language) if key not in manifest["items"]]
    print(f"{args.language}: {len(keys)} audios por generar con «{args.voice}»")
    for key in keys:
        print("  ", key)
    if args.dry_run or not keys:
        return 0

    tag = f"macos:{args.voice}"
    for key in keys:
        name = "tts-" + hashlib.sha1(f"{tag}|{key}".encode("utf-8")).hexdigest()[:20] + ".mp3"
        synthesize(key, args.voice, course / "audio" / name)
        manifest["items"][key] = f"audio/{name}"
        manifest.setdefault("item_voices", {})[key] = tag
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Listo: {len(keys)} audios añadidos al manifiesto.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
