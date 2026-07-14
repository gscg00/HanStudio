import json
from pathlib import Path

from src.web_library import bump_version, is_safe_relative, natural_key

WEB = Path(__file__).resolve().parents[1]

def test_empty_library_is_valid():
    data = json.loads((WEB / "library/library.json").read_text())
    assert data["schema_version"] == 1 and data["books"] == []

def test_natural_order():
    assert sorted(["L10", "L2", "L1"], key=natural_key) == ["L1", "L2", "L10"]

def test_versions():
    assert bump_version("1.2.9") == "1.2.10"
    assert bump_version("1.2.9", "minor") == "1.3.0"

def test_safe_web_paths():
    assert is_safe_relative("audio/L01.mp3")
    assert not is_safe_relative("../.env")
    assert not is_safe_relative("/private/file")

def test_manifest_and_service_worker_routes_are_relative():
    manifest = json.loads((WEB / "manifest.webmanifest").read_text())
    assert manifest["start_url"] == "./" and manifest["scope"] == "./"
    assert "./library/library.json" in (WEB / "service-worker.js").read_text()

def test_secret_exclusions_are_declared():
    ignored = (WEB / ".gitignore").read_text()
    assert ".env" in ignored and "**/sources/" in ignored
