// Correcciones críticas de la auditoría del curso de coreano
// (docs/AUDITORIA_COREANO_2026-10-27.md). Idempotente: se puede volver a
// ejecutar sin duplicar lecciones ni respuestas.
import fs from 'node:fs';

const dir=new URL('../library/courses/Korean/',import.meta.url);
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
    activities.push(listen(`${id}-${n}-listen`,item,{prompt:kind==='sound'?'Escucha y elige la letra o símbolo correcto':'Escucha y elige la palabra o frase correcta',others:heard,index,explanation:`Escuchaste «${item.target}»: ${answer}.`}));
  });
  return {id,title,description,activities};
}
const reviewLesson=({id,title,lessons,isTest=false,count})=>{
  const pool=lessons.flatMap(lesson=>lesson.activities.filter(activity=>['select_translation','listening_choice'].includes(activity.type)));
  // Mezcla estable: alterna lecciones para no repetir el orden de enseñanza.
  const picked=[];for(let round=0;picked.length<count&&round<10;round++)for(const lesson of lessons){const list=lesson.activities.filter(activity=>['select_translation','listening_choice'].includes(activity.type));const activity=list[(round*2+(isTest?1:0))%list.length];if(activity&&!picked.some(item=>item.id===activity.id)&&picked.length<count)picked.push(activity);}
  const activities=picked.map((activity,index)=>({...activity,id:`${id}-${index+1}-${activity.type==='listening_choice'?'listen':'meaning'}`,options:placed(activity.answer,activity.options.filter(option=>option!==activity.answer),index*2+1)}));
  return {id,title,description:isTest?'Comprueba que dominas la unidad antes de avanzar.':'Repasa lo anterior antes de seguir.',...(isTest?{isTest:true}:{isReview:true}),activities:[intro(`${id}-intro`,title,isTest?'Responde sin ayudas. Necesitas el porcentaje mínimo para continuar.':'Repasa sin mirar las respuestas: así se fortalece la memoria.'),...activities]};
};
const upsertLessons=(data,lessons,beforeId)=>{
  for(const lesson of lessons){
    const existing=data.lessons.findIndex(item=>item.id===lesson.id);
    if(existing>=0){data.lessons[existing]=lesson;continue;}
    const at=data.lessons.findIndex(item=>item.id===beforeId);
    data.lessons.splice(at<0?data.lessons.length:at,0,lesson);
  }
};

// ── C1. Letras que faltaban: ㅐㅔㅒㅖ, tensas y diptongos ─────────────────
const reading=unit('reading');
const vowelsE=itemLesson({id:'korean-reading-08',title:'Sonidos y lectura · 8 · ㅐ ㅔ ㅒ ㅖ',description:'Las vocales «e» y «ye» que aparecen en 안녕하세요 y 예요.',kind:'sound',introText:'ㅐ y ㅔ hoy suenan casi igual: como la «e» española. Se distinguen al escribir, no al oído.',items:[
  {target:'ㅐ',audio:'애',sound:'e',explanation:'ㅐ: e. Hoy suena igual que ㅔ. Aparece en 해요 y 말해 주세요.',others:['a','o'],listenOthers:['ㅏ','ㅗ']},
  {target:'ㅔ',audio:'에',sound:'e (igual que ㅐ)',explanation:'ㅔ: e. Aparece en 안녕하세요 y 네.',others:['u','i'],listenOthers:['ㅜ','ㅣ']},
  {target:'ㅒ',audio:'얘',sound:'ye',explanation:'ㅒ: ye. Es poco frecuente.',others:['ya','yo'],listenOthers:['ㅑ','ㅛ']},
  {target:'ㅖ',audio:'예',sound:'ye (igual que ㅒ)',explanation:'ㅖ: ye. 예 también significa «sí» (formal). Tras consonante suele sonar «e»: 시계 [시게].',others:['yu','ya'],listenOthers:['ㅠ','ㅑ']},
]});
const tense=itemLesson({id:'korean-reading-09',title:'Sonidos y lectura · 9 · Consonantes tensas',description:'ㄲ ㄸ ㅃ ㅆ ㅉ: la serie tensa frente a la suave y la aspirada.',kind:'sound',introText:'Cada consonante tiene hasta tres versiones: suave (가), con aire (카) y tensa (까). La tensa se dice con la garganta apretada y sin soltar aire, como una «k» española muy firme.',items:[
  {target:'ㄲ',audio:'까',sound:'k tensa, sin aire',points:['가: suave','카: con aire','까: tensa, sin aire'],explanation:'ㄲ: k tensa. Compara 가 · 카 · 까.',others:['k con aire','entre k y g suave'],listenOthers:['ㄱ','ㅋ']},
  {target:'ㄸ',audio:'따',sound:'t tensa, sin aire',points:['다: suave','타: con aire','따: tensa, sin aire'],explanation:'ㄸ: t tensa. Compara 다 · 타 · 따.',others:['t con aire','entre t y d suave'],listenOthers:['ㄷ','ㅌ']},
  {target:'ㅃ',audio:'빠',sound:'p tensa, sin aire',points:['바: suave','파: con aire','빠: tensa, sin aire'],explanation:'ㅃ: p tensa. Aparece en 오빠 y 바빠요.',others:['p con aire','entre p y b suave'],listenOthers:['ㅂ','ㅍ']},
  {target:'ㅆ',audio:'싸',sound:'s tensa, más fuerte',points:['사: s suave','싸: s tensa'],explanation:'ㅆ: s tensa. Aparece en 있어요 y 싸요 (es barato).',others:['s suave','ch con aire'],listenOthers:['ㅅ','ㅈ']},
  {target:'ㅉ',audio:'짜',sound:'ch tensa, sin aire',points:['자: suave','차: con aire','짜: tensa, sin aire'],explanation:'ㅉ: ch tensa. Aparece en 짜요 (está salado).',others:['ch con aire','s tensa, más fuerte'],listenOthers:['ㅈ','ㅊ']},
]});
const diphthongs=itemLesson({id:'korean-reading-10',title:'Sonidos y lectura · 10 · Diptongos',description:'ㅘ ㅝ ㅙ ㅞ ㅚ ㅟ ㅢ: dos vocales en un solo sonido.',kind:'sound',introText:'Los diptongos juntan dos vocales: ㅗ + ㅏ = ㅘ «wa». ㅙ, ㅞ y ㅚ hoy suenan los tres «we».',items:[
  {target:'ㅘ',audio:'와',sound:'wa',points:['ㅗ + ㅏ = ㅘ'],explanation:'ㅘ: wa (ㅗ + ㅏ). Aparece en 와요 (viene) y 화장실.',others:['wo','wi'],listenOthers:['ㅝ','ㅟ']},
  {target:'ㅝ',audio:'워',sound:'wo',points:['ㅜ + ㅓ = ㅝ'],explanation:'ㅝ: wo (ㅜ + ㅓ). Aparece en 뭐 (qué).',others:['wa','ŭi'],listenOthers:['ㅘ','ㅢ']},
  {target:'ㅙ',audio:'왜',sound:'we',points:['ㅗ + ㅐ = ㅙ'],explanation:'ㅙ: we. Aparece en 왜 (por qué) y 괜찮아요.',others:['wa','wi'],listenOthers:['ㅘ','ㅟ']},
  {target:'ㅞ',audio:'웨',sound:'we (igual que ㅙ)',points:['ㅜ + ㅔ = ㅞ'],explanation:'ㅞ: we. Es poco frecuente.',others:['wo','wi'],listenOthers:['ㅝ','ㅟ']},
  {target:'ㅚ',audio:'외',sound:'we (igual que ㅙ y ㅞ)',points:['ㅗ + ㅣ = ㅚ, pero hoy suena «we»'],explanation:'ㅚ: we. Aparece en 회색 (gris) y 외국 (extranjero).',others:['wa','wo'],listenOthers:['ㅘ','ㅝ']},
  {target:'ㅟ',audio:'위',sound:'wi',points:['ㅜ + ㅣ = ㅟ'],explanation:'ㅟ: wi. Aparece en 위 (arriba) y 귀 (oreja).',others:['we','wa'],listenOthers:['ㅚ','ㅘ']},
  {target:'ㅢ',audio:'의',sound:'ŭi: «u» sin redondear + i',points:['Al inicio: [의] — 의사 (médico)','Tras consonante: [이] — 희망 [히망]','Como partícula «de»: [에] — 나의 [나에]'],explanation:'ㅢ: ŭi. Cambia según la posición: [의], [이] o [에].',others:['wi','we'],listenOthers:['ㅟ','ㅚ']},
]});

// ── C2. Cómo suenan los bloques juntos ───────────────────────────────────
const linking=itemLesson({id:'korean-reading-11',title:'Sonidos y lectura · 11 · Cómo suenan los bloques juntos',description:'Encadenamiento, nasalización, ㅎ débil, tensificación y sonidos finales.',kind:'sound',introText:'No se lee bloque por bloque: los sonidos se unen. Si lees 한국어 como [한-국-어] no reconocerás lo que oyes; se dice [한구거].',items:[
  {target:'한국어',sound:'[한구거]',explanation:'Encadenamiento: si la sílaba siguiente empieza por ㅇ, el batchim pasa a ella. 한국어 → [한구거].',points:['국 + 어 → 구거','Pasa con todos los batchim: 이름이 [이르미], 음식이 [음시기]'],others:['[한국어]','[항구거]']},
  {target:'이름이',audio:'이름이',sound:'[이르미]',explanation:'Encadenamiento: la ㅁ de 름 pasa a 이. 이름이 → [이르미].',others:['[이름이]','[이른미]']},
  {target:'감사합니다',sound:'[감사함니다]',explanation:'Nasalización: ㅂ delante de ㄴ suena ㅁ. 합니다 → [함니다].',points:['ㅂ + ㄴ → ㅁ + ㄴ','También: 입니다 [임니다]'],others:['[감사합니다]','[감사한니다]']},
  {target:'좋아요',sound:'[조아요]',explanation:'ㅎ débil: entre vocales o tras ㄴ/ㄹ/ㅁ, la ㅎ casi desaparece. 좋아요 → [조아요].',others:['[좋아요]','[초아요]']},
  {target:'괜찮아요',sound:'[괜차나요]',explanation:'La ㅎ de ㄶ desaparece y la ㄴ se encadena: 괜찮아요 → [괜차나요].',others:['[괜찬하요]','[괜찰아요]']},
  {target:'학교',sound:'[학꾜]',explanation:'Tensificación: tras un batchim ㄱ, ㄷ o ㅂ, la consonante siguiente se vuelve tensa. 학교 → [학꾜].',others:['[학교]','[하교]']},
  {target:'없어요',audio:'없어요',sound:'[업써요]',explanation:'Batchim doble ㅄ: suena ㅂ, y la ㅅ pasa (tensa) a la sílaba siguiente. 없어요 → [업써요].',points:['ㄶ en 괜찮아요: [괜차나요]','ㄺ en 읽어요: [일거요]'],others:['[어써요]','[없어요]']},
  {target:'부엌',sound:'[부억]',explanation:'Al final de sílaba solo hay 7 sonidos (ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅇ). ㅋ final suena ㄱ: 부엌 → [부억]; 옷 → [옫].',others:['[부엌]','[부어크]']},
]});
// En el bloque de pronunciación se elige la palabra que se oye.
linking.activities.filter(activity=>activity.type==='listening_choice').forEach(activity=>{activity.prompt='Escucha y elige la palabra que oyes';});
upsertLessons(reading,[vowelsE,tense,diphthongs,linking],'korean-reading-test-10');
// La prueba de lectura también comprueba lo nuevo.
const readingTest=reading.lessons.find(lesson=>lesson.id==='korean-reading-test-10');
const testExtra=reviewLesson({id:'korean-reading-test-10-extra',title:'',lessons:[vowelsE,tense,diphthongs,linking],isTest:true,count:8}).activities.slice(1).map((activity,index)=>({...activity,id:`korean-reading-test-10-new-${index+1}`}));
readingTest.activities=[...readingTest.activities.filter(activity=>!activity.id.startsWith('korean-reading-test-10-new-')),...testExtra];

// ── C3. Conjugar en presente cortés y negar con 안 ───────────────────────
const essentials=unit('essentials');
const usage='-아요/-어요 afirma, pregunta (con entonación de pregunta) o pide con cortesía según cómo lo digas.';
const conjugation=itemLesson({id:'korean-essentials-10',title:'Pronombres y verbos esenciales · 10 · El presente: -아요 / -어요',description:'La regla que convierte 가다 en 가요 y 먹다 en 먹어요.',introText:'Los verbos se aprenden con -다 (가다, 먹다). Para hablar: quita -다 y mira la última vocal. ㅏ u ㅗ → -아요; cualquier otra → -어요; 하다 → 해요.',items:[
  {target:'가요',meaning:'voy / va',explanation:'가다 → 가- → 가 + 아요 → 가요 (las dos «a» se funden).',points:['Quita -다: 가-','Última vocal ㅏ → -아요','가 + 아요 → 가요'],usage},
  {target:'와요',meaning:'vengo / viene',explanation:'오다 → 오- → 오 + 아요 → 와요 (ㅗ + ㅏ = ㅘ).',points:['Última vocal ㅗ → -아요','오 + 아 → 와'],usage},
  {target:'먹어요',meaning:'como / come',explanation:'먹다 → 먹- → 먹 + 어요 → 먹어요 (vocal ㅓ: no es ㅏ ni ㅗ).',points:['Última vocal ㅓ → -어요','Se pronuncia [머거요]'],usage},
  {target:'마셔요',meaning:'bebo / bebe',explanation:'마시다 → 마시- → 마시 + 어요 → 마셔요 (ㅣ + ㅓ = ㅕ).',points:['Última vocal ㅣ → -어요','시 + 어 → 셔'],usage},
  {target:'해요',meaning:'hago / hace',explanation:'하다 siempre se convierte en 해요. 공부하다 → 공부해요 (estudio).',points:['하다 → 해요','공부하다 → 공부해요','일하다 → 일해요'],usage},
  {target:'안 먹어요',meaning:'no como / no come',explanation:'안 + verbo = negación: 안 가요 (no voy), 안 먹어요 (no como).',points:['안 va justo antes del verbo','고기를 안 먹어요 = No como carne'],usage:'Con verbos en 하다 se pone entre el sustantivo y 해요: 공부 안 해요.'},
]});
conjugation.activities.push(
  {id:'korean-essentials-10-production-blocks',type:'build_with_blocks',prompt:'Arma la frase: «No como carne»',target:'No como carne.',options:['안','먹어요.','고기를'],joiner:' ',answer:'고기를 안 먹어요.',accepted_answers:['고기를 안 먹어요.','고기 안 먹어요.'],explanation:'고기를 (carne + objeto) · 안 (no) · 먹어요 (como).',audio:'고기를 안 먹어요.',slow_audio:'고기를 안 먹어요.',image:null,writing_asset:null,tags:['production','blocks'],xp:15},
  {id:'korean-essentials-10-production-typed',type:'typed_translation',prompt:'Escribe la forma con -요 de «하다»',target:'하다',instruction:'Escribe solo la forma conjugada.',answer:'해요',accepted_answers:['해요'],allow_minor_typos:false,explanation:'하다 siempre se convierte en 해요.',audio:'해요',slow_audio:'해요',image:null,writing_asset:null,tags:['production'],xp:20},
);
upsertLessons(essentials,[conjugation],'korean-essentials-test-12');

// ── C4. La unidad «time» repetía survival: ahora enseña números nativos,
// contadores, la hora, las fechas y los precios ──────────────────────────
const time=unit('time');
const timeLessons=[
  itemLesson({id:'korean-time-01',title:'Números y tiempo · 1 · Números nativos 1–5',description:'La segunda serie de números: para contar, la edad y las horas.',introText:'El coreano tiene dos series de números. Ya conoces 일, 이, 삼 (sino-coreanos: fechas, minutos, precios). Ahora 하나, 둘, 셋: los nativos, para contar cosas, personas, la edad y la hora.',items:[
    {target:'하나',meaning:'uno (nativo)'},{target:'둘',meaning:'dos (nativo)'},{target:'셋',meaning:'tres (nativo)'},{target:'넷',meaning:'cuatro (nativo)'},{target:'다섯',meaning:'cinco (nativo)'}]}),
  itemLesson({id:'korean-time-02',title:'Números y tiempo · 2 · Números nativos 6–10',description:'Del seis al diez con la serie nativa.',introText:'Sigue la serie nativa. Fíjate en 열 (diez): es la base de 열한 시 (las once) y 열두 시 (las doce).',items:[
    {target:'여섯',meaning:'seis (nativo)'},{target:'일곱',meaning:'siete (nativo)'},{target:'여덟',meaning:'ocho (nativo)',sound:'Se pronuncia [여덜].'},{target:'아홉',meaning:'nueve (nativo)'},{target:'열',meaning:'diez (nativo)'}]}),
  itemLesson({id:'korean-time-03',title:'Números y tiempo · 3 · Contar cosas y personas',description:'Contadores 개 (cosas) y 명 (personas).',introText:'Para contar se añade un contador: 개 para cosas, 명 para personas. Delante del contador, 하나 → 한, 둘 → 두, 셋 → 세, 넷 → 네.',items:[
    {target:'한 개',meaning:'una cosa',points:['하나 → 한 delante del contador']},{target:'두 명',meaning:'dos personas',points:['둘 → 두','명 = contador de personas']},{target:'세 개',meaning:'tres cosas',points:['셋 → 세']},{target:'네 명',meaning:'cuatro personas',points:['넷 → 네']},{target:'몇 개예요?',meaning:'¿Cuántos hay?',points:['몇 = cuántos']}]}),
  itemLesson({id:'korean-time-04',title:'Números y tiempo · 4 · La hora',description:'Horas con números nativos y minutos con sino-coreanos.',introText:'La hora mezcla las dos series: la hora va con números nativos (세 시) y los minutos con sino-coreanos (삼십 분).',items:[
    {target:'지금 몇 시예요?',meaning:'¿Qué hora es ahora?',points:['지금 = ahora','몇 시 = qué hora (ya lo viste en survival)']},{target:'한 시예요.',meaning:'Es la una.'},{target:'세 시 삼십 분이에요.',meaning:'Son las tres y treinta.',points:['세 시: nativo','삼십 분: sino-coreano']},{target:'세 시 반이에요.',meaning:'Son las tres y media.',points:['반 = media']},{target:'열두 시예요.',meaning:'Son las doce.'}]}),
  itemLesson({id:'korean-time-05',title:'Números y tiempo · 5 · Meses y fechas',description:'월 y 일 con números sino-coreanos, y dos excepciones.',introText:'Meses y días usan números sino-coreanos: 일월 (enero), 이십칠 일 (día 27). Ojo: junio es 유월 y octubre es 시월.',items:[
    {target:'일월',meaning:'enero'},{target:'유월',meaning:'junio',points:['No 육월: se dice 유월']},{target:'시월',meaning:'octubre',points:['No 십월: se dice 시월']},{target:'며칠이에요?',meaning:'¿Qué día (del mes) es?'},{target:'오늘은 시월 이십칠 일이에요.',meaning:'Hoy es 27 de octubre.'}]}),
  itemLesson({id:'korean-time-06',title:'Números y tiempo · 6 · Precios',description:'원, 천 y 만 para pagar y preguntar precios.',introText:'Los precios usan números sino-coreanos y 원 (won). Ojo: 10 000 es 만 (no «diez mil»), así que 50 000 = 오만 원.',items:[
    {target:'얼마예요?',meaning:'¿Cuánto cuesta?'},{target:'천 원',meaning:'1 000 wones'},{target:'만 원',meaning:'10 000 wones',points:['만 = 10 000']},{target:'오천 원이에요.',meaning:'Son 5 000 wones.'},{target:'너무 비싸요.',meaning:'Es demasiado caro.'}]}),
];
time.title='Números, horas, fechas y precios';
time.description='Números nativos, contadores, la hora, el calendario y los precios.';
time.lessons=[...timeLessons.slice(0,3),reviewLesson({id:'korean-time-review-03',title:'Repaso breve 1',lessons:timeLessons.slice(0,3),count:8}),...timeLessons.slice(3),reviewLesson({id:'korean-time-review-06',title:'Repaso breve 2',lessons:timeLessons.slice(3),count:8}),reviewLesson({id:'korean-time-test-16',title:'Prueba · Números, horas, fechas y precios',lessons:timeLessons,isTest:true,count:18})];
const course=load('course.json');
const timeEntry=course.units.find(entry=>entry.id==='time');
Object.assign(timeEntry,{title:time.title,description:time.description});

// ── C5. Ejemplos en forma de diccionario → presente cortés ───────────────
const vocabulary=unit('vocabulary');
for(const [from,to] of [
  ['나는 학교에 가다. — Yo voy a la escuela.','저는 학교에 가요. — Voy a la escuela.'],
  ['친구가 우리 집에 오다. — Un amigo viene a nuestra casa.','친구가 우리 집에 와요. — Un amigo viene a nuestra casa.'],
  ['나는 책을 보다. — Yo veo un libro.','저는 책을 봐요. — Miro un libro.'],
  ['이 가방은 오래되다. — Esta bolsa es vieja.','이 가방은 오래됐어요. — Esta bolsa es vieja.'],
  ['이 문제는 쉽다. — Este problema es fácil.','이 문제는 쉬워요. — Este problema es fácil.'],
  ['이 책은 어렵다. — Este libro es difícil.','이 책은 어려워요. — Este libro es difícil.'],
  ['나는 빵 그리고 우유를 먹다. — Yo como pan y leche.','빵을 먹어요. 그리고 우유를 마셔요. — Como pan. Y bebo leche.'],
  ['비가 오다. 하지만 우리는 가다. — Llueve. Pero nosotros vamos.','비가 와요. 하지만 우리는 가요. — Llueve. Pero nosotros vamos.'],
  ['피곤하다. 그래서 일찍 자다. — Estoy cansado. Así que me acuesto temprano.','피곤해요. 그래서 일찍 자요. — Estoy cansado. Así que me acuesto temprano.'],
  ['나는 또 책을 읽다. — Yo leo el libro otra vez.','저는 책을 또 읽어요. — Leo el libro otra vez.'],
  ['먼저 숙제를 하다. — Primero hago la tarea.','먼저 숙제를 해요. — Primero hago la tarea.'],
  ['나중에 전화하다. — Llamo después.','나중에 전화해요. — Llamo después.'],
  ['친구와 같이 가다. — Voy con un amigo.','친구와 같이 가요. — Voy con un amigo.'],
  ['나는 혼자 공부하다. — Yo estudio solo.','저는 혼자 공부해요. — Estudio solo.'],
  // C6. Traducciones erróneas en vocabulary
  ['버터를 바꿔요. — Pongo mantequilla.','빵에 버터를 발라요. — Unto mantequilla en el pan.'],
  ['신발이 새로워요. — Los zapatos son nuevos.','새 신발이에요. — Son zapatos nuevos.'],
  ['나는 새 신발이 있다. — Tengo zapatos nuevos.','이 생각은 새로워요. — Esta idea es novedosa. Para «nuevo» delante de un sustantivo se usa 새: 새 신발 (zapatos nuevos).'],
])replaceText(vocabulary,from,to);
for(const activity of allActivities(vocabulary).filter(activity=>activity.target==='새롭다'||activity.answer==='새롭다')){
  if(activity.meaning==='nuevo')activity.meaning='novedoso, fresco';
  if(activity.answer==='nuevo'){activity.options=activity.options.map(option=>option==='nuevo'?'novedoso, fresco':option);activity.answer='novedoso, fresco';activity.explanation='novedoso, fresco';}
  if(activity.explanation?.startsWith('La forma escrita correcta es «새롭다»'))activity.explanation='La forma escrita correcta es «새롭다»: novedoso, fresco.';
  activity.explanation=activity.explanation?.replace(/^nuevo\. /,'novedoso, fresco. ');
  activity.sound_hint=activity.sound_hint?.replace(/^nuevo\. /,'novedoso, fresco. ');
  (activity.word_breakdown||[]).forEach(part=>{if(part.text==='새롭')part.meaning='novedoso (raíz adjetival)';});
}
for(const [from,to] of [['Mudanza / traslado de residencia','Migración / traslado a otro país o región'],['Paquete de mudanza','Paquete de traslado (para migrar)'],['El lugar al que quiero mudarme','El lugar al que quiero irme a vivir']])replaceText(vocabulary,from,to,{whole:true});
replaceText(vocabulary,'La forma escrita correcta es «이주»: Mudanza / traslado de residencia.','La forma escrita correcta es «이주»: Migración / traslado a otro país o región.');
replaceText(vocabulary,'La forma escrita correcta es «이주 패키지»: Paquete de mudanza.','La forma escrita correcta es «이주 패키지»: Paquete de traslado (para migrar).');
replaceText(vocabulary,'La forma escrita correcta es «이주하고 싶은 곳»: El lugar al que quiero mudarme.','La forma escrita correcta es «이주하고 싶은 곳»: El lugar al que quiero irme a vivir.');
for(const activity of allActivities(vocabulary))for(const part of activity.word_breakdown||[])if(part.text==='이주'){part.meaning='migración, traslado a otro lugar';part.note='«Mudarse de casa» es 이사하다; 이주 es cambiar de país o región.';}

// C6. Puentes de lectura
const storyBridge=unit('story-bridge');
replaceText(storyBridge,'Es la longitud / Es un camino','Es un camino.',{whole:true});
replaceText(storyBridge,'Es la longitud.','Es un camino.',{whole:true});
replaceText(storyBridge,'«길이에요.»: Es la longitud.','«길이에요.»: Es un camino.');
for(const activity of allActivities(storyBridge).filter(activity=>activity.target==='길이에요.'&&activity.type==='teach_concept')){
  activity.usage_note='Respuesta breve para señalar algo: «(Esto) es un camino».';
  activity.context_note='길 (camino) + 이에요 (es). No confundir con 길이 (longitud), que se escribe igual pero aquí no tiene sentido.';
}
for(const activity of allActivities(storyBridge).filter(activity=>activity.target==='길이에요.'&&activity.word_breakdown?.length)){
  activity.word_breakdown=[{text:'길',meaning:'camino, sendero',note:'Termina en consonante (ㄹ).'},{text:'이에요',meaning:'es (después de consonante)',note:'Por eso 이에요 y no 예요. Se pronuncia [기리에요].'}];
}
const readingBridge=unit('reading-bridge');
for(const [from,to] of [['¿Ah, sí? / ¿Ah, tú?','¿Aru? (repite el nombre para confirmar)'],['¿No lo sé? / ¿No sé?','¿No lo sabe?'],['¿Bebe? / ¿Está bebiendo?','¿Me lo bebo?'],['Como / come / comen.','Coma.'],['¿Come? / ¿Estás comiendo?','¿(Lo) como?'],['Sí, como.','Sí, coma.']])replaceText(readingBridge,from,to,{whole:true});
for(const [from,to] of [['«아루?»: ¿Ah, sí? / ¿Ah, tú?','«아루?»: ¿Aru? (repite el nombre para confirmar)'],['«몰라요?»: ¿No lo sé? / ¿No sé?','«몰라요?»: ¿No lo sabe?'],['«마셔요?»: ¿Bebe? / ¿Está bebiendo?','«마셔요?»: ¿Me lo bebo?'],['«먹어요.»: Como / come / comen.','«먹어요.»: Coma.'],['«먹어요?»: ¿Come? / ¿Estás comiendo?','«먹어요?»: ¿(Lo) como?'],['«네, 먹어요.»: Sí, como.','«네, 먹어요.»: Sí, coma.']])replaceText(readingBridge,from,to);
for(const activity of allActivities(readingBridge)){
  if(activity.target==='아루?'&&activity.word_breakdown?.length)activity.word_breakdown=[{text:'아루',meaning:'Aru, un nombre propio',note:'Se repite el nombre con entonación de pregunta para confirmar.'},{text:'?',meaning:'entonación de pregunta',note:''}];
  for(const part of activity.word_breakdown||[])if(part.text==='-어요/-아요 → -셔요'){part.text='마시- + -어요 → 마셔요';part.meaning='ㅣ + ㅓ se contraen en ㅕ';part.note='No es el honorífico -시-: es solo la contracción.';}
  if(['마셔요.','마셔요?','먹어요.','먹어요?','네, 먹어요.'].includes(activity.target)&&activity.type==='teach_concept')activity.usage_note=usage;
}

// ── I4. Las fichas de regla usaban sílabas reales como si fueran palabras ──
const ruleCards={'가':['ㄱ + ㅏ → 가','Una consonante y una vocal forman un bloque: ㄱ + ㅏ = 가.'],'너':['ㄴ + ㅓ → 너','Con vocal vertical (ㅓ), la consonante va a la izquierda: se lee de izquierda a derecha.'],'도':['ㄷ + ㅗ → 도','Con vocal horizontal (ㅗ), la consonante va arriba: se lee de arriba abajo.'],'한':['ㅎ + ㅏ + ㄴ → 한','La consonante final, abajo, se llama batchim: ㅎ + ㅏ + ㄴ = 한.']};
const oldRules={'가':'Una consonante y una vocal forman un bloque.','너':'Se lee de izquierda a derecha dentro del bloque.','도':'La consonante se coloca arriba o a la izquierda.','한':'La consonante final se llama batchim.'};
for(const [unitId,prefix] of [['survival','korean-survival-12-'],['essentials','korean-essentials-07-']]){
  const data=unit(unitId);
  for(const activity of allActivities(data).filter(activity=>activity.id.startsWith(prefix))){
    // Son fichas de regla (teaching_kind 'rule'): el objetivo sigue siendo la
    // sílaba y la fórmula va en el enunciado y en memory_hint. Una versión
    // anterior de este script ponía la fórmula como objetivo; se deshace aquí.
    const shown=String(activity.target||'').includes('→')?activity.target.split('→').pop().trim():activity.target;
    const syllable=activity.answer&&ruleCards[activity.answer]&&activity.type==='listening_choice'?activity.answer:shown;
    const card=ruleCards[syllable];if(!card)continue;
    if(activity.type==='teach_concept'){activity.target=syllable;activity.audio=syllable;activity.slow_audio=syllable;activity.explanation=card[1];}
    if(activity.type==='select_translation'){activity.target=syllable;activity.prompt=`¿Qué regla muestra «${syllable}» (${card[0].replace(' → '+syllable,'')})?`;}
    if(activity.type==='listening_choice')activity.explanation=`Escuchaste «${syllable}». ${card[1]}`;
  }
  for(const [syllable,text] of Object.entries(oldRules))replaceText(data,text,ruleCards[syllable][1],{whole:true});
}

// ── C7. Más respuestas aceptadas y diálogos con margen ───────────────────
const accepted={
  '이름이 뭐예요?':['이름이 무엇이에요?','성함이 어떻게 되세요?'],
  '저는 멕시코에서 왔어요.':['멕시코에서 왔어요.','저는 멕시코 사람이에요.','멕시코 사람이에요.'],
  '누구예요?':['누구세요?','이 사람은 누구예요?'],
  '몇 살이에요?':['몇 살이세요?','나이가 어떻게 되세요?'],
  '열쇠는 탁자 위에 있어요.':['열쇠가 탁자 위에 있어요.','열쇠는 테이블 위에 있어요.'],
  '제 방은 작아요.':['제 방이 작아요.','방이 작아요.'],
  '저는 일곱 시에 일어나요.':['일곱 시에 일어나요.','저는 7시에 일어나요.','7시에 일어나요.'],
  '저는 오후에 공부해요.':['오후에 공부해요.'],
  '밥을 조금 주세요.':['밥 조금 주세요.'],
  '역은 왼쪽에 있어요.':['역이 왼쪽에 있어요.','왼쪽에 있어요.'],
  '저는 학교에 가요.':['학교에 가요.'],
  '여덟 시에 도착해요.':['8시에 도착해요.','여덟시에 도착해요.'],
  '어디에서 만날까요?':['어디서 만날까요?','어디에서 만나요?'],
  '여섯 시 이후에 시간이 있어요.':['6시 이후에 시간이 있어요.','여섯 시 후에 시간이 있어요.'],
  '카드로 결제할 수 있어요?':['카드로 계산할 수 있어요?','카드 돼요?'],
  '현금만 있어요.':['저는 현금만 있어요.'],
  '페니실린 알레르기가 있어요.':['저는 페니실린 알레르기가 있어요.','페니실린에 알레르기가 있어요.'],
  '코트가 필요해요.':['코트 필요해요.'],
};
const FREE_TYPES=new Set(['typed_translation','speak_and_transcribe','open_question']);
const widen=target=>{const extra=accepted[target.answer];if(!extra)return;target.accepted_answers=[...new Set([...(target.accepted_answers||[target.answer]),...extra])];};
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

// ── Audio que faltaba en el manifiesto: «무엇» ───────────────────────────
// No hay grabación; la app usará la voz del dispositivo hasta generarla.

// ── Guardar ────────────────────────────────────────────────────────────
const changed=[];
for(const [name,file] of files){
  const after=JSON.stringify(file.data,null,2)+'\n';
  if(after!==file.before){fs.writeFileSync(file.url,after);changed.push(name);}
}
console.log(JSON.stringify({changed},null,1));
