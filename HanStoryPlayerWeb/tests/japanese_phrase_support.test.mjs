import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {PHRASE_SUPPORT_BY_LANGUAGE} from '../src/guided_phrase_metadata.js';

const unit=JSON.parse(fs.readFileSync(new URL('../library/courses/Japanese/units/a1-1-identity.json',import.meta.url),'utf8'));
const expected=PHRASE_SUPPORT_BY_LANGUAGE.Japanese;

test('las frases japonesas iniciales tienen desglose palabra por palabra revisado',()=>{
  const teaching=unit.lessons.flatMap(lesson=>lesson.activities||[]).filter(activity=>activity.type==='teach_concept');
  for(const [target,support] of Object.entries(expected)){
    const activity=teaching.find(item=>item.target===target);
    assert.ok(activity,`falta la tarjeta ${target}`);
    assert.deepEqual(activity.word_breakdown,support.word_breakdown);
    assert.equal(activity.usage_note,support.usage_note);
    assert.equal(activity.word_breakdown.map(part=>part.text).join(''),target.replace(/[。？]/gu,''));
  }
});

test('las partículas japonesas conservan escritura y envían la lectura contextual al TTS',()=>{
  assert.ok(expected['私の名前はアナです。'].word_breakdown.some(part=>part.text==='は'&&part.speech_text==='わ'));
  assert.ok(expected['日本語を少し話します。'].word_breakdown.some(part=>part.text==='を'&&part.speech_text==='お'));
});
