import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {evaluateGuidedAnswer} from '../src/guided_course_answers.js';

const read=path=>JSON.parse(fs.readFileSync(new URL(`../library/courses/Russian/${path}`,import.meta.url)));
const course=read('course.json');
const order=course.levels.flatMap(level=>level.unitIds);
const units=Object.fromEntries(order.map(id=>[id,read(`units/${id}.json`)]));
const activities=id=>units[id].lessons.flatMap(lesson=>lesson.activities);
const taught=id=>new Set(activities(id).filter(activity=>activity.type?.startsWith('teach_')).map(activity=>activity.target));
const byId=(id,activityId)=>activities(id).find(activity=>activity.id===activityId);

test('la lectura enseña acento, reducción, ensordecimiento y consonantes suaves antes de survival',()=>{
  const before=new Set(order.slice(0,order.indexOf('survival')).flatMap(id=>[...taught(id)]));
  for(const word of ['молоко','сестра','хлеб','друг','день','брать','машина'])assert.ok(before.has(word),word);
  assert.equal(byId('reading','russian-reading-08-1-teach').sound_hint,'[малако́]');
  const test=units.reading.lessons.find(lesson=>lesson.id==='russian-reading-test-10');
  assert.ok(test.activities.some(activity=>activity.id.startsWith('russian-reading-test-10-new-')));
});

test('essentials enseña быть omitido, у меня есть, las dos conjugaciones y в/на',()=>{
  const items=taught('essentials');
  for(const form of ['Я студент.','У меня есть брат.','У меня нет брата.','я читаю','ты читаешь','они читают','я говорю','они говорят','в школе','в школу'])assert.ok(items.has(form),form);
  const card=activities('essentials').find(activity=>activity.type==='teach_concept'&&activity.target==='иметь');
  assert.match(card.meaning,/у меня есть/);
});

test('time, reading-bridge y story-bridge ya no repiten survival',()=>{
  const survival=taught('survival');
  for(const id of ['time','reading-bridge','story-bridge']){
    const items=[...taught(id)];
    assert.ok(items.length>=20,id);
    assert.deepEqual(items.filter(target=>survival.has(target)),[],id);
    assert.ok(activities(id).filter(activity=>activity.type==='teach_concept').every(activity=>activity.sound_hint),`${id}: falta la pista de acento`);
  }
  const time=taught('time');
  for(const form of ['Два часа.','Пять часов.','два рубля','пять рублей','Мне двадцать лет.','в среду'])assert.ok(time.has(form),form);
  assert.equal(course.units.find(entry=>entry.id==='time').title,units.time.title);
});

test('no quedan traducciones ni registros erróneos conocidos',()=>{
  const text=JSON.stringify(order.map(id=>units[id]));
  for(const wrong of ['Hablo un poco de este idioma','Lleva un paraguas.','Debes mostrar tu pasaporte.','Llego a las ocho.','Где есть аптека?','Какой у тебя возраст?','У меня есть боль.','se puede tomar fotos'])assert.ok(!text.includes(wrong),wrong);
  assert.equal(byId('a1-1-people','russian-a11-people-03-14-teach').explanation,'¿Cuántos años tiene?');
  assert.equal(byId('a1-2-social','russian-a12-social-02-04-meaning').answer,'tiempo');
});

test('el alumno no recita la frase del médico en el diálogo de salud',()=>{
  const dialogue=byId('a1-2-health','russian-a1-2-health-production-dialogue');
  const answers=dialogue.turns.filter(turn=>turn.role==='learner').map(turn=>turn.answer);
  assert.ok(!answers.includes('Принимайте это два раза в день.'));
  assert.ok(answers.includes('У меня болит голова.'));
  assert.equal(byId('a1-2-health','russian-a1-2-health-production-speak').answer,'У меня болит голова.');
});

test('la producción acepta variantes correctas: cifras, sin pronombre, е por ё y femenino',()=>{
  const routine=byId('a1-1-routine','russian-a1-1-routine-production-translate');
  assert.equal(evaluateGuidedAnswer(routine,'Я встаю в 7.','Russian').correct,true);
  const dictation=byId('a1-1-routine','russian-a1-1-routine-production-dictation');
  assert.equal(evaluateGuidedAnswer(dictation,'Я учусь днем.','Russian').correct,true);
  const past=byId('a2-1-past','russian-a2-1-past-production-translate');
  assert.equal(evaluateGuidedAnswer(past,'Я не смогла найти ключи.','Russian').correct,true);
  assert.equal(evaluateGuidedAnswer(byId('essentials','russian-essentials-09-production-typed'),'Нет времени.','Russian').correct,true);
});

test('los diálogos de tres turnos dejan un error de margen',()=>{
  let checked=0;
  for(const id of order)for(const activity of activities(id).filter(activity=>activity.turns)){
    const learners=activity.turns.filter(turn=>turn.role==='learner').length;
    if(learners>=3){assert.equal(activity.minimum_correct,learners-1,activity.id);checked++;}
  }
  assert.ok(checked>=6);
});
