import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sequenceKoreanVowels} from '../scripts/korean_vowel_sequence.mjs';
test('seis escuchas de vocales usan sílabas enseñadas sin revelar la vocal en la consigna',()=>{
 const unit=JSON.parse(fs.readFileSync(new URL('../library/courses/Korean/units/hangul-foundations.json',import.meta.url)));
 const seen=new Set();let count=0;
 for(const lesson of unit.lessons.filter(l=>/vowels-(vertical|horizontal)$/.test(l.id)))for(const a of lesson.activities){
  if(a.type==='teach_concept')seen.add(a.audio);
  if(a.type==='listening_choice'){
   assert.equal(a.options.length,3);
   for(const option of a.options)assert.ok(seen.has(option),`${a.id}: ${option}`);
   assert.equal(a.audio,a.answer);
   assert.doesNotMatch(a.prompt,/[ㅏ-ㅣ가-힣]/);
   count++;
  }
 }
 assert.equal(count,6);
 const layouts=Object.fromEntries(unit.lessons.flatMap(lesson=>lesson.activities).filter(a=>a.id.endsWith('-layout')).map(a=>[a.id,a]));
 assert.equal(layouts['korean-hangul-00-vowels-layout'].target,'ㅇ + ㅏ = 아');
 assert.equal(layouts['korean-hangul-00-vowels-horizontal-layout'].target,'ㅇ + ㅜ = 우');
 const before=JSON.stringify(unit.lessons);sequenceKoreanVowels(unit.lessons);
 assert.equal(JSON.stringify(unit.lessons),before);
});

test('la introducción del hangeul no exige leer una sílaba antes de enseñar sus componentes',()=>{
 const unit=JSON.parse(fs.readFileSync(new URL('../library/courses/Korean/units/hangul-foundations.json',import.meta.url)));
 const system=unit.lessons.find(lesson=>lesson.id==='korean-hangul-00-system');
 const block=system.activities.find(activity=>activity.id==='korean-hangul-00-system-block');
 assert.equal(block.type,'teach_concept');
 assert.equal(block.target,'inicial + vocal + final = bloque');
 assert.doesNotMatch(block.target,/ㅎ|ㅏ|ㄴ|한/);
 assert.ok(system.activities.findIndex(activity=>activity.id===block.id)>0);
});
