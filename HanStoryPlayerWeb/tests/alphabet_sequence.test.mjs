import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sequenceAlphabetLessons} from '../scripts/alphabet_sequence.mjs';
for(const language of ['English','French','German','Italian','Portuguese','Russian','Arabic'])test(`${language}: todas las opciones del alfabeto se enseñan antes de evaluarlas`,()=>{
 const unit=JSON.parse(fs.readFileSync(new URL(`../library/courses/${language}/units/reading-foundations.json`,import.meta.url)));
 const seen=new Set();let count=0;
 for(const lesson of unit.lessons){
  if(!/^Alfabeto \d+/.test(lesson.title||''))continue;
  for(const a of lesson.activities){
   if(a.type==='teach_concept')seen.add(a.target);
   if(a.type==='listening_choice'){
    assert.ok(a.options.length>=2,a.id);
    for(const option of a.options)assert.ok(seen.has(option),`${a.id}: ${option}`);
    assert.ok(a.options.includes(a.answer));count++;
   }
  }
 }
 assert.ok(count>20);
 const before=JSON.stringify(unit.lessons);sequenceAlphabetLessons(unit.lessons);
 assert.equal(JSON.stringify(unit.lessons),before);
});
