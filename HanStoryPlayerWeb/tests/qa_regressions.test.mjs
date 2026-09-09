import test from 'node:test';
import assert from 'node:assert/strict';
import {canBuildAnswer,productionPresentation} from '../src/guided_activity_quality.js';
import {evaluateGuidedAnswer} from '../src/guided_course_answers.js';
import {recognizeGuidedSpeech} from '../src/guided_speech_recognition.js';
import {SerialTaskQueue} from '../src/serial_task_queue.js';

test('block validation permits distractors and repeated tokens but rejects impossible answers',()=>{
  assert.equal(canBuildAnswer({answer:'ぱ',options:['·','か→が','は→ぱ']}),false);
  assert.equal(canBuildAnswer({answer:'nǚ',options:['ü','→','nǚ']}),true);
  assert.equal(canBuildAnswer({answer:'very very good',options:['very','good','very'],joiner:' '}),true);
  assert.equal(canBuildAnswer({answer:'very very good',options:['very','good'],joiner:' '}),false);
});
test('copy and block instructions match the controls',()=>{
  assert.equal(productionPresentation({type:'typed_translation',prompt:'Copia esta letra'}).label,'Copia y escribe');
  assert.match(productionPresentation({type:'build_with_blocks'}).instruction,/bloques/);
  assert.equal(productionPresentation({type:'open_question'}).label,'Recuerda la expresión');
  assert.match(productionPresentation({type:'speak_and_transcribe'}).instruction,/voz alta.*escríbela/i);
});
test('generic typo tolerance does not accept a changed meaningful word',()=>{
  assert.equal(evaluateGuidedAnswer({type:'typed_translation',answer:'I can swim.',allow_minor_typos:true},'I cant swim.','English').correct,false);
});
test('meaning-based production accepts known equivalents without changing dictation',()=>{
  for(const [language,answer,given] of [
    ['English','What do you think?',"What's your opinion?"],
    ['French','Qu’est-ce que tu en penses ?','Qu’en penses-tu ?'],
    ['German','Was meinst du dazu?','Was denkst du darüber?'],
    ['Italian','Tu che cosa ne pensi?','Cosa ne pensi?'],
    ['Portuguese','O que achas?','O que você acha?'],
    ['Russian','А ты как думаешь?','Что ты думаешь?'],
    ['Chinese','你觉得怎么样？','你怎么看？'],
    ['Japanese','どう思いますか。','どう思いますか？'],
    ['Korean','어떻게 생각해요?','어떻게 생각하세요?'],
    ['Arabic','ما رأيك؟','ما هو رأيك؟']
  ])assert.equal(evaluateGuidedAnswer({type:'open_question',answer},given,language).correct,true,language);
  assert.equal(evaluateGuidedAnswer({type:'dictation',answer:'What do you think?'},"What's your opinion?",'English').correct,false);
  assert.equal(evaluateGuidedAnswer({type:'typed_translation',answer:'What do you think?',tags:['copying']},"What's your opinion?",'English').correct,false);
});
test('owner transitions serialize even after a rejected transition',async()=>{
  const queue=new SerialTaskQueue(),events=[];
  let release;
  const first=queue.run(async()=>{events.push('start');await new Promise(r=>release=r);events.push('saved');throw Error('network');});
  const second=queue.run(()=>events.push('restore guest'));
  await Promise.resolve();assert.deepEqual(events,['start']);release();
  await assert.rejects(first,/network/);await second;
  assert.deepEqual(events,['start','saved','restore guest']);
});
test('speech cancellation and timeout release the recognizer',async()=>{
  const previous=globalThis.SpeechRecognition;let recognizer;
  class FakeRecognition{constructor(){recognizer=this;}start(){}abort(){this.aborted=true;}}
  globalThis.SpeechRecognition=FakeRecognition;
  try{
    const controller=new AbortController(),pending=recognizeGuidedSpeech('Korean',{signal:controller.signal});
    controller.abort();await assert.rejects(pending,{code:'cancelled'});
    assert.equal(recognizer.aborted,true);assert.equal(recognizer.onend,null);
    await assert.rejects(recognizeGuidedSpeech('French',{timeout:5}),{code:'timeout'});
    assert.equal(recognizer.aborted,true);
    const result=recognizeGuidedSpeech('German');
    recognizer.onresult({results:[[{transcript:'Guten Tag',confidence:1}]]});
    assert.equal((await result).transcript,'Guten Tag');assert.equal(recognizer.aborted,true);
  }finally{globalThis.SpeechRecognition=previous;}
});
