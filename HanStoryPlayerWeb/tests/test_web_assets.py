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


def test_home_has_a_real_continue_studying_card():
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    app = (ROOT / "src/app.js").read_text(encoding="utf-8")
    assert 'id="continue-study"' in html
    assert "renderContinueStudying" in app
    assert "data-continue-story" in app
    assert "data-continue-course" in app


def test_chinese_starts_with_pinyin_but_later_makes_it_optional():
    import json
    survival = json.loads((ROOT / "library/courses/Chinese/units/survival.json").read_text(encoding="utf-8"))
    activities = [activity for lesson in survival["lessons"] if not lesson.get("isTest") for activity in lesson["activities"]]
    pinyin = [activity for activity in activities if activity.get("pinyin")]
    assert pinyin
    assert any(activity.get("pinyin_mode") == "visible" for activity in pinyin)
    assert any(activity.get("pinyin_mode") == "hidden" for activity in pinyin)
    assert all(any("\u4e00" <= char <= "\u9fff" for char in activity["target"]) for activity in pinyin)
