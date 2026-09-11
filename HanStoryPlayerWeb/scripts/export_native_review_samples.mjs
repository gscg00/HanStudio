import fs from 'node:fs';
import {guidedCourseForLanguage} from '../src/guided_course_config.js';

const root = new URL('../', import.meta.url);
const languages = ['English','French','German','Italian','Portuguese','Russian','Chinese','Arabic','Korean','Japanese'];
const quota = {teaching:8, listening:6, word:4, phrase:4, production:2};
const productionTypes = new Set(['guided_dialogue','stage_scenario','dictation','typed_translation','build_with_blocks','open_question','speak_and_transcribe']);

const csvCell = value => `"${String(value ?? '').replaceAll('"','""')}"`;
const spread = (items, count) => {
  if (!items.length) return [];
  if (items.length <= count) return items;
  const selected = [];
  for (let index = 0; index < count; index += 1) {
    const position = Math.round(index * (items.length - 1) / (count - 1));
    if (!selected.includes(items[position])) selected.push(items[position]);
  }
  return selected;
};
const category = activity => {
  if (productionTypes.has(activity.type)) return 'production';
  if (activity.word_breakdown?.length) return 'word';
  if (activity.type === 'listening_choice' || activity.type === 'audio_to_kana' || activity.type === 'kana_to_audio') return 'listening';
  if (activity.audio && (/\s/u.test(activity.audio) || activity.audio.length > 5)) return 'phrase';
  if (activity.type?.startsWith('teach_')) return 'teaching';
  return '';
};

const rows = [];
const coverage = [];
for (const language of languages) {
  const definition = guidedCourseForLanguage(language);
  const courseRoot = new URL(`library/courses/${definition.directory}/`, root);
  const course = JSON.parse(fs.readFileSync(new URL('course.json', courseRoot), 'utf8'));
  const summary = course.units.find(unit => unit.id === 'reading-foundations' || unit.id === 'hangul-foundations');
  if (!summary) throw new Error(`${language}: no se encontró la unidad de fundamentos`);
  const unit = JSON.parse(fs.readFileSync(new URL(summary.manifest, courseRoot), 'utf8'));
  const activities = unit.lessons.flatMap(lesson => (lesson.isReview || lesson.isTest ? [] : lesson.activities.map(activity => ({...activity, lesson_id: lesson.id}))));
  const selected = [];
  for (const [kind, count] of Object.entries(quota)) {
    const candidates = activities.filter(activity => category(activity) === kind && (activity.audio || activity.audio_examples?.length || activity.word_breakdown?.length));
    for (const activity of spread(candidates, count)) {
      selected.push({language, region:'', reviewer:'', activity_id:activity.id, lesson_id:activity.lesson_id, audio_key:activity.audio || activity.slow_audio || '', text:activity.target || activity.prompt || '', meaning:activity.meaning || '', source_type:activity.audio_source || (activity.tts_fallback ? 'tts' : 'recording'), category:kind, pronunciation_score:'', naturalness_score:'', regional_fit:'', sync:'', issue_severity:'', verdict:'', comment:''});
    }
    coverage.push({language, category:kind, requested:count, selected:Math.min(candidates.length, count)});
  }
  const selectedIds = new Set(selected.map(activity => activity.activity_id));
  const supplements = activities.filter(activity => !selectedIds.has(activity.id) && (activity.audio || activity.slow_audio || activity.audio_examples?.length));
  for (const activity of spread(supplements, Math.max(0, 24 - selected.length))) {
    selected.push({language, region:'', reviewer:'', activity_id:activity.id, lesson_id:activity.lesson_id, audio_key:activity.audio || activity.slow_audio || '', text:activity.target || activity.prompt || '', meaning:activity.meaning || '', source_type:activity.audio_source || (activity.tts_fallback ? 'tts' : 'recording'), category:category(activity) || 'supplement', pronunciation_score:'', naturalness_score:'', regional_fit:'', sync:'', issue_severity:'', verdict:'', comment:''});
  }
  rows.push(...selected);
}

const headers = ['language','region','reviewer','activity_id','lesson_id','audio_key','text','meaning','source_type','category','pronunciation_score','naturalness_score','regional_fit','sync','issue_severity','verdict','comment'];
const output = [headers, ...rows.map(row => headers.map(header => csvCell(row[header])))].map(row => row.join(',')).join('\n') + '\n';
fs.writeFileSync(new URL('docs/native_review_samples.csv', root), output);
fs.writeFileSync(new URL('docs/native_review_samples.json', root), JSON.stringify({date:new Date().toISOString(),scope:'Muestra inicial determinista de fundamentos para revisión nativa.',rows,coverage}, null, 2) + '\n');
console.log(JSON.stringify({rows:rows.length, coverage}, null, 2));
