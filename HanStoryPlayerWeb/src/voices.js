// Elección de voces del sistema (Web Speech) para todos los idiomas: la mejor
// calidad disponible y, cuando se pide, una voz femenina o masculina.

// Calidad: Premium («superior») > Mejorada > natural/neural > básica.
const QUALITY=[/premium|superior/i,/enhanced|mejorada|optimizada/i,/natural|neural|online|google/i];
export const voiceQuality=voice=>{const index=QUALITY.findIndex(pattern=>pattern.test(voice.name));return index<0?0:QUALITY.length-index;};

// Nombres de voces de Apple, Google y Microsoft más comunes por género.
const FEMALE=/\b(yuna|sora|heami|sunhi|kyoko|o-ren|nanami|lilian|tingting|ting-ting|meijia|mei-jia|sinji|xiaoxiao|milena|katya|svetlana|audrey|am[eé]lie|marie|aurelie|denise|anna|petra|helena|katja|alice|federica|elsa|paola|joana|catarina|luciana|fernanda|raquel|samantha|karen|moira|serena|tessa|fiona|victoria|allison|ava|susan|zoe|laila|mariam|amira|salma|zariyah|marisol|paulina|m[oó]nica|lucia|flo|sandy|shelley|grandma|female)\b/i;
const MALE=/\b(minsu|injoon|otoya|hattori|ichiro|keita|han|li-mu|yu-shu|yunxi|yuri|maxim|dmitri|thomas|daniel|nicolas|henri|markus|yannick|conrad|luca|diego|cosimo|joaquim|duarte|felipe|antonio|alex|fred|tom|aaron|arthur|oliver|majed|maged|tarik|hamed|jorge|juan|eddy|reed|rocko|grandpa|male)\b/i;

export const speechLangFor=code=>({ko:'ko-KR',ja:'ja-JP',zh:'zh-CN',en:'en-US',fr:'fr-FR',de:'de-DE',it:'it-IT',pt:'pt-PT',ru:'ru-RU',ar:'ar-SA',es:'es-MX'})[code]||code;

// gender: 'f' | 'm' | '' ; seedName varía la voz de personajes secundarios.
export function pickVoice(langCode,{gender='',seedName='',voices=window.speechSynthesis?.getVoices?.()||[]}={}){
  const base=String(langCode).toLowerCase().split('-')[0],wanted=speechLangFor(base).toLowerCase();
  const pool=voices.filter(voice=>voice.lang?.toLowerCase().replace('_','-').startsWith(base));
  if(!pool.length)return null;
  // Variante regional preferida (pt-PT, es-MX…) solo como desempate.
  const score=voice=>voiceQuality(voice)*10+(voice.lang?.toLowerCase().replace('_','-')===wanted?3:0);
  const pattern=gender==='f'?FEMALE:gender==='m'?MALE:null,opposite=gender==='f'?MALE:gender==='m'?FEMALE:null;
  let candidates=pattern?pool.filter(voice=>pattern.test(voice.name)&&!opposite.test(voice.name)):pool;
  if(!candidates.length)candidates=pool;
  const ranked=[...candidates].sort((a,b)=>score(b)-score(a));
  if(!seedName)return ranked[0];
  // Personajes secundarios: misma calidad, pero otra voz si la hay.
  const top=ranked.filter(voice=>voiceQuality(voice)===voiceQuality(ranked[0]));
  return top[[...seedName].reduce((sum,ch)=>sum+ch.codePointAt(0),0)%top.length];
}
