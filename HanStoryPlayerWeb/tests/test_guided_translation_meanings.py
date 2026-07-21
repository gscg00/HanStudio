import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
COURSES = ROOT / "library/courses"
LANGUAGES = (
    "English", "Korean", "Russian", "Italian", "French",
    "German", "Japanese", "Chinese", "Portuguese", "Arabic",
)


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def activities(language: str, unit_id: str):
    unit = load(COURSES / language / "units" / f"{unit_id}.json")
    return [
        activity
        for lesson in unit["lessons"]
        for activity in lesson["activities"]
    ]


def find_target(language: str, unit_id: str, target: str):
    return next(
        activity
        for activity in activities(language, unit_id)
        if activity["type"] == "select_translation"
        and activity.get("target") == target
    )


def test_survival_meaning_questions_use_spanish_answers():
    expected = {
        ("German", "Hallo!"): "Hola.",
        ("German", "Ich verstehe nicht."): "No entiendo.",
        ("Korean", "안녕하세요"): "Hola, de forma cortés.",
        ("Korean", "잘 모르겠어요"): "No lo entiendo bien.",
        ("Chinese", "你好！"): "Hola.",
    }
    for (language, target), answer in expected.items():
        activity = find_target(language, "survival", target)
        assert activity["prompt"].startswith("¿Qué significa")
        assert activity["answer"] == answer
        assert answer in activity["options"]


def test_pronunciation_rules_are_not_mislabeled_as_word_meanings():
    activity = find_target("German", "essentials", "Bär")
    assert activity["prompt"] == "¿Qué debes recordar sobre «Bär»?"
    assert activity["answer"] == "Ä se acerca a una e abierta."


def test_every_guided_translation_answer_is_selectable():
    for language in LANGUAGES:
        course = load(COURSES / language / "course.json")
        for summary in course["units"]:
            unit = load(COURSES / language / summary["manifest"])
            for lesson in unit["lessons"]:
                for activity in lesson["activities"]:
                    if activity["type"] != "select_translation":
                        continue
                    assert activity["answer"] in activity["options"], (
                        language,
                        unit["id"],
                        lesson["id"],
                        activity["id"],
                    )
