import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {phraseAudioExamples} from '../src/guided_phrase_support.js';

const unit=JSON.parse(fs.readFileSync(new URL('../library/courses/Russian/units/reading-foundations.json',import.meta.url)));
const activity=id=>unit.lessons.flatMap(lesson=>lesson.activities).find(item=>item.id===id);

test('las vocales rusas se explican una vez y cada tarjeta solo reproduce su grafía',()=>{
 const expected={
  'russian-reading-00-12-a-teach':['А','Я','О','Ё','У','Ю'],
  'russian-reading-00-12-b-teach':['Э','Е','Ы','И'],
 };
 for(const [id,forms] of Object.entries(expected)){
  const examples=phraseAudioExamples(activity(id));
  assert.deepEqual(examples.map(item=>item.text),forms,id);
  assert.ok(examples.every(item=>!item.label&&!item.meaning),id);
 }
});
