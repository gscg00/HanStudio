import test from 'node:test';
import assert from 'node:assert/strict';
import {buildLevel,levelOf,levelResult,timeFor,typedMatches,typingPool,typingText,waveWords} from '../src/typing_logic.js';
import {romajiToKana,finishKana} from '../src/native_typing.js';

test('el material de escritura se clasifica por dificultad y lo aprendido va primero',()=>{
  const pool=typingPool([{target:'ㄱ',meaning:'g/k'},{target:'물',meaning:'agua',known:true},{target:'안녕하세요',meaning:'hola'},{target:'물 주세요.',meaning:'Agua, por favor'},{target:'물',meaning:'repetida'}],'Korean');
  assert.deepEqual(pool.map(item=>[item.text,item.level]),[['ㄱ','letters'],['물','short'],['안녕하세요','words'],['물 주세요','phrases']]);
  assert.equal(buildLevel([...pool,{text:'빵',meaning:'pan',level:'short',known:false}],'short')[0].text,'물');
});

test('en japonés solo se practica lo que se escribe en kana',()=>{
  assert.equal(typingText({target:'こんにちは'},'Japanese'),'こんにちは');
  assert.equal(typingText({target:'月曜日',note:'げつようび'},'Japanese'),'げつようび');
  assert.equal(typingText({target:'家族'},'Japanese'),'');
});

test('comprobar lo escrito, el tiempo y el resultado del nivel',()=>{
  assert.ok(typedMatches('Bonjour','bonjour','French'));
  assert.ok(!typedMatches('bonjur','bonjour','French'));
  assert.ok(typedMatches('молоко','Молоко.','Russian'));
  assert.ok(timeFor('안녕하세요','Korean')>timeFor('물','Korean'));
  assert.deepEqual(levelResult([...Array(8)].map(()=>({ok:true})).concat([{ok:false},{ok:false}])),{correct:8,total:10,passed:true});
  assert.equal(levelOf('ㅏ','Korean'),'letters');
});

test('cada ola de asteroides trae más palabras',()=>{
  const pool=typingPool(['물','빵','차','밥','사과','우유','커피','학교'].map(target=>({target,meaning:'x'})),'Korean');
  assert.ok(waveWords(pool,3).length>waveWords(pool,0).length);
});

test('rōmaji a kana como un teclado japonés',()=>{
  let typed='';for(const char of 'konnichiha')typed=romajiToKana(typed+char);
  assert.equal(typed,'こんにちは');
  assert.equal(romajiToKana('gakkou'),'がっこう');
  assert.equal(finishKana(romajiToKana('hon')),'ほん');
  assert.equal(romajiToKana('ko-hi-',{katakana:true}),'コーヒー');
});

test('letras difíciles, carrera y dictado',async()=>{
  const {updateWeakness,weakFirst,raceTexts,correctPrefix,dictationItems,typingPool:pool}=await import('../src/typing_logic.js');
  let weak=updateWeakness({},'ㄹ',false);weak=updateWeakness(weak,'ㄱ',false);weak=updateWeakness(weak,'ㄱ',true);
  assert.deepEqual(weakFirst([{text:'ㄱ'},{text:'ㄴ'},{text:'ㄹ'}],weak).map(item=>item.text),['ㄹ','ㄱ','ㄴ']);
  assert.equal(correctPrefix('안녕하','안녕하세요'),3);
  assert.equal(correctPrefix('안냥','안녕하세요'),1);
  const items=pool(['물 주세요.','감사합니다','안녕하세요','이거 주세요','계산서 주세요','잘 모르겠어요'].map(target=>({target,meaning:'x'})),'Korean');
  assert.ok(raceTexts(items).length>=3);
  assert.ok(dictationItems(items).every(item=>item.level!=='phrases'));
});
