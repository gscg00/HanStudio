import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {evaluateGuidedAnswer} from '../src/guided_course_answers.js';

const read=path=>JSON.parse(fs.readFileSync(new URL(`../library/courses/Korean/${path}`,import.meta.url)));
const course=read('course.json');
const order=course.levels.flatMap(level=>level.unitIds);
const units=Object.fromEntries(order.map(id=>[id,read(`units/${id}.json`)]));
const activities=id=>units[id].lessons.flatMap(lesson=>lesson.activities);
const taught=id=>new Set(activities(id).filter(activity=>activity.type?.startsWith('teach_')).map(activity=>activity.target));

test('todas las vocales, tensas y diptongos se enseñan antes de survival',()=>{
  const before=new Set(order.slice(0,order.indexOf('survival')).flatMap(id=>[...taught(id)]));
  for(const letter of ['ㅐ','ㅔ','ㅒ','ㅖ','ㄲ','ㄸ','ㅃ','ㅆ','ㅉ','ㅘ','ㅝ','ㅙ','ㅞ','ㅚ','ㅟ','ㅢ'])assert.ok(before.has(letter),letter);
  assert.ok(before.has('한국어')&&before.has('감사합니다'),'falta la lección de pronunciación encadenada');
});

test('essentials enseña a conjugar en -아요/-어요 y a negar con 안',()=>{
  const items=taught('essentials');
  for(const form of ['가요','먹어요','마셔요','해요','안 먹어요'])assert.ok(items.has(form),form);
});

test('la unidad time ya no repite survival',()=>{
  const survival=taught('survival'),time=[...taught('time')];
  assert.ok(time.length>=25);
  assert.equal(time.filter(target=>survival.has(target)).length,0);
});

test('no quedan ejemplos en forma de diccionario ni traducciones erróneas conocidas',()=>{
  const text=JSON.stringify([units.vocabulary,units['reading-bridge'],units['story-bridge']]);
  for(const wrong of ['나는 학교에 가다.','Pongo mantequilla','Es la longitud','¿No lo sé? / ¿No sé?','Mudanza / traslado de residencia','-어요/-아요 → -셔요'])assert.ok(!text.includes(wrong),wrong);
});

test('las fichas de regla de bloques no se presentan como palabras',()=>{
  for(const id of ['survival','essentials'])for(const activity of activities(id).filter(activity=>activity.type==='teach_concept'&&/forman un bloque|batchim:|vocal (vertical|horizontal)/.test(activity.explanation||'')))assert.match(activity.target,/→/,activity.id);
});

test('el espaciado no invalida una respuesta en coreano, pero sí en idiomas con espacios',()=>{
  const activity={type:'typed_translation',answer:'이름이 뭐예요?'};
  assert.equal(evaluateGuidedAnswer(activity,'이름이뭐예요?','Korean').correct,true);
  assert.equal(evaluateGuidedAnswer({type:'typed_translation',answer:'I can swim.'},'Ican swim.','English').correct,false);
});

test('A1 acepta variantes naturales y los diálogos largos dejan un error de margen',()=>{
  const identity=activities('a1-1-identity').find(activity=>activity.id==='korean-a1-1-identity-production-translate');
  assert.equal(evaluateGuidedAnswer(identity,'이름이 무엇이에요?','Korean').correct,true);
  const dialogue=activities('a1-1-places').find(activity=>activity.turns);
  assert.equal(dialogue.minimum_correct,dialogue.turns.filter(turn=>turn.role==='learner').length-1);
});
