import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {evaluateGuidedAnswer} from '../src/guided_course_answers.js';

const read=path=>JSON.parse(fs.readFileSync(new URL(`../library/courses/Chinese/${path}`,import.meta.url)));
const course=read('course.json');
const order=course.levels.flatMap(level=>level.unitIds);
const units=Object.fromEntries(order.map(id=>[id,read(`units/${id}.json`)]));
const activities=id=>units[id].lessons.flatMap(lesson=>lesson.activities);
const taught=id=>new Set(activities(id).filter(activity=>activity.type?.startsWith('teach_')).map(activity=>activity.target));
const HAN=/[一-鿿]/u;

test('antes de survival se enseñan todas las iniciales, las finales difíciles y los cambios de tono',()=>{
  const before=new Set(order.slice(0,order.indexOf('survival')).flatMap(id=>[...taught(id)]));
  for(const item of ['m','f','n','l','h','z','c','s','e','ian','ui','er','zi · ci · si','zhi · chi · shi · ri','ju · qu · xu'])assert.ok(before.has(item),item);
  for(const item of ['你好','很好','不是','不好','一个','一天','谢谢'])assert.ok(before.has(item),`sandhi: ${item}`);
  const sandhi=activities('reading').find(activity=>activity.id==='chinese-reading-07-3-meaning');
  assert.equal(sandhi.answer,'[bú shì]');
});

test('essentials enseña 是, 很 + adjetivo, 的, 也, 在 y 都',()=>{
  const items=taught('essentials');
  for(const form of ['我是学生。','他不是老师。','我很忙。','我的书','我也是学生。','我在家。','我们都是朋友。'])assert.ok(items.has(form),form);
});

test('time, questions y los puentes ya no repiten survival ni essentials',()=>{
  const survival=taught('survival'),essentials=taught('essentials');
  for(const id of ['time','reading-bridge','story-bridge']){
    const items=[...taught(id)];
    assert.ok(items.length>=10,id);
    assert.equal(items.filter(target=>survival.has(target)).length,0,id);
  }
  assert.equal([...taught('questions')].filter(target=>essentials.has(target)).length,0);
  for(const form of ['两个苹果','三本书','两点。','今天几号？','五块钱'])assert.ok(taught('time').has(form),form);
});

test('no quedan ejemplos agramaticales ni traducciones erróneas conocidas',()=>{
  const text=JSON.stringify(Object.values(units));
  for(const wrong of ['我有二本书','我要全杯水','我刷牙齿','一年有十二个月份','Hablo un poco de este idioma','«起床» significa «despertarse»','Tome esto dos veces al día','La habitación es menos cara','Vamos caminando'])assert.ok(!text.includes(wrong),wrong);
  for(const id of ['survival','vocabulary'])for(const activity of activities(id).filter(activity=>activity.target==='是'&&activity.type==='select_translation'))assert.notEqual(activity.answer,'sí',activity.id);
});

test('todas las tarjetas en caracteres de A0 y A1 tienen pinyin',()=>{
  for(const id of order.filter(id=>id!=='reading-foundations'&&(units[id].lessons&&order.indexOf(id)<order.indexOf('a2-1-past')))){
    for(const activity of activities(id).filter(activity=>activity.type==='teach_concept'&&HAN.test(activity.target||'')))assert.ok(activity.pinyin,`${id}: ${activity.id}`);
  }
});

test('todas las preguntas de opción múltiple contienen su respuesta sin opciones repetidas',()=>{
  for(const id of order)for(const activity of activities(id).filter(activity=>['select_translation','listening_choice'].includes(activity.type))){
    assert.ok(activity.options.includes(activity.answer),activity.id);
    assert.equal(new Set(activity.options).size,activity.options.length,activity.id);
  }
});

test('A1 acepta variantes naturales y cifras, y los diálogos de 3 turnos dejan un error de margen',()=>{
  const find=(unitId,id)=>activities(unitId).find(activity=>activity.id===id);
  assert.equal(evaluateGuidedAnswer(find('a1-1-identity','chinese-a1-1-identity-production-speak'),'我是墨西哥人。','Chinese').correct,true);
  assert.equal(evaluateGuidedAnswer(find('a1-1-identity','chinese-a1-1-identity-production-translate'),'您贵姓？','Chinese').correct,true);
  assert.equal(evaluateGuidedAnswer(find('a1-2-time','chinese-a1-2-time-production-translate'),'我8点到。','Chinese').correct,true);
  for(const id of ['a1-1-places','a1-2-social']){
    const dialogue=activities(id).find(activity=>activity.turns);
    assert.equal(dialogue.minimum_correct,dialogue.turns.filter(turn=>turn.role==='learner').length-1,id);
  }
});
