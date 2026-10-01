from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path


WEB = Path(__file__).resolve().parents[1]
BOOK = WEB / "library" / "books" / "HF-44-S1"
VOICE = "Audrey (Premium)"


def safe_name(text: str) -> str:
    value = re.sub(r"[^\wÀ-ÿ' -]+", "", text, flags=re.UNICODE).strip()
    return re.sub(r"\s+", " ", value)[:90] or "track"


def main() -> None:
    manifest_path = BOOK / "hanstory_manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    audio_dir = BOOK / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)
    generated = 0
    for track in manifest["tracks"]:
        lesson = int(track["lesson"])
        sequence = int(track["sequence"])
        relative = f"audio/L{lesson:02d}-{sequence:02d} - {track['id']} - {safe_name(track['text'])}.m4a"
        destination = BOOK / relative
        if not destination.exists() or destination.stat().st_size < 512:
            subprocess.run(
                ["/usr/bin/say", "-v", VOICE, "-r", "145", "-o", str(destination), "--file-format=m4af", "--data-format=aac", track["text"]],
                check=True,
                timeout=60,
            )
            generated += 1
        if destination.stat().st_size < 512:
            raise RuntimeError(f"Audio vacío: {destination}")
        track["audio_path"] = relative
        track["tts_fallback"] = True
        track["audio_provenance"] = {"voice": VOICE, "engine": "macOS speech synthesis", "review_status": "listening_review_pending"}
    manifest["audio_mode"] = "recorded-with-browser-tts-fallback"
    manifest["audio_provider"] = "macOS speech synthesis"
    manifest["audio_voice"] = VOICE
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    report = BOOK / "PUBLISH_REPORT.txt"
    text = report.read_text(encoding="utf-8")
    text = text.replace(
        "Audio: no se incluyen MP3; todas las pistas usan tts_fallback=true y voz francesa del navegador.",
        "Audio: 306 archivos M4A sintetizados con Audrey (Premium), con tts_fallback=true como respaldo del navegador.",
    )
    text += f"Audio generado: {generated} archivos nuevos; voz {VOICE}; revisión auditiva completa pendiente.\n"
    report.write_text(text, encoding="utf-8")
    print(json.dumps({"generated": generated, "tracks": len(manifest["tracks"]), "voice": VOICE}, ensure_ascii=False))


if __name__ == "__main__":
    main()
