// Correcciones críticas de la auditoría del curso de árabe
// (docs/AUDITORIA_ARABE_2026-10-27.md). Idempotente: se puede volver a
// ejecutar sin duplicar lecciones ni respuestas.
import fs from 'node:fs';

const dir=new URL('../library/courses/Arabic/',import.meta.url);
const files=new Map();
const load=name=>{
  if(!files.has(name)){const url=new URL(name,dir),before=fs.readFileSync(url,'utf8');files.set(name,{url,before,data:JSON.parse(before)});}
  return files.get(name).data;
};
const unit=id=>load(`units/${id}.json`);
const allActivities=data=>data.lessons.flatMap(lesson=>lesson.activities);

// Reemplaza un texto en todos los campos de todas las actividades de una unidad.
function walkReplace(value,from,to,whole){
  if(typeof value==='string')return whole?(value===from?to:value):value.split(from).join(to);
  if(Array.isArray(value))return value.map(item=>walkReplace(item,from,to,whole));
  if(value&&typeof value==='object'){for(const key of Object.keys(value))value[key]=walkReplace(value[key],from,to,whole);}
  return value;
}
function replaceText(data,from,to,{whole=false}={}){data.lessons.forEach(lesson=>walkReplace(lesson,from,to,whole));}
// Cambia la glosa de una sola palabra árabe sin tocar otras palabras con la misma glosa.
function relabel(data,arabic,from,to){
  for(const activity of allActivities(data)){
    if(![activity.target,activity.answer,activity.audio].includes(arabic))continue;
    walkReplace(activity,from,to,true);
    for(const key of ['explanation','sound_hint'])if(typeof activity[key]==='string')activity[key]=activity[key].split(`«${arabic}»: ${from}`).join(`«${arabic}»: ${to}`).replace(new RegExp(`^${from.replace(/[.*+?^${}()|[\]\\/]/g,'\\$&')}(?=\\.|$)`),to);
  }
}

// ── Plantillas de actividades (mismo formato que el resto del curso) ──────
const teach=(id,item)=>({id,type:'teach_concept',prompt:'Aprende y escucha',target:item.target,options:[],answer:'',explanation:item.explanation||'',audio:item.audio||item.target,slow_audio:item.audio||item.target,image:null,writing_asset:null,tags:item.tags||[],xp:2,gradable:false,meaning:item.meaning||'',sound_hint:item.sound||'',memory_hint:item.memory||'',teaching_points:item.points||[],group_hint:'',word_breakdown:item.breakdown||[],usage_note:item.usage||'',context_note:'',audio_examples:[]});
const placed=(answer,others,index)=>{const list=[...others];list.splice(index%3,0,answer);return list;};
const choice=(id,item,{prompt,answer,others,index})=>({id,type:'select_translation',prompt,target:item.target,options:placed(answer,others,index),answer,explanation:item.explanation||answer,audio:item.audio||item.target,slow_audio:item.audio||item.target,image:null,writing_asset:null,tags:item.tags||[],xp:10});
const listen=(id,item,{prompt,others,index,explanation})=>({id,type:'listening_choice',prompt,target:'',options:placed(item.target,others,index+1),answer:item.target,explanation,audio:item.audio||item.target,slow_audio:item.audio||item.target,image:null,writing_asset:null,tags:item.tags||[],xp:10});
const intro=(id,title,text)=>({id,type:'lesson_intro',prompt:title,target:'',options:[],answer:'',explanation:text,audio:'',slow_audio:'',image:null,writing_asset:null,tags:[],xp:2,gradable:false});

// kind 'sound': cómo se pronuncia; 'meaning': qué significa; 'letter': qué letra es.
function itemLesson({id,title,description,introText,items,kind='meaning',listenPrompt}){
  const activities=[intro(`${id}-intro`,title,introText)];
  const answerOf=item=>kind==='meaning'?item.meaning:item.sound;
  items.forEach((item,index)=>{
    const n=index+1,answer=answerOf(item);
    const others=item.others||items.filter(other=>other!==item).map(answerOf).filter(text=>text!==answer).slice(index%2,index%2+2);
    const heard=item.listenOthers||items.filter(other=>other!==item).map(other=>other.target).slice(index%2,index%2+2);
    const prompt=kind==='sound'?`¿Cómo se pronuncia «${item.target}»?`:kind==='letter'?`¿Qué letra aparece en «${item.target}»?`:`¿Qué significa «${item.target}»?`;
    activities.push(teach(`${id}-${n}-teach`,item));
    activities.push(choice(`${id}-${n}-meaning`,item,{prompt,answer,others,index}));
    activities.push(listen(`${id}-${n}-listen`,item,{prompt:listenPrompt||(kind==='meaning'?'Escucha y elige la palabra o frase correcta':'Escucha y elige la palabra que oyes'),others:heard,index,explanation:kind==='meaning'?`La forma escrita correcta es «${item.target}»: ${answer}.`:`Escuchaste «${item.target}»: ${answer}.`}));
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
const course=load('course.json');
const setUnitInfo=(data,title,description)=>{data.title=title;data.description=description;if(data.reward)data.reward.badge=title;Object.assign(course.units.find(entry=>entry.id===data.id),{title,description});};
// Reemplaza el contenido de una unidad por lecciones nuevas + repaso + prueba.
function rebuildUnit(id,{title,description,lessons,reviewAfter=[]}){
  const data=unit(id),out=[];
  lessons.forEach((lesson,index)=>{
    out.push(lesson);
    if(reviewAfter.includes(index+1)){const from=reviewAfter[reviewAfter.indexOf(index+1)-1]||0;out.push(reviewLesson({id:`arabic-${id}-review-${String(index+1).padStart(2,'0')}`,title:`Repaso breve ${reviewAfter.indexOf(index+1)+1}`,lessons:lessons.slice(from,index+1),count:8}));}
  });
  out.push(reviewLesson({id:`arabic-${id}-test-${String(out.length+1).padStart(2,'0')}`,title:`Prueba · ${title}`,lessons,isTest:true,count:Math.min(18,lessons.length*4)}));
  data.lessons=out;setUnitInfo(data,title,description);
}

// ── C1. Lectura: vocales con letra, sukun/shadda/tanwin, ة ى آ لا, ال y
// formas conectadas (antes solo había nombres de letras y signos sueltos) ──
const reading=unit('reading');
const readingLessons=[
  itemLesson({id:'arabic-reading-07',title:'Sonidos y lectura · 7 · Vocales cortas y largas',description:'Las marcas َ ِ ُ sobre una letra real, y las vocales largas ا و ي.',kind:'sound',introText:'Una consonante sola no se pronuncia: necesita una vocal. Fatha (َ) = a, kasra (ِ) = i, damma (ُ) = u. Si después va ا, ي o و, la vocal se alarga.',items:[
    {target:'بَ',sound:'[ba] a breve',explanation:'Fatha (َ), encima: a breve. بَ = ba.',points:['َ encima de la letra = a']},
    {target:'بِ',sound:'[bi] i breve',explanation:'Kasra (ِ), debajo: i breve. بِ = bi.',points:['ِ debajo de la letra = i']},
    {target:'بُ',sound:'[bu] u breve',explanation:'Damma (ُ), encima: u breve. بُ = bu.',points:['ُ encima, como una و pequeña = u']},
    {target:'با',sound:'[bā] a larga',explanation:'ب + ا: la a se alarga. با = baa.',points:['بَ + ا → بَا']},
    {target:'بي',sound:'[bī] i larga',explanation:'ب + ي: la i se alarga. بي = bii.',points:['بِ + ي → بِي']},
    {target:'بو',sound:'[bū] u larga',explanation:'ب + و: la u se alarga. بو = buu.',points:['بُ + و → بُو']},
  ]}),
  itemLesson({id:'arabic-reading-08',title:'Sonidos y lectura · 8 · Sukun, shadda y tanwin',description:'Sin vocal, consonante doble y la terminación -an / -un / -in.',kind:'sound',introText:'Sukun (ْ) dice «aquí no hay vocal». Shadda (ّ) duplica la consonante. Tanwin (ً ٌ ٍ) añade -n al final: -an, -un, -in. Ya lo viste en شكرًا (shukran).',items:[
    {target:'مِنْ',sound:'[min] sin vocal tras n',explanation:'Sukun (ْ) sobre ن: la sílaba se cierra. مِنْ = min (de, desde).',points:['ْ = sin vocal']},
    {target:'أُمّ',sound:'[umm] m doble',explanation:'Shadda (ّ) sobre م: se pronuncia dos veces. أُمّ = umm (madre).',points:['ّ = consonante doble','حمّام = ḥammām (baño)']},
    {target:'شُكْرًا',sound:'[shukran] -an final',explanation:'Tanwin fatha (ًا): -an al final. شُكْرًا = shukran (gracias). La ا final no se lee como vocal larga.',points:['ًا = -an','También: غدًا [ghadan], عفوًا [ʿafwan]']},
    {target:'كِتابٌ',sound:'[kitābun] -un final',explanation:'Tanwin damma (ٌ): -un. كِتابٌ = kitābun (un libro). Al hablar se suele omitir: [kitāb].',points:['ٌ = -un']},
    {target:'بَيْتٍ',sound:'[baytin] -in final',explanation:'Tanwin kasra (ٍ): -in. Aparece tras preposiciones: في بَيْتٍ = en una casa.',points:['ٍ = -in']},
  ]}),
  itemLesson({id:'arabic-reading-09',title:'Sonidos y lectura · 9 · ة, ى, آ y لا',description:'Letras especiales que aparecen desde la primera unidad.',kind:'sound',introText:'Cuatro grafías que no estaban en el alfabeto básico: ة (ta marbuta, final femenino), ى (alif maqsura, «a» final), آ (alif madda, «ā» larga inicial) y لا (ل + ا unidas).',items:[
    {target:'غُرْفَة',audio:'غرفة',sound:'[ghurfa] ة muda al final',explanation:'Ta marbuta (ة): solo va al final y casi siempre marca femenino. Al final de la frase suena «a»: غرفة [ghurfa].',points:['ة = ـه con dos puntos','Al final: suena «a»']},
    {target:'غُرْفَتي',sound:'[ghurfatī] ة → t',explanation:'Si se añade algo después, ة se convierte en ت y suena «t»: غرفة → غرفتي [ghurfatī] (mi habitación).',points:['غرفة + ي → غرفتي']},
    {target:'مَتى',audio:'متى',sound:'[matā] ى suena a',explanation:'Alif maqsura (ى): parece ي sin puntos y suena «a» larga. مَتى = matā (cuándo).',points:['ى (sin puntos) = ā','ي (con puntos) = ī / y','También: مستشفى [mustashfā], حمّى [ḥummā]']},
    {target:'الآن',sound:'[al-ān] ā larga',explanation:'Alif madda (آ) = hamza + a larga: ā. الآن = al-ān (ahora).',points:['آ = ءا']},
    {target:'لا',sound:'[lā] ل + ا',explanation:'ل seguida de ا se escribe con una ligadura especial: لا. Significa «no».',points:['ل + ا → لا','También en: سلام, الآن']},
  ]}),
  itemLesson({id:'arabic-reading-10',title:'Sonidos y lectura · 10 · El artículo ال: letras lunares y solares',description:'Cuándo se oye la l de ال y cuándo desaparece.',kind:'sound',introText:'ال = «el, la, los, las». Ante las 14 letras «lunares» se oye la l: al-qamar. Ante las 14 «solares» (ت ث د ذ ر ز س ش ص ض ط ظ ل ن) la l no suena y la letra siguiente se duplica: ash-shams. Se escribe igual en los dos casos.',items:[
    {target:'القَمَر',sound:'[al-qamar] se oye la l',explanation:'ق es letra lunar: la l de ال suena. القمر = al-qamar (la luna).',points:['Lunares: ا ب ج ح خ ع غ ف ق ك م ه و ي']},
    {target:'الكِتاب',sound:'[al-kitāb] se oye la l',explanation:'ك es lunar: الكتاب = al-kitāb (el libro).'},
    {target:'الشَّمْس',sound:'[ash-shams] la l no suena',explanation:'ش es letra solar: la l se asimila y la ش se duplica (shadda). الشمس = ash-shams (el sol).',points:['Solares: ت ث د ذ ر ز س ش ص ض ط ظ ل ن','Se escribe ال pero se dice ash-']},
    {target:'السّوق',sound:'[as-sūq] la l no suena',explanation:'س es solar: السوق = as-sūq (el mercado). Igual: الساعة [as-sāʿa], النور [an-nūr].'},
    {target:'في البَيْت',sound:'[fil-bayt] la a de ال desaparece',explanation:'Tras una palabra, la a de ال no se pronuncia (hamzat al-wasl): في البيت = fil-bayt (en la casa).',points:['في + البيت → [fil-bayt]','Lo mismo en إلى المدرسة [ilal-madrasa]']},
  ]}),
  itemLesson({id:'arabic-reading-11',title:'Sonidos y lectura · 11 · Formas conectadas',description:'La misma letra cambia de forma al inicio, en medio y al final.',kind:'letter',listenPrompt:'Escucha el nombre de la letra y elige sus formas',introText:'Casi todas las letras tienen cuatro formas: aislada, inicial, media y final. Lo que no cambia es el «cuerpo» y los puntos. ه es la que más cambia: هـ ـهـ ـه.',items:[
    {target:'ب بـ ـبـ ـب',audio:'باء',sound:'ب (b)',explanation:'ب: aislada ب, inicial بـ (باب), media ـبـ (كبير), final ـب (كتاب). El punto de abajo siempre se mantiene.',points:['بـ: باب','ـبـ: كبير','ـب: كتاب']},
    {target:'ه هـ ـهـ ـه',audio:'هاء',sound:'ه (h)',explanation:'ه cambia mucho: inicial هـ (هنا), media ـهـ (شهر), final ـه (وجه).',points:['هـ: هنا','ـهـ: شهر','ـه: اسمه']},
    {target:'ع عـ ـعـ ـع',audio:'عين',sound:'ع (ʿayn)',explanation:'ع: inicial عـ (عين), media ـعـ (بعد), final ـع (سبع).',points:['عـ: عندي','ـعـ: بعد','ـع: سبع']},
    {target:'ك كـ ـكـ ـك',audio:'كاف',sound:'ك (k)',explanation:'ك: inicial y media كـ / ـكـ pierden la «s» interior: كتاب, مكتب; final ـك: اسمك.',points:['كـ: كتاب','ـكـ: مكتب','ـك: اسمك']},
    {target:'ي يـ ـيـ ـي',audio:'ياء',sound:'ي (y / ī)',explanation:'ي: inicial يـ (يوم), media ـيـ (بيت), final ـي (اسمي). Los dos puntos van debajo.',points:['يـ: يوم','ـيـ: بيت','ـي: اسمي']},
  ]}),
];
upsertLessons(reading,readingLessons,'arabic-reading-test-08');
const readingTest=reading.lessons.find(lesson=>lesson.id==='arabic-reading-test-08');
const readingExtra=reviewLesson({id:'x',title:'',lessons:readingLessons,isTest:true,count:10}).activities.slice(1).map((activity,index)=>({...activity,id:`arabic-reading-test-08-new-${index+1}`}));
readingTest.activities=[...readingTest.activities.filter(activity=>!activity.id.startsWith('arabic-reading-test-08-new-')),...readingExtra];
// Descripciones de sonido engañosas para un hispanohablante.
for(const [from,to] of [
  ['y fuerte o j según la región','dj, como la «ll» argentina; nunca la j española'],
  ['h suave','h aspirada (como en inglés «hello»); nunca muda'],
  ['sonido profundo de garganta','ʿayn: se aprieta la garganta; no existe en español'],
])replaceText(reading,from,to);

// ── C2. survival, time, reading-bridge y story-bridge eran cuatro copias de
// los mismos 10 pronombres de essentials. Ahora enseñan contenido nuevo ──
const survivalLessons=[
  itemLesson({id:'arabic-survival-01',title:'Comunicación esencial · 1 · Saludos',description:'Saludar y responder en árabe estándar.',introText:'El saludo más general es السلام عليكم (la paz sea con ustedes). Se responde siempre con وعليكم السلام. Sirve en cualquier país árabe.',items:[
    {target:'السلام عليكم',meaning:'Hola (la paz sea con ustedes)',others:['Bienvenido','Buenos días'],usage:'Saludo universal, formal o informal. Se dice al llegar.'},
    {target:'وعليكم السلام',meaning:'Respuesta a «السلام عليكم»',others:['Buenos días','Bienvenido'],usage:'Literalmente: «y con ustedes la paz».'},
    {target:'مرحبًا',meaning:'Hola',others:['Bienvenido','Respuesta a «السلام عليكم»'],usage:'Más neutro y cotidiano. Se pronuncia [marḥaban].'},
    {target:'أهلًا وسهلًا',meaning:'Bienvenido',others:['Buenos días','Respuesta a «السلام عليكم»'],usage:'Para recibir a alguien. Se pronuncia [ahlan wa sahlan].'},
    {target:'صباح الخير',meaning:'Buenos días',others:['Bienvenido','Respuesta a «السلام عليكم»'],usage:'Respuesta habitual: صباح النور.'},
  ]}),
  itemLesson({id:'arabic-survival-02',title:'Comunicación esencial · 2 · Cortesía',description:'Gracias, de nada, por favor, sí y no.',introText:'Con estas cinco palabras ya puedes pedir y agradecer. Fíjate en el tanwin (-an) de شكرًا y عفوًا.',items:[
    {target:'شكرًا.',meaning:'Gracias.',sound:'Se pronuncia [shukran].'},
    {target:'عفوًا',meaning:'De nada / Perdón',usage:'Responde a «gracias» y también sirve para pedir paso.',sound:'Se pronuncia [ʿafwan].'},
    {target:'من فضلك.',meaning:'Por favor.',usage:'A un hombre: من فضلكَ [min faḍlik(a)]; a una mujer: من فضلكِ [min faḍliki]. Sin vocales se escribe igual.'},
    {target:'نعم',meaning:'Sí'},
    {target:'لا',meaning:'No'},
  ]}),
  itemLesson({id:'arabic-survival-03',title:'Comunicación esencial · 3 · ¿Qué tal? y despedidas',description:'Preguntar cómo está alguien, disculparse y despedirse.',introText:'En árabe, «estoy bien» no lleva verbo: أنا بخير = «yo (estoy) bien». Muchas frases cambian si hablas con un hombre o con una mujer.',items:[
    {target:'كيف حالك؟',meaning:'¿Cómo estás?',usage:'A un hombre: [kayfa ḥāluka]; a una mujer: [kayfa ḥāluki]. Se escribe igual.'},
    {target:'أنا بخير، الحمد لله.',meaning:'Estoy bien, gracias a Dios.',usage:'الحمد لله se usa a diario, también entre no creyentes, como «por suerte».',points:['أنا = yo','بخير = bien','No hace falta verbo «estar»']},
    {target:'آسف',meaning:'Lo siento (hombre)',usage:'Si lo dice una mujer: آسفة [āsifa].'},
    {target:'لا أفهم.',meaning:'No entiendo.'},
    {target:'مع السلامة',meaning:'Adiós',usage:'Al despedirse. También: إلى اللقاء (hasta luego).'},
  ]}),
];
rebuildUnit('survival',{title:'Comunicación esencial',description:'Saludos, cortesía y expresiones para desenvolverte.',lessons:survivalLessons,reviewAfter:[2]});

const questionsLessons=[
  itemLesson({id:'arabic-questions-01',title:'Preguntas y estructura · 1 · Frases sin verbo «ser»',description:'La oración nominal: «yo estudiante» = soy estudiante.',introText:'En presente, el árabe no usa verbo «ser/estar»: أنا طالب = «yo estudiante» = soy estudiante. Con ال el adjetivo afirma (البيت كبير = la casa es grande); sin ال describe (بيت كبير = una casa grande).',items:[
    {target:'أنا طالب.',meaning:'Soy estudiante (hombre).',points:['أنا = yo','طالب = estudiante','Sin verbo «ser»']},
    {target:'أنا طالبة.',meaning:'Soy estudiante (mujer).',points:['طالب + ة = طالبة (femenino)']},
    {target:'البيت كبير.',meaning:'La casa es grande.',points:['ال + sustantivo + adjetivo sin ال = frase completa']},
    {target:'بيت كبير',meaning:'una casa grande',points:['Sin ال: es solo un grupo de palabras, no una frase']},
    {target:'هذا كتاب.',meaning:'Esto es un libro.',points:['هذا (masculino) / هذه (femenino)']},
  ]}),
  itemLesson({id:'arabic-questions-02',title:'Preguntas y estructura · 2 · Preguntas con هل',description:'Preguntar sí/no con هل y negar la frase sin verbo con لست.',introText:'Para una pregunta de sí o no se pone هل delante: هل أنت طالب؟ Para negar una frase sin verbo se usa ليس: لستُ = no soy. Fíjate en que ؟ y ، se escriben al revés que en español.',items:[
    {target:'هل أنت طالب؟',meaning:'¿Eres estudiante?',points:['هل = partícula de pregunta sí/no','A una mujer: هل أنتِ طالبة؟']},
    {target:'نعم، أنا طالب.',meaning:'Sí, soy estudiante.'},
    {target:'لا، لست طالبًا.',meaning:'No, no soy estudiante.',points:['لستُ = no soy','Tras ليس el sustantivo toma -an: طالبًا']},
    {target:'ما هذا؟',meaning:'¿Qué es esto?',points:['ما = qué (ante sustantivo o pronombre)']},
    {target:'أين الحمّام؟',meaning:'¿Dónde está el baño?',points:['أين = dónde','Sin verbo «estar»']},
  ]}),
];
rebuildUnit('questions',{title:'Preguntas y estructura',description:'Frases sin verbo «ser», preguntas con هل y negación con ليس.',lessons:questionsLessons});

const timeLessons=[
  itemLesson({id:'arabic-time-01',title:'Números y tiempo · 1 · Números 1–5',description:'Los primeros números en árabe estándar.',introText:'Los números se escriben con palabras o con cifras. En gran parte del mundo árabe se usan las cifras ١ ٢ ٣ ٤ ٥.',items:[
    {target:'واحد',meaning:'uno (١)'},{target:'اثنان',meaning:'dos (٢)'},{target:'ثلاثة',meaning:'tres (٣)'},{target:'أربعة',meaning:'cuatro (٤)'},{target:'خمسة',meaning:'cinco (٥)'}]}),
  itemLesson({id:'arabic-time-02',title:'Números y tiempo · 2 · Números 6–10',description:'Del seis al diez.',introText:'Sigue la serie. Fíjate en ثمانية (ocho): tiene ث como «th» inglesa.',items:[
    {target:'ستة',meaning:'seis (٦)'},{target:'سبعة',meaning:'siete (٧)'},{target:'ثمانية',meaning:'ocho (٨)'},{target:'تسعة',meaning:'nueve (٩)'},{target:'عشرة',meaning:'diez (١٠)'}]}),
  itemLesson({id:'arabic-time-03',title:'Números y tiempo · 3 · Las cifras árabes',description:'Leer ٣, ٧ o ١٠ en precios, relojes y autobuses.',listenPrompt:'Escucha el número y elige la cifra',introText:'Aunque el texto va de derecha a izquierda, los números de varias cifras se leen de izquierda a derecha: ١٠ = 10, ٢٥ = 25. ٠ es el cero y ٥ (cinco) parece un círculo.',items:[
    {target:'٣',audio:'ثلاثة',meaning:'3 (tres)',points:['٣ parece una ٣ «con ganchos»']},
    {target:'٥',audio:'خمسة',meaning:'5 (cinco)',points:['٥ es un círculo: no lo confundas con el cero ٠']},
    {target:'٧',audio:'سبعة',meaning:'7 (siete)',points:['٧ = una V']},
    {target:'٨',audio:'ثمانية',meaning:'8 (ocho)',points:['٨ = una V al revés']},
    {target:'١٠',audio:'عشرة',meaning:'10 (diez)',points:['١ + ٠, de izquierda a derecha']},
  ]}),
  itemLesson({id:'arabic-time-04',title:'Números y tiempo · 4 · Días de la semana (1)',description:'De domingo a miércoles: casi todos salen de los números.',introText:'La semana empieza en domingo. الأحد viene de «uno», الاثنين de «dos», الثلاثاء de «tres» y الأربعاء de «cuatro».',items:[
    {target:'الأحد',meaning:'domingo',memory:'أحد = uno: primer día'},{target:'الاثنين',meaning:'lunes',memory:'اثنان = dos'},{target:'الثلاثاء',meaning:'martes',memory:'ثلاثة = tres'},{target:'الأربعاء',meaning:'miércoles',memory:'أربعة = cuatro'}]}),
  itemLesson({id:'arabic-time-05',title:'Números y tiempo · 5 · Días de la semana (2)',description:'Jueves, viernes, sábado, hoy y mañana.',introText:'الخميس viene de «cinco». الجمعة (viernes) es el día de reunión y descanso. Para «el lunes» se dice يوم الاثنين.',items:[
    {target:'الخميس',meaning:'jueves',memory:'خمسة = cinco'},{target:'الجمعة',meaning:'viernes'},{target:'السبت',meaning:'sábado'},{target:'اليوم',meaning:'hoy'},{target:'غدًا',meaning:'mañana (el día siguiente)'}]}),
  itemLesson({id:'arabic-time-06',title:'Números y tiempo · 6 · La hora',description:'Preguntar y decir la hora.',introText:'Para la hora se usan números ordinales en femenino: الساعة الثالثة = «la hora tercera» = las tres. والنصف = y media; والربع = y cuarto.',items:[
    {target:'كم الساعة؟',meaning:'¿Qué hora es?'},
    {target:'الساعة الواحدة.',meaning:'Es la una.'},
    {target:'الساعة الثالثة.',meaning:'Son las tres.',points:['ثلاثة (tres) → الثالثة (la tercera)']},
    {target:'الساعة الثالثة والنصف.',meaning:'Son las tres y media.'},
    {target:'الساعة الخامسة والربع.',meaning:'Son las cinco y cuarto.'},
  ]}),
];
rebuildUnit('time',{title:'Números, días y la hora',description:'Números del 1 al 10, cifras árabes, días de la semana y la hora.',lessons:timeLessons,reviewAfter:[3,6]});

const genderUsage='En árabe, «tú», los adjetivos y los verbos cambian según hables de un hombre o de una mujer.';
const bridgeLessons=[
  itemLesson({id:'arabic-reading-bridge-01',title:'Lectura guiada · 1 · Masculino y femenino',description:'أنتَ / أنتِ y la ة del femenino.',introText:'El árabe distingue «tú» hombre (أنتَ, anta) y «tú» mujer (أنتِ, anti). Sin vocales se escriben igual: أنت. El femenino suele terminar en ة: طالب → طالبة.',items:[
    {target:'أنتَ',meaning:'tú (a un hombre)',usage:genderUsage,sound:'[anta]'},
    {target:'أنتِ',meaning:'tú (a una mujer)',usage:genderUsage,sound:'[anti]'},
    {target:'طالب',meaning:'estudiante (hombre)'},
    {target:'طالبة',meaning:'estudiante (mujer)',points:['طالب + ة → طالبة']},
    {target:'كبيرة',meaning:'grande (femenino)',points:['كبير + ة → كبيرة']},
  ]}),
  itemLesson({id:'arabic-reading-bridge-02',title:'Lectura guiada · 2 · Concordancia',description:'El adjetivo concuerda en género con el sustantivo.',introText:'Si el sustantivo es femenino (casi siempre con ة), el adjetivo también lleva ة: الغرفة كبيرة, pero البيت كبير. هذا va con masculino y هذه con femenino.',items:[
    {target:'الغرفة كبيرة.',meaning:'La habitación es grande.',points:['غرفة (fem.) → كبيرة']},
    {target:'هو مكسيكي.',meaning:'Él es mexicano.'},
    {target:'هي مكسيكية.',meaning:'Ella es mexicana.',points:['مكسيكي + ة → مكسيكية']},
    {target:'هذا ولد.',meaning:'Este es un niño.'},
    {target:'هذه بنت.',meaning:'Esta es una niña.',points:['بنت es femenino aunque no lleve ة']},
  ]}),
];
rebuildUnit('reading-bridge',{title:'Lectura guiada: género y concordancia',description:'Masculino y femenino, أنتَ / أنتِ y la concordancia del adjetivo.',lessons:bridgeLessons});

const storyLessons=[
  itemLesson({id:'arabic-story-bridge-01',title:'Puente hacia las historias · 1',description:'Frases cortas que aparecen en cualquier historia.',introText:'Estas frases salen en casi todos los diálogos. Los imperativos (تعال، انتظر) están en masculino; a una mujer se dice تعالي، انتظري.',items:[
    {target:'ماذا تريد؟',meaning:'¿Qué quieres?',usage:'A una mujer: ماذا تريدين؟'},
    {target:'لا أعرف.',meaning:'No sé.'},
    {target:'تعال هنا!',meaning:'¡Ven aquí!',usage:'A una mujer: تعالي هنا!'},
    {target:'انتظر!',meaning:'¡Espera!',usage:'A una mujer: انتظري!'},
    {target:'من هناك؟',meaning:'¿Quién anda ahí?'},
  ]}),
  itemLesson({id:'arabic-story-bridge-02',title:'Puente hacia las historias · 2',description:'Reaccionar, pedir ayuda y animar.',introText:'Más frases breves de diálogo. Repite cada una en voz alta: así las reconocerás al leer.',items:[
    {target:'أنا هنا.',meaning:'Aquí estoy.'},
    {target:'هيا بنا!',meaning:'¡Vamos!'},
    {target:'ساعدني!',meaning:'¡Ayúdame!'},
    {target:'لا تخف.',meaning:'No tengas miedo.',usage:'A una mujer: لا تخافي.'},
    {target:'حسنًا.',meaning:'De acuerdo.',sound:'Se pronuncia [ḥasanan].'},
  ]}),
];
rebuildUnit('story-bridge',{title:'Puente hacia las historias',description:'Frases cortas de diálogo antes de abrir tu primera historia.',lessons:storyLessons});

// ── C3. Glosas falsas de verbos y presente con prefijos ──────────────────
const essentials=unit('essentials');
for(const [from,to] of [['ser / estar','era / estaba (pasado)'],['tener','tengo'],['ir','fue (él) · verbo «ir»'],['venir','vino (él) · verbo «venir»'],['hacer','hago']]){
  replaceText(essentials,from,to,{whole:true});
}
for(const [arabic,from,to] of [['كان','ser / estar','era / estaba (pasado)'],['عندي','tener','tengo'],['ذهب','ir','fue (él) · verbo «ir»'],['أتى','venir','vino (él) · verbo «venir»'],['أفعل','hacer','hago']]){
  for(const data of [essentials,unit('vocabulary')]){
    for(const activity of allActivities(data).filter(activity=>activity.answer===arabic))activity.explanation=`La forma escrita correcta es «${arabic}»: ${to}.`;
    relabel(data,arabic,from,to);
  }
}
const verbNotes={
  'كان':'En presente no hay verbo «ser/estar»: أنا طالب = soy estudiante. كان solo es pasado: كان الجو جميلًا = el tiempo era bonito.',
  'عندي':'عندي = «junto a mí» = tengo. عندك = tienes; عنده = tiene. Sinónimo formal: لديّ.',
  'ذهب':'El diccionario árabe usa el pasado de «él»: ذهب = fue. Presente: أذهب (voy), يذهب (va).',
  'أتى':'Pasado de «él»: أتى = vino. Presente: آتي (vengo), يأتي (viene).',
  'أفعل':'أفعل = hago (أ- = yo). يفعل = hace; فعل = hizo.',
  'سمع':'Pasado de «él» (سمع = oyó), que es la forma del diccionario. Presente: أسمع (oigo), يسمع (oye).',
  'رأى':'Pasado: رأى = vio. Presente: أرى (veo), يرى (ve).',
  'تكلم':'Pasado: تكلم = habló. Presente: أتكلم (hablo), يتكلم (habla).',
  'ضحك':'Pasado: ضحك = rio. Presente: أضحك (río), يضحك (ríe).',
  'بكى':'Pasado: بكى = lloró. Presente: أبكي (lloro), يبكي (llora).',
  'نام':'Pasado: نام = durmió. Presente: أنام (duermo), ينام (duerme).',
  'استيقظ':'Pasado: استيقظ = se despertó. Presente: أستيقظ (me despierto), يستيقظ (se despierta).',
  'أكل':'Pasado: أكل = comió. Presente: آكل (como), يأكل (come).',
  'شرب':'Pasado: شرب = bebió. Presente: أشرب (bebo), يشرب (bebe).',
};
for(const data of [essentials,unit('vocabulary')])for(const activity of allActivities(data).filter(activity=>activity.type==='teach_concept'&&verbNotes[activity.target]))activity.usage_note=verbNotes[activity.target];

const presentUsage='يـ = él, تـ = tú (hombre) o ella, أـ = yo, نـ = nosotros. A una mujer: تـ…ين (تكتبين).';
const present=itemLesson({id:'arabic-essentials-07',title:'Pronombres y verbos esenciales · 7 · El presente: أـ تـ يـ نـ',description:'Cómo cambia un verbo en presente según la persona.',introText:'El presente se forma con un prefijo: أكتب (escribo), تكتب (escribes / ella escribe), يكتب (él escribe), نكتب (escribimos). A una mujer se le dice تكتبين. Para negar se pone لا delante.',items:[
  {target:'أكتب',meaning:'escribo',points:['أـ = yo'],usage:presentUsage},
  {target:'تكتب',meaning:'escribes (a un hombre) / ella escribe',points:['تـ = tú (hombre) o ella'],usage:presentUsage},
  {target:'تكتبين',meaning:'escribes (a una mujer)',points:['تـ…ين = tú (mujer)'],usage:presentUsage},
  {target:'يكتب',meaning:'él escribe',points:['يـ = él'],usage:presentUsage},
  {target:'نكتب',meaning:'escribimos',points:['نـ = nosotros'],usage:presentUsage},
  {target:'لا أكتب',meaning:'no escribo',points:['لا + presente = negación'],usage:'لا va justo antes del verbo en presente.'},
]});
present.activities.push(
  {id:'arabic-essentials-07-production-blocks',type:'build_with_blocks',prompt:'Arma la frase: «Nosotros escribimos»',target:'Nosotros escribimos.',options:['نكتب.','نحن'],joiner:' ',answer:'نحن نكتب.',accepted_answers:['نحن نكتب.','نكتب.'],explanation:'نحن (nosotros) · نكتب (escribimos). El pronombre es opcional: el prefijo نـ ya dice «nosotros».',audio:'نحن نكتب.',slow_audio:'نحن نكتب.',image:null,writing_asset:null,tags:['production','blocks'],xp:15},
  {id:'arabic-essentials-07-production-typed',type:'typed_translation',prompt:'Escribe la forma de «yo» del verbo «يكتب»',target:'يكتب',instruction:'Escribe solo el verbo conjugado.',answer:'أكتب',accepted_answers:['أكتب','اكتب'],allow_minor_typos:false,explanation:'يـ (él) → أـ (yo): أكتب.',audio:'أكتب',slow_audio:'أكتب',image:null,writing_asset:null,tags:['production'],xp:20},
);
upsertLessons(essentials,[present],'arabic-essentials-test-08');
for(const activity of allActivities(essentials).filter(activity=>activity.type==='teach_concept'&&activity.target==='أنتَ / أنتِ'))activity.usage_note='أنتَ [anta] para un hombre, أنتِ [anti] para una mujer: أنتَ تكتب / أنتِ تكتبين (tú escribes). Sin vocales ambos se escriben أنت.';

// ── Vocabulario: traducciones erróneas y distractor también correcto ─────
const vocabulary=unit('vocabulary');
replaceText(vocabulary,'أرسل رسالة قصيرة. — Envía un mensaje corto.','أرسل رسالة قصيرة. — Envío un mensaje corto.');
replaceText(vocabulary,'هو صحي. — Él está sano.','هذا طعام صحي. — Es comida saludable.');
replaceText(vocabulary,'sano / relacionado con la salud (saludable)','saludable (comida, hábitos); para una persona: بصحة جيدة',{whole:true});
replaceText(vocabulary,'«صحي»: sano.','«صحي»: saludable.');
replaceText(vocabulary,'sano','saludable',{whole:true});
for(const activity of allActivities(vocabulary).filter(activity=>activity.target==='طفل'&&activity.type==='select_translation'))activity.options=activity.options.map(option=>option==='niño'?'niña':option);

// ── A1: traducciones engañosas y notas de género ─────────────────────────
replaceText(unit('a1-1-identity'),'buenas noches','buenas tardes / buenas noches (saludo)',{whole:true});
replaceText(unit('a1-1-identity'),'«مساء الخير»: buenas noches.','«مساء الخير»: buenas tardes / buenas noches (saludo).');
replaceText(unit('a1-1-identity'),'Hablo un poco de este idioma.','Hablo un poco de árabe.');
replaceText(unit('a1-1-routine'),'Me levanto a las siete.','Me despierto a las siete.');
replaceText(unit('a1-1-places'),'Siga recto.','Sigue recto.');
replaceText(unit('a1-2-time'),'Llego tarde.','Voy a llegar tarde.');
replaceText(unit('a1-2-health'),'Tome esto dos veces al día.','Esto se toma dos veces al día.');
replaceText(unit('a1-2-social'),'hora','tiempo (libre)',{whole:true});
replaceText(unit('a1-2-social'),'«وقت»: hora.','«وقت»: tiempo (libre).');
replaceText(unit('a2-1-ability'),'Aquí se puede tomar fotos.','Aquí se pueden tomar fotos.');
// Frase agramatical («لأنني فاتني…»): الحافلة es el sujeto de فاتتني.
for(const id of ['b1-1-cause-effect','b1-2-conditions'])replaceText(unit(id),'لأنني فاتني الحافلة، وصلت متأخرًا.','لأن الحافلة فاتتني، وصلت متأخرًا.');
const a1Notes={
  'a1-1-identity':{'ما اسمك؟':'ـكَ [-ka] al hablar con un hombre, ـكِ [-ki] con una mujer. Sin vocales se escribe igual: اسمك.','تشرّفت بلقائك.':'A un hombre: بلقائكَ; a una mujer: بلقائكِ. Se escribe igual sin vocales.'},
  'a1-1-people':{'كم عمرك؟':'عمرك: ـكَ a un hombre, ـكِ a una mujer.'},
  'a1-1-routine':Object.fromEntries(['يستيقظ','يعمل','يدرس','يأكل','يشرب','ينام'].map(verb=>[verb,`${verb} = forma de «él» en presente (يـ = él). Con «yo» cambia a أـ: ${{'يستيقظ':'أستيقظ','يعمل':'أعمل','يدرس':'أدرس','يأكل':'آكل','يشرب':'أشرب','ينام':'أنام'}[verb]}. El árabe no tiene infinitivo.`])),
  'a1-1-places':{'اذهب مستقيمًا.':'Imperativo a un hombre. A una mujer: اذهبي مستقيمًا. El árabe no tiene «usted»: se usa «tú» con todos.'},
  'a1-2-shopping':{'لدي نقد فقط.':'لديّ = عندي = tengo. لديّ es algo más formal.'},
  'a1-2-weather':{'خذ مظلة.':'A un hombre. A una mujer: خذي مظلة.'},
  'a1-2-social':{'هل تريد أن تأتي؟':'A un hombre. A una mujer: هل تريدين أن تأتي؟'},
  'a1-2-health':{'يؤخذ هذا مرتين في اليوم.':'Voz pasiva: «esto se toma». Lo dice el médico o el prospecto.'},
};
for(const [id,notes] of Object.entries(a1Notes))for(const activity of allActivities(unit(id)).filter(activity=>activity.type==='teach_concept'&&notes[activity.target]))activity.usage_note=notes[activity.target];

// ── C7. Más respuestas aceptadas y diálogos con margen ───────────────────
const accepted={
  'ما اسمك؟':['ما هو اسمك؟'],
  'أنا من المكسيك.':['من المكسيك.','أنا مكسيكي.','أنا مكسيكية.'],
  'من هذا؟':['من هذه؟','من هو؟','من هي؟'],
  'المفتاح على الطاولة.':['المفتاح فوق الطاولة.'],
  'أستيقظ في الساعة السابعة.':['أستيقظ الساعة السابعة.','أستيقظ في السابعة.','أستيقظ في الساعة 7.','أستيقظ في الساعة ٧.'],
  'أشرب الشاي في الصباح.':['أشرب الشاي صباحًا.','أشرب شايًا في الصباح.'],
  'أريد قليلًا من الأرز.':['أريد بعض الأرز.','أريد القليل من الأرز.'],
  'المحطة على اليسار.':['المحطة إلى اليسار.','المحطة على يسارك.'],
  'أذهب إلى المدرسة.':['أنا أذهب إلى المدرسة.'],
  'هل يمكنني الدفع بالبطاقة؟':['هل أستطيع الدفع بالبطاقة؟','هل يمكن الدفع بالبطاقة؟','هل يمكنني أن أدفع بالبطاقة؟'],
  'لدي نقد فقط.':['عندي نقد فقط.','لدي نقود فقط.','معي نقد فقط.'],
  'أصل في الثامنة.':['أصل في الساعة الثامنة.','سأصل في الثامنة.'],
  'هل يجب أن أغيّر وسيلة النقل؟':['هل يجب أن أغير القطار؟','هل علي أن أغير وسيلة النقل؟'],
  'لدي حساسية من البنسلين.':['عندي حساسية من البنسلين.','لدي حساسية للبنسلين.'],
  'أحتاج إلى معطف.':['أحتاج معطفًا.'],
  'أين نلتقي؟':['أين سنلتقي؟','أين نتقابل؟'],
  'لدي وقت بعد السادسة.':['عندي وقت بعد السادسة.','لدي وقت بعد الساعة السادسة.'],
};
// Escribir sin hamza (ا por أ/إ/آ) es la norma en el teclado cotidiano.
const withoutHamza=text=>text.replace(/[أإآ]/g,'ا');
const FREE_TYPES=new Set(['typed_translation','speak_and_transcribe','open_question']);
const widen=target=>{
  const base=target.accepted_answers||[target.answer];
  const extra=[...(accepted[target.answer]||[])];
  const all=[...base,...extra];
  target.accepted_answers=[...new Set([...all,...all.map(withoutHamza)])];
};
for(const id of course.levels.flatMap(level=>level.unitIds).filter(id=>id.startsWith('a1-'))){
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
// Claves de audio nuevas (sin grabación todavía).
const manifest=JSON.parse(fs.readFileSync(new URL('audio_manifest.json',dir),'utf8')).items;
const missing=new Set();
for(const id of course.levels.flatMap(level=>level.unitIds))for(const activity of allActivities(unit(id))){
  for(const key of [activity.audio,activity.slow_audio,...(activity.turns||[]).map(turn=>turn.audio)])if(key&&!manifest[key])missing.add(key);
}
console.log(JSON.stringify({changed,missingAudio:[...missing]},null,1));
