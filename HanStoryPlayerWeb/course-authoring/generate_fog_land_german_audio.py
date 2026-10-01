from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

WEB = Path(__file__).resolve().parents[1]
BOOK = WEB / "library" / "books" / "HG-FOGLAND-S1"
VOICE = "Anna (Premium)"


def safe_name(text: str) -> str:
    value = re.sub(r"[^\wÀ-ÿ' -]+", "", text, flags=re.UNICODE).strip()
    return re.sub(r"\s+", " ", value)[:90] or "track"


def main():
    path = BOOK / "hanstory_manifest.json"; manifest = json.loads(path.read_text(encoding="utf-8")); (BOOK / "audio").mkdir(parents=True, exist_ok=True); generated = 0
    for track in manifest["tracks"]:
        relative = f"audio/L{int(track['lesson']):02d}-{int(track['sequence']):02d} - {track['id']} - {safe_name(track['text'])}.m4a"; dest = BOOK / relative
        if not dest.exists() or dest.stat().st_size < 512:
            subprocess.run(["/usr/bin/say", "-v", VOICE, "-r", "145", "-o", str(dest), "--file-format=m4af", "--data-format=aac", track["text"]], check=True, timeout=60); generated += 1
        if dest.stat().st_size < 512: raise RuntimeError(f"Audio vacío: {dest}")
        track["audio_path"] = relative; track["tts_fallback"] = True; track["audio_provenance"] = {"voice": VOICE, "engine": "macOS speech synthesis", "review_status": "listening_review_pending"}
    manifest["audio_mode"] = "recorded-with-browser-tts-fallback"; manifest["audio_provider"] = "macOS speech synthesis"; manifest["audio_voice"] = VOICE; path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    report = BOOK / "PUBLISH_REPORT.txt"; report.write_text(report.read_text(encoding="utf-8") + f"Audio generado: {generated} archivos M4A; voz {VOICE}; revisión auditiva completa pendiente.\n", encoding="utf-8")
    print(json.dumps({"generated": generated, "tracks": len(manifest["tracks"]), "voice": VOICE}, ensure_ascii=False))


if __name__ == "__main__": main()
