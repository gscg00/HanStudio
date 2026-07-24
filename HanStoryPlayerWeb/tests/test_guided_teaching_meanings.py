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


def test_group_descriptions_are_not_rendered_as_individual_explanations():
    expected = {
        "네": "sí",
        "아니요": "no",
        "아마": "quizá",
    }
    found = {target: [] for target in expected}
    for language, lesson in active_lessons():
        if language != "Korean":
            continue
        for activity in lesson.get("activities", []):
            target = activity.get("target")
            if target not in expected or activity.get("type") not in TEACHING_TYPES:
                continue
            found[target].append(activity)

    for target, meaning in expected.items():
        activities = found[target]
        assert activities
        assert any(activity.get("group_hint") == "Sí, no y quizá." for activity in activities)
        for activity in activities:
            if activity.get("meaning") != meaning:
                continue
            assert activity.get("explanation", "") != "Sí, no y quizá."
            assert activity.get("sound_hint", "") != "Sí, no y quizá."


def test_no_category_description_is_repeated_as_multiple_item_explanations():
    problems = []
    for language, lesson in active_lessons():
        occurrences = {}
        for activity in lesson.get("activities", []):
            if activity.get("type") not in TEACHING_TYPES:
                continue
            meaning = str(activity.get("meaning", "")).strip()
            for key in ("explanation", "sound_hint"):
                hint = str(activity.get(key, "")).strip()
                if hint and hint != meaning:
                    occurrences.setdefault(hint, set()).add(meaning)
        for hint, meanings in occurrences.items():
            if len(meanings) > 1:
                problems.append((language, lesson.get("id"), hint, sorted(meanings)))
    assert not problems


def test_korean_combination_cards_are_rules_not_false_translations():
    expected = {
        "가": ("ga/ka suave", "ㄱ + ㅏ = 가"),
        "너": ("neo", "ㄴ + ㅓ = 너"),
        "도": ("do/to suave", "ㄷ + ㅗ = 도"),
    }
    found = {}
    for language, lesson in active_lessons():
        if language != "Korean":
            continue
        for activity in lesson.get("activities", []):
            target = activity.get("target")
            if target in expected and activity.get("teaching_kind") == "rule":
                found[target] = activity

    assert set(found) == set(expected)
    for target, (sound, formation) in expected.items():
        activity = found[target]
        assert activity.get("meaning", "") == ""
        assert activity.get("sound_hint") == f"Cómo suena: {sound}"
        assert activity.get("memory_hint") == f"Cómo se forma: {formation}"
        assert activity.get("explanation")


def test_rule_teaching_cards_never_claim_to_show_a_spanish_translation():
    problems = []
    for language, lesson in active_lessons():
        activities = lesson.get("activities", [])
        for index, activity in enumerate(activities):
            if activity.get("teaching_kind") != "rule":
                continue
            if linked_spanish_meaning(activities, index):
                problems.append((language, lesson.get("id"), activity.get("target")))
            if activity.get("meaning"):
                problems.append((language, lesson.get("id"), activity.get("target")))
    assert not problems


def test_korean_topic_particle_uses_the_pattern_and_grammar_distractors():
    matches = []
    for language, lesson in active_lessons():
        if language != "Korean":
            continue
        activities = lesson.get("activities", [])
        for index, activity in enumerate(activities):
            if activity.get("teaching_kind") != "rule" or activity.get("target") != "은/는":
                continue
            question = next(
                candidate for candidate in activities[index + 1 :]
                if candidate.get("type") == "select_translation"
                and candidate.get("target") == "은/는"
            )
            matches.append((activity, question))

    assert matches
    for activity, question in matches:
        assert activity.get("audio") == "저는 학생이에요."
        assert activity.get("meaning", "") == ""
        assert question.get("prompt") == "¿Qué debes recordar sobre «은/는»?"
        assert question.get("answer") == "Marca el tema de la conversación."
        assert all(option not in {"cómo", "ahí"} for option in question.get("options", []))


def test_korean_sentence_order_card_explains_and_breaks_down_the_example():
    matches = []
    for language, lesson in active_lessons():
        if language != "Korean":
            continue
        activities = lesson.get("activities", [])
        for index, activity in enumerate(activities):
            if (
                activity.get("teaching_kind") == "rule"
                and activity.get("target") == "Tema + objeto + verbo"
            ):
                matches.append((activity, activities[index + 1]))

    assert matches
    for activity, question in matches:
        assert activity.get("audio") == "저는 물을 마셔요."
        assert activity.get("sound_hint") == "Idea clave: El verbo cierra la oración"
        assert "Yo bebo agua" in activity.get("memory_hint", "")
        assert "partículas" in activity.get("explanation", "")
        points = activity.get("teaching_points", [])
        assert len(points) == 4
        assert any("저는" in point and "tema" in point for point in points)
        assert any("물을" in point and "objeto" in point for point in points)
        assert any("마셔요" in point and "bebo" in point for point in points)
        assert question.get("answer") == "El verbo va al final."


def test_course_player_renders_a_dedicated_spanish_meaning_block():
    source = (WEB_ROOT / "src" / "japanese_course_app.js").read_text(encoding="utf-8")
    styles = (WEB_ROOT / "assets" / "japanese_lesson.css").read_text(encoding="utf-8")
    assert "teachingMeaning(activity)" in source
    assert "EN ESPAÑOL" in source
    assert "jp-teach-meaning" in source
    assert ".jp-teach-meaning" in styles
    assert "DESGLOSE DEL EJEMPLO" in source
    assert "jp-rich-teaching" in source
    assert ".jp-teach-points" in styles
    assert ".jp-rich-teaching .jp-teach-symbol" in styles


def test_course_player_scales_long_targets_without_covering_the_meaning():
    source = (WEB_ROOT / "src" / "japanese_course_app.js").read_text(encoding="utf-8")
    styles = (WEB_ROOT / "assets" / "japanese_lesson.css").read_text(encoding="utf-8")
    assert "targetSizeClass" in source
    assert "jp-target-medium" in source
    assert "jp-target-long" in source
    assert "jp-target-very-long" in source
    assert ".jp-target.jp-target-long" in styles
    assert ".jp-target.jp-target-very-long" in styles
    assert ".jp-teaching .jp-teach-meaning{flex:0 0 auto}" in styles
