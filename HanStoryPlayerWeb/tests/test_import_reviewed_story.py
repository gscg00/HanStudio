import json
import importlib.util
from pathlib import Path

import pytest

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "import_reviewed_story.py"
SPEC = importlib.util.spec_from_file_location("import_reviewed_story", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)
build_package = MODULE.build_package
load_and_validate = MODULE.load_and_validate


def sample() -> dict:
    return {
        "code": "HG-CUSTOM-01",
        "title": "Prueba alemana",
        "rights": {"confirmed": True, "holder": "Titular", "basis": "Permiso"},
        "chapters": [{
            "number": 1,
            "title": "Inicio",
            "tracks": [{
                "id": "HGC10101",
                "speaker": "A",
                "ocr_text": "Hallo  !",
                "reviewed_text": "Hallo!",
            "translation": "¡Hola!",
                "type": "phrase",
                "source_ref": "escena-1",
                "manual_reviewed": True,
            }],
        }],
    }


def test_import_preserves_ocr_and_review(tmp_path: Path):
    source = tmp_path / "source.json"
    source.write_text(json.dumps(sample(), ensure_ascii=False), encoding="utf-8")
    destination = build_package(source, tmp_path / "out")

    assert (destination / "Audio_Master.csv").is_file()
    assert (destination / "book.html").is_file()
    report = json.loads((destination / "review_report.json").read_text(encoding="utf-8"))
    assert report["changed_by_review"] == 1
    assert report["lines"][0]["ocr_text"] == "Hallo  !"
    assert report["lines"][0]["reviewed_text"] == "Hallo!"
    manifest = json.loads((destination / "hanstory_manifest.json").read_text(encoding="utf-8"))
    assert manifest["target_language"] == "German"
    assert manifest["tracks"][0]["tts_fallback"] is True
    assert manifest["tracks"][0]["type"] == "phrase"


def test_import_rejects_unreviewed_text(tmp_path: Path):
    payload = sample()
    payload["chapters"][0]["tracks"][0]["manual_reviewed"] = False
    source = tmp_path / "source.json"
    source.write_text(json.dumps(payload), encoding="utf-8")
    with pytest.raises(ValueError, match="manual_reviewed"):
        load_and_validate(source)
