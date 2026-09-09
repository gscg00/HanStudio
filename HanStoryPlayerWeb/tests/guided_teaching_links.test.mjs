import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveTeachingLinks} from '../src/guided_teaching_links.js';
import {buildLearningIndex,learningFeedback} from '../src/guided_learning_feedback.js';
const teach={id:'teach',type:'teach_concept',target:'a',explanation:'Regla',audio:'a'};
test('solo permite referencias a enseñanza anterior, no futura, propia o preguntas',()=>{
 const question={id:'q',type:'select_translation',teaching_refs:['teach','future','q','other','missing']};
 const result=resolveTeachingLinks([teach,{id:'other',type:'select_translation'},question,{...teach,id:'future'}],2);
 assert.deepEqual(result.sources,[teach]);assert.deepEqual(result.invalid,['future','q','other','missing']);
 for(const refs of [[],null,'teach'])assert.ok(resolveTeachingLinks([{teaching_refs:refs}],0).invalid.length);
});
test('referencias inválidas no añaden una explicación parcial que parezca validada',()=>{
 const q={id:'q',type:'select_translation',target:'regla',answer:'x',teaching_refs:['teach','missing']};
 const help=learningFeedback(q,'y',buildLearningIndex({lessons:[{activities:[teach,q]}]}));
 assert.deepEqual(help.references,[]);
});
test('las preguntas conceptuales y las escuchas de Hangul recuperan enseñanza previa',()=>{
 const unit=JSON.parse(fs.readFileSync(new URL('../library/courses/Korean/units/hangul-foundations.json',import.meta.url),'utf8'));
 const index=buildLearningIndex(unit);let questions=0;
 for(const lesson of unit.lessons)for(let i=0;i<lesson.activities.length;i++){
  const a=lesson.activities[i];if(!a.teaching_refs)continue;
  const links=resolveTeachingLinks(lesson.activities,i);assert.deepEqual(links.invalid,[]);
  const help=learningFeedback(a,'wrong',index);assert.equal(help.references.length,a.teaching_refs.length);
  assert.ok(help.references.every(r=>r.notes.length));
  for(const source of links.sources)assert.equal(help.references.find(ref=>ref.form===source.target)?.audio||'',source.audio||'');
  for(const source of links.sources)if(source.sound_hint)assert.ok(help.references.some(ref=>ref.notes.includes(source.sound_hint)));
  questions++;
 }
 assert.ok(questions>=20,'No perder cobertura de ayuda al reorganizar las tarjetas.');
});
