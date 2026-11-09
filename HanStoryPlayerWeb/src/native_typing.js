// Escribir en el idioma con el teclado físico (inglés o español) sin abrir el
// teclado del curso ni instalar nada: cada tecla produce la letra que tendría en
// un teclado nativo (coreano 2-beolsik, ruso ЙЦУКЕН, árabe estándar) y en japonés
// el rōmaji se convierte en kana, como en un ordenador japonés. Así se aprende de
// memoria dónde está cada letra. Si el sistema ya tiene el teclado del idioma
// (escritura con composición), no se toca nada.
import{applyVirtualKeyAtSelection,virtualKeyFromPhysicalInput,VIRTUAL_KEY_BACKSPACE}from'./guided_virtual_keyboard.js';

export const POSITIONAL=new Set(['Korean','Russian','Arabic']);
export const NATIVE_TYPING_LANGUAGES=new Set([...POSITIONAL,'Japanese']);
const STORAGE='hanstudio:native-typing';

export function nativeTypingEnabled(){try{return localStorage.getItem(STORAGE)!=='off';}catch{return true;}}
export function setNativeTyping(on){try{localStorage.setItem(STORAGE,on?'on':'off');}catch{}}

// ── Rōmaji → kana ─────────────────────────────────────────────────────
const ROWS={'':'あいうえお',k:'かきくけこ',s:'さしすせそ',t:'たちつてと',n:'なにぬねの',h:'はひふへほ',m:'まみむめも',y:'や-ゆ-よ',r:'らりるれろ',w:'わ--を-',g:'がぎぐげご',z:'ざじずぜぞ',d:'だぢづでど',b:'ばびぶべぼ',p:'ぱぴぷぺぽ',j:'じゃ'};
const VOWELS='aiueo',ROMAJI=new Map();
for(const[consonant,kana]of Object.entries(ROWS))if(consonant!=='j')[...VOWELS].forEach((vowel,index)=>{const char=[...kana][index];if(char&&char!=='-')ROMAJI.set(consonant+vowel,char);});
const SMALL={a:'ゃ',u:'ゅ',o:'ょ'};
for(const[base,i]of[['k','き'],['s','し'],['t','ち'],['n','に'],['h','ひ'],['m','み'],['r','り'],['g','ぎ'],['z','じ'],['b','び'],['p','ぴ']])for(const[vowel,small]of Object.entries(SMALL))ROMAJI.set(`${base}y${vowel}`,i+small);
for(const[combo,kana]of[['shi','し'],['chi','ち'],['tsu','つ'],['fu','ふ'],['ji','じ'],['sha','しゃ'],['shu','しゅ'],['sho','しょ'],['cha','ちゃ'],['chu','ちゅ'],['cho','ちょ'],['ja','じゃ'],['ju','じゅ'],['jo','じょ'],['wo','を'],['xtsu','っ'],['ltsu','っ'],['xa','ぁ'],['xi','ぃ'],['xu','ぅ'],['xe','ぇ'],['xo','ぉ'],['-','ー'],['ti','ち'],['tu','つ'],['si','し'],['zi','じ'],['di','ぢ'],['du','づ'],['hu','ふ']])ROMAJI.set(combo,kana);
const toKatakana=text=>text.replace(/[ぁ-ゖ]/g,char=>String.fromCharCode(char.charCodeAt(0)+0x60));

// Convierte el rōmaji pendiente al final del texto. Devuelve el texto nuevo.
export function romajiToKana(text,{katakana=false}={}){
  let out='',buffer='';
  const chars=[...String(text)],flush=kana=>{out+=katakana?toKatakana(kana):kana;buffer='';};
  chars.forEach((char,index)=>{
    const lower=char.toLowerCase(),next=(chars[index+1]||'').toLowerCase();
    if(lower==="'"&&buffer==='n'){flush('ん');return;}
    if(!/[a-z\-]/.test(lower)){out+=buffer+char;buffer='';return;}
    buffer+=lower;
    // «nn»: como un teclado japonés, espera a la letra siguiente (konnichiha → こんにちは).
    if(buffer==='nn'){if(!next)return;flush('ん');if(VOWELS.includes(next)||next==='y')buffer='n';return;}
    // Consonante doble → っ (kk, tt…).
    if(buffer.length===2&&buffer[0]===buffer[1]&&!VOWELS.includes(buffer[0])){flush('っ');buffer=lower;return;}
    // n + consonante (no y) → ん
    if(buffer.length===2&&buffer[0]==='n'&&!VOWELS.includes(buffer[1])&&buffer[1]!=='y'){flush('ん');buffer=lower;}
    if(ROMAJI.has(buffer)){flush(ROMAJI.get(buffer));return;}
    if(buffer.length>=4){out+=buffer;buffer='';}
  });
  return out+buffer;
}

// Al terminar de escribir: la «n» o «nn» final que esperaba es ん.
export const finishKana=(text,options)=>romajiToKana(String(text).replace(/n{1,2}$/i,"n'"),options);

// ── Integración con cualquier campo de texto ─────────────────────────
const languageOf=element=>element?.closest?.('[data-typing-lang]')?.dataset.typingLang||element?.closest?.('.jp-app[data-course-language]')?.dataset.courseLanguage||'';
const editable=element=>element&&(element.tagName==='TEXTAREA'||(element.tagName==='INPUT'&&/^(text|search|)$/.test(element.type||'')))&&!element.readOnly&&!element.disabled&&element.dataset.nativeTyping!=='off';
const emitInput=element=>element.dispatchEvent(new Event('input',{bubbles:true}));

export function handleNativeKeydown(event){
  const element=event.target;
  if(event.defaultPrevented||event.isComposing||event.ctrlKey||event.metaKey||event.altKey||!editable(element)||!nativeTypingEnabled())return;
  const language=languageOf(element);
  if(!POSITIONAL.has(language))return;
  // Solo letras y retroceso: los números, la puntuación y Enter se quedan como están.
  if(!/^Key[A-Z]$|^(Semicolon|Quote|Comma|Period|BracketLeft|BracketRight|Backquote|Slash)$/.test(event.code)&&!(language==='Korean'&&event.key==='Backspace'))return;
  const key=virtualKeyFromPhysicalInput(language,event);
  if(!key||key==='__submit__')return;
  // Si la tecla no cambia nada (p. ej. el sistema ya escribe en ese alfabeto), no se toca.
  if(key!==VIRTUAL_KEY_BACKSPACE&&key===event.key)return;
  event.preventDefault();
  const result=applyVirtualKeyAtSelection(element.value,key,language,element.selectionStart??element.value.length,element.selectionEnd??element.value.length);
  element.value=result.value;
  const cursor=[...result.value].slice(0,result.cursor).join('').length;
  element.setSelectionRange?.(cursor,cursor);
  emitInput(element);
}

export function handleNativeInput(event){
  const element=event.target;
  if(event.isComposing||!editable(element)||!nativeTypingEnabled()||languageOf(element)!=='Japanese'||element.dataset.kanaBusy)return;
  const value=element.value,converted=romajiToKana(value,{katakana:element.dataset.kana==='katakana'});
  if(converted===value)return;
  element.dataset.kanaBusy='1';
  element.value=converted;
  element.setSelectionRange?.(converted.length,converted.length);
  emitInput(element);
  delete element.dataset.kanaBusy;
}

if(typeof window!=='undefined'){
  window.addEventListener('keydown',handleNativeKeydown);
  window.addEventListener('input',handleNativeInput,true);
}
