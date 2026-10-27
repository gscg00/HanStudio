import test from 'node:test';
import assert from 'node:assert/strict';
import {buildRecapTimeline,pickRecapItems,sceneAt} from '../src/recap/recap_timeline.js';

const items=Array.from({length:23},(_,i)=>({target:i%3?`단어${i}`:`문장 ${i} 이에요.`,meaning:`significado ${i}`}));

test('el video repasa todo lo visto, sin límite y sin repetidos',()=>{
  const picked=pickRecapItems([...items,items[0],{target:'ㄱ + ㅏ → 가',meaning:'regla'}]);
  assert.equal(picked.length,23);
  const timeline=buildRecapTimeline({classNumber:4,items});
  assert.equal(timeline.beats.filter(beat=>beat.item).length,23);
});

test('alterna escuchar y producir, y cada pregunta tiene sus tres tramos en orden',()=>{
  const timeline=buildRecapTimeline({classNumber:1,items:items.slice(0,4)});
  assert.deepEqual(timeline.beats.map(beat=>beat.kind),['title','listen','produce','listen','produce','end']);
  for(const beat of timeline.beats.filter(beat=>beat.phases)){
    assert.ok(beat.phases.ask[1]<=beat.phases.think[0]+1e-9&&beat.phases.think[1]<=beat.phases.reveal[0]+1e-9);
    assert.equal(sceneAt(timeline,(beat.phases.think[0]+beat.phases.think[1])/2).phase,'think');
  }
  // La respuesta solo suena después de la cuenta atrás.
  for(const beat of timeline.beats.filter(beat=>beat.kind==='listen')){
    const spanish=timeline.speech.find(item=>item.beat===beat.index&&item.lang==='es');
    assert.ok(spanish.t>=beat.phases.reveal[0]);
  }
});

test('los videos por tema enseñan en orden, siempre escuchando primero y con sus propios rótulos',()=>{
  const items=[{target:'빨강',meaning:'rojo'},{target:'파랑',meaning:'azul'},{target:'빨강',meaning:'rojo'}];
  const timeline=buildRecapTimeline({mode:'teach',items,heading:'LOS COLORES',closing:'Vuelve mañana',titleSpeech:'Los colores.',endSpeech:'¡Muy bien!',voiceFor:()=>'tl-m'});
  const steps=timeline.beats.filter(beat=>beat.item);
  assert.deepEqual(steps.map(beat=>beat.kind),['listen','listen','listen']);
  assert.deepEqual(steps.map(beat=>beat.item.ko),['빨강','파랑','빨강']);
  assert.equal(timeline.beats[0].heading,'LOS COLORES');
  assert.equal(timeline.beats.at(-1).closing,'Vuelve mañana');
  assert.equal(timeline.speech[0].text,'Los colores.');
  assert.ok(timeline.speech.filter(line=>line.lang==='tl').every(line=>line.voice==='tl-m'));
});
