import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import src.web_topics as topics


class WebTopicTests(unittest.TestCase):
    def test_korean_fallback_rules(self):
        obligation=topics.classify_track({"id":"1","text":"이 일을 해야 해요.","translation":"Hay que hacerlo."},"Korean"); places=topics.classify_track({"id":"2","text":"저기 마을이 보여요.","translation":"Se ve la aldea."},"Korean")
        self.assertIn("obligation",obligation["topics"]); self.assertIn("places",places["topics"])
    def test_audio_path_does_not_invalidate_cache(self):
        track={"id":"1","text":"해야 해요","translation":"Debo hacerlo","audio_path":"old.mp3"}; first=topics.classification_hash(track,"Korean"); track["audio_path"]="new.mp3"; self.assertEqual(first,topics.classification_hash(track,"Korean"))
    def test_future_languages_use_translation_fallback(self):
        french=topics.classify_track({"id":"fr1","text":"Je dois partir.","translation":"Tengo que irme mañana."},"French"); english=topics.classify_track({"id":"en1","text":"How much is it?","translation":"¿Cuánto cuesta?"},"English")
        self.assertIn("obligation",french["topics"]); self.assertIn("future",french["topics"]); self.assertIn("shopping",english["topics"])
    def test_rebuild_creates_references_without_copying_audio(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp); book=root/"books/HS-X"; book.mkdir(parents=True); (book/"audio").mkdir(); (book/"audio/a.mp3").write_bytes(b"audio")
            manifest={"project_code":"HS-X","title":"Historia","target_language":"Korean","tracks":[{"id":"1","lesson":1,"sequence":1,"speaker":"Aru","text":"여기에서 해야 해요.","translation":"Hay que hacerlo aquí.","audio_path":"audio/a.mp3","type":"phrase"}]}; (book/"hanstory_manifest.json").write_text(json.dumps(manifest))
            with patch.object(topics,"TOPIC_CACHE",root/"cache"): index=topics.rebuild_topics(root)
            self.assertIn("Korean",index["languages"]); topic_file=next((root/"topics/Korean").glob("*.json")); data=json.loads(topic_file.read_text()); self.assertEqual(data["items"][0]["audio_path"],"books/HS-X/audio/a.mp3"); self.assertEqual(len(list(root.rglob("*.mp3"))),1)
    def test_empty_topic_index_is_valid(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            with patch.object(topics,"TOPIC_CACHE",root/"cache"): index=topics.rebuild_topics(root)
            self.assertEqual(index["languages"],{})


class TopicUIContractTests(unittest.TestCase):
    def test_language_mode_and_separate_topic_progress_exist(self):
        root=Path(__file__).resolve().parents[1]/"HanStoryPlayerWeb"; html=(root/"index.html").read_text(); app=(root/"src/app.js").read_text()
        self.assertIn("¿Qué idioma quieres estudiar?",html); self.assertIn('data-mode="stories"',html); self.assertIn('data-mode="topics"',html); self.assertIn("topic_index.json",app); self.assertIn("progressId(state.book.entry.code,mode)",app); self.assertIn("Ver en historia",app)

    def test_inline_topic_audio_navigation_and_next_lesson_exist(self):
        root=Path(__file__).resolve().parents[1]/"HanStoryPlayerWeb"; app=(root/"src/app.js").read_text()
        self.assertIn("data-topic-audio",app); self.assertIn("data-topic-explain",app)
        self.assertIn('data-nav="home"',app); self.assertIn('data-nav="stories"',app)
        self.assertIn("function playTopicInline",app); self.assertIn("function offerNextLesson",app)

    def test_language_and_mode_cards_accept_clicks_on_their_children(self):
        root=Path(__file__).resolve().parents[1]/"HanStoryPlayerWeb"; app=(root/"src/app.js").read_text()
        self.assertIn("closest('[data-language]')",app)
        self.assertIn("closest('[data-mode]')",app)

    def test_player_has_topic_and_language_artwork_fallbacks(self):
        root=Path(__file__).resolve().parents[1]/"HanStoryPlayerWeb"; app=(root/"src/app.js").read_text()
        self.assertIn("const topicIcons=",app); self.assertIn("languageIcons={",app)
        self.assertIn("function generatedArtwork",app); self.assertIn("function playerArtwork",app)

    def test_touch_feedback_does_not_shrink_the_button_hit_area(self):
        root=Path(__file__).resolve().parents[1]/"HanStoryPlayerWeb"; css=(root/"assets/navigation.css").read_text()
        self.assertIn("button:active{transform:none",css)
        self.assertIn(".choice-card>*{pointer-events:none}",css)

    def test_hidden_review_badge_cannot_be_overridden_by_badge_styles(self):
        root=Path(__file__).resolve().parents[1]/"HanStoryPlayerWeb"; css=(root/"assets/navigation.css").read_text()
        self.assertIn("[hidden]{display:none!important}",css)

    def test_word_breakdown_can_use_device_text_to_speech(self):
        root=Path(__file__).resolve().parents[1]/"HanStoryPlayerWeb"; app=(root/"src/app.js").read_text()
        self.assertIn("function speakWord",app); self.assertIn("SpeechSynthesisUtterance",app)
        self.assertIn('class="word-audio"',app); self.assertIn("data-speak=",app)

    def test_isolated_english_i_is_spoken_as_the_pronoun(self):
        root=Path(__file__).resolve().parents[1]/"HanStoryPlayerWeb"; app=(root/"src/app.js").read_text()
        self.assertIn("language==='English'&&clean==='I'",app)
        self.assertIn("return'eye'",app)
