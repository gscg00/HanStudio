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
    "French": ("sílabas", "una forma escrita y un sonido"),
    "German": ("ß", "EI"),
    "Italian": ("GLI", "consonantes dobles"),
    "Portuguese": ("nasal", "NH"),
    "Russian": ("Ь", "falsas amigas"),
    "Chinese": ("pinyin", "caracteres"),
    "Arabic": ("derecha a izquierda", "formas contextuales"),
    "Japanese": ("rōmaji", "hiragana"),
}
TEACHING_TYPES = {"lesson_intro", "teach_concept"}
ALPHABET_INVENTORIES = {
    "English": list("ABCDEFGHIJKLMNOPQRSTUVWXYZ"),
    "French": list("ABCDEFGHIJKLMNOPQRSTUVWXYZ"),
    "German": [*list("ABCDEFGHIJKLMNOPQRSTUVWXYZ"), "Ä", "Ö", "Ü", "ß"],
    "Italian": list("ABCDEFGHILMNOPQRSTUVZ"),
    "Portuguese": list("ABCDEFGHIJKLMNOPQRSTUVWXYZ"),
    "Russian": list("АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ"),
    "Arabic": list("ابتثجحخدذرزسشصضطظعغفقكلمنهوي"),
}


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
        assert len(unit["lessons"]) >= 8, language
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


def test_alphabet_languages_cover_their_complete_basic_inventory():
    for language, inventory in ALPHABET_INVENTORIES.items():
        unit = load(COURSES / language / "units/reading-foundations.json")
        taught = {
            activity.get("target")
            for lesson in unit["lessons"]
            for activity in lesson["activities"]
            if activity.get("id", "").startswith(f"{language.lower()}-reading-00-")
            and activity.get("type") == "teach_concept"
        }
        assert not (set(inventory) - taught), (
            language,
            sorted(set(inventory) - taught),
        )


def test_intro_slogan_is_presented_only_at_the_start_of_each_stage():
    app = (ROOT / "src/japanese_course_app.js").read_text(encoding="utf-8")
    assert "isStageOpeningLesson" in app
    assert "lessonActivitiesForPresentation" in app
    assert "activities.slice(1)" in app
    assert "level.unitIds[0]===unit?.id" in app


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


def test_french_foundations_use_one_grapheme_or_syllable_per_audio():
    unit_text = json.dumps(
        load(COURSES / "French/units/reading-foundations.json"),
        ensure_ascii=False,
    ).lower()
    for content_that_belongs_later in (
        "bonjour", "liaison", "les amis", "groupe rythmique", "petit", "grand",
    ):
        assert content_that_belongs_later not in unit_text
    unit = load(COURSES / "French/units/reading-foundations.json")
    for lesson in unit["lessons"]:
        if lesson.get("isReview") or lesson.get("isTest"):
            continue
        for activity in lesson["activities"]:
            if activity["type"] != "teach_concept":
                continue
            assert " · " not in activity["target"], activity["id"]
            assert activity["audio"], activity["id"]


def test_chinese_teaches_pinyin_and_tones_before_characters():
    unit = load(COURSES / "Chinese/units/reading-foundations.json")
    first_six = json.dumps(unit["lessons"][:6], ensure_ascii=False)
    last_two = json.dumps(unit["lessons"][6:8], ensure_ascii=False)
    assert "m + a → mā" in first_six
    assert "primer tono" in first_six.lower()
    assert "你" not in first_six
    assert "你" in last_two and "好" in last_two and "人" in last_two


def test_japanese_and_chinese_use_the_right_reading_foundation():
    japanese_course = load(COURSES / "Japanese/course.json")
    japanese_units = [item["id"] for item in japanese_course["units"]]
    assert japanese_units.index("hiragana-01") < japanese_units.index("first-words")
    assert japanese_units.index("katakana") < japanese_units.index("first-words")
    japanese_scripts = {
        "hiragana-01.json": "あいうえおかきくけこさしすせそたちつてとなにぬねの"
        "はひふへほまみむめもやゆよらりるれろわをん",
        "katakana.json": "アイウエオカキクケコサシスセソタチツテトナニヌネノ"
        "ハヒフヘホマミムメモヤユヨラリルレロワヲン",
    }
    for filename, inventory in japanese_scripts.items():
        unit_text = json.dumps(
            load(COURSES / f"Japanese/units/{filename}"),
            ensure_ascii=False,
        )
        assert not (set(inventory) - set(unit_text)), filename

    chinese_text = json.dumps(
        load(COURSES / "Chinese/units/reading-foundations.json"),
        ensure_ascii=False,
    ).lower()
    for item in ("b/p", "d/t", "g/k", "j, q, x", "zh, ch, sh", "cuatro tonos"):
        assert item.lower() in chinese_text, item


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


def test_student_facing_lessons_do_not_expose_internal_services():
    forbidden = (
        "elevenlabs",
        "eleven_v3",
        "language_code",
        "language override",
        "voice_id",
        "supabase",
        "openai",
    )
    for language_dir in COURSES.iterdir():
        units_dir = language_dir / "units"
        if not units_dir.is_dir():
            continue
        for unit_path in units_dir.glob("*.json"):
            visible_content = unit_path.read_text(encoding="utf-8").lower()
            for internal_term in forbidden:
                assert internal_term not in visible_content, (
                    language_dir.name,
                    unit_path.name,
                    internal_term,
                )
    legacy_app = (ROOT / "src/app.js").read_text(encoding="utf-8").lower()
    assert "audio elevenlabs preparado" not in legacy_app


def test_listening_questions_never_reveal_the_answer_as_the_target():
    auditory_prompt = "acabas de escuchar"
    found = 0
    for language_dir in COURSES.iterdir():
        units_dir = language_dir / "units"
        if not units_dir.is_dir():
            continue
        for unit_path in units_dir.glob("*.json"):
            unit = load(unit_path)
            for lesson in unit.get("lessons", []):
                for activity in lesson.get("activities", []):
                    if auditory_prompt not in activity.get("prompt", "").lower():
                        continue
                    found += 1
                    assert activity["type"] == "listening_choice", (
                        language_dir.name,
                        unit_path.name,
                        activity["id"],
                    )
    assert found >= 20
    app = (ROOT / "src/japanese_course_app.js").read_text(encoding="utf-8")
    assert "isAudioRecognitionActivity" in app
    assert "needsAudio=isAudioRecognitionActivity(activity)" in app
    assert "activityLabel=needsAudio?'Comprensión auditiva'" in app


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
