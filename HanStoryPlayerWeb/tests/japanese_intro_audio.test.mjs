import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {phraseAudioExamples} from '../src/guided_phrase_support.js';
const unit=JSON.parse(fs.readFileSync(new URL('../library/courses/Japanese/units/reading-foundations.json',import.meta.url)));
const activity=id=>unit.lessons.flatMap(lesson=>lesson.activities).find(item=>item.id===id);
const manifest=JSON.parse(fs.readFileSync(new URL('../library/courses/Japanese/audio_manifest.json',import.meta.url))).items;
test('las cinco vocales japonesas iniciales se escuchan una por una',()=>{
 for(const id of ['japanese-reading-00-01-a-teach','japanese-reading-00-02-a-teach']){
  const examples=phraseAudioExamples(activity(id));
  assert.deepEqual(examples.map(item=>item.text),['あ','い','う','え','お']);
  assert.deepEqual(examples.map(item=>item.audio),['あ','い','う','え','お']);
  assert.ok(examples.every(item=>!item.label&&!item.meaning));
 }
});
test('la tarjeta katakana reproduce el signo que muestra',()=>{
 const examples=phraseAudioExamples(activity('japanese-reading-00-01-b-teach'));
 assert.deepEqual(examples.map(item=>[item.text,item.audio]),[['ア','ア']]);
});
test('cada contraste japonés de lectura aporta los audios que muestra',()=>{
 const expected={
  'japanese-reading-00-03-a-teach':['か','き','く','け','こ'],
  'japanese-reading-00-03-b-teach':['し','ち','つ','ふ'],
  'japanese-reading-00-04-a-teach':['が','ぱ'],
  'japanese-reading-00-04-b-teach':['きゃ','きって'],
  'japanese-reading-00-05-a-teach':['おばさん','おばあさん'],
 };
 for(const [id,forms] of Object.entries(expected)){
  const examples=phraseAudioExamples(activity(id));
  assert.deepEqual(examples.map(item=>item.audio),forms,id);
  assert.ok(examples.every(item=>manifest[item.audio]),id);
 }
});
