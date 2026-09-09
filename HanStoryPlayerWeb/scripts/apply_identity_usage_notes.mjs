#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const notes = {
  French: {
    'bon matin': 'Uso regional y familiar, especialmente en Quebec; para un saludo neutro en la mayor parte de la francofonía se usa «bonjour».',
  },
  Portuguese: {
    'Chamo-me Ana.': 'Forma natural en portugués europeo. En Brasil también son comunes «Eu me chamo Ana» y «Meu nome é Ana»; aquí se practica la variante europea.',
  },
  Korean: {
    '좋은 아침이에요': 'Literalmente «es una buena mañana». Es un saludo posible por la mañana; «안녕하세요» es el saludo general más frecuente.',
  },
};

let changed = 0;
for (const [language, languageNotes] of Object.entries(notes)) {
  const unitPath = path.join(root, 'library', 'courses', language, 'units', 'a1-1-identity.json');
  const unit = JSON.parse(fs.readFileSync(unitPath, 'utf8'));
  for (const lesson of unit.lessons || []) {
    for (const activity of lesson.activities || []) {
      const form = String(activity.target || activity.answer || '').trim();
      const note = languageNotes[form];
      if (!note) continue;
      if (activity.usage_note === note) continue;
      activity.usage_note = note;
      changed += 1;
    }
  }
  fs.writeFileSync(unitPath, JSON.stringify(unit, null, 2) + '\n');
}
console.log(`Notas de uso aplicadas: ${changed}`);
