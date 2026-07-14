from __future__ import annotations

import json
from pathlib import Path

import unittest
from unittest.mock import patch

from src.book_manager import Book
import src.web_library as web


def make_book(tmp_path: Path) -> Book:
    folder = tmp_path / "book"; folder.mkdir(); (folder / "output").mkdir()
    (folder / "book.json").write_text('{}')
    (folder / "project_config.json").write_text(json.dumps({"source_language":"Spanish","target_language":"Korean","explanation_language":"Spanish"}))
    (folder / "Audio_Master.csv").write_text("id,type,speaker_or_blank,text,translation_or_blank\nL2,phrase,Aru,둘,dos\nL10,phrase,Saul,열,diez\n", encoding="utf-8")
    (folder / "Audios_Tecnico.txt").write_text("### Lección 29\nFrases: L2\n### Lección 30\nFrases: L10\n")
    (folder / "output/L2.mp3").write_bytes(b"audio2"); (folder / "output/L10.mp3").write_bytes(b"audio10")
    (folder / "output/Lecciones/Leccion_29").mkdir(parents=True); (folder / "output/Lecciones/Leccion_30").mkdir(parents=True)
    (folder / "output/Lecciones/Leccion_29/L29-01 - L2 - Aru - 둘.mp3").write_bytes(b"audio2")
    (folder / "output/Lecciones/Leccion_30/L30-01 - L10 - Saul - 열.mp3").write_bytes(b"audio10")
    return Book(1, "HS-TEST", "Libro prueba", "A1", "Descripción", folder)


class WebPublicationTests(unittest.TestCase):
    def setUp(self):
        import tempfile
        self.temp=tempfile.TemporaryDirectory(); self.root=Path(self.temp.name); self.book=make_book(self.root)
    def tearDown(self): self.temp.cleanup()
    def test_manifest_resolves_technical_order(self):
        with patch.object(web,"MASTER_AUDIO_DIR",self.root/"master"):
            manifest,files,warnings=web.build_manifest(self.book)
        self.assertEqual([t["id"] for t in manifest["tracks"]],["L2","L10"]); self.assertEqual([t["lesson"] for t in manifest["tracks"]],[29,30]); self.assertEqual([t["sequence"] for t in manifest["tracks"]],[1,1]); self.assertEqual(len(files),2); self.assertFalse(warnings); self.assertIn("L29-01",manifest["tracks"][0]["audio_path"])
        self.assertEqual(manifest["total_lessons"],2)
    def test_missing_files_are_reported(self):
        (self.book.folder/"output/L2.mp3").unlink()
        (self.book.folder/"output/Lecciones/Leccion_29/L29-01 - L2 - Aru - 둘.mp3").unlink()
        with patch.object(web,"MASTER_AUDIO_DIR",self.root/"master"): report=web.validate_book(self.book)
        self.assertTrue(any("L2" in warning for warning in report.warnings))
    def test_validate_does_not_create_published_folder(self):
        library=self.root/"web/library"
        with patch.object(web,"WEB_LIBRARY",library), patch.object(web,"MASTER_AUDIO_DIR",self.root/"master"):
            report=web.validate_book(self.book)
        self.assertTrue(report.ok); self.assertEqual(report.action,"VALIDAR"); self.assertFalse((library/"books/HS-TEST").exists()); self.assertIn("No se publicaron archivos",report.text())
    def test_publish_update_and_remove(self):
        library=self.root/"web/library"
        with patch.object(web,"WEB_LIBRARY",library), patch.object(web,"MASTER_AUDIO_DIR",self.root/"master"):
            first=web.publish_book(self.book); self.assertTrue(first.ok); self.assertTrue((library/"books/HS-TEST").is_dir()); self.assertGreater(len(first.files),0); self.assertTrue((library/"books/HS-TEST/hanstory_manifest.json").is_file()); index=json.loads((library/"library.json").read_text()); self.assertEqual(index["books"][0]["code"],"HS-TEST"); self.assertTrue((library/index["books"][0]["manifest"]).is_file()); self.assertEqual(json.loads((library/index["books"][0]["manifest"]).read_text())["project_code"],"HS-TEST"); self.assertEqual(web.publish_book(self.book,bump="patch").version,"1.0.1"); web.remove_book(self.book.code)
        self.assertEqual(json.loads((library/"library.json").read_text())["books"],[])
    def test_rebuild_library_from_manifests(self):
        library=self.root/"web/library"
        with patch.object(web,"WEB_LIBRARY",library), patch.object(web,"MASTER_AUDIO_DIR",self.root/"master"):
            self.assertTrue(web.publish_book(self.book).ok); (library/"library.json").write_text('{"schema_version":1,"books":[]}'); report=web.rebuild_library()
        self.assertTrue(report.ok); self.assertEqual(json.loads((library/"library.json").read_text())["books"][0]["code"],"HS-TEST")
    def test_duplicate_ids_fail(self):
        with (self.book.folder/"Audio_Master.csv").open("a") as f: f.write("L2,phrase,Aru,x,y\n")
        with patch.object(web,"MASTER_AUDIO_DIR",self.root/"master"): report=web.validate_book(self.book)
        self.assertIn("duplicado",report.errors[0].lower())
    def test_env_and_source_files_are_excluded(self):
        (self.book.folder/".env").write_text("OPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwxyz")
        with patch.object(web,"MASTER_AUDIO_DIR",self.root/"master"): report=web.validate_book(self.book)
        self.assertIn(".env",report.excluded); self.assertTrue(any("secreto" in e.lower() for e in report.errors))
