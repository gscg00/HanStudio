import json
import subprocess
from pathlib import Path
from unittest import TestCase


ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / "HanStoryPlayerWeb"


class JapaneseGuidedCourseTests(TestCase):
    def test_course_has_ten_worlds_and_high_quality_pilot(self):
        course = json.loads((WEB / "library/courses/Japanese/course.json").read_text())
        unit = json.loads((WEB / "library/courses/Japanese/units/hiragana-01.json").read_text())
        self.assertEqual(course["language"], "Japanese")
        self.assertEqual(len(course["units"]), 10)
        self.assertEqual(course["version"], 3)
        self.assertGreaterEqual(len(unit["lessons"]), 29)
        self.assertTrue(unit["lessons"][-1]["isTest"])
        kana = {activity["target"] for lesson in unit["lessons"] for activity in lesson["activities"]}
        self.assertTrue(set("あいうえお").issubset(kana))
        required = {"id", "type", "prompt", "target", "options", "answer", "explanation", "audio", "slow_audio", "image", "writing_asset", "tags", "xp"}
        for lesson in unit["lessons"]:
            for activity in lesson["activities"]:
                self.assertTrue(required.issubset(activity))

    def test_every_kana_is_taught_before_it_is_tested(self):
        for filename in ("hiragana-01.json", "katakana.json"):
            unit = json.loads((WEB / "library/courses/Japanese/units" / filename).read_text())
            taught = set()
            for lesson in unit["lessons"]:
                for activity in lesson["activities"]:
                    if activity["type"] == "teach_kana":
                        taught.add(activity["target"])
                    elif activity["type"] in {"kana_choice", "audio_to_kana", "kana_to_audio"} and activity["target"]:
                        self.assertIn(activity["target"], taught, f"{filename}: {activity['target']} se evalúa antes de enseñarse")

    def test_kana_are_practiced_immediately_and_reviews_are_interleaved(self):
        for filename in ("hiragana-01.json", "katakana.json"):
            unit = json.loads((WEB / "library/courses/Japanese/units" / filename).read_text())
            taught = set()
            review_count = 0
            for index, lesson in enumerate(unit["lessons"][:-1]):
                if lesson.get("isReview"):
                    review_count += 1
                    reviewed = {a["target"] for a in lesson["activities"] if a.get("target")}
                    self.assertTrue(reviewed.issubset(taught))
                    self.assertLess(len(reviewed), len(taught), "El mini repaso debe tomar una muestra, no todos los kana")
                    continue
                self.assertTrue(unit["lessons"][index + 1].get("isReview"), "Cada lección nueva debe ir seguida de un mini repaso")
                activities = lesson["activities"]
                for position, current in enumerate(activities):
                    if current["type"] != "teach_kana":
                        continue
                    taught.add(current["target"])
                    immediate = activities[position + 1]
                    self.assertEqual(immediate["type"], "kana_to_audio")
                    self.assertEqual(immediate["target"], current["target"])
                    self.assertNotIn(current["target"], immediate["options"], "Las opciones deben ser sonidos descritos, no más letras")
            self.assertGreaterEqual(review_count, 10)

    def test_words_begin_only_after_hiragana_katakana_and_rhythm(self):
        course = json.loads((WEB / "library/courses/Japanese/course.json").read_text())
        ids = [item["id"] for item in course["units"]]
        self.assertEqual(ids[:4], ["hiragana-01", "katakana", "rhythm", "first-words"])
        for filename in ("hiragana-01.json", "katakana.json"):
            unit = json.loads((WEB / "library/courses/Japanese/units" / filename).read_text())
            self.assertFalse(any(activity["type"] == "teach_word" for lesson in unit["lessons"] for activity in lesson["activities"]))

    def test_each_first_word_is_practiced_before_the_next_word(self):
        unit = json.loads((WEB / "library/courses/Japanese/units/first-words.json").read_text())
        built = set()
        for lesson in unit["lessons"]:
            activities = lesson["activities"]
            teach_positions = [index for index, item in enumerate(activities) if item["type"] == "teach_word"]
            for order, position in enumerate(teach_positions):
                taught = activities[position]["target"]
                next_position = teach_positions[order + 1] if order + 1 < len(teach_positions) else len(activities)
                practice = activities[position + 1:next_position]
                self.assertTrue(any(item.get("target") == taught and item.get("gradable", True) for item in practice))
                built.update(item["target"] for item in practice if item["type"] == "build_word")
        self.assertIn("あい", built)

    def test_routes_scoring_unlock_progress_restore_and_review(self):
        script = r"""
import fs from 'node:fs';
import {completeJapaneseLesson,defaultJapaneseProgress,normalizeJapaneseProgress,parseJapaneseRoute,reviewsDue,scoreActivities} from './HanStoryPlayerWeb/src/japanese_course_logic.js';
const unit=JSON.parse(fs.readFileSync('./HanStoryPlayerWeb/library/courses/Japanese/units/hiragana-01.json'));
const lesson=unit.lessons[0];
const answers=Object.fromEntries(lesson.activities.map(a=>[a.id,a.answer]));
const good=scoreActivities(lesson.activities,answers);
const saved=completeJapaneseLesson(defaultJapaneseProgress(),unit,lesson,good,new Date('2026-07-16T12:00:00Z'));
const firstGradable=lesson.activities.find(a=>a.answer);
const badAnswers={...answers,[firstGradable.id]:'incorrecta'};
const bad=scoreActivities(lesson.activities,badAnswers);
const withMistake=completeJapaneseLesson(defaultJapaneseProgress(),unit,lesson,bad,new Date('2026-07-16T12:00:00Z'));
console.log(JSON.stringify({good,saved,nextId:unit.lessons[1].id,restored:normalizeJapaneseProgress(JSON.parse(JSON.stringify(saved))),bad,due:reviewsDue(withMistake,new Date('2026-07-18T12:00:00Z')).length,routes:[parseJapaneseRoute('#/japanese/course'),parseJapaneseRoute('#/japanese/course/unit/hiragana-01'),parseJapaneseRoute('#/japanese/course/lesson/jp-hira-vowels-1'),parseJapaneseRoute('#/japanese/course/result/jp-hira-vowels-1'),parseJapaneseRoute('#/japanese/review'),parseJapaneseRoute('#/japanese/profile')]}));
"""
        result = subprocess.run(
            ["node", "--input-type=module", "-e", script],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=True,
        )
        data = json.loads(result.stdout)
        self.assertEqual(data["good"]["percentage"], 100)
        self.assertGreater(data["good"]["xp"], 0)
        self.assertIn(data["nextId"], data["saved"]["unlockedLessons"])
        self.assertEqual(data["saved"], data["restored"])
        self.assertTrue(data["bad"]["errors"][0]["activityId"].startswith("jp-hira"))
        self.assertEqual(data["due"], 1)
        self.assertEqual([route["name"] for route in data["routes"]], ["course", "unit", "lesson", "result", "review", "profile"])
        self.assertEqual(data["saved"]["language"], "Japanese")
        self.assertEqual(data["saved"]["id"], "jp-guided-progress-v1")

    def test_course_update_migrates_progress_instead_of_resetting_it(self):
        script = r"""
import fs from 'node:fs';
import {migrateJapaneseProgress} from './HanStoryPlayerWeb/src/japanese_course_logic.js';
const unit=JSON.parse(fs.readFileSync('./HanStoryPlayerWeb/library/courses/Japanese/units/hiragana-01.json'));
const first=unit.lessons[0], second=unit.lessons[1], activity=first.activities[0];
const old={id:'jp-guided-progress-v1',courseVersion:2,language:'Japanese',xp:275,currentUnit:'unidad-eliminada',currentLesson:'leccion-eliminada',completedLessons:[first.id,'leccion-eliminada'],lessonScores:{[first.id]:{percentage:100},'leccion-eliminada':{percentage:90}},masteryByItem:{[activity.id]:{correct:4,wrong:0,stage:4},'actividad-eliminada':{correct:1}},mistakes:[{activityId:'actividad-eliminada',lessonId:'leccion-eliminada',dueAt:'2026-07-17T00:00:00Z'}],reviewDue:['2026-07-17T00:00:00Z'],streak:7,lastStudyDate:'2026-07-16',unlockedUnits:[unit.id,'unidad-eliminada'],unlockedLessons:[first.id,'leccion-eliminada']};
const migrated=migrateJapaneseProgress(old,[unit],3);
console.log(JSON.stringify({migrated,first:first.id,second:second.id,activity:activity.id}));
"""
        result = subprocess.run(
            ["node", "--input-type=module", "-e", script],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=True,
        )
        data = json.loads(result.stdout)
        migrated = data["migrated"]
        self.assertEqual(migrated["courseVersion"], 3)
        self.assertEqual(migrated["xp"], 275)
        self.assertEqual(migrated["streak"], 7)
        self.assertEqual(migrated["completedLessons"], [data["first"]])
        self.assertIn(data["first"], migrated["lessonScores"])
        self.assertIn(data["activity"], migrated["masteryByItem"])
        self.assertNotIn("leccion-eliminada", migrated["lessonScores"])
        self.assertNotIn("actividad-eliminada", migrated["masteryByItem"])
        self.assertEqual(migrated["mistakes"], [])
        self.assertIn(data["second"], migrated["unlockedLessons"])
        self.assertEqual(migrated["currentLesson"], data["second"])

    def test_hash_router_replaces_views_and_offline_shell_contains_course(self):
        app = (WEB / "src/japanese_course_app.js").read_text()
        shell = (WEB / "service-worker.js").read_text()
        main = (WEB / "src/app.js").read_text()
        self.assertIn("window.addEventListener('hashchange'", app)
        self.assertIn("this.root.innerHTML", app)
        self.assertNotIn("scrollIntoView", app)
        self.assertIn("jp-guided-progress-v1", app)
        self.assertIn("renderTeachingActivity", app)
        self.assertIn("this.navigate('lesson',id)", app)
        self.assertIn("library/courses/Japanese/course.json", shell)
        self.assertIn("library/courses/Japanese/units/hiragana-01.json", shell)
        self.assertIn("japanese_course_app.js", shell)
        self.assertIn("/library/courses/Japanese/audio/", shell)
        self.assertIn("data-jp-action=\"retry-load\"", app)
        self.assertIn("cache.put(event.request", shell)
        self.assertIn("location.hash.startsWith('#/japanese/')", main)
        self.assertIn('data-nav="course"', main)
        self.assertIn("Curso guiado", main)

    def test_brief_reviews_do_not_advance_visible_lesson_numbers(self):
        app = (WEB / "src/japanese_course_app.js").read_text()
        self.assertIn(
            "displayNumber=unit.lessons.slice(0,index+1).filter(item=>!item.isReview&&!item.isTest).length",
            app,
        )
        self.assertIn("lesson.isReview?'REPASO BREVE':`LECCIÓN ${displayNumber}`", app)
        self.assertIn("lesson.isReview?'↻':lesson.isTest?'★':displayNumber", app)
        self.assertIn("${lessonTotal} lecciones · ${reviewTotal} repasos", app)
        self.assertIn("<span>pasos</span>", app)

    def test_audio_is_eleven_v3_and_never_browser_tts(self):
        manifest = json.loads((WEB / "library/courses/Japanese/audio_manifest.json").read_text())
        app = (WEB / "src/japanese_course_app.js").read_text()
        self.assertEqual(manifest["provider"], "ElevenLabs")
        self.assertEqual(manifest["model_id"], "eleven_v3")
        for kana in "あいうえお":
            self.assertIn(kana, manifest["items"])
        for whole_word in ("あい", "うえ", "おばあさん", "きて", "きって"):
            self.assertIn(whole_word, manifest["items"])
            self.assertTrue((WEB / "library/courses/Japanese" / manifest["items"][whole_word]).is_file())
        self.assertNotIn("speechSynthesis", app)
        self.assertNotIn("[...key].map", app)
        self.assertIn("playbackRate", app)

    def test_every_course_audio_reference_exists_as_one_complete_clip(self):
        course_root = WEB / "library/courses/Japanese"
        course = json.loads((course_root / "course.json").read_text())
        manifest = json.loads((course_root / "audio_manifest.json").read_text())
        referenced = set()
        for unit_summary in course["units"]:
            unit = json.loads((course_root / unit_summary["manifest"]).read_text())
            for lesson in unit["lessons"]:
                for activity in lesson["activities"]:
                    if activity.get("audio"):
                        referenced.add(activity["audio"])
        for text in referenced:
            self.assertIn(text, manifest["items"], f"Falta el clip continuo de {text}")
            self.assertTrue((course_root / manifest["items"][text]).is_file(), f"No existe el archivo de audio de {text}")
