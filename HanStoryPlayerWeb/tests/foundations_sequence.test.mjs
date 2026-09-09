import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const courses = [
  ['English', 'reading-foundations.json'],
  ['French', 'reading-foundations.json'],
  ['German', 'reading-foundations.json'],
  ['Italian', 'reading-foundations.json'],
  ['Portuguese', 'reading-foundations.json'],
  ['Russian', 'reading-foundations.json'],
  ['Arabic', 'reading-foundations.json'],
  ['Chinese', 'reading-foundations.json'],
  ['Japanese', 'reading-foundations.json'],
  ['Korean', 'hangul-foundations.json'],
];

const teachingTypes = new Set(['teach_concept', 'teach_word', 'teach_pattern', 'teach_kana', 'teach_kanji']);
const values = activity => new Set([activity.target, activity.answer, activity.audio].map(value => String(value || '').trim()).filter(Boolean));

test('cada escucha de fundamentos tiene un modelo enseñado antes y no revela su respuesta', () => {
  for (const [language, unitFile] of courses) {
    const unit = JSON.parse(fs.readFileSync(new URL(`../library/courses/${language}/units/${unitFile}`, import.meta.url)));
    const taught = new Set();
    for (const lesson of unit.lessons || []) {
      for (const activity of lesson.activities || []) {
        if (teachingTypes.has(activity.type)) {
          for (const value of values(activity)) taught.add(value);
          continue;
        }
        if (activity.type !== 'listening_choice') continue;
        const modelValues = values(activity);
        assert.ok(
          [...modelValues].some(value => taught.has(value)),
          `${language}/${lesson.id}/${activity.id}: no hay modelo previo para ${activity.answer || activity.audio || activity.target}`,
        );
        const prompt = String(activity.prompt || '');
        for (const value of [activity.answer, activity.target]) {
          const token = String(value || '').trim();
          if (token) assert.ok(!new RegExp(`(?:^|[^\\p{L}])${token.replace(/[.*+?^${}()|[\\]\\]/g, '\\\\$&')}(?:$|[^\\p{L}])`, 'u').test(prompt), `${language}/${activity.id}: la consigna revela ${token}`);
        }
      }
    }
  }
});

test('las tarjetas iniciales con varias grafías ofrecen un audio identificable por ejemplo', () => {
  for (const [language, unitFile] of courses) {
    const unit = JSON.parse(fs.readFileSync(new URL(`../library/courses/${language}/units/${unitFile}`, import.meta.url)));
    for (const lesson of unit.lessons || []) {
      for (const activity of lesson.activities || []) {
        if (!teachingTypes.has(activity.type)) continue;
        const target = String(activity.target || '');
        if (!activity.audio || !/(?:·|\/)/u.test(target)) continue;
        assert.ok(
          (activity.audio_examples || []).length >= 2,
          `${language}/${activity.id}: ${target} muestra varias grafías pero solo un audio`,
        );
      }
    }
  }
});
