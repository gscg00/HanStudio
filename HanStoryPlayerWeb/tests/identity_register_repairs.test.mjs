import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const cases = {
  German: ['Wie heißen Sie?', '¿Cómo se llama?', 'tratamiento formal', false],
  French: ['Comment vous appelez-vous ?', '¿Cómo se llama?', 'tratamiento formal', true],
  Portuguese: ['Como se chama?', '¿Cómo se llama?', 'tratamiento formal o neutral', false],
  Russian: ['Как вас зовут?', '¿Cómo se llama?', 'tratamiento formal', true],
};

for (const [language, [form, meaning, note, allUnits]] of Object.entries(cases)) {
  test(`${language}: registro formal coherente en A1.1`, () => {
    const unitsDir = path.join('library', 'courses', language, 'units');
    const files = allUnits ? fs.readdirSync(unitsDir).filter(file => file.endsWith('.json')) : ['a1-1-identity.json'];
    const activities = files.flatMap(file => {
      const unit = JSON.parse(fs.readFileSync(path.join(unitsDir, file), 'utf8'));
      return unit.lessons.flatMap(lesson => lesson.activities || []);
    });
    const matches = activities.filter(activity => String(activity.target || activity.answer || activity.audio || '').trim() === form);
    assert.ok(matches.length >= 3, `${language}: faltan repeticiones de ${form}`);
    assert.ok(matches.every(activity => JSON.stringify(activity).includes(meaning)), `${language}: falta el significado formal`);
    assert.ok(matches.every(activity => !JSON.stringify(activity).includes('¿Cómo te llamas?')), `${language}: quedó una traducción informal`);
    assert.ok(matches.every(activity => String(activity.usage_note || '').includes(note)), `${language}: falta la nota de registro`);
    const dialogue = activities.find(activity => activity.type === 'guided_dialogue' && JSON.stringify(activity).includes(form));
    assert.ok(JSON.stringify(dialogue).includes(meaning), `${language}: diálogo desalineado`);
  });
}
