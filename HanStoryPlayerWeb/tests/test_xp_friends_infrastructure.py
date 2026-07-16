import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SQL = (ROOT / "supabase/migrations/002_xp_and_friends.sql").read_text(encoding="utf-8").lower()
STORY_SQL = (ROOT / "supabase/migrations/003_story_lesson_xp.sql").read_text(encoding="utf-8").lower()


class XpFriendsInfrastructureTests(unittest.TestCase):
    def test_xp_tables_are_private_and_idempotent(self):
        self.assertIn("unique(user_id,event_key)", SQL)
        self.assertIn("alter table public.xp_events enable row level security", SQL)
        self.assertIn("lesson_catalog", SQL)
        self.assertIn("revoke all on public.lesson_catalog", SQL)
        self.assertIn("on conflict(user_id,event_key) do nothing", SQL)
        self.assertIn("select * into lesson from public.lesson_catalog", SQL)
        self.assertIn("legacy-completed-lessons", SQL)
        self.assertIn("least(coalesce(p_completed_at,now()),now())", SQL)

    def test_friend_codes_are_unique_generated_and_immutable(self):
        self.assertIn("profiles_friend_code_uidx", SQL)
        self.assertIn("friend_code_registry", SQL)
        self.assertIn("alter table public.friend_code_registry enable row level security", SQL)
        self.assertIn("insert into public.friend_code_registry(code)", SQL)
        self.assertIn("generate_friend_code", SQL)
        self.assertIn("profiles_protect_friend_code", SQL)
        self.assertIn("revoke insert,delete,update on public.profiles from authenticated", SQL)
        self.assertIn("grant update(display_name,avatar_url)", SQL)

    def test_friend_writes_are_only_available_through_rpc(self):
        self.assertIn("alter table public.friend_requests enable row level security", SQL)
        self.assertIn("alter table public.friendships enable row level security", SQL)
        self.assertIn("revoke all on public.lesson_catalog,public.xp_events,public.friend_requests,public.friendships", SQL)
        self.assertIn("create or replace function public.respond_friend_request", SQL)
        self.assertIn("create or replace function public.remove_friend", SQL)
        self.assertIn('create policy "friendships_participant_select"', SQL)

    def test_public_friend_payloads_never_include_private_identifiers(self):
        ui = (ROOT / "src/account_ui.js").read_text(encoding="utf-8")
        friends = (ROOT / "src/friends_service.js").read_text(encoding="utf-8")
        self.assertIn("lookup_friend_code", friends)
        self.assertNotIn("get_friend_xp_summary", friends)
        self.assertIn("user.email", ui)  # visible only in the signed-in user's account tab
        friend_card = ui[ui.index("friendCard(friend){"):ui.index("requestsHTML(){")]
        self.assertNotIn("email", friend_card)
        self.assertNotIn("user_id", friend_card)
        self.assertIsNotNone(re.search(r"friend\.friend_code", friend_card))

    def test_all_current_languages_use_shared_completion_service(self):
        app = (ROOT / "src/app.js").read_text(encoding="utf-8")
        japanese = (ROOT / "src/japanese_course_app.js").read_text(encoding="utf-8")
        self.assertIn("xpService.awardLessonXP", app)
        self.assertIn("xpService.awardLessonXP", japanese)
        self.assertIn("data-complete-zero-stage", app)
        self.assertNotIn("markZeroStage", app)

    def test_story_lessons_award_xp_only_at_audio_boundaries(self):
        app = (ROOT / "src/app.js").read_text(encoding="utf-8")
        self.assertIn("completeStoryLessonAtBoundary", app)
        self.assertIn("isStoryLessonBoundary(state.tracks,state.index)", app)
        self.assertIn("audio.onended=async", app)
        self.assertIn("completedLessons:old?.completedLessons||[]", app)

    def test_every_published_story_book_is_in_the_server_catalog(self):
        import json
        library = json.loads((ROOT / "library/library.json").read_text(encoding="utf-8"))
        ranges = {
            code: (language, set(range(int(first), int(last) + 1)))
            for language, code, first, last in re.findall(
                r"\('([^']+)','([^']+)',(\d+),(\d+)\)", STORY_SQL
            )
        }
        for book in library["books"]:
            code = book["code"].lower()
            self.assertIn(code, ranges)
            manifest = json.loads((ROOT / "library" / book["manifest"]).read_text(encoding="utf-8"))
            lessons = {int(track.get("lesson") or 0) for track in manifest["tracks"] if int(track.get("lesson") or 0) > 0}
            self.assertEqual(ranges[code][0], book["target_language"].lower())
            self.assertEqual(ranges[code][1], lessons)
        self.assertIn("'normal',20,true", STORY_SQL)
        self.assertIn("on conflict(language_id,course_id,lesson_id) do update", STORY_SQL)


if __name__ == "__main__":
    unittest.main()
