import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const cases = {
  Portuguese: ['Chamo-me Ana.', 'variante europea'],
  Korean: ['좋은 아침이에요', 'saludo general más frecuente'],
};

for (const [language, [form, expected]] of Object.entries(cases)) {
  test(`${language}: la expresión regional lleva contexto de uso`, () => {
    const unit = JSON.parse(fs.readFileSync(path.join('library', 'courses', language, 'units', 'a1-1-identity.json'), 'utf8'));
    const activities = unit.lessons.flatMap(lesson => lesson.activities || []);
    const matches = activities.filter(activity => String(activity.target || activity.answer || '').trim() === form);
    assert.ok(matches.length >= 3, `${language}: faltan repeticiones de ${form}`);
    assert.ok(matches.every(activity => String(activity.usage_note || '').includes(expected)), `${language}: falta la nota de uso`);
  });
}
