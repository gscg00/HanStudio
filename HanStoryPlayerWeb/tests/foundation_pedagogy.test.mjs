import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {repairFoundationPedagogy} from '../scripts/foundation_pedagogy.mjs';
const languages=['Arabic','Chinese','English','French','German','Italian','Japanese','Korean','Portuguese','Russian'];
const read=language=>JSON.parse(fs.readFileSync(new URL(`../library/courses/${language}/units/${language==='Korean'?'hangul':'reading'}-foundations.json`,import.meta.url)));
const activities=language=>read(language).lessons.flatMap(l=>l.activities);
const byId=(language,id)=>activities(language).find(a=>a.id===id);
test('word and vowel models do not play unrelated letter names',()=>{
 for(const [language,id,expected] of [
  ['English','english-reading-00-08-a-teach','cat'],
  ['German','german-reading-00-12-a-teach','Strumpf'],
  ['Italian','italian-reading-00-06-b-teach','casa'],
  ['Portuguese','portuguese-reading-00-09-b-teach','chave'],
  ['Russian','russian-reading-00-10-b-teach','мама'],
 ]){
  const a=byId(language,id);assert.equal(a.audio,'');assert.ok(a.audio_examples.some(e=>e.audio===expected),id);
 }
 const vowels=byId('Arabic','arabic-reading-00-11-a-teach');
 assert.equal(vowels.audio,'');assert.deepEqual(vowels.audio_examples.map(e=>e.audio),['بَ','بِ','بُ']);
});
test('Japanese teaching, review and test distinguish small ya from the mora of small tsu',()=>{
 const items=activities('Japanese').filter(a=>a.target==='きゃ · っ'&&!a.tags?.includes('production'));assert.equal(items.length,4);
 for(const a of items){assert.match(a.explanation,/っ sí ocupa una mora/);assert.match(a.explanation,/き・っ・て/);if(a.answer)assert.equal(a.answer,'Tres');}
});
test('Korean auditory alternatives have all been taught before they are contrasted',()=>{
 const known=new Set();let checks=0;
 for(const a of activities('Korean')){
  if(['teach_concept','teach_word'].includes(a.type)){if(a.audio)known.add(a.audio);for(const e of a.audio_examples||[])known.add(e.audio);}
  if(a.type==='listening_choice')for(const option of a.options){assert.ok(known.has(option),`${a.id}: ${option} not previously taught`);checks++;}
 }
 assert.ok(checks>60);
 const batchim=read('Korean').lessons.find(l=>l.id==='korean-hangul-00-batchim');
 assert.ok(batchim.activities.findIndex(a=>a.id==='korean-hangul-00-batchim-h')<batchim.activities.findIndex(a=>a.id==='korean-hangul-00-batchim-han'));
 const ng=byId('Korean','korean-hangul-00-consonants-ng');
 assert.deepEqual(ng.audio_examples.map(e=>e.audio),['가','강']);assert.ok(!ng.memory_hint.includes('한'));
});
test('editorial repairs preserve production and are idempotent in all ten courses',()=>{
 for(const language of languages){
  const unit=read(language),production=JSON.stringify(unit.lessons.filter(l=>l.generatedProduction));
  const manifest=JSON.parse(fs.readFileSync(new URL(`../library/courses/${language}/audio_manifest.json`,import.meta.url))).items;
  repairFoundationPedagogy(unit,language,manifest);const first=JSON.stringify(unit);
  repairFoundationPedagogy(unit,language,manifest);assert.equal(JSON.stringify(unit),first,language);
  assert.equal(JSON.stringify(unit.lessons.filter(l=>l.generatedProduction)),production,language);
 }
});
