import json
import sys
from pathlib import Path, PurePosixPath


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


def test_pages_artifact_includes_every_manifest_audio_including_edited_audio(tmp_path):
    output = tmp_path / "site"
    build(output)

    found_audio = False
    for manifest in (output / "library/courses").glob("*/audio_manifest.json"):
        payload = json.loads(manifest.read_text(encoding="utf-8"))
        for relative in payload.get("items", {}).values():
            audio = manifest.parent / relative
            assert audio.is_file(), f"Falta {audio.relative_to(output)}"
            assert audio.suffix.lower() in {".mp3", ".m4a", ".ogg", ".wav"}
            found_audio = True
    assert found_audio, "La prueba necesita al menos un audio guiado publicado"


def test_guided_audio_is_self_contained_and_never_depends_on_book_visibility():
    manifests = list((ROOT / "library/courses").glob("*/audio_manifest.json"))
    assert manifests
    for manifest in manifests:
        payload = json.loads(manifest.read_text(encoding="utf-8"))
        for relative in payload.get("items", {}).values():
            parts = PurePosixPath(relative).parts
            assert parts and parts[0] == "audio", (
                f"El curso guiado {manifest.parent.name} depende de una ruta externa: {relative}"
            )
            assert "books" not in parts and ".." not in parts
            assert (manifest.parent / relative).is_file()


def test_pages_artifact_excludes_unreferenced_course_drafts(tmp_path):
    output = tmp_path / "site"
    build(output)

    prototype = output / "library/courses/English/units/a1-2-daily-life.json"
    assert not prototype.exists()
    for course_path in (output / "library/courses").glob("*/course.json"):
        payload = json.loads(course_path.read_text(encoding="utf-8"))
        for unit in payload.get("units", []):
            assert (course_path.parent / unit["manifest"]).is_file()
