from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase
from unittest.mock import patch

from src import japanese_course_audio as module


class JapaneseCourseAudioTests(TestCase):
    def test_catalog_contains_kana_and_course_phrases(self):
        texts = module.japanese_course_texts()
        self.assertGreaterEqual(len(texts), 170)
        for required in ("あ", "ア", "きって", "ありがとうございます", "トイレは どこですか"):
            self.assertIn(required, texts)

    def test_dry_run_never_calls_elevenlabs(self):
        with TemporaryDirectory() as folder, patch.object(module, "COURSE_ROOT", Path(folder)), patch.object(module, "MANIFEST", Path(folder) / "audio_manifest.json"), patch.object(module.ElevenLabsClient, "generate_mp3") as generate:
            report = module.generate_japanese_course_audio(dry_run=True)
        self.assertGreater(report.total, 0)
        self.assertEqual(report.generated, 0)
        self.assertEqual(report.model_id, "eleven_v3")
        generate.assert_not_called()

    def test_manifest_from_another_model_is_not_reused(self):
        with TemporaryDirectory() as folder:
            root = Path(folder); audio = root / "audio"; audio.mkdir()
            (audio / "old.mp3").write_bytes(b"old")
            manifest = root / "audio_manifest.json"
            manifest.write_text('{"model_id":"eleven_multilingual_v2","items":{"あ":"audio/old.mp3"}}')
            with patch.object(module, "COURSE_ROOT", root), patch.object(module, "MANIFEST", manifest):
                report = module.generate_japanese_course_audio(dry_run=True)
        self.assertEqual(report.cached, 0)
