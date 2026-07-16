import unittest
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class AccountInfrastructureTests(unittest.TestCase):
    def test_account_button_replaces_update_button(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn('id="account-button"', html)
        self.assertNotIn('id="updates"', html)
        auth = (ROOT / "src/auth_service.js").read_text(encoding="utf-8")
        self.assertIn("@supabase/supabase-js@2", auth)

    def test_database_migration_has_rls_for_every_private_table(self):
        sql = (ROOT / "supabase/migrations/001_initial_progress.sql").read_text(encoding="utf-8").lower()
        for table in ("profiles", "user_progress", "sync_events"):
            self.assertIn(f"alter table public.{table} enable row level security", sql)
        self.assertGreaterEqual(sql.count("to authenticated"), 12)
        self.assertNotIn("to anon\nusing (true)", sql)

    def test_service_worker_bypasses_private_network_requests(self):
        worker = (ROOT / "service-worker.js").read_text(encoding="utf-8")
        self.assertIn("requestUrl.origin!==self.location.origin", worker)
        self.assertNotIn("indexedDB.deleteDatabase", worker)
        self.assertNotIn("localStorage.clear", worker)

    def test_only_public_configuration_fields_are_used(self):
        config = (ROOT / "src/config.example.js").read_text(encoding="utf-8")
        self.assertEqual(config.count("export const"), 2)
        self.assertIn("SUPABASE_URL", config)
        self.assertIn("SUPABASE_PUBLISHABLE_KEY", config)

    def test_blocked_indexeddb_never_hides_language_cards(self):
        storage = (ROOT / "src/storage.js").read_text(encoding="utf-8")
        app = (ROOT / "src/app.js").read_text(encoding="utf-8")
        self.assertIn("db.onversionchange", storage)
        self.assertIn("Otra pestaña está usando una versión anterior", storage)
        self.assertIn("storageFallback", app)
        render_position = app.index("renderLanguages();show('language-view')")
        storage_position = app.index("storageFallback(get('metadata','library')")
        self.assertLess(render_position, storage_position)

    def test_async_defaults_do_not_break_module_parsing(self):
        combined = "\n".join(path.read_text(encoding="utf-8") for path in (ROOT / "src").rglob("*.js"))
        self.assertIsNone(re.search(r"function\s+\w+\s*\([^)]*=\s*await", combined))


if __name__ == "__main__":
    unittest.main()
