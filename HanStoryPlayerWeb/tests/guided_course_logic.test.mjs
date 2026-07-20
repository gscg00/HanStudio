import test from'node:test';
import assert from'node:assert/strict';
import{completeGuidedLesson,completeGuidedReview,defaultGuidedProgress,GUIDED_REVIEW_INTERVAL_DAYS,reviewSchedule,scoreActivities,unlockCompletedUnitSuccessors}from'../src/guided_course_logic.js';

const config={id:'guided:test:v1',language:'Test',firstUnit:'u1',firstLesson:'l1',passingScore:85};
const activity={id:'a1',type:'select_translation',prompt:'?',target:'A',options:['uno','dos'],answer:'uno',xp:10};
const lesson={id:'l1',activities:[activity]};
const unit={id:'u1',lessons:[lesson]};
const resultFor=answer=>scoreActivities(lesson.activities,{a1:answer});
const daysBetween=(a,b)=>Math.round((Date.parse(b)-Date.parse(a))/86400000);

test('cada elemento aprendido entra al repaso del día siguiente',()=>{const now=new Date('2026-07-18T12:00:00Z'),progress=completeGuidedLesson(defaultGuidedProgress(config),unit,lesson,resultFor('uno'),config,now),item=progress.mistakes[0];assert.equal(item.stage,0);assert.equal(item.intervalDays,1);assert.equal(daysBetween(now.toISOString(),item.dueAt),1);assert.equal(reviewSchedule(progress,new Date('2026-07-18T23:00:00Z')).due.length,0);assert.equal(reviewSchedule(progress,new Date('2026-07-20T00:00:00Z')).due.length,1);});

test('los aciertos avanzan por 1, 3, 7, 14 y 30 días',()=>{let progress=completeGuidedLesson(defaultGuidedProgress(config),unit,lesson,resultFor('uno'),config,new Date('2026-07-18T12:00:00Z'));const expectedStages=[1,2,3,4,4],expectedIntervals=[3,7,14,30,30];for(let index=0;index<expectedStages.length;index++){const old=progress.mistakes[0],now=new Date(old.dueAt);progress=completeGuidedReview(progress,[old],resultFor('uno'),config,now);const next=progress.mistakes[0];assert.equal(next.stage,expectedStages[index]);assert.equal(next.intervalDays,expectedIntervals[index]);assert.equal(daysBetween(now.toISOString(),next.dueAt),expectedIntervals[index]);}assert.deepEqual(GUIDED_REVIEW_INTERVAL_DAYS,[1,3,7,14,30]);});

test('un olvido reinicia el intervalo y vuelve a mostrar el elemento mañana',()=>{let progress=completeGuidedLesson(defaultGuidedProgress(config),unit,lesson,resultFor('uno'),config,new Date('2026-07-18T12:00:00Z')),old=progress.mistakes[0];progress=completeGuidedReview(progress,[old],resultFor('uno'),config,new Date(old.dueAt));old=progress.mistakes[0];progress=completeGuidedReview(progress,[old],resultFor('dos'),config,new Date(old.dueAt));const reset=progress.mistakes[0];assert.equal(reset.stage,0);assert.equal(reset.intervalDays,1);assert.equal(reset.lastResult,'wrong');assert.equal(daysBetween(reset.lastReviewedAt,reset.dueAt),1);});

test('una etapa nueva se desbloquea al migrar un curso anterior ya terminado',()=>{const oldLesson={id:'old-final',activities:[]},newLesson={id:'a11-first',activities:[]},units=[{id:'foundations',lessons:[oldLesson]},{id:'a1-1',lessons:[newLesson]}],progress={...defaultGuidedProgress(config),completedLessons:['old-final'],unlockedUnits:['foundations'],unlockedLessons:['old-final'],currentUnit:'foundations',currentLesson:'old-final'};unlockCompletedUnitSuccessors(progress,units);assert.deepEqual(progress.unlockedUnits,['foundations','a1-1']);assert.ok(progress.unlockedLessons.includes('a11-first'));assert.equal(progress.currentUnit,'a1-1');assert.equal(progress.currentLesson,'a11-first');});
