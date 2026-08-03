import assert from 'node:assert/strict';
import{
  applyVirtualKeyAtSelection,
  applyVirtualKey,
  composeHangulTokens,
  decomposeHangulText,
  virtualKeyFromPhysicalInput,
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
assert.equal(['ㅇ','ㅗ','ㅏ','ㅆ'].reduce((value,key)=>applyVirtualKey(value,key,'Korean'),''),'왔','Debe componer vocales dobles y consonantes finales');
assert.equal(['ㄱ','ㅏ','ㄴ','ㅏ'].reduce((value,key)=>applyVirtualKey(value,key,'Korean'),''),'가나','Una vocal posterior debe mover la consonante final a la sílaba siguiente');
assert.equal(['ㄷ','ㅏ','ㄹ','ㄱ','ㅏ'].reduce((value,key)=>applyVirtualKey(value,key,'Korean'),''),'달가','Una vocal posterior debe dividir una consonante final compuesta');
assert.equal(applyVirtualKey('왔',VIRTUAL_KEY_BACKSPACE,'Korean'),'와','El retroceso debe retirar primero la consonante final');
assert.equal(applyVirtualKey('와',VIRTUAL_KEY_BACKSPACE,'Korean'),'오','El retroceso debe deshacer después la vocal compuesta');
assert.deepEqual(applyVirtualKeyAtSelection('abc','Z','English',1,2),{value:'aZc',cursor:2},'Debe sustituir la selección sin borrar la respuesta entera');
assert.deepEqual(applyVirtualKeyAtSelection('문자',VIRTUAL_KEY_BACKSPACE,'Korean',1,2),{value:'문',cursor:1},'Debe borrar únicamente el carácter coreano seleccionado');
assert.deepEqual(applyVirtualKeyAtSelection('문',VIRTUAL_KEY_BACKSPACE,'Korean',1,1),{value:'무',cursor:1},'El retroceso coreano conserva la composición gradual');
assert.deepEqual(applyVirtualKeyAtSelection('처음 보는 얼굴이네요 어디에서 오','ㅏ','Korean',18,18),{value:'처음 보는 얼굴이네요 어디에서 와',cursor:18},'Debe componer una vocal en la posición actual del cursor');
assert.deepEqual(applyVirtualKeyAtSelection('처음 보는 얼굴이네요 어디에서 와','ㅆ','Korean',18,18),{value:'처음 보는 얼굴이네요 어디에서 왔',cursor:18},'Debe añadir la consonante final sin separar los jamos');
assert.equal(virtualKeyFromPhysicalInput('Korean',{key:'q',code:'KeyQ'}),'ㅂ','El teclado físico latino debe controlar el 2-set coreano');
assert.equal(virtualKeyFromPhysicalInput('Korean',{key:'Q',code:'KeyQ',shiftKey:true}),'ㅃ','Mayús debe activar las variantes coreanas');
assert.equal(virtualKeyFromPhysicalInput('Russian',{key:'f',code:'KeyF'}),'а','El teclado físico debe poder controlar el cirílico');
assert.equal(virtualKeyFromPhysicalInput('Arabic',{key:'g',code:'KeyG'}),'ل','El teclado físico debe poder controlar el árabe');

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
const russian=virtualKeyboardLayout('Russian',[]);
assert.deepEqual(russian.pages[0].rows.map(row=>row.length),[12,11,10],'El teclado ruso debe ocupar solo tres filas en móvil');
assert.ok(russian.pages[0].rows.flat().includes('ъ'));
assert.ok(russian.pages[0].rows.flat().includes('ё'));
const koreanWithParticle=virtualKeyboardLayout('Korean',[{answer:'은/는'}]);
assert.ok(koreanWithParticle.pages.find(page=>page.id==='lesson-signs')?.rows.flat().includes('/'),'Debe ofrecer la diagonal exigida por la respuesta');
const koreanDialogueSigns=virtualKeyboardLayout('Korean',[{turns:[{role:'learner',answer:'네, 물이 있어요.'}]}]);
assert.ok(koreanDialogueSigns.pages.find(page=>page.id==='lesson-signs')?.rows.flat().includes(','),'Debe revisar también las respuestas anidadas del diálogo');

const hangulUnit=JSON.parse(readFileSync(new URL('../library/courses/Korean/units/hangul-foundations.json',import.meta.url),'utf8'));
const mun=hangulUnit.lessons.flatMap(lesson=>lesson.activities).find(activity=>activity.id==='korean-hangul-foundations-production-translate');
assert.equal(evaluateGuidedAnswer(mun,'문','Korean').correct,true,'Debe aceptar la sílaba final escrita directamente');

console.log('guided virtual keyboard logic: ok');
