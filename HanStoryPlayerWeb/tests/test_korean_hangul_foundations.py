import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
COURSE_ROOT = ROOT / "library/courses/Korean"
TEACHING_TYPES = {"lesson_intro", "teach_concept", "teach_word", "teach_pattern"}


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def test_hangul_foundations_is_the_first_world_and_first_foundations_unit():
    course = load(COURSE_ROOT / "course.json")
    foundations = next(level for level in course["levels"] if level["id"] == "foundations")
    summary = course["units"][0]

    assert course["version"] >= 11
    assert summary["id"] == "hangul-foundations"
    assert summary["world"] == 0
    assert summary["mapLabel"] == "MUNDO 0"
    assert summary["icon"] == "한"
    assert foundations["unitIds"][0] == "hangul-foundations"
    assert course["unlockRules"]["requireReadingMastery"] is True
    assert course["unlockRules"]["readingUnitId"] == "hangul-foundations"
    assert (COURSE_ROOT / summary["manifest"]).is_file()


def test_hangul_foundations_teaches_before_asking_the_learner_to_recognize():
    unit = load(COURSE_ROOT / "units/hangul-foundations.json")
    assert len(unit["lessons"]) == 10
    assert sum(bool(lesson.get("isReview")) for lesson in unit["lessons"]) == 1
    tests = [lesson for lesson in unit["lessons"] if lesson.get("isTest")]
    assert len(tests) == 1 and tests[0].get("isUnitFinal") is True
    assert tests[0].get("passingScore") == 100

    for lesson in unit["lessons"]:
        if lesson.get("isReview") or lesson.get("isTest"):
            continue
        first_gradable = next(
            index
            for index, activity in enumerate(lesson["activities"])
            if activity.get("gradable", True) and activity["type"] not in TEACHING_TYPES
        )
        assert first_gradable >= 2, lesson["id"]


def test_hangul_foundations_covers_blocks_vowel_layout_batchim_and_first_words():
    unit_text = json.dumps(
        load(COURSE_ROOT / "units/hangul-foundations.json"),
        ensure_ascii=False,
    )
    required = {
        "한글",
        "ㅎ + ㅏ + ㄴ = 한",
        "ㅇ + ㅏ = 아",
        "ㅇ + ㅜ = 우",
        "ㄱ + ㅏ = 가",
        "ㄱ + ㅜ = 구",
        "batchim",
        "나무",
        "사람",
        "우유",
        "한국어",
    }
    assert not (required - {item for item in required if item in unit_text})
    assert "romanización" not in unit_text.lower()


def test_hangul_foundations_answers_and_audio_are_valid():
    unit = load(COURSE_ROOT / "units/hangul-foundations.json")
    manifest = load(COURSE_ROOT / "audio_manifest.json")["items"]
    activity_ids = set()

    for lesson in unit["lessons"]:
        for activity in lesson["activities"]:
            assert activity["id"] not in activity_ids
            activity_ids.add(activity["id"])
            options = activity.get("options", [])
            if options:
                assert activity["answer"] in options, activity["id"]
            for field in ("audio", "slow_audio"):
                audio_key = activity.get(field)
                if not audio_key:
                    continue
                assert audio_key in manifest, f"{activity['id']} -> {audio_key}"
                assert (COURSE_ROOT / manifest[audio_key]).is_file(), activity["id"]


def test_hangul_foundations_xp_catalog_contains_every_lesson():
    unit = load(COURSE_ROOT / "units/hangul-foundations.json")
    sql = (
        ROOT / "supabase/migrations/014_korean_hangul_foundations_catalog.sql"
    ).read_text(encoding="utf-8").lower()
    assert "on conflict(language_id,course_id,lesson_id) do update" in sql
    for lesson in unit["lessons"]:
        assert lesson["id"].lower() in sql


def test_hangul_foundations_is_available_offline():
    worker = (ROOT / "service-worker.js").read_text(encoding="utf-8")
    assert "./library/courses/Korean/units/hangul-foundations.json" in worker
