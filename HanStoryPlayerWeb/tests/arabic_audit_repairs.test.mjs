import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {evaluateGuidedAnswer} from '../src/guided_course_answers.js';

const read=path=>JSON.parse(fs.readFileSync(new URL(`../library/courses/Arabic/${path}`,import.meta.url)));
const course=read('course.json');
const order=course.levels.flatMap(level=>level.unitIds);
const units=Object.fromEntries(order.map(id=>[id,read(`units/${id}.json`)]));
const activities=id=>units[id].lessons.flatMap(lesson=>lesson.activities);
const taught=id=>new Set(activities(id).filter(activity=>activity.type?.startsWith('teach_')).map(activity=>activity.target));
const taughtBefore=unitId=>new Set(order.slice(0,order.indexOf(unitId)).flatMap(id=>[...taught(id)]));

test('vocales con letra, sukun, shadda, tanwin, ة ى آ لا, ال y formas conectadas se enseñan antes de survival',()=>{
  const before=taughtBefore('survival');
  for(const item of ['بَ','بِ','بُ','با','بي','بو','مِنْ','أُمّ','شُكْرًا','كِتابٌ','غُرْفَة','غُرْفَتي','مَتى','الآن','لا','القَمَر','الشَّمْس','في البَيْت','ه هـ ـهـ ـه'])assert.ok(before.has(item),item);
});

test('survival, time, reading-bridge y story-bridge ya no son copias de los pronombres de essentials',()=>{
  const essentials=taught('essentials');
  for(const id of ['survival','time','reading-bridge','story-bridge','questions']){
    const items=[...taught(id)];
    assert.ok(items.length>=10,id);
    // Antes las 10 tarjetas eran copias; ahora solo se repiten لا, اليوم y غدًا como apoyo.
    assert.ok(items.filter(target=>essentials.has(target)).length<=2,id);
  }
  for(const target of ['السلام عليكم','شكرًا.','كيف حالك؟'])assert.ok(taught('survival').has(target),target);
  for(const target of ['الأحد','الجمعة','كم الساعة؟','٣'])assert.ok(taught('time').has(target),target);
  for(const target of ['أنتَ','أنتِ','هي مكسيكية.'])assert.ok(taught('reading-bridge').has(target),target);
  for(const target of ['أنا طالب.','هل أنت طالب؟','لا، لست طالبًا.'])assert.ok(taught('questions').has(target),target);
});

test('los verbos no se glosan como infinitivos falsos y el presente con prefijos se enseña',()=>{
  const meaning=(unitId,target)=>activities(unitId).find(activity=>activity.type==='teach_concept'&&activity.target===target)?.meaning;
  assert.equal(meaning('essentials','كان'),'era / estaba (pasado)');
  assert.equal(meaning('essentials','ذهب'),'fue (él) · verbo «ir»');
  assert.equal(meaning('essentials','عندي'),'tengo');
  for(const form of ['أكتب','تكتب','تكتبين','يكتب','نكتب','لا أكتب'])assert.ok(taught('essentials').has(form),form);
  assert.ok(!JSON.stringify(units.essentials).includes('"ser / estar"'));
});

test('las descripciones de sonido ya no confunden ج con la j española',()=>{
  const text=JSON.stringify(units.reading);
  for(const wrong of ['y fuerte o j según la región','"h suave"'])assert.ok(!text.includes(wrong),wrong);
});

test('traducciones corregidas y frase agramatical eliminada',()=>{
  const text=JSON.stringify(units);
  for(const wrong of ['Tome esto dos veces al día.','Hablo un poco de este idioma.','Siga recto.','لأنني فاتني الحافلة','Envía un mensaje corto.','Aquí se puede tomar fotos.','"Llego tarde."'])assert.ok(!text.includes(wrong),wrong);
  for(const activity of activities('vocabulary').filter(activity=>activity.target==='طفل'&&activity.type==='select_translation'))assert.ok(!activity.options.includes('niño'),activity.id);
  for(const activity of activities('survival').filter(activity=>activity.type==='select_translation'&&activity.target==='السلام عليكم'))assert.ok(!activity.options.includes('Hola'),activity.id);
});

test('las tarjetas A1 con ـك, imperativos y verbos explican el género o la persona',()=>{
  const note=(unitId,target)=>activities(unitId).find(activity=>activity.type==='teach_concept'&&activity.target===target).usage_note;
  assert.match(note('a1-1-identity','ما اسمك؟'),/mujer/);
  assert.match(note('a1-2-weather','خذ مظلة.'),/خذي/);
  assert.match(note('a1-1-routine','يستيقظ'),/أستيقظ/);
});

test('A1 acepta variantes naturales, escritura sin hamza y los diálogos de 3 turnos dejan margen',()=>{
  const identity=activities('a1-1-identity').find(activity=>activity.id==='arabic-a1-1-identity-production-translate');
  assert.equal(evaluateGuidedAnswer(identity,'ما هو اسمك؟','Arabic').correct,true);
  const shopping=activities('a1-2-shopping').find(activity=>activity.type==='typed_translation');
  assert.equal(evaluateGuidedAnswer(shopping,'هل استطيع الدفع بالبطاقة؟','Arabic').correct,true);
  assert.equal(evaluateGuidedAnswer(shopping,'هل يُمكنني الدفع بالبطاقة؟','Arabic').correct,true);
  for(const id of ['a1-1-places','a1-2-social']){
    const dialogue=activities(id).find(activity=>activity.turns);
    assert.equal(dialogue.minimum_correct,dialogue.turns.filter(turn=>turn.role==='learner').length-1,id);
  }
});
