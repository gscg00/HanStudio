#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const repairs = {
  German: {
    form: 'Wie heißen Sie?',
    oldMeaning: '¿Cómo te llamas?',
    meaning: '¿Cómo se llama?',
    note: 'Sie es el tratamiento formal (o plural). La forma informal singular es «Wie heißt du?».',
  },
  French: {
    form: 'Comment vous appelez-vous ?',
    oldMeaning: '¿Cómo te llamas?',
    meaning: '¿Cómo se llama?',
    note: 'Vous marca un tratamiento formal o plural. La forma informal singular es «Comment tu t’appelles ?».',
    allUnits: true,
  },
  Portuguese: {
    form: 'Como se chama?',
    oldMeaning: '¿Cómo te llamas?',
    meaning: '¿Cómo se llama?',
    note: 'Como se chama? usa un tratamiento formal o neutral; en portugués brasileño también son comunes «Como você se chama?» y «Qual é o seu nome?».',
  },
  Russian: {
    form: 'Как вас зовут?',
    oldMeaning: '¿Cómo te llamas?',
    meaning: '¿Cómo se llama?',
    note: 'Вас se usa como tratamiento formal o plural. La forma informal singular es «Как тебя зовут?».',
    allUnits: true,
  },
};

let changed = 0;
for (const [language, repair] of Object.entries(repairs)) {
  const unitsDir = path.join(root, 'library', 'courses', language, 'units');
  const unitPaths = repair.allUnits
    ? fs.readdirSync(unitsDir).filter(file => file.endsWith('.json')).map(file => path.join(unitsDir, file))
    : [path.join(unitsDir, 'a1-1-identity.json')];
  for (const unitPath of unitPaths) {
    const unit = JSON.parse(fs.readFileSync(unitPath, 'utf8'));
  for (const lesson of unit.lessons || []) {
    for (const activity of lesson.activities || []) {
      const containsForm = [activity.target, activity.answer, activity.audio].some(value => String(value || '').trim() === repair.form);
      if (!containsForm && activity.type !== 'guided_dialogue') continue;
      const before = JSON.stringify(activity);
      const replaceMeaning = value => String(value || '').replaceAll(repair.oldMeaning, repair.meaning);
      const replaceDeep = value => {
        if (typeof value === 'string') return replaceMeaning(value);
        if (Array.isArray(value)) return value.map(replaceDeep);
        if (value && typeof value === 'object') {
          return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceDeep(item)]));
        }
        return value;
      };
      Object.assign(activity, replaceDeep(activity));
      if (containsForm) {
        activity.usage_note = repair.note;
        if (activity.type === 'teach_concept' && !JSON.stringify(activity).includes(repair.meaning)) {
          activity.explanation = activity.explanation
            ? `${activity.explanation} Formal: «${repair.meaning}».`
            : repair.meaning;
        }
      }
      if (JSON.stringify(activity) !== before) changed += 1;
    }
  }
  fs.writeFileSync(unitPath, JSON.stringify(unit, null, 2) + '\n');
  }
}
console.log(`Reparaciones de registro aplicadas: ${changed}`);
