import json
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
COURSE_ROOT = ROOT / "library/courses/Korean"


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def test_korean_course_separates_foundations_from_complete_a11():
    course = load(COURSE_ROOT / "course.json")
    levels = {level["id"]: level for level in course["levels"]}
    assert course["version"] >= 2
    assert "story-bridge" in levels["foundations"]["unitIds"]
    assert levels["a1-1"]["unitIds"] == [
        "a1-1-identity", "a1-1-people", "a1-1-home",
        "a1-1-routine", "a1-1-food", "a1-1-places",
    ]
    summary = next(unit for unit in course["units"] if unit["id"] == "a1-1-identity")
    assert summary["mapLabel"] == "UNIDAD A1.1 · 1"
    assert (COURSE_ROOT / summary["manifest"]).is_file()


def test_a11_pilot_teaches_before_testing_and_has_review_and_final_test():
    unit = load(COURSE_ROOT / "units/a1-1-introductions.json")
    normal = [lesson for lesson in unit["lessons"] if not lesson.get("isReview") and not lesson.get("isTest")]
    assert len(normal) == 4
    assert len([lesson for lesson in unit["lessons"] if lesson.get("isReview")]) == 2
    tests = [lesson for lesson in unit["lessons"] if lesson.get("isTest")]
    assert len(tests) == 1 and tests[0].get("isUnitFinal") is True
    for lesson in normal:
        first_gradable = next(i for i, activity in enumerate(lesson["activities"]) if activity.get("gradable", True) and activity["type"] not in {"lesson_intro", "dialogue_model", "teach_pattern", "teach_concept", "teach_word"})
        assert first_gradable >= 2, lesson["id"]
        assert len(lesson["activities"]) >= 8


def test_a11_answers_and_audio_are_publishable():
    unit = load(COURSE_ROOT / "units/a1-1-introductions.json")
    manifest = load(COURSE_ROOT / "audio_manifest.json")["items"]
    for lesson in unit["lessons"]:
        for activity in lesson["activities"]:
            options = activity.get("options", [])
            if options:
                if activity["type"] in {"build_word", "reorder_syllables", "reorder_sentence"}:
                    assert Counter("".join(options).replace(" ", "")) == Counter(activity["answer"].replace(" ", "")), activity["id"]
                else:
                    assert activity["answer"] in options, activity["id"]
            audio_key = activity.get("audio")
            if not audio_key:
                continue
            assert audio_key in manifest, f"Audio sin registrar: {activity['id']} -> {audio_key}"
            assert (COURSE_ROOT / manifest[audio_key]).is_file(), activity["id"]


def test_a11_xp_catalog_migration_is_safe_and_complete():
    sql = (ROOT / "supabase/migrations/005_korean_a11_catalog.sql").read_text(encoding="utf-8").lower()
    unit = load(COURSE_ROOT / "units/a1-1-introductions.json")
    assert "alter table public.lesson_catalog enable row level security" in sql
    assert "revoke all on public.lesson_catalog from anon,authenticated" in sql
    for lesson in unit["lessons"]:
        assert lesson["id"].lower() in sql
