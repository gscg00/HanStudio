import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {evaluateGuidedAnswer} from '../src/guided_course_answers.js';

const read=path=>JSON.parse(fs.readFileSync(new URL(`../library/courses/French/${path}`,import.meta.url)));
const course=read('course.json');
const order=course.levels.flatMap(level=>level.unitIds);
const units=Object.fromEntries(order.map(id=>[id,read(`units/${id}.json`)]));
const activities=id=>units[id].lessons.flatMap(lesson=>lesson.activities);
const taught=id=>new Set(activities(id).filter(activity=>activity.type?.startsWith('teach_')).map(activity=>activity.target));

test('las reglas de lectura del francés se enseñan antes de survival',()=>{
  const before=new Set(order.slice(0,order.indexOf('survival')).flatMap(id=>[...taught(id)]));
  // oi, eau, ai, eu, é, e muda, nasales, letras mudas, j/g, ch, s=z, ç, ille, qu, r, liaison y elisión
  for(const word of ['moi','beau','lait','deux','rue','table','enfant','bon','vin','bonne','petit','ils mangent','parlez','homme','jour','rouge','chat','maison','garçon','fille','qui','merci','les amis','l’eau','Il est ici.'])assert.ok(before.has(word),word);
  const jour=activities('reading').find(activity=>activity.type==='teach_concept'&&activity.target==='jour');
  assert.match(jour.explanation,/zh/);
  assert.ok(!JSON.stringify(units.reading).includes('"ye"'),'la G no debe describirse como «ye»');
});

test('essentials conjuga être, avoir y los verbos en -er, y niega con ne… pas',()=>{
  const items=taught('essentials');
  for(const form of ['je suis','vous êtes','ils sont','j’ai','vous avez','ils ont','je parle','nous parlons','ils parlent','Je ne parle pas anglais.','Je n’ai pas de voiture.','un livre','une maison'])assert.ok(items.has(form),form);
  const blocks=activities('essentials').find(activity=>activity.id==='french-essentials-13-production-blocks');
  assert.equal(evaluateGuidedAnswer(blocks,'Je ne parle pas anglais.','French').correct,true);
});

test('la unidad time ya no repite survival',()=>{
  const survival=taught('survival'),time=[...taught('time')];
  assert.ok(time.length>=25);
  assert.equal(time.filter(target=>survival.has(target)).length,0);
  for(const item of ['soixante-dix','quatre-vingts','quatre-vingt-dix','Il est quatre heures moins le quart.','le vingt-sept octobre','Ça coûte cinq euros.'])assert.ok(time.includes(item),item);
  assert.equal(course.units.find(entry=>entry.id==='time').title,units.time.title);
});

test('no quedan errores de francés ni traducciones erróneas conocidas',()=>{
  const text=JSON.stringify(Object.values(units));
  for(const wrong of ['Il est mon ami.','Elle est ma sœur.','Ma tête fait mal','Mon dos fait mal','Cojo un billete','vosotros / usted','Sí, quiero hablar bien francés.','Hablo un poco de este idioma.','Hasta cierto punto, el resultado fue positivo.','sur le prix, pas la qualité','Je n’aime pas, même si','¿Cuántos años tienes?','Lleva un paraguas.','Debes mostrar tu pasaporte.','Idea clave: ye '])assert.ok(!text.includes(wrong),wrong);
  assert.ok(taught('a1-1-people').has('C’est mon ami.'));
});

test('ninguna escucha ofrece homófonos como opciones',()=>{
  for(const id of order)for(const activity of activities(id).filter(activity=>activity.type==='listening_choice'))
    assert.ok(!(activity.options.includes('où')&&activity.options.includes('ou')),activity.id);
});

test('la producción acepta variantes correctas y los diálogos largos dejan un error de margen',()=>{
  const identity=activities('a1-1-identity').find(activity=>activity.id==='french-a1-1-identity-production-translate');
  for(const answer of ['Vous vous appelez comment ?','Comment vous appelez vous ?','Quel est votre nom ?'])assert.equal(evaluateGuidedAnswer(identity,answer,'French').correct,true,answer);
  const routine=activities('a1-1-routine').find(activity=>activity.type==='typed_translation');
  assert.equal(evaluateGuidedAnswer(routine,'Je me lève à 7h.','French').correct,true);
  for(const id of order.filter(id=>/^(a1|a2|b1)-/.test(id)))for(const dialogue of activities(id).filter(activity=>activity.turns)){
    const learners=dialogue.turns.filter(turn=>turn.role==='learner').length;
    if(learners>=3)assert.equal(dialogue.minimum_correct,learners-1,dialogue.id);
  }
});
