import test from 'node:test';
import assert from 'node:assert/strict';
import {GAME_MASTERY,answer,createGame,finished,markSeen,nextCard} from '../src/daily_game_logic.js';

const items=['물','빵','사과','집','버스','우산'].map((target,i)=>({target,meaning:`m${i}`}));

test('cada palabra se presenta antes de preguntarla, y nunca se pregunta sin opciones válidas',()=>{
  const game=createGame(items,{seed:'t'}),introduced=new Set();
  for(let i=0;i<80&&!finished(game);i++){
    const card=nextCard(game);
    if(card.type==='intro'){introduced.add(card.target);markSeen(game,card.target);continue;}
    if(card.type==='pairs'){assert.ok(card.targets.every(target=>introduced.has(target)));card.targets.forEach(target=>answer(game,target,true));continue;}
    assert.ok(introduced.has(card.target),`${card.target} se preguntó sin presentarse`);
    assert.equal(card.options.length,4);assert.ok(card.options.includes(card.target));
    answer(game,card.target,true);
  }
  assert.ok(finished(game),'con respuestas correctas el juego termina');
});

test('las tarjetas suben de dificultad y un error hace retroceder la palabra',()=>{
  const game=createGame(items.slice(0,4),{seed:'d'});
  const types=[];
  for(let i=0;i<30&&types.filter(type=>type==='listen').length<1;i++){
    const card=nextCard(game);types.push(card.type);
    if(card.type==='intro')markSeen(game,card.target);
    else if(card.type==='pairs')card.targets.forEach(target=>answer(game,target,true));
    else answer(game,card.target,true);
  }
  assert.ok(types.indexOf('pick-image')<types.indexOf('pick-word')&&types.indexOf('pick-word')<types.indexOf('listen'));
  const stats=answer(game,'물',false);
  assert.ok(stats.correct<GAME_MASTERY);
});
