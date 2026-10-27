import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildCloseSet,buildPracticeSet,buildReviewSet,completePhase,createDailyClass,dailyStatus,dateKey,defaultDailyState,DAILY_PHASES,pickTodayLessons,recallChoice,taughtItems} from '../src/daily_class.js';

const course=JSON.parse(fs.readFileSync(new URL('../library/courses/Korean/course.json',import.meta.url)));
const units=course.levels.flatMap(level=>level.unitIds).map(id=>JSON.parse(fs.readFileSync(new URL(`../library/courses/Korean/units/${id}.json`,import.meta.url))));
const survival=units.find(unit=>unit.id==='survival');

test('las lecciones de hoy siguen el orden del curso y respetan el presupuesto',()=>{
  const picked=pickTodayLessons(units,{startLessonId:survival.lessons[0].id});
  assert.equal(picked[0].lessonId,survival.lessons[0].id);
  const size=picked.reduce((sum,ref)=>sum+survival.lessons.find(lesson=>lesson.id===ref.lessonId).activities.length,0);
  assert.ok(picked.length>=1&&size<=48);
});

test('una clase sin terminar se retoma; terminada, la siguiente espera a mañana',()=>{
  const today=new Date('2026-10-27T10:00:00'),tomorrow=new Date('2026-10-28T08:00:00');
  let state=createDailyClass(defaultDailyState('korean'),{lessons:[],items:[],now:today});
  assert.equal(dailyStatus(state,today),'in-progress');
  assert.equal(dailyStatus(state,tomorrow),'in-progress');
  for(const phase of DAILY_PHASES)state=completePhase(state,phase.id,null,today);
  assert.equal(state.classes[0].completedDate,dateKey(today));
  assert.equal(dailyStatus(state,today),'done-today');
  assert.equal(dailyStatus(state,tomorrow),'ready');
});

test('las explicaciones largas no se toman como vocabulario',()=>{
  const items=units.flatMap(unit=>unit.lessons).flatMap(taughtItems);
  assert.ok(items.length>200);
  assert.ok(items.every(item=>item.meaning.length<=48&&!/[+→=]/.test(item.target)));
});

test('la respuesta correcta no cae siempre en la misma posición',()=>{
  const items=survival.lessons.flatMap(taughtItems);
  const positions=new Set(items.slice(0,12).map(item=>{const activity=recallChoice(item,items,'s');return activity.options.indexOf(activity.answer);}));
  assert.ok(positions.size>1);
});

test('repaso, práctica y cierre producen ejercicios válidos',()=>{
  const items=survival.lessons.slice(0,3).flatMap(taughtItems),yesterday=items.slice(0,5),today=items.slice(5);
  for(const set of [buildReviewSet(yesterday,[],items,{seed:'a'}),buildPracticeSet(today,items,{seed:'b'}),buildCloseSet(today,yesterday,items,{seed:'c'})]){
    assert.ok(set.length>0);
    for(const activity of set){
      assert.ok(activity.answer,activity.id);
      if(activity.type!=='dictation')assert.ok(activity.options.includes(activity.answer)||activity.type==='build_with_blocks',activity.id);
      if(activity.type!=='build_with_blocks')assert.equal(new Set(activity.options).size,activity.options.length,activity.id);
    }
  }
});
