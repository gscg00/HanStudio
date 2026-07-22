import json
import re
from pathlib import Path


WEB_ROOT = Path(__file__).resolve().parents[1]
COURSES_ROOT = WEB_ROOT / "library" / "courses"
TEACHING_TYPES = {
    "teach_concept",
    "teach_word",
    "teach_pattern",
    "teach_kanji",
    "dialogue_model",
}


def active_lessons():
    for course_path in sorted(COURSES_ROOT.glob("*/course.json")):
        course = json.loads(course_path.read_text(encoding="utf-8"))
        for summary in course.get("units", []):
            manifest = summary.get("manifest")
            if not manifest:
                continue
            unit = json.loads((course_path.parent / manifest).read_text(encoding="utf-8"))
            for lesson in unit.get("lessons", []):
                yield course_path.parent.name, lesson


def linked_spanish_meaning(activities, index):
    teaching = activities[index]
    if teaching.get("meaning"):
        return teaching["meaning"]
    for candidate in activities[index + 1 :]:
        if candidate.get("type") != "select_translation":
            continue
        if not re.match(r"^¿?Qué significa\b", str(candidate.get("prompt", "")), re.I):
            continue
        same_target = teaching.get("target") and candidate.get("target") == teaching.get("target")
        same_audio = teaching.get("audio") and candidate.get("audio") == teaching.get("audio")
        if (same_target or same_audio) and candidate.get("answer"):
            return candidate["answer"]
    return ""


def test_semantic_teaching_cards_resolve_spanish_meanings_in_every_language():
    resolved = {}
    for language, lesson in active_lessons():
        for index, activity in enumerate(lesson.get("activities", [])):
            if activity.get("type") not in TEACHING_TYPES or not activity.get("target"):
                continue
            meaning = linked_spanish_meaning(lesson["activities"], index)
            if meaning:
                resolved[language] = resolved.get(language, 0) + 1

    expected = {"English", "Korean", "Russian", "Italian", "French", "German", "Japanese", "Chinese", "Portuguese", "Arabic"}
    assert set(resolved) == expected
    assert all(count >= 600 for count in resolved.values()), resolved


def test_reported_korean_cards_have_the_expected_spanish_meaning():
    expected = {
        "십구": "diecinueve",
        "이십": "veinte",
        "몇 시예요?": "¿Qué hora es?",
        "세 시예요.": "Son las tres",
    }
    found = {}
    for language, lesson in active_lessons():
        if language != "Korean":
            continue
        for index, activity in enumerate(lesson.get("activities", [])):
            target = activity.get("target")
            if target in expected and activity.get("type") in TEACHING_TYPES:
                found[target] = linked_spanish_meaning(lesson["activities"], index)
    assert found == expected


def test_course_player_renders_a_dedicated_spanish_meaning_block():
    source = (WEB_ROOT / "src" / "japanese_course_app.js").read_text(encoding="utf-8")
    styles = (WEB_ROOT / "assets" / "japanese_lesson.css").read_text(encoding="utf-8")
    assert "teachingMeaning(activity)" in source
    assert "EN ESPAÑOL" in source
    assert "jp-teach-meaning" in source
    assert ".jp-teach-meaning" in styles
