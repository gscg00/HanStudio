import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class ReviewDailyLimitTests(unittest.TestCase):
    def test_future_review_calendar_is_not_rendered(self):
        app = (ROOT / "src/japanese_course_app.js").read_text(encoding="utf-8")
        self.assertNotIn("Próximos repasos", app)
        self.assertNotIn("Próximo repaso programado", app)
        self.assertNotIn("El siguiente repaso será", app)

    def test_recommended_global_daily_limit_is_enforced(self):
        settings = (ROOT / "src/user_settings.js").read_text(encoding="utf-8")
        app = (ROOT / "src/japanese_course_app.js").read_text(encoding="utf-8")
        self.assertIn("DEFAULT_DAILY_REVIEW_LIMIT=20", settings)
        self.assertIn("[10,20,30,50,100]", settings)
        self.assertIn("Math.min(12,allowance.remaining)", app)
        self.assertIn("Límite diario completado", app)

    def test_account_exposes_and_syncs_the_setting(self):
        account = (ROOT / "src/account_ui.js").read_text(encoding="utf-8")
        store = (ROOT / "src/local_progress_store.js").read_text(encoding="utf-8")
        worker = (ROOT / "service-worker.js").read_text(encoding="utf-8")
        self.assertIn("Máximo de tarjetas al día", account)
        self.assertIn("saveUserSettings", account)
        self.assertIn("settings:global", store)
        self.assertIn("./src/user_settings.js", worker)


if __name__ == "__main__":
    unittest.main()
