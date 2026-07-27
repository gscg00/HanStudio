import assert from 'node:assert/strict';
import{
  applyVirtualKey,
  composeHangulTokens,
  decomposeHangulText,
  VIRTUAL_KEY_BACKSPACE,
  virtualKeyboardLayout
}from'../src/guided_virtual_keyboard.js';

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

console.log('guided virtual keyboard logic: ok');
