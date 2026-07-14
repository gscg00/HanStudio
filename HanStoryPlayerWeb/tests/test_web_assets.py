import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from check_web_assets import check, referenced_assets


def test_index_references_existing_assets():
    assert check() == []


def test_required_runtime_assets_are_present():
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    assets = referenced_assets(html)
    assert "./assets/styles.css" in assets
    assert "./src/app.js" in assets
    assert "./manifest.webmanifest" in assets
    assert (ROOT / "service-worker.js").is_file()
