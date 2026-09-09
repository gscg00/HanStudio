import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateGuidedAnswer} from '../src/guided_course_answers.js';
import {resultCases} from './result_variants_cases.mjs';
for(const [language,answer,alternative,negative] of resultCases){
 test(`${language}: admite una consecuencia equivalente sin aceptar su negación`,()=>{
  for(const type of ['typed_translation','open_question']){
   const activity={type,answer,allow_minor_typos:true};
   assert.equal(evaluateGuidedAnswer(activity,alternative,language).correct,true);
   assert.equal(evaluateGuidedAnswer(activity,negative,language).correct,false);
   assert.equal(evaluateGuidedAnswer({...activity,answer_policy:'exact'},alternative,language).correct,false);
   assert.equal(evaluateGuidedAnswer({...activity,tags:['copying']},alternative,language).correct,false);
  }
  for(const type of ['dictation','speak_and_transcribe','build_with_blocks','transform_sentence']){
   assert.equal(evaluateGuidedAnswer({type,answer},alternative,language).correct,false);
  }
  const dialogue={type:'guided_dialogue',turns:[{role:'learner',answer,response_type:'open_question'}]};
  assert.equal(evaluateGuidedAnswer(dialogue,{responses:[alternative]},language).correct,true);
  assert.equal(evaluateGuidedAnswer(dialogue,{responses:[negative]},language).correct,false);
 });
}
