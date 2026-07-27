import assert from 'node:assert/strict';
import{
  applyVirtualKey,
  composeHangulTokens,
  decomposeHangulText,
  VIRTUAL_KEY_BACKSPACE,
  virtualKeyboardLayout
}from'../src/guided_virtual_keyboard.js';
import{evaluateGuidedAnswer}from'../src/guided_course_answers.js';
import{readFileSync}from'node:fs';

assert.equal(composeHangulTokens(['ㅁ','ㅜ','ㄴ']),'문');
assert.equal(composeHangulTokens(['ㅎ','ㅏ','ㄴ','ㄱ','ㅡ','ㄹ']),'한글');
assert.deepEqual(decomposeHangulText('문'),['ㅁ','ㅜ','ㄴ']);
assert.equal(applyVirtualKey('문',VIRTUAL_KEY_BACKSPACE,'Korean'),'무');
assert.equal(['ㅁ','ㅜ','ㄴ'].reduce((value,key)=>applyVirtualKey(value,key,'Korean'),''),'문');

for(const language of['English','French','German','Italian','Portuguese','Russian','Korean','Japanese','Chinese','Arabic']){
  const layout=virtualKeyboardLayout(language,[]);
  assert.ok(layout.pages.length,`${language} debe tener páginas`);
  assert.ok(layout.pages.every(page=>page.rows.flat().length),`${language} no debe tener páginas vacías`);
}

const chinese=virtualKeyboardLayout('Chinese',[{answer:'你好吗？'}]);
assert.ok(chinese.pages[0].rows.flat().includes('你'));
const japanese=virtualKeyboardLayout('Japanese',[{answer:'日本語'}]);
assert.ok(japanese.pages[0].rows.flat().includes('日'));

const korean=virtualKeyboardLayout('Korean',[]);
assert.equal(korean.pages.length,1,'El teclado coreano debe ser una única disposición táctil');
assert.equal(korean.pages[0].rows.length,3,'La disposición principal coreana debe caber sin una fila extra');
assert.ok(korean.pages[0].rows.flat().includes('ㅁ'));
assert.ok(korean.pages[0].rows.flat().includes('ㅜ'));

const hangulUnit=JSON.parse(readFileSync(new URL('../library/courses/Korean/units/hangul-foundations.json',import.meta.url),'utf8'));
const mun=hangulUnit.lessons.flatMap(lesson=>lesson.activities).find(activity=>activity.id==='korean-hangul-foundations-production-translate');
assert.equal(evaluateGuidedAnswer(mun,'문','Korean').correct,true,'Debe aceptar la sílaba final escrita directamente');

console.log('guided virtual keyboard logic: ok');
