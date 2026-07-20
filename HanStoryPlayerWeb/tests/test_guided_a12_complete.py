import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
COURSES = ROOT / "library/courses"
LANGUAGES = (
    "English", "Korean", "Russian", "Italian", "French",
    "German", "Japanese", "Chinese", "Portuguese", "Arabic",
)
A12_IDS = (
    "a1-2-shopping", "a1-2-time", "a1-2-transport",
    "a1-2-health", "a1-2-weather", "a1-2-social",
)


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def test_every_language_has_six_real_a12_units_and_42_lessons():
    for language in LANGUAGES:
        course = load(COURSES / language / "course.json")
        level = next(level for level in course["levels"] if level["id"] == "a1-2")
        assert tuple(level["unitIds"]) == A12_IDS
        summaries = {unit["id"]: unit for unit in course["units"]}
        previous = "a1-1-places"
        total_lessons = 0
        all_targets = []
        for unit_id in A12_IDS:
            unit = load(COURSES / language / summaries[unit_id]["manifest"])
            assert unit["requirements"] == [previous]
            previous = unit_id
            assert len(unit["lessons"]) == 7
            assert sum(bool(lesson.get("isReview")) for lesson in unit["lessons"]) == 2
            assert sum(bool(lesson.get("isTest")) for lesson in unit["lessons"]) == 1
            teaching = [
                activity["target"]
                for lesson in unit["lessons"]
                for activity in lesson["activities"]
                if activity["type"] == "teach_concept"
            ]
            assert len(teaching) == len(set(teaching)) == 16
            all_targets.extend(teaching)
            total_lessons += len(unit["lessons"])
        assert total_lessons == 42
        assert len(all_targets) == len(set(all_targets)) == 96


def test_cjk_targets_are_not_latin_transcriptions():
    latin = re.compile(r"[A-Za-z]")
    for language in ("Japanese", "Korean", "Chinese"):
        for unit_id in A12_IDS:
            unit = load(COURSES / language / "units" / f"{unit_id}.json")
            targets = [
                activity["target"]
                for lesson in unit["lessons"]
                for activity in lesson["activities"]
                if activity["type"] == "teach_concept"
            ]
            assert targets and all(not latin.search(target) for target in targets)


def test_each_new_concept_is_taught_before_assessment():
    for language in LANGUAGES:
        for unit_id in A12_IDS:
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
                    if activity["type"] not in {"select_translation", "listening_choice"}:
                        continue
                    assert activity["answer"] in activity["options"]
                    assert activity["audio"] in taught and taught[activity["audio"]] < index


def test_xp_catalog_contains_all_420_a12_lessons_and_remains_private():
    sql = (ROOT / "supabase/migrations/009_all_languages_a12_complete_catalog.sql").read_text(encoding="utf-8").lower()
    assert "alter table public.lesson_catalog enable row level security" in sql
    assert "revoke all on public.lesson_catalog from anon,authenticated" in sql
    count = 0
    for language in LANGUAGES:
        for unit_id in A12_IDS:
            unit = load(COURSES / language / "units" / f"{unit_id}.json")
            for lesson in unit["lessons"]:
                assert lesson["id"].lower() in sql
                count += 1
    assert count == 420


def test_service_worker_precaches_a12_manifests_for_all_courses():
    worker = (ROOT / "service-worker.js").read_text(encoding="utf-8")
    assert "hanstory-shell-v91" in worker
    for unit_id in A12_IDS:
        assert unit_id in worker
