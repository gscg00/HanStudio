export const VIRTUAL_KEY_SPACE='__space__';
export const VIRTUAL_KEY_BACKSPACE='__backspace__';
export const VIRTUAL_KEY_CLEAR='__clear__';

const CHOSEONG=['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const JUNGSEONG=['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
const JONGSEONG=['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const CONSONANTS=new Set([...CHOSEONG,...JONGSEONG.slice(1)]);
const VOWELS=new Set(JUNGSEONG);

const rows=(...values)=>values;
const latinLower=rows(
  [...'qwertyuiop'],
  [...'asdfghjkl'],
  [...'zxcvbnm']
);
const latinUpper=latinLower.map(row=>row.map(value=>value.toUpperCase()));
const page=(id,label,keyRows)=>({id,label,rows:keyRows});

const LANGUAGE_PAGES={
  English:[
    page('lower','abc',latinLower),
    page('upper','ABC',latinUpper),
    page('marks','Signos',rows(["'",'-','.','?',',','!']))
  ],
  French:[
    page('lower','abc',latinLower),
    page('upper','ABC',latinUpper),
    page('accents','Acentos',rows(['à','â','æ','ç','é','è','ê','ë'],['î','ï','ô','œ','ù','û','ü','ÿ'],['À','Â','Æ','Ç','É','È','Ê','Ë','Î','Ï','Ô','Œ','Ù','Û','Ü','Ÿ']))
  ],
  German:[
    page('lower','abc',latinLower),
    page('upper','ABC',latinUpper),
    page('special','Alemán',rows(['ä','ö','ü','ß'],['Ä','Ö','Ü','ẞ'],["'",'-','.','?',',','!']))
  ],
  Italian:[
    page('lower','abc',latinLower),
    page('upper','ABC',latinUpper),
    page('accents','Acentos',rows(['à','è','é','ì','ò','ó','ù'],['À','È','É','Ì','Ò','Ó','Ù'],["'",'-','.','?',',','!']))
  ],
  Portuguese:[
    page('lower','abc',latinLower),
    page('upper','ABC',latinUpper),
    page('accents','Acentos',rows(['á','â','ã','à','ç','é','ê','í','ó','ô','õ','ú'],['Á','Â','Ã','À','Ç','É','Ê','Í','Ó','Ô','Õ','Ú'],["'",'-','.','?',',','!']))
  ],
  Russian:[
    page('cyrillic-lower','абв',rows([...'йцукенгшщзхъ'],[...'фывапролджэ'],[...'ячсмитьбю'],['ё'])),
    page('cyrillic-upper','АБВ',rows([...'ЙЦУКЕНГШЩЗХЪ'],[...'ФЫВАПРОЛДЖЭ'],[...'ЯЧСМИТЬБЮ'],['Ё']))
  ],
  Korean:[
    // Disposición 2-set: consonantes y vocales comparten el mismo teclado, como en un móvil coreano.
    // La última fila reúne las teclas ampliadas necesarias para las lecciones sin obligar a cambiar de pantalla.
    page('korean-2set','한국어',rows(
      ['ㅂ','ㅈ','ㄷ','ㄱ','ㅅ','ㅛ','ㅕ','ㅑ','ㅐ','ㅔ'],
      ['ㅁ','ㄴ','ㅇ','ㄹ','ㅎ','ㅗ','ㅓ','ㅏ','ㅣ'],
      ['ㅋ','ㅌ','ㅊ','ㅍ','ㅠ','ㅜ','ㅡ'],
      ['ㄲ','ㄸ','ㅃ','ㅆ','ㅉ','ㅒ','ㅖ','ㅘ','ㅙ','ㅚ','ㅝ','ㅞ','ㅟ','ㅢ']
    ))
  ],
  Japanese:[
    page('hiragana','Hiragana',rows(['あ','い','う','え','お'],['か','き','く','け','こ'],['さ','し','す','せ','そ'],['た','ち','つ','て','と'],['な','に','ぬ','ね','の'],['は','ひ','ふ','へ','ほ'],['ま','み','む','め','も'],['や','ゆ','よ','ら','り','る','れ','ろ'],['わ','を','ん','が','ぎ','ぐ','げ','ご'],['ざ','じ','ず','ぜ','ぞ','だ','ぢ','づ','で','ど'],['ば','び','ぶ','べ','ぼ','ぱ','ぴ','ぷ','ぺ','ぽ'],['ゃ','ゅ','ょ','っ','ー'])),
    page('katakana','Katakana',rows(['ア','イ','ウ','エ','オ'],['カ','キ','ク','ケ','コ'],['サ','シ','ス','セ','ソ'],['タ','チ','ツ','テ','ト'],['ナ','ニ','ヌ','ネ','ノ'],['ハ','ヒ','フ','ヘ','ホ'],['マ','ミ','ム','メ','モ'],['ヤ','ユ','ヨ','ラ','リ','ル','レ','ロ'],['ワ','ヲ','ン','ガ','ギ','グ','ゲ','ゴ'],['ザ','ジ','ズ','ゼ','ゾ','ダ','ヂ','ヅ','デ','ド'],['バ','ビ','ブ','ベ','ボ','パ','ピ','プ','ペ','ポ'],['ャ','ュ','ョ','ッ','ー']))
  ],
  Chinese:[
    page('pinyin','Pinyin',latinLower),
    page('tones','Tonos',rows(['ā','á','ǎ','à','ē','é','ě','è'],['ī','í','ǐ','ì','ō','ó','ǒ','ò'],['ū','ú','ǔ','ù','ǖ','ǘ','ǚ','ǜ','ü']))
  ],
  Arabic:[
    page('arabic','Árabe',rows(['ض','ص','ث','ق','ف','غ','ع','ه','خ','ح','ج','د'],['ش','س','ي','ب','ل','ا','ت','ن','م','ك','ط'],['ئ','ء','ؤ','ر','ى','ة','و','ز','ظ'],['ذ','أ','إ','آ','لا'])),
    page('arabic-marks','Vocales y signos',rows(['َ','ُ','ِ','ْ','ّ','ً','ٌ','ٍ','ـ'],['،','؛','؟','.','!']))
  ]
};

const isHan=value=>/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u.test(value);
const isJapaneseKanji=value=>isHan(value);
const uniqueCharacters=(text,predicate)=>[...new Set([...String(text||'')].filter(character=>predicate(character)))];

export function decomposeHangulText(value){
  const output=[];
  for(const character of String(value||'')){
    const code=character.codePointAt(0);
    if(code<0xac00||code>0xd7a3){output.push(character);continue;}
    const offset=code-0xac00;
    const finalIndex=offset%28;
    const vowelIndex=Math.floor(offset/28)%21;
    const initialIndex=Math.floor(offset/(28*21));
    output.push(CHOSEONG[initialIndex],JUNGSEONG[vowelIndex]);
    if(finalIndex)output.push(JONGSEONG[finalIndex]);
  }
  return output;
}

export function composeHangulTokens(tokens){
  const input=[...tokens];
  let output='';
  for(let index=0;index<input.length;){
    const initial=input[index],vowel=input[index+1];
    if(CHOSEONG.includes(initial)&&VOWELS.has(vowel)){
      let final='',consumed=2;
      const candidate=input[index+2],afterCandidate=input[index+3];
      if(candidate&&JONGSEONG.includes(candidate)&&!VOWELS.has(afterCandidate)){
        final=candidate;
        consumed=3;
      }
      const code=0xac00+(CHOSEONG.indexOf(initial)*21+JUNGSEONG.indexOf(vowel))*28+JONGSEONG.indexOf(final);
      output+=String.fromCodePoint(code);
      index+=consumed;
    }else{
      output+=initial;
      index+=1;
    }
  }
  return output;
}

export function applyVirtualKey(value,key,language){
  const current=String(value||'');
  if(key===VIRTUAL_KEY_CLEAR)return'';
  if(language==='Korean'){
    const tokens=decomposeHangulText(current);
    if(key===VIRTUAL_KEY_BACKSPACE)tokens.pop();
    else if(key===VIRTUAL_KEY_SPACE)tokens.push(' ');
    else tokens.push(key);
    return composeHangulTokens(tokens);
  }
  if(key===VIRTUAL_KEY_BACKSPACE)return[...current].slice(0,-1).join('');
  if(key===VIRTUAL_KEY_SPACE)return`${current} `;
  return`${current}${key}`;
}

export function virtualKeyboardLayout(language,lessonActivities=[]){
  const pages=(LANGUAGE_PAGES[language]||LANGUAGE_PAGES.English).map(item=>({...item,rows:item.rows.map(row=>[...row])}));
  const lessonText=(lessonActivities||[]).flatMap(activity=>[activity.answer,...(activity.accepted_answers||[])]).join('');
  if(language==='Chinese'){
    const characters=uniqueCharacters(lessonText,isHan).slice(0,60);
    if(characters.length)pages.unshift(page('lesson-characters','Caracteres',Array.from({length:Math.ceil(characters.length/10)},(_,index)=>characters.slice(index*10,index*10+10))));
  }
  if(language==='Japanese'){
    const characters=uniqueCharacters(lessonText,isJapaneseKanji).slice(0,60);
    if(characters.length)pages.unshift(page('lesson-kanji','Kanji de la lección',Array.from({length:Math.ceil(characters.length/10)},(_,index)=>characters.slice(index*10,index*10+10))));
  }
  return{language,pages};
}
