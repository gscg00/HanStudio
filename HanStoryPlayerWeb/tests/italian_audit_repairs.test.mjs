import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {evaluateGuidedAnswer} from '../src/guided_course_answers.js';

const read=path=>JSON.parse(fs.readFileSync(new URL(`../library/courses/Italian/${path}`,import.meta.url)));
const course=read('course.json');
const order=course.levels.flatMap(level=>level.unitIds);
const units=Object.fromEntries(order.map(id=>[id,read(`units/${id}.json`)]));
const activities=id=>units[id].lessons.flatMap(lesson=>lesson.activities);
const taught=id=>new Set(activities(id).filter(activity=>activity.type?.startsWith('teach_')).map(activity=>activity.target));

test('las letras usan su nombre italiano, igual que el audio',()=>{
  const text=JSON.stringify(units.reading);
  for(const spanish of ['"efe"','"ele"','"eme"','"ene"','"ese"','F: efe','L: ele'])assert.ok(!text.includes(spanish),spanish);
  const f=activities('reading').find(activity=>activity.type==='select_translation'&&activity.target==='F');
  assert.equal(f.answer,'effe');assert.equal(f.audio,'effe');
});

test('la lectura enseña SC, GLI, GN, QU, Z, S sonora, la tilde y las dobles antes de survival',()=>{
  const before=new Set(order.slice(0,order.indexOf('survival')).flatMap(id=>[...taught(id)]));
  for(const word of ['scuola','scena','famiglia','bagno','questo','zero','rosa','città','perché','sette','sete','parlano'])assert.ok(before.has(word),word);
});

test('essentials enseña el presente regular, essere/avere y falsos amigos',()=>{
  const items=taught('essentials');
  for(const form of ['parlo','parli','parla','parliamo','prendo','dormo','capisco','sono','sei','è','siamo','ho','hai','ha','abbiamo'])assert.ok(items.has(form),form);
  for(const word of ['burro','salire','guardare','caldo','camera','aceto'])assert.ok(items.has(word),word);
  const burro=activities('essentials').find(activity=>activity.type==='select_translation'&&activity.target==='burro');
  assert.equal(burro.answer,'mantequilla');
  const lei=activities('essentials').find(activity=>activity.type==='teach_concept'&&activity.target==='Lei');
  assert.match(lei.usage_note,/3\.ª persona/);
});

test('la unidad time ya no repite survival',()=>{
  const survival=taught('survival'),time=[...taught('time')];
  assert.ok(time.length>=35);
  assert.equal(time.filter(target=>survival.has(target)).length,0);
  for(const word of ['ventuno','mille','luglio','giugno','È l’una.','Costa dieci euro.'])assert.ok(time.includes(word),word);
  assert.equal(course.units.find(entry=>entry.id==='time').title,units.time.title);
});

test('no quedan textos agramaticales ni traducciones erróneas conocidas',()=>{
  const text=JSON.stringify(Object.values(units));
  for(const wrong of ['Le uva sono','Il mio cugino','La mia cugina','La mia età è','Cojo ','Hablo un poco de este idioma','Debes mostrar tu pasaporte','Tenemos que decidir qué es prioritario','Hasta cierto punto, el resultado','¿Qué tan segura es esa información?','En caso de que necesites ayuda','Quiero un poco de arroz'])assert.ok(!text.includes(wrong),wrong);
  const costo=activities('vocabulary').find(activity=>activity.type==='teach_concept'&&activity.target==='costo');
  assert.equal(costo.meaning,'costo, precio');
  const banco=activities('vocabulary').filter(activity=>activity.audio==='banco');
  assert.ok(banco.length>=3);
  for(const activity of banco){
    if(activity.type==='select_translation')assert.equal(activity.answer,'pupitre, mostrador');
    if(activity.type==='listening_choice')assert.equal(activity.answer,'banco');
  }
  const banca=activities('vocabulary').find(activity=>activity.type==='select_translation'&&activity.target==='banca');
  assert.equal(banca.answer,'banco');
});

test('falsos amigos y registro llevan nota en A1',()=>{
  const home=activities('a1-1-home').find(activity=>activity.type==='teach_concept'&&activity.target==='camera');
  assert.match(home.usage_note,/Falso amigo/);
  const weather=activities('a1-2-weather').find(activity=>activity.type==='teach_concept'&&activity.target==='caldo');
  assert.match(weather.usage_note,/Falso amigo/);
});

test('la producción de salud pide la frase del paciente, no la del médico',()=>{
  const production=activities('a1-2-health').filter(activity=>activity.id.includes('-production-'));
  assert.ok(!JSON.stringify(production).includes('Prenda questo'));
  assert.ok(production.some(activity=>activity.type==='dictation'&&activity.answer==='Mi fa male la testa.'));
});

test('A1 acepta variantes naturales y los diálogos largos dejan un error de margen',()=>{
  const identity=activities('a1-1-identity').find(activity=>activity.id==='italian-a1-1-identity-production-translate');
  assert.equal(evaluateGuidedAnswer(identity,'Come si chiama?','Italian').correct,true);
  const routine=activities('a1-1-routine').find(activity=>activity.id==='italian-a1-1-routine-production-translate');
  assert.equal(evaluateGuidedAnswer(routine,'Mi alzo alle 7.','Italian').correct,true);
  assert.equal(evaluateGuidedAnswer(routine,'Io mi alzo alle sette.','Italian').correct,true);
  for(const id of order.filter(id=>/^(a1|a2|b1)-/.test(id))){
    for(const dialogue of activities(id).filter(activity=>activity.turns)){
      const learners=dialogue.turns.filter(turn=>turn.role==='learner').length;
      if(learners>=3)assert.equal(dialogue.minimum_correct,learners-1,dialogue.id);
    }
  }
});
