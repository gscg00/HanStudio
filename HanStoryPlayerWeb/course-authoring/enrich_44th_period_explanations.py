"""Complete the French package's word-by-word teaching layer."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from french_word_explanations import breakdown_for, grammar_for, unresolved_tokens


ROOT = Path(__file__).resolve().parents[1]
BOOK = ROOT / "library" / "books" / "HF-44-S1"


def main() -> int:
    manifest = json.loads((BOOK / "hanstory_manifest.json").read_text(encoding="utf-8"))
    tracks = {track["id"]: track for track in manifest["tracks"]}
    missing = unresolved_tokens([track["text"] for track in tracks.values()])
    if missing:
        print("Unresolved French forms:", ", ".join(missing), file=sys.stderr)
        return 2

    explanation_path = BOOK / "explanations" / "track_explanations.json"
    data = json.loads(explanation_path.read_text(encoding="utf-8"))
    items = data.get("items", {})
    for track_id, track in tracks.items():
        item = items.setdefault(track_id, {})
        item["natural_meaning_es"] = track["translation"]
        if track["type"] == "phrase":
            item["explanation_es"] = (
                "Cada elemento se explica en su forma francesa real. La traducción natural "
                "resume el sentido de la escena; el desglose muestra el papel de cada palabra."
            )
            item["usage_notes_es"] = [
                "Escúchala como un bloque completo y después repítela palabra por palabra.",
                "Las formas coloquiales y las contracciones se conservan porque son las que se oyen en la escena.",
            ]
        else:
            item["explanation_es"] = "Entrada de vocabulario en contexto, con su forma francesa, significado y función gramatical."
            item["usage_notes_es"] = ["Escucha la entrada aislada y después vuelve a oírla dentro de la frase de la lección."]
        item["breakdown"] = breakdown_for(track["text"])
        item["grammar_notes"] = grammar_for(track["text"])
        item["listening_tip_es"] = "Escucha la vocal final y repite la entrada manteniendo el ritmo francés."
        item["requires_review"] = False

    # Keep the explanation file deterministic and preserve the package schema.
    data["schema_version"] = 1
    data["items"] = {track_id: items[track_id] for track_id in tracks}
    explanation_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Enriched {len(tracks)} French track explanations")
    print(f"Breakdown rows: {sum(len(item['breakdown']) for item in data['items'].values())}")
    print(f"Grammar notes: {sum(len(item['grammar_notes']) for item in data['items'].values())}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
