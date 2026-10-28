import test from 'node:test';
import assert from 'node:assert/strict';
import {blockAnimationHTML,blockLayout,decompose,syllablesForCard} from '../src/hangul_blocks.js';

test('descompone cada sílaba en inicial, vocal y final con la forma de la vocal',()=>{
  assert.deepEqual(decompose('한'),{syllable:'한',initial:'ㅎ',vowel:'ㅏ',final:'ㄴ',shape:'vertical'});
  assert.deepEqual(decompose('글'),{syllable:'글',initial:'ㄱ',vowel:'ㅡ',final:'ㄹ',shape:'horizontal'});
  assert.equal(decompose('과').shape,'mixed');
  assert.equal(decompose('a'),null);
});

test('con vocal vertical la inicial va a la izquierda; con horizontal, arriba; el batchim abajo',()=>{
  const vertical=blockLayout(decompose('한')),horizontal=blockLayout(decompose('오'));
  assert.ok(vertical.vowel[0]>vertical.initial[0]);
  assert.ok(vertical.final[1]>=vertical.initial[1]+vertical.initial[3]);
  assert.ok(horizontal.vowel[1]>horizontal.initial[1]);
  assert.equal(horizontal.final,undefined);
});

test('cada tarjeta de letras anima la sílaba que enseña',()=>{
  assert.deepEqual(syllablesForCard({target:'ㅎ + ㅏ + ㄴ = 한'}),['한']);
  assert.deepEqual(syllablesForCard({target:'inicial + vocal + final = bloque'}),['한']);
  assert.deepEqual(syllablesForCard({target:'한국어'}),['한','국','어']);
  assert.deepEqual(syllablesForCard({target:'ㄱ',audio:'가'}),['가']);
  const html=blockAnimationHTML(['한']);
  assert.match(html,/hb-initial[^>]*>ㅎ</);
  assert.match(html,/hb-final[^>]*>ㄴ</);
  assert.match(html,/ㅎ \+ ㅏ \+ ㄴ = 한/);
});
