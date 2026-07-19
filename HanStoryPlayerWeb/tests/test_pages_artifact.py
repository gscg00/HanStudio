import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from build_pages_artifact import FORBIDDEN_NAMES, FORBIDDEN_PARTS, FORBIDDEN_SUFFIXES, build


def test_pages_artifact_contains_only_browser_application(tmp_path):
    output = tmp_path / "site"
    build(output)

    assert (output / "index.html").is_file()
    assert (output / "src/app.js").is_file()
    assert (output / "service-worker.js").is_file()
    assert (output / "library/courses/Japanese/course.json").is_file()
    assert not (output / "HanStoryPlayer").exists()
    assert not (output / "scripts").exists()
    assert not (output / "tests").exists()
    assert not (output / ".github").exists()

    for path in output.rglob("*"):
        if not path.is_file():
            continue
        relative = path.relative_to(output)
        assert not any(part in FORBIDDEN_PARTS for part in relative.parts)
        assert path.name not in FORBIDDEN_NAMES
        assert not path.name.startswith(".env")
        assert path.suffix.lower() not in FORBIDDEN_SUFFIXES


def test_pages_artifact_includes_every_published_book(tmp_path):
    output = tmp_path / "site"
    build(output)
    library = json.loads((output / "library/library.json").read_text(encoding="utf-8"))
    assert library["books"]
    for book in library["books"]:
        assert (output / "library" / book["manifest"]).is_file(), book["code"]


def test_pages_artifact_includes_every_manifest_audio_including_edited_wav(tmp_path):
    output = tmp_path / "site"
    build(output)

    found_wav = False
    for manifest in (output / "library/courses").glob("*/audio_manifest.json"):
        payload = json.loads(manifest.read_text(encoding="utf-8"))
        for relative in payload.get("items", {}).values():
            audio = manifest.parent / relative
            assert audio.is_file(), f"Falta {audio.relative_to(output)}"
            found_wav = found_wav or audio.suffix.lower() == ".wav"
    assert found_wav, "La prueba necesita al menos un recorte WAV publicado"
