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
    assert course["unlockRules"]["readingUnitIds"] == [
        "hangul-foundations",
        "reading",
    ]
    assert (COURSE_ROOT / summary["manifest"]).is_file()


def test_hangul_foundations_teaches_before_asking_the_learner_to_recognize():
    unit = load(COURSE_ROOT / "units/hangul-foundations.json")
    assert len(unit["lessons"]) == 11
    assert sum(bool(lesson.get("generatedProduction")) for lesson in unit["lessons"]) == 1
    assert sum(bool(lesson.get("isReview")) for lesson in unit["lessons"]) == 1
    tests = [lesson for lesson in unit["lessons"] if lesson.get("isTest")]
    assert len(tests) == 1 and tests[0].get("isUnitFinal") is True
    assert tests[0].get("passingScore") == 100

    for lesson in unit["lessons"]:
        if lesson.get("isReview") or lesson.get("isTest"):
            continue
        if lesson.get("generatedProduction"):
            assert any(
                activity["type"] in {
                    "typed_translation", "dictation", "build_with_blocks",
                    "complete_without_options", "transform_sentence",
                    "open_question", "speak_and_transcribe",
                    "guided_dialogue", "stage_scenario",
                }
                for activity in lesson["activities"]
            )
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
        "inicial + vocal + final = bloque",
        "ㅇ + ㅏ = 아",
        "ㅇ + ㅜ = 우",
        "ㄱ + ㅏ = 가",
        "ㅇ + ㅜ = 우",
        "batchim",
        "나무",
        "사람",
        "우유",
        "한국어",
    }
    assert not (required - {item for item in required if item in unit_text})
    assert "romanización" not in unit_text.lower()


def test_system_introduction_does_not_make_a_learner_read_untaught_letters():
    unit = load(COURSE_ROOT / "units/hangul-foundations.json")
    system = next(lesson for lesson in unit["lessons"] if lesson["id"] == "korean-hangul-00-system")
    by_id = {activity["id"]: activity for activity in system["activities"]}
    block = by_id["korean-hangul-00-system-block"]

    assert block["target"] == "inicial + vocal + final = bloque"
    assert not block["audio"]
    assert "no intentes pronunciar" in block["memory_hint"].lower()
    for activity_id in ("korean-hangul-00-system-q1", "korean-hangul-00-system-q2"):
        activity = by_id[activity_id]
        assert not activity["audio"]
        assert not any(letter in activity["target"] for letter in "ㅎㅏㄴ한")


def test_vowel_layout_questions_only_reuse_the_known_silent_support():
    unit = load(COURSE_ROOT / "units/hangul-foundations.json")
    activities = {
        activity["id"]: activity
        for lesson in unit["lessons"]
        for activity in lesson["activities"]
    }

    assert activities["korean-hangul-00-vowels-layout"]["target"] == "ㅇ + ㅏ = 아"
    assert activities["korean-hangul-00-vowels-horizontal-layout"]["target"] == "ㅇ + ㅜ = 우"


def test_korean_requires_all_24_basic_hangul_letters_before_vocabulary():
    reading_unit = load(COURSE_ROOT / "units/reading.json")
    reading = json.dumps(reading_unit, ensure_ascii=False)
    basic_consonants = set("ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ")
    basic_vowels = set("ㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ")
    assert not (basic_consonants - set(reading))
    assert not (basic_vowels - set(reading))

    app = (ROOT / "src/japanese_course_app.js").read_text(encoding="utf-8")
    assert "readingGateUnits()" in app
    assert "gates.every" in app

    sql = (
        ROOT
        / "supabase/migrations/016_korean_complete_basic_hangul_catalog.sql"
    ).read_text(encoding="utf-8").lower()
    for lesson in reading_unit["lessons"]:
        assert lesson["id"].lower() in sql
    assert "korean-reading-test-07" in sql
    assert "active=false" in sql


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
    sql = "\n".join(
        path.read_text(encoding="utf-8").lower()
        for path in (ROOT / "supabase/migrations").glob("*.sql")
    )
    assert "on conflict(language_id,course_id,lesson_id) do update" in sql
    for lesson in unit["lessons"]:
        assert lesson["id"].lower() in sql


def test_hangul_foundations_is_available_offline():
    worker = (ROOT / "service-worker.js").read_text(encoding="utf-8")
    assert "./library/courses/Korean/units/hangul-foundations.json" in worker
