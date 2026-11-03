// Convierte las escenas de los cómics en clases de «Lengua real»: cada frase con su
// sentido natural, su desglose y sus notas de gramática. Genera src/data/comic_classes.js.
// Uso: node scripts/build_comic_classes.mjs
import fs from 'node:fs';

export const COMIC_PATH={French:['HF-44-S1','HF-CRITICAL-S1'],German:['HG-FOGLAND-S1','HG-AOUAD-S1'],Korean:['HS-VARIETY-S01E01','HK-PPALRYO-S1']};
const MAX_CLASSES=12,MIN_LINES=10,MAX_LINES=16;
const clean=text=>String(text||'').replace(/\s+/g,' ').trim();

// Las notas se generaron por coincidencia de texto: «lassen» salía en «verlassen». Una nota se
// queda solo si las palabras del idioma que nombra están de verdad en la frase.
const GENERIC=new Set(['palabra de vocabulario','verbo o forma flexionada']);
const wordsOf=text=>String(text).toLowerCase().split(/[^\p{L}\p{M}]+/u).filter(Boolean);
function noteFits(pattern,sentence,language,corpus){
  if(language==='Korean'){const pieces=String(pattern).split(/[\/,·~()\s]+/).map(piece=>piece.replace(/^-+/,'').replace(/[^\p{Script=Hangul}]/gu,'')).filter(piece=>piece.length);return!pieces.length||pieces.some(piece=>sentence.includes(piece));}
  const words=new Set(wordsOf(sentence)),named=wordsOf(pattern).filter(word=>corpus.has(word));
  return!named.length||named.some(word=>words.has(word));
}

const out={},mangaNotes={};
for(const[language,codes]of Object.entries(COMIC_PATH)){
  const corpus=new Set(codes.flatMap(code=>JSON.parse(fs.readFileSync(`library/books/${code}/hanstory_manifest.json`,'utf8')).tracks.flatMap(track=>wordsOf(track.text))));
  const classes=[];
  for(const code of codes){
    const manifest=JSON.parse(fs.readFileSync(`library/books/${code}/hanstory_manifest.json`,'utf8'));
    const notes=JSON.parse(fs.readFileSync(`library/books/${code}/explanations/track_explanations.json`,'utf8')).items||{};
    const lessons=new Map();
    for(const track of manifest.tracks){
      const note=notes[track.id];
      if(track.type!=='phrase'||!clean(track.text)||!note||note.requires_review)continue;
      const line=[clean(track.text),clean(note.natural_meaning_es||track.translation),String(track.audio_path||"").replace(/^audio\//,""),clean(track.speaker),
        (note.breakdown||[]).slice(0,10).map(part=>[clean(part.text),clean(part.meaning_es),GENERIC.has(clean(part.function_es))?'':clean(part.function_es)]),
        (note.grammar_notes||[]).filter(part=>noteFits(part.pattern,clean(track.text),language,corpus)).slice(0,3).map(part=>[clean(part.pattern),clean(part.explanation_es)])];
      lessons.set(track.lesson,[...(lessons.get(track.lesson)||[]),line]);
    }
    let group=null;
    for(const[number,lines]of[...lessons.entries()].sort((a,b)=>a[0]-b[0])){
      if(classes.length>=MAX_CLASSES&&!group)break;
      group??={code,title:manifest.title.split(' — ')[0].split(':')[0].trim(),from:number,to:number,lines:[]};
      if(group.lines.length+lines.length>MAX_LINES&&group.lines.length>=MIN_LINES){classes.push(group);group=null;if(classes.length>=MAX_CLASSES)break;group={code,title:manifest.title.split(' — ')[0].split(':')[0].trim(),from:number,to:number,lines:[]};}
      group.lines.push(...lines);group.to=number;
    }
    if(group&&group.lines.length>=MIN_LINES&&classes.length<MAX_CLASSES)classes.push(group);
    if(classes.length>=MAX_CLASSES)break;
  }
  out[language]=classes.map((group,index)=>({id:`comic-${language.slice(0,2).toLowerCase()}-${index+1}`,...group}));
}
// ── Tarjetas de manga exportadas de Manga Lingua (library/personal_manga) ──
// Se agrupan en escenas por obra y página. «놓지마 어휘» enseña hanja: va aparte.
const MANGA_LANGUAGES=['French','German','Korean','English'],HANJA_SOURCE='놓지마 어휘';
const excluded=new Set(JSON.parse(fs.readFileSync('library/personal_manga/excluded.json','utf8')).texts.map(text=>clean(text)));
const isUpper=text=>{const letters=String(text).replace(/[^\p{L}]/gu,'');return letters.length>3&&letters===letters.toUpperCase()&&letters!==letters.toLowerCase();};
// En francés se puede volver a minúsculas: los nombres propios se reconocen porque la
// traducción los conserva con mayúscula. En alemán no: los sustantivos llevan mayúscula.
function sentenceCase(text,keep){
  const lower=String(text).toLowerCase().replace(/(^|[.!?…]\s+|«\s*|—\s*)(\p{Ll})/gu,(match,lead,char)=>lead+char.toUpperCase());
  return lower.replace(/\p{L}+/gu,word=>keep.has(word.toLowerCase())?keep.get(word.toLowerCase()):word);
}
const properNames=translation=>new Map((String(translation).match(/(?<![.!?¿¡«]\s)(?<!^)\b\p{Lu}\p{Ll}+/gu)||[]).map(word=>[word.toLowerCase(),word]));
const fixCase=(text,translation,language)=>{
  const meaning=isUpper(translation)?sentenceCase(translation,new Map()):translation;
  return[language==='French'&&isUpper(text)?sentenceCase(text,properNames(meaning)):text,meaning];
};
const levelName=level=>['A1','A1','A2','B1','B1+'][Math.max(0,Math.min(4,Number(level)||2))];
for(const language of MANGA_LANGUAGES){
  const file=`library/personal_manga/cards-${language}.json`;
  if(!fs.existsSync(file))continue;
  const cards=JSON.parse(fs.readFileSync(file,'utf8')).cards.filter(card=>clean(card.text)&&clean(card.translation)&&!excluded.has(clean(card.text))&&(card.breakdown||[]).length);
  const bySource=new Map();
  for(const card of cards)bySource.set(card.source,[...(bySource.get(card.source)||[]),card]);
  const scenes=[];
  for(const[source,list]of bySource){
    if(language==='Korean'&&source==='Kapitel 0')continue; // mal etiquetado: es coreano de otra obra
    list.sort((a,b)=>a.page-b.page);
    const hanja=source===HANJA_SOURCE;
    // Un capítulo de hanja empieza en cada página de escena (la que tiene diálogo largo).
    let group=null;const flush=()=>{if(group&&group.lines.length>=(hanja?6:8))scenes.push(group);group=null;};
    for(const card of list){
      const startsChapter=hanja&&list.filter(other=>other.page===card.page).length>=8&&group&&group.from!==card.page&&group.lines.length>=6;
      if(startsChapter||(!hanja&&group&&group.lines.length>=14))flush();
      group??={kind:hanja?'hanja':'manga',source,code:`manga-${language}-${source}`,title:hanja?'Hanja':source,from:card.page,to:card.page,levels:[],lines:[],notes:{}};
      const[text,meaning]=fixCase(clean(card.text),clean(card.translation),language);
      group.lines.push([text,meaning,'','']);group.to=card.page;group.levels.push(card.level);
      group.notes[text]=[card.breakdown.slice(0,10).map(part=>[clean(part.term),clean(part.meaning),clean(part.note)]),clean(card.note)?[['Contexto',clean(card.note)]]:[]];
    }
    flush();
  }
  // El título de un capítulo de hanja es su raíz: «家 (casa)», tomada de las definiciones.
  for(const scene of scenes.filter(item=>item.kind==='hanja')){
    const roots=scene.lines.flatMap(([text])=>[...text.matchAll(/\((\p{Script=Han})\p{Script=Han}?\)/gu)].map(match=>match[1]));
    const counts=new Map();roots.forEach(root=>counts.set(root,(counts.get(root)||0)+1));
    const root=[...counts.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0];
    scene.title=root?`Hanja: ${root}`:'Hanja';
  }
  out[language]=[...(out[language]||[]),...scenes.map((scene,index)=>{
    const sorted=[...scene.levels].sort((a,b)=>a-b),level=scene.kind==='hanja'?'B1':levelName(sorted[Math.floor(sorted.length/2)]);
    const{levels,notes,...rest}=scene;
    mangaNotes[language]={...(mangaNotes[language]||{}),...notes};
    return{id:`${scene.kind}-${language.slice(0,2).toLowerCase()}-${index+1}`,...rest,level};
  })];
}

// El plan solo necesita las frases (un archivo por idioma, que se carga al abrir ese idioma);
// el análisis de cada frase se descarga al empezar la clase.
fs.mkdirSync('library/comic_notes',{recursive:true});fs.mkdirSync('src/data/comics',{recursive:true});
for(const old of fs.readdirSync('src/data/comics'))fs.rmSync(`src/data/comics/${old}`);
if(fs.existsSync('src/data/comic_classes.js'))fs.rmSync('src/data/comic_classes.js');
for(const[language,classes]of Object.entries(out)){
  const notes={...(mangaNotes[language]||{})};
  const scenes=classes.map(group=>({...group,lines:group.lines.map(([target,meaning,file,speaker,breakdown,grammar])=>{if(breakdown)notes[target]=[breakdown,grammar];return[target,meaning,file,speaker];})}));
  fs.writeFileSync(`library/comic_notes/${language}.json`,JSON.stringify(notes));
  fs.writeFileSync(`src/data/comics/${language}.js`,`// Generado por scripts/build_comic_classes.mjs: no editar a mano.\n// Escenas de cómic y manga. Cada línea: [frase, sentido natural, archivo en library/books/<code>/audio/, hablante].\n// kind: sin valor = libro con audio; 'manga' = tarjeta de Manga Lingua; 'hanja' = capítulo de 놓지마 어휘.\nexport const COMIC_SCENES=${JSON.stringify(scenes)};\n`);
}
for(const[language,classes]of Object.entries(out)){const kinds={};for(const group of classes)kinds[group.kind||'libro']=(kinds[group.kind||'libro']||0)+1;console.log(language,classes.length,'escenas',JSON.stringify(kinds),classes.reduce((sum,group)=>sum+group.lines.length,0),'frases');}
