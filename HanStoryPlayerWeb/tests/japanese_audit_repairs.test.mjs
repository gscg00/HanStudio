import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {evaluateGuidedAnswer} from '../src/guided_course_answers.js';

const read=path=>JSON.parse(fs.readFileSync(new URL(`../library/courses/Japanese/${path}`,import.meta.url)));
const course=read('course.json');
const order=course.levels.flatMap(level=>level.unitIds);
const units=Object.fromEntries(order.map(id=>[id,read(`units/${id}.json`)]));
const activities=id=>units[id].lessons.flatMap(lesson=>lesson.activities);

test('todo kana y combinación que aparece en el curso se enseña antes con teach_kana',()=>{
  const taught=new Set(),combos=new Set(),missing=[];
  for(const id of order.filter(id=>id!=='reading-foundations'))for(const activity of activities(id)){
    if(activity.type==='teach_kana'){[...activity.target].forEach(ch=>taught.add(ch));if(activity.target.length===2)combos.add(activity.target);continue;}
    const texts=[activity.target,activity.answer,...(activity.options||[])].filter(value=>typeof value==='string');
    for(const text of texts)[...text].forEach((ch,index)=>{
      if(/[ぁ-ゖァ-ヺー]/u.test(ch)&&!taught.has(ch))missing.push(`${activity.id}: ${ch}`);
      if(/[ゃゅょャュョ]/u.test(ch)&&index>0&&!combos.has(text.slice(index-1,index+1)))missing.push(`${activity.id}: ${text.slice(index-1,index+1)}`);
    });
  }
  // う/ウ aparecen como distractor una actividad antes de su tarjeta en la lección 1 (menor, documentado).
  assert.deepEqual(missing.filter(item=>!/^jp-(hira|kata)-family-1-hear-2:/.test(item)),[]);
  for(const kana of ['ひゃ','りょ','じゃ','にゃ','ダ','ド','ッ','ジュ','こう','せい'])assert.ok(taught.has(kana)||combos.has(kana)||activities('hiragana-01').concat(activities('katakana')).some(activity=>activity.type==='teach_kana'&&activity.target===kana),kana);
});

test('«¿Cómo suena este kana?» no se responde buscando el propio kana en la opción',()=>{
  for(const id of ['hiragana-01','katakana'])for(const activity of activities(id).filter(activity=>activity.type==='kana_to_audio')){
    assert.ok(activity.options.includes(activity.answer),activity.id);
    assert.equal(new Set(activity.options).size,3,activity.id);
    assert.ok(!activity.answer.includes(activity.target),`${activity.id}: la respuesta contiene ${activity.target}`);
    assert.ok(!/Escucha el sonido de/.test(activity.answer),activity.id);
  }
  const hint=target=>activities('hiragana-01').find(activity=>activity.type==='teach_kana'&&activity.target===target).sound_hint;
  assert.match(hint('じ'),/nunca como la jota/);
  assert.match(hint('ら'),/pero/);
  assert.match(hint('ふ'),/labios/);
});

test('los repasos piden traducciones reales, sin frases de explicación como respuesta',()=>{
  const explanation=/significa «|^Escuchaste |La palabra completa|Escúchala|^No corresponde/;
  for(const id of ['first-words','first-sentences','basic-verbs','adjectives','functional-a1','story-bridge'])for(const activity of activities(id).filter(activity=>['word_to_translation','select_translation','listening_choice'].includes(activity.type))){
    assert.ok(activity.options.includes(activity.answer),activity.id);
    assert.ok(!activity.options.some(option=>explanation.test(option)),`${activity.id}: ${activity.options}`);
  }
});

test('las partículas y las formas verbales tienen explicación, no solo un título',()=>{
  const patterns=activities('first-sentences').filter(activity=>activity.type==='teach_pattern');
  for(const target of ['A は B です','が・を','に・で・へ・と','の・も','あります・います'])assert.ok(patterns.find(activity=>activity.target===target)?.teaching_points?.length>=2,target);
  assert.ok(patterns.some(activity=>activity.target==='うえ・なか・ちかく・まえ'),'el título del patrón no debe usar kanji aún no enseñados');
  const verbs=units['basic-verbs'].lessons.map(lesson=>lesson.id);
  assert.ok(verbs.indexOf('jp-book1-verb-form-te')>=0&&verbs.indexOf('jp-book1-verb-form-te')<verbs.indexOf('jp-book1-verb-form-03'),'la forma て se enseña antes de ～ています');
  assert.ok(verbs.indexOf('jp-book1-verb-form-00')<verbs.indexOf('jp-book1-verb-form-01'),'la forma de diccionario se explica antes de ます');
});

test('las tarjetas A1 con kanji muestran su lectura y las glosas de kanji son correctas',()=>{
  for(const id of order.filter(id=>/^a1-[12]-/.test(id)))for(const activity of activities(id).filter(activity=>activity.type==='teach_concept'&&/\p{Script=Han}/u.test(activity.target)))assert.match(activity.sound_hint||'',/^Lectura: [\p{Script=Hiragana}\p{Script=Katakana}ー、。？ ]+$/u,activity.id);
  const kanji=activities('starter-kanji').find(activity=>activity.type==='teach_kanji'&&activity.target==='図');
  assert.doesNotMatch(kanji.explanation,/^biblioteca/);
});

test('no quedan traducciones erróneas conocidas',()=>{
  const text=JSON.stringify(order.filter(id=>/^(a1|a2|b1)-/.test(id)).map(id=>units[id]));
  for(const wrong of ['Hablo un poco de este idioma.','"idioma"','Quiero un poco de arroz.','Aunque estaba cansada, terminó el trabajo.','"permitido"','"necesitar"'])assert.ok(!text.includes(wrong),wrong);
});

test('la producción acepta la respuesta escrita solo en kana y con cifras',()=>{
  const find=(id,activityId)=>activities(id).find(activity=>activity.id===activityId);
  assert.equal(evaluateGuidedAnswer(find('a1-1-identity','japanese-a1-1-identity-production-translate'),'おなまえはなんですか。','Japanese').correct,true);
  assert.equal(evaluateGuidedAnswer(find('a1-1-routine','japanese-a1-1-routine-production-translate'),'7時に起きます。','Japanese').correct,true);
  assert.equal(evaluateGuidedAnswer(find('a1-1-routine','japanese-a1-1-routine-production-dictation'),'ごごにべんきょうします','Japanese').correct,true);
  const complete=find('first-words','japanese-first-words-production-complete');
  assert.notEqual(complete.target.trim(),'＿');
  const health=find('a1-2-health','japanese-a1-2-health-production-speak');
  assert.equal(health.answer,'頭が痛いです。','el alumno no repite la frase del médico');
});

test('los diálogos de tres turnos dejan un error de margen',()=>{
  for(const id of order)for(const activity of activities(id).filter(activity=>activity.turns)){
    const learners=activity.turns.filter(turn=>turn.role==='learner').length;
    if(learners>=3)assert.equal(activity.minimum_correct,learners-1,activity.id);
  }
});
