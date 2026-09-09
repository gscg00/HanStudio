import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {evaluateGuidedAnswer} from '../src/guided_course_answers.js';
for(const [language,feminine] of Object.entries({French:'Tu es déjà allée là-bas ?',Italian:'Sei mai stata lì?',Russian:'Ты когда-нибудь там была?'})){
  test(`${language}: pregunta sin género admite ambas formas; dictado conserva el modelo`,()=>{
    const unit=JSON.parse(fs.readFileSync(new URL(`../library/courses/${language}/units/b1-1-narrative.json`,import.meta.url),'utf8'));
    const activity=unit.lessons.flatMap(lesson=>lesson.activities).find(item=>item.id.endsWith('-production-open'));
    assert.ok(activity.prompt.includes('¿Alguna vez has estado allí?'));
    assert.equal(evaluateGuidedAnswer(activity,feminine,language).correct,true);
    assert.equal(evaluateGuidedAnswer(activity,activity.answer,language).correct,true);
    assert.equal(evaluateGuidedAnswer({type:'dictation',answer:activity.answer},feminine,language).correct,false);
  });
}
