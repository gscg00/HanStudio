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
        self.assertEqual(config.count("export const"), 3)
        self.assertIn("SUPABASE_URL", config)
        self.assertIn("SUPABASE_PUBLISHABLE_KEY", config)
        self.assertIn("ADMIN_EMAILS", config)
        self.assertNotIn("SERVICE_ROLE", config)

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

    def test_cloud_progress_is_restored_automatically_without_erasing_guest(self):
        sync = (ROOT / "src/sync_service.js").read_text(encoding="utf-8")
        self.assertIn("saveOwnerSnapshot(this.activeOwner,local)", sync)
        self.assertIn("ownerSnapshot('guest')", sync)
        self.assertIn("this.activeOwner===owner", sync)
        self.assertIn("await this.pullAndMerge()", sync)
        self.assertIn("await this.flush()", sync)
        self.assertIn("enqueueDifferences(records,remote,userId)", sync)
        self.assertNotIn("this.pendingChoice={", sync)

    def test_synced_records_are_not_requeued_on_every_session_restore(self):
        sync = (ROOT / "src/sync_service.js").read_text(encoding="utf-8")
        self.assertIn("const needsUpload=", sync)
        self.assertIn("stable(record.value||{})!==stable(remote.value||{})", sync)
        self.assertNotIn("for(const record of merged)await this.enqueue(record,userId)", sync)

    def test_sync_queue_discards_sent_events_and_ignores_stale_counter_reads(self):
        sync = (ROOT / "src/sync_service.js").read_text(encoding="utf-8")
        storage = (ROOT / "src/storage.js").read_text(encoding="utf-8")
        self.assertIn("removeAllByIndex('syncQueue','status','synced')", sync)
        self.assertIn("remove('syncQueue',event.eventId,{sync:false})", sync)
        self.assertIn("version!==this.emitVersion", sync)
        self.assertIn("export async function removeAllByIndex", storage)

    def test_offline_session_restoration_keeps_the_account_owner(self):
        sync = (ROOT / "src/sync_service.js").read_text(encoding="utf-8")
        self.assertIn("if(!navigator.onLine||this.auth.error)", sync)
        self.assertIn("return this.activeOwner.startsWith('user:')", sync)


if __name__ == "__main__":
    unittest.main()
