import json
import unittest
from pathlib import Path


WEB_ROOT = Path(__file__).resolve().parents[1]
ENGLISH_UNITS = WEB_ROOT / "library" / "courses" / "English" / "units"

EXPECTED = {
    "Nice to meet you.": "Mucho gusto.",
    "Can you help me?": "¿Puedes ayudarme?",
    "I would like water.": "Quisiera agua.",
}

META_INSTRUCTIONS = {
    "Escucha, deja una pausa y repite.",
    "Practica la unión natural de las palabras.",
    "Repite sin separar cada palabra.",
}


def activities_in(path):
    data = json.loads(path.read_text(encoding="utf-8"))
    for lesson in data.get("lessons", []):
        yield from lesson.get("activities", [])


class GuidedMetaInstructionTranslationTests(unittest.TestCase):
    def test_repeat_source_separates_instruction_from_translation(self):
        source = (WEB_ROOT / "src" / "data" / "zero_courses.js").read_text(
            encoding="utf-8"
        )
        for target, translation in EXPECTED.items():
            self.assertIn(f"{target}|", source)
            self.assertIn(f"||{translation}", source)

    def test_meta_instructions_are_never_meanings_answers_or_options(self):
        for unit_path in ENGLISH_UNITS.glob("*.json"):
            for activity in activities_in(unit_path):
                values = [
                    activity.get("meaning"),
                    activity.get("answer"),
                    *(activity.get("options") or []),
                ]
                for value in values:
                    self.assertNotIn(
                        value,
                        META_INSTRUCTIONS,
                        f"{unit_path.name}: {activity.get('id')}",
                    )

    def test_repeat_cards_use_real_spanish_translations(self):
        for unit_name in ("survival.json", "time.json"):
            matched = {target: [] for target in EXPECTED}
            for activity in activities_in(ENGLISH_UNITS / unit_name):
                target = activity.get("target") or activity.get("audio")
                if target in EXPECTED:
                    matched[target].append(activity)

            for target, expected_translation in EXPECTED.items():
                self.assertTrue(matched[target], f"{unit_name}: falta {target}")
                for activity in matched[target]:
                    if activity.get("type") == "teach_concept":
                        self.assertEqual(activity.get("meaning"), expected_translation)
                    elif activity.get("type") == "select_translation":
                        self.assertEqual(activity.get("answer"), expected_translation)
                        self.assertIn(expected_translation, activity.get("options", []))
                    elif activity.get("type") == "listening_choice":
                        self.assertIn(
                            expected_translation,
                            activity.get("explanation", ""),
                        )


if __name__ == "__main__":
    unittest.main()
