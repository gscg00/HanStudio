from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from src.book_manager import Book
import src.web_explanations as explanations


class WebExplanationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); root = Path(self.temp.name); folder = root / "book"; folder.mkdir(); (folder / "output/Reports").mkdir(parents=True)
        (folder / "project_config.json").write_text(json.dumps({"creative_provider_name":"OpenAI","creative_model_name":"gpt-test","target_language":"Korean","explanation_language":"Spanish"}))
        self.book = Book(1, "HS-X", "Libro", "A1", "", folder)
        self.manifest = {"target_language":"Korean","explanation_language":"Spanish","tracks":[{"id":"3007","lesson":30,"sequence":1,"speaker":"Aru","text":"먼저 물을 넣어요.","translation":"Primero pon agua.","type":"phrase"}]}
        self.cache = root / "cache.json"
    def tearDown(self): self.temp.cleanup()
    def test_hash_ignores_audio_path_but_changes_with_text(self):
        a = explanations.source_hash(self.manifest["tracks"][0], "Korean", "Spanish"); self.manifest["tracks"][0]["audio_path"]="new.mp3"; self.assertEqual(a, explanations.source_hash(self.manifest["tracks"][0], "Korean", "Spanish")); self.manifest["tracks"][0]["text"] += "!"; self.assertNotEqual(a, explanations.source_hash(self.manifest["tracks"][0], "Korean", "Spanish"))
    def test_unchanged_explanation_is_reused(self):
        track=self.manifest["tracks"][0]; data={"items":{"3007":{"source_hash":explanations.source_hash(track,"Korean","Spanish"),"explanation_es":"ok"}}}; self.cache.write_text(json.dumps(data))
        with patch.object(explanations,"cache_path",return_value=self.cache): plan,_=explanations.plan_explanations(self.book,self.manifest)
        self.assertEqual(plan.reused,1); self.assertEqual(plan.selected,0)
    def test_quality_marks_generic_or_incomplete_output(self):
        errors=explanations._validate({"id":"3007","explanation_es":"bloque importante","natural_meaning_es":"","breakdown":[]},self.manifest["tracks"][0]); self.assertGreaterEqual(len(errors),2)
    def test_phrase_tracks_excludes_words_and_podcast(self):
        manifest={"tracks":self.manifest["tracks"]+[{"id":"P1","text":"물","type":"word"},{"id":"POD1","text":"x","type":"podcast"}]}; self.assertEqual([t["id"] for t in explanations.phrase_tracks(manifest)],["3007"])
    def test_provider_aliases_keep_korean_words_and_grammar(self):
        value=explanations._normalize_payload({"breakdown":[{"part":"괜찮","type":"raíz","meaning_es":"estar bien"}],"grammar_notes":[{"point":"-아요","detail":"forma cortés"}],"usage_notes_es":["Uso cotidiano"]})
        self.assertEqual(value["breakdown"][0]["text"],"괜찮"); self.assertEqual(value["grammar_notes"][0]["pattern"],"-아요"); self.assertIn("Uso cotidiano",value["usage_notes_es"])
        korean=explanations._normalize_payload({"breakdown":[{"korean":"저기","romanization":"jeogi","meaning_es":"allí"}]}); self.assertEqual(korean["breakdown"][0]["text"],"저기"); self.assertEqual(korean["breakdown"][0]["romanization"],"jeogi")
