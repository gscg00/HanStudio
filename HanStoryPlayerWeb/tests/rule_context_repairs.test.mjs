import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {ZERO_COURSES} from '../src/data/zero_courses.js';

const read=(language,file)=>JSON.parse(fs.readFileSync(new URL(`../library/courses/${language}/units/${file}`,import.meta.url)));
const activities=(language,file)=>read(language,file).lessons.flatMap(lesson=>lesson.activities||[]);
const byTarget=(items,target)=>items.find(activity=>String(activity.target||'').trim()===target);

test('las reglas con variantes explican la elección y muestran ejemplos completos',()=>{
  const english=byTarget(activities('English','essentials.json'),'short / long vowels');
  assert.match(english.explanation,/vocal corta.*vocal larga/i);
  const japanese=ZERO_COURSES.Japanese.stages.flatMap(stage=>stage.items||[]).find(item=>item.symbol==='は / へ / を');
  assert.match(japanese.explanation,/wa, e, o/i);
  const particles=ZERO_COURSES.Japanese.stages.flatMap(stage=>stage.items||[]).find(item=>item.symbol==='に / で');
  assert.deepEqual(particles.speakExamples,['がっこうに いきます','がっこうで べんきょうします']);
  assert.deepEqual(particles.exampleExamples,['学校に行きます。','学校で勉強します。']);
  assert.match(particles.explanation,/学校に行きます.*学校で勉強します/s);
  const particleContrast=ZERO_COURSES.Japanese.stages.flatMap(stage=>stage.items||[]).find(item=>item.symbol==='は / へ / を');
  assert.equal(particleContrast.speakExamples.length,3);
  assert.equal(particleContrast.exampleExamples.length,3);
  const existence=ZERO_COURSES.Japanese.stages.flatMap(stage=>stage.items||[]).find(item=>item.symbol==='あります / います');
  assert.deepEqual(existence.exampleExamples,['本があります。','猫がいます。']);
  const chinese=activities('Chinese','essentials.json');
  assert.match(byTarget(chinese,'b / p').explanation,/no aspirada/i);
  assert.match(byTarget(chinese,'j / q / x').explanation,/fricativa/i);
  const german=byTarget(activities('German','essentials.json'),'der / die / das');
  assert.match(german.explanation,/masculino.*femenino.*plural.*neutro/i);
  const russian=byTarget(activities('Russian','survival.json'),'В / Н / Р / С / У / Х');
  assert.match(russian.explanation,/В suena v.*Н n.*Р r/i);
  const italian=byTarget(activities('Italian','essentials.json'),'il / lo / la');
  assert.equal(italian.audio_examples.length,3);assert.ok(italian.audio_examples.some(example=>example.text==='lo zaino'));
  const french=byTarget(activities('French','essentials.json'),'le / la / les');
  assert.equal(french.audio_examples.length,3);assert.ok(french.audio_examples.some(example=>example.text==='les livres'));
});
