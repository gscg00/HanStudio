import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const unit=JSON.parse(fs.readFileSync(new URL('../library/courses/Japanese/units/reading-foundations.json',import.meta.url),'utf8'));
const source=fs.readFileSync(new URL('../src/japanese_course_app.js',import.meta.url),'utf8');

test('las vocales iniciales de japonés se muestran como tarjetas de sonido mínimas',()=>{
  const activities=unit.lessons.flatMap(lesson=>lesson.activities);
  const vowels=activities.find(activity=>activity.id==='japanese-reading-00-01-a-teach');
  assert.deepEqual(vowels.audio_examples.map(item=>item.text),['あ','い','う','え','お']);
  assert.ok(vowels.audio_examples.every(item=>!item.label&&!item.meaning),'cada vocal no debe repetir una etiqueta ni una pseudo-traducción');
  assert.match(source,/jp-audio-examples-compact/,'la interfaz debe reconocer una serie de sonidos mínimos');
});
