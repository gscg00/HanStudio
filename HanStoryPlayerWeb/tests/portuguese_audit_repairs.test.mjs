import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {evaluateGuidedAnswer} from '../src/guided_course_answers.js';

const read=path=>JSON.parse(fs.readFileSync(new URL(`../library/courses/Portuguese/${path}`,import.meta.url)));
const course=read('course.json');
const order=course.levels.flatMap(level=>level.unitIds);
const units=Object.fromEntries(order.map(id=>[id,read(`units/${id}.json`)]));
const activities=id=>units[id].lessons.flatMap(lesson=>lesson.activities);
const taught=id=>new Set(activities(id).filter(activity=>activity.type?.startsWith('teach_')).map(activity=>activity.target));

test('survival, time, reading-bridge y story-bridge ya no son copias de los pronombres',()=>{
  const pronouns=['eu','tu / você','ele','ela','nós','vocês','eles / elas','ser','estar','ter'];
  const seen=new Map();
  for(const id of ['survival','time','reading-bridge','story-bridge','questions']){
    const items=[...taught(id)];
    assert.ok(items.length>=10,id);
    for(const pronoun of pronouns)assert.ok(!items.includes(pronoun),`${id}: ${pronoun}`);
    const key=items.join('|');assert.ok(!seen.has(key),`${id} duplica ${seen.get(key)}`);seen.set(key,id);
  }
  const essentials=taught('essentials');
  assert.equal([...taught('questions')].filter(target=>essentials.has(target)).length,0,'questions repite essentials');
});

test('el fundamento enseña registro, números hasta 20, hora, días y euros',()=>{
  const survival=taught('survival'),time=taught('time');
  for(const item of ['tu','o senhor','a senhora','Obrigada.','Como está?'])assert.ok(survival.has(item),item);
  for(const item of ['dezasseis','dezanove','vinte','duas','Que horas são?','segunda-feira','cinquenta cêntimos'])assert.ok(time.has(item),item);
});

test('essentials enseña a conjugar en presente antes de A1',()=>{
  const items=taught('essentials');
  for(const form of ['falo','falas','fala','falamos','falam','bebo','abrimos','sou','estou','tenho','vou','faço'])assert.ok(items.has(form),form);
  assert.ok(order.indexOf('essentials')<order.indexOf('a1-1-identity'));
});

test('reading enseña reducción vocálica, nasales, dígrafos y sonidos según la posición',()=>{
  const items=taught('reading');
  for(const word of ['pequeno','pão','mãe','põe','bem','vinho','filho','chave','praça','três','mesa','rua','zero','gente'])assert.ok(items.has(word),word);
  const text=JSON.stringify(units.reading);
  for(const wrong of ['"ye"','"y francesa"','"ze"'])assert.ok(!text.includes(wrong),wrong);
  for(const activity of activities('reading').filter(activity=>activity.type==='select_translation'&&/^portuguese-reading-(0[789]|10)-/.test(activity.id))){
    // Las opciones de pronunciación tienen el mismo formato: no se adivinan por la forma.
    assert.ok(activity.options.every(option=>option.startsWith('[')),activity.id);
  }
});

test('la pregunta «por qué» usa la grafía de Portugal y el vocabulario de A0 no se declara brasileño',()=>{
  for(const id of ['essentials','vocabulary']){
    const targets=taught(id);assert.ok(!targets.has('por que'),id);assert.ok(targets.has('porquê'),id);
  }
  const vocabulary=JSON.stringify(units.vocabulary);
  for(const wrong of ['Este curso usa portugués brasileño','Minha nariz está fria','O internet está lento','está chovendo','"suco"','"xícara"','"equipe"','"aplicativo"','"porta-roupa"','Ejemplo: Meu ','Ejemplo: Minha '])assert.ok(!vocabulary.includes(wrong),wrong);
  for(const target of ['sumo','chávena','equipa','ecrã','castanho','cinzento','bebé'])assert.ok(taught('vocabulary').has(target),target);
  assert.match(course.variantPolicy.note,/pt-PT/);
});

test('falsos amigos señalados para hispanohablantes',()=>{
  const notes=Object.fromEntries(activities('vocabulary').filter(activity=>activity.type==='teach_concept').map(activity=>[activity.target,activity.usage_note||'']));
  assert.match(notes['escritório'],/taller/);
  assert.match(notes.copo,/vaso/);
  assert.match(notes.acordar,/despertarse/);
});

test('traducciones al español corregidas',()=>{
  const text=JSON.stringify(order.filter(id=>/^[ab]\d-/.test(id)).map(id=>units[id]));
  for(const wrong of ['Hablo un poco de este idioma.','¿Cuántos años tienes?','Debes mostrar tu pasaporte.','"factura"','Hasta cierto punto, el resultado fue positivo.','Tenemos que decidir qué es prioritario.','¿Qué tan segura es esa información?'])assert.ok(!text.includes(wrong),wrong);
});

test('en salud el alumno dice la frase del paciente, no la del médico',()=>{
  const dialogue=activities('a1-2-health').find(activity=>activity.id==='portuguese-a1-2-health-production-dialogue');
  assert.ok(dialogue.turns.filter(turn=>turn.role==='learner').every(turn=>turn.answer!=='Tome isto duas vezes por dia.'));
});

test('A1 acepta variantes naturales y las misiones de 3 turnos dejan un error de margen',()=>{
  const identity=activities('a1-1-identity').find(activity=>activity.id==='portuguese-a1-1-identity-production-translate'||(activity.type==='typed_translation'&&activity.answer==='Como se chama?'));
  assert.equal(evaluateGuidedAnswer(identity,'Como te chamas?','Portuguese').correct,true);
  const routine=activities('a1-1-routine').find(activity=>activity.type==='typed_translation');
  assert.equal(evaluateGuidedAnswer(routine,'Levanto-me às 7.','Portuguese').correct,true);
  for(const id of order.filter(id=>/^[ab]\d-/.test(id)))for(const activity of activities(id).filter(activity=>activity.turns)){
    const learners=activity.turns.filter(turn=>turn.role==='learner').length;
    if(learners>=3)assert.equal(activity.minimum_correct,learners-1,activity.id);
  }
});
