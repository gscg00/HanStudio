import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {evaluateGuidedAnswer} from '../src/guided_course_answers.js';

const read=path=>JSON.parse(fs.readFileSync(new URL(`../library/courses/English/${path}`,import.meta.url)));
const course=read('course.json');
const order=course.levels.flatMap(level=>level.unitIds);
const units=Object.fromEntries(order.map(id=>[id,read(`units/${id}.json`)]));
const activities=id=>units[id].lessons.flatMap(lesson=>lesson.activities);
const taught=id=>new Set(activities(id).filter(activity=>activity.type?.startsWith('teach_')).map(activity=>activity.target));
const ev=(activity,given)=>evaluateGuidedAnswer(activity,given,'English').correct;

test('reading enseña sonidos (vocales, schwa, th, -ed, -s, letras mudas) antes de survival',()=>{
  const items=taught('reading');
  for(const word of ['cat','cup','sheep','leave','name','about','banana','think','this','school','worked','wanted','buses','know'])assert.ok(items.has(word),word);
  const test=units.reading.lessons.find(lesson=>lesson.id==='english-reading-test-08');
  assert.ok(test.activities.filter(activity=>activity.id.startsWith('english-reading-test-08-new-')).length>=8);
  assert.ok(order.indexOf('reading')<order.indexOf('survival'));
});

test('essentials enseña a conjugar be y el presente simple con -s, don\'t y does',()=>{
  const items=taught('essentials');
  for(const form of ['I am a student.','She is a doctor.','He is not here.','Are you tired?','She works here.','He doesn\'t drink coffee.','Does she live here?'])assert.ok(items.has(form),form);
  const blocks=activities('essentials').find(activity=>activity.id==='english-essentials-10-production-blocks');
  assert.equal(ev(blocks,'He does not drink coffee.'),true);
});

test('la unidad time ya no repite survival y conserva la prueba final',()=>{
  const survival=taught('survival'),time=[...taught('time')];
  assert.ok(time.length>=28);
  assert.equal(time.filter(target=>survival.has(target)).length,0);
  const test=units.time.lessons.at(-1);
  assert.equal(test.isTest,true);assert.equal(test.isUnitFinal,true);
  assert.equal(course.units.find(entry=>entry.id==='time').title,units.time.title);
});

test('las fichas de regla no tienen distractores que también sean correctos',()=>{
  const generic=['Dos letras forman un solo sonido.','Las contracciones son normales al hablar.','El verbo be cambia según la persona.','Puede cambiar en palabras como book.'];
  for(const id of ['survival','essentials'])for(const activity of activities(id))for(const text of generic)assert.ok(!(activity.options||[]).includes(text)&&activity.explanation!==text,`${activity.id}: ${text}`);
});

test('no quedan glosas que contradicen la frase inglesa',()=>{
  const text=JSON.stringify(order.map(id=>units[id]));
  for(const wrong of ['Hablo un poco de este idioma.','No necesariamente significa que sea imposible.','Conviene prever los riesgos antes de empezar.','Revisaremos los avances al final de la semana.','llegaremos antes de que oscurezca','Hasta cierto punto, el resultado fue positivo.','Where is there a pharmacy?','Envio un correo'])assert.ok(!text.includes(wrong),wrong);
  // «Let us…» se acepta como variante, pero el modelo enseñado es «Let's…».
  for(const id of order)for(const activity of activities(id).filter(activity=>activity.type==='teach_concept'))assert.doesNotMatch(activity.target,/^Let us /,activity.id);
  const shortAnswer=activities('story-bridge').filter(activity=>activity.type==='select_translation'&&['Yes, I do.','Yes, you can.','Yes, there are.'].includes(activity.target));
  assert.ok(shortAnswer.length>=3);
  for(const activity of shortAnswer)assert.notEqual(activity.answer,'Sí.');
  for(const id of ['reading-bridge','story-bridge'])for(const activity of activities(id).filter(activity=>activity.type==='select_translation'))assert.ok(!activity.options.includes('Sí.')&&!activity.options.includes('No.'),activity.id);
});

test('la producción acepta contracciones, cifras y variantes naturales',()=>{
  const identity=activities('a1-1-identity').find(activity=>activity.type==='typed_translation');
  assert.equal(ev(identity,'What\'s your name?'),true);
  const routine=activities('a1-1-routine').find(activity=>activity.type==='typed_translation');
  assert.equal(ev(routine,'I get up at 7.'),true);
  const conversation=activities('a2-1-conversation').find(activity=>activity.type==='speak_and_transcribe');
  assert.equal(ev(conversation,'However, I don\'t have time today.'),true);
  const register=activities('b1-1-register').find(activity=>activity.type==='open_question'&&activity.answer==='Let\'s divide the work.');
  assert.equal(ev(register,'Let us divide the work.'),true);
  // La tolerancia no se extiende a otra palabra.
  assert.equal(ev(identity,'What is you name?'),false);
});

test('los diálogos de A1 tienen interlocutor real y los de 3 turnos dejan margen',()=>{
  for(const id of order.filter(id=>id.startsWith('a1-'))){
    const dialogue=activities(id).find(activity=>activity.turns);
    for(const turn of dialogue.turns.filter(turn=>turn.role==='model'))assert.doesNotMatch(turn.text,/^Situación \d/,`${id}`);
  }
  for(const id of order)for(const activity of activities(id).filter(activity=>activity.turns)){
    const learners=activity.turns.filter(turn=>turn.role==='learner').length;
    if(learners>=3)assert.equal(activity.minimum_correct,learners-1,activity.id);
  }
});
