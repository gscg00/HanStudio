import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateGuidedAnswer} from '../src/guided_course_answers.js';
import {productionPresentation} from '../src/guided_activity_quality.js';
const specs=JSON.parse(fs.readFileSync(new URL('../course-authoring/reading_audio_checkpoints.json',import.meta.url),'utf8'));
for(const [language,repairs] of Object.entries(specs))test(`${language}: ejercicio auditivo usa ejemplos enseñados y acepta su forma escrita`,()=>{
  const unit=JSON.parse(fs.readFileSync(new URL(`../library/courses/${language}/units/reading-foundations.json`,import.meta.url),'utf8'));
  const checkpointIndex=unit.lessons.findIndex(l=>l.generatedProduction);
  const earlier=unit.lessons.slice(0,checkpointIndex).flatMap(l=>l.activities);
  const manifest=JSON.parse(fs.readFileSync(new URL(`../library/courses/${language}/audio_manifest.json`,import.meta.url),'utf8')).items;
  for(const [suffix,spec] of Object.entries(repairs)){
    const a=unit.lessons[checkpointIndex].activities.find(a=>a.id.endsWith(`-production-${suffix}`));
    assert.ok(earlier.some(a=>a.id===spec.source_id),spec.source_id);
    assert.ok(earlier.some(a=>a.type.startsWith('teach')&&(a.audio===spec.audio||(a.audio_examples||[]).some(e=>e.audio===spec.audio))),`${language}: audio no enseñado`);
    assert.ok(manifest[spec.audio],`${language}: archivo ausente ${spec.audio}`);
    assert.equal(a.audio,spec.audio);assert.equal(a.answer,spec.answer);
    assert.equal(productionPresentation(a).instruction,spec.instruction);
    assert.equal(evaluateGuidedAnswer(a,spec.answer,language).correct,true);
    assert.equal(evaluateGuidedAnswer(a,'xyz',language).correct,false);
    assert.ok(!a.instruction.includes(`«${a.answer}»`),'la instrucción revela la respuesta');
  }
});
