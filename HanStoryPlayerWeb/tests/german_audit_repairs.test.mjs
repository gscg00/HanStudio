import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {evaluateGuidedAnswer} from '../src/guided_course_answers.js';

// Protege las correcciones de docs/AUDITORIA_ALEMAN_2026-10-27.md
// (aplicadas con scripts/repair_german_audit_2026_10.mjs).
const read=path=>JSON.parse(fs.readFileSync(new URL(`../library/courses/German/${path}`,import.meta.url)));
const course=read('course.json');
const order=course.levels.flatMap(level=>level.unitIds);
const units=Object.fromEntries(order.map(id=>[id,read(`units/${id}.json`)]));
const manifest=read('audio_manifest.json').items;
const activities=id=>units[id].lessons.flatMap(lesson=>lesson.activities);
const taught=id=>new Set(activities(id).filter(activity=>activity.type?.startsWith('teach_')).map(activity=>activity.target));
const find=(id,predicate)=>activities(id).find(predicate);

test('antes de survival se enseñan los sonidos que engañan a un hispanohablante',()=>{
  const before=new Set(order.slice(0,order.indexOf('survival')).flatMap(id=>[...taught(id)]));
  for(const word of ['Zug','Wasser','Vater','ja','Sonne','Straße','Schule','mein','sie','neun','Bär','schön','über','Tee','Sohn','Mutter','Kind','Zimmer','ich','Bach','zwanzig'])assert.ok(before.has(word),word);
});

test('«Sonidos y lectura» ya no da el nombre de la letra como pronunciación ni dice «ß: s larga»',()=>{
  const reading=activities('reading');
  const answers=new Set(reading.filter(activity=>activity.type==='select_translation').map(activity=>activity.answer));
  for(const name of ['be','de','gue','ka','te','pe','ve','tset','tse','iks','üpsilon','s larga'])assert.ok(!answers.has(name),name);
  for(const id of ['survival','essentials','reading'])assert.ok(!JSON.stringify(units[id]).includes('"s larga"')&&!JSON.stringify(units[id]).includes('ß: s larga')&&!JSON.stringify(units[id]).includes('Cómo suena: s larga'),id);
  // Las claves de audio de las letras siguen siendo los nombres grabados.
  for(const activity of reading.filter(activity=>activity.type==='teach_concept'&&activity.target.length===1))assert.ok(manifest[activity.audio],`${activity.id}: ${activity.audio}`);
});

test('essentials enseña sein, haben, el presente regular, nicht/kein y el verbo en 2.º lugar',()=>{
  const items=taught('essentials');
  for(const form of ['ich bin','du bist','er ist','wir sind','Sie sind','ich habe','du hast','er hat','ich wohne','du wohnst','er wohnt','wir wohnen','Ich bin nicht müde.','Ich habe kein Auto.','Kommst du aus Mexiko?','Heute lerne ich Deutsch.'])assert.ok(items.has(form),form);
  const testLesson=units.essentials.lessons.find(lesson=>lesson.id==='german-essentials-test-11');
  assert.ok(testLesson.activities.some(activity=>activity.id.startsWith('german-essentials-test-11-new-')));
  const blocks=find('essentials',activity=>activity.id==='german-essentials-11-production-blocks');
  assert.equal(evaluateGuidedAnswer(blocks,'Heute lerne ich Deutsch.','German').correct,true);
});

test('la unidad time ya no repite survival y explica la trampa de «halb vier»',()=>{
  const survival=taught('survival'),time=[...taught('time')];
  assert.ok(time.length>=25);
  assert.equal(time.filter(target=>survival.has(target)).length,0);
  const halb=find('time',activity=>activity.type==='teach_concept'&&activity.target==='Es ist halb vier.');
  assert.equal(halb.meaning,'Son las tres y media.');
  assert.ok(halb.teaching_points.some(point=>point.includes('cuatro y media')));
  assert.equal(course.units.find(entry=>entry.id==='time').title,units.time.title);
  assert.ok(taught('time').has('einundzwanzig')&&taught('time').has('Was kostet das?'));
});

test('no quedan ejemplos agramaticales ni traducciones erróneas conocidas',()=>{
  const text=JSON.stringify(Object.values(units));
  for(const wrong of ['Mein Kopf ist weh','Mein Alter ist 20 Jahre','dolorido','Hablo un poco de este idioma','Pienso reservar','Debes mostrar tu pasaporte','Lleva un paraguas','¿Cuántos años tienes?','Hasta cierto punto, el resultado','Aquí se puede tomar fotos','Revisaremos los avances al final de la semana','Tenemos que decidir qué es prioritario','Comparar ambas perspectivas'])assert.ok(!text.includes(wrong),wrong);
  const wissen=find('a2-1-ability',activity=>activity.type==='teach_concept'&&activity.target==='wissen, wie');
  assert.notEqual(wissen.meaning,'saber');
});

test('las frases con Sie no se traducen con tú',()=>{
  const formal=/(^|[^.!?] )(Sie|Ihnen|Ihre?n?)\b/;
  for(const id of order)for(const activity of activities(id).filter(activity=>activity.type==='teach_concept'&&formal.test(activity.target))){
    const meaning=activity.meaning||activity.explanation||'';
    assert.ok(!/\b(tienes|debes|llevas|puedes|tu)\b/.test(meaning),`${activity.id}: ${activity.target} = ${meaning}`);
  }
});

test('la producción acepta variantes naturales y los diálogos largos dejan un error de margen',()=>{
  const routine=find('a1-1-routine',activity=>activity.type==='typed_translation');
  for(const variant of ['Ich stehe um sieben Uhr auf.','Um 7 Uhr stehe ich auf.','Ich stehe um 7 Uhr auf.'])assert.equal(evaluateGuidedAnswer(routine,variant,'German').correct,true,variant);
  const doctor=find('a1-2-health',activity=>activity.type==='open_question');
  assert.equal(evaluateGuidedAnswer(doctor,'der Arzt','German').correct,true);
  const tall=find('a2-2-culture',activity=>activity.type==='open_question');
  assert.equal(evaluateGuidedAnswer(tall,'groß','German').correct,true);
  const greet=find('a1-1-identity',activity=>activity.type==='typed_translation');
  assert.equal(evaluateGuidedAnswer(greet,'Wie heissen Sie?','German').correct,true);
  for(const id of order.filter(id=>/^(a1|a2|b1)-/.test(id)))for(const dialogue of activities(id).filter(activity=>activity.turns)){
    const learners=dialogue.turns.filter(turn=>turn.role==='learner').length;
    if(learners>=3)assert.equal(dialogue.minimum_correct,learners-1,dialogue.id);
  }
});

test('el alumno de A1 dice frases de paciente, no del médico',()=>{
  for(const activity of activities('a1-2-health').filter(activity=>['guided_dialogue','speak_and_transcribe'].includes(activity.type))){
    const answers=activity.turns?activity.turns.filter(turn=>turn.role==='learner').map(turn=>turn.answer):[activity.answer];
    assert.ok(!answers.includes('Nehmen Sie das zweimal täglich.'),activity.id);
  }
});
