import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
COURSES = ROOT / "library" / "courses"
LANGUAGES = {
    "Arabic",
    "Chinese",
    "English",
    "French",
    "German",
    "Italian",
    "Japanese",
    "Korean",
    "Portuguese",
    "Russian",
}
PRODUCTION_TYPES = {
    "typed_translation",
    "dictation",
    "build_with_blocks",
    "complete_without_options",
    "open_question",
    "speak_and_transcribe",
    "guided_dialogue",
    "stage_scenario",
}


class GuidedProductionDataTests(unittest.TestCase):
    def iter_courses(self):
        for language in sorted(LANGUAGES):
            directory = COURSES / language
            yield language, directory, json.loads((directory / "course.json").read_text(encoding="utf-8"))

    def test_every_course_has_productive_checkpoints(self):
        for language, directory, course in self.iter_courses():
            checkpoints = 0
            encountered = set()
            for summary in course["units"]:
                unit = json.loads((directory / summary["manifest"]).read_text(encoding="utf-8"))
                generated = [lesson for lesson in unit["lessons"] if lesson.get("generatedProduction")]
                if not generated:
                    continue
                checkpoints += 1
                self.assertEqual(1, len(generated), f"{language}/{unit['id']}")
                encountered.update(activity["type"] for activity in generated[0]["activities"])
            self.assertGreaterEqual(checkpoints, 40, language)
            self.assertTrue(
                {"typed_translation", "dictation", "build_with_blocks", "complete_without_options"}.issubset(encountered),
                language,
            )
            self.assertIn("guided_dialogue", encountered, language)
            self.assertIn("stage_scenario", encountered, language)

    def test_audio_references_are_published_and_answers_are_not_empty(self):
        for language, directory, course in self.iter_courses():
            manifest = json.loads((directory / "audio_manifest.json").read_text(encoding="utf-8"))["items"]
            for key, relative_path in manifest.items():
                self.assertTrue((directory / relative_path).is_file(), f"{language}/{key} -> {relative_path}")
            for summary in course["units"]:
                unit = json.loads((directory / summary["manifest"]).read_text(encoding="utf-8"))
                activity_ids = set()
                for lesson in unit["lessons"]:
                    for activity in lesson.get("activities", []):
                        self.assertNotIn(activity["id"], activity_ids, f"{language}/{unit['id']}")
                        activity_ids.add(activity["id"])
                        if activity["type"] not in PRODUCTION_TYPES:
                            continue
                        if activity["type"] not in {"guided_dialogue", "stage_scenario"}:
                            self.assertTrue(str(activity.get("answer", "")).strip(), activity["id"])
                        for field in ("audio", "slow_audio"):
                            key = activity.get(field)
                            if key:
                                self.assertIn(key, manifest, f"{activity['id']} -> {key}")
                        for turn in activity.get("turns", []):
                            if turn.get("audio"):
                                self.assertIn(turn["audio"], manifest, f"{activity['id']} dialogue audio")

    def test_generated_content_has_no_internal_labels_or_sentinel_values(self):
        forbidden = ("elevenlabs", "language override", "service_role", "client_secret", "__skipped__")
        for language, directory, course in self.iter_courses():
            for summary in course["units"]:
                unit = json.loads((directory / summary["manifest"]).read_text(encoding="utf-8"))
                for lesson in unit["lessons"]:
                    if not lesson.get("generatedProduction"):
                        continue
                    serialized = json.dumps(lesson, ensure_ascii=False).lower()
                    for marker in forbidden:
                        self.assertNotIn(marker, serialized, f"{language}/{lesson['id']}")

    def test_every_productive_checkpoint_ends_with_a_real_task(self):
        for language, directory, course in self.iter_courses():
            for summary in course["units"]:
                unit = json.loads((directory / summary["manifest"]).read_text(encoding="utf-8"))
                for lesson in unit["lessons"]:
                    if not lesson.get("generatedProduction"):
                        continue
                    activities = lesson["activities"]
                    self.assertGreaterEqual(len(activities), 4, lesson["id"])
                    self.assertNotEqual("lesson_intro", activities[-1]["type"], lesson["id"])
                    self.assertTrue(any(activity.get("audio") or activity.get("turns") for activity in activities), lesson["id"])

    def test_stage_scenarios_have_six_or_more_turns(self):
        for language, directory, course in self.iter_courses():
            scenarios = []
            for summary in course["units"]:
                unit = json.loads((directory / summary["manifest"]).read_text(encoding="utf-8"))
                for lesson in unit["lessons"]:
                    scenarios.extend(
                        activity
                        for activity in lesson.get("activities", [])
                        if activity["type"] == "stage_scenario"
                    )
            self.assertEqual(7, len(scenarios), language)
            for scenario in scenarios:
                self.assertGreaterEqual(len(scenario["turns"]), 6, scenario["id"])
                learner_turns = [turn for turn in scenario["turns"] if turn["role"] == "learner"]
                self.assertGreaterEqual(len(learner_turns), 3, scenario["id"])
                self.assertTrue(all(turn.get("answer") for turn in learner_turns), scenario["id"])

    def test_optional_speaking_has_written_fallback(self):
        for language, directory, course in self.iter_courses():
            for summary in course["units"]:
                unit = json.loads((directory / summary["manifest"]).read_text(encoding="utf-8"))
                for lesson in unit["lessons"]:
                    for activity in lesson.get("activities", []):
                        if activity["type"] == "speak_and_transcribe":
                            self.assertTrue(activity.get("optional"), activity["id"])
                            self.assertTrue(activity.get("answer"), activity["id"])
                            self.assertTrue(activity.get("accepted_answers"), activity["id"])

    def test_model_audio_always_matches_an_accepted_response(self):
        for language, directory, course in self.iter_courses():
            for summary in course["units"]:
                unit = json.loads((directory / summary["manifest"]).read_text(encoding="utf-8"))
                for lesson in unit["lessons"]:
                    if not lesson.get("generatedProduction"):
                        continue
                    for activity in lesson.get("activities", []):
                        accepted = {activity.get("answer"), *(activity.get("accepted_answers") or [])}
                        if activity.get("audio"):
                            self.assertIn(activity["audio"], accepted, activity["id"])
                        for turn in activity.get("turns", []):
                            if turn.get("role") != "learner" or not turn.get("audio"):
                                continue
                            turn_accepted = {turn.get("answer"), *(turn.get("accepted_answers") or [])}
                            self.assertIn(turn["audio"], turn_accepted, activity["id"])

    def test_guided_situations_do_not_fake_unrelated_conversations(self):
        for language, directory, course in self.iter_courses():
            for summary in course["units"]:
                unit = json.loads((directory / summary["manifest"]).read_text(encoding="utf-8"))
                for lesson in unit["lessons"]:
                    for activity in lesson.get("activities", []):
                        if activity["type"] not in {"guided_dialogue", "stage_scenario"}:
                            continue
                        turns = activity["turns"]
                        for index, turn in enumerate(turns):
                            if turn["role"] == "model":
                                self.assertEqual("GUÍA", turn["speaker"], activity["id"])
                                self.assertTrue(turn["text"].startswith("Situación "), activity["id"])
                                self.assertTrue(turn["translation"].startswith("Quieres expresar:"), activity["id"])
                                self.assertNotIn("audio", turn, activity["id"])
                            else:
                                self.assertEqual("TÚ", turn["speaker"], activity["id"])
                                self.assertTrue(turn.get("answer"), activity["id"])
                                self.assertTrue(turn.get("audio"), activity["id"])
                                self.assertEqual("model", turns[index - 1]["role"], activity["id"])

    def test_reading_foundations_practice_symbols_not_explanatory_sentences(self):
        reading_markers = ("reading-foundations", "hangul", "hiragana", "katakana", "rhythm")
        for language, directory, course in self.iter_courses():
            for summary in course["units"]:
                if not any(marker in summary["id"] for marker in reading_markers):
                    continue
                unit = json.loads((directory / summary["manifest"]).read_text(encoding="utf-8"))
                generated = next(
                    (lesson for lesson in unit["lessons"] if lesson.get("generatedProduction")),
                    None,
                )
                if not generated:
                    continue
                typed = next(activity for activity in generated["activities"] if activity["type"] == "typed_translation")
                blocks = next(activity for activity in generated["activities"] if activity["type"] == "build_with_blocks")
                self.assertTrue(
                    typed["prompt"].startswith(("Copia este símbolo o grupo:", "Escribe la sílaba que forma este bloque:")),
                    typed["id"],
                )
                if "=" in typed.get("target", ""):
                    final_symbol = typed["target"].rsplit("=", 1)[1].strip()
                    self.assertEqual(final_symbol, typed["answer"], typed["id"])
                    self.assertIn(final_symbol, typed.get("accepted_answers", []), typed["id"])
                else:
                    self.assertEqual(typed["target"], typed["answer"], typed["id"])
                self.assertTrue(blocks["prompt"].startswith("Reconstruye el símbolo"), blocks["id"])

    def test_pronunciation_focused_units_do_not_turn_explanations_into_dialogue(self):
        path = COURSES / "French" / "units" / "essentials.json"
        unit = json.loads(path.read_text(encoding="utf-8"))
        generated = next(lesson for lesson in unit["lessons"] if lesson.get("generatedProduction"))
        types = {activity["type"] for activity in generated["activities"]}
        self.assertNotIn("guided_dialogue", types)
        self.assertNotIn("speak_and_transcribe", types)
        typed = next(activity for activity in generated["activities"] if activity["type"] == "typed_translation")
        self.assertTrue(typed["prompt"].startswith("Copia este símbolo o grupo:"), typed["id"])

    def test_final_tests_remain_the_last_unit_step(self):
        for language, directory, course in self.iter_courses():
            for summary in course["units"]:
                unit = json.loads((directory / summary["manifest"]).read_text(encoding="utf-8"))
                if any(lesson.get("isTest") for lesson in unit["lessons"]):
                    self.assertTrue(unit["lessons"][-1].get("isTest"), f"{language}/{unit['id']}")

    def test_service_worker_publishes_new_runtime_without_erasing_progress(self):
        source = (ROOT / "service-worker.js").read_text(encoding="utf-8")
        self.assertIn("hanstory-shell-v118", source)
        self.assertIn("./src/guided_course_answers.js", source)
        self.assertIn("./src/guided_speech_recognition.js", source)
        self.assertIn("./src/guided_virtual_keyboard.js", source)
        self.assertNotIn("localStorage.clear", source)
        self.assertNotIn("indexedDB.deleteDatabase", source)

    def test_building_blocks_never_play_partial_audio(self):
        source = (ROOT / "src" / "japanese_course_app.js").read_text(encoding="utf-8")
        choose_answer = source.split("chooseAnswer(value)", 1)[1].split("chooseBlock(value,index)", 1)[0]
        choose_block = source.split("chooseBlock(value,index)", 1)[1].split("handleInput(event)", 1)[0]
        self.assertNotIn("playKeyAudio", choose_answer)
        self.assertNotIn("playKeyAudio", choose_block)

    def test_typed_exercises_offer_the_course_keyboard(self):
        source = (ROOT / "src" / "japanese_course_app.js").read_text(encoding="utf-8")
        self.assertIn("Usar teclado del curso", source)
        self.assertIn("toggle-keyboard", source)
        self.assertIn("applyVirtualKey", source)


if __name__ == "__main__":
    unittest.main()
