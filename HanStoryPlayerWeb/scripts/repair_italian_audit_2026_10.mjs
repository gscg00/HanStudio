// Correcciones críticas de la auditoría del curso de italiano
// (docs/AUDITORIA_ITALIANO_2026-10-27.md). Idempotente: se puede volver a
// ejecutar sin duplicar lecciones ni respuestas.
import fs from 'node:fs';

const dir=new URL('../library/courses/Italian/',import.meta.url);
const files=new Map();
const load=name=>{
  if(!files.has(name)){const url=new URL(name,dir),before=fs.readFileSync(url,'utf8');files.set(name,{url,before,data:JSON.parse(before)});}
  return files.get(name).data;
};
const unit=id=>load(`units/${id}.json`);
const allActivities=data=>data.lessons.flatMap(lesson=>lesson.activities);

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
// Cambia una respuesta corta: el texto exacto (opciones, respuesta) y las
// explicaciones que terminan en «: respuesta».
function replaceAnswer(data,from,to){
  const walk=value=>{
    if(typeof value==='string'){
      if(value===from)return to;
      for(const suffix of [`: ${from}`,`: ${from}.`])if(value.endsWith(suffix))return value.slice(0,-suffix.length)+suffix.replace(from,to);
      return value;
    }
    if(Array.isArray(value))return value.map(walk);
    if(value&&typeof value==='object'){for(const key of Object.keys(value))value[key]=walk(value[key]);}
    return value;
  };
  data.lessons.forEach(walk);
}

// ── Plantillas de actividades (mismo formato que el resto del curso) ──────
const teach=(id,item)=>({id,type:'teach_concept',prompt:'Aprende y escucha',target:item.target,options:[],answer:'',explanation:item.explanation||'',audio:item.audio||item.target,slow_audio:item.audio||item.target,image:null,writing_asset:null,tags:item.tags||[],xp:2,gradable:false,meaning:item.meaning||'',sound_hint:item.sound||'',memory_hint:item.memory||'',teaching_points:item.points||[],group_hint:'',word_breakdown:item.breakdown||[],usage_note:item.usage||'',context_note:'',audio_examples:[]});
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
const extendTest=(data,testId,lessons,count)=>{
  const test=data.lessons.find(lesson=>lesson.id===testId);
  const extra=reviewLesson({id:`${testId}-extra`,title:'',lessons,isTest:true,count}).activities.slice(1).map((activity,index)=>({...activity,id:`${testId}-new-${index+1}`}));
  test.activities=[...test.activities.filter(activity=>!activity.id.startsWith(`${testId}-new-`)),...extra];
};

// ── C2. «Sonidos y lectura»: nombres italianos de las letras ─────────────
// Las respuestas daban el nombre español (efe, ele, eme…) mientras el audio
// dice effe, elle, emme…
const reading=unit('reading');
for(const [from,to] of [
  ['chi ante e/i; k ante a/o/u','ci (ch ante e/i, k ante a/o/u)'],
  ['efe','effe'],
  ['yi ante e/i; g ante a/o/u','gi (dy ante e/i, g ante a/o/u)'],
  ['no suena; cambia c/g','acca (muda; endurece c/g)'],
  ['ele','elle'],['eme','emme'],['ene','enne'],['ese','esse'],
  ['ku','cu (suena ku)'],
  ['r vibrante','erre (r vibrante)'],
  ['vi, dientes sobre labio','vi o vu (dientes sobre el labio)'],
  ['ts o dz','zeta (ts o dz)'],
])replaceAnswer(reading,from,to);

// ── C3. Pronunciación que un hispanohablante necesita ────────────────────
const groups=itemLesson({id:'italian-reading-06',title:'Sonidos y lectura · 6 · Grupos que cambian el sonido',description:'SC, GLI, GN, QU, Z y la S entre vocales.',kind:'sound',introText:'Algunas letras juntas forman un sonido propio. Escucha cada palabra y fíjate en el grupo marcado: así leerás sin deletrear.',items:[
  {target:'scuola',sound:'sk: [skuòla]',explanation:'SC ante a, o, u suena «sk»: scuola, scarpa.',points:['sca · sco · scu = sk'],others:['sh: [shuòla]','s: [suòla]'],listenOthers:['scena','sole']},
  {target:'scena',sound:'sh: [shèna]',explanation:'SC ante e, i suena «sh», como en inglés «she»: scena, sciarpa. En «sci» la i no se pronuncia aparte.',points:['sce · sci = sh'],others:['sk: [skèna]','s: [sèna]'],listenOthers:['scuola','casa']},
  {target:'famiglia',sound:'gli: [famíʎa], «li» muy unida',explanation:'GLI es un solo sonido: la lengua toca el paladar, como una «li» muy rápida (fa-MÍ-lia). Nunca se oye la g.',points:['figlio, famiglia, moglie'],others:['[famígli-a], con g','[famíya], con y'],listenOthers:['bagno','sole']},
  {target:'bagno',sound:'gn: [baño], como la ñ',explanation:'GN suena como la ñ: bagno = [baño], signora = [siñora].',others:['[bag-no], g y n','[bano], sin ñ'],listenOthers:['famiglia','questo']},
  {target:'questo',sound:'qu: [kuésto], la u sí suena',explanation:'QU siempre suena «ku», con la u pronunciada: questo [kuésto], quando [kuándo]. No es como «que» en español.',others:['[késto], u muda','[guésto], con g'],listenOthers:['scuola','casa']},
  {target:'zero',sound:'z: [dsèro], suena ds o ts',explanation:'La Z nunca suena como s ni como la z de España: es «ts» (pizza, grazie) o «ds» (zero, zaino).',others:['[sèro], como s','[thèro], como en España'],listenOthers:['sole','sette']},
  {target:'rosa',sound:'s entre vocales: [ròza], s sonora',explanation:'Entre vocales la S suele sonar sonora, como la s de «mismo» (rosa, casa en el norte). Al inicio de palabra o doble (ss) es sorda: sole, rosso.',others:['[ròssa], s doble','[ròsha], con sh'],listenOthers:['sole','casa']},
]});
const stress=itemLesson({id:'italian-reading-07',title:'Sonidos y lectura · 7 · Acento y consonantes dobles',description:'La tilde final, la e abierta y cerrada, y las dobles que cambian el significado.',kind:'sound',introText:'En italiano la tilde solo se escribe al final de palabra. Las consonantes dobles se sostienen un instante: si no las haces, cambias la palabra (sette = siete, sete = sed).',items:[
  {target:'città',sound:'cit-TÀ: la fuerza va en la tilde final',explanation:'Si la última vocal lleva tilde (à, è, ì, ò, ù), ahí va la fuerza: città, caffè, lunedì.',others:['CIT-ta: fuerza al inicio','cit-ta: sin fuerza'],listenOthers:['casa','sette']},
  {target:'perché',sound:'per-KÉ: «ché» suena «ké»',explanation:'CHE suena «ke»: per-ké. La tilde aguda (é) marca e cerrada; la grave (è) marca e abierta: è (es) frente a e (y).',others:['per-CHÉ, con ch','PER-ke, fuerza al inicio'],listenOthers:['questo','città']},
  {target:'sette',sound:'[sét-te]: tt doble, se sostiene',explanation:'La doble se sostiene un instante: sette (siete) frente a sete (sed).',points:['sette = siete','sete = sed'],others:['[sé-te]: t simple','[sét]: sin vocal final'],listenOthers:['sete','sole']},
  {target:'sete',sound:'[sé-te]: t simple',explanation:'sete = sed (Ho sete = tengo sed). Con t simple; con tt doble, sette, es «siete».',others:['[sét-te]: tt doble','[sét]: sin vocal final'],listenOthers:['sette','città']},
  {target:'parlano',sound:'PAR-la-no: fuerza en «par»',explanation:'El acento no siempre cae en la penúltima y no se escribe: PAR-la-no (hablan), como PAR-lo (hablo).',others:['par-LA-no: fuerza en «la»','par-la-NO: fuerza en «no»'],listenOthers:['perché','sette']},
]});
upsertLessons(reading,[groups,stress],'italian-reading-test-07');
extendTest(reading,'italian-reading-test-07',[groups,stress],6);

// Pistas de sonido engañosas en las fichas de regla.
for(const id of ['survival','essentials','vocabulary']){
  const data=unit(id);
  replaceText(data,'Cómo suena: lli italiana','Cómo suena: una «li» muy rápida y unida (famiglia ≈ fa-MÍ-lia); la g no suena',{whole:true});
  replaceText(data,'Cómo suena: ye / yi','Cómo suena: dye / dyi, como la «y» enfática de «¡yo!»',{whole:true});
  replaceText(data,'Idea clave: párlo italiano','Idea clave: «Parlo italiano» = «(Yo) hablo italiano»; io solo se dice para contrastar',{whole:true});
}

// ── C4. Conjugar en presente, essere / avere y falsos amigos ─────────────
const essentials=unit('essentials');
const ending='La terminación dice quién hace la acción: -o (yo), -i (tú), -a / -e (él, ella, usted), -iamo (nosotros).';
const present=itemLesson({id:'italian-essentials-10',title:'Pronombres y verbos esenciales · 10 · El presente: -are, -ere, -ire',description:'La regla que convierte parlare en parlo y capire en capisco.',introText:'Los verbos se aprenden en infinitivo (parlare, prendere, dormire). Para hablar: quita -are, -ere o -ire y añade la terminación de la persona. Por eso el pronombre (io, tu) casi nunca se dice.',items:[
  {target:'parlo',meaning:'hablo',explanation:'parlare → parl- + o = parlo. La -o ya dice «yo»: Parlo italiano.',points:['parlare = hablar','Quita -are y añade -o'],usage:ending},
  {target:'parli',meaning:'hablas',explanation:'parl- + i = parli (tú). Ojo: «Parli più lentamente» es la forma de usted para pedir: «Hable más despacio».',points:['tu parli = tú hablas'],usage:ending},
  {target:'parla',meaning:'habla (él, ella, usted)',explanation:'parl- + a = parla. Con Lei (usted) se usa esta misma forma: Lei parla italiano? = ¿Usted habla italiano?',points:['lui / lei / Lei parla'],usage:ending},
  {target:'parliamo',meaning:'hablamos',explanation:'parl- + iamo = parliamo. -iamo vale para los tres grupos: prendiamo, dormiamo.',points:['noi parliamo'],usage:ending},
  {target:'prendo',meaning:'tomo',explanation:'prendere → prend- + o = prendo. Verbos en -ere: prendo, prendi, prende, prendiamo.',points:['prendere = tomar (un café, el autobús)'],usage:ending},
  {target:'dormo',meaning:'duermo',explanation:'dormire → dorm- + o = dormo. Verbos en -ire: dormo, dormi, dorme, dormiamo. La o no cambia a «ue» como en español.',points:['dormire = dormir'],usage:ending},
  {target:'capisco',meaning:'entiendo',explanation:'Muchos verbos en -ire añaden -isc-: capire → capisco, capisci, capisce, pero capiamo. Ya lo viste en «Non capisco».',points:['capire = entender','-isc- en yo, tú, él/ella/usted y ellos'],usage:ending},
]});
present.activities.push(
  {id:'italian-essentials-10-production-blocks',type:'build_with_blocks',prompt:'Arma la frase: «No hablo italiano»',target:'No hablo italiano.',options:['parlo','Non','italiano.'],joiner:' ',answer:'Non parlo italiano.',accepted_answers:['Non parlo italiano.','Io non parlo italiano.'],explanation:'Non (no) va justo antes del verbo: Non parlo italiano.',audio:'Non parlo italiano.',slow_audio:'Non parlo italiano.',image:null,writing_asset:null,tags:['production','blocks'],xp:15},
  {id:'italian-essentials-10-production-typed',type:'typed_translation',prompt:'Escribe en italiano: «hablamos»',target:'hablamos',instruction:'Escribe solo la forma conjugada.',answer:'parliamo',accepted_answers:['parliamo','noi parliamo'],allow_minor_typos:false,explanation:'parlare → parliamo (noi).',audio:'parliamo',slow_audio:'parliamo',image:null,writing_asset:null,tags:['production'],xp:20},
);
const essere=itemLesson({id:'italian-essentials-11',title:'Pronombres y verbos esenciales · 11 · Essere y avere',description:'Los dos verbos que más vas a oír: ser/estar y tener.',introText:'Essere sirve para «ser» y casi siempre para «estar» (Sono stanco = estoy cansado). Avere es «tener». En ho, hai, ha la h no suena: solo distingue estas formas de otras palabras.',items:[
  {target:'sono',meaning:'soy / estoy',explanation:'io sono. También es «son»: loro sono (ellos son).',points:['Sono messicano = soy mexicano','Sono stanco = estoy cansado']},
  {target:'sei',meaning:'eres / estás',explanation:'tu sei. Suena igual que sei (seis): el contexto decide.',points:['Sei qui? = ¿Estás aquí?']},
  {target:'è',meaning:'es / está',explanation:'lui / lei / Lei è. Con tilde, è = es; sin tilde, e = y.',points:['È qui = está aquí','e = y']},
  {target:'siamo',meaning:'somos / estamos',explanation:'noi siamo. Después: voi siete, loro sono.',points:['Siamo amici = somos amigos']},
  {target:'ho',meaning:'tengo',explanation:'avere: io ho. La h no suena: ho = [o].',points:['Ho fame = tengo hambre','Ho vent’anni = tengo veinte años']},
  {target:'hai',meaning:'tienes',explanation:'tu hai [ai]. Quanti anni hai? = ¿Cuántos años tienes?'},
  {target:'ha',meaning:'tiene (él, ella, usted)',explanation:'lui / lei / Lei ha [a]. Con h = tiene; sin h, a = a (preposición).',points:['Lei ha tempo? = ¿Usted tiene tiempo?']},
  {target:'abbiamo',meaning:'tenemos',explanation:'noi abbiamo. Después: voi avete, loro hanno.'},
]});
essere.activities.push(
  {id:'italian-essentials-11-production-blocks',type:'build_with_blocks',prompt:'Arma la frase: «Usted es de México»',target:'Usted es de México.',options:['è','Lei','Messico.','del'],joiner:' ',answer:'Lei è del Messico.',accepted_answers:['Lei è del Messico.','È del Messico.'],explanation:'Con Lei (usted) el verbo va en 3.ª persona: Lei è.',audio:'Lei è del Messico.',slow_audio:'Lei è del Messico.',image:null,writing_asset:null,tags:['production','blocks'],xp:15},
  {id:'italian-essentials-11-production-typed',type:'typed_translation',prompt:'Escribe en italiano: «tengo»',target:'tengo',instruction:'Escribe solo la forma conjugada.',answer:'ho',accepted_answers:['ho','io ho'],allow_minor_typos:false,explanation:'avere → io ho (la h no suena).',audio:'ho',slow_audio:'ho',image:null,writing_asset:null,tags:['production'],xp:20},
);
const falseFriends=itemLesson({id:'italian-essentials-12',title:'Pronombres y verbos esenciales · 12 · Falsos amigos',description:'Palabras que parecen españolas y significan otra cosa.',introText:'El italiano se parece mucho al español, y eso a veces engaña. Estas palabras parecen conocidas, pero significan otra cosa. Apréndelas con su imagen real: mantequilla, subir, mirar…',items:[
  {target:'burro',meaning:'mantequilla',explanation:'burro = mantequilla (pane e burro). El animal es asino.',others:['burro (el animal)','queso']},
  {target:'salire',meaning:'subir',explanation:'salire = subir (salire sul treno = subir al tren). «Salir» es uscire.',others:['salir','bajar']},
  {target:'guardare',meaning:'mirar',explanation:'guardare = mirar (guardare la TV = ver la tele). «Guardar» es mettere via o conservare.',others:['guardar','esperar']},
  {target:'caldo',meaning:'calor / caliente',explanation:'caldo = calor o caliente: fa caldo (hace calor), il tè è caldo. El caldo (la sopa) es brodo.',others:['caldo (sopa)','frío']},
  {target:'camera',meaning:'habitación, cuarto',explanation:'camera (da letto) = cuarto, habitación. La cámara de fotos es macchina fotografica.',others:['cámara de fotos','cama']},
  {target:'aceto',meaning:'vinagre',explanation:'aceto = vinagre. El aceite es olio.',others:['aceite','acero']},
]});
upsertLessons(essentials,[present,essere,falseFriends],'italian-essentials-test-12');
extendTest(essentials,'italian-essentials-test-12',[present,essere,falseFriends],9);
for(const activity of allActivities(essentials)){
  if(activity.type==='teach_concept'&&activity.target==='Lei')activity.usage_note='Usted. Con Lei el verbo va en 3.ª persona: Lei parla = usted habla. Escrito con minúscula, lei = ella.';
  if(activity.type==='teach_concept'&&activity.target==='essere')activity.usage_note='essere = ser y casi siempre «estar»: Sono stanco (estoy cansado). Para saludar se usa stare: Come stai?';
  if(activity.type==='teach_concept'&&activity.target==='voi')activity.usage_note='En América se traduce «ustedes»: voi siete = ustedes son. Es el plural de tu.';
}

// ── C5. La unidad «time» repetía survival: números hasta mil, la hora,
// los meses, las fechas y los precios ────────────────────────────────────
const time=unit('time');
const timeLessons=[
  itemLesson({id:'italian-time-01',title:'Números y tiempo · 1 · Del 21 al 50',description:'Cómo se forman los números después de veinte.',introText:'Después de venti se suma la unidad: venti + due = ventidue. Si la unidad empieza por vocal (uno, otto), venti pierde la i: ventuno, ventotto.',items:[
    {target:'ventuno',meaning:'veintiuno',points:['venti + uno → ventuno (cae la i)']},{target:'ventidue',meaning:'veintidós'},{target:'ventotto',meaning:'veintiocho',points:['venti + otto → ventotto']},{target:'trenta',meaning:'treinta'},{target:'quaranta',meaning:'cuarenta',points:['QU = ku: [kuaránta]']},{target:'cinquanta',meaning:'cincuenta'}]}),
  itemLesson({id:'italian-time-02',title:'Números y tiempo · 2 · Del 60 al 1000',description:'Las decenas que más confunden y las centenas.',introText:'Ojo con sessanta (60) y settanta (70): se parecen a sei y sette. Cento es 100 y mille es 1000; el plural de mille es mila (duemila).',items:[
    {target:'sessanta',meaning:'sesenta'},{target:'settanta',meaning:'setenta'},{target:'ottanta',meaning:'ochenta'},{target:'novanta',meaning:'noventa'},{target:'cento',meaning:'cien',points:['centouno = 101']},{target:'mille',meaning:'mil',points:['duemila = 2000']}]}),
  itemLesson({id:'italian-time-03',title:'Números y tiempo · 3 · La hora',description:'Decir y preguntar la hora.',introText:'Para la hora se usa le (las): Sono le tre. La una es singular: È l’una. Los cuartos y las medias se suman con e y se restan con meno.',items:[
    {target:'È l’una.',meaning:'Es la una.',points:['Singular: è (es)','l’una = la una']},{target:'Sono le due e un quarto.',meaning:'Son las dos y cuarto.'},{target:'Sono le sei meno dieci.',meaning:'Son diez para las seis.',points:['meno = menos','Las seis menos diez']},{target:'È mezzogiorno.',meaning:'Es mediodía.'},{target:'A che ora?',meaning:'¿A qué hora?'}]}),
  itemLesson({id:'italian-time-04',title:'Números y tiempo · 4 · Meses de enero a junio',description:'Los primeros seis meses.',introText:'Los meses se escriben con minúscula: gennaio, febbraio… Ojo con giugno (junio) y luglio (julio): se confunden fácilmente.',items:[
    {target:'gennaio',meaning:'enero'},{target:'febbraio',meaning:'febrero'},{target:'marzo',meaning:'marzo (mes)',points:['Z = ts: [mártso]']},{target:'aprile',meaning:'abril'},{target:'maggio',meaning:'mayo'},{target:'giugno',meaning:'junio',points:['gi + gn: [yúño]','No lo confundas con luglio (julio)']}]}),
  itemLesson({id:'italian-time-05',title:'Números y tiempo · 5 · Meses de julio a diciembre',description:'Los últimos seis meses.',introText:'Luglio es julio (no junio). Settembre, ottobre, novembre y dicembre se parecen mucho al español, pero llevan dobles: settembre, ottobre.',items:[
    {target:'luglio',meaning:'julio',points:['gli = una «li» unida: [lúʎo]']},{target:'agosto',meaning:'agosto (mes)'},{target:'settembre',meaning:'septiembre'},{target:'ottobre',meaning:'octubre'},{target:'novembre',meaning:'noviembre'},{target:'dicembre',meaning:'diciembre'}]}),
  itemLesson({id:'italian-time-06',title:'Números y tiempo · 6 · Fechas',description:'Preguntar y decir la fecha.',introText:'La fecha lleva artículo: il ventisette ottobre (el 27 de octubre). El día 1 es il primo: il primo maggio.',items:[
    {target:'Che giorno è oggi?',meaning:'¿Qué día es hoy?'},{target:'Oggi è il ventisette ottobre.',meaning:'Hoy es 27 de octubre.'},{target:'il primo maggio',meaning:'el primero de mayo',points:['El día 1 se dice primo']},{target:'Il mio compleanno è a luglio.',meaning:'Mi cumpleaños es en julio.'},{target:'il fine settimana',meaning:'el fin de semana'}]}),
  itemLesson({id:'italian-time-07',title:'Números y tiempo · 7 · Precios',description:'Euros, céntimos y la cuenta.',introText:'En Italia se paga en euros: euro no cambia en plural (dieci euro). Los céntimos son centesimi.',items:[
    {target:'Costa dieci euro.',meaning:'Cuesta diez euros.',points:['euro no cambia en plural']},{target:'Sono venti euro.',meaning:'Son veinte euros.'},{target:'cinquanta centesimi',meaning:'cincuenta céntimos'},{target:'Quanto viene?',meaning:'¿Cuánto es (en total)?'},{target:'È troppo caro.',meaning:'Es demasiado caro.'}]}),
];
time.title='Números, horas, fechas y precios';
time.description='Números hasta mil, la hora, los meses, las fechas y los precios en euros.';
time.lessons=[...timeLessons.slice(0,3),reviewLesson({id:'italian-time-review-03',title:'Repaso breve 1',lessons:timeLessons.slice(0,3),count:8}),...timeLessons.slice(3),reviewLesson({id:'italian-time-review-07',title:'Repaso breve 2',lessons:timeLessons.slice(3),count:8}),reviewLesson({id:'italian-time-test-16',title:'Prueba · Números, horas, fechas y precios',lessons:timeLessons,isTest:true,count:18})];
const course=load('course.json');
Object.assign(course.units.find(entry=>entry.id==='time'),{title:time.title,description:time.description});

// ── C6. Texto italiano agramatical o traducciones erróneas ───────────────
const vocabulary=unit('vocabulary');
for(const [from,to] of [
  ['Il mio cugino gioca a calcio.','Mio cugino gioca a calcio.'],
  ['La mia cugina canta bene.','Mia cugina canta bene.'],
  ['La mia età è dieci anni. — Mi edad es diez años.','Ho dieci anni. — Tengo diez años.'],
  ['Le uva sono buone. — Las uvas están buenas.','L’uva è buona. — Las uvas están buenas.'],
  ['Quanto costa? — ¿Cuánto cuesta?','Il costo del biglietto è alto. — El costo del boleto es alto.'],
  ['Il banco è vicino alla finestra. — El banco está cerca de la ventana.','Il banco è vicino alla finestra. — El pupitre está cerca de la ventana.'],
  ['Voi siete pronti. — Vosotros estáis listos.','Voi siete pronti. — Ustedes están listos.'],
  ['Cojo el ticket.','Tomo el ticket.'],
  ['Cojo algunas manzanas.','Tomo algunas manzanas.'],
])replaceText(vocabulary,from,to);
for(const activity of allActivities(vocabulary)){
  if(activity.target==='costo'||(activity.type==='listening_choice'&&activity.answer==='costo')){
    replaceAnswer({lessons:[{activities:[activity]}]},'cuesta','costo, precio');
    if(activity.type==='teach_concept'){activity.meaning='costo, precio';activity.explanation=activity.explanation.replace(/^cuesta\./,'costo, precio.');activity.sound_hint=activity.sound_hint.replace(/^cuesta\./,'costo, precio.');activity.usage_note='Sustantivo. «Cuesta» es costa: Quanto costa? = ¿Cuánto cuesta?';}
  }
  // banco = pupitre (el banco-entidad es banca). Se cambia solo el significado,
  // nunca el texto italiano ni la clave de audio.
  const BANCO=new Set(['banco','pupitre, mostrador']);
  if(BANCO.has(activity.target)||(activity.type==='listening_choice'&&BANCO.has(activity.audio))){
    activity.audio='banco';activity.slow_audio='banco';
    if(activity.type==='teach_concept'){activity.target='banco';activity.meaning='pupitre, mostrador';activity.explanation=activity.explanation.replace(/^(banco|pupitre, mostrador)\./,'pupitre, mostrador.');activity.sound_hint=activity.sound_hint.replace(/^(banco|pupitre, mostrador)\./,'pupitre, mostrador.');activity.usage_note='Falso amigo: el banco (la entidad) es la banca; el banco para sentarse es la panchina.';}
    if(activity.type==='select_translation'){activity.target='banco';activity.prompt='¿Qué significa «banco»?';activity.options=activity.options.map(option=>BANCO.has(option)?'pupitre, mostrador':option);activity.answer='pupitre, mostrador';activity.explanation='pupitre, mostrador';}
    if(activity.type==='listening_choice'){activity.options=activity.options.map(option=>BANCO.has(option)?'banco':option);activity.answer='banco';activity.explanation='La forma escrita correcta es «banco»: pupitre, mostrador.';}
  }
  if(activity.type==='teach_concept'&&activity.target==='voi'){activity.meaning='ustedes (vosotros)';activity.usage_note='En América se traduce «ustedes»: es el plural de tu.';}
  if(activity.type==='select_translation'&&activity.target==='voi'&&activity.answer==='vosotros'){activity.options=activity.options.map(option=>option==='vosotros'?'ustedes (vosotros)':option);activity.answer='ustedes (vosotros)';activity.explanation='ustedes (vosotros)';}
  if(activity.type==='teach_concept'&&activity.target==='camera')activity.usage_note='Falso amigo: camera = cuarto, habitación. La cámara de fotos es macchina fotografica.';
  if(activity.type==='teach_concept'&&activity.target==='caldo')activity.usage_note='Falso amigo: caldo = calor o caliente. El caldo (sopa) es brodo.';
}
replaceText(vocabulary,'La forma escrita correcta es «voi»: vosotros.','La forma escrita correcta es «voi»: ustedes (vosotros).',{whole:true});

// A1: notas de falsos amigos y registro, y traducciones corregidas.
const a1Notes={
  camera:'Falso amigo: camera = cuarto, habitación (no «cámara»).',
  caldo:'Falso amigo: caldo = calor o caliente (el caldo, la sopa, es brodo).',
  piano:'piano = plan; también «piso, planta» y, como adverbio, «despacio» (parla piano).',
  carta:'carta = tarjeta; también «papel» y «carta» (el menú).',
  svegliarsi:'Mi sveglio = me despierto. «Me levanto» es mi alzo (alzarsi): Mi alzo alle sette.',
  'Porta un ombrello.':'Porta (tú) = lleva. Con usted: Porti un ombrello. Ojo: porta también es «puerta».',
  'Vada sempre dritto.':'Vada es la forma de usted (Lei); con tú: Vai sempre dritto.',
  'Prenda questo due volte al giorno.':'Lo dice el médico (forma de usted).',
  'buonasera':'Se dice desde media tarde para saludar y también al despedirse. Buonanotte solo al irse a dormir.',
};
const levelUnits=course.levels.flatMap(level=>level.unitIds).filter(id=>/^(a1|a2|b1)-/.test(id));
for(const id of levelUnits){
  const data=unit(id);
  for(const activity of allActivities(data))if(activity.type==='teach_concept'&&a1Notes[activity.target])activity.usage_note=a1Notes[activity.target];
  for(const [from,to] of [
    ['Hablo un poco de este idioma.','Hablo un poco de italiano.'],
    ['Quiero un poco de arroz.','Quisiera un poco de arroz.'],
    ['Debes mostrar tu pasaporte.','Debe mostrar su pasaporte.'],
    ['Aquí se puede tomar fotos.','Aquí se pueden tomar fotos.'],
    ['Tenemos que decidir qué es prioritario.','¿Qué va primero?'],
    ['Hasta cierto punto, el resultado fue positivo.','En conjunto, el resultado fue positivo.'],
    ['¿Qué tan segura es esa información?','¿Es fiable esta información?'],
    ['¿Qué cambiaríamos la próxima vez?','¿Qué cambiaremos la próxima vez?'],
    ['Revisaremos los avances al final de la semana.','Revisaremos los avances el fin de semana.'],
    ['En caso de que necesites ayuda, llámame.','Si necesitas ayuda, llámame.'],
    ['Aceptaría si cambiamos la fecha.','Aceptaría si cambiáramos la fecha.'],
    ['Conviene prever los riesgos antes de empezar.','Anticipemos los riesgos antes de empezar.'],
    ['Antes de continuar, quisiera aclarar un detalle.','Primero quisiera aclarar un detalle.'],
    ['La idea parece buena; sin embargo, puede ser costosa.','Buena idea, pero quizá cuesta demasiado.'],
    ['Entiendo tu punto, aunque lo veo de otra manera.','Entiendo tu punto, pero no estoy de acuerdo.'],
  ])replaceText(data,from,to);
}
const identity=unit('a1-1-identity');
replaceText(identity,'buenas noches','buenas tardes / buenas noches',{whole:true});
replaceText(identity,'«buenas noches»','«buenas tardes / buenas noches»');
replaceText(identity,': buenas noches',': buenas tardes / buenas noches');
replaceText(identity,'buenas tardes / buenas noches (al llegar)','buenas tardes / buenas noches');

// La producción de salud hacía decir al alumno la frase del médico.
const health=unit('a1-2-health');
for(const lesson of health.lessons.filter(lesson=>lesson.activities.some(activity=>activity.id.includes('-production-')))){
  for(const activity of lesson.activities){
    if(!activity.id.includes('-production-'))continue;
    const fix=value=>value.split('Prenda questo due volte al giorno.').join('Mi fa male la testa.').split('Tome esto dos veces al día.').join('Me duele la cabeza.');
    const walk=value=>typeof value==='string'?fix(value):Array.isArray(value)?value.map(walk):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([key,item])=>[key,walk(item)])):value;
    Object.assign(activity,walk(activity));
    if(activity.type==='complete_without_options'&&activity.target==='Prenda questo due volte al ___.'){activity.target='Mi fa male la ___.';activity.answer='testa';activity.accepted_answers=['testa'];}
  }
}

// ── C7. Más respuestas aceptadas y diálogos con margen ───────────────────
const accepted={
  'Come ti chiami?':['Come si chiama?','Tu come ti chiami?'],
  'Vengo dal Messico.':['Sono del Messico.','Sono messicano.','Sono messicana.','Io vengo dal Messico.'],
  'Chi è?':['Chi è questa persona?'],
  'Quanti anni hai?':['Quanti anni ha?','Tu quanti anni hai?'],
  'La chiave è sul tavolo.':['La chiave è sopra il tavolo.','La chiave sta sul tavolo.'],
  'La mia camera è piccola.':['La mia stanza è piccola.','La camera è piccola.'],
  'Mi alzo alle sette.':['Io mi alzo alle sette.','Mi alzo alle 7.','Mi alzo alle ore sette.'],
  'Studio nel pomeriggio.':['Io studio nel pomeriggio.','Studio di pomeriggio.','Studio il pomeriggio.'],
  'Bevo tè al mattino.':['Bevo il tè al mattino.','Bevo tè la mattina.','Bevo il tè la mattina.','Io bevo tè al mattino.','La mattina bevo il tè.'],
  'Vorrei un po’ di riso.':['Vorrei del riso.','Un po’ di riso, per favore.'],
  'La stazione è a sinistra.':['La stazione è sulla sinistra.','La stazione si trova a sinistra.'],
  'Vado a scuola.':['Io vado a scuola.'],
  'Posso pagare con la carta?':['Posso pagare con carta?','Posso pagare con la carta di credito?','Si può pagare con la carta?'],
  'Ho solo contanti.':['Ho solo i contanti.','Ho soltanto contanti.','Io ho solo contanti.'],
  'Arrivo alle otto.':['Arrivo alle 8.','Io arrivo alle otto.','Arrivo alle ore otto.'],
  'L’appuntamento è la prossima settimana.':['L’appuntamento è la settimana prossima.'],
  'Devo cambiare?':['Devo cambiare treno?','Bisogna cambiare?'],
  'Il treno è in ritardo.':['Il treno arriva in ritardo.'],
  'Ho un’allergia alla penicillina.':['Sono allergico alla penicillina.','Sono allergica alla penicillina.'],
  'Mi fa male la testa.':['Ho mal di testa.'],
  'Ho bisogno di un cappotto.':['Mi serve un cappotto.'],
  'Il tempo cambia rapidamente.':['Il tempo cambia velocemente.','Il tempo cambia in fretta.'],
  'Dove ci vediamo?':['Dove ci incontriamo?'],
  'Ho tempo dopo le sei.':['Ho tempo dopo le 6.','Sono libero dopo le sei.','Sono libera dopo le sei.'],
  'Non sono riuscito a trovare le chiavi.':['Non sono riuscita a trovare le chiavi.','Non ho trovato le chiavi.'],
  'Penso di prenotare una camera.':['Penso di prenotare una stanza.'],
  'Qui si possono fare fotografie.':['Qui si possono fare foto.','Qui si può fotografare.','Qui si possono scattare foto.'],
  'Può darmi una ricevuta?':['Mi può dare una ricevuta?','Mi dà una ricevuta?'],
  'Inoltre, devo comprare da mangiare.':['Inoltre, devo comprare del cibo.'],
  'Questa lezione mi sembra difficile.':['Questa lezione mi risulta difficile.'],
  'Devo caricare il telefono.':['Devo ricaricare il telefono.','Ho bisogno di caricare il telefono.'],
  'Questo non risolverà il problema.':['Ciò non risolverà il problema.'],
  'Dovresti dirgli come ti senti.':['Dovresti dirle come ti senti.'],
  'Nel frattempo, mia sorella ha chiamato la polizia.':['Intanto mia sorella ha chiamato la polizia.'],
  'Se hai bisogno di aiuto, chiamami.':['Se ti serve aiuto, chiamami.'],
  'Non significa che sia impossibile.':['Non significa necessariamente che sia impossibile.','Non vuol dire che sia impossibile.'],
  'Quale altra scelta ci rimane?':['Che alternativa ci rimane?','Quale alternativa ci rimane?'],
  'Prevediamo i rischi prima di iniziare.':['Prevediamo i rischi prima di cominciare.','Anticipiamo i rischi prima di iniziare.'],
  'Prima vorrei chiarire un dettaglio.':['Prima di continuare, vorrei chiarire un dettaglio.','Prima di tutto vorrei chiarire un dettaglio.'],
};
const FREE_TYPES=new Set(['typed_translation','speak_and_transcribe','open_question']);
const widen=target=>{const extra=accepted[target.answer];if(!extra)return;target.accepted_answers=[...new Set([...(target.accepted_answers||[target.answer]),...extra])];};
for(const id of levelUnits){
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
