from __future__ import annotations

import tempfile
import unittest
import sqlite3
import sys
import types
import json
from pathlib import Path
from unittest.mock import Mock, patch

from src import anki_exporter, audio_organizer, book_manager, config as config_module, database, validators
from src.anki_exporter import AnkiExportOptions, build_anki_plan, create_anki_export
from src.config import AppSettings
from src.database import connect, register_audio_asset, replace_lesson_links
from src.csv_loader import AudioRow, load_audio_csv
from src.elevenlabs_client import ElevenLabsClient, ElevenLabsError
from src.project_config import (
    ProjectConfig, character_voice_id, load_project_config, save_project_config,
)
from src.podcast_generator import (
    PodcastOptions,
    PodcastRow,
    assemble_podcast_audio,
    build_podcast_rows,
    generate_podcast_audio,
    generate_podcast_explanation_with_openai,
    generate_podcast_package,
    load_podcast_csv,
    podcast_paths,
    save_podcast_draft,
    validate_podcast_draft_quality,
)
from src.ui.anki_panel import AnkiPanel
from src.creative_engine import (
    CreativeDraft, CreativeEngine, CreativeRequest, available_engines, get_engine,
    process_segment, register_engine,
)
from src.config import get_openai_api_key, save_openai_api_key
from src.source_manager import import_source, list_sources, load_segments, segment_source
from src.source_lesson_generator import (
    LessonGenerationOptions, apply_generated_package, generate_lessons_from_source,
)
from src.technical_parser import parse_technical_file


CSV_HEADER = "id,type,speaker_or_blank,text,translation_or_blank\n"
TECHNICAL = "### Lección 01\nFrases: 1001\n"


class MultiBookArchitectureTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.books_dir = self.root / "books"
        self.master_dir = self.root / "master_audio"
        self.exports_dir = self.root / "exports"
        self.db_path = self.root / "hanstory.db"
        self.books_dir.mkdir()
        self.master_dir.mkdir()
        self.exports_dir.mkdir()
        self.patches = [
            patch.object(database, "DATABASE_FILE", self.db_path),
            patch.object(book_manager, "BOOKS_DIR", self.books_dir),
            patch.object(validators, "MASTER_AUDIO_DIR", self.master_dir),
            patch.object(audio_organizer, "MASTER_AUDIO_DIR", self.master_dir),
            patch.object(anki_exporter, "MASTER_AUDIO_DIR", self.master_dir),
            patch.object(anki_exporter, "EXPORTS_DIR", self.exports_dir),
        ]
        for item in self.patches:
            item.start()
        database.initialize_database()

    def tearDown(self) -> None:
        for item in reversed(self.patches):
            item.stop()
        self.temporary.cleanup()

    def make_book(self, code: str, text: str):
        book = book_manager.create_book(f"Libro {code}", code)
        book.csv_path.write_text(
            CSV_HEADER + f"1001,phrase,Aru,{text},Hola\n", encoding="utf-8"
        )
        book.technical_path.write_text(TECHNICAL, encoding="utf-8")
        return book

    def save_approved_podcast_draft(self, book, lesson: int, phrase: str, speaker: str, translation: str) -> None:
        save_podcast_draft(
            book,
            lesson,
            {
                "lesson_number": lesson,
                "lesson_title": f"Lección {lesson:02d}",
                "scene_summary_es": "En esta escena escuchas una frase clave y su uso natural.",
                "hanstory_status": "Listo para podcast",
                "hanstory_validation_errors": [],
                "key_phrases": [
                    {
                        "speaker": speaker,
                        "phrase": phrase,
                        "natural_translation_es": translation,
                        "literal_note_es": "La versión literal ayuda a entender el orden coreano.",
                        "tone_es": "Suena natural y educado.",
                        "hanstory_status": "Aprobada",
                        "breakdown": [
                            {
                                "korean": phrase.split()[0] if phrase.split() else phrase,
                                "meaning_es": translation,
                                "function_es": "bloque principal de la frase",
                            }
                        ],
                        "grammar_notes": [
                            {
                                "pattern": "uso en contexto",
                                "explanation_es": "Explicación concreta revisada para esta frase.",
                            }
                        ],
                        "listening_steps": [
                            {
                                "type": "teacher_explanation",
                                "text": f"La frase importante es {phrase}. Significa “{translation}”.",
                            },
                            {
                                "type": "phrase_repeat",
                                "speaker": speaker,
                                "text": phrase,
                                "style": "slow",
                                "pause_after_ms": 2000,
                            },
                            {
                                "type": "phrase_repeat",
                                "speaker": speaker,
                                "text": phrase,
                                "style": "slow",
                                "pause_after_ms": 2000,
                            },
                            {
                                "type": "phrase_repeat",
                                "speaker": speaker,
                                "text": phrase,
                                "style": "natural",
                                "pause_after_ms": 1000,
                            },
                        ],
                    }
                ],
                "review_section": {
                    "teacher_text_es": "Repaso final: escucha y repite la frase clave.",
                    "phrases": [phrase],
                },
            },
        )

    def test_reuses_matching_id_between_books_and_rejects_collision(self) -> None:
        profiles = {
            "Aru": {"voice_id": "voice-aru", "description": ""},
            "default": {"voice_id": "voice-default", "description": ""},
        }
        first = self.make_book("L01", "안녕하세요?")
        self.assertEqual(validators.validate_book(first, profiles).new, ["1001"])

        (self.master_dir / "1001.mp3").write_bytes(b"test mp3")
        register_audio_asset(
            audio_id="1001", audio_type="phrase", speaker="Aru", text="안녕하세요?",
            translation="Hola", voice_id="voice-aru", model_id="test",
            file_name="1001.mp3",
        )

        second = self.make_book("L02", "안녕하세요?")
        second_result = validators.validate_book(second, profiles)
        self.assertTrue(second_result.is_valid)
        self.assertEqual(second_result.existing, ["1001"])
        copied, missing = audio_organizer.organize_book_audio(second)
        self.assertEqual((copied, missing), (2, []))

        collision = self.make_book("L03", "감사합니다.")
        collision_result = validators.validate_book(collision, profiles)
        self.assertFalse(collision_result.is_valid)
        self.assertTrue(any("COLISIÓN 1001" in error for error in collision_result.errors))

    def test_delete_book_removes_folder_and_links_but_keeps_master_audio(self) -> None:
        book = self.make_book("DEL", "안녕하세요?")
        (book.output_dir / "Reports" / "resumen_libro.txt").write_text("reporte", encoding="utf-8")
        (self.master_dir / "1001.mp3").write_bytes(b"master mp3")
        register_audio_asset(
            audio_id="1001",
            audio_type="phrase",
            speaker="Aru",
            text="안녕하세요?",
            translation="Hola",
            voice_id="voice-aru",
            model_id="test",
            file_name="1001.mp3",
        )
        database.link_audio_to_book(book.book_id, "1001")
        replace_lesson_links(book.book_id, {1: ["1001"]})

        summary = book_manager.summarize_book_folder(book)
        self.assertTrue(summary.exists)
        self.assertGreater(summary.file_count, 0)

        deleted = book_manager.delete_book(book)

        self.assertEqual(deleted.file_count, summary.file_count)
        self.assertFalse(book.folder.exists())
        self.assertEqual(book_manager.list_books(), [])
        self.assertTrue((self.master_dir / "1001.mp3").exists())
        with connect() as connection:
            self.assertIsNotNone(
                connection.execute("SELECT * FROM audio_assets WHERE audio_id = '1001'").fetchone()
            )
            self.assertIsNone(
                connection.execute("SELECT * FROM book_audio WHERE book_id = ?", (book.book_id,)).fetchone()
            )
            self.assertIsNone(
                connection.execute("SELECT * FROM lesson_audio WHERE book_id = ?", (book.book_id,)).fetchone()
            )

    def test_lesson_copies_sort_by_conversation_order_not_master_id(self) -> None:
        book = book_manager.create_book("Orden narrativo", "L11")
        rows = [
            ("1088", "phrase", "Aru", "조심하세요"),
            ("1089", "phrase", "Saul", "아, 네"),
            ("1010", "phrase", "Saul", "네"),
            ("1090", "phrase", "Niño", "도와주세요"),
        ]
        book.csv_path.write_text(
            CSV_HEADER
            + "".join(
                f'{audio_id},{audio_type},{speaker},"{text}",\n'
                for audio_id, audio_type, speaker, text in rows
            ),
            encoding="utf-8",
        )
        book.technical_path.write_text(
            "### Lección 11\nFrases: 1088, 1089, 1010, 1090\n", encoding="utf-8"
        )
        for audio_id, audio_type, speaker, text in rows:
            (self.master_dir / f"{audio_id}.mp3").write_bytes(b"test mp3")
            register_audio_asset(
                audio_id=audio_id, audio_type=audio_type, speaker=speaker, text=text,
                translation="", voice_id="test-voice", model_id="test",
                file_name=f"{audio_id}.mp3",
            )

        old_copy = book.output_dir / "Lecciones" / "Leccion_11" / "1010 - Saul - 네.mp3"
        old_copy.parent.mkdir(parents=True, exist_ok=True)
        old_copy.write_bytes(b"old copy")

        copied, missing = audio_organizer.organize_book_audio(
            book, rename_by_sequence=True
        )

        self.assertEqual((copied, missing), (8, []))
        lesson_files = sorted(
            path.name for path in (book.output_dir / "Lecciones" / "Leccion_11").glob("*.mp3")
        )
        self.assertEqual(
            lesson_files,
            [
                "L11-01 - 1088 - Aru - 조심하세요.mp3",
                "L11-02 - 1089 - Saul - 아, 네.mp3",
                "L11-03 - 1010 - Saul - 네.mp3",
                "L11-04 - 1090 - Niño - 도와주세요.mp3",
            ],
        )
        self.assertEqual(
            sorted(path.name for path in self.master_dir.glob("*.mp3")),
            ["1010.mp3", "1088.mp3", "1089.mp3", "1090.mp3"],
        )
        self.assertFalse(old_copy.exists())

        word_name = audio_organizer.lesson_filename(
            AudioRow("P001", "word", "", "깨다", "despertar"), 11, 5
        )
        self.assertEqual(word_name, "L11-05 - P001 - WORD - 깨다.mp3")

    def test_repeated_audio_keeps_each_lesson_position(self) -> None:
        book = self.make_book("L12", "안녕하세요?")
        book.technical_path.write_text(
            "### Lección 12\nFrases: 1001, 1001\n", encoding="utf-8"
        )
        lessons = parse_technical_file(book.technical_path)
        self.assertEqual(lessons[12], ["1001", "1001"])
        replace_lesson_links(book.book_id, lessons)
        with connect() as connection:
            positions = list(
                connection.execute(
                    "SELECT position FROM lesson_audio WHERE book_id = ? ORDER BY position",
                    (book.book_id,),
                )
            )
        self.assertEqual([row["position"] for row in positions], [1, 2])

    def test_existing_database_migrates_lesson_positions_without_losing_data(self) -> None:
        old_db = self.root / "old_hanstory.db"
        connection = sqlite3.connect(old_db)
        connection.executescript(
            "CREATE TABLE books (id INTEGER PRIMARY KEY);"
            "CREATE TABLE lesson_audio ("
            "book_id INTEGER NOT NULL REFERENCES books(id), "
            "lesson_number INTEGER NOT NULL, audio_id TEXT NOT NULL, position INTEGER NOT NULL, "
            "PRIMARY KEY (book_id, lesson_number, audio_id));"
            "INSERT INTO books(id) VALUES (1);"
            "INSERT INTO lesson_audio VALUES (1, 11, '1010', 4);"
        )
        connection.commit()
        connection.close()

        database.initialize_database(old_db)

        connection = sqlite3.connect(old_db)
        primary_key = [
            row[1]
            for row in sorted(connection.execute("PRAGMA table_info(lesson_audio)"), key=lambda row: row[5])
            if row[5]
        ]
        saved = connection.execute(
            "SELECT lesson_number, audio_id, position FROM lesson_audio"
        ).fetchone()
        connection.close()
        self.assertEqual(primary_key, ["book_id", "lesson_number", "position"])
        self.assertEqual(saved, (11, "1010", 4))

    def test_old_and_new_csv_choose_the_correct_tts_text(self) -> None:
        old_csv = self.root / "old.csv"
        old_csv.write_text(
            CSV_HEADER + "1001,phrase,Bora,안녕하세요,Hola\n", encoding="utf-8"
        )
        old_row = load_audio_csv(old_csv)[0]
        self.assertEqual(old_row.text_tts, "")
        self.assertEqual(old_row.text_for_tts(False), "안녕하세요")

        new_csv = self.root / "new.csv"
        new_csv.write_text(
            "id,type,speaker_or_blank,text,translation_or_blank,text_tts\n"
            "V5001,phrase,Bora,잠깐만요,Espera,[suspicious] 잠깐만요\n"
            "V5002,phrase,Bora,괜찮아요,Bien,\n",
            encoding="utf-8",
        )
        acting, empty = load_audio_csv(new_csv)
        self.assertEqual(acting.text_for_tts(True), "[suspicious] 잠깐만요")
        self.assertEqual(acting.text_for_tts(False), "잠깐만요")
        self.assertEqual(empty.text_for_tts(True), "괜찮아요")

    def test_missing_character_voice_is_blocked_and_project_assignment_is_saved(self) -> None:
        book = book_manager.create_book("Variety", "VAR")
        book.csv_path.write_text(
            CSV_HEADER + "V5001,phrase,Bora,잠깐만요,Espera\n", encoding="utf-8"
        )
        book.technical_path.write_text(
            "### Lección 01\nFrases: V5001\n", encoding="utf-8"
        )
        profiles = {
            "voz_bora": {"voice_id": "voice-bora", "description": ""},
            "default": {"voice_id": "voice-default", "description": ""},
        }
        config = ProjectConfig(
            elevenlabs_model_id="custom_model",
            elevenlabs_model_name="Custom Expressive",
        )
        missing = validators.validate_book(book, profiles, config)
        self.assertEqual(missing.missing_characters, ["Bora"])
        self.assertFalse(missing.is_valid)

        config.character_voice_map["Bora"] = "voice-bora"
        config.acting_mode_enabled = True
        save_project_config(book, config)
        restored = load_project_config(book)
        self.assertEqual(restored.elevenlabs_model_id, "custom_model")
        self.assertEqual(restored.elevenlabs_model_name, "Custom Expressive")
        self.assertTrue(restored.acting_mode_enabled)
        self.assertEqual(
            character_voice_id("bora", profiles, restored), "voice-bora"
        )
        self.assertTrue(validators.validate_book(book, profiles, restored).is_valid)

    def test_invalid_model_error_keeps_previous_mp3(self) -> None:
        destination = self.root / "existing.mp3"
        destination.write_bytes(b"previous audio")
        response = Mock(ok=False, status_code=400, text="invalid model_id", content=b"")
        client = ElevenLabsClient("secret", AppSettings())
        with patch("src.elevenlabs_client.requests.post", return_value=response):
            with self.assertRaisesRegex(ElevenLabsError, "bad_model"):
                client.generate_mp3(
                    "안녕하세요", "voice-valid", destination, model_id="bad_model"
                )
        self.assertEqual(destination.read_bytes(), b"previous audio")
        self.assertFalse(destination.with_suffix(".mp3.part").exists())

    def test_client_sends_custom_model_and_acting_text(self) -> None:
        destination = self.root / "acting.mp3"
        response = Mock(ok=True, status_code=200, text="", content=b"new audio")
        row = AudioRow(
            "V5001", "phrase", "Bora", "잠깐만요", "Espera",
            "[suspicious] 잠깐만요",
        )
        client = ElevenLabsClient("secret", AppSettings())
        with patch(
            "src.elevenlabs_client.requests.post", return_value=response
        ) as request:
            client.generate_mp3(
                row.text_for_tts(True),
                "voice-bora",
                destination,
                model_id="custom_expressive_model",
            )
        payload = request.call_args.kwargs["json"]
        self.assertEqual(payload["text"], "[suspicious] 잠깐만요")
        self.assertEqual(payload["model_id"], "custom_expressive_model")
        self.assertEqual(destination.read_bytes(), b"new audio")

    def test_lists_only_tts_models_with_visible_name_and_real_id(self) -> None:
        response = Mock(
            ok=True,
            status_code=200,
            text="",
        )
        response.json.return_value = [
            {
                "model_id": "eleven_v3",
                "name": "Eleven v3",
                "can_do_text_to_speech": True,
            },
            {
                "model_id": "scribe_v2",
                "name": "Scribe v2",
                "can_do_text_to_speech": False,
            },
            {
                "model_id": "eleven_multilingual_v2",
                "name": "Eleven Multilingual v2",
                "can_do_text_to_speech": True,
            },
        ]
        client = ElevenLabsClient("secret-key", AppSettings())
        with patch("src.elevenlabs_client.requests.get", return_value=response) as request:
            models = client.list_models()
        self.assertEqual(
            [(model.name, model.model_id) for model in models],
            [
                ("Eleven Multilingual v2", "eleven_multilingual_v2"),
                ("Eleven v3", "eleven_v3"),
            ],
        )
        self.assertEqual(request.call_args.kwargs["headers"]["xi-api-key"], "secret-key")

    def test_anki_export_uses_clean_text_technical_order_and_safe_media(self) -> None:
        book = book_manager.create_book("수상한 하루", "HS-VARIETY-S01E02")
        book.csv_path.write_text(
            "id,type,speaker_or_blank,text,translation_or_blank,text_tts\n"
            'V5001,phrase,Bora,"첫 번째 문장.",Primera,[angry] 첫 번째 문장.\n'
            'V5002,phrase,Saul,"두 번째 문장.",Segunda,[laughing] 두 번째 문장.\n'
            'V5003,phrase,,"세 번째 문장.",Tercera,[nervous] 세 번째 문장.\n'
            'P001,word,,단어,palabra,[whispers] 단어\n',
            encoding="utf-8",
        )
        book.technical_path.write_text(
            "### Lección 01\nFrases: V5002, V5003, V5001\nPalabras importantes: P001\n",
            encoding="utf-8",
        )
        lesson_dir = book.output_dir / "Lecciones" / "Leccion_01"
        lesson_dir.mkdir(parents=True)
        (lesson_dir / "L01-01 - V5002 - Saul - texto.mp3").write_bytes(b"lesson audio")
        (self.master_dir / "V5001.mp3").write_bytes(b"master audio")
        options = AnkiExportOptions(
            deck_name="HanStory::Test", include_audio=True, phrases_only=True,
            create_tsv=True, order="technical",
        )
        plan = build_anki_plan(book, options)
        self.assertEqual([card.row.audio_id for card in plan.cards], ["V5002", "V5003", "V5001"])
        self.assertEqual(plan.missing_audio_ids, ["V5003"])
        self.assertEqual(plan.cards[0].audio_source.name, "L01-01 - V5002 - Saul - texto.mp3")
        self.assertEqual(plan.cards[2].audio_source.name, "V5001.mp3")
        self.assertEqual(plan.cards[0].media_name, "V5002_Saul.mp3")
        self.assertEqual(plan.cards[1].speaker, "Narrador")
        csv_plan = build_anki_plan(
            book,
            AnkiExportOptions(
                deck_name="CSV order", include_audio=False, phrases_only=True,
                create_tsv=False, order="csv",
            ),
        )
        self.assertEqual([card.row.audio_id for card in csv_plan.cards], ["V5001", "V5002", "V5003"])
        self.assertEqual([card.lesson for card in csv_plan.cards], ["Lección 01"] * 3)

        created_notes = []

        class FakeModel:
            def __init__(self, *args, **kwargs):
                self.args, self.kwargs = args, kwargs

        class FakeNote:
            def __init__(self, **kwargs):
                self.__dict__.update(kwargs)
                created_notes.append(self)

        class FakeDeck:
            def __init__(self, *args):
                self.notes = []

            def add_note(self, note):
                self.notes.append(note)

        class FakePackage:
            def __init__(self, deck):
                self.deck = deck
                self.media_files = []

            def write_to_file(self, path):
                Path(path).write_bytes(b"test apkg")

        fake_genanki = types.SimpleNamespace(
            Model=FakeModel,
            Note=FakeNote,
            Deck=FakeDeck,
            Package=FakePackage,
            guid_for=lambda *parts: "::".join(parts),
        )
        with patch.dict(sys.modules, {"genanki": fake_genanki}):
            result = create_anki_export(book, options, plan)

        self.assertTrue(result.apkg_path.exists())
        self.assertTrue((result.media_dir / "V5002_Saul.mp3").exists())
        self.assertTrue((result.media_dir / "V5001_Bora.mp3").exists())
        tsv = result.tsv_path.read_text(encoding="utf-8-sig")
        self.assertIn("[sound:V5002_Saul.mp3]\t두 번째 문장.", tsv)
        self.assertNotIn("[angry]", tsv)
        self.assertNotIn("[laughing]", tsv)
        self.assertEqual(created_notes[1].fields[0], "")
        self.assertEqual(created_notes[1].fields[3], "Narrador")
        self.assertEqual([note.due for note in created_notes], [1, 2, 3])
        report = result.report_path.read_text(encoding="utf-8")
        self.assertIn("Audios faltantes: 1", report)
        self.assertIn("V5003", report)
        self.assertIn("L01-01 - V5002 - Saul - texto.mp3 -> V5002_Saul.mp3", report)

        with patch.dict(sys.modules, {"genanki": None}):
            fallback = create_anki_export(book, options, plan)
        self.assertIsNone(fallback.apkg_path)
        self.assertTrue(fallback.tsv_path.exists())
        self.assertTrue(fallback.media_dir.exists())

    def test_anki_panel_does_not_override_tkinter_internal_options_method(self) -> None:
        self.assertNotIn("_options", AnkiPanel.__dict__)
        self.assertIn("_export_options", AnkiPanel.__dict__)

    def test_multilanguage_source_import_review_and_generation(self) -> None:
        book = book_manager.create_book("Curso ruso", "HS-RU-01")
        config = load_project_config(book)
        config.source_language = "Spanish"
        config.target_language = "Russian"
        config.explanation_language = "Spanish"
        config.romanization_enabled = True
        config.script_type = "Cyrillic"
        save_project_config(book, config)
        restored = load_project_config(book)
        self.assertEqual(
            (
                restored.source_language, restored.target_language,
                restored.explanation_language, restored.script_type,
            ),
            ("Spanish", "Russian", "Spanish", "Cyrillic"),
        )
        source_file = self.root / "scene.txt"
        source_file.write_text("Hola. ¿Cómo estás?\n\nEstoy bien.", encoding="utf-8")
        record = import_source(book, source_file, "Spanish")
        self.assertTrue(record.detected_text_available)
        self.assertEqual(record.status, "Texto extraído")
        source_index = (book.folder / "sources" / "index.json").read_text(encoding="utf-8")
        self.assertIn(record.source_id, source_index)
        self.assertNotIn("¿Cómo estás?", source_index)
        segments = segment_source(book, record, "chapter")
        self.assertEqual(len(segments), 1)
        self.assertEqual(load_segments(book, record.source_id)[0].source_text, segments[0].source_text)

        with self.assertRaisesRegex(ValueError, "segmentos no revisados"):
            generate_lessons_from_source(
                book, record, segments, restored, LessonGenerationOptions()
            )

        processed, draft, partial = process_segment(
            book,
            record,
            segments,
            0,
            restored,
            action="lesson",
            level="A1",
            mode="Adaptación didáctica",
            no_full_translation=True,
        )
        self.assertEqual(processed.status, "Borrador generado")
        self.assertEqual(draft.target_text, "")
        self.assertTrue((partial / "Audio_Master.csv").exists())
        self.assertIn("Manual / Placeholder", available_engines())
        self.assertIn("OpenAI", available_engines())

        segments[0].status = "Revisado por usuario"
        with self.assertRaisesRegex(ValueError, "falta el texto en Russian"):
            generate_lessons_from_source(
                book, record, segments, restored, LessonGenerationOptions()
            )

        segments[0].target_text = "Привет. Как дела? Я в порядке."
        segments[0].explanation = "Saludos básicos en ruso."
        segments[0].key_translation = "Hola"
        segments[0].status = "Listo para aplicar"
        result = generate_lessons_from_source(
            book,
            record,
            segments,
            restored,
            LessonGenerationOptions(
                level="A1", style="RPG/Isekai", mode="traducir/adaptar",
                no_full_translation=True,
            ),
        )
        self.assertTrue(result.html_path.exists())
        self.assertTrue(result.csv_path.exists())
        self.assertTrue(result.technical_path.exists())
        html_output = result.html_path.read_text(encoding="utf-8")
        self.assertIn("Привет", html_output)
        self.assertNotIn("¿Cómo estás?", html_output)
        csv_output = result.csv_path.read_text(encoding="utf-8-sig")
        self.assertIn("text_tts", csv_output)
        self.assertIn("Привет.", csv_output)
        self.assertNotIn("Hola. ¿Cómo estás?", csv_output)
        book.csv_path.write_text("old csv", encoding="utf-8")
        book.technical_path.write_text("old technical", encoding="utf-8")
        (book.folder / "book.html").write_text("old html", encoding="utf-8")
        backup = apply_generated_package(book, result.output_dir)
        self.assertEqual((backup / "Audio_Master.csv").read_text(encoding="utf-8"), "old csv")
        self.assertIn("Привет.", book.csv_path.read_text(encoding="utf-8-sig"))
        self.assertTrue((book.folder / "book.html").exists())

    def test_pdf_text_detection_marks_scanned_documents_for_ocr(self) -> None:
        book = book_manager.create_book("PDF test", "HS-PDF")

        class FakePage:
            def __init__(self, text):
                self.text = text

            def get_text(self, *_args, **_kwargs):
                return self.text

        class FakeDocument(list):
            def __enter__(self):
                return self

            def __exit__(self, *_args):
                return False

        pdf_path = self.root / "source.pdf"
        pdf_path.write_bytes(b"fake pdf")
        fake_pymupdf = types.SimpleNamespace(
            open=lambda _path: FakeDocument([FakePage(""), FakePage("tiny")])
        )
        with patch.dict(sys.modules, {"pymupdf": fake_pymupdf}):
            scanned = import_source(book, pdf_path, "Spanish")
        self.assertTrue(scanned.needs_ocr)
        self.assertEqual(scanned.status, "PDF escaneado — OCR recomendado")

        fake_pymupdf = types.SimpleNamespace(
            open=lambda _path: FakeDocument(
                [FakePage("Selectable text " * 20), FakePage("More real text " * 20)]
            )
        )
        with patch.dict(sys.modules, {"pymupdf": fake_pymupdf}):
            searchable = import_source(book, pdf_path, "Spanish")
        self.assertFalse(searchable.needs_ocr)
        self.assertEqual(searchable.status, "PDF con texto real")
        self.assertEqual(len(list_sources(book)), 2)

    def test_external_creative_engine_requires_explicit_consent(self) -> None:
        class ExternalTestEngine(CreativeEngine):
            provider_name = "External Test"
            sends_data_externally = True

            def generate_translation(self, request):
                return CreativeDraft("target", "explanation", "key", "vocab", "practice", "notes")

            def generate_lesson(self, request):
                return self.generate_translation(request)

            def generate_vocab(self, request):
                return "vocab"

            def generate_explanations(self, request):
                return "explanation"

        register_engine(ExternalTestEngine())
        book = book_manager.create_book("Consent", "HS-CONSENT")
        source_file = self.root / "consent.txt"
        source_file.write_text("Texto protegido.", encoding="utf-8")
        record = import_source(book, source_file, "Spanish")
        segments = segment_source(book, record, "chapter")
        config = load_project_config(book)
        config.creative_provider_name = "External Test"
        with self.assertRaisesRegex(PermissionError, "confirmar explícitamente"):
            process_segment(
                book, record, segments, 0, config, action="lesson", level="A1",
                mode="Adaptación didáctica", no_full_translation=False,
            )

    def test_openai_provider_returns_editable_structured_draft(self) -> None:
        response = Mock(ok=True, status_code=200, text="")
        response.json.return_value = {
            "output": [
                {
                    "content": [
                        {
                            "type": "output_text",
                            "text": json.dumps(
                                {
                                    "target_text": "안녕하세요.",
                                    "explanation": "Saludo formal.",
                                    "key_phrases": ["안녕하세요 — hola"],
                                    "vocabulary": ["안녕 — bienestar"],
                                    "mini_practice": "Responde al saludo.",
                                    "notes": "Revisar nivel de formalidad.",
                                },
                                ensure_ascii=False,
                            ),
                        }
                    ]
                }
            ]
        }
        request = CreativeRequest(
            source_text="Hola.", source_language="Spanish", target_language="Korean",
            explanation_language="Spanish", level="A1", mode="Traducción fiel",
            model_name="gpt-5.4-mini", temperature=0.2, max_tokens=1200,
            api_key="sk-test",
        )
        engine = get_engine("OpenAI")
        with patch("src.creative_engine.requests.post", return_value=response) as post:
            draft = engine.generate_translation(request)
        self.assertEqual(draft.target_text, "안녕하세요.")
        self.assertIn("Saludo formal", draft.explanation)
        self.assertIn("안녕하세요", draft.key_phrases)
        payload = post.call_args.kwargs["json"]
        self.assertEqual(payload["model"], "gpt-5.4-mini")
        self.assertEqual(payload["max_output_tokens"], 1200)
        self.assertEqual(payload["temperature"], 0.2)
        self.assertEqual(
            post.call_args.kwargs["headers"]["Authorization"], "Bearer sk-test"
        )

    def test_openai_connection_and_key_stay_out_of_project_files(self) -> None:
        env_file = self.root / ".env"
        with patch.object(config_module, "ENV_FILE", env_file):
            save_openai_api_key("sk-local-secret")
            self.assertEqual(get_openai_api_key(), "sk-local-secret")
        self.assertIn("OPENAI_API_KEY", env_file.read_text(encoding="utf-8"))
        book = book_manager.create_book("OpenAI", "HS-OPENAI")
        self.assertNotIn("sk-local-secret", book.project_config_path.read_text(encoding="utf-8"))

        response = Mock(ok=True, status_code=200, text="")
        response.json.return_value = {"id": "gpt-5.4-mini"}
        with patch("src.creative_engine.requests.get", return_value=response) as get:
            message = get_engine("OpenAI").test_connection(
                "sk-local-secret", "gpt-5.4-mini"
            )
        self.assertIn("gpt-5.4-mini", message)
        self.assertIn("/models/gpt-5.4-mini", get.call_args.args[0])

    def test_podcast_package_uses_separate_ids_and_respects_no_full_translation(self) -> None:
        book = book_manager.create_book("Podcast test", "L01")
        book.csv_path.write_text(
            "id,type,speaker_or_blank,text,translation_or_blank,text_tts\n"
            "1001,phrase,Aru,안녕하세요,Hola,[calm] 안녕하세요\n"
            "1002,phrase,Saul,도와주세요,Ayúdame,\n",
            encoding="utf-8",
        )
        book.technical_path.write_text(
            "### Lección 01\nFrases: 1001, 1002\n", encoding="utf-8"
        )
        config = load_project_config(book)
        config.no_full_translation_enabled = True
        config.podcast_id_prefix = "PODB01"
        save_project_config(book, config)
        self.save_approved_podcast_draft(book, 1, "안녕하세요", "Aru", "Hola")
        package = generate_podcast_package(
            book,
            config,
            PodcastOptions(mode="Podcast explicado", id_prefix="PODB01"),
            profiles={
                "Narrador": {"voice_id": "voice-narrator", "description": ""},
                "Profesor": {"voice_id": "voice-teacher", "description": ""},
                "Aru": {"voice_id": "voice-aru", "description": ""},
                "Saul": {"voice_id": "voice-saul", "description": ""},
                "default": {"voice_id": "voice-default", "description": ""},
            },
        )
        self.assertTrue(package.csv_path.exists())
        self.assertTrue(package.technical_path.exists())
        self.assertTrue(package.script_path.exists())
        self.assertTrue(package.report_path.exists())
        self.assertTrue(all(row.audio_id.startswith("PODB01") for row in package.rows))
        self.assertNotIn("1001", {row.audio_id for row in package.rows})
        csv_rows = load_podcast_csv(package.csv_path)
        self.assertEqual(csv_rows[0].audio_type, "podcast")
        self.assertIn("Profesor", package.required_voices)
        self.assertEqual(package.missing_voices, [])
        script = package.script_path.read_text(encoding="utf-8")
        self.assertNotIn("안녕하세요 significa: Hola", script)
        self.assertIn("La frase importante es 안녕하세요. Significa “Hola”.", script)
        self.assertIn("[phrase_repeat]", script)

    def test_podcast_explained_requires_approved_openai_draft(self) -> None:
        book = book_manager.create_book("Podcast bloqueado", "PBLOCK")
        book.csv_path.write_text(
            CSV_HEADER + "1001,phrase,Aru,안녕하세요,Hola\n", encoding="utf-8"
        )
        book.technical_path.write_text("### Lección 01\nFrases: 1001\n", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "Motor creativo/OpenAI"):
            generate_podcast_package(
                book,
                load_project_config(book),
                PodcastOptions(mode="Podcast explicado", id_prefix="PBLOCK"),
                profiles={"Profesor": {"voice_id": "voice-teacher", "description": ""}},
            )

    def test_podcast_draft_quality_rejects_generic_and_wrong_particle_explanations(self) -> None:
        row = AudioRow("1001", "phrase", "Aru", "길은 멀지만", "el camino es largo, pero")
        bad = {
            "lesson_number": 1,
            "lesson_title": "Lección 01",
            "scene_summary_es": "Resumen",
            "key_phrases": [
                {
                    "speaker": "Aru",
                    "phrase": "길은 멀지만",
                    "natural_translation_es": "el camino es largo, pero",
                    "breakdown": [
                        {"korean": "길", "meaning_es": "camino", "function_es": "sujeto descriptivo"},
                        {"korean": "만", "meaning_es": "solo", "function_es": "explicación incorrecta"},
                    ],
                    "grammar_notes": [
                        {"pattern": "-지만", "explanation_es": "bloque importante de la frase"}
                    ],
                    "listening_steps": [{"type": "phrase_repeat", "speaker": "Aru", "text": "길은 멀지만"}],
                }
            ],
        }
        errors = validate_podcast_draft_quality(bad, [row])
        self.assertTrue(any("frase prohibida" in error.casefold() for error in errors))
        self.assertTrue(any("지만" in error for error in errors))

    def test_openai_podcast_explanation_is_saved_as_reviewable_draft(self) -> None:
        book = book_manager.create_book("Podcast OpenAI", "POAI")
        book.csv_path.write_text(
            CSV_HEADER + "1001,phrase,Abuela,오늘은 중요한 일을 해야 한다.,Hoy hay que hacer algo importante\n",
            encoding="utf-8",
        )
        book.technical_path.write_text("### Lección 01\nFrases: 1001\n", encoding="utf-8")
        config = load_project_config(book)
        config.creative_provider_name = "OpenAI"
        config.creative_model_name = "gpt-test"
        save_project_config(book, config)
        response = Mock(ok=True, status_code=200, text="")
        response.json.return_value = {
            "output": [
                {
                    "content": [
                        {
                            "type": "output_text",
                            "text": json.dumps(
                                {
                                    "lesson_number": 1,
                                    "lesson_title": "Lección 01",
                                    "scene_summary_es": "La abuela anuncia una tarea importante.",
                                    "key_phrases": [
                                        {
                                            "speaker": "Abuela",
                                            "phrase": "오늘은 중요한 일을 해야 한다.",
                                            "natural_translation_es": "Hoy hay que hacer algo importante.",
                                            "literal_note_es": "Literalmente: hoy como tema, un asunto importante debe hacerse.",
                                            "tone_es": "Serio e instructivo.",
                                            "breakdown": [
                                                {"korean": "오늘", "meaning_es": "hoy", "function_es": "marca el momento"},
                                                {"korean": "은", "meaning_es": "partícula de tema", "function_es": "marca hoy como tema"},
                                                {"korean": "중요한", "meaning_es": "importante", "function_es": "describe a 일"},
                                                {"korean": "일", "meaning_es": "asunto o cosa que hacer", "function_es": "objeto de la obligación"},
                                                {"korean": "을", "meaning_es": "partícula de objeto", "function_es": "marca 일 como objeto"},
                                                {"korean": "해야 한다", "meaning_es": "hay que hacer", "function_es": "expresa obligación"},
                                            ],
                                            "grammar_notes": [
                                                {"pattern": "-아/어야 하다", "explanation_es": "expresa obligación: tener que hacer algo"}
                                            ],
                                            "listening_steps": [
                                                {"type": "teacher_explanation", "text": "La frase 오늘은 중요한 일을 해야 한다 significa que hoy hay que hacer algo importante."},
                                                {"type": "phrase_repeat", "speaker": "Abuela", "text": "오늘은 중요한 일을 해야 한다.", "style": "slow", "pause_after_ms": 3000},
                                            ],
                                        }
                                    ],
                                    "review_section": {"teacher_text_es": "Repaso final.", "phrases": ["오늘은 중요한 일을 해야 한다."]},
                                },
                                ensure_ascii=False,
                            ),
                        }
                    ]
                }
            ]
        }
        with patch.object(config_module, "ENV_FILE", self.root / ".env"):
            save_openai_api_key("sk-test")
            with patch("src.creative_engine.requests.post", return_value=response) as post:
                draft = generate_podcast_explanation_with_openai(book, config, 1)
        self.assertEqual(draft["hanstory_status"], "Borrador generado por OpenAI")
        self.assertEqual(draft["hanstory_validation_errors"], [])
        self.assertTrue((podcast_paths(book)["drafts"] / "lesson_01.json").exists())
        payload = post.call_args.kwargs["json"]
        self.assertEqual(payload["model"], "gpt-test")
        self.assertIn("Nunca escribas", payload["instructions"])

    def test_podcast_audio_generation_writes_outside_master_audio(self) -> None:
        book = book_manager.create_book("Podcast audio", "POD")
        paths = podcast_paths(book)
        paths["csv"].write_text(
            "id,type,speaker_or_blank,text,translation_or_blank,text_tts,lesson,section\n"
            "PODB010001,podcast,Profesor,Escucha ahora,,[teacherly] Escucha ahora,1,intro\n",
            encoding="utf-8-sig",
        )
        config = load_project_config(book)
        config.character_voice_map["Profesor"] = "voice-teacher"
        save_project_config(book, config)
        result = generate_podcast_audio(
            book,
            {
                "Profesor": {"voice_id": "voice-teacher", "description": ""},
                "default": {"voice_id": "voice-default", "description": ""},
            },
            AppSettings(),
            dry_run=True,
            project_config=config,
        )
        self.assertEqual(result.generated, ["PODB010001"])
        self.assertFalse((self.master_dir / "PODB010001.mp3").exists())
        self.assertTrue(paths["report"].exists())

        response = Mock(ok=True, status_code=200, text="", content=b"podcast mp3")
        with patch.object(config_module, "ENV_FILE", self.root / ".env"):
            config_module.save_api_key("eleven-secret")
            with patch("src.elevenlabs_client.requests.post", return_value=response) as post:
                generated = generate_podcast_audio(
                    book,
                    {
                        "Profesor": {"voice_id": "voice-teacher", "description": ""},
                        "default": {"voice_id": "voice-default", "description": ""},
                    },
                    AppSettings(),
                    dry_run=False,
                    project_config=config,
                )
        self.assertEqual(generated.generated, ["PODB010001"])
        self.assertEqual((paths["audio"] / "PODB010001.mp3").read_bytes(), b"podcast mp3")
        self.assertFalse((self.master_dir / "PODB010001.mp3").exists())
        payload = post.call_args.kwargs["json"]
        self.assertEqual(payload["text"], "Escucha ahora")

    def test_podcast_missing_narrator_and_teacher_are_reported(self) -> None:
        book = book_manager.create_book("Podcast missing", "PODM")
        book.csv_path.write_text(
            CSV_HEADER + "1001,phrase,Aru,안녕하세요,Hola\n", encoding="utf-8"
        )
        book.technical_path.write_text("### Lección 01\nFrases: 1001\n", encoding="utf-8")
        config = load_project_config(book)
        self.save_approved_podcast_draft(book, 1, "안녕하세요", "Aru", "Hola")
        package = generate_podcast_package(
            book,
            config,
            PodcastOptions(mode="Podcast explicado", id_prefix="PODM"),
            profiles={"Aru": {"voice_id": "voice-aru", "description": ""}},
        )
        self.assertIn("Profesor", package.missing_voices)
        report = package.report_path.read_text(encoding="utf-8")
        self.assertIn("Voces faltantes: Profesor", report)

    def test_active_listening_generates_pauses_repetitions_and_silence_files(self) -> None:
        book = book_manager.create_book("Escucha activa", "RPG01")
        book.csv_path.write_text(
            "id,type,speaker_or_blank,text,translation_or_blank,text_tts\n"
            "1001,phrase,Sistema,스킵할 수 없습니다,no se puede saltar,\n",
            encoding="utf-8",
        )
        book.technical_path.write_text("### Lección 01\nFrases: 1001\n", encoding="utf-8")
        config = load_project_config(book)
        self.save_approved_podcast_draft(book, 1, "스킵할 수 없습니다", "Sistema", "no se puede saltar")
        package = generate_podcast_package(
            book,
            config,
            PodcastOptions(
                mode="Podcast explicado",
                id_prefix="PODRPG",
                active_listening_enabled=True,
                active_preset="Repite conmigo",
                phrase_pause_ms=1000,
                repeat_pause_ms=2000,
                key_phrase_repetitions=2,
                include_slow_version=True,
                include_natural_version=True,
                include_brief_translation=True,
                include_repeat_instruction=True,
            ),
            profiles={
                "Profesor": {"voice_id": "voice-teacher", "description": ""},
                "Sistema": {"voice_id": "voice-system", "description": ""},
                "default": {"voice_id": "voice-default", "description": ""},
            },
        )

        rows = load_podcast_csv(package.csv_path)
        key_rows = [row for row in rows if row.is_key_phrase]
        self.assertTrue(any("La frase importante es 스킵할 수 없습니다" in row.text for row in rows))
        self.assertGreaterEqual(
            [row.repeat_style for row in key_rows].count("slow"),
            2,
        )
        self.assertIn("natural", [row.repeat_style for row in key_rows])
        self.assertTrue(any(row.text_tts == "[slowly] 스킵할 수 없습니다" for row in rows))
        self.assertTrue(any(row.text_tts == "[natural] 스킵할 수 없습니다" for row in rows))
        self.assertTrue(any(row.pause_after_ms == 2000 for row in rows))
        self.assertTrue((package.output_dir / "Silences" / "silence_2000ms.wav").exists())
        technical = package.technical_path.read_text(encoding="utf-8")
        self.assertIn("PAUSE 2000", technical)
        script = package.script_path.read_text(encoding="utf-8")
        self.assertIn("[Pausa 2.0s]", script)
        report = package.report_path.read_text(encoding="utf-8")
        self.assertIn("Escucha activa: Activada", report)
        self.assertIn("Cantidad de silencios insertados:", report)
        self.assertIn("Duración estimada total:", report)
        self.assertIn("Frases clave repetidas:", report)

    def test_podcast_explained_breaks_down_long_korean_phrase_like_a_class(self) -> None:
        book = book_manager.create_book("Clase podcast", "CLASS01")
        book.csv_path.write_text(
            "id,type,speaker_or_blank,text,translation_or_blank,text_tts\n"
            "1001,phrase,Narrador,저기 사람이 있어요,allá hay una persona,\n",
            encoding="utf-8",
        )
        book.technical_path.write_text("### Lección 01\nFrases: 1001\n", encoding="utf-8")
        config = load_project_config(book)
        config.target_language = "Korean"
        config.podcast_word_breakdown_enabled = True
        save_podcast_draft(
            book,
            1,
            {
                "lesson_number": 1,
                "lesson_title": "Lección 01",
                "scene_summary_es": "La escena presenta una frase de existencia básica.",
                "hanstory_status": "Listo para podcast",
                "hanstory_validation_errors": [],
                "key_phrases": [
                    {
                        "speaker": "Narrador",
                        "phrase": "저기 사람이 있어요",
                        "natural_translation_es": "allá hay una persona",
                        "literal_note_es": "Literalmente se siente como: allá, persona, existe.",
                        "tone_es": "Suena natural y educado.",
                        "hanstory_status": "Aprobada",
                        "breakdown": [
                            {"korean": "저기", "meaning_es": "allá, ahí lejos", "function_es": "indica una ubicación lejana"},
                            {"korean": "사람", "meaning_es": "persona", "function_es": "la cosa o persona que existe"},
                            {"korean": "이", "meaning_es": "partícula de sujeto", "function_es": "marca 사람 como sujeto de existencia"},
                            {"korean": "있어요", "meaning_es": "hay, existe o está", "function_es": "expresa existencia"},
                        ],
                        "grammar_notes": [
                            {"pattern": "있어요", "explanation_es": "있어요 puede significar “hay”, “existe” o “está”, según el contexto."}
                        ],
                        "listening_steps": [
                            {"type": "word_repeat", "speaker": "Narrador", "text": "저기", "style": "slow", "pause_after_ms": 1500},
                            {"type": "word_explanation", "text": "저기 significa “allá, ahí lejos”."},
                            {"type": "word_repeat", "speaker": "Narrador", "text": "사람", "style": "slow", "pause_after_ms": 1500},
                            {"type": "word_explanation", "text": "사람 significa “persona”."},
                            {"type": "word_repeat", "speaker": "Narrador", "text": "이", "style": "slow", "pause_after_ms": 1000},
                            {"type": "word_explanation", "text": "이 es una partícula de sujeto."},
                            {"type": "word_repeat", "speaker": "Narrador", "text": "있어요", "style": "slow", "pause_after_ms": 1500},
                            {"type": "word_explanation", "text": "있어요 significa “hay”, “existe” o “está”."},
                            {"type": "phrase_repeat", "speaker": "Narrador", "text": "저기 사람이 있어요", "style": "slow", "pause_after_ms": 3000},
                            {"type": "phrase_repeat", "speaker": "Narrador", "text": "저기 사람이 있어요", "style": "natural", "pause_after_ms": 1500},
                        ],
                    }
                ],
                "review_section": {"teacher_text_es": "Repaso final: escucha la frase completa.", "phrases": ["저기 사람이 있어요"]},
            },
        )
        package = generate_podcast_package(
            book,
            config,
            PodcastOptions(
                mode="Podcast explicado",
                id_prefix="PODCLASS",
                active_listening_enabled=True,
                phrase_pause_ms=1000,
                repeat_pause_ms=3000,
                word_breakdown_enabled=True,
            ),
            profiles={
                "Profesor": {"voice_id": "voice-teacher", "description": ""},
                "Narrador": {"voice_id": "voice-narrator", "description": ""},
                "default": {"voice_id": "voice-default", "description": ""},
            },
        )
        rows = load_podcast_csv(package.csv_path)
        sections = [row.section for row in rows]
        self.assertIn("explanation", sections)
        self.assertIn("breakdown", sections)
        self.assertIn("word_repeat", sections)
        self.assertIn("grammar", sections)
        self.assertIn("phrase_repeat", sections)
        word_repeats = [row.text for row in rows if row.section == "word_repeat"]
        self.assertEqual(word_repeats, ["저기", "사람", "이", "있어요"])
        script = package.script_path.read_text(encoding="utf-8")
        self.assertIn("La frase importante es 저기 사람이 있어요. Significa “allá hay una persona”.", script)
        self.assertIn("저기 significa “allá, ahí lejos”.", script)
        self.assertIn("사람 significa “persona”.", script)
        self.assertIn("이 es una partícula de sujeto", script)
        self.assertIn("있어요 puede significar “hay”, “existe” o “está”", script)
        technical = package.technical_path.read_text(encoding="utf-8")
        self.assertIn("PAUSE 1500", technical)
        self.assertIn("PAUSE 3000", technical)

    def test_old_podcast_csv_without_active_columns_still_loads(self) -> None:
        book = book_manager.create_book("Podcast viejo", "OLDPOD")
        path = podcast_paths(book)["csv"]
        path.write_text(
            "id,type,speaker_or_blank,text,translation_or_blank,text_tts,lesson,section\n"
            "PODOLD0001,podcast,Profesor,Hola,,[teacherly] Hola,1,intro\n",
            encoding="utf-8-sig",
        )
        rows = load_podcast_csv(path)
        self.assertEqual(rows[0].pause_after_ms, 0)
        self.assertEqual(rows[0].repeat_count, 1)
        self.assertEqual(rows[0].repeat_style, "normal")
        self.assertFalse(rows[0].is_key_phrase)

    def test_podcast_assembles_lesson_full_audio_and_playlist_in_order(self) -> None:
        book = book_manager.create_book("Podcast unido", "JOIN")
        podcast_rows = [
            PodcastRow(
                "PODJOIN0001", "podcast", "Profesor", "Intro", lesson=1, section="intro", pause_after_ms=500
            ),
            PodcastRow(
                "PODJOIN0002", "podcast", "Aru", "안녕하세요", lesson=1, section="scene", pause_after_ms=1000
            ),
            PodcastRow(
                "PODJOIN0003", "podcast", "Profesor", "Final", lesson=2, section="intro", pause_after_ms=0
            ),
        ]
        paths = podcast_paths(book)
        paths["audio"].mkdir(parents=True)
        for row in podcast_rows:
            (paths["audio"] / f"{row.audio_id}.mp3").write_bytes(row.audio_id.encode())
        config = load_project_config(book)
        config.podcast_audio_output_mode = "Generar separados + generar unidos"
        with patch("src.podcast_generator.shutil.which", return_value=None):
            result = assemble_podcast_audio(book, podcast_rows, config)
        lesson_files = result["lesson_files"]
        self.assertEqual([path.name for path in lesson_files], ["001_Leccion_01.mp3", "002_Leccion_02.mp3"])
        self.assertTrue((paths["full"] / "999_Libro_Completo.mp3").exists())
        playlist = (paths["playlists"] / "HanStory_Podcast.m3u").read_text(encoding="utf-8")
        self.assertIn("podcast_by_lesson/001_Leccion_01.mp3", playlist)
        self.assertIn("podcast_by_lesson/002_Leccion_02.mp3", playlist)
        self.assertIn("podcast_full/999_Libro_Completo.mp3", playlist)
        self.assertIn("Advertencia: ffmpeg no está instalado", "\n".join(result["warnings"]))

    def test_multispeaker_request_falls_back_to_line_generation_and_reports_it(self) -> None:
        book = book_manager.create_book("Multispeaker fallback", "MS01")
        paths = podcast_paths(book)
        paths["csv"].write_text(
            "id,type,speaker_or_blank,text,translation_or_blank,text_tts,lesson,section,pause_after_ms,repeat_count,repeat_style,is_key_phrase,playback_speed_hint\n"
            "PODMS0001,podcast,Saul,잠깐만요,,[surprised] 잠깐만요,1,scene,0,1,normal,false,normal\n"
            "PODMS0002,podcast,Profesor,Esto significa espera,,[teacherly] Esto significa espera,1,explanation,0,1,normal,false,normal\n",
            encoding="utf-8-sig",
        )
        config = load_project_config(book)
        config.podcast_use_multispeaker_v3 = True
        config.podcast_multispeaker_max_chars = 4500
        config.podcast_audio_output_mode = "Un audio por lección"
        config.character_voice_map["Saul"] = "voice-saul"
        config.character_voice_map["Profesor"] = "voice-teacher"
        save_project_config(book, config)
        response = Mock(ok=True, status_code=200, text="", content=b"line mp3")
        with patch.object(config_module, "ENV_FILE", self.root / ".env"):
            config_module.save_api_key("eleven-secret")
            with patch("src.elevenlabs_client.requests.post", return_value=response):
                with patch("src.podcast_generator.shutil.which", return_value=None):
                    result = generate_podcast_audio(
                        book,
                        {
                            "Saul": {"voice_id": "voice-saul", "description": ""},
                            "Profesor": {"voice_id": "voice-teacher", "description": ""},
                            "default": {"voice_id": "voice-default", "description": ""},
                        },
                        AppSettings(),
                        dry_run=False,
                        project_config=config,
                    )
        self.assertEqual(result.generation_mode_used, "línea por línea")
        self.assertTrue(result.fallback_warnings)
        self.assertEqual(result.generated, ["PODMS0001", "PODMS0002"])
        self.assertTrue((paths["audio"] / "PODMS0001.mp3").exists())
        self.assertTrue((paths["by_lesson"] / "001_Leccion_01.mp3").exists())
        report = paths["report"].read_text(encoding="utf-8")
        self.assertIn("Modo de generación ElevenLabs: línea por línea", report)
        self.assertIn("Fallback multi-speaker", report)


if __name__ == "__main__":
    unittest.main()
