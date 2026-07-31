import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
READING_BRIDGE = ROOT / "library" / "courses" / "Korean" / "units" / "reading-bridge.json"


class PhraseBreakdownTests(unittest.TestCase):
    def test_author_supplied_word_breakdowns_are_complete(self):
        unit = json.loads(READING_BRIDGE.read_text(encoding="utf-8"))
        activities = [
            activity
            for lesson in unit["lessons"][:3]
            for activity in lesson["activities"]
            if activity["type"] == "teach_concept"
        ]
        self.assertEqual(15, len(activities))
        for activity in activities:
            breakdown = activity.get("word_breakdown", [])
            self.assertTrue(breakdown, activity["id"])
            for item in breakdown:
                self.assertTrue(str(item.get("text", "")).strip(), activity["id"])
                self.assertTrue(str(item.get("meaning", "")).strip(), activity["id"])

    def test_sentence_teaching_cards_explain_usage(self):
        unit = json.loads(READING_BRIDGE.read_text(encoding="utf-8"))
        activities = [
            activity
            for lesson in unit["lessons"][:3]
            for activity in lesson["activities"]
            if activity["type"] == "teach_concept"
        ]
        for activity in activities:
            self.assertTrue(str(activity.get("usage_note", "")).strip(), activity["id"])


if __name__ == "__main__":
    unittest.main()
