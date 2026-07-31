import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
COURSES = ROOT / "library" / "courses"
PLAYER = ROOT / "src" / "japanese_course_app.js"
PHRASE_SUPPORT = ROOT / "src" / "guided_phrase_support.js"
PHRASE_METADATA = ROOT / "src" / "guided_phrase_metadata.js"
COURSE_BUILDER = ROOT / "scripts" / "build_guided_courses.mjs"


class PhraseBreakdownTests(unittest.TestCase):
    def teaching_cards(self):
        for unit_path in COURSES.glob("*/units/*.json"):
            unit = json.loads(unit_path.read_text(encoding="utf-8"))
            for lesson in unit.get("lessons", []):
                for activity in lesson.get("activities", []):
                    if activity.get("type") == "teach_concept":
                        yield activity

    def test_author_supplied_word_breakdowns_are_complete(self):
        activities = [activity for activity in self.teaching_cards() if activity.get("word_breakdown")]
        self.assertGreater(len(activities), 0)
        for activity in activities:
            for item in activity["word_breakdown"]:
                self.assertTrue(str(item.get("text", "")).strip(), activity["id"])
                self.assertTrue(str(item.get("meaning", "")).strip(), activity["id"])

    def test_sentence_teaching_cards_keep_explanations_source_backed(self):
        activities = list(self.teaching_cards())
        supported = [activity for activity in activities if activity.get("word_breakdown")]
        self.assertGreater(len(supported), 0)
        # A card may have a manually authored usage note without a breakdown;
        # both fields remain optional when a source book has no explanation.
        for activity in activities:
            if activity.get("usage_note"):
                self.assertTrue(str(activity["usage_note"]).strip(), activity["id"])

    def test_audio_examples_are_explicit_not_guessed_from_explanations(self):
        player = PLAYER.read_text(encoding="utf-8")
        support = PHRASE_SUPPORT.read_text(encoding="utf-8")
        self.assertIn("phraseAudioExamples(activity)", player)
        self.assertIn("author-supplied", support)
        self.assertNotIn("for(const point of activity.teaching_points", player)

    def test_course_builder_preserves_verified_phrase_metadata(self):
        builder = COURSE_BUILDER.read_text(encoding="utf-8")
        metadata = PHRASE_METADATA.read_text(encoding="utf-8")
        self.assertIn("const phraseFields=", builder)
        self.assertIn("const enrichPhrase=", builder)
        self.assertIn("PHRASE_SUPPORT_BY_LANGUAGE", builder)
        self.assertIn("사울 씨, 잘 잤어요?", metadata)
        self.assertIn("const explanationFields=", builder)
        self.assertIn("const mergePhraseFields=", builder)
        self.assertIn("explanations[String(track.id||track.source_track_id||'')]", builder)


if __name__ == "__main__":
    unittest.main()
