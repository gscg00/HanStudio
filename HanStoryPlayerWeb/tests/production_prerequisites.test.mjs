import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const languages = ['English', 'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic'];
const productionTypes = new Set([
  'typed_translation', 'dictation', 'build_with_blocks', 'complete_without_options',
  'transform_sentence', 'open_question', 'speak_and_transcribe', 'guided_dialogue', 'stage_scenario',
]);

const collectStrings = (value, output) => {
  if (value == null) return;
  if (typeof value === 'string') {
    if (value.trim()) output.push(value.trim());
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, output);
    return;
  }
  if (typeof value === 'object') {
    for (const item of Object.values(value)) collectStrings(item, output);
  }
};

test('la producción A1.1/A1.2 usa modelos o vocabulario enseñados previamente', () => {
  for (const language of languages) {
    const unitsDir = `library/courses/${language}/units`;
    const files = fs.readdirSync(unitsDir).filter(file => /^a1-[12]-/.test(file) && file.endsWith('.json'));
    for (const file of files) {
      const unit = JSON.parse(fs.readFileSync(`${unitsDir}/${file}`, 'utf8'));
      const seen = [];
      for (const lesson of unit.lessons || []) {
        for (const activity of lesson.activities || []) {
          const checkpoint = lesson.id.includes('production-checkpoint') && productionTypes.has(activity.type);
          if (checkpoint) {
            // Se exige enseñanza previa del modelo. Las variantes aceptadas
            // (sin 저는, con cifras, 어디서…) solo amplían lo que se da por
            // correcto: no se muestran como modelo y no necesitan su propia lección.
            const answers = ['guided_dialogue', 'stage_scenario'].includes(activity.type)
              ? (activity.turns || []).filter(turn => turn.role === 'learner').map(turn => turn.answer)
              : [activity.answer];
            for (const answer of answers) {
              const expected = String(answer || '').trim();
              if (!expected) continue;
              const covered = seen.some(value => value === expected || (activity.type === 'complete_without_options' && value.includes(expected)));
              assert.ok(covered, `${language}/${lesson.id}/${activity.id}: falta enseñanza previa para «${expected}»`);
            }
          } else {
            collectStrings(activity, seen);
          }
        }
      }
    }
  }
});
