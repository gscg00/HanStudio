// Correcciones de la auditoría del curso de inglés
// (docs/AUDITORIA_INGLES_2026-10-27.md). Idempotente: se puede volver a
// ejecutar sin duplicar lecciones ni respuestas.
import fs from 'node:fs';

const dir=new URL('../library/courses/English/',import.meta.url);
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

// Cambia la glosa española de un único ítem (sin tocar otros ítems que
// compartan esa glosa) y sustituye la glosa antigua cuando aparece como
// distractor en otras preguntas de la misma unidad.
function fixGloss(data,target,from,to,{distractor=to}={}){
  for(const activity of allActivities(data)){
    const own=activity.target===target||activity.answer===target||activity.audio===target;
    if(own){
      if(activity.type==='teach_concept'){
        if(activity.meaning===from)activity.meaning=to;
        if(activity.explanation===from)activity.explanation=to;
        if(activity.explanation?.startsWith(`${from}. Ejemplo:`))activity.explanation=to+activity.explanation.slice(from.length);
      }
      if(activity.type==='select_translation'&&activity.target===target&&activity.answer===from){
        activity.answer=to;activity.options=activity.options.map(option=>option===from?to:option);
        if(activity.explanation===from)activity.explanation=to;
        if(activity.explanation?.startsWith(`${from}. Ejemplo:`))activity.explanation=to+activity.explanation.slice(from.length);
      }
      for(const key of ['explanation','prompt'])if(typeof activity[key]==='string'){
        let text=activity[key].split(`«${target}»: ${from}.`).join(`«${target}»: ${to}.`);
        if(text.endsWith(`«${target}»: ${from}`))text=text.slice(0,-from.length)+to;
        activity[key]=text;
      }
    }else if(activity.type==='select_translation'&&activity.options?.includes(from)&&activity.answer!==from&&!activity.options.includes(distractor)){
      activity.options=activity.options.map(option=>option===from?distractor:option);
    }
  }
}

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
    activities.push(teach(`${id}-${n}-teach`,{...item,soundHint:kind==='sound'?item.sound:item.soundHint}));
    activities.push(choice(`${id}-${n}-meaning`,item,{prompt:kind==='sound'?`¿Cómo se pronuncia «${item.target}»?`:`¿Qué significa «${item.target}»?`,answer,others,index}));
    activities.push(listen(`${id}-${n}-listen`,item,{prompt:kind==='sound'?'Escucha y elige la palabra que oyes':'Escucha y elige la palabra o frase correcta',others:heard,index,explanation:`La forma escrita correcta es «${item.target}»: ${answer}.`}));
  });
  return {id,title,description,activities};
}
const reviewLesson=({id,title,lessons,isTest=false,count,extra={}})=>{
  // Mezcla estable: alterna lecciones para no repetir el orden de enseñanza.
  const picked=[];for(let round=0;picked.length<count&&round<10;round++)for(const lesson of lessons){const list=lesson.activities.filter(activity=>['select_translation','listening_choice'].includes(activity.type));const activity=list[(round*2+(isTest?1:0))%list.length];if(activity&&!picked.some(item=>item.id===activity.id)&&picked.length<count)picked.push(activity);}
  const activities=picked.map((activity,index)=>({...activity,id:`${id}-${index+1}-${activity.type==='listening_choice'?'listen':'meaning'}`,options:placed(activity.answer,activity.options.filter(option=>option!==activity.answer),index*2+1)}));
  return {id,title,description:isTest?'Comprueba que dominas la unidad antes de avanzar.':'Repasa lo anterior antes de seguir.',...(isTest?{isTest:true}:{isReview:true}),...extra,activities:[intro(`${id}-intro`,title,isTest?'Responde sin ayudas. Necesitas el porcentaje mínimo para continuar.':'Repasa sin mirar las respuestas: así se fortalece la memoria.'),...activities]};
};
const upsertLessons=(data,lessons,beforeId)=>{
  for(const lesson of lessons){
    const existing=data.lessons.findIndex(item=>item.id===lesson.id);
    if(existing>=0){data.lessons[existing]=lesson;continue;}
    const at=data.lessons.findIndex(item=>item.id===beforeId);
    data.lessons.splice(at<0?data.lessons.length:at,0,lesson);
  }
};
const appendToTest=(data,testId,lessons,count)=>{
  const test=data.lessons.find(lesson=>lesson.id===testId);
  const extra=reviewLesson({id:`${testId}-extra`,title:'',lessons,isTest:true,count}).activities.slice(1).map((activity,index)=>({...activity,id:`${testId}-new-${index+1}`}));
  test.activities=[...test.activities.filter(activity=>!activity.id.startsWith(`${testId}-new-`)),...extra];
};

// ── C1. «reading» solo repetía los nombres de las letras: ahora enseña los
// sonidos que un hispanohablante necesita para leer inglés ───────────────
const reading=unit('reading');
const shortVowels=itemLesson({id:'english-reading-07',title:'Sonidos y lectura · 7 · Vocales cortas',description:'La vocal dentro de la palabra no suena como el nombre de la letra.',kind:'sound',introText:'Las vocales inglesas no suenan como su nombre. En palabras cortas que terminan en consonante (cat, bed, sit, hot, cup) la vocal es corta. Escucha cada palabra y fíjate en la boca.',items:[
  {target:'cat',meaning:'gato',sound:'a abierta, entre «a» y «e»',explanation:'cat: a corta /æ/. Abre la boca como para «a» y di «e». También en bag, man, black.',others:['ei, como el nombre de A','a relajada, como en cup'],listenOthers:['cut','cot']},
  {target:'bed',meaning:'cama',sound:'e corta, como la «e» española',explanation:'bed: e corta. Es la vocal inglesa más parecida al español. También en red, ten, desk.',others:['i larga, como en see','a abierta, como en cat'],listenOthers:['bad','bid']},
  {target:'sit',meaning:'sentarse',sound:'i corta y relajada, casi «e»',explanation:'sit: i corta /ɪ/. Más breve y relajada que la «i» española, casi «e». También en six, ship, live.',others:['i larga, como en see','ai, como el nombre de I'],listenOthers:['seat','set']},
  {target:'hot',meaning:'caliente',sound:'o muy abierta, casi «a» (EE. UU.)',explanation:'hot: en inglés de EE. UU. suena casi «jat». También en stop, box, clock.',others:['ou, como el nombre de O','u larga, como en food'],listenOthers:['hat','hut']},
  {target:'cup',meaning:'taza',sound:'a corta y relajada, sin redondear los labios',explanation:'cup: vocal /ʌ/, una «a» corta y relajada. No es «u»: cup no suena «cup» como en español. También en bus, sun, much.',others:['u española, con labios redondos','iu, como el nombre de U'],listenOthers:['cap','cop']},
]});
const longVowels=itemLesson({id:'english-reading-08',title:'Sonidos y lectura · 8 · Vocales largas y pares mínimos',description:'ship/sheep, live/leave, food/foot y la e final muda.',kind:'sound',introText:'Alargar o tensar la vocal cambia la palabra: ship (barco) ≠ sheep (oveja), live (vivir) ≠ leave (irse). Y la e final muda (name, home, bike) hace que la vocal anterior diga su nombre.',items:[
  {target:'sheep',meaning:'oveja',sound:'i larga y tensa',points:['ship /ɪ/: i corta','sheep /iː/: i larga','ee y ea suelen sonar i larga: see, eat'],explanation:'sheep: i larga /iː/. Compara con ship (barco), de i corta.',others:['i corta y relajada, casi «e»','ai, como el nombre de I'],listenOthers:['ship','shop']},
  {target:'leave',meaning:'irse, salir',sound:'i larga: «liiv»',points:['leave (irse): i larga','live (vivir): i corta'],explanation:'leave: i larga. live (vivir) tiene i corta; si las confundes cambias el significado.',others:['i corta: «liv»','e corta: «lev»'],listenOthers:['live','love']},
  {target:'food',meaning:'comida',sound:'u larga',points:['food, moon, school: u larga','book, good, foot: u corta'],explanation:'food: oo suele ser u larga. Pero en book, good y foot es corta.',others:['u corta, como en book','iu, como el nombre de U'],listenOthers:['foot','fed']},
  {target:'name',meaning:'nombre',sound:'ei, como el nombre de A (la e final no suena)',points:['a + consonante + e: la a dice su nombre','name, cake, make'],explanation:'name: la e final es muda y hace que la a suene «ei».',others:['a abierta, como en cat','a relajada, como en cup'],listenOthers:['man','numb']},
  {target:'home',meaning:'casa, hogar',sound:'ou, como el nombre de O (la e final no suena)',points:['o + consonante + e: la o dice su nombre','home, phone, nose'],explanation:'home: la e final es muda y la o suena «ou».',others:['o abierta, casi «a», como en hot','u larga, como en food'],listenOthers:['hot','hum']},
  {target:'bike',meaning:'bicicleta',sound:'ai, como el nombre de I (la e final no suena)',points:['i + consonante + e: la i dice su nombre','bike, five, time'],explanation:'bike: la e final es muda y la i suena «ai».',others:['i corta, como en sit','i larga, como en see'],listenOthers:['bit','beak']},
]});
const schwa=itemLesson({id:'english-reading-09',title:'Sonidos y lectura · 9 · La vocal neutra y el acento',description:'Solo la sílaba fuerte tiene vocal clara; las demás se reducen.',kind:'sound',introText:'En inglés cada palabra tiene una sílaba fuerte. Las vocales de las sílabas débiles se reducen a un sonido neutro, la «schwa» [ə], parecido a una «e» muy débil. Si pronuncias todas las vocales claras, como en español, cuesta entenderte.',items:[
  {target:'about',meaning:'sobre, acerca de',sound:'[ə-BAUT]: la a inicial casi no se oye',explanation:'about: la a es átona y suena [ə]. El acento cae en -bout.',others:['[A-BAUT], con «a» clara','[a-BOUT], leído como se escribe']},
  {target:'banana',meaning:'plátano',sound:'[bə-NA-nə]: solo la sílaba del medio es clara',explanation:'banana: tres letras «a», pero solo la del medio suena clara; las otras dos son [ə].',others:['[ba-na-na], con tres «a» iguales','[ba-na-NA], con acento al final']},
  {target:'teacher',meaning:'profesor, maestra',sound:'[TII-chər]: -er final débil y sin r vibrante',explanation:'teacher: acento en tea-; la terminación -er se reduce a [ər].',others:['[ti-CHER], con acento al final','[te-a-cher], con «e» y «r» españolas']},
  {target:'photograph',meaning:'fotografía',sound:'[FOU-tə-graf]: acento en la primera sílaba',points:['photograph: FOU-tə-graf','photographer: fə-TO-grə-fər (el acento se mueve)'],explanation:'photograph lleva el acento al inicio; en photographer pasa a la segunda sílaba.',others:['[fou-TO-graf], acento en la segunda','[fou-to-GRAF], acento al final']},
  {target:'a cup of tea',meaning:'una taza de té',sound:'[ə-KA-pə-TII]: a y of se reducen y se unen',points:['a → [ə]','of → [əv] o [ə]','Las palabras pequeñas casi no se oyen'],explanation:'Las palabras gramaticales (a, of, to, the) suelen ser débiles y se pegan a las vecinas.',others:['[EI KAP OF TII], cada palabra fuerte','[a-cup-of-te-a], letra por letra']},
]});
const consonants=itemLesson({id:'english-reading-10',title:'Sonidos y lectura · 10 · th, s inicial, -ed, -s y letras mudas',description:'Las consonantes y terminaciones que más delatan a un hispanohablante.',kind:'sound',introText:'Cinco trampas para un hispanohablante: la th, la s inicial sin «e», la terminación -ed, la terminación -s/-es y las letras mudas.',items:[
  {target:'think',meaning:'pensar',sound:'th sorda: lengua entre los dientes y solo aire',explanation:'think: la punta de la lengua asoma entre los dientes y sale aire, sin voz. No es «t» ni «s».',others:['t española: «tink»','s española: «sink»'],listenOthers:['sink','tank']},
  {target:'this',meaning:'esto, este',sound:'th sonora: lengua entre los dientes y con voz',explanation:'this: misma posición que en think, pero con vibración (voz), como una «d» muy suave.',others:['d española fuerte: «dis»','th sorda, solo aire'],listenOthers:['miss','dish']},
  {target:'school',meaning:'escuela',sound:'[skuul]: empieza directamente con s, sin «e»',explanation:'school, Spain, student: no añadas una «e» delante. Di «sss-kuul».',others:['[es-kuul], con «e» delante','[chuul]'],listenOthers:['cool','spool']},
  {target:'worked',meaning:'trabajó, trabajé',sound:'[workt]: -ed suena «t», sin sílaba extra',points:['Tras sonido sordo (k, p, s, sh, ch): -ed = t → worked','Tras sonido sonoro: -ed = d → played','Tras t o d: -ed = id → wanted'],explanation:'worked: una sola sílaba. La -ed solo añade sílaba después de t o d.',others:['[wor-ked], con sílaba extra','[workd], con «d» final'],listenOthers:['work','walked']},
  {target:'wanted',meaning:'quiso, quería',sound:'[WON-tid]: tras t o d, -ed suena «id»',explanation:'wanted, needed: aquí sí hay sílaba extra, porque el verbo termina en t o d.',others:['[wont], sin sílaba extra','[won-ted], con «e» española'],listenOthers:['want','wanting']},
  {target:'buses',meaning:'autobuses',sound:'[BA-siz]: tras s, sh, ch o x, -es suena «iz»',points:['cats: -s suena s','dogs: -s suena z','buses, watches: -es suena iz (sílaba extra)'],explanation:'La -s del plural y de he works suena s, z o iz según el sonido anterior.',others:['[bu-ses], como en español','[bas], sin sílaba extra'],listenOthers:['bus','bosses']},
  {target:'know',meaning:'saber, conocer',sound:'[nou]: la k inicial no suena',points:['know [nou]: k muda','write [rait]: w muda','hour [auər]: h muda'],explanation:'Muchas palabras conservan letras que ya no se pronuncian: know, write, hour, Wednesday [WENZ-dei].',others:['[knou], con k','[ka-nou]'],listenOthers:['now','snow']},
]});
upsertLessons(reading,[shortVowels,longVowels,schwa,consonants],'english-reading-test-08');
appendToTest(reading,'english-reading-test-08',[shortVowels,longVowels,schwa,consonants],8);
reading.description='Nombres de las letras, vocales cortas y largas, vocal neutra, th, -ed, -s y letras mudas.';
Object.assign(course.units.find(entry=>entry.id==='reading'),{description:reading.description});

// ── C2. Conjugar: el verbo be y el presente simple (-s, do/does) ─────────
const essentials=unit('essentials');
const be=itemLesson({id:'english-essentials-09',title:'Pronombres y verbos esenciales · 9 · El verbo be: am / is / are',description:'Be es «ser» y también «estar». Cambia según la persona.',introText:'Be significa ser y estar a la vez. Se conjuga así: I am · you/we/they are · he/she/it is. En inglés el sujeto nunca se omite: «Is tired» ✗ → «He is tired».',items:[
  {target:'I am a student.',meaning:'Soy estudiante.',explanation:'I + am. Contracción: I\'m a student.',points:['I → am','I am = I\'m'],usage:'Delante de una profesión se pone a/an: I am a student, I am an engineer.'},
  {target:'You are my friend.',meaning:'Eres mi amigo.',explanation:'you + are. You sirve para tú, usted y ustedes.',points:['you, we, they → are','you are = you\'re']},
  {target:'She is a doctor.',meaning:'Ella es médica.',explanation:'he / she / it + is. Contracción: she\'s.',points:['he, she, it → is','she is = she\'s']},
  {target:'We are at home.',meaning:'Estamos en casa.',explanation:'Be también es «estar»: we are at home, I am tired.',points:['be = ser y estar']},
  {target:'He is not here.',meaning:'Él no está aquí.',explanation:'Negación: be + not. is not = isn\'t, are not = aren\'t (pero I am not = I\'m not).',points:['be + not','is not = isn\'t']},
  {target:'Are you tired?',meaning:'¿Estás cansado?',explanation:'Pregunta: be pasa delante del sujeto. You are tired → Are you tired?',points:['You are → Are you?','He is → Is he?']},
]});
be.activities.push(
  {id:'english-essentials-09-production-blocks',type:'build_with_blocks',prompt:'Arma la frase: «Ella no está aquí.»',target:'Ella no está aquí.',options:['here.','not','She','is'],joiner:' ',answer:'She is not here.',accepted_answers:['She is not here.','She isn\'t here.','She\'s not here.'],explanation:'She (ella) · is (está) · not (no) · here (aquí). En inglés not va después de be.',audio:'She is not here.',slow_audio:'She is not here.',image:null,writing_asset:null,tags:['production','blocks'],xp:15},
  {id:'english-essentials-09-production-typed',type:'typed_translation',prompt:'Escribe la forma de be que va con «they»',target:'they ___',instruction:'Escribe solo la forma del verbo.',answer:'are',accepted_answers:['are'],allow_minor_typos:false,explanation:'they are (ellos son / están).',audio:'they are',slow_audio:'they are',image:null,writing_asset:null,tags:['production'],xp:20},
);
const present=itemLesson({id:'english-essentials-10',title:'Pronombres y verbos esenciales · 10 · Presente simple: -s, do y does',description:'La -s de he/she/it, la negación con don\'t/doesn\'t y las preguntas con do/does.',introText:'El presente simple casi no cambia: I work, you work, we work, they work. Solo he/she/it añade -s: she works. Para negar y preguntar se usa do (does con he/she/it), y entonces el verbo vuelve a su forma base.',items:[
  {target:'I work here.',meaning:'Trabajo aquí.',explanation:'I, you, we, they: el verbo no cambia.',points:['I work · you work · we work · they work']},
  {target:'She works here.',meaning:'Ella trabaja aquí.',explanation:'He, she, it: verbo + s. work → works, go → goes, have → has.',points:['he/she/it → verbo + s','go → goes, watch → watches','have → has'],usage:'La -s suena s, z o iz: works [s], lives [z], watches [iz].'},
  {target:'I don\'t drink coffee.',meaning:'No tomo café.',explanation:'Negación: don\'t (do not) + verbo.',points:['don\'t = do not','I / you / we / they don\'t + verbo']},
  {target:'He doesn\'t drink coffee.',meaning:'Él no toma café.',explanation:'Con he/she/it: doesn\'t + verbo SIN -s. «He doesn\'t drinks» ✗.',points:['doesn\'t = does not','La -s pasa a does: drinks → doesn\'t drink']},
  {target:'Do you speak English?',meaning:'¿Hablas inglés?',explanation:'Pregunta: Do + sujeto + verbo. Respuestas cortas: Yes, I do. / No, I don\'t.',points:['Do + you/we/they + verbo','Yes, I do. / No, I don\'t.']},
  {target:'Does she live here?',meaning:'¿Ella vive aquí?',explanation:'Con he/she/it: Does + sujeto + verbo sin -s. Respuestas: Yes, she does. / No, she doesn\'t.',points:['Does + he/she/it + verbo base','lives → Does she live?']},
]});
present.activities.push(
  {id:'english-essentials-10-production-blocks',type:'build_with_blocks',prompt:'Arma la frase: «Él no toma café.»',target:'Él no toma café.',options:['coffee.','He','drink','doesn\'t'],joiner:' ',answer:'He doesn\'t drink coffee.',accepted_answers:['He doesn\'t drink coffee.','He does not drink coffee.'],explanation:'He · doesn\'t (no) · drink (verbo sin -s) · coffee.',audio:'He doesn\'t drink coffee.',slow_audio:'He doesn\'t drink coffee.',image:null,writing_asset:null,tags:['production','blocks'],xp:15},
  {id:'english-essentials-10-production-typed',type:'typed_translation',prompt:'Escribe la forma de «work» que va con «she»',target:'she ___ (work)',instruction:'Escribe solo el verbo conjugado.',answer:'works',accepted_answers:['works'],allow_minor_typos:false,explanation:'she works: he/she/it añade -s.',audio:'She works here.',slow_audio:'She works here.',image:null,writing_asset:null,tags:['production'],xp:20},
);
upsertLessons(essentials,[be,present],'english-essentials-test-11');
appendToTest(essentials,'english-essentials-test-11',[be,present],6);

// ── C6. Fichas de regla con explicaciones genéricas que valían para varias
// tarjetas (también correctas) o que no explicaban la regla ─────────────────
const ruleTexts=[
  ['Dos letras forman un solo sonido.','sh suena como cuando pides silencio: ship, she, fish.'],
  ['Se pronuncia con una salida breve de aire.','ch suena como la ch española: chair, cheese, lunch.'],
  ['Suele representar una vocal larga.','ee suena como una i larga: see, sheep, three.'],
  ['Puede cambiar en palabras como book.','oo suele ser una u larga (food, moon), pero es corta en book y good.'],
  ['No es una t ni una s española.','th: la punta de la lengua asoma entre los dientes (think, this); no es t ni s.'],
  ['La posición de la boca cambia el significado.','V con los dientes sobre el labio inferior; B con los dos labios: very ≠ berry.'],
  ['Las contracciones son normales al hablar.','don\'t = do not: niega cualquier verbo (I don\'t know).'],
  ['El verbo be cambia según la persona.','I\'m = I am: el apóstrofo sustituye la a de am (I\'m ready).'],
  ['La duración y posición distinguen palabras.','La vocal corta de ship y la vocal larga de sheep cambian la palabra; no basta con alargar cualquier vocal.'],
];
for(const id of ['survival','essentials'])for(const [from,to] of ruleTexts)replaceText(unit(id),from,to,{whole:true});

// ── C3. La unidad «time» repetía survival: ahora enseña decenas, la hora,
// los meses, las fechas y los precios ────────────────────────────────────
const time=unit('time');
const timeLessons=[
  itemLesson({id:'english-time-01',title:'Números, horas, fechas y precios · 1 · Decenas',description:'Del treinta al cien.',introText:'Las decenas terminan en -ty: thirty, forty, fifty. Cuidado: thirteen (13) lleva el acento al final [thir-TIIN] y thirty (30) al principio [THIR-ti].',items:[
    {target:'thirty',meaning:'treinta',points:['thirteen: thir-TEEN (13)','thirty: THIR-ty (30)']},
    {target:'forty',meaning:'cuarenta',points:['four → forty: se escribe sin u']},
    {target:'fifty',meaning:'cincuenta',points:['five → fifty']},
    {target:'ninety',meaning:'noventa'},
    {target:'one hundred',meaning:'cien',points:['También «a hundred»']}]}),
  itemLesson({id:'english-time-02',title:'Números, horas, fechas y precios · 2 · Números compuestos',description:'Decena + guion + unidad.',introText:'Los números compuestos se escriben con guion: twenty-one, thirty-five. Se dicen como en español: decena y unidad, pero sin «y».',items:[
    {target:'twenty-one',meaning:'veintiuno'},
    {target:'thirty-five',meaning:'treinta y cinco'},
    {target:'sixty',meaning:'sesenta'},
    {target:'seventy',meaning:'setenta'},
    {target:'eighty',meaning:'ochenta',points:['eight → eighty: una sola t']}]}),
  itemLesson({id:'english-time-03',title:'Números, horas, fechas y precios · 3 · La hora',description:'past, to, half y quarter.',introText:'Para la hora se usa past (y) y to (para / menos): half past six = seis y media; quarter to five = un cuarto para las cinco. También se puede leer la hora en cifras: seven thirty (7:30).',items:[
    {target:'It\'s half past six.',meaning:'Son las seis y media.',points:['half = media','past = y (después de la hora)']},
    {target:'It\'s quarter past nine.',meaning:'Son las nueve y cuarto.',points:['quarter = cuarto']},
    {target:'It\'s quarter to five.',meaning:'Es un cuarto para las cinco.',points:['to = para / menos','4:45']},
    {target:'It\'s seven thirty.',meaning:'Son las siete treinta (7:30).',points:['Hora en cifras: seven thirty']},
    {target:'What time does it start?',meaning:'¿A qué hora empieza?',points:['What time...? = ¿A qué hora...?']}]}),
  itemLesson({id:'english-time-04',title:'Números, horas, fechas y precios · 4 · Meses',description:'Los meses se escriben siempre con mayúscula.',introText:'En inglés los meses (y los días) se escriben con mayúscula: January, October. Muchos se parecen al español, pero se pronuncian distinto.',items:[
    {target:'January',meaning:'enero',points:['Se pronuncia [YA-niu-e-ri]']},
    {target:'March',meaning:'marzo'},
    {target:'July',meaning:'julio',points:['Acento al final: [yu-LAI]']},
    {target:'October',meaning:'octubre'},
    {target:'December',meaning:'diciembre'}]}),
  itemLesson({id:'english-time-05',title:'Números, horas, fechas y precios · 5 · Fechas',description:'Ordinales para decir el día del mes.',introText:'Para las fechas se usan ordinales: first (1st), second (2nd), third (3rd) y luego -th: twenty-seventh (27th). October 27th se lee «October twenty-seventh».',items:[
    {target:'first',meaning:'primero (1st)'},
    {target:'second',meaning:'segundo (2nd)'},
    {target:'What\'s the date today?',meaning:'¿Qué fecha es hoy?'},
    {target:'It\'s October 27th.',meaning:'Es 27 de octubre.',points:['Se lee: October twenty-seventh','En EE. UU. el mes va primero: 10/27']},
    {target:'My birthday is in July.',meaning:'Mi cumpleaños es en julio.',points:['in + mes','on + fecha: on July 4th']}]}),
  itemLesson({id:'english-time-06',title:'Números, horas, fechas y precios · 6 · Precios',description:'Dólares, centavos y cómo se leen.',introText:'Los precios se leen de forma breve: $5.99 = five ninety-nine. El punto separa los centavos (en México también se usa punto).',items:[
    {target:'How much does it cost?',meaning:'¿Cuánto cuesta?',points:['También: How much is it?']},
    {target:'It\'s five dollars.',meaning:'Son cinco dólares.'},
    {target:'five ninety-nine',meaning:'5.99 (cinco noventa y nueve)',points:['$5.99 se lee five ninety-nine']},
    {target:'That\'s too expensive.',meaning:'Eso es demasiado caro.'},
    {target:'Do you have change?',meaning:'¿Tienes cambio?'}]}),
];
const oldTest=time.lessons.find(lesson=>lesson.id==='english-time-test-16')||{};
time.title='Números, horas, fechas y precios';
time.description='Decenas hasta el cien, la hora, los meses, las fechas y los precios.';
time.reward={...(time.reward||{}),badge:time.title};
time.lessons=[...timeLessons.slice(0,3),reviewLesson({id:'english-time-review-03',title:'Repaso breve 1',lessons:timeLessons.slice(0,3),count:8}),...timeLessons.slice(3),reviewLesson({id:'english-time-review-06',title:'Repaso breve 2',lessons:timeLessons.slice(3),count:8}),reviewLesson({id:'english-time-test-16',title:'Prueba · Números, horas, fechas y precios',lessons:timeLessons,isTest:true,count:18,extra:{isUnitFinal:oldTest.isUnitFinal??true,xpReward:oldTest.xpReward??30}})];
Object.assign(course.units.find(entry=>entry.id==='time'),{title:time.title,description:time.description});

// ── C5 / I1. Glosas españolas que no corresponden al inglés ──────────────
const spanishFixes=[
  // B1-2: la traducción decía otra cosa que la frase inglesa.
  ['Si salimos ahora, llegaremos antes de que oscurezca.','Si salimos ahora, llegaremos temprano.'],
  ['Si tuviera más tiempo, aprendería otro idioma.','Si tuviera tiempo, aprendería otro idioma.'],
  ['Aunque cambie el plan, encontraremos una solución.','Aunque cambien los planes, encontraremos la manera.'],
  ['A menos que llueva, la reunión será afuera.','A menos que llueva, nos veremos afuera.'],
  ['En caso de que necesites ayuda, llámame.','Llámame si necesitas ayuda.'],
  ['Cuanto más practico, más natural me resulta.','Cuanto más practico, más fácil me resulta.'],
  ['Estoy de acuerdo en parte, pero tengo una duda.','Estoy de acuerdo en parte, pero tengo dudas.'],
  ['Entiendo tu punto, aunque lo veo de otra manera.','Entiendo tu punto, pero no estoy de acuerdo.'],
  ['La idea parece buena; sin embargo, puede ser costosa.','Buena idea, pero quizá demasiado costosa.'],
  ['Hasta cierto punto, el resultado fue positivo.','En general, el resultado fue positivo.'],
  ['No necesariamente significa que sea imposible.','Eso no lo hace imposible.'],
  ['Probablemente funcione, siempre que todos participen.','Debería funcionar si todos participan.'],
  ['Hay una diferencia sutil entre estas dos expresiones.','Estas expresiones se diferencian un poco.'],
  ['¿Qué tan segura es esa información?','¿Es confiable esa información?'],
  ['Propongo que probemos esta opción primero.','Probemos primero esta opción.'],
  ['Aceptaría si cambiamos la fecha.','Aceptaría si cambiáramos la fecha.'],
  ['Esa solución no me convence del todo.','Esa solución no me convence.'],
  ['Entonces, ¿quedamos de acuerdo en este plan?','Entonces, ¿estamos de acuerdo?'],
  ['Tenemos que decidir qué es prioritario.','¿Qué va primero?'],
  ['Yo me encargo del informe y tú de la presentación.','Yo hago el informe; tú lo presentas.'],
  ['Conviene prever los riesgos antes de empezar.','Evaluemos primero los riesgos.'],
  ['Revisaremos los avances al final de la semana.','Revisaremos los avances este fin de semana.'],
  ['¿Qué cambiaríamos la próxima vez?','¿Qué deberíamos cambiar la próxima vez?'],
  ['Conviene considerar también el contexto histórico.','Deberíamos considerar su historia.'],
  ['La experiencia personal influye en nuestra opinión.','La experiencia moldea nuestras opiniones.'],
  ['Comparar ambas perspectivas ayuda a comprender el problema.','Comparar ambos puntos de vista aclara el problema.'],
  ['¿Qué argumentos respaldan esa conclusión?','¿Qué pruebas respaldan eso?'],
  ['¿Qué quieres decir exactamente con eso?','¿Qué quieres decir exactamente?'],
  ['Antes de continuar, quisiera aclarar un detalle.','Primero, quiero aclarar un detalle.'],
  ['Aquí se puede tomar fotos.','Aquí se pueden tomar fotos.'],
  // A1
  ['Hablo un poco de este idioma.','Hablo un poco de inglés.'],
  ['Where is there a pharmacy?','Is there a pharmacy nearby?'],
  ['¿Dónde hay una farmacia?','¿Hay una farmacia cerca?'],
  // B1: «Let us» es correcto pero rígido; lo natural es «Let's».
  ['Let us divide the work.','Let\'s divide the work.'],
  ['Let us try this option first.','Let\'s try this option first.'],
  ['Let us review the terms before deciding.','Let\'s review the terms before deciding.'],
  ['Let us set a clear, realistic goal.','Let\'s set a clear, realistic goal.'],
  ['Let us assess the risks first.','Let\'s assess the risks first.'],
];
for(const id of order.filter(id=>/^(a1|a2|b1)-/.test(id))){const data=unit(id);for(const [from,to] of spanishFixes)replaceText(data,from,to);}
// Los bloques de «Let us …» deben poder construir «Let's …».
for(const id of order.filter(id=>/^(a2|b1)-/.test(id)))for(const activity of allActivities(unit(id)).filter(activity=>activity.type==='build_with_blocks'&&activity.answer.startsWith('Let\'s ')&&activity.options.includes('us'))){
  activity.options=activity.options.filter(option=>option!=='us').map(option=>option==='Let'?'Let\'s':option);
}
fixGloss(unit('a1-1-identity'),'good evening','buenas noches','buenas tardes / buenas noches (al llegar)');
for(const activity of allActivities(unit('a1-1-identity')).filter(activity=>activity.type==='teach_concept'&&activity.target==='good evening'))activity.usage_note='Saludo al llegar por la tarde o la noche. Para despedirse por la noche se dice «good night».';
fixGloss(unit('a1-2-time'),'I am running late.','Llego tarde.','Voy tarde.');

// I2. Respuestas cortas glosadas como «Sí.»/«No.»: se distinguían solo por eliminación.
const readingBridge=unit('reading-bridge'),storyBridge=unit('story-bridge');
fixGloss(readingBridge,'Yes, I am.','Sí.','Sí, lo soy.');
fixGloss(readingBridge,'No, I don\'t.','No.','No, no lo hablo.');
fixGloss(readingBridge,'No, he isn\'t.','No.','No, no lo es.');
fixGloss(storyBridge,'Yes, I do.','Sí.','Sí, tengo uno.');
fixGloss(storyBridge,'Yes, you can.','Sí.','Sí, puedes.',{distractor:'Sí, tengo uno.'});
fixGloss(storyBridge,'Yes, there are.','Sí.','Sí, sí hay.',{distractor:'Sí, puedes.'});
const shortAnswerNote='Respuesta corta: se repite el auxiliar de la pregunta (Are you…? → Yes, I am. Do you…? → Yes, I do.). Responder solo «Yes.» suena cortante.';
for(const data of [readingBridge,storyBridge])for(const activity of allActivities(data).filter(activity=>activity.type==='teach_concept'&&['Yes, I am.','No, I don\'t.','No, he isn\'t.','Yes, I do.','Yes, you can.','Yes, there are.'].includes(activity.target)))activity.context_note=shortAnswerNote;

// I3. Glosas incompletas o engañosas en vocabulary.
const vocabulary=unit('vocabulary');
fixGloss(vocabulary,'I am / I\'m','yo soy','yo soy / yo estoy');
fixGloss(vocabulary,'should','deberías','debería / deberías (consejo)');
fixGloss(vocabulary,'evening','noche','tarde-noche (al anochecer)');
fixGloss(vocabulary,'it','eso / ello','ello (cosa o animal; casi nunca se traduce)');
fixGloss(vocabulary,'time','hora','tiempo / hora');
replaceText(vocabulary,'Envio un correo','Envío un correo');

// ── C4. Producción: aceptar contracciones, cifras y variantes naturales;
// los diálogos de 3 turnos dejan un error de margen ───────────────────────
const contractions=[['I am','I\'m'],['What is','What\'s'],['do not','don\'t'],['does not','doesn\'t'],['could not','couldn\'t'],['will not','won\'t'],['I will','I\'ll'],['It is','It\'s'],['it is','it\'s'],['That is','That\'s'],['that is','that\'s'],['Let us','Let\'s'],['is not','isn\'t'],['I would have','I\'d have'],['you had','you\'d']];
const swap=(text,pairs)=>pairs.reduce((value,[from,to])=>value.replace(new RegExp(`\\b${from.replace(/'/g,'\'')}\\b`,'g'),to),text);
const contractionVariants=answer=>{
  const expanded=swap(answer.replace(/’/g,'\''),contractions.map(([full,short])=>[short,full]));
  const contracted=swap(expanded,contractions);
  return [expanded,contracted];
};
const accepted={
  'Who is that?':['Who is it?','Who is she?','Who is he?'],
  'I get up at seven.':['I get up at 7.','I get up at 7:00.','I wake up at seven.','I wake up at 7.'],
  'I study in the afternoon.':['I study in the afternoons.'],
  'I drink tea in the morning.':['I drink tea in the mornings.'],
  'I want some rice.':['I want a little rice.','Some rice, please.'],
  'The station is on the left.':['It is on the left.'],
  'Can I pay by card?':['Can I pay with a card?','Can I pay with card?','Can I pay by credit card?'],
  'I arrive at eight.':['I arrive at 8.','I arrive at 8:00.'],
  'Do I need to change?':['Do I have to change?','Do I need to change trains?','Do I have to change trains?','Do I need to transfer?'],
  'I am allergic to penicillin.':['I have a penicillin allergy.'],
  'Where shall we meet?':['Where should we meet?','Where do we meet?','Where are we meeting?'],
  'I am free after six.':['I am free after 6.','I am free after six o\'clock.'],
  'I plan to book a room.':['I am planning to book a room.','I intend to book a room.','I plan to reserve a room.'],
  'to book':['book','to reserve','reserve'],
  'happened':['occurred'],
  'You can take photos here.':['You can take pictures here.','Photos are allowed here.','We can take photos here.'],
  'Could you give me a receipt?':['Can you give me a receipt?','Could I have a receipt?','Can I have a receipt?'],
  'Besides, I need to buy food.':['Also, I need to buy food.','In addition, I need to buy food.'],
  'that is why':['so','therefore'],
  'I missed the train once.':['Once I missed the train.'],
  'I find this lesson difficult.':['This lesson is difficult for me.','I find this lesson hard.'],
  'I need to charge my phone.':['I need to charge the phone.'],
  'You have to respect the rules.':['You must respect the rules.','We have to respect the rules.'],
  'Meanwhile, my sister called the police.':['In the meantime, my sister called the police.'],
  'As a result, the project was delayed.':['Consequently, the project was delayed.','Therefore, the project was delayed.'],
  'The ending surprised me a lot.':['The ending really surprised me.'],
  'You should tell him how you feel.':['You should tell her how you feel.'],
  'Thank you for letting me know in advance.':['Thanks for letting me know in advance.'],
  'Call me if you need help.':['If you need help, call me.','In case you need help, call me.'],
  'I recommend it because the characters feel real.':['I recommend it because the characters seem real.'],
  'What other option do we have?':['What other options do we have?','What alternative do we have?'],
  'Let\'s assess the risks first.':['We should assess the risks first.'],
  'I want to take part as a volunteer.':['I want to participate as a volunteer.','I want to volunteer.'],
  'Then I realized my mistake.':['Then I realised my mistake.'],
  'First, I want to clarify one detail.':['First, I would like to clarify one detail.','Before we continue, I would like to clarify a detail.'],
  'Sometimes it is difficult to forgive.':['Sometimes it is hard to forgive.'],
  'I\'d have agreed if you\'d explained it.':['I would have agreed if you had explained it.'],
};
const FREE_TYPES=new Set(['typed_translation','speak_and_transcribe','open_question']);
const widen=target=>{
  const base=target.accepted_answers?.length?target.accepted_answers:[target.answer];
  const extra=[...(accepted[target.answer]||[]),...base.flatMap(contractionVariants)];
  target.accepted_answers=[...new Set([...base,...extra.flatMap(value=>[value,...contractionVariants(value)])])];
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

// ── I6. Diálogos A1: el «GUÍA» decía «Situación N»; ahora habla en inglés ──
const dialogueLines={
  'a1-1-identity':[['ANA','Hello! Nice to meet you.','¡Hola! Mucho gusto.'],['ANA','My name is Ana. Where are you from?','Me llamo Ana. ¿De dónde eres?']],
  'a1-1-people':[['TOM','Look! There is a woman at the door.','¡Mira! Hay una mujer en la puerta.'],['TOM','This is my sister, Ana.','Esta es mi hermana Ana.']],
  'a1-1-home':[['MAMÁ','Where is the key?','¿Dónde está la llave?'],['MAMÁ','Is your room big?','¿Tu habitación es grande?']],
  'a1-1-routine':[['ANA','When do you get up?','¿A qué hora te levantas?'],['ANA','When do you study?','¿Cuándo estudias?']],
  'a1-1-food':[['MESERO','What do you drink in the morning?','¿Qué tomas por la mañana?'],['MESERO','What do you want for lunch?','¿Qué quieres de comer?']],
  'a1-1-places':[['SEÑORA','Excuse me, where is the station?','Disculpe, ¿dónde está la estación?'],['SEÑORA','Where do you go every day?','¿Adónde vas todos los días?'],['SEÑORA','Is the bank on the left or on the right?','¿El banco está a la izquierda o a la derecha?']],
  'a1-2-shopping':[['CAJERA','That is twenty dollars.','Son veinte dólares.'],['CAJERA','Sorry, no cards today.','Lo siento, hoy no aceptamos tarjetas.']],
  'a1-2-time':[['TOM','What time do you arrive?','¿A qué hora llegas?'],['TOM','When is the appointment?','¿Cuándo es la cita?']],
  'a1-2-transport':[['EMPLEADO','This train goes to the airport.','Este tren va al aeropuerto.'],['EMPLEADO','Why are you waiting?','¿Por qué está esperando?']],
  'a1-2-health':[['MÉDICA','Do you have any allergies?','¿Tiene alguna alergia?'],['FARMACÉUTICO','What did the doctor say?','¿Qué le dijo la médica?']],
  'a1-2-weather':[['ANA','It is very cold today.','Hoy hace mucho frío.'],['ANA','It was sunny this morning. Now it is raining!','Esta mañana hacía sol. ¡Ahora llueve!']],
  'a1-2-social':[['TOM','Let\'s meet on Saturday.','Veámonos el sábado.'],['TOM','What time are you free?','¿A qué hora estás libre?'],['TOM','Is the party this week or at the weekend?','¿La fiesta es esta semana o el fin de semana?']],
};
for(const [id,lines] of Object.entries(dialogueLines)){
  for(const activity of allActivities(unit(id)).filter(activity=>['guided_dialogue','stage_scenario'].includes(activity.type))){
    let index=0;
    activity.turns.forEach((turn,position)=>{
      if(turn.role!=='model')return;
      const line=lines[index++];if(!line)return;
      // La traducción conserva lo que el alumno debe expresar en el turno siguiente.
      const next=activity.turns.slice(position+1).find(item=>item.role==='learner');
      const meaning=next?.prompt?.match(/«(.+)»/u)?.[1];
      Object.assign(turn,{speaker:line[0],text:line[1],translation:meaning?`${line[2]} — Tú quieres decir: «${meaning}».`:line[2],audio:line[1]});
    });
    activity.instruction='Escucha a tu interlocutor y responde en inglés. Puedes escribir o hablar.';
  }
}

// ── Guardar ────────────────────────────────────────────────────────────
const changed=[];
for(const [name,file] of files){
  const after=JSON.stringify(file.data,null,2)+'\n';
  if(after!==file.before){fs.writeFileSync(file.url,after);changed.push(name);}
}
console.log(JSON.stringify({changed},null,1));
