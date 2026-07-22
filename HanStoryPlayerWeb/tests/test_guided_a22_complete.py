import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
COURSES = ROOT / "library/courses"
LANGUAGES = (
    "English",
    "Korean",
    "Russian",
    "Italian",
    "French",
    "German",
    "Japanese",
    "Chinese",
    "Portuguese",
    "Arabic",
)
A22_IDS = (
    "a2-2-opinions",
    "a2-2-experiences",
    "a2-2-workStudy",
    "a2-2-technology",
    "a2-2-culture",
    "a2-2-problemSolving",
)


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def test_every_language_has_six_a22_units_and_42_lessons():
    for language in LANGUAGES:
        course = load(COURSES / language / "course.json")
        level = next(level for level in course["levels"] if level["id"] == "a2-2")
        assert tuple(level["unitIds"]) == A22_IDS
        previous = "a2-1-conversation"
        for unit_id in A22_IDS:
            unit = load(COURSES / language / "units" / f"{unit_id}.json")
            assert unit["requirements"] == [previous]
            previous = unit_id
            assert len(unit["lessons"]) == 7
            assert sum(bool(x.get("isReview")) for x in unit["lessons"]) == 2
            assert sum(bool(x.get("isTest")) for x in unit["lessons"]) == 1
            taught = [
                activity["target"]
                for lesson in unit["lessons"]
                for activity in lesson["activities"]
                if activity["type"] == "teach_concept"
            ]
            assert len(taught) == len(set(taught)) == 16


def test_a22_teaches_before_testing_and_cjk_has_no_latin_transcription():
    latin = re.compile(r"[A-Za-z]")
    for language in LANGUAGES:
        for unit_id in A22_IDS:
            unit = load(COURSES / language / "units" / f"{unit_id}.json")
            for lesson in unit["lessons"]:
                if lesson.get("isReview") or lesson.get("isTest"):
                    continue
                taught = {
                    activity["audio"]: index
                    for index, activity in enumerate(lesson["activities"])
                    if activity["type"] == "teach_concept"
                }
                for index, activity in enumerate(lesson["activities"]):
                    if activity["type"] in {"select_translation", "listening_choice"}:
                        assert activity["answer"] in activity["options"]
                        assert activity["audio"] in taught and taught[activity["audio"]] < index
                if language in {"Japanese", "Korean", "Chinese"}:
                    assert all(
                        not latin.search(activity["target"])
                        for activity in lesson["activities"]
                        if activity["type"] == "teach_concept"
                    )


def test_a22_xp_catalog_is_complete_and_private():
    sql = (
        ROOT / "supabase/migrations/011_all_languages_a22_complete_catalog.sql"
    ).read_text(encoding="utf-8").lower()
    assert "alter table public.lesson_catalog enable row level security" in sql
    assert "revoke all on public.lesson_catalog from anon,authenticated" in sql
    count = 0
    for language in LANGUAGES:
        for unit_id in A22_IDS:
            unit = load(COURSES / language / "units" / f"{unit_id}.json")
            for lesson in unit["lessons"]:
                assert lesson["id"].lower() in sql
                count += 1
    assert count == 420


def test_service_worker_precaches_a22_manifests():
    worker = (ROOT / "service-worker.js").read_text(encoding="utf-8")
    assert "const SHELL='hanstory-shell-v" in worker
    for unit_id in A22_IDS:
        assert unit_id in worker
