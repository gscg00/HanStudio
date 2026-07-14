import unittest
from types import SimpleNamespace
from unittest.mock import patch

from src.book_manager import Book
from src.creative_engine import creative_runtime_connected, load_creative_runtime, test_creative_runtime as verify_runtime


class FakeOpenAI:
    sends_data_externally = True
    def get_api_key(self): return "sk-mock"
    def test_connection(self, api_key, model):
        assert api_key == "sk-mock" and model == "gpt-5.4-mini"
        return "Conexión correcta"


class SharedCreativeRuntimeTests(unittest.TestCase):
    def test_sources_and_web_library_share_runtime_and_model(self):
        book = Book(1, "HS-MOCK", "Mock", "", "", __import__('pathlib').Path('/tmp/mock'))
        config = SimpleNamespace(creative_provider_name="OpenAI", creative_model_name="gpt-5.4-mini", creative_temperature=0.3, creative_max_tokens=4000)
        with patch("src.creative_engine.load_project_config", return_value=config), patch("src.creative_engine.get_engine", return_value=FakeOpenAI()):
            runtime = load_creative_runtime(book)
            self.assertTrue(runtime.openai_ready)
            self.assertEqual(runtime.model_name, "gpt-5.4-mini")
            self.assertEqual(verify_runtime(book), "Conexión correcta")
            self.assertTrue(creative_runtime_connected(book, runtime))
