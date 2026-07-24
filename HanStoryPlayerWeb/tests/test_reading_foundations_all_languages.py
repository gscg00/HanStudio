import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
COURSES = ROOT / "library/courses"
LANGUAGES = (
    "English", "French", "German", "Italian", "Portuguese",
    "Russian", "Chinese", "Arabic", "Japanese",
)
REQUIRED_CONTENT = {
    "English": ("TH", "la letra no es su nombre"),
    "French": ("liaison", "nasales"),
    "German": ("ß", "EI"),
    "Italian": ("GLI", "consonantes dobles"),
    "Portuguese": ("nasal", "NH"),
    "Russian": ("Ь", "falsas amigas"),
    "Chinese": ("pinyin", "caracteres"),
    "Arabic": ("derecha a izquierda", "formas contextuales"),
    "Japanese": ("rōmaji", "hiragana"),
}
TEACHING_TYPES = {"lesson_intro", "teach_concept"}


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def test_every_language_starts_with_its_reading_foundations_world():
    for language in LANGUAGES:
        course = load(COURSES / language / "course.json")
        foundations = next(level for level in course["levels"] if level["id"] == "foundations")
        summary = course["units"][0]
        assert course["version"] >= 11, language
        assert summary["id"] == "reading-foundations", language
        assert summary["world"] == 0, language
        assert summary["mapLabel"] == "MUNDO 0", language
        assert foundations["unitIds"][0] == "reading-foundations", language
        assert course["unlockRules"]["requireReadingMastery"] is True, language
        assert course["unlockRules"]["readingUnitId"] == "reading-foundations", language
        assert (COURSES / language / summary["manifest"]).is_file(), language


def test_reading_foundations_teach_before_testing_and_require_full_mastery():
    for language in LANGUAGES:
        unit = load(COURSES / language / "units/reading-foundations.json")
        assert len(unit["lessons"]) == 8, language
        tests = [lesson for lesson in unit["lessons"] if lesson.get("isTest")]
        assert len(tests) == 1, language
        assert tests[0].get("isUnitFinal") is True, language
        assert tests[0].get("passingScore") == 100, language
        for lesson in unit["lessons"]:
            if lesson.get("isReview") or lesson.get("isTest"):
                continue
            first_gradable = next(
                index
                for index, activity in enumerate(lesson["activities"])
                if activity.get("gradable", True)
                and activity["type"] not in TEACHING_TYPES
            )
            assert first_gradable >= 2, (language, lesson["id"])


def test_each_reading_system_has_language_specific_content():
    for language, snippets in REQUIRED_CONTENT.items():
        unit_text = json.dumps(
            load(COURSES / language / "units/reading-foundations.json"),
            ensure_ascii=False,
        ).lower()
        for snippet in snippets:
            assert snippet.lower() in unit_text, (language, snippet)
    japanese = json.dumps(
        load(COURSES / "Japanese/units/reading-foundations.json"),
        ensure_ascii=False,
    ).lower()
    assert "sin usar rōmaji" in japanese
    chinese = json.dumps(
        load(COURSES / "Chinese/units/reading-foundations.json"),
        ensure_ascii=False,
    ).lower()
    assert "ocultar" in chinese or "ocúltalo" in chinese


def test_answers_and_referenced_audio_are_valid():
    activity_ids = set()
    for language in LANGUAGES:
        unit = load(COURSES / language / "units/reading-foundations.json")
        manifest = load(COURSES / language / "audio_manifest.json")["items"]
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
                    assert audio_key in manifest, (language, activity["id"], audio_key)
                    assert (COURSES / language / manifest[audio_key]).is_file()


def test_xp_catalog_offline_cache_and_per_lesson_mastery_are_wired():
    sql = (
        ROOT / "supabase/migrations/015_reading_foundations_all_languages.sql"
    ).read_text(encoding="utf-8").lower()
    worker = (ROOT / "service-worker.js").read_text(encoding="utf-8")
    app = (ROOT / "src/japanese_course_app.js").read_text(encoding="utf-8")
    assert "on conflict(language_id,course_id,lesson_id) do update" in sql
    assert "lesson?.passingScore" in app
    assert "found.lesson.passingScore" in app
    assert "unitAccessible(id)" in app
    assert "readingGateComplete()" in app
    for language in LANGUAGES:
        unit = load(COURSES / language / "units/reading-foundations.json")
        for lesson in unit["lessons"]:
            assert lesson["id"].lower() in sql
        asset = f"./library/courses/{language}/units/reading-foundations.json"
        assert asset in worker
