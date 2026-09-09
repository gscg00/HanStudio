import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateGuidedAnswer} from '../src/guided_course_answers.js';
for(const [language,answer,wrong] of [['French','où','ou'],['German','schön','schon'],['Italian','è','e'],['Portuguese','avó','avô'],['English','résumé','resume']]){
 test(`${language}: conserva diacríticos y explica la diferencia`,()=>{
  for(const type of ['typed_translation','dictation','select_translation']){
   const a={type,answer,allow_minor_typos:true};
   const result=evaluateGuidedAnswer(a,wrong,language);
   assert.equal(result.correct,false);assert.match(result.orthographyHint,/acentos/);
   assert.equal(evaluateGuidedAnswer(a,answer.normalize('NFD'),language).correct,true);
   assert.equal(evaluateGuidedAnswer({...a,accepted_answers:[wrong]},wrong,language).correct,true);
  }
 });
}
test('no confunde otros errores con acentos',()=>{
 assert.equal(evaluateGuidedAnswer({type:'dictation',answer:'bonjour'},'bonsoir','French').orthographyHint,'');
});
test('árabe: conserva letras diferentes aunque permita omitir vocalización',()=>{
 for(const [answer,given] of [['على','علي'],['أ','ا'],['إ','ا'],['آ','ا']]){
  assert.equal(evaluateGuidedAnswer({type:'typed_translation',answer},given,'Arabic').correct,false);
 }
 assert.equal(evaluateGuidedAnswer({type:'typed_translation',answer:'أَهْلًا'},'أهلا','Arabic').correct,true);
});
