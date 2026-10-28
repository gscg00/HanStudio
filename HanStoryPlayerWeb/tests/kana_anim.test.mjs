import test from 'node:test';
import assert from 'node:assert/strict';
import {kanaAnimationHTML,kanaCardPlan,kanaParts,morae,twinOf} from '../src/kana_anim.js';

test('cuenta moras: los kana pequeños se pegan; っ, ー y ん cuentan solos',()=>{
  assert.deepEqual(morae('きって'),['き','っ','て']);
  assert.deepEqual(morae('しゃしん'),['しゃ','し','ん']);
  assert.deepEqual(morae('コーヒー'),['コ','ー','ヒ','ー']);
});

test('descompone marcas y kana pequeños y encuentra el gemelo del otro silabario',()=>{
  assert.deepEqual(kanaParts('が'),{kind:'dakuten',base:'か',extra:'゛',result:'が'});
  assert.deepEqual(kanaParts('ぱ'),{kind:'handakuten',base:'は',extra:'゜',result:'ぱ'});
  assert.deepEqual(kanaParts('ティ'),{kind:'small',base:'テ',extra:'ィ',result:'ティ'});
  assert.equal(kanaParts('か'),null);
  assert.equal(twinOf('あ'),'ア');
  assert.equal(twinOf('カ'),'か');
});

test('cada tarjeta de kana recibe su animación',()=>{
  assert.equal(kanaCardPlan({target:'あ'}).kind,'twin');
  assert.equal(kanaCardPlan({target:'が'}).kind,'compose');
  assert.deepEqual(kanaCardPlan({target:'っ'}).rows,[['き','っ','て']]);
  assert.deepEqual(kanaCardPlan({target:'おばさん · おばあさん'}).rows.map(row=>row.length),[4,5]);
  assert.equal(kanaCardPlan({target:'人'}),null);
  assert.match(kanaAnimationHTML({target:'か',sound_hint:'Suena «ka».'}),/«ka»[\s\S]*カ/);
  assert.match(kanaAnimationHTML({target:'きって'}),/jk-beat pause/);
});
