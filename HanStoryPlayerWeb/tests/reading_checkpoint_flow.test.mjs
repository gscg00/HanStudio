import test from'node:test';
import assert from'node:assert/strict';

globalThis.Audio=class{pause(){}};
globalThis.location={hostname:'test.local',search:'',hash:''};
globalThis.window={speechSynthesis:{cancel(){}},addEventListener(){},removeEventListener(){}};

const {JapaneseCourseApp}=await import('../src/japanese_course_app.js');

const lesson=id=>({id,activities:[]});
const unit=(id,lessonId)=>({id,lessons:[lesson(lessonId)]});

test('la lectura de cierre bloquea el siguiente mundo hasta responder correctamente',async()=>{
  const writes=[];
  const app=new JapaneseCourseApp({
    root:{addEventListener(){},removeEventListener(){},querySelectorAll(){return[];}},get:async()=>null,
    put:async(store,value)=>writes.push({store,value}),url:path=>path,language:'Korean'
  });
  const first=unit('u1','l1'),second=unit('u2','l2');
  app.course={units:[{id:'u1'},{id:'u2'}]};
  app.units=new Map([['u1',first],['u2',second]]);
  app.progress={completedLessons:['l1','earlier'],unlockedUnits:['u1'],unlockedLessons:['l1'],currentUnit:'u1',currentLesson:'l1'};
  app.mangaCards=[
    {id:'reading-1',language:'Korean',text:'안녕',translation:'Hola',breakdown:[{term:'안녕',meaning:'hola'}],level:1,unlockAfter:2,priority:0},
    {id:'reading-2',language:'Korean',text:'감사합니다',translation:'Gracias',breakdown:[{term:'감사합니다',meaning:'gracias'}],level:1,unlockAfter:2,priority:1}
  ];

  assert.equal(app.startReadingCheckpoint(first),true);
  assert.deepEqual(app.mangaState.pendingCheckpoint.cardIds,['reading-1']);
  assert.equal(app.currentReadingSessionCard().translation,'Hola');
  assert.ok(app.readingOptions(app.currentReadingSessionCard()).includes('Hola'));
  assert.equal(app.progress.unlockedUnits.includes('u2'),false);

  await app.completeReadingCheckpoint();
  assert.equal(app.progress.unlockedUnits.includes('u2'),true);
  assert.equal(app.progress.unlockedLessons.includes('l2'),true);
  assert.equal(app.progress.currentLesson,'l2');
  assert.deepEqual(app.mangaState.completedCheckpointUnits,['u1']);
  assert.deepEqual(app.mangaState.completedCardIds,['reading-1']);
  assert.ok(writes.some(entry=>entry.value?.id==='manga:Korean'));
  assert.ok(writes.some(entry=>entry.value===app.progress));
});
