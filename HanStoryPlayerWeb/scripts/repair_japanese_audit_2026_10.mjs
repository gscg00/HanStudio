// Correcciones críticas de la auditoría del curso de japonés
// (docs/AUDITORIA_JAPONES_2026-10-27.md). Idempotente: se puede volver a
// ejecutar sin duplicar lecciones ni respuestas.
import fs from 'node:fs';

const dir=new URL('../library/courses/Japanese/',import.meta.url);
const files=new Map();
const load=name=>{
  if(!files.has(name)){const url=new URL(name,dir),before=fs.readFileSync(url,'utf8');files.set(name,{url,before,data:JSON.parse(before)});}
  return files.get(name).data;
};
const unit=id=>load(`units/${id}.json`);
const allActivities=data=>data.lessons.flatMap(lesson=>lesson.activities);
const course=load('course.json');
const order=course.levels.flatMap(level=>level.unitIds);

// Reemplaza un texto en todos los campos de todas las lecciones de una unidad.
function replaceText(data,from,to,{whole=false}={}){
  const walk=value=>{
    if(typeof value==='string')return whole?(value===from?to:value):value.split(from).join(to);
    if(Array.isArray(value))return value.map(walk);
    if(value&&typeof value==='object'){for(const key of Object.keys(value))value[key]=walk(value[key]);}
    return value;
  };
  data.lessons.forEach(walk);
}
const placed=(answer,others,index)=>{const list=[...others];list.splice(index%3,0,answer);return list;};
const upsertLessons=(data,lessons,beforeId)=>{
  for(const lesson of lessons){
    const existing=data.lessons.findIndex(item=>item.id===lesson.id);
    if(existing>=0){data.lessons[existing]=lesson;continue;}
    const at=data.lessons.findIndex(item=>item.id===beforeId);
    data.lessons.splice(at<0?data.lessons.length:at,0,lesson);
  }
};

// ── C1. Pistas de sonido reales para cada kana ────────────────────────────
// Antes, de な en adelante la «pista» era «Escucha el sonido de な…», que
// contiene el propio kana: la pregunta «¿Cómo suena este kana?» se acertaba
// buscando el carácter. Y los distractores eran siempre «a de casa» / «i de vino».
const ROMAJI={
  あ:'a',い:'i',う:'u',え:'e',お:'o',か:'ka',き:'ki',く:'ku',け:'ke',こ:'ko',さ:'sa',し:'shi',す:'su',せ:'se',そ:'so',た:'ta',ち:'chi',つ:'tsu',て:'te',と:'to',
  な:'na',に:'ni',ぬ:'nu',ね:'ne',の:'no',は:'ha',ひ:'hi',ふ:'fu',へ:'he',ほ:'ho',ま:'ma',み:'mi',む:'mu',め:'me',も:'mo',や:'ya',ゆ:'yu',よ:'yo',
  ら:'ra',り:'ri',る:'ru',れ:'re',ろ:'ro',わ:'wa',を:'wo',ん:'n',が:'ga',ぎ:'gi',ぐ:'gu',げ:'ge',ご:'go',ざ:'za',じ:'ji',ず:'zu',ぜ:'ze',ぞ:'zo',
  だ:'da',ぢ:'dji',づ:'dzu',で:'de',ど:'do',ば:'ba',び:'bi',ぶ:'bu',べ:'be',ぼ:'bo',ぱ:'pa',ぴ:'pi',ぷ:'pu',ぺ:'pe',ぽ:'po',
  きゃ:'kya',きゅ:'kyu',きょ:'kyo',しゃ:'sha',しゅ:'shu',しょ:'sho',ちゃ:'cha',ちゅ:'chu',ちょ:'cho',にゃ:'nya',にゅ:'nyu',にょ:'nyo',ひゃ:'hya',ひょ:'hyo',みゃ:'mya',
  りゃ:'rya',りゅ:'ryu',りょ:'ryo',ぎゃ:'gya',ぎゅ:'gyu',ぎょ:'gyo',じゃ:'ja',じゅ:'ju',じょ:'jo',びょ:'byo',ぴょ:'pyo',
  ああ:'aa',いい:'ii',うう:'uu',ええ:'ee',おお:'oo',こう:'koo',せい:'see',っ:'Q',
};
const HINT={
  あ:'Suena como la «a» de casa.',い:'Suena como la «i» de vino.',う:'Suena como una «u» breve, con los labios poco redondeados.',え:'Suena como la «e» de mesa.',お:'Suena como la «o» de sol.',
  か:'Suena «ka».',き:'Suena «ki».',く:'Suena «ku».',け:'Suena «ke».',こ:'Suena «ko».',
  さ:'Suena «sa».',し:'Suena parecido a «shi».',す:'Suena «su»; la u puede ser muy suave.',せ:'Suena «se».',そ:'Suena «so».',
  た:'Suena «ta».',ち:'Suena parecido a «chi».',つ:'Suena parecido a «tsu».',て:'Suena «te».',と:'Suena «to».',
  な:'Suena «na».',に:'Suena «ni».',ぬ:'Suena «nu».',ね:'Suena «ne».',の:'Suena «no».',
  は:'Suena «ja» muy suave: una h aspirada, más suave que la j mexicana. Como partícula se lee «wa».',ひ:'Suena «ji» muy suave: h aspirada, como un soplo.',
  ふ:'Suena «fu» soplando entre los labios, sin apoyar los dientes.',へ:'Suena «je» muy suave (h aspirada). Como partícula se lee «e».',ほ:'Suena «jo» muy suave (h aspirada).',
  ま:'Suena «ma».',み:'Suena «mi».',む:'Suena «mu».',め:'Suena «me».',も:'Suena «mo».',
  や:'Suena «ya».',ゆ:'Suena «yu».',よ:'Suena «yo».',
  ら:'Suena «ra» con la r suave de «pero» (nunca rr).',り:'Suena «ri» con la r suave de «pero».',る:'Suena «ru» con la r suave de «pero».',れ:'Suena «re» con la r suave de «pero».',ろ:'Suena «ro» con la r suave de «pero».',
  わ:'Suena «wa», como «gua» muy suave.',を:'En el japonés moderno normalmente suena igual que お.',ん:'Es la nasal final. Su sonido cambia ligeramente según lo que sigue.',
  が:'Suena «ga», como en «gato».',ぎ:'Suena «gui», como en «guitarra».',ぐ:'Suena «gu», como en «gusto».',げ:'Suena «gue», como en «guerra».',ご:'Suena «go», como en «gol».',
  ざ:'Suena «za» con z zumbada, como la z inglesa de «zoo» (no como s).',じ:'Suena «yi» firme, como la j inglesa de «jeep»; nunca como la jota española.',
  ず:'Suena «zu» con z zumbada (no como s).',ぜ:'Suena «ze» con z zumbada (no como s).',ぞ:'Suena «zo» con z zumbada (no como s).',
  だ:'Suena «da».',ぢ:'Suena igual que じ («yi» firme). Se usa muy poco.',づ:'Suena igual que ず («zu» zumbada). Se usa muy poco.',で:'Suena «de».',ど:'Suena «do».',
  ば:'Suena «ba», con los labios bien cerrados.',び:'Suena «bi», con los labios bien cerrados.',ぶ:'Suena «bu», con los labios bien cerrados.',べ:'Suena «be», con los labios bien cerrados.',ぼ:'Suena «bo», con los labios bien cerrados.',
  ぱ:'Suena «pa».',ぴ:'Suena «pi».',ぷ:'Suena «pu».',ぺ:'Suena «pe».',ぽ:'Suena «po».',
  きゃ:'Suena «kia» en un solo golpe.',きゅ:'Suena «kiu» en un solo golpe.',きょ:'Suena «kio» en un solo golpe.',
  しゃ:'Suena «sha», como la sh inglesa.',しゅ:'Suena «shu», como la sh inglesa.',しょ:'Suena «sho», como la sh inglesa.',
  ちゃ:'Suena «cha».',ちゅ:'Suena «chu».',ちょ:'Suena «cho».',
  にゃ:'Suena «ña», como en «niña».',にゅ:'Suena «ñu».',にょ:'Suena «ño».',ひゃ:'Suena «jia» muy suave, en un solo golpe (h aspirada).',ひょ:'Suena «jio» muy suave, en un solo golpe (h aspirada).',
  みゃ:'Suena «mia» en un solo golpe.',りゃ:'Suena «ria» en un solo golpe, con r suave.',りゅ:'Suena «riu» en un solo golpe, con r suave.',りょ:'Suena «rio» en un solo golpe, con r suave.',
  ぎゃ:'Suena «guia» en un solo golpe.',ぎゅ:'Suena «guiu» en un solo golpe.',ぎょ:'Suena «guio» en un solo golpe.',
  じゃ:'Suena «ya» firme, como «ja» en la palabra inglesa «jazz».',じゅ:'Suena «yu» firme, como la j inglesa de «juice».',じょ:'Suena «yo» firme, como la j inglesa de «joke».',
  びょ:'Suena «bio» en un solo golpe.',ぴょ:'Suena «pio» en un solo golpe.',
  ああ:'«a» larga: mantén la a durante dos pulsos.',いい:'«i» larga: mantén la i durante dos pulsos.',うう:'«u» larga: mantén la u durante dos pulsos.',ええ:'«e» larga: mantén la e durante dos pulsos.',おお:'«o» larga: mantén la o durante dos pulsos.',
  こう:'Se escribe こ + う, pero se lee «ko» con o larga (dos pulsos), nunca «ko-u».',せい:'Se escribe せ + い, pero se lee «se» con e larga (dos pulsos), nunca «se-i».',
  っ:'No tiene un sonido aislado: crea una pausa de un pulso antes de la consonante siguiente, como en «kit-te» (sello).',
};
const toKata=text=>[...text].map(ch=>{const code=ch.codePointAt(0);return code>=0x3041&&code<=0x3096?String.fromCodePoint(code+0x60):ch;}).join('');
const KATA_EXTRA={
  ティ:['ti','Suena «ti», como en español (no «chi»).'],ディ:['di','Suena «di», como en español (no «yi»).'],ファ:['fa','Suena «fa» soplando entre los labios.'],フィ:['fi','Suena «fi» soplando entre los labios.'],
  フェ:['fe','Suena «fe» soplando entre los labios.'],フォ:['fo','Suena «fo» soplando entre los labios.'],ウィ:['wi','Suena «ui» en un solo golpe.'],ウェ:['we','Suena «ue» en un solo golpe.'],ウォ:['wo','Suena «uo» en un solo golpe.'],
  ー:['long','No tiene sonido aislado: alarga la vocal anterior.'],ッ:['Q','No tiene un sonido aislado: crea una pausa de un pulso antes de la consonante siguiente, como en «mes-seeji» (mensaje).'],
  ジャ:['ja','Suena «ya» firme, como «ja» en la palabra inglesa «jazz».'],ジュ:['ju','Suena «yu» firme, como la j inglesa de «juice» (jugo).'],ジョ:['jo','Suena «yo» firme, como la j inglesa de «joke».'],
};
const KATA_SUFFIX=' En katakana cambia la forma escrita, no el sonido básico.';
function kanaInfo(kana){
  if(HINT[kana])return {romaji:ROMAJI[kana],hint:HINT[kana]};
  if(KATA_EXTRA[kana])return {romaji:KATA_EXTRA[kana][0],hint:KATA_EXTRA[kana][1]};
  const hira=[...kana].map(ch=>{const code=ch.codePointAt(0);return code>=0x30a1&&code<=0x30f6?String.fromCodePoint(code-0x60):ch;}).join('');
  if(HINT[hira])return {romaji:ROMAJI[hira],hint:hira.length===1?HINT[hira]+KATA_SUFFIX:HINT[hira]};
  return null;
}
// Sonidos idénticos: nunca se ofrecen como distractor uno del otro.
const HOMOPHONES=[['ji','dji'],['zu','dzu'],['o','wo']];
const sameSound=(a,b)=>a===b||HOMOPHONES.some(pair=>pair.includes(a)&&pair.includes(b));
const parts=romaji=>{const m=/^(.*?)([aeiou])$/.exec(romaji);return m?{consonant:m[1],vowel:m[2]}:{consonant:romaji,vowel:''};};
function pickDistractors(kana,taught){
  const info=kanaInfo(kana),me=parts(info.romaji);
  const pool=[...new Set([...taught].reverse())].filter(other=>other!==kana&&kanaInfo(other)&&!sameSound(kanaInfo(other).romaji,info.romaji)&&kanaInfo(other).hint!==info.hint);
  // Preferencia: misma consonante (な/に), misma inicial (にゃ/な), misma vocal y mismo tamaño, misma vocal.
  const score=other=>{const p=parts(kanaInfo(other).romaji);return p.consonant===me.consonant?0:p.consonant[0]&&p.consonant[0]===me.consonant[0]?1:p.vowel===me.vowel&&other.length===kana.length?2:p.vowel===me.vowel?3:4;};
  const ranked=pool.map((other,index)=>({other,rank:score(other)*1000+index})).sort((a,b)=>a.rank-b.rank).map(item=>item.other);
  // Si aún se ha enseñado poco (primeras vocales), se completa con vocales.
  for(const fallback of ['い','う','え','お','あ'].map(ch=>/[゠-ヿ]/.test(kana)?toKata(ch):ch))if(ranked.length<2&&fallback!==kana&&!ranked.includes(fallback))ranked.push(fallback);
  return ranked.slice(0,2).map(other=>kanaInfo(other).hint);
}
function repairKanaUnit(data){
  const taught=[];
  for(const lesson of data.lessons)for(const activity of lesson.activities){
    if(activity.type==='teach_kana'){
      const info=kanaInfo(activity.target);
      if(info)activity.sound_hint=info.hint;
      if(!taught.includes(activity.target))taught.push(activity.target);
      continue;
    }
    if(activity.type!=='kana_to_audio')continue;
    const info=kanaInfo(activity.target);if(!info)continue;
    const index=Math.max(0,activity.options.indexOf(activity.answer));
    activity.options=placed(info.hint,pickDistractors(activity.target,taught),index);
    activity.answer=info.hint;activity.explanation=info.hint;
  }
}

// ── C2. Kana que se usaban sin enseñarse ─────────────────────────────────
// Lección de familia con el mismo formato que hiragana-01 / katakana.
// Opciones vacías con el hueco de la respuesta en una posición variada; las
// rellena repairKanaUnit con las pistas de sonido.
const blank=n=>placed('',['·','··'],n);
function familyLesson({script,number,title,items,audio={},prior=[]}){
  const tag=script==='hira'?'hira':'kata',prefix=`jp-${script}-family-${number}`;
  const hear=index=>items[index%2===0?index:index-1];
  const activities=[{id:`${prefix}-intro`,type:'lesson_intro',prompt:`Aprenderás ${title} paso a paso`,target:'',options:[],answer:'',explanation:'Verás un carácter, lo escucharás y lo practicarás antes de conocer el siguiente. Después reaparecerán algunos de los anteriores para fortalecer la memoria.',audio:'',slow_audio:'',image:null,writing_asset:null,tags:[],xp:2,gradable:false}];
  items.forEach((kana,index)=>{
    const n=index+1,sound=audio[kana]||kana;
    activities.push({id:`${prefix}-teach-${n}`,type:'teach_kana',prompt:`Conoce ${kana}`,target:kana,options:[],answer:'',explanation:`Mira la forma y escucha ${kana} antes de intentar reconocerlo.`,audio:sound,slow_audio:sound,image:null,writing_asset:null,tags:['kana',kana],xp:2,gradable:false,sound_hint:'',memory_hint:'',stroke_hint:'Sigue la forma completa con la mirada y escúchalo varias veces antes de continuar.'});
    activities.push({id:`${prefix}-sound-${n}`,type:'kana_to_audio',prompt:'¿Cómo suena este kana?',target:kana,options:blank(index),answer:'',explanation:'',audio:sound,slow_audio:sound,image:null,writing_asset:null,tags:[tag,kana,'immediate_recall'],xp:10});
    // Distractores: solo kana ya vistos (en esta lección o en la anterior).
    const heard=hear(index),others=[...items.slice(0,index+1).reverse(),...prior].filter(other=>other!==heard).slice(0,2);
    activities.push({id:`${prefix}-hear-${n}`,type:'audio_to_kana',prompt:'Escucha y elige el kana aprendido',target:heard,options:placed(heard,others,index+1),answer:heard,explanation:`El audio completo corresponde a ${heard}.`,audio:audio[heard]||heard,slow_audio:audio[heard]||heard,image:null,writing_asset:null,tags:[tag,heard,'cumulative_recall'],xp:10});
    if(index>=2){const back=items[index-2];activities.push({id:`${prefix}-spiral-${n}`,type:'kana_to_audio',prompt:'Recuerda un kana anterior',target:back,options:blank(index+1),answer:'',explanation:'',audio:audio[back]||back,slow_audio:audio[back]||back,image:null,writing_asset:null,tags:[tag,back,'spiral_review'],xp:10});}
  });
  return {id:`jp-${script}-${number}-family-${number}`,title,description:`Aprende y practica ${items.join('・')}.`,activities};
}
function kanaReview({script,number,title,items,audio={}}){
  const tag=script==='hira'?'hira':'kata',id=`jp-${script}-review-${number}`;
  const activities=[{id:`${id}-intro`,type:'lesson_intro',prompt:`Repaso breve · después de ${title}`,target:'',options:[],answer:'',explanation:'No hay caracteres nuevos. Recupera una selección de lo estudiado en esta y en lecciones anteriores.',audio:'',slow_audio:'',image:null,writing_asset:null,tags:[],xp:2,gradable:false}];
  items.forEach((kana,index)=>{
    const n=index+1,sound=audio[kana]||kana;
    if(index%2===0){const others=items.filter(other=>other!==kana).slice(index%2,index%2+2);activities.push({id:`${id}-hear-${n}`,type:'audio_to_kana',prompt:'Escucha y recupera el kana',target:kana,options:placed(kana,others,index),answer:kana,explanation:`El sonido corresponde a ${kana}.`,audio:sound,slow_audio:sound,image:null,writing_asset:null,tags:[tag,kana,'interleaved_review'],xp:12});}
    else activities.push({id:`${id}-see-${n}`,type:'kana_to_audio',prompt:'¿Cómo suena este kana?',target:kana,options:blank(index),answer:'',explanation:'',audio:sound,slow_audio:sound,image:null,writing_asset:null,tags:[tag,kana,'interleaved_review'],xp:12});
  });
  return {id,title:`Repaso breve ${number}`,description:'Práctica acumulativa con una selección de kana anteriores.',isReview:true,activities};
}
const hiragana=unit('hiragana-01');
const yoonA=familyLesson({script:'hira',number:16,title:'Más combinaciones: ñ, h, m y r',items:['にゃ','にゅ','にょ','ひゃ','ひょ','みゃ','りゃ','りゅ','りょ'],prior:['きゃ','しゃ','ちゃ']});
const yoonB=familyLesson({script:'hira',number:17,title:'Combinaciones con dakuten: ぎゃ・じゃ・びょ・ぴょ',items:['ぎゃ','ぎゅ','ぎょ','じゃ','じゅ','じょ','びょ','ぴょ'],prior:['きゃ','ちゃ','りょ']});
const longSpelling=familyLesson({script:'hira',number:18,title:'Vocal larga escrita con う o い',items:['こう','せい'],prior:['こ','せ']});
// Palabras reales para fijar la regla おう/えい (audio ya existente).
longSpelling.activities.push(
  ...[['がっこう','escuela','[gakkoo]: こう se lee «koo»; っ hace la pausa.'],['せんせい','maestro, maestra','[senseeː]: せい se lee «see».'],['とけい','reloj','[tokee]: けい se lee «kee».'],['きのう','ayer','[kinoo]: のう se lee «noo».']].flatMap(([word,meaning,note],index)=>[
    {id:`jp-hira-family-18-word-${index+1}`,type:'teach_kana',prompt:`Lee ${word}`,target:word,options:[],answer:'',explanation:`${word} = ${meaning}. ${note}`,audio:word,slow_audio:word,image:null,writing_asset:null,tags:['kana',word],xp:2,gradable:false,sound_hint:note,memory_hint:'おう y えい casi siempre se leen como o y e largas.',stroke_hint:''},
    {id:`jp-hira-family-18-word-${index+1}-hear`,type:'audio_to_kana',prompt:'Escucha y elige lo que oyes',target:word,options:placed(word,{がっこう:['がっこ','がこう'],せんせい:['せんせ','せんえい'],とけい:['とけ','とうけい'],きのう:['きの','きんのう']}[word],index+1),answer:word,explanation:`Escuchaste ${word}: ${meaning}. La vocal larga dura dos pulsos.`,audio:word,slow_audio:word,image:null,writing_asset:null,tags:['hira',word,'cumulative_recall'],xp:10},
  ]),
);
const hiraReview=kanaReview({script:'hira',number:18,title:'las últimas combinaciones',items:['じゃ','りょ','にゃ','ひゃ','じゅ','こう','ぎゅ','せい']});
upsertLessons(hiragana,[yoonA,yoonB,longSpelling,hiraReview],'jp-hira-15-checkpoint');
// La prueba completa de hiragana también comprueba lo nuevo.
const hiraTest=hiragana.lessons.find(lesson=>lesson.id==='jp-hira-15-checkpoint');
hiraTest.activities=hiraTest.activities.filter(activity=>!activity.id.startsWith('jp-hira-test-new-'));
[['じゃ','audio_to_kana',['じゅ','ちゃ']],['りょ','kana_to_audio'],['にゃ','audio_to_kana',['みゃ','ひゃ']],['こう','kana_to_audio']].forEach(([kana,type,others],index)=>hiraTest.activities.push(type==='audio_to_kana'
  ?{id:`jp-hira-test-new-${index+1}`,type,prompt:'Escucha y elige el kana',target:kana,options:placed(kana,others,index),answer:kana,explanation:`La respuesta es ${kana}.`,audio:kana,slow_audio:kana,image:null,writing_asset:null,tags:['hira','checkpoint'],xp:20}
  :{id:`jp-hira-test-new-${index+1}`,type,prompt:'¿Cómo suena este kana?',target:kana,options:blank(index+2),answer:'',explanation:'',audio:kana,slow_audio:kana,image:null,writing_asset:null,tags:['hira','checkpoint'],xp:20}));

const katakana=unit('katakana');
const kataD=familyLesson({script:'kata',number:15,title:'Fila D, ッ pequeña y ジャ・ジュ・ジョ',items:['ダ','ヂ','ヅ','デ','ド','ッ','ジャ','ジュ','ジョ'],audio:{ッ:'メッセージ'},prior:['タ','テ','ト']});
const kataReview=kanaReview({script:'kata',number:15,title:'Fila D, ッ y ジャ',items:['ド','デ','ジュ','ダ','ッ','ジャ'],audio:{ッ:'メッセージ'}});
upsertLessons(katakana,[kataD,kataReview],'jp-kata-14-checkpoint');
const kataTest=katakana.lessons.find(lesson=>lesson.id==='jp-kata-14-checkpoint');
kataTest.activities=kataTest.activities.filter(activity=>!activity.id.startsWith('jp-kata-test-new-'));
[['ド','audio_to_kana',['ト','デ']],['ッ','kana_to_audio'],['ジュ','audio_to_kana',['シュ','ジョ']]].forEach(([kana,type,others],index)=>{const sound=kana==='ッ'?'メッセージ':kana;kataTest.activities.push(type==='audio_to_kana'
  ?{id:`jp-kata-test-new-${index+1}`,type,prompt:'Escucha y elige el kana',target:kana,options:placed(kana,others,index),answer:kana,explanation:`La respuesta es ${kana}.`,audio:sound,slow_audio:sound,image:null,writing_asset:null,tags:['kata','checkpoint'],xp:20}
  :{id:`jp-kata-test-new-${index+1}`,type,prompt:'¿Cómo suena este kana?',target:kana,options:blank(index+2),answer:'',explanation:'',audio:sound,slow_audio:sound,image:null,writing_asset:null,tags:['kata','checkpoint'],xp:20});});
repairKanaUnit(hiragana);
repairKanaUnit(katakana);

// ── C3. Repasos con respuestas que no son traducciones ───────────────────
// Los «Recuerda: ¿qué expresa X?» de first-words, basic-verbs, adjectives y
// functional-a1 tenían como respuesta o distractor frases de explicación
// («La palabra completa es おきます. Escúchala seguida.», «Escuchaste…»).
const EXPLANATION=/significa «|^Escuchaste |La palabra completa|Escúchala seguida|^No corresponde/;
function repairRecall(data){
  const meanings=new Map();
  for(const activity of allActivities(data))if(['teach_word','dialogue_model','teach_kanji','teach_pattern','teach_concept'].includes(activity.type)&&activity.target&&!meanings.has(activity.target))meanings.set(activity.target,activity.explanation);
  const list=[...meanings.entries()];
  const isSentence=text=>/[。？]$/.test(text);
  for(const activity of allActivities(data)){
    if(!['word_to_translation','select_translation'].includes(activity.type))continue;
    const meaning=meanings.get(activity.target);
    const broken=activity.options.some(option=>EXPLANATION.test(option))||(meaning&&activity.answer!==meaning&&activity.prompt.startsWith('Recuerda'));
    if(!meaning||!broken)continue;
    const index=Math.max(0,activity.options.indexOf(activity.answer));
    const start=list.findIndex(([target])=>target===activity.target);
    const near=[...list.slice(start+1),...list.slice(0,start).reverse()].filter(([target,text])=>text!==meaning&&isSentence(target)===isSentence(activity.target)&&!EXPLANATION.test(text));
    const keep=activity.options.filter(option=>option!==activity.answer&&option!==meaning&&!EXPLANATION.test(option)&&option!==meaning);
    const others=[...new Set([...keep,...near.map(([,text])=>text)])].slice(0,2);
    activity.options=placed(meaning,others,index);
    activity.answer=meaning;activity.explanation=meaning;
  }
}

// ── C4. Gramática esencial: tarjetas de patrón con explicación real ──────
const sentences=unit('first-sentences');
replaceText(sentences,'上・中・近く・前','うえ・なか・ちかく・まえ');
replaceText(sentences,'何・誰・どこ・どうして','なに・だれ・どこ・どうして');
const patternNotes={
  'A は B です':{memory:'は presenta el tema; です cierra con cortesía.',points:['は marca el tema («en cuanto a A…»). Como partícula se escribe は y se lee «wa».','です equivale a «es / soy / son» y hace la frase cortés.','わたしはミナです。 → Soy Mina.']},
  'A は B ではありません':{memory:'ではありません = no es (cortés).',points:['ではありません niega です: ひとではありません = no es una persona.','En conversación se oye mucho じゃありません o じゃないです (mismo sentido).']},
  'A は B ですか':{memory:'か al final = pregunta.',points:['Añade か al final: これはほんですか。 = ¿Esto es un libro?','No cambia el orden de las palabras ni hace falta «¿?».','Respuestas: はい、そうです (sí) / いいえ、ちがいます (no).']},
  'これ・それ・あれ':{memory:'こ (cerca de mí) · そ (cerca de ti) · あ (lejos de los dos).',points:['これ: esto, cerca de quien habla.','それ: eso, cerca de quien escucha.','あれ: aquello, lejos de los dos.','Delante de un sustantivo cambian a この・その・あの: このほん = este libro.']},
  'ここ・そこ・あそこ':{memory:'Mismo sistema こ・そ・あ para lugares; どこ pregunta.',points:['ここ: aquí · そこ: ahí · あそこ: allá.','どこ: ¿dónde? → ねこはどこですか。']},
  'あります・います':{memory:'あります: cosas · います: personas y animales.',points:['あります para cosas y plantas: ほんがあります。','います para seres que se mueven solos: ねこがいます。','Lo que existe va marcado con が; el negativo es ありません / いません.']},
  'うえ・なか・ちかく・まえ':{memory:'A の うえ = encima de A.',points:['Lugar = cosa + の + posición: つくえのうえ (encima del escritorio).','なか: dentro · ちかく: cerca · まえ: delante.','Con あります/います el lugar lleva に: まどのちかくにいます。']},
  'の・も':{memory:'の une sustantivos; も = también.',points:['の une dos sustantivos: わたしのほん = mi libro (el libro de mí).','も = también, y reemplaza a は, が o を: カードもあります。']},
  'が・を':{memory:'が: quién/qué hace o pasa · を: qué recibe la acción.',points:['が marca el sujeto: ドアがあきます。 = La puerta se abre.','を marca el objeto directo: ほんをよみます。 = Leo un libro. Se escribe を y se lee «o».','は presenta un tema ya conocido; が señala algo nuevo o importante.']},
  'に・で・へ・と':{memory:'に destino/hora · へ dirección · で lugar de la acción · と con alguien.',points:['に: destino o momento: みせにいきます。 / しちじに.','へ: dirección; se escribe へ y se lee «e»: がっこうへいきます。','で: lugar donde ocurre la acción: ここでまちます。','と: compañía: ともだちといきます。 Ojo: いっしょに es una sola palabra (juntos).']},
  'なに・だれ・どこ・どうして':{memory:'Las preguntas usan el mismo orden que la respuesta y terminan en か.',points:['なに / なん: qué (なん delante de です: なんですか).','だれ: quién · どこ: dónde · どうして: por qué.']},
};
for(const activity of allActivities(sentences).filter(activity=>activity.type==='teach_pattern'&&patternNotes[activity.target])){
  activity.memory_hint=patternNotes[activity.target].memory;activity.teaching_points=patternNotes[activity.target].points;
}
const verbs=unit('basic-verbs');
const verbNotes={
  'Presente y negativo':['ます: afirmativo cortés, presente o futuro: よみます = leo / leeré.','ません: negativo cortés: よみません = no leo.'],
  'Pasado y pasado negativo':['ました: pasado: かえりました = volví.','ませんでした: pasado negativo: ありませんでした = no había.'],
  '～ています':['Forma て + います.','Acción en curso: うごいています = se está moviendo.','Estado que resulta de un cambio: あいています = está abierta.'],
  '～てください':['Forma て + ください = haga…, por favor (petición cortés).','まちます → まって → まってください.'],
  '～ないでください':['Forma ない + でください = no haga…, por favor.','あけます → あけない; まちます → またない; いきます → いかない; します → しない; きます → こない.'],
  '～ましょう':['Quita ます y añade ましょう: いきます → いきましょう = vamos / vayamos.'],
  '～たいです':['Quita ます y añade たいです: かいます → かいたいです = quiero comprar.','Solo para lo que quieres hacer tú.'],
  '～てあります':['Forma て + あります: alguien lo dejó hecho a propósito: なまえがかいてあります = el nombre está escrito.'],
};
for(const activity of allActivities(verbs).filter(activity=>activity.type==='teach_pattern'&&verbNotes[activity.target]))activity.teaching_points=verbNotes[activity.target];
const adjectives=unit('adjectives');
const adjectiveNotes={
  'Adjetivo い + sustantivo':['El adjetivo va delante, sin partícula: あかいほん = libro rojo.'],
  'Negativo de adjetivos い':['Cambia la い final por くありません: おおきい → おおきくありません.','También se dice おおきくないです.','Excepción: いい → よくありません.'],
  '～ですね':['ね al final busca acuerdo: «¿verdad?», «¿no?».'],
  '～ですから':['から después de la razón = porque: あぶないですから。 = Porque es peligroso.'],
};
for(const activity of allActivities(adjectives).filter(activity=>activity.type==='teach_pattern'&&adjectiveNotes[activity.target]))activity.teaching_points=adjectiveNotes[activity.target];

// Lección de patrón con el mismo formato que basic-verbs.
function patternLesson({id,title,description,pattern,points,memory,models}){
  const activities=[
    {id:`${id}-intro`,type:'lesson_intro',prompt:title,target:'',options:[],answer:'',explanation:description,audio:'',slow_audio:'',image:null,writing_asset:null,tags:[],xp:2,gradable:false},
    {id:`${id}-pattern`,type:'teach_pattern',prompt:pattern,target:pattern,options:[],answer:'',explanation:description,audio:'',slow_audio:'',image:null,writing_asset:null,tags:[],xp:3,gradable:false,memory_hint:memory,teaching_points:points},
  ];
  models.forEach(([target,meaning],index)=>{
    const n=index+1,others=models.filter(([other])=>other!==target).map(([,text])=>text).slice(index%2,index%2+2);
    activities.push({id:`${id}-model-${n}`,type:'dialogue_model',prompt:meaning,target,options:[],answer:'',explanation:meaning,audio:target,slow_audio:target,image:null,writing_asset:null,tags:[],xp:3,gradable:false});
    activities.push({id:`${id}-meaning-${n}`,type:'select_translation',prompt:`¿Qué significa ${target}?`,target,options:placed(meaning,others,index),answer:meaning,explanation:meaning,audio:target,slow_audio:target,image:null,writing_asset:null,tags:[id,'meaning_recall'],xp:15});
  });
  return {id,title,description,activities};
}
const dictionaryForm=patternLesson({id:'jp-book1-verb-form-00',title:'Forma de diccionario y forma ます',description:'La forma que verás en diccionarios y la forma cortés que usas al hablar.',pattern:'いく → いきます',memory:'Diccionario = forma simple; ます = la misma acción dicha con cortesía.',points:['Los diccionarios dan la forma simple: いく (ir), みる (ver), かう (comprar).','Con desconocidos se usa la forma ます: いきます, みます, かいます.','Verbos en -る como みる o たべる: quita る y añade ます (みます, たべます).','Otros verbos: la última u pasa a i + ます: いく → いきます, かう → かいます, のむ → のみます.','Irregulares: する → します, くる → きます.'],models:[['いく','ir (forma de diccionario de いきます)'],['みる','ver (forma de diccionario de みます)'],['かう','comprar (forma de diccionario de かいます)'],['する','hacer (forma de diccionario de します)'],['くる','venir (forma de diccionario de きます)']]});
const teForm=patternLesson({id:'jp-book1-verb-form-te',title:'Cómo se forma la forma て',description:'La forma て une acciones y sirve para pedir (てください) y para describir (ています).',pattern:'まちます → まって',memory:'Parte de la forma ます o de la de diccionario y mira la última sílaba.',points:['Verbos en -る de tipo みる/たべる: quita ます y añade て: みます → みて.','う・つ・る → って: かいます → かって, まちます → まって, かえります → かえって.','む・ぶ・ぬ → んで: よみます → よんで.','く → いて: かきます → かいて (excepción: いきます → いって).','ぐ → いで: いそぎます → いそいで.','す → して: さがします → さがして.','Irregulares: します → して, きます → きて.'],models:[['まって','espera (forma て de まちます)'],['よんで','lee (forma て de よみます)'],['かいて','escribe (forma て de かきます)'],['いそいで','apúrate (forma て de いそぎます)'],['いって','ve (forma て de いきます)'],['みて','mira (forma て de みます)']]});
upsertLessons(verbs,[dictionaryForm],'jp-book1-verb-form-01');
upsertLessons(verbs,[teForm],'jp-book1-verb-form-03');

// Repasos rotos y distractores de relleno («No corresponde a esta oración.»)
for(const id of ['first-words','first-sentences','basic-verbs','adjectives','functional-a1','story-bridge'])repairRecall(unit(id));

// ── C5. Kanji: glosas erróneas y lecturas visibles en A1 ─────────────────
const kanji=unit('starter-kanji');
const kanjiGloss={
  'biblioteca en 図書館 · としょかん':['dibujo, plano · en 図書館 (としょかん, biblioteca)','dibujo, plano'],
  'libro/escribir en 図書館 · としょかん':['escribir, documento · en 図書館 (としょかん)','escribir, documento'],
  'edificio en 図書館 · としょかん':['edificio público · en 図書館 (としょかん)','edificio público'],
  'reloj en 時計 · とけい':['hora, tiempo · en 時計 (とけい, reloj)','hora, tiempo'],
  'medir en 時計 · とけい':['medir, calcular · en 時計 (とけい)','medir, calcular'],
  'nombre/delante · まえ':['delante · まえ (también en 名前, なまえ)','delante'],
  'ser/cosa en 生き物 · いきもの':['cosa · en 生き物 (いきもの, ser vivo)','cosa'],
  'ayer en 昨日 · きのう':['anterior · en 昨日 (きのう, ayer)','anterior'],
  'mañana en 明日 · あした':['claro; siguiente · en 明日 (あした, mañana)','claro; siguiente'],
  'futuro en 未来 · みらい':['todavía no · en 未来 (みらい, futuro)','todavía no'],
  'gratis en 無料 · むりょう':['sin, nada · en 無料 (むりょう, gratis)','sin, nada'],
  'juntos en 一緒に · いっしょに':['lazo, unión · en 一緒に (いっしょに, juntos)','lazo, unión'],
  'venir/futuro · くる / みらい':['venir · くる (en 未来 se lee らい)','venir'],
};
for(const activity of allActivities(kanji)){
  for(const [old,[gloss,short]] of Object.entries(kanjiGloss)){
    const oldShort=old.split(' · ')[0];
    if(activity.type==='kana_choice'&&activity.prompt===`Elige el kanji de «${oldShort}»`)activity.prompt=`Elige el kanji de «${short}»`;
  }
}
for(const [old,[gloss]] of Object.entries(kanjiGloss))replaceText(kanji,old,gloss,{whole:true});

// Lecturas en kana para las tarjetas de A1 con kanji (antes no había
// ninguna ayuda de lectura: la app solo muestra pinyin en chino).
const READINGS={
  '私の名前はアナです。':'わたしのなまえはアナです。','お願いします。':'おねがいします。','名前':'なまえ','国':'くに','お名前は何ですか。':'おなまえはなんですか。','メキシコから来ました。':'メキシコからきました。','言葉':'ことば','人':'ひと','日本語を少し話します。':'にほんごをすこしはなします。','分かりません。':'わかりません。',
  '母':'はは','父':'ちち','これは私の家族です。':'これはわたしのかぞくです。','彼は私の友達です。':'かれはわたしのともだちです。','妹':'いもうと','弟':'おとうと','彼女は私の妹です。':'かのじょはわたしのいもうとです。','弟が二人います。':'おとうとがふたりいます。','友達':'ともだち','子ども':'こども','何歳ですか。':'なんさいですか。','女の人':'おんなのひと','男の人':'おとこのひと','母はここで働いています。':'はははここではたらいています。','私たちは一緒に住んでいます。':'わたしたちはいっしょにすんでいます。',
  '家':'いえ','部屋':'へや','台所':'だいどころ','お手洗い':'おてあらい','私のです。':'わたしのです。','鍵はテーブルの上にあります。':'かぎはテーブルのうえにあります。','私の部屋は小さいです。':'わたしのへやはちいさいです。','鍵':'かぎ','いすが二つあります。':'いすがふたつあります。','ドアが開いています。':'ドアがあいています。',
  '起きる':'おきる','働く':'はたらく','毎日':'まいにち','七時に':'しちじに','勉強する':'べんきょうする','食べる':'たべる','仕事のあとで':'しごとのあとで','寝る前に':'ねるまえに','飲む':'のむ','寝る':'ねる','七時に起きます。':'しちじにおきます。','午後に勉強します。':'ごごにべんきょうします。','朝':'あさ','夜':'よる','一緒に食べます。':'いっしょにたべます。','日曜日は働きません。':'にちようびははたらきません。',
  '水':'みず','ご飯':'ごはん','これが欲しいです。':'これがほしいです。','お会計をお願いします。':'おかいけいをおねがいします。','お茶':'おちゃ','朝、お茶を飲みます。':'あさ、おちゃをのみます。','ご飯を少しください。':'ごはんをすこしください。','肉':'にく','野菜':'やさい','肉を食べません。':'にくをたべません。',
  '駅':'えき','銀行':'ぎんこう','駅はどこですか。':'えきはどこですか。','近くにあります。':'ちかくにあります。','店':'みせ','病院':'びょういん','まっすぐ行ってください。':'まっすぐいってください。','学校':'がっこう','公園':'こうえん','駅は左にあります。':'えきはひだりにあります。','学校へ行きます。':'がっこうへいきます。','左':'ひだり','右':'みぎ','銀行は近くにあります。':'ぎんこうはちかくにあります。','公園へはどう行きますか。':'こうえんへはどういきますか。',
  '値段':'ねだん','お金':'おかね','もっと大きいサイズが必要です。':'もっとおおきいサイズがひつようです。','安い':'やすい','青色はありますか。':'あおいろはありますか。','高い':'たかい','現金':'げんきん','カードで払えますか。':'カードではらえますか。','現金しかありません。':'げんきんしかありません。','試着室':'しちゃくしつ','試着室はどこですか。':'しちゃくしつはどこですか。','高すぎます。':'たかすぎます。',
  '今日':'きょう','明日':'あした','今何時ですか。':'いまなんじですか。','三時半です。':'さんじはんです。','昨日':'きのう','月曜日':'げつようび','明日会いましょう。':'あしたあいましょう。','月曜日は時間があります。':'げつようびはじかんがあります。','週':'しゅう','月':'つき','八時に着きます。':'はちじにつきます。','約束は来週です。':'やくそくはらいしゅうです。','早く':'はやく','遅く':'おそく','遅れます。':'おくれます。','金曜日に会いましょう。':'きんようびにあいましょう。',
  '切符':'きっぷ','電車':'でんしゃ','切符を一枚ください。':'きっぷをいちまいください。','電車はいつ出ますか。':'でんしゃはいつでますか。','地下鉄':'ちかてつ','このバスは市内へ行きますか。':'このバスはしないへいきますか。','次の停留所はどこですか。':'つぎのていりゅうじょはどこですか。','停留所':'ていりゅうじょ','乗り換えが必要ですか。':'のりかえがひつようですか。','電車が遅れています。':'でんしゃがおくれています。','空港':'くうこう','目的地':'もくてきち','ここで降ります。':'ここでおります。',
  '頭':'あたま','お腹':'おなか','頭が痛いです。':'あたまがいたいです。','昨日から熱があります。':'きのうからねつがあります。','喉':'のど','熱':'ねつ','医者が必要です。':'いしゃがひつようです。','薬局はどこですか。':'やっきょくはどこですか。','薬':'くすり','薬局':'やっきょく','この薬を一日二回飲んでください。':'このくすりをいちにちにかいのんでください。','医者':'いしゃ','助け':'たすけ','救急車を呼んでください。':'きゅうきゅうしゃをよんでください。',
  '太陽':'たいよう','雨':'あめ','今日は晴れです。':'きょうははれです。','明日は雨が降ります。':'あしたはあめがふります。','雪':'ゆき','風':'かぜ','とても寒いです。':'とてもさむいです。','傘を持っていってください。':'かさをもっていってください。','暑さ':'あつさ','寒さ':'さむさ','コートが必要です。':'コートがひつようです。','天気はすぐ変わります。':'てんきはすぐかわります。','傘':'かさ','十度です。':'じゅうどです。','週末の天気はどうですか。':'しゅうまつのてんきはどうですか。',
  '招待':'しょうたい','来ませんか。':'きませんか。','はい、喜んで。':'はい、よろこんで。','予定':'よてい','時間':'じかん','すみません、行けません。':'すみません、いけません。','いつ会いますか。':'いつあいますか。','場所':'ばしょ','どこで会いますか。':'どこであいますか。','六時以降は時間があります。':'ろくじいこうはじかんがあります。','週末':'しゅうまつ','友達を連れてきてもいいですか。':'ともだちをつれてきてもいいですか。','住所を送ってください。':'じゅうしょをおくってください。',
};
const DICTIONARY_FORMS={'起きる':'起きます','働く':'働きます','勉強する':'勉強します','食べる':'食べます','飲む':'飲みます','寝る':'寝ます'};
const a1=order.filter(id=>/^a1-[12]-/.test(id));
for(const id of a1){
  const data=unit(id);
  for(const activity of allActivities(data).filter(activity=>activity.type==='teach_concept'&&READINGS[activity.target])){
    const reading=`Lectura: ${READINGS[activity.target]}`;
    if(!activity.sound_hint||activity.sound_hint.startsWith('Lectura: '))activity.sound_hint=reading;
    if(DICTIONARY_FORMS[activity.target]&&!activity.usage_note)activity.usage_note=`Forma de diccionario. Al hablar con cortesía se usa la forma ます: ${DICTIONARY_FORMS[activity.target]}.`;
  }
}

// ── C6. Traducciones erróneas o engañosas ────────────────────────────────
const fixes={
  'a1-1-identity':[['idioma','palabra; lenguaje',true],['«idioma»','«palabra; lenguaje»'],['Hablo un poco de este idioma.','Hablo un poco de japonés.',true],['«Hablo un poco de este idioma.»','«Hablo un poco de japonés.»'],[': Hablo un poco de este idioma.',': Hablo un poco de japonés.']],
  'a1-1-routine':[['despertarse','levantarse; despertarse',true],['«despertarse»','«levantarse; despertarse»'],[': despertarse',': levantarse; despertarse']],
  'a1-1-food':[['Quiero un poco de arroz.','Deme un poco de arroz, por favor.',true],['«Quiero un poco de arroz.»','«Deme un poco de arroz, por favor.»'],[': Quiero un poco de arroz.',': Deme un poco de arroz, por favor.']],
  'a1-2-time':[['Llego tarde.','Voy a llegar tarde.',true],['«Llego tarde.»','«Voy a llegar tarde.»'],[': Llego tarde.',': Voy a llegar tarde.']],
  'a1-2-social':[['hora','tiempo (libre); horas',true],['«hora»','«tiempo (libre); horas»'],[': hora',': tiempo (libre); horas'],['Envíame la dirección.','Envíeme la dirección, por favor.',true],['«Envíame la dirección.»','«Envíeme la dirección, por favor.»'],[': Envíame la dirección.',': Envíeme la dirección, por favor.']],
  'a1-2-weather':[['Lleva un paraguas.','Lleve un paraguas, por favor.',true],['«Lleva un paraguas.»','«Lleve un paraguas, por favor.»'],[': Lleva un paraguas.',': Lleve un paraguas, por favor.'],['Hay diez grados.','Hace diez grados.',true],['«Hay diez grados.»','«Hace diez grados.»'],[': Hay diez grados.',': Hace diez grados.']],
  'a1-2-health':[['Tome esto dos veces al día.','Tome esta medicina dos veces al día.',true],['«Tome esto dos veces al día.»','«Tome esta medicina dos veces al día.»'],[': Tome esto dos veces al día.',': Tome esta medicina dos veces al día.']],
};
const laterFixes=[['permitido','permiso',true],['«permitido»','«permiso»'],['necesitar','necesidad',true],['«necesitar»','«necesidad»'],['saber','saber hacerlo',true],['«saber»','«saber hacerlo»'],['Aquí se puede tomar fotos.','Aquí se pueden tomar fotos.'],['entiendo','entendido; de acuerdo',true],['«entiendo»','«entendido; de acuerdo»'],['promesa','promesa; cita',true],['«promesa»','«promesa; cita»'],['Aunque estaba cansada, terminó el trabajo.','Aunque estaba cansado, terminé el trabajo.'],['¿Puedes explicarlo con un ejemplo?','¿Podría explicar la conclusión con un ejemplo?']];
for(const id of order.filter(id=>/^(a2|b1)-/.test(id)))fixes[id]=laterFixes;
for(const [id,list] of Object.entries(fixes)){const data=unit(id);for(const [from,to,whole] of list)replaceText(data,from,to,{whole:Boolean(whole)});}
// Puente de historias: las «traducciones» eran descripciones.
const bridge=unit('story-bridge');
for(const [from,to] of [
  ['Aquí hay una biblioteca y el libro está sobre el escritorio.','Aquí es una biblioteca. El libro está sobre el escritorio.'],
  ['Pregunta por una llave y recibe una indicación.','¿Dónde está la llave? Mire dentro de la caja, por favor.'],
  ['Se prohíbe abrir una puerta y se explica el motivo.','No abra esa puerta, por favor. Porque es peligroso.'],
  ['Pregunta el precio y compra agua.','¿Cuánto cuesta el agua? Son cien yenes. Agua, por favor.'],
  ['No conoce el camino y propone esperar frente a una torre.','No conozco el camino. Esperemos delante de la torre.'],
  ['Hay un nombre escrito y se pide leer la página siguiente.','Hay un nombre escrito. Lea la página siguiente, por favor.'],
])replaceText(bridge,from,to);
replaceText(bridge,'Escucha la diferencia: ','Escucha y comprende: ');
// «Escucha y elige la forma completa» ofrecía una frase en español como distractor.
const bridgeTargets=[...new Set(allActivities(bridge).filter(activity=>activity.type==='teach_concept').map(activity=>activity.target))];
for(const activity of allActivities(bridge).filter(activity=>activity.type==='listening_choice')){
  const spare=bridgeTargets.filter(target=>!activity.options.includes(target));
  activity.options=activity.options.map(option=>/[A-Za-zÁÉÍÓÚáéíóúñ]/.test(option)&&option!==activity.answer?spare.shift()||option:option);
}

// ── C7. Producción: variantes en kana, cifras y margen en los diálogos ────
const digits={'七時に起きます。':['7時に起きます。'],'八時に着きます。':['8時に着きます。'],'六時以降は時間があります。':['6時以降は時間があります。','六時からは時間があります。'],'何歳ですか。':['おいくつですか。'],'だれですか。':['誰ですか。','どなたですか。'],'鍵はテーブルの上にあります。':['鍵がテーブルの上にあります。'],'ご飯を少しください。':['ご飯を少しお願いします。'],'どこで会いますか。':['どこで会いましょうか。'],'メキシコから来ました。':['メキシコ人です。'],'お名前は何ですか。':['名前は何ですか。'],
  'いち':['一','1'],'に':['二','2'],'さん':['三','3'],'いそぎます':['急ぎます'],'さがします':['探します'],'かいます':['買います'],'あぶない':['危ない'],'あたらしい':['新しい'],'あかい':['赤い']};
const FREE=new Set(['typed_translation','open_question','speak_and_transcribe','dictation']);
const widen=target=>{
  if(!target.answer)return;
  const extra=[...(READINGS[target.answer]?[READINGS[target.answer]]:[]),...(digits[target.answer]||[])];
  if(!extra.length)return;
  target.accepted_answers=[...new Set([...(target.accepted_answers||[target.answer]),...extra])];
};
const productionUnits=order.filter(id=>/^a1-[12]-/.test(id)||['first-words','basic-verbs','adjectives'].includes(id));
for(const id of productionUnits){
  for(const activity of allActivities(unit(id))){
    if(FREE.has(activity.type))widen(activity);
    if(activity.turns)activity.turns.filter(turn=>turn.role==='learner').forEach(widen);
  }
}
for(const id of order)for(const activity of allActivities(unit(id)).filter(activity=>activity.turns)){
  const learners=activity.turns.filter(turn=>turn.role==='learner').length;
  if(learners>=3)activity.minimum_correct=learners-1;
}
// first-words: «Completa el elemento que falta» mostraba solo «＿».
const firstWords=unit('first-words');
for(const activity of allActivities(firstWords).filter(activity=>activity.id==='japanese-first-words-production-complete')){
  Object.assign(activity,{prompt:'Completa la serie: uno, dos, tres',target:'いち、＿、さん',answer:'に',accepted_answers:['に','二','2'],explanation:'いち (1), に (2), さん (3).'});
}
// a1-2-health: el alumno no debe decir la frase del médico.
const health=unit('a1-2-health');
for(const lesson of health.lessons.filter(lesson=>lesson.id==='japanese-a1-2-health-production-checkpoint'))for(const activity of lesson.activities){
  if(activity.type==='speak_and_transcribe')Object.assign(activity,{prompt:'Di en voz alta: «頭が痛いです。»',target:'Me duele la cabeza.',answer:'頭が痛いです。',accepted_answers:['頭が痛いです。','あたまがいたいです。','頭が痛い。'],audio:'頭が痛いです。',slow_audio:'頭が痛いです。'});
  for(const turn of (activity.turns||[]).filter(turn=>turn.role==='learner'&&/この薬を一日二回/.test(turn.answer||''))){
    Object.assign(turn,{prompt:'Di o escribe en japonés: «Me duele la cabeza.»',answer:'頭が痛いです。',accepted_answers:['頭が痛いです。','あたまがいたいです。','頭が痛い。'],audio:'頭が痛いです。'});
  }
  for(const turn of (activity.turns||[]).filter(turn=>turn.role==='model'&&/Tome esta medicina dos veces al día|この薬を一日二回/.test(turn.translation||'')))turn.translation='Quieres expresar: «Me duele la cabeza.».';
}

// ── Guardar ────────────────────────────────────────────────────────────
const changed=[];
for(const [name,file] of files){
  const after=JSON.stringify(file.data,null,2)+'\n';
  if(after!==file.before){fs.writeFileSync(file.url,after);changed.push(name);}
}
console.log(JSON.stringify({changed},null,1));
