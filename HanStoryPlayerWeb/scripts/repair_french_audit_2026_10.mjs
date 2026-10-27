// Correcciones críticas de la auditoría del curso de francés
// (docs/AUDITORIA_FRANCES_2026-10-27.md). Idempotente: se puede volver a
// ejecutar sin duplicar lecciones ni respuestas.
import fs from 'node:fs';

const dir=new URL('../library/courses/French/',import.meta.url);
const files=new Map();
const load=name=>{
  if(!files.has(name)){const url=new URL(name,dir),before=fs.readFileSync(url,'utf8');files.set(name,{url,before,data:JSON.parse(before)});}
  return files.get(name).data;
};
const unit=id=>load(`units/${id}.json`);
const allActivities=data=>data.lessons.flatMap(lesson=>lesson.activities);
const course=load('course.json');
const order=course.levels.flatMap(level=>level.unitIds);

// Reemplaza un texto en todos los campos de todas las actividades de una unidad.
function replaceText(data,from,to,{whole=false}={}){
  const walk=value=>{
    if(typeof value==='string')return whole?(value===from?to:value):value.split(from).join(to);
    if(Array.isArray(value))return value.map(walk);
    if(value&&typeof value==='object'){for(const key of Object.keys(value))value[key]=walk(value[key]);}
    return value;
  };
  data.lessons.forEach(walk);
}
// Cambia la glosa de una sola palabra sin tocar otras palabras con la misma glosa.
function renameTargetMeaning(data,target,from,to){
  for(const activity of allActivities(data)){
    const own=activity.target===target||(activity.type==='listening_choice'&&activity.answer===target);
    if(!own)continue;
    if(activity.meaning===from)activity.meaning=to;
    if(activity.answer===from)activity.answer=to;
    if(Array.isArray(activity.options))activity.options=activity.options.map(option=>option===from?to:option);
    for(const field of ['explanation','usage_note'])if(typeof activity[field]==='string'){
      if(activity[field]===from)activity[field]=to;
      activity[field]=activity[field].split(`«${target}»: ${from}.`).join(`«${target}»: ${to}.`);
      if(activity[field].startsWith(`${from}. `))activity[field]=`${to}. ${activity[field].slice(from.length+2)}`;
    }
  }
}

// ── Plantillas de actividades (mismo formato que el resto del curso) ──────
const teach=(id,item)=>({id,type:'teach_concept',prompt:'Aprende y escucha',target:item.target,options:[],answer:'',explanation:item.explanation||'',audio:item.target,slow_audio:item.target,image:null,writing_asset:null,tags:item.tags||[],xp:2,gradable:false,meaning:item.meaning||'',sound_hint:item.sound||'',memory_hint:item.memory||'',teaching_points:item.points||[],group_hint:'',word_breakdown:item.breakdown||[],usage_note:item.usage||'',context_note:'',audio_examples:[]});
const placed=(answer,others,index)=>{const list=[...others];list.splice(index%3,0,answer);return list;};
const choice=(id,item,{prompt,answer,others,index})=>({id,type:'select_translation',prompt,target:item.target,options:placed(answer,others,index),answer,explanation:item.explanation||answer,audio:item.target,slow_audio:item.target,image:null,writing_asset:null,tags:item.tags||[],xp:10});
const listen=(id,item,{prompt,others,index,explanation})=>({id,type:'listening_choice',prompt,target:'',options:placed(item.target,others,index+1),answer:item.target,explanation,audio:item.target,slow_audio:item.target,image:null,writing_asset:null,tags:item.tags||[],xp:10});
const intro=(id,title,text)=>({id,type:'lesson_intro',prompt:title,target:'',options:[],answer:'',explanation:text,audio:'',slow_audio:'',image:null,writing_asset:null,tags:[],xp:2,gradable:false});

// kind 'sound': pregunta cómo se pronuncia; kind 'meaning': qué significa.
function itemLesson({id,title,description,introText,items,kind='meaning'}){
  const activities=[intro(`${id}-intro`,title,introText)];
  items.forEach((item,index)=>{
    const n=index+1,answer=kind==='sound'?item.sound:item.meaning;
    const others=item.others||items.filter(other=>other!==item).map(other=>kind==='sound'?other.sound:other.meaning).filter(text=>text!==answer).slice(0,2);
    const heard=item.listenOthers||items.filter(other=>other!==item).map(other=>other.target).slice(index%2,index%2+2);
    activities.push(teach(`${id}-${n}-teach`,item));
    activities.push(choice(`${id}-${n}-meaning`,item,{prompt:kind==='sound'?`¿Cómo se pronuncia «${item.target}»?`:`¿Qué significa «${item.target}»?`,answer,others,index}));
    activities.push(listen(`${id}-${n}-listen`,item,{prompt:kind==='sound'?'Escucha y elige la palabra que oyes':'Escucha y elige la palabra o frase correcta',others:heard,index,explanation:`Escuchaste «${item.target}»: ${answer}.`}));
  });
  return {id,title,description,activities};
}
const reviewLesson=({id,title,lessons,isTest=false,count})=>{
  const picked=[];for(let round=0;picked.length<count&&round<10;round++)for(const lesson of lessons){const list=lesson.activities.filter(activity=>['select_translation','listening_choice'].includes(activity.type));const activity=list[(round*2+(isTest?1:0))%list.length];if(activity&&!picked.some(item=>item.id===activity.id)&&picked.length<count)picked.push(activity);}
  const activities=picked.map((activity,index)=>({...activity,id:`${id}-${index+1}-${activity.type==='listening_choice'?'listen':'meaning'}`,options:placed(activity.answer,activity.options.filter(option=>option!==activity.answer),index*2+1)}));
  return {id,title,description:isTest?'Comprueba que dominas la unidad antes de avanzar.':'Repasa lo anterior antes de seguir.',...(isTest?{isTest:true,isUnitFinal:true,xpReward:30}:{isReview:true}),activities:[intro(`${id}-intro`,title,isTest?'Responde sin ayudas. Necesitas el porcentaje mínimo para continuar.':'Repasa sin mirar las respuestas: así se fortalece la memoria.'),...activities]};
};
const upsertLessons=(data,lessons,beforeId)=>{
  for(const lesson of lessons){
    const existing=data.lessons.findIndex(item=>item.id===lesson.id);
    if(existing>=0){data.lessons[existing]=lesson;continue;}
    const at=data.lessons.findIndex(item=>item.id===beforeId);
    data.lessons.splice(at<0?data.lessons.length:at,0,lesson);
  }
};
// Añade a una prueba existente preguntas de las lecciones nuevas.
const extendTest=(data,testId,lessons,count)=>{
  const test=data.lessons.find(lesson=>lesson.id===testId);
  const extra=reviewLesson({id:`${testId}-extra`,title:'',lessons,isTest:true,count}).activities.slice(1).map((activity,index)=>({...activity,id:`${testId}-new-${index+1}`}));
  test.activities=[...test.activities.filter(activity=>!activity.id.startsWith(`${testId}-new-`)),...extra];
};

// ── C1. Reglas de lectura que faltaban (vocales escritas con varias letras,
// nasales, letras mudas, consonantes y encadenamiento) ────────────────────
const reading=unit('reading');
const vowels=itemLesson({id:'french-reading-07',title:'Sonidos y lectura · 7 · Vocales de varias letras',description:'oi, eau/au, ai, eu, ou, u, é y la e final muda.',kind:'sound',introText:'En francés varias letras pueden sonar como una sola vocal. Aprende a ver «oi», «eau» o «ai» como un bloque: así leerás moi [mua] y no [moi].',items:[
  {target:'moi',sound:'[mua]',explanation:'oi suena «ua»: moi [mua], trois [trua], noir [nuar].',points:['oi = ua','toi [tua], soir [suar]'],others:['[moi]','[mo]']},
  {target:'beau',sound:'[bo]',explanation:'eau y au suenan «o»: beau [bo], eau [o], au revoir [o-revuar].',points:['eau = o','au = o'],others:['[beau]','[be-o]']},
  {target:'lait',sound:'[lè] (e abierta)',explanation:'ai y ei suenan «è» abierta: lait [lè], maison [mè-zõ], neige [nèzh]. La t final no suena.',points:['ai = è','ei = è'],others:['[lait]','[lai]']},
  {target:'deux',sound:'[dö]: «e» con labios de «o»',explanation:'eu no existe en español: di «e» y redondea los labios como para «o». deux, bleu, peu. La x final no suena.',others:['[deus]','[du]']},
  {target:'tout',sound:'[tu]',explanation:'ou suena como la u española: tout [tu], vous [vu], bonjour [bõ-zhur].',others:['[tout]','[tü]']},
  {target:'rue',sound:'[rü]: «i» con labios de «u»',explanation:'La u francesa: di «i» y redondea los labios. rue [rü] (calle) ≠ roue [ru] (rueda).',others:['[ru]','[ru-e]']},
  {target:'été',sound:'[e-té]: dos e cerradas',explanation:'é es una e cerrada, como en «té». Las terminaciones -er y -ez también suenan é: parler [par-lé], chez [shé].',points:['é = e cerrada','è / ê = e abierta: père, fête'],others:['[e-te-e]','[ét]']},
  {target:'table',sound:'[tabl]: la e final no suena',explanation:'La e sin acento al final de palabra casi nunca suena: table [tabl], porte [port], France [frãs]. Dentro de palabra a veces se pierde: samedi [sam-di].',others:['[ta-ble]','[ta-blé]']},
]});
const nasals=itemLesson({id:'french-reading-08',title:'Sonidos y lectura · 8 · Vocales nasales',description:'an/en, on, in/ain y cuándo la n vuelve a sonar.',kind:'sound',introText:'En una vocal nasal el aire sale también por la nariz y la n o la m NO se pronuncian. Las escribimos con tilde: ã, õ, ẽ.',items:[
  {target:'enfant',sound:'[ã-fã]',explanation:'an, en, am, em = «a» nasal (ã). La n no suena: enfant, temps [tã], chambre [shãbr].',points:['an = en = ã','La t final tampoco suena'],others:['[en-fant]','[an-fan-te]']},
  {target:'bon',sound:'[bõ]',explanation:'on, om = «o» nasal (õ): bon, nom [nõ], maison [mè-zõ]. No cierres la boca con una n.',others:['[bon] con n española','[bo-ne]']},
  {target:'vin',sound:'[vẽ]',explanation:'in, im, ain, ein = «e» nasal muy abierta (ẽ): vin, pain [pẽ], matin [ma-tẽ]. Hoy un suena casi igual.',points:['in = ain = ein = ẽ','un ≈ ẽ'],others:['[vin]','[vi]']},
  {target:'bonne',sound:'[bon]: sin nasal',explanation:'Si después de la n viene una vocal o una segunda n, la vocal ya no es nasal y la n sí suena: bon [bõ] → bonne [bon]; an [ã] → année [a-né].',others:['[bõ]','[bo-né]']},
]});
const silent=itemLesson({id:'french-reading-09',title:'Sonidos y lectura · 9 · Letras que no suenan',description:'Consonantes finales, -ent de los verbos, -er/-ez y la h.',kind:'sound',introText:'El francés escribe muchas letras que no pronuncia. Regla práctica: la consonante final casi nunca suena, salvo c, r, f, l (piensa en la palabra inglesa «CaReFuL»).',items:[
  {target:'petit',sound:'[pe-tí]',explanation:'La consonante final no suena: petit [pe-tí], grand [grã], trop [tro], deux [dö].',others:['[pe-tit]','[pe-ti-te]']},
  {target:'avec',sound:'[a-vék]: la c sí suena',explanation:'c, r, f y l finales suelen sonar: avec, mer, neuf, sel. Excepción frecuente: la -er de los verbos suena é (parler).',others:['[a-vé]','[a-vé-ke]']},
  {target:'ils mangent',sound:'[il mãzh]: -ent no suena',explanation:'En los verbos, -ent de ils/elles es mudo: ils mangent suena igual que il mange. La s de ils tampoco suena.',others:['[ils man-yent]','[il mã-zhã]']},
  {target:'parlez',sound:'[par-lé]',explanation:'-ez y -er finales suenan é: parlez, parler, chez [shé]. La z y la r no se pronuncian.',others:['[par-les]','[par-léz]']},
  {target:'homme',sound:'[om]: la h no suena',explanation:'La h francesa nunca suena: homme [om], hôtel [o-tèl], hier [iér]. Nunca la pronuncies como j.',others:['[jom]','[o-me]']},
]});
const consonants=itemLesson({id:'french-reading-10',title:'Sonidos y lectura · 10 · Consonantes que engañan',description:'j/g suave, ch, s entre vocales, ç, ille, qu y la r.',kind:'sound',introText:'Algunas consonantes se escriben como en español pero suenan distinto. La más importante: j (y g ante e, i) suena «zh», como la «ll» rioplatense; nunca como la j española ni como la «y» mexicana.',items:[
  {target:'jour',sound:'[zhur]',explanation:'j = «zh» (la «ll» de «calle» en Buenos Aires): jour, je, bonjour. Nunca «jur» con j española.',others:['[jur] con j española','[yur]']},
  {target:'rouge',sound:'[ruzh]',explanation:'g delante de e, i, y suena igual que j: rouge, âge, gentil. Delante de a, o, u es g dura: gare, goût.',others:['[ru-gue]','[ru-je] con j española']},
  {target:'chat',sound:'[sha]',explanation:'ch suena «sh», como cuando pides silencio: chat, chambre, dimanche. Nunca la ch española. La t final no suena.',others:['[chat] con ch española','[kat]']},
  {target:'maison',sound:'[mè-zõ]',explanation:'Una s entre dos vocales suena z (zumbido): maison, rose, chose. Para sonido s entre vocales se escribe ss: poisson.',others:['[mè-sõ]','[mai-són]']},
  {target:'garçon',sound:'[gar-sõ]',explanation:'ç (c con cedilla) suena s delante de a, o, u: garçon, ça, français. Sin cedilla sonaría k.',others:['[gar-kõ]','[gar-zón]']},
  {target:'fille',sound:'[fiy]',explanation:'ille suele sonar «iy»: fille, famille, travailler. Excepciones: ville [vil], mille [mil].',others:['[fil]','[fi-lie]']},
  {target:'qui',sound:'[ki]: la u no suena',explanation:'qu suena k y la u es muda: qui, quand [kã], quatre [katr].',others:['[kui]','[ku-i]']},
  {target:'merci',sound:'[mèr-sí] con r de garganta',explanation:'La r francesa se hace al fondo de la garganta (parecida a una j española muy suave), sin vibrar la punta de la lengua: merci, rue, Paris.',others:['[mer-si] con r vibrante','[mer-ki]']},
]});
const linking=itemLesson({id:'french-reading-11',title:'Sonidos y lectura · 11 · Las palabras se unen',description:'Liaison, elisión y encadenamiento.',kind:'sound',introText:'Al hablar, las palabras francesas se unen. Si lees palabra por palabra no reconocerás lo que oyes: «les amis» se dice [le-za-mí].',items:[
  {target:'les amis',sound:'[le-za-mí]',explanation:'Liaison: una s, x o z final muda suena z si la palabra siguiente empieza por vocal o h: les amis, deux heures, vous êtes [vu-zèt].',points:['les + amis → [le-za-mí]','Nunca después de «et»'],others:['[le a-mí]','[les a-mís]']},
  {target:'les enfants',sound:'[le-zã-fã]',explanation:'Liaison en z otra vez: les enfants. La s final de enfants y la t no suenan.',others:['[le ã-fã]','[les en-fants]']},
  {target:'deux heures',sound:'[dö-zör]',explanation:'deux + heures: la x suena z y se une; la h no suena. Lo oirás en todas las horas: trois heures [trua-zör].',others:['[dö ör]','[deus eu-res]']},
  {target:'l’eau',sound:'[lo]',explanation:'Elisión: le, la, je, ne, de, que pierden su vocal delante de vocal o h y se escribe un apóstrofo: l’eau, l’homme, j’ai, je n’ai pas.',points:['la + eau → l’eau','je + ai → j’ai'],others:['[la o]','[le e-a-u]']},
  {target:'j’habite',sound:'[zha-bít]',explanation:'je + habite → j’habite: la h no impide la elisión. Nunca «je habite».',others:['[ye a-bít]','[zhe a-bi-te]']},
  {target:'Il est ici.',sound:'[i-lè-ti-sí]',explanation:'Encadenamiento y liaison: la l de il se une a est, y la t muda de est suena delante de ici. Se oye como una sola palabra.',others:['[il est i-ci]','[il è i-sí]']},
]});
upsertLessons(reading,[vowels,nasals,silent,consonants,linking],'french-reading-test-08');
extendTest(reading,'french-reading-test-08',[vowels,nasals,silent,consonants,linking],10);
// G y J: «ye» lleva al hispanohablante a pronunciar [y]; el sonido es [ʒ].
for(const [from,to] of [['G: ye','G: zhe (como la «ll» rioplatense, nunca «ye»)'],['J: yi francesa','J: zhi (como la «ll» rioplatense, nunca «yi»)'],['ye','zhe (ll rioplatense)'],['yi francesa','zhi (ll rioplatense)']])replaceText(reading,from,to,{whole:true});
reading.description='Nombres de las letras y, después, las reglas que necesitas para leer: vocales de varias letras, nasales, letras mudas y palabras que se unen.';
Object.assign(course.units.find(entry=>entry.id==='reading'),{description:reading.description});

// ── C2. Conjugar être, avoir y los verbos en -er; negar y usar artículos ───
const essentials=unit('essentials');
const etre=itemLesson({id:'french-essentials-10',title:'Pronombres y verbos esenciales · 10 · Être en presente',description:'je suis, tu es, il est… el verbo ser/estar conjugado.',introText:'Hasta ahora viste «être» en infinitivo. Para hablar necesitas conjugarlo. Fíjate: es, est suenan igual [è], y la s final de nous, vous, ils solo suena si sigue una vocal.',items:[
  {target:'je suis',meaning:'yo soy / yo estoy',explanation:'je + suis: Je suis mexicain. Je suis fatigué.',points:['être = ser y estar'],usage:'Francés no distingue ser y estar: je suis cubre los dos.'},
  {target:'tu es',meaning:'tú eres / tú estás',explanation:'tu es [tü è]: Tu es étudiant ?',usage:'Con amigos, familia y gente joven.'},
  {target:'il est',meaning:'él es / él está',explanation:'il est [i-lè]: Il est ici. Elle est = ella es / está.'},
  {target:'nous sommes',meaning:'nosotros somos / estamos',explanation:'nous sommes [nu som]: Nous sommes prêts.'},
  {target:'vous êtes',meaning:'usted es / ustedes son',explanation:'vous êtes [vu-zèt]: la s de vous suena z por la liaison.',usage:'vous = usted (formal) o ustedes.'},
  {target:'ils sont',meaning:'ellos son / están',explanation:'ils sont [il sõ]: Ils sont au parc. elles sont = ellas son / están.'},
]});
const avoir=itemLesson({id:'french-essentials-11',title:'Pronombres y verbos esenciales · 11 · Avoir en presente',description:'j’ai, tu as, il a… el verbo tener conjugado.',introText:'avoir (tener) es irregular. Además sirve para la edad: J’ai vingt ans = Tengo veinte años.',items:[
  {target:'j’ai',meaning:'yo tengo',explanation:'je + ai → j’ai [zhé]: J’ai un frère. J’ai faim.',points:['je pierde la e delante de vocal'],usage:'La edad se dice con avoir: J’ai trente ans.'},
  {target:'tu as',meaning:'tú tienes',explanation:'tu as [tü a]: Tu as un stylo ?'},
  {target:'il a',meaning:'él tiene',explanation:'il a [i-la]: Il a deux enfants. elle a = ella tiene.'},
  {target:'nous avons',meaning:'nosotros tenemos',explanation:'nous avons [nu-za-võ]: liaison en z.'},
  {target:'vous avez',meaning:'usted tiene / ustedes tienen',explanation:'vous avez [vu-za-vé]: Vous avez une chambre ?'},
  {target:'ils ont',meaning:'ellos tienen',explanation:'ils ont [il-zõ]: no confundir con ils sont [il sõ] (son). La z marca «tienen».'},
]});
const er=itemLesson({id:'french-essentials-12',title:'Pronombres y verbos esenciales · 12 · Verbos en -er: parler',description:'La conjugación regular más frecuente.',introText:'La mayoría de verbos terminan en -er (parler, travailler, habiter). Quita -er y añade: -e, -es, -e, -ons, -ez, -ent. Buena noticia: je parle, tu parles, il parle e ils parlent suenan igual [parl].',items:[
  {target:'je parle',meaning:'(yo) hablo',explanation:'parl- + e: Je parle espagnol. Se pronuncia [zhe parl].',points:['La -e final no suena']},
  {target:'tu parles',meaning:'(tú) hablas',explanation:'parl- + es: Tu parles français ? La -s no suena.'},
  {target:'il parle',meaning:'(él) habla',explanation:'parl- + e: Il parle vite. elle parle = ella habla.'},
  {target:'nous parlons',meaning:'(nosotros) hablamos',explanation:'parl- + ons: Nous parlons [nu par-lõ].',usage:'Al hablar se usa mucho «on parle» = hablamos.'},
  {target:'vous parlez',meaning:'usted habla / ustedes hablan',explanation:'parl- + ez: Vous parlez anglais ? -ez suena é.'},
  {target:'ils parlent',meaning:'(ellos) hablan',explanation:'parl- + ent: Ils parlent [il parl]. -ent no suena.'},
]});
const negation=itemLesson({id:'french-essentials-13',title:'Pronombres y verbos esenciales · 13 · Negar y usar artículos',description:'ne… pas con verbos conjugados, pas de, un/une/des.',introText:'La negación rodea al verbo: ne + verbo + pas. Delante de vocal, ne se vuelve n’. Después de pas, un/une/des se convierten en de: J’ai un frère → Je n’ai pas de frère.',items:[
  {target:'Je ne parle pas anglais.',meaning:'No hablo inglés.',explanation:'ne + parle + pas. Al hablar a menudo se oye «Je parle pas anglais».'},
  {target:'Je ne suis pas fatigué.',meaning:'No estoy cansado.',explanation:'ne + suis + pas. Una mujer escribe fatiguée (suena igual).'},
  {target:'Je n’ai pas de voiture.',meaning:'No tengo coche.',explanation:'ne → n’ delante de ai; une voiture → pas de voiture.',points:['un / une / des → de después de pas']},
  {target:'un livre',meaning:'un libro (masculino)',explanation:'un para sustantivos masculinos. El género no siempre coincide con el español: le lait (la leche).'},
  {target:'une maison',meaning:'una casa (femenino)',explanation:'une para sustantivos femeninos. Aprende cada palabra con su artículo.'},
  {target:'des livres',meaning:'(unos) libros',explanation:'des = plural de un/une. La s de livres no suena: el plural se oye en el artículo [de].'},
]});
negation.activities.push(
  {id:'french-essentials-13-production-blocks',type:'build_with_blocks',prompt:'Arma la frase: «No hablo inglés»',target:'No hablo inglés.',options:['parle','Je','anglais.','pas','ne'],joiner:' ',answer:'Je ne parle pas anglais.',accepted_answers:['Je ne parle pas anglais.'],explanation:'Je (yo) · ne … pas (no) rodea al verbo · parle (hablo) · anglais (inglés).',audio:'Je ne parle pas anglais.',slow_audio:'Je ne parle pas anglais.',image:null,writing_asset:null,tags:['production','blocks'],xp:15},
  {id:'french-essentials-13-production-typed',type:'typed_translation',prompt:'Escribe en francés: «usted es / ustedes son» (verbo être)',target:'usted es / ustedes son',instruction:'Escribe el pronombre y el verbo.',answer:'vous êtes',accepted_answers:['vous êtes'],allow_minor_typos:false,explanation:'être con vous: vous êtes [vu-zèt].',audio:'vous êtes',slow_audio:'vous êtes',image:null,writing_asset:null,tags:['production'],xp:20},
);
upsertLessons(essentials,[etre,avoir,er,negation],'french-essentials-test-12');
extendTest(essentials,'french-essentials-test-12',[etre,avoir,er,negation],8);
// «où» y «ou» suenan igual: no pueden ser opciones de una escucha.
for(const activity of allActivities(essentials))if(activity.type==='listening_choice'&&activity.options.includes('où')&&activity.options.includes('ou'))activity.options=activity.options.map(option=>option===(activity.answer==='où'?'ou':'où')?'quand':option);
for(const [from,to] of [['Idea clave: ye parl fransé','Idea clave: zhe parl fransé (je suena con la «ll» rioplatense)'],['Idea clave: ye ne se pa','Idea clave: zhe ne se pa (al hablar, ne casi desaparece)']])replaceText(essentials,from,to,{whole:true});

// ── C3. La unidad «time» repetía survival: ahora enseña números 20–100,
// la hora, las fechas y los precios ───────────────────────────────────────
const time=unit('time');
const timeLessons=[
  itemLesson({id:'french-time-01',title:'Números y tiempo · 1 · Del 21 al 60',description:'Decenas y la regla de «et un».',introText:'Desde survival sabes contar hasta veinte. Las decenas son regulares hasta sesenta. Con 1 se dice «et un» (vingt et un); con los demás, guion (vingt-deux).',items:[
    {target:'vingt et un',meaning:'veintiuno',points:['21, 31, 41, 51, 61: et un']},{target:'trente',meaning:'treinta'},{target:'quarante',meaning:'cuarenta'},{target:'cinquante',meaning:'cincuenta'},{target:'soixante',meaning:'sesenta',sound:'Se pronuncia [sua-sãt]: la x suena s.'}]}),
  itemLesson({id:'french-time-02',title:'Números y tiempo · 2 · Del 70 al 100',description:'Setenta, ochenta y noventa se cuentan con sumas.',introText:'En Francia 70 es «sesenta y diez», 80 es «cuatro veintes» y 90 es «cuatro veintes y diez». En Bélgica y Suiza se oye septante y nonante.',items:[
    {target:'soixante-dix',meaning:'setenta (60 + 10)',points:['soixante + dix']},{target:'soixante et onze',meaning:'setenta y uno (60 + 11)'},{target:'quatre-vingts',meaning:'ochenta (4 × 20)',points:['La s final solo en 80 justo']},{target:'quatre-vingt-dix',meaning:'noventa (4 × 20 + 10)'},{target:'cent',meaning:'cien',sound:'La t no suena: [sã].'}]}),
  itemLesson({id:'french-time-03',title:'Números y tiempo · 3 · La hora',description:'et quart, et demie, moins le quart y las 24 horas.',introText:'Para la hora se usa «Il est … heure(s)». En horarios oficiales se usan las 24 horas: vingt heures = las ocho de la noche.',items:[
    {target:'Il est une heure.',meaning:'Es la una.',points:['une heure: singular']},{target:'Il est deux heures et demie.',meaning:'Son las dos y media.'},{target:'Il est trois heures et quart.',meaning:'Son las tres y cuarto.'},{target:'Il est quatre heures moins le quart.',meaning:'Es un cuarto para las cuatro.',points:['moins = menos']},{target:'Il est midi.',meaning:'Son las doce del día.',points:['minuit = medianoche']},{target:'à vingt heures',meaning:'a las ocho de la noche (20 h)'}]}),
  itemLesson({id:'french-time-04',title:'Números y tiempo · 4 · Días y fechas',description:'Qué día es hoy, el día del mes y los cumpleaños.',introText:'Las fechas usan el número normal precedido de «le»: le vingt-sept octobre. Solo el día 1 es «le premier».',items:[
    {target:'Quel jour sommes-nous ?',meaning:'¿Qué día es hoy?'},{target:'Nous sommes lundi.',meaning:'Hoy es lunes.'},{target:'le vingt-sept octobre',meaning:'el 27 de octubre'},{target:'le premier mai',meaning:'el primero de mayo'},{target:'C’est quand, ton anniversaire ?',meaning:'¿Cuándo es tu cumpleaños?'}]}),
  itemLesson({id:'french-time-05',title:'Números y tiempo · 5 · Precios',description:'Preguntar y entender precios en euros.',introText:'Los precios se dicen con «euros» y los céntimos se nombran sin «con»: un euro cinquante = 1,50 €.',items:[
    {target:'Ça coûte combien ?',meaning:'¿Cuánto cuesta esto?'},{target:'Ça coûte cinq euros.',meaning:'Cuesta cinco euros.',sound:'Liaison: cinq euros [sẽ-kö-ro].'},{target:'un euro cinquante',meaning:'un euro con cincuenta (1,50 €)'},{target:'Ça fait vingt euros.',meaning:'Son veinte euros en total.'},{target:'C’est gratuit.',meaning:'Es gratis.'}]}),
];
time.title='Números, horas, fechas y precios';
time.description='Números del 21 al 100, la hora, el calendario y los precios.';
time.lessons=[...timeLessons.slice(0,3),reviewLesson({id:'french-time-review-03',title:'Repaso breve 1',lessons:timeLessons.slice(0,3),count:8}),...timeLessons.slice(3),reviewLesson({id:'french-time-review-05',title:'Repaso breve 2',lessons:timeLessons.slice(3),count:8}),reviewLesson({id:'french-time-test-16',title:'Prueba · Números, horas, fechas y precios',lessons:timeLessons,isTest:true,count:18})];
Object.assign(course.units.find(entry=>entry.id==='time'),{title:time.title,description:time.description});

// ── C4. Francés agramatical y traducciones erróneas ──────────────────────
const people=unit('a1-1-people');
replaceText(people,'Il est mon ami.','C’est mon ami.');
replaceText(people,'Elle est ma sœur.','C’est ma sœur.');
const cestNote='Para presentar o identificar a alguien se usa C’est + mon/ma/un/une: C’est mon ami. «Il est» va con un adjetivo o una profesión sin artículo: Il est gentil, Il est médecin.';
for(const activity of allActivities(people))if(activity.type==='teach_concept'&&['C’est mon ami.','C’est ma sœur.'].includes(activity.target))activity.usage_note=cestNote;
replaceText(unit('reading-bridge'),'Sí, quiero hablar bien francés.','Sí, con gusto hablo francés.');
for(const activity of allActivities(unit('reading-bridge')))if(activity.type==='teach_concept'&&activity.target==='Oui, je veux bien parler français.'){
  activity.usage_note='«Je veux bien» no es «quiero bien»: significa «con gusto, de acuerdo» y acepta una propuesta con amabilidad.';
  for(const part of activity.word_breakdown||[])if(/veux bien/.test(part.text||'')){part.meaning='con gusto, de acuerdo';part.note='Expresión fija para aceptar.';}
}
const vocabulary=unit('vocabulary');
for(const [from,to] of [
  ['Ma tête fait mal. — Me duele la cabeza.','J’ai mal à la tête. — Me duele la cabeza.'],
  ['Mon dos fait mal. — Me duele la espalda.','J’ai mal au dos. — Me duele la espalda.'],
  ['Je prends un ticket. — Cojo un billete.','Je prends un ticket. — Tomo un boleto.'],
  ['vosotros / usted','usted / ustedes'],
  ['zumo','jugo'],
])replaceText(vocabulary,from,to);
renameTargetMeaning(vocabulary,'beau','buen tiempo','bonito («il fait beau»: hace buen tiempo)');
renameTargetMeaning(vocabulary,'pour','por','para / por');
renameTargetMeaning(vocabulary,'vers','aproximadamente','hacia; a eso de (con horas)');
renameTargetMeaning(vocabulary,'le nom','el apellido / nombre','el nombre (en formularios: el apellido)');
for(const [id,from,to] of [
  ['a2-2-opinions','Je n’aime pas, même si','Je n’aime pas ça, même si'],
  ['b1-1-cause-effect','Je n’aime pas, même si','Je n’aime pas ça, même si'],
  ['b1-2-negotiation','On peut céder sur le prix, pas la qualité.','On peut céder sur le prix, mais pas sur la qualité.'],
])replaceText(unit(id),from,to);
// Glosas españolas que no traducen la frase francesa del curso.
const spanish={
  'a1-1-identity':[['Hablo un poco de este idioma.','Hablo un poco de francés.']],
  'a1-1-people':[['¿Cuántos años tienes?','¿Cuántos años tiene usted?']],
  'a1-1-home':[['No está aquí.','No es aquí.']],
  'a1-1-food':[['Quiero un poco de arroz.','Quisiera arroz.']],
  'a1-2-weather':[['Lleva un paraguas.','Lleve un paraguas.']],
  'a1-2-social':[['¿Puedo traer a un amigo?','¿Puedo ir con un amigo?']],
  'a2-1-ability':[['Debes mostrar tu pasaporte.','Debe mostrar su pasaporte.'],['Aquí se puede tomar fotos.','Aquí se pueden tomar fotos.']],
  'b1-1-media':[['La protagonista intenta descubrir la verdad.','El personaje principal intenta descubrir la verdad.']],
  'b1-2-nuance':[['La protagonista intenta descubrir la verdad.','El personaje principal intenta descubrir la verdad.'],['Hasta cierto punto, el resultado fue positivo.','En general, el resultado fue positivo.'],['Entiendo tu punto, aunque lo veo de otra manera.','Entiendo tu opinión, pero no estoy de acuerdo.'],['La idea parece buena; sin embargo, puede ser costosa.','Buena idea, pero quizá demasiado cara.'],['No necesariamente significa que sea imposible.','Eso no quiere decir que sea imposible.'],['Probablemente funcione, siempre que todos participen.','Debería funcionar si todos participan.'],['Hay una diferencia sutil entre estas dos expresiones.','Estas expresiones son ligeramente distintas.'],['¿Qué tan segura es esa información?','¿Es fiable esta información?']],
  'b1-2-conditions':[['Si salimos ahora, llegaremos antes de que oscurezca.','Si salimos ahora, llegaremos temprano.'],['Si tuviera más tiempo, aprendería otro idioma.','Si tuviera tiempo, aprendería otro idioma.'],['En caso de que necesites ayuda, llámame.','Si necesitas ayuda, llámame.']],
  'b1-2-negotiation':[['Propongo que probemos esta opción primero.','Probemos primero esta opción.'],['Aceptaría si cambiamos la fecha.','Aceptaría si cambiáramos la fecha.'],['Esa solución no me convence del todo.','Esa solución no me convence.'],['Entonces, ¿quedamos de acuerdo en este plan?','Entonces, ¿estamos de acuerdo?']],
  'b1-2-projects':[['Tenemos que decidir qué es prioritario.','¿Cuál es la prioridad?'],['Conviene prever los riesgos antes de empezar.','Anticipemos los riesgos antes de empezar.'],['Revisaremos los avances al final de la semana.','Haremos balance este fin de semana.']],
  'b1-2-perspectives':[['Conviene considerar también el contexto histórico.','Pensemos también en el contexto histórico.'],['La experiencia personal influye en nuestra opinión.','La experiencia influye en nuestra opinión.'],['Comparar ambas perspectivas ayuda a comprender el problema.','Comparar los puntos de vista aclara el problema.'],['¿Qué argumentos respaldan esa conclusión?','¿Qué argumentos apoyan este punto?']],
  'b1-2-conversation':[['Antes de continuar, quisiera aclarar un detalle.','Primero quiero precisar un detalle.'],['Volviendo al tema anterior, queda una pregunta.','Volvamos al tema: queda una pregunta.'],['En resumen, tenemos dos opciones principales.','En resumen, tenemos dos opciones.']],
};
for(const [id,pairs] of Object.entries(spanish))for(const [from,to] of pairs)replaceText(unit(id),from,to);

// «personne» sola es «persona», pero con ne… significa «nadie».
for(const id of ['survival','vocabulary','a1-1-identity'])for(const activity of allActivities(unit(id)))if(activity.type==='teach_concept'&&activity.target==='personne'&&!activity.usage_note)activity.usage_note='une personne = una persona. Ojo: ne… personne = nadie: Je ne vois personne (No veo a nadie).';

// ── C5. Producción: variantes correctas y diálogos con margen ────────────
const accepted={
  'Comment vous appelez-vous ?':['Vous vous appelez comment ?','Quel est votre nom ?'],
  'Je viens du Mexique.':['Je suis du Mexique.','Je suis mexicain.','Je suis mexicaine.'],
  'Qui est-ce ?':['C’est qui ?','Qui c’est ?'],
  'Quel âge avez-vous ?':['Vous avez quel âge ?'],
  'La clé est sur la table.':['La clef est sur la table.'],
  'Je me lève à sept heures.':['Je me lève à 7 heures.','Je me lève à 7h.','Je me lève à 7 h.'],
  'Je bois du thé le matin.':['Le matin, je bois du thé.','Je bois du thé tous les matins.'],
  'Je voudrais du riz.':['Je veux du riz.','Je voudrais un peu de riz.'],
  'Je peux payer par carte ?':['Est-ce que je peux payer par carte ?','Puis-je payer par carte ?','Je peux payer avec une carte ?','Je peux payer avec la carte ?'],
  'Je n’ai que des espèces.':['J’ai seulement des espèces.','Je n’ai que du liquide.'],
  'J’arrive à huit heures.':['J’arrive à 8 heures.','J’arrive à 8h.','J’arrive à 8 h.'],
  'Dois-je changer ?':['Je dois changer ?','Est-ce que je dois changer ?','Il faut changer ?'],
  'Le train est en retard.':['Le train a du retard.'],
  'Je suis allergique à la pénicilline.':['J’ai une allergie à la pénicilline.'],
  'J’ai besoin d’un manteau.':['Il me faut un manteau.'],
  'Le temps change vite.':['Le temps change rapidement.','La météo change vite.'],
  'On se retrouve où ?':['Où est-ce qu’on se retrouve ?','Où on se retrouve ?','On se voit où ?'],
  'Je suis libre après six heures.':['Je suis libre après 6 heures.','Je suis libre après 18 heures.','Je suis libre après 18h.'],
};
const FREE_TYPES=new Set(['typed_translation','speak_and_transcribe','open_question']);
// Los guiones no se normalizan al comparar: «appelez vous» debe valer igual.
const withHyphenVariants=list=>[...new Set(list.flatMap(answer=>/\S-\S/.test(answer)?[answer,answer.replace(/(\S)-(\S)/g,'$1 $2')]:[answer]))];
const widen=target=>{const base=target.accepted_answers||[target.answer];target.accepted_answers=withHyphenVariants([...base,...(accepted[target.answer]||[])]);};
for(const id of order.filter(id=>/^(a1|a2|b1)-/.test(id))){
  for(const activity of allActivities(unit(id))){
    if(FREE_TYPES.has(activity.type))widen(activity);
    if(activity.turns){
      activity.turns.filter(turn=>turn.role==='learner').forEach(widen);
      const learners=activity.turns.filter(turn=>turn.role==='learner').length;
      if(learners>=3)activity.minimum_correct=learners-1;
    }
  }
}

// ── Guardar ────────────────────────────────────────────────────────────
const changed=[];
// «bonjour» se enseñaba dos veces en identity-01 (como «hola» y como «buenos
// días»): el segundo elemento pasa a ser «Salut», el saludo entre amigos.
{
  const identity=unit('a1-1-identity'),SALUT='hola (entre amigos)';
  const second=new Set(['french-a11-identity-01-02-teach','french-a11-identity-01-02-meaning','french-a11-identity-01-02-listen','french-a11-identity-review-02-02-meaning','french-a11-identity-test-02-meaning']);
  for(const activity of allActivities(identity).filter(activity=>second.has(activity.id))){
    for(const key of ['target','audio','slow_audio'])if(activity[key]==='bonjour')activity[key]='Salut';
    if(activity.type==='teach_concept'){activity.explanation=SALUT;activity.meaning=SALUT;activity.usage_note='Informal: con amigos y gente de tu edad. Con desconocidos, «bonjour».';}
    if(activity.type==='select_translation'){activity.prompt='¿Qué significa «Salut»?';activity.options=activity.options.map(option=>option==='buenos días'?SALUT:option);activity.answer=SALUT;activity.explanation=`«Salut» significa «${SALUT}».`;}
    if(activity.type==='listening_choice'){activity.options=activity.options.map(option=>option==='bonjour'?'Salut':option);activity.answer='Salut';activity.explanation=`La forma escuchada es «Salut»: ${SALUT}`;}
  }
}

for(const [name,file] of files){
  const after=JSON.stringify(file.data,null,2)+'\n';
  if(after!==file.before){fs.writeFileSync(file.url,after);changed.push(name);}
}
console.log(JSON.stringify({changed},null,1));
