// Correcciones críticas de la auditoría del curso de alemán
// (docs/AUDITORIA_ALEMAN_2026-10-27.md). Idempotente: se puede volver a
// ejecutar sin duplicar lecciones ni respuestas. Sigue el mismo enfoque que
// scripts/repair_korean_audit_2026_10.mjs (copiado, no importado).
import fs from 'node:fs';

const dir=new URL('../library/courses/German/',import.meta.url);
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
// Nunca toca las claves de audio: cambiarlas rompería el enlace con la grabación.
const AUDIO_KEYS=new Set(['audio','slow_audio']);
function replaceText(data,from,to,{whole=false}={}){
  const walk=value=>{
    if(typeof value==='string')return whole?(value===from?to:value):value.split(from).join(to);
    if(Array.isArray(value))return value.map(walk);
    if(value&&typeof value==='object'){for(const key of Object.keys(value))if(!AUDIO_KEYS.has(key))value[key]=walk(value[key]);}
    return value;
  };
  data.lessons.forEach(walk);
}
const replaceEverywhere=(from,to,options)=>{for(const id of order)replaceText(unit(id),from,to,options);};

// ── Plantillas de actividades (mismo formato que el resto del curso) ──────
const teach=(id,item)=>({id,type:'teach_concept',prompt:'Aprende y escucha',target:item.target,options:[],answer:'',explanation:item.explanation||'',audio:item.audio||item.target,slow_audio:item.audio||item.target,image:null,writing_asset:null,tags:item.tags||[],xp:2,gradable:false,meaning:item.meaning||'',sound_hint:item.soundHint||'',memory_hint:item.memory||'',teaching_points:item.points||[],group_hint:'',word_breakdown:item.breakdown||[],usage_note:item.usage||'',context_note:'',audio_examples:[]});
const placed=(answer,others,index)=>{const list=[...others];list.splice(index%3,0,answer);return list;};
const choice=(id,item,{prompt,answer,others,index})=>({id,type:'select_translation',prompt,target:item.target,options:placed(answer,others,index),answer,explanation:item.explanation||answer,audio:item.audio||item.target,slow_audio:item.audio||item.target,image:null,writing_asset:null,tags:item.tags||[],xp:10});
const listen=(id,item,{prompt,others,index,explanation})=>({id,type:'listening_choice',prompt,target:'',options:placed(item.target,others,index+1),answer:item.target,explanation,audio:item.audio||item.target,slow_audio:item.audio||item.target,image:null,writing_asset:null,tags:item.tags||[],xp:10});
const intro=(id,title,text)=>({id,type:'lesson_intro',prompt:title,target:'',options:[],answer:'',explanation:text,audio:'',slow_audio:'',image:null,writing_asset:null,tags:[],xp:2,gradable:false});

// kind 'sound': pregunta cómo se pronuncia; kind 'meaning': qué significa.
function itemLesson({id,title,description,introText,items,kind='meaning'}){
  const activities=[intro(`${id}-intro`,title,introText)];
  items.forEach((item,index)=>{
    const n=index+1,answer=kind==='sound'?item.sound:item.meaning;
    const others=item.others||items.filter(other=>other!==item).map(other=>kind==='sound'?other.sound:other.meaning).filter(text=>text!==answer).slice(0,2);
    const heard=item.listenOthers||items.filter(other=>other!==item).map(other=>other.target).slice(index%2,index%2+2);
    activities.push(teach(`${id}-${n}-teach`,{...item,explanation:item.explanation||(kind==='sound'?`${item.target}: ${item.sound}`:''),soundHint:item.soundHint||(kind==='sound'?item.sound:'')}));
    activities.push(choice(`${id}-${n}-meaning`,{...item,explanation:item.explanation||answer},{prompt:kind==='sound'?`¿Cómo se pronuncia «${item.target}»?`:`¿Qué significa «${item.target}»?`,answer,others,index}));
    activities.push(listen(`${id}-${n}-listen`,item,{prompt:kind==='sound'?'Escucha y elige la palabra que oyes':'Escucha y elige la palabra o frase correcta',others:heard,index,explanation:`Escuchaste «${item.target}»: ${answer}.`}));
  });
  return {id,title,description,activities};
}
const reviewLesson=({id,title,lessons,isTest=false,count,meta={}})=>{
  const picked=[];for(let round=0;picked.length<count&&round<10;round++)for(const lesson of lessons){const list=lesson.activities.filter(activity=>['select_translation','listening_choice'].includes(activity.type));const activity=list[(round*2+(isTest?1:0))%list.length];if(activity&&!picked.some(item=>item.id===activity.id)&&picked.length<count)picked.push(activity);}
  const activities=picked.map((activity,index)=>({...activity,id:`${id}-${index+1}-${activity.type==='listening_choice'?'listen':'meaning'}`,options:placed(activity.answer,activity.options.filter(option=>option!==activity.answer),index*2+1)}));
  const flags=isTest?{isTest:true}:{isReview:true};
  return {id,title,description:isTest?'Comprueba que dominas la unidad antes de avanzar.':'Repasa lo anterior antes de seguir.',...meta,...flags,activities:[intro(`${id}-intro`,title,isTest?'Responde sin ayudas. Necesitas el porcentaje mínimo para continuar.':'Repasa sin mirar las respuestas: así se fortalece la memoria.'),...activities]};
};
const upsertLessons=(data,lessons,beforeId)=>{
  for(const lesson of lessons){
    const existing=data.lessons.findIndex(item=>item.id===lesson.id);
    if(existing>=0){data.lessons[existing]=lesson;continue;}
    const at=data.lessons.findIndex(item=>item.id===beforeId);
    data.lessons.splice(at<0?data.lessons.length:at,0,lesson);
  }
};
const lessonMeta=lesson=>{if(!lesson)return {};const {id,title,description,activities,...rest}=lesson;return rest;};
const appendToTest=(data,testId,lessons,count)=>{
  const testLesson=data.lessons.find(lesson=>lesson.id===testId);
  const prefix=`${testId}-new-`;
  const extra=reviewLesson({id:`${testId}-extra`,title:'',lessons,isTest:true,count}).activities.slice(1).map((activity,index)=>({...activity,id:`${prefix}${index+1}`}));
  testLesson.activities=[...testLesson.activities.filter(activity=>!activity.id.startsWith(prefix)),...extra];
};

// ── C1. «Sonidos y lectura» enseñaba nombres de letras como si fueran sonidos ──
const reading=unit('reading');
// Respuestas que daban el nombre de la letra (o un dato falso, como «ß: s larga»)
// cuando la pregunta es «¿Cómo se pronuncia…?». Se sustituyen por el sonido real.
const letterSounds={
  'B':['be','b (al final de palabra suena p)','beh'],
  'C':['tse','ts ante e/i; k en préstamos (Café)','tseh'],
  'D':['de','d (al final de palabra suena t)','deh'],
  'F':['ef','f','eff'],
  'G':['gue','g de «gato» (al final suena k)','geh'],
  'H':['ha aspirada','h aspirada; tras vocal no suena y alarga la vocal','hah'],
  'J':['yot; suele sonar y','y de «ya» (nunca jota)','yot'],
  'K':['ka','k','kah'],
  'L':['el','l','ell'],
  'M':['em','m','emm'],
  'N':['en','n','enn'],
  'P':['pe','p','peh'],
  'Q':['ku','kv (siempre qu: Quatsch)','kuh'],
  'T':['te','t','teh'],
  'V':['fau; suele sonar f','f (Vater); v solo en préstamos','fau'],
  'W':['ve','v de labio y dientes (nunca b)','veh'],
  'X':['iks','ks','iks'],
  'Y':['üpsilon','ü (como Ü)','üpsilon'],
  'Z':['tset','ts (nunca la z española)','tsett'],
  'ß':['s larga','s sorda, como la s española (no es una s larga)','eszett'],
};
for(const [letter,[old,sound,name]] of Object.entries(letterSounds)){
  replaceText(reading,old,sound,{whole:true});
  replaceText(reading,`${letter}: ${old}`,`${letter}: ${sound}. Su nombre al deletrear es «${name}».`,{whole:true});
}
const readingItems=[
  itemLesson({id:'german-reading-07',title:'Sonidos y lectura · 7 · Consonantes que engañan',description:'Z, W, V, J, S, ST y SCH no suenan como en español.',kind:'sound',introText:'Estas letras existen en español, pero en alemán suenan distinto. Escucha cada palabra completa y fíjate en la primera letra.',items:[
    {target:'Zug',meaning:'tren',sound:'[tsuk]: z = ts',explanation:'Z siempre suena «ts», como en «pizza». Zug [tsuk]: además, la g final suena k.',others:['[suk]: z = s','[chuk]: z = ch']},
    {target:'Wasser',meaning:'agua',sound:'[vasa]: w = v de labio y dientes',explanation:'W suena como una v hecha con los dientes sobre el labio inferior, nunca como b. La -er final suena casi «a».',others:['[basa]: w = b','[uasa]: w = u']},
    {target:'Vater',meaning:'padre',sound:'[fata]: v = f',explanation:'V en palabras alemanas suena f: Vater [fata], vier [fia].',others:['[bata]: v = b','[uata]: v = u']},
    {target:'ja',meaning:'sí',sound:'[ya]: j = y',explanation:'J suena como la y de «ya», nunca como la jota española.',others:['[ja] con jota española','[cha]: j = ch']},
    {target:'Sonne',meaning:'sol',sound:'[zone]: s + vocal = z zumbada',explanation:'S delante de vocal suena sonora, como un zumbido de abeja: Sonne, sie, sechs.',others:['[shone]: s = sh','[tone]: s = t']},
    {target:'Straße',meaning:'calle',sound:'[shtrase]: st inicial = sht',explanation:'ST y SP al inicio de palabra (o de raíz) suenan «sht» y «shp»: Straße, Stadt, Sport. Nunca se añade una e delante.',others:['[estrase]: con e delante','[strase]: s + t como en español']},
    {target:'Schule',meaning:'escuela',sound:'[shule]: sch = sh',explanation:'SCH es un solo sonido, como «sh» o como cuando pides silencio: Schule [shule].',others:['[eskule]: s + k','[chule]: ch de «chico»']},
  ]}),
  itemLesson({id:'german-reading-08',title:'Sonidos y lectura · 8 · Vocales dobles y umlauts',description:'EI, IE, AU, EU/ÄU y las vocales Ä, Ö, Ü dentro de palabras.',kind:'sound',introText:'Dos vocales juntas suelen formar un solo sonido. Truco: en EI e IE se pronuncia la segunda letra: mein [main], sie [si].',items:[
    {target:'mein',meaning:'mi',sound:'[main]: ei = ai',explanation:'EI suena «ai»: mein, nein, zwei.',points:['ei = ai','Truco: se lee el nombre de la segunda letra (i → «ai»)'],others:['[mein]: e + i separadas','[min]: i larga']},
    {target:'sie',meaning:'ella / ellos',sound:'[si]: ie = i larga',explanation:'IE es una i larga: sie, vier, Bier. La e no suena.',others:['[sie]: i + e separadas','[sai]: ie = ai']},
    {target:'Haus',meaning:'casa',sound:'[haus]: au = au',explanation:'AU suena igual que en español «causa»: Haus, auf.',others:['[hos]: au = o','[jaus]: h = j']},
    {target:'neun',meaning:'nueve',sound:'[noin]: eu = oi',explanation:'EU (y también ÄU) suena «oi»: neun, heute, Häuser.',points:['eu = oi','äu = oi: Haus → Häuser'],others:['[neun]: e + u separadas','[nain]: eu = ai']},
    {target:'Bär',meaning:'oso',sound:'[ber]: ä = e abierta',explanation:'Ä suena como una e abierta: Bär, Käse.',others:['[bar]: ä = a','[bir]: ä = i']},
    {target:'schön',meaning:'bonito',sound:'ö: lengua en «e», labios redondos como «o»',explanation:'Ö: di «e» y, sin mover la lengua, redondea los labios como para «o». schön ≠ schon.',others:['ö = o normal','ö = e normal']},
    {target:'über',meaning:'sobre, encima de',sound:'ü: lengua en «i», labios redondos como «u»',explanation:'Ü: di «i» y redondea los labios como para «u». über, fünf, Tür.',others:['ü = u normal','ü = i normal']},
  ]}),
  itemLesson({id:'german-reading-09',title:'Sonidos y lectura · 9 · Vocal larga o corta y finales',description:'Vocales dobles, H muda, consonante doble, -er final y consonantes finales.',kind:'sound',introText:'En alemán la duración de la vocal cambia palabras. Vocal larga: vocal doble (Tee) o vocal + h (Sohn). Vocal corta: antes de consonante doble (Mutter). Y al final de palabra b, d, g suenan p, t, k.',items:[
    {target:'Tee',meaning:'té',sound:'e larga (vocal doble = larga)',explanation:'Una vocal doble se pronuncia larga, no dos veces: Tee [tee], Boot.',others:['dos e separadas: [te-e]','e corta y rápida']},
    {target:'Sohn',meaning:'hijo',sound:'o larga; la h no suena',explanation:'Una h después de vocal no suena: solo indica que la vocal es larga. Sohn [soon], Zahn [tsaan].',others:['[sojn]: h = jota','o corta y la h aspirada']},
    {target:'Mutter',meaning:'madre',sound:'u corta (antes de consonante doble)',explanation:'Antes de consonante doble la vocal es corta: Mutter, Wasser, Bett.',others:['u larga','t doble pronunciada dos veces']},
    {target:'Kind',meaning:'niño',sound:'[kint]: d final suena t',explanation:'Al final de palabra b, d, g suenan p, t, k (se «ensordecen»): Kind [kint], Zug [tsuk], gelb [gelp].',others:['[kind] con d sonora','[kin]: d muda']},
    {target:'Zimmer',meaning:'habitación',sound:'[tsima]: -er final suena «a» breve',explanation:'La terminación -er suena como una «a» breve; la r no vibra: Zimmer [tsima], Vater [fata].',others:['[tsimer] con r vibrante','[simer]: z = s']},
  ]}),
  itemLesson({id:'german-reading-10',title:'Sonidos y lectura · 10 · Los dos sonidos de CH',description:'CH suave (ich), CH fuerte (Bach), CHS y la terminación -ig.',kind:'sound',introText:'CH tiene dos sonidos. Tras a, o, u, au es la jota española (Bach). Tras e, i, ä, ö, ü, ei, eu y consonantes es un siseo suave, como un gato que bufa (ich). No es nunca la ch de «chico».',items:[
    {target:'ich',meaning:'yo',sound:'ch suave: siseo con la lengua en «i»',explanation:'Tras e, i, ä, ö, ü: CH suave. Pon la lengua como para «i» y sopla: ich, nicht, sprechen.',others:['ch de «chico»','jota española fuerte']},
    {target:'Bach',meaning:'arroyo',sound:'ch fuerte: como la jota española',explanation:'Tras a, o, u, au: CH como la jota española: Bach, acht, Buch, auch.',others:['ch de «chico»','k']},
    {target:'sechs',meaning:'seis',sound:'chs = ks',explanation:'CHS suena «ks»: sechs [zeks], wechseln.',others:['ch + s','sh']},
    {target:'zwanzig',meaning:'veinte',sound:'-ig final suena como «ich»',explanation:'La terminación -ig se pronuncia como «ich»: zwanzig, richtig. (En el sur de Alemania y Austria se oye también «ik».)',others:['-ig con g de «gato»','-ig con jota española']},
  ]}),
];
upsertLessons(reading,readingItems,'german-reading-test-08');
appendToTest(reading,'german-reading-test-08',readingItems,10);

// ── C2. Conjugación básica: sein, haben, presente regular, negación y V2 ──
const essentials=unit('essentials');
const essentialsItems=[
  itemLesson({id:'german-essentials-09',title:'Pronombres y verbos esenciales · 9 · sein: ser y estar',description:'Las formas de sein, el verbo más usado.',introText:'sein significa «ser» y «estar» a la vez. Es irregular: aprende sus formas de memoria. Ojo: Sie con mayúscula = usted / ustedes; sie con minúscula = ella o ellos.',items:[
    {target:'ich bin',meaning:'yo soy / yo estoy',points:['sein = ser y estar','Ich bin müde. = Estoy cansado.']},
    {target:'du bist',meaning:'tú eres / tú estás',points:['du: una persona de confianza']},
    {target:'er ist',meaning:'él es / él está',points:['sie ist = ella es / está','es ist = es / está (neutro): Es ist kalt.']},
    {target:'wir sind',meaning:'nosotros somos / estamos'},
    {target:'Sie sind',meaning:'usted es / ustedes son',points:['Sie (mayúscula) = usted o ustedes, formal','sie sind (minúscula) = ellos son']},
  ]}),
  itemLesson({id:'german-essentials-10',title:'Pronombres y verbos esenciales · 10 · haben y el presente regular',description:'Tener y la regla de las terminaciones -e, -st, -t, -en.',introText:'Quita -en al verbo (wohnen → wohn-) y añade: ich -e, du -st, er/sie/es -t, wir/sie/Sie -en. haben es casi regular: du hast, er hat.',items:[
    {target:'ich habe',meaning:'yo tengo',points:['haben = tener','Ich habe Hunger. = Tengo hambre.']},
    {target:'du hast',meaning:'tú tienes',points:['No «du habst»: du hast']},
    {target:'er hat',meaning:'él tiene',points:['sie hat = ella tiene']},
    {target:'ich wohne',meaning:'yo vivo',points:['wohnen → wohn- + e']},
    {target:'du wohnst',meaning:'tú vives',points:['wohn- + st']},
    {target:'er wohnt',meaning:'él vive',points:['wohn- + t; igual: sie wohnt, es wohnt']},
    {target:'wir wohnen',meaning:'nosotros vivimos',points:['wir, sie y Sie usan la forma -en']},
  ]}),
  itemLesson({id:'german-essentials-11',title:'Pronombres y verbos esenciales · 11 · Negar, preguntar y el verbo en 2.º lugar',description:'nicht y kein, preguntas y el orden de la oración.',introText:'Tres reglas de oro: el verbo conjugado va en 2.º lugar; en las preguntas de sí/no va en 1.er lugar; nicht niega verbos y adjetivos, kein niega sustantivos.',items:[
    {target:'Ich bin nicht müde.',meaning:'No estoy cansado.',points:['nicht niega verbos y adjetivos','Va detrás del verbo: Ich bin nicht müde.']},
    {target:'Ich habe kein Auto.',meaning:'No tengo coche.',points:['kein = ningún: niega un sustantivo','ein Auto → kein Auto']},
    {target:'Kommst du aus Mexiko?',meaning:'¿Eres de México?',points:['Pregunta de sí o no: el verbo va primero']},
    {target:'Woher kommst du?',meaning:'¿De dónde eres?',points:['Pregunta con W-: W- + verbo + sujeto']},
    {target:'Heute lerne ich Deutsch.',meaning:'Hoy estudio alemán.',points:['El verbo conjugado siempre ocupa el 2.º lugar','Si empiezas con Heute, el sujeto pasa detrás del verbo']},
  ]}),
];
essentialsItems[2].activities.push(
  {id:'german-essentials-11-production-blocks',type:'build_with_blocks',prompt:'Arma la frase: «Hoy estudio alemán»',target:'Hoy estudio alemán.',options:['ich','Heute','Deutsch.','lerne'],joiner:' ',answer:'Heute lerne ich Deutsch.',accepted_answers:['Heute lerne ich Deutsch.'],explanation:'Heute (1.º) · lerne (verbo, 2.º) · ich · Deutsch.',audio:'Heute lerne ich Deutsch.',slow_audio:'Heute lerne ich Deutsch.',image:null,writing_asset:null,tags:['production','blocks'],xp:15},
  {id:'german-essentials-11-production-typed',type:'typed_translation',prompt:'Escribe «tú vives» en alemán',target:'tú vives',instruction:'Usa el verbo wohnen.',answer:'du wohnst',accepted_answers:['du wohnst','wohnst'],allow_minor_typos:false,explanation:'wohnen → wohn- + st: du wohnst.',audio:'du wohnst',slow_audio:'du wohnst',image:null,writing_asset:null,tags:['production'],xp:20},
);
upsertLessons(essentials,essentialsItems,'german-essentials-test-11');
appendToTest(essentials,'german-essentials-test-11',essentialsItems,8);
// Fichas de regla en survival/essentials: «Cómo se forma: Bär» era un ejemplo,
// y «s larga» contradecía la tarjeta de ß de los fundamentos.
for(const id of ['survival','essentials']){
  const data=unit(id);
  replaceText(data,'Cómo se forma: ','Ejemplo: ');
  replaceText(data,'Cómo suena: s larga','Cómo suena: s sorda, como la s española');
  replaceText(data,'s larga','s sorda',{whole:true});
}

// ── C3. La unidad «time» repetía survival ────────────────────────────────
const time=unit('time');
const oldTime=Object.fromEntries(time.lessons.map(lesson=>[lesson.id,lesson]));
const timeLessons=[
  itemLesson({id:'german-time-01',title:'Números y tiempo · 1 · Del 21 al 100',description:'Las decenas y el orden invertido: «uno y veinte».',introText:'Del 21 al 99 el alemán dice primero la unidad: einundzwanzig = «uno y veinte». Las decenas terminan en -zig, salvo dreißig (30).',items:[
    {target:'einundzwanzig',meaning:'veintiuno',points:['ein + und + zwanzig = «uno y veinte»','Primero la unidad, luego la decena']},
    {target:'dreißig',meaning:'treinta',points:['Se escribe con ß: dreißig, no dreizig']},
    {target:'fünfundvierzig',meaning:'cuarenta y cinco',points:['fünf + und + vierzig']},
    {target:'siebzig',meaning:'setenta',points:['sieben pierde -en: siebzig']},
    {target:'neunundneunzig',meaning:'noventa y nueve'},
    {target:'hundert',meaning:'cien',points:['También ein hundert / einhundert']},
  ]}),
  itemLesson({id:'german-time-02',title:'Números y tiempo · 2 · La hora',description:'halb, Viertel, nach y vor: la hora coloquial.',introText:'En la conversación se usa el reloj de 12 horas con halb, Viertel, nach y vor. ¡Cuidado! halb vier = 3:30: «media hacia las cuatro».',items:[
    {target:'Um wie viel Uhr?',meaning:'¿A qué hora?',points:['um + hora = a las…']},
    {target:'Es ist halb vier.',meaning:'Son las tres y media.',points:['halb vier = media hora antes de las cuatro','¡No son las cuatro y media!'],others:['Son las cuatro y media.','Son las cuatro menos cuarto.']},
    {target:'Es ist Viertel nach drei.',meaning:'Son las tres y cuarto.',points:['nach = después de']},
    {target:'Es ist Viertel vor vier.',meaning:'Son las cuatro menos cuarto.',points:['vor = antes de']},
    {target:'Es ist zehn nach acht.',meaning:'Son las ocho y diez.'},
  ]}),
  itemLesson({id:'german-time-03',title:'Números y tiempo · 3 · Días y partes del día',description:'am Montag, am Wochenende, morgens y heute Abend.',introText:'Con los días y las partes del día se usa am (an + dem): am Montag, am Abend. Con -s indica costumbre: morgens = por las mañanas.',items:[
    {target:'am Montag',meaning:'el lunes',points:['am = an + dem','Días de la semana: am Montag, am Dienstag…']},
    {target:'am Wochenende',meaning:'el fin de semana'},
    {target:'morgens',meaning:'por las mañanas',points:['-s = cada vez: morgens, abends, montags']},
    {target:'heute Abend',meaning:'esta noche (al anochecer)',points:['der Abend = la tarde-noche']},
    {target:'am Nachmittag',meaning:'por la tarde'},
  ]}),
  itemLesson({id:'german-time-04',title:'Números y tiempo · 4 · Meses y fechas',description:'im Januar y las fechas con ordinales.',introText:'Con los meses se usa im (in + dem): im Januar. Las fechas usan números ordinales: der siebenundzwanzigste Oktober = el 27 de octubre (se escribe 27. Oktober).',items:[
    {target:'im Januar',meaning:'en enero',points:['im = in + dem']},
    {target:'im Juni',meaning:'en junio'},
    {target:'Welches Datum ist heute?',meaning:'¿Qué fecha es hoy?'},
    {target:'Heute ist der siebenundzwanzigste Oktober.',meaning:'Hoy es 27 de octubre.',points:['Ordinal: siebenundzwanzig + -ste','Se escribe: 27. Oktober']},
    {target:'am ersten Mai',meaning:'el primero de mayo',points:['am + ordinal: am ersten, am zweiten, am dritten']},
  ]}),
  itemLesson({id:'german-time-05',title:'Números y tiempo · 5 · Precios',description:'Preguntar y entender precios en euros.',introText:'Los precios se dicen así: 2,50 € = zwei Euro fünfzig. Euro no cambia en plural: fünf Euro.',items:[
    {target:'Was kostet das?',meaning:'¿Cuánto cuesta eso?',points:['También: Wie viel kostet das?']},
    {target:'Das kostet fünf Euro.',meaning:'Cuesta cinco euros.',points:['Euro no cambia en plural']},
    {target:'zwei Euro fünfzig',meaning:'dos euros con cincuenta',points:['Se escribe 2,50 €']},
    {target:'Das ist zu teuer.',meaning:'Es demasiado caro.'},
    {target:'Ich zahle bar.',meaning:'Pago en efectivo.',points:['Con tarjeta: mit Karte']},
  ]}),
];
time.title='Números, horas, fechas y precios';
time.description='Números hasta 100, la hora coloquial, días, fechas y precios.';
time.lessons=[
  ...timeLessons.slice(0,3),
  reviewLesson({id:'german-time-review-03',title:'Repaso breve 1',lessons:timeLessons.slice(0,3),count:8,meta:lessonMeta(oldTime['german-time-review-03'])}),
  ...timeLessons.slice(3),
  reviewLesson({id:'german-time-review-05',title:'Repaso breve 2',lessons:timeLessons.slice(3),count:8,meta:lessonMeta(oldTime['german-time-review-05']||oldTime['german-time-review-06'])}),
  reviewLesson({id:'german-time-test-16',title:'Prueba · Números, horas, fechas y precios',lessons:timeLessons,isTest:true,count:18,meta:lessonMeta(oldTime['german-time-test-16'])}),
];
Object.assign(course.units.find(entry=>entry.id==='time'),{title:time.title,description:time.description});

// ── C4. Ejemplos agramaticales o poco naturales en vocabulary ───────────
const vocabulary=unit('vocabulary');
replaceText(vocabulary,'Mein Kopf ist weh. — Me duele la cabeza.','Mein Kopf tut weh. — Me duele la cabeza.');
replaceText(vocabulary,'dolorido','que duele (en «tut weh»)');
replaceText(vocabulary,'Mein Alter ist 20 Jahre. — Mi edad es 20 años.','Ich bin zwanzig Jahre alt. — Tengo veinte años.');
for(const activity of allActivities(vocabulary).filter(activity=>activity.type==='teach_concept')){
  if(activity.target==='weh')activity.usage_note='weh casi siempre va con tun: «Mein Kopf tut weh» = me duele la cabeza. No se dice con sein (ist).';
  if(activity.target==='Alter')activity.usage_note='Para decir la edad no se usa Alter: «Ich bin zwanzig Jahre alt» (tengo veinte años).';
  if(activity.target==='sein'&&activity.meaning==='su, de él')activity.usage_note='Homónimo: sein también es el verbo «ser / estar» (ich bin, du bist…). Como posesivo, sein = su (de él); «su (de ella)» es ihr.';
  if(activity.target==='der Stadtbibliothek')activity.usage_note='Aparece tras «in» (in der Stadtbibliothek = en la biblioteca municipal). La forma de diccionario es die Stadtbibliothek; der es aquí el dativo femenino.';
}

// ── C5. Registro du/Sie incoherente en las traducciones ──────────────────
// ── C6. Traducciones erróneas o que no corresponden a la frase ───────────
for(const [from,to] of [
  ['¿Cuántos años tienes?','¿Cuántos años tiene usted?'],
  ['Lleva un paraguas.','Lleve un paraguas.'],
  ['Debes mostrar tu pasaporte.','Debe mostrar su pasaporte.'],
  ['Hablo un poco de este idioma.','Hablo un poco de alemán.'],
  ['Pienso reservar una habitación.','Quisiera reservar una habitación.'],
  ['Aquí se puede tomar fotos.','Aquí se pueden tomar fotos.'],
  ['No trabajo el domingo.','No trabajo los domingos.'],
  ['Hasta cierto punto, el resultado fue positivo.','En conjunto, el resultado fue positivo.'],
  ['Tenemos que decidir qué es prioritario.','¿Qué tiene prioridad?'],
  ['Revisaremos los avances al final de la semana.','El fin de semana revisamos los avances.'],
  ['Conviene prever los riesgos antes de empezar.','Revisemos los riesgos antes de empezar.'],
  ['Comparar ambas perspectivas ayuda a comprender el problema.','Ambos puntos de vista explican el problema.'],
  ['Antes de continuar, quisiera aclarar un detalle.','Primero quisiera aclarar algo.'],
])replaceEverywhere(from,to);
// Glosas que solo cambian para un término concreto (la palabra suelta
// «saber» o «deber» puede ser correcta en otras fichas).
function retargetMeaning(target,from,to,note=''){
  for(const id of order)for(const activity of allActivities(unit(id))){
    if(activity.target===target||activity.answer===target){
      if(activity.meaning===from)activity.meaning=to;
      if(activity.explanation===from)activity.explanation=to;
      if(activity.answer===from){activity.answer=to;activity.options=activity.options.map(option=>option===from?to:option);}
      if(typeof activity.explanation==='string')activity.explanation=activity.explanation.replace(`«${target}»: ${from}.`,`«${target}»: ${to}.`);
      if(typeof activity.prompt==='string'&&activity.answer===target)activity.prompt=activity.prompt.replace(`«${from}»`,`«${to}»`);
      if(activity.target===`${from}`&&activity.answer===target)activity.target=to;
      if(note&&activity.type==='teach_concept')activity.usage_note=note;
    }
  }
}
retargetMeaning('wissen, wie','saber','saber cómo (se hace algo)','Para «saber hacer algo» (una habilidad) se usa können: Ich kann kochen = sé cocinar. wissen, wie = saber cómo se hace algo concreto.');
retargetMeaning('müssen','deber','tener que','müssen = tener que (obligación). «No tener que» es nicht müssen; «no deber» es nicht dürfen.');

// ── Notas de gramática usada antes de enseñarse (A1) y artículos ─────────
const grammarNotes={
  'Ich esse kein Fleisch.':'kein niega sustantivos (= ningún): kein Fleisch. nicht niega verbos y adjetivos: Ich bin nicht müde.',
  'Ich stehe um sieben Uhr auf.':'aufstehen es un verbo separable: el prefijo auf va al final de la frase: Ich stehe … auf.',
  'Ich komme um acht Uhr an.':'ankommen es separable: Ich komme … an.',
  'Ich steige hier aus.':'aussteigen es separable: Ich steige … aus.',
  'Der Schlüssel liegt auf dem Tisch.':'auf + dem (dativo) dice dónde está algo: auf dem Tisch = sobre la mesa.',
  'Ich gehe zur Schule.':'zur = zu + der (die Schule); zum = zu + dem (der Park).',
  'Wie komme ich zum Park?':'zum = zu + dem (der Park).',
  'Kann ich mit Karte zahlen?':'Con können el segundo verbo va al final en infinitivo: Kann ich … zahlen?',
  'Muss ich umsteigen?':'Con müssen el infinitivo va al final: Muss ich umsteigen?',
  'Ich möchte etwas Reis.':'möchte = quisiera: la forma cortés de pedir algo.',
  'Ich möchte das.':'möchte = quisiera: la forma cortés de pedir algo.',
  'Es ist halb vier.':'halb vier = media hora antes de las cuatro (3:30). ¡No son las cuatro y media!',
  'Ich arbeite sonntags nicht.':'sonntags = los domingos (cada domingo). nicht va al final cuando niega toda la frase.',
  'Es gibt zwei Stühle.':'Es gibt = hay. Lo que sigue va en acusativo: Es gibt einen Tisch.',
  'Nehmen Sie einen Regenschirm mit.':'mitnehmen es separable: Nehmen Sie … mit. Sie = usted.',
  'Ich habe nach sechs Uhr Zeit.':'Zeit haben = tener tiempo, estar libre.',
};
const articles={Person:'die',Freund:'der',Familie:'die',Haus:'das',Schule:'die',Bahnhof:'der',Name:'der',Land:'das',Sprache:'die',Mutter:'die',Vater:'der',Schwester:'die',Bruder:'der',Kind:'das',Frau:'die',Mann:'der',Zimmer:'das',Küche:'die',Badezimmer:'das',Tisch:'der',Stuhl:'der',Tür:'die',Schlüssel:'der',Wasser:'das',Brot:'das',Reis:'der',Kaffee:'der',Tee:'der',Apfel:'der',Fleisch:'das',Gemüse:'das',Bank:'die',Geschäft:'das',Krankenhaus:'das',Park:'der',Preis:'der',Geld:'das',Größe:'die',Bargeld:'das',Karte:'die',Umkleidekabine:'die',Woche:'die',Monat:'der',Fahrkarte:'die',Zug:'der',Bus:'der','U-Bahn':'die',Bahnsteig:'der',Haltestelle:'die',Flughafen:'der',Ziel:'das',Kopf:'der',Bauch:'der',Hals:'der',Fieber:'das',Medizin:'die',Apotheke:'die',Arzt:'der',Hilfe:'die',Sonne:'die',Regen:'der',Schnee:'der',Wind:'der',Hitze:'die',Kälte:'die',Mantel:'der',Regenschirm:'der',Party:'die',Einladung:'die',Plan:'der',Uhrzeit:'die',Ort:'der',Wochenende:'das',Nachricht:'die',Morgen:'der',Nacht:'die'};
const genderName={der:'masculino',die:'femenino',das:'neutro'};
for(const id of ['survival',...order.filter(id=>/^a1-/.test(id))]){
  for(const activity of allActivities(unit(id)).filter(activity=>activity.type==='teach_concept')){
    if(grammarNotes[activity.target]&&!activity.usage_note)activity.usage_note=grammarNotes[activity.target];
    const article=articles[activity.target];
    if(article&&!activity.usage_note)activity.usage_note=`Apréndelo con su artículo: ${article} ${activity.target} (${genderName[article]}). En alemán cada sustantivo tiene género y se escribe con mayúscula.`;
  }
}

// ── C7. Producción: variantes correctas, diálogos con margen y frase del alumno ──
const health=unit('a1-2-health');
for(const activity of allActivities(health)){
  if(activity.id==='german-a1-2-health-production-speak'){
    Object.assign(activity,{prompt:'Di en voz alta: «Ich habe Kopfschmerzen.»',target:'Me duele la cabeza.',answer:'Ich habe Kopfschmerzen.',accepted_answers:['Ich habe Kopfschmerzen.'],explanation:'El modelo es «Ich habe Kopfschmerzen.». También puedes escribirlo.',audio:'Ich habe Kopfschmerzen.',slow_audio:'Ich habe Kopfschmerzen.'});
  }
  if(activity.turns){
    activity.turns.forEach((turn,index)=>{
      if(turn.role==='learner'&&turn.answer==='Nehmen Sie das zweimal täglich.'){
        Object.assign(turn,{prompt:'Di o escribe en alemán: «Me duele la cabeza.»',answer:'Ich habe Kopfschmerzen.',accepted_answers:['Ich habe Kopfschmerzen.'],audio:'Ich habe Kopfschmerzen.'});
        const model=activity.turns[index-1];
        if(model?.role==='model')model.translation='Quieres expresar: «Me duele la cabeza.».';
      }
    });
  }
}
const accepted={
  'Ich komme aus Mexiko.':['Ich bin aus Mexiko.'],
  'Der Schlüssel liegt auf dem Tisch.':['Der Schlüssel ist auf dem Tisch.'],
  'Ich stehe um sieben Uhr auf.':['Ich stehe um 7 Uhr auf.','Um sieben Uhr stehe ich auf.','Um 7 Uhr stehe ich auf.','Ich stehe um sieben auf.'],
  'Ich lerne am Nachmittag.':['Am Nachmittag lerne ich.','Ich lerne nachmittags.','Nachmittags lerne ich.'],
  'Ich trinke morgens Tee.':['Morgens trinke ich Tee.','Ich trinke am Morgen Tee.','Am Morgen trinke ich Tee.'],
  'Ich möchte etwas Reis.':['Ich möchte ein bisschen Reis.','Ich hätte gern etwas Reis.','Ich hätte gerne etwas Reis.'],
  'Der Bahnhof ist links.':['Der Bahnhof ist auf der linken Seite.','Der Bahnhof liegt links.'],
  'Ich gehe zur Schule.':['Ich gehe in die Schule.'],
  'Kann ich mit Karte zahlen?':['Kann ich mit Karte bezahlen?','Kann ich mit der Karte zahlen?','Kann ich mit der Karte bezahlen?','Kann ich mit Kreditkarte zahlen?'],
  'Ich komme um acht Uhr an.':['Ich komme um 8 Uhr an.','Um acht Uhr komme ich an.','Um 8 Uhr komme ich an.','Ich komme um acht an.'],
  'Der Termin ist nächste Woche.':['Der Termin ist in der nächsten Woche.'],
  'Ich bin allergisch gegen Penicillin.':['Ich bin gegen Penicillin allergisch.','Ich habe eine Penicillinallergie.','Ich habe eine Allergie gegen Penicillin.'],
  'Wo treffen wir uns?':['Wo sollen wir uns treffen?'],
  'Wann treffen wir uns?':['Wann sollen wir uns treffen?'],
  'Ich habe nach sechs Uhr Zeit.':['Ich habe nach 6 Uhr Zeit.','Nach sechs Uhr habe ich Zeit.','Ich habe ab sechs Uhr Zeit.','Ich habe nach sechs Zeit.'],
  'Ich konnte meine Schlüssel nicht finden.':['Ich habe meine Schlüssel nicht gefunden.','Ich konnte meinen Schlüssel nicht finden.'],
  'ist passiert':['passierte','geschah','ist geschehen'],
  'Ich möchte ein Zimmer reservieren.':['Ich würde gern ein Zimmer reservieren.','Ich möchte gern ein Zimmer reservieren.'],
  'Diese Möglichkeit ist besser für mich.':['Diese Möglichkeit ist für mich besser.','Diese Option ist besser für mich.','Diese Option ist für mich besser.'],
  'hoch':['groß'],
  'Hier darf man fotografieren.':['Hier kann man fotografieren.','Man darf hier fotografieren.','Hier darf man Fotos machen.'],
  'notwendig':['nötig','erforderlich'],
  'Können Sie mir eine Quittung geben?':['Könnten Sie mir eine Quittung geben?','Können Sie mir bitte eine Quittung geben?'],
  'kaputt':['defekt'],
  'Außerdem muss ich Essen kaufen.':['Außerdem muss ich Lebensmittel kaufen.','Außerdem muss ich etwas zu essen kaufen.'],
  'deshalb':['deswegen','darum','daher'],
  'Einmal habe ich den Zug verpasst.':['Ich habe einmal den Zug verpasst.'],
  'Ich muss mein Handy aufladen.':['Ich muss mein Handy laden.','Ich muss mein Telefon aufladen.'],
  'Man muss die Regeln beachten.':['Man muss die Regeln respektieren.','Man muss sich an die Regeln halten.'],
  'Das wird das Problem nicht lösen.':['Das löst das Problem nicht.'],
  'Zuerst möchte ich etwas klären.':['Zuerst würde ich gern etwas klären.'],
};
const FREE_TYPES=new Set(['typed_translation','speak_and_transcribe','open_question']);
const widen=target=>{
  const answer=String(target.answer||'');
  const extra=[...(accepted[answer]||[])];
  if(/^\p{Lu}[\p{L}-]*$/u.test(answer)&&articles[answer])extra.push(`${articles[answer]} ${answer}`);
  // Ortografía suiza: ß se escribe ss y es correcta.
  for(const value of [answer,...extra])if(value.includes('ß'))extra.push(value.replaceAll('ß','ss'));
  if(!extra.length)return;
  target.accepted_answers=[...new Set([...(target.accepted_answers||[answer]),...extra])];
};
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
for(const [name,file] of files){
  const after=JSON.stringify(file.data,null,2)+'\n';
  if(after!==file.before){fs.writeFileSync(file.url,after);changed.push(name);}
}
console.log(JSON.stringify({changed},null,1));
