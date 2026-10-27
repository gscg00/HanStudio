// Correcciones críticas de la auditoría del curso de chino
// (docs/AUDITORIA_CHINO_2026-10-27.md). Idempotente: se puede volver a
// ejecutar sin duplicar lecciones ni respuestas.
import fs from 'node:fs';

const dir=new URL('../library/courses/Chinese/',import.meta.url);
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
// Cambia la traducción de un elemento (respuesta, opciones y explicaciones).
function fixMeaning(data,target,from,to){
  replaceText(data,from,to,{whole:true});
  replaceText(data,`«${target}» significa «${from}».`,`«${target}» significa «${to}».`);
  replaceText(data,`«${target}»: ${from}`,`«${target}»: ${to}`);
}

// ── Plantillas de actividades (mismo formato que el resto del curso) ──────
// Los elementos en caracteres llevan pinyin: visible al aprender, oculto
// (con botón «Mostrar pinyin») al practicar.
const withPinyin=(activity,item,mode)=>item.pinyin?{...activity,pinyin:item.pinyin,pinyin_mode:mode}:activity;
const teach=(id,item)=>withPinyin({id,type:'teach_concept',prompt:'Aprende y escucha',target:item.target,options:[],answer:'',explanation:item.explanation||'',audio:item.audio||item.target,slow_audio:item.audio||item.target,image:null,writing_asset:null,tags:item.tags||[],xp:2,gradable:false,meaning:item.meaning||'',sound_hint:item.sound||'',memory_hint:item.memory||'',teaching_points:item.points||[],group_hint:'',word_breakdown:item.breakdown||[],usage_note:item.usage||'',context_note:'',audio_examples:[]},item,item.teachMode||'visible');
const placed=(answer,others,index)=>{const list=[...others];list.splice(index%3,0,answer);return list;};
const choice=(id,item,{prompt,answer,others,index})=>withPinyin({id,type:'select_translation',prompt,target:item.target,options:placed(answer,others,index),answer,explanation:item.explanation||answer,audio:item.audio||item.target,slow_audio:item.audio||item.target,image:null,writing_asset:null,tags:item.tags||[],xp:10},item,'hidden');
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
    activities.push(listen(`${id}-${n}-listen`,item,{prompt:kind==='sound'?'Escucha y elige la letra o símbolo correcto':'Escucha la pronunciación y elige los caracteres correctos',others:heard,index,explanation:`Escuchaste «${item.target}»: ${answer}.`}));
  });
  return {id,title,description,activities};
}
const reviewLesson=({id,title,lessons,isTest=false,count})=>{
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
const course=load('course.json');
const setUnitInfo=(id,title,description)=>{const data=unit(id);data.title=title;data.description=description;if(data.reward)data.reward.badge=title;Object.assign(course.units.find(entry=>entry.id===id),{title,description});};

// ── C1. Iniciales y finales que faltaban ─────────────────────────────────
const reading=unit('reading');
const initials=itemLesson({id:'chinese-reading-05',title:'Sonidos y lectura · 5 · m, f, n, l, h, z, c, s',description:'Las iniciales que faltaban para leer cualquier sílaba.',kind:'sound',introText:'m, f, n, l y s suenan casi como en español. Ojo con h (suena como una j suave) y con z y c (suenan «ts»).',items:[
  {target:'m',audio:'mā',sound:'m como en español',others:['ts con aire','j suave española'],listenOthers:['n','l']},
  {target:'f',audio:'fā',sound:'f como en español',others:['ts sin aire','r suave retrofleja'],listenOthers:['h','s']},
  {target:'n',audio:'nǐ',sound:'n como en español',others:['l como en español','m como en español'],listenOthers:['l','m']},
  {target:'l',audio:'lā',sound:'l como en español',others:['n como en español','r suave retrofleja'],listenOthers:['n','r']},
  {target:'h',audio:'hē',sound:'j suave española, en la garganta',points:['Nunca es muda','hǎo suena «jao», no «ao»'],others:['h muda','f como en español'],listenOthers:['f','x']},
  {target:'z',audio:'zī',sound:'ts sin aire, como en «pizza»',points:['No es la z española'],others:['ts con aire','s como en español'],listenOthers:['c','zh']},
  {target:'c',audio:'cí',sound:'ts con aire',points:['No es k ni s: cài suena «tsai» con aire'],others:['ts sin aire, como en «pizza»','k con aire'],listenOthers:['z','ch']},
  {target:'s',audio:'sī',sound:'s como en español',others:['sh con lengua atrás','ts con aire'],listenOthers:['sh','x']},
]});
const finals=itemLesson({id:'chinese-reading-06',title:'Sonidos y lectura · 6 · Finales que engañan',description:'e, la «i» zumbada, ian, ui, ü escondida, an/ang y er.',kind:'sound',introText:'Varias finales de pinyin no se leen como en español. Escucha cada una y compárala con lo que leerías tú.',items:[
  {target:'e',audio:'gē',sound:'vocal de fondo: ni «e» ni «o»',points:['gē, hē, kě: la boca casi cerrada y sin redondear'],others:['e española','i zumbada: «sss» sin abrir la boca'],listenOthers:['ian','ui']},
  {target:'zhi · chi · shi · ri',audio:'shī',sound:'i zumbada: la lengua se queda atrás',points:['shì no se lee «shi» española','La «i» solo alarga la consonante'],others:['i española','ien'],listenOthers:['zi · ci · si','ian']},
  {target:'zi · ci · si',audio:'sī',sound:'i zumbada: «sss» sin abrir la boca',points:['sì (cuatro) suena «sss», no «si»'],others:['i española','uei abreviado'],listenOthers:['zhi · chi · shi · ri','ui']},
  {target:'ian',audio:'qián',sound:'se lee «ien»',points:['qián (dinero) suena «chien»','diǎn (punto, hora) suena «dien»'],others:['se lee «ian»','i zumbada: la lengua se queda atrás'],listenOthers:['an · ang','ui']},
  {target:'ui',audio:'duì',sound:'uei abreviado',points:['duì (correcto) suena «duei»','shuǐ (agua) suena «shuei»'],others:['ui española','se lee «ien»'],listenOthers:['ian','e']},
  {target:'ju · qu · xu',audio:'qù',sound:'u con puntos: es ü',points:['Tras j, q, x e y, la u siempre es ü','qù (ir) suena con ü'],others:['u española','uei abreviado'],listenOthers:['e','ui']},
  {target:'an · ang',audio:'máng',sound:'an: n normal · ang: n de «tengo»',points:['sān (tres): an','máng (ocupado): ang, nasal al fondo'],others:['las dos iguales','se lee «ien»'],listenOthers:['ian','er']},
  {target:'er',audio:'èr',sound:'«ar» con la lengua curvada hacia atrás',points:['èr (dos)','Aparece también al final: 一点儿 yìdiǎnr'],others:['e española + r vibrante','i zumbada: la lengua se queda atrás'],listenOthers:['e','an · ang']},
]});
// C2. Cambios de tono (sandhi) y tono neutro
const sandhi=itemLesson({id:'chinese-reading-07',title:'Sonidos y lectura · 7 · Cambios de tono',description:'Tercer tono + tercer tono, 不, 一 y el tono neutro.',kind:'sound',introText:'El pinyin escribe el tono de cada sílaba sola, pero al hablar algunos cambian. Si no lo sabes, oirás «ní hǎo» y no lo reconocerás como 你好.',items:[
  {target:'你好',audio:'你好',pinyin:'nǐ hǎo',sound:'[ní hǎo]',explanation:'Dos terceros tonos seguidos: el primero se dice como segundo tono. 你好 → [ní hǎo].',points:['3.º + 3.º → 2.º + 3.º','El pinyin sigue escribiendo nǐ hǎo'],others:['[nǐ hǎo] con dos bajadas','[nì hào]']},
  {target:'很好',audio:'很好',pinyin:'hěn hǎo',sound:'[hén hǎo]',explanation:'Otra vez 3.º + 3.º: 很好 → [hén hǎo]. También 我很好 → [wǒ hén hǎo].',others:['[hěn hǎo] con dos bajadas','[hèn hāo]']},
  {target:'不是',audio:'不是',pinyin:'bú shì',sound:'[bú shì]',explanation:'不 (bù) delante de un 4.º tono pasa a 2.º tono: 不是 → [bú shì].',points:['不 + 4.º tono → bú','不对 [bú duì], 不要 [bú yào]'],others:['[bù shì]','[bū shì]']},
  {target:'不好',audio:'不好',pinyin:'bù hǎo',sound:'[bù hǎo]',explanation:'Delante de 1.º, 2.º o 3.er tono, 不 conserva su 4.º tono: 不好 [bù hǎo], 不忙 [bù máng].',others:['[bú hǎo]','[bū hǎo]']},
  {target:'一个',audio:'一个',pinyin:'yí ge',sound:'[yí ge]',explanation:'一 (yī) delante de un 4.º tono pasa a 2.º tono: 一个 → [yí ge].',points:['一 + 4.º tono → yí','一遍 [yí biàn], 一件 [yí jiàn]'],others:['[yī ge]','[yì ge]']},
  {target:'一天',audio:'一天',pinyin:'yì tiān',sound:'[yì tiān]',explanation:'Delante de 1.º, 2.º o 3.er tono, 一 pasa a 4.º tono: 一天 [yì tiān], 一点 [yìdiǎn].',points:['Al contar o al final conserva yī: 一, 第一 [dì yī]'],others:['[yī tiān]','[yí tiān]']},
  {target:'第一',audio:'第一',pinyin:'dì yī',sound:'[dì yī]',explanation:'Al contar, en ordinales, fechas y al final de la palabra, 一 conserva su 1.er tono: 第一 [dì yī].',others:['[dì yí]','[dì yì]']},
  {target:'谢谢',audio:'谢谢',pinyin:'xièxie',sound:'[xièxie]: la 2.ª sílaba es corta y sin tono',explanation:'Tono neutro: la sílaba sin marca (xie, ma, ba, de) se dice breve y ligera. 谢谢 = xiè + xie.',points:['吗, 呢, 吧, 的 y 了 casi siempre van en tono neutro','妈妈 māma, 爸爸 bàba'],others:['[xièxiè] con dos caídas','[xiēxie]']},
]});
sandhi.activities.filter(activity=>activity.type==='listening_choice').forEach(activity=>{activity.prompt='Escucha y elige la palabra que oyes';});
upsertLessons(reading,[initials,finals,sandhi],'chinese-reading-test-06');
const readingTest=reading.lessons.find(lesson=>lesson.id==='chinese-reading-test-06');
const testExtra=reviewLesson({id:'chinese-reading-test-06-extra',title:'',lessons:[initials,finals,sandhi],isTest:true,count:9}).activities.slice(1).map((activity,index)=>({...activity,id:`chinese-reading-test-06-new-${index+1}`}));
readingTest.activities=[...readingTest.activities.filter(activity=>!activity.id.startsWith('chinese-reading-test-06-new-')),...testExtra];

// ── C3. Gramática mínima: 是, 很 + adjetivo, 的, 也, 在, 都 ───────────────
const essentials=unit('essentials');
const grammar=itemLesson({id:'chinese-essentials-10',title:'Pronombres y verbos esenciales · 10 · Frases básicas',description:'是 frente a 很 + adjetivo, 的, 也, 在 y 都.',introText:'El verbo chino no cambia por persona ni por tiempo. Lo importante es el orden: sujeto + (也/都/不) + verbo + objeto.',items:[
  {target:'我是学生。',pinyin:'wǒ shì xuésheng',meaning:'Soy estudiante.',explanation:'是 une dos sustantivos: A 是 B. 我是学生, 他是老师.',points:['是 no cambia: 我是, 你是, 他是','No se usa para «estar» ni con adjetivos']},
  {target:'他不是老师。',pinyin:'tā bú shì lǎoshī',meaning:'Él no es maestro.',explanation:'Para negar, 不 va delante del verbo: 不是 [bú shì].',points:['不 + 是 → bú shì (cambio de tono)']},
  {target:'我很忙。',pinyin:'wǒ hěn máng',meaning:'Estoy ocupado.',explanation:'Con adjetivos no se usa 是: 我很忙 (no «我是忙»). 很 aquí casi no significa «muy»: solo une sujeto y adjetivo.',points:['Sujeto + 很 + adjetivo','我很好 [wǒ hén hǎo]: estoy bien']},
  {target:'我的书',pinyin:'wǒ de shū',meaning:'mi libro',explanation:'的 marca posesión: 我的 = mi, 你的 = tu, 他的 = su.',points:['Con familia se suele omitir: 我妈妈 (mi mamá)','的 va en tono neutro: de']},
  {target:'我也是学生。',pinyin:'wǒ yě shì xuésheng',meaning:'Yo también soy estudiante.',explanation:'也 (también) va siempre delante del verbo, nunca al final como en español.',points:['我也是 = yo también (lo soy)','我也喝茶 = yo también tomo té']},
  {target:'我在家。',pinyin:'wǒ zài jiā',meaning:'Estoy en casa.',explanation:'在 + lugar = estar en un lugar. No se usa 是 para la ubicación.',points:['他在学校 = está en la escuela','在哪里？ = ¿dónde está?']},
  {target:'我们都是朋友。',pinyin:'wǒmen dōu shì péngyou',meaning:'Todos somos amigos.',explanation:'都 (todos) va delante del verbo y se refiere al sujeto plural.',points:['Orden: sujeto + 都 + verbo']},
]});
grammar.activities.push(
  {id:'chinese-essentials-10-production-blocks',type:'build_with_blocks',prompt:'Arma la frase: «Yo también soy estudiante»',target:'Yo también soy estudiante.',options:['是','学生。','我','也'],joiner:'',answer:'我也是学生。',accepted_answers:['我也是学生。'],explanation:'我 (yo) · 也 (también, antes del verbo) · 是 (ser) · 学生 (estudiante).',audio:'我也是学生。',slow_audio:'我也是学生。',image:null,writing_asset:null,tags:['production','blocks'],xp:15},
  {id:'chinese-essentials-10-production-typed',type:'typed_translation',prompt:'Escribe en chino: «Estoy ocupado»',target:'Estoy ocupado.',instruction:'Recuerda: con adjetivos se usa 很, no 是.',answer:'我很忙。',accepted_answers:['我很忙。'],allow_minor_typos:false,explanation:'我很忙: sujeto + 很 + adjetivo.',audio:'我很忙。',slow_audio:'我很忙。',image:null,writing_asset:null,tags:['production'],xp:20},
);
upsertLessons(essentials,[grammar],'chinese-essentials-test-12');

// ── C4. «questions» repetía essentials: ahora enseña preguntas completas ──
const questions=unit('questions');
const qRule='En chino la palabra interrogativa se queda donde iría la respuesta: 你去哪里？ → 我去学校。 No se mueve al principio como en español.';
const questionLessons=[
  itemLesson({id:'chinese-questions-01',title:'Preguntas completas · 1',description:'Qué, quién, adónde, cuándo y cómo dentro de una frase.',introText:qRule,items:[
    {target:'这是什么？',pinyin:'zhè shì shénme',meaning:'¿Qué es esto?',points:['Respuesta: 这是书。 (Esto es un libro.)']},
    {target:'他是谁？',pinyin:'tā shì shéi',meaning:'¿Quién es él?',points:['Respuesta: 他是我的朋友。']},
    {target:'你去哪里？',pinyin:'nǐ qù nǎlǐ',meaning:'¿Adónde vas?',points:['Respuesta: 我去学校。','哪里 ocupa el lugar de 学校']},
    {target:'你什么时候来？',pinyin:'nǐ shénme shíhou lái',meaning:'¿Cuándo vienes?',points:['El tiempo va antes del verbo: 我明天来。']},
    {target:'你怎么去？',pinyin:'nǐ zěnme qù',meaning:'¿Cómo vas (hasta allí)?',points:['Respuesta: 我坐地铁去。 (Voy en metro.)']},
  ]}),
  itemLesson({id:'chinese-questions-02',title:'Preguntas completas · 2',description:'Por qué, cuántos, «¿y tú?» y la pregunta sí-no-sí.',introText:'Además de 吗, puedes preguntar repitiendo el verbo con 不 en medio: 你忙不忙？ = ¿Estás ocupado?',items:[
    {target:'你为什么学汉语？',pinyin:'nǐ wèishénme xué Hànyǔ',meaning:'¿Por qué estudias chino?',points:['Respuesta con 因为: 因为我喜欢。']},
    {target:'你忙不忙？',pinyin:'nǐ máng bu máng',meaning:'¿Estás ocupado?',points:['Verbo/adjetivo + 不 + verbo/adjetivo = pregunta sí/no','No se añade 吗']},
    {target:'你是不是老师？',pinyin:'nǐ shì bu shì lǎoshī',meaning:'¿Eres maestro?',points:['Igual que 你是老师吗？']},
    {target:'你要几个？',pinyin:'nǐ yào jǐ ge',meaning:'¿Cuántos quieres?',points:['几 para cantidades pequeñas (menos de 10), siempre con clasificador']},
    {target:'你呢？',pinyin:'nǐ ne',meaning:'¿Y tú?',points:['呢 devuelve la pregunta: 我很好，你呢？']},
  ]}),
];
questions.lessons=[...questionLessons,reviewLesson({id:'chinese-questions-test-03',title:'Prueba · Preguntas completas',lessons:questionLessons,isTest:true,count:10})];
setUnitInfo('questions','Preguntas completas','Preguntas con 什么, 谁, 哪里, 什么时候, 怎么, 为什么, 几, 呢 y la forma sí-no-sí.');

// ── C4/C5. «time» repetía survival: clasificadores, 两, hora, fechas, precios ─
const time=unit('time');
const timeLessons=[
  itemLesson({id:'chinese-time-01',title:'Números y tiempo · 1 · Contar con clasificadores',description:'número + clasificador + sustantivo, y 两 en lugar de 二.',introText:'En chino no se dice «tres libros» sino «tres-volumen-libro»: 三本书. Entre el número y el sustantivo va siempre un clasificador. 个 sirve para casi todo. Ojo: «dos» delante de un clasificador es 两 (liǎng), no 二.',items:[
    {target:'一个人',pinyin:'yí ge rén',meaning:'una persona',points:['个: clasificador general','一 + 个 → yí ge']},
    {target:'两个苹果',pinyin:'liǎng ge píngguǒ',meaning:'dos manzanas',points:['Con clasificador: 两, nunca 二','二 solo para contar y en números: 十二']},
    {target:'三本书',pinyin:'sān běn shū',meaning:'tres libros',points:['本: para libros y cuadernos']},
    {target:'一杯茶',pinyin:'yì bēi chá',meaning:'una taza de té',points:['杯: taza o vaso (el recipiente es el clasificador)']},
    {target:'几个人？',pinyin:'jǐ ge rén',meaning:'¿Cuántas personas?',points:['几 + clasificador: para cantidades pequeñas']},
  ]}),
  itemLesson({id:'chinese-time-02',title:'Números y tiempo · 2 · Más clasificadores',description:'这个, 那个 y los clasificadores más útiles.',introText:'Este y ese también llevan clasificador: 这个 (este), 那个 (ese). Cada tipo de objeto tiene el suyo: 张 para cosas planas, 件 para ropa de arriba, 双 para pares.',items:[
    {target:'这个',pinyin:'zhège',meaning:'este, esta (cosa)',points:['这 + 个','这本书 = este libro']},
    {target:'那个',pinyin:'nàge',meaning:'ese, esa (cosa)',points:['那 + 个','那杯水 = ese vaso de agua']},
    {target:'一张纸',pinyin:'yì zhāng zhǐ',meaning:'una hoja de papel',points:['张: cosas planas (papel, boleto, mesa)']},
    {target:'一件衣服',pinyin:'yí jiàn yīfu',meaning:'una prenda de ropa',points:['件: ropa de la parte de arriba y asuntos']},
    {target:'一双鞋',pinyin:'yì shuāng xié',meaning:'un par de zapatos',points:['双: pares (zapatos, calcetines, palillos)']},
  ]}),
  itemLesson({id:'chinese-time-03',title:'Números y tiempo · 3 · Números grandes',description:'Del 21 al 200 con la misma lógica de bloques.',introText:'Los números chinos se arman como bloques: 二十一 = dos-diez-uno = 21. Para 100 se usa 百; doscientos es 两百.',items:[
    {target:'二十一',pinyin:'èrshíyī',meaning:'veintiuno',points:['二 + 十 + 一']},
    {target:'三十五',pinyin:'sānshíwǔ',meaning:'treinta y cinco',points:['三 + 十 + 五']},
    {target:'九十九',pinyin:'jiǔshíjiǔ',meaning:'noventa y nueve'},
    {target:'一百',pinyin:'yìbǎi',meaning:'cien',points:['一百: con 一 delante','一 + 3.er tono → yì']},
    {target:'两百',pinyin:'liǎngbǎi',meaning:'doscientos',points:['Se prefiere 两百 a 二百']},
  ]}),
  itemLesson({id:'chinese-time-04',title:'Números y tiempo · 4 · La hora',description:'点, 半 y 分 para decir la hora.',introText:'La hora se dice con 点 (hora) y 分 (minutos). Las dos es 两点, no 二点. La parte del día va delante: 晚上七点.',items:[
    {target:'两点。',pinyin:'liǎng diǎn',meaning:'Son las dos.',points:['两点, nunca 二点']},
    {target:'八点半。',pinyin:'bā diǎn bàn',meaning:'Son las ocho y media.',points:['半 = media']},
    {target:'十点十五分。',pinyin:'shí diǎn shíwǔ fēn',meaning:'Son las diez y quince.',points:['分 = minuto']},
    {target:'中午十二点。',pinyin:'zhōngwǔ shí\'èr diǎn',meaning:'Las doce del mediodía.'},
    {target:'晚上七点',pinyin:'wǎnshang qī diǎn',meaning:'las siete de la noche',points:['Parte del día + hora: de lo grande a lo pequeño']},
  ]}),
  itemLesson({id:'chinese-time-05',title:'Números y tiempo · 5 · Meses y fechas',description:'月, 号 y 星期几.',introText:'Los meses son número + 月: 一月 (enero), 十月 (octubre). El día del mes se dice con 号. La fecha va de lo grande a lo pequeño: mes, día, día de la semana.',items:[
    {target:'一月',pinyin:'yīyuè',meaning:'enero',points:['一 + 月 (mes 1)','En fechas 一 conserva yī']},
    {target:'十月',pinyin:'shíyuè',meaning:'octubre',points:['十 + 月 (mes 10)']},
    {target:'今天几号？',pinyin:'jīntiān jǐ hào',meaning:'¿Qué fecha es hoy?',points:['号 = día del mes']},
    {target:'今天十月二十七号。',pinyin:'jīntiān shíyuè èrshíqī hào',meaning:'Hoy es 27 de octubre.',points:['Mes antes que día']},
    {target:'今天星期几？',pinyin:'jīntiān xīngqī jǐ',meaning:'¿Qué día de la semana es hoy?',points:['Respuesta: 今天星期一。']},
  ]}),
  itemLesson({id:'chinese-time-06',title:'Números y tiempo · 6 · Precios',description:'块 y 钱 para pagar y regatear.',introText:'Al hablar, el yuan se llama 块 (kuài); 钱 al final es opcional. 两块五 = 2,50 yuanes: lo que va después de 块 son décimas.',items:[
    {target:'五块钱',pinyin:'wǔ kuài qián',meaning:'cinco yuanes',points:['块: yuan (al hablar)','元 es la forma escrita']},
    {target:'一百块',pinyin:'yìbǎi kuài',meaning:'cien yuanes'},
    {target:'两块五',pinyin:'liǎng kuài wǔ',meaning:'dos yuanes cincuenta',points:['Después de 块: décimas (五 = 50 céntimos)']},
    {target:'十块一斤',pinyin:'shí kuài yì jīn',meaning:'diez yuanes el medio kilo',points:['斤 = medio kilo, la medida del mercado']},
    {target:'便宜一点吧。',pinyin:'piányi yìdiǎn ba',meaning:'¿Me lo deja más barato?',points:['吧 suaviza la petición']},
  ]}),
];
time.lessons=[...timeLessons.slice(0,3),reviewLesson({id:'chinese-time-review-03',title:'Repaso breve 1',lessons:timeLessons.slice(0,3),count:8}),...timeLessons.slice(3),reviewLesson({id:'chinese-time-review-06',title:'Repaso breve 2',lessons:timeLessons.slice(3),count:8}),reviewLesson({id:'chinese-time-test-16',title:'Prueba · Números, horas, fechas y precios',lessons:timeLessons,isTest:true,count:18})];
setUnitInfo('time','Números, horas, fechas y precios','Clasificadores, 两, números grandes, la hora, el calendario y los precios.');

// ── C4. reading-bridge y story-bridge repetían survival: frases nuevas ────
const readingBridge=unit('reading-bridge');
const rbLessons=[
  itemLesson({id:'chinese-reading-bridge-01',title:'Leer frases completas · 1 · Familia y casa',description:'Frases con 是, 也, 很 y 在 usando palabras que ya conoces.',introText:'Intenta leer cada frase en caracteres antes de mostrar el pinyin. Todas usan palabras y reglas que ya aprendiste.',items:[
    {target:'我爸爸是医生。',pinyin:'wǒ bàba shì yīshēng',meaning:'Mi papá es médico.',teachMode:'hidden'},
    {target:'我妈妈是老师。',pinyin:'wǒ māma shì lǎoshī',meaning:'Mi mamá es maestra.',teachMode:'hidden'},
    {target:'我哥哥也是学生。',pinyin:'wǒ gēge yě shì xuésheng',meaning:'Mi hermano mayor también es estudiante.',teachMode:'hidden'},
    {target:'我们的家很大。',pinyin:'wǒmen de jiā hěn dà',meaning:'Nuestra casa es grande.',teachMode:'hidden'},
    {target:'书在桌子上。',pinyin:'shū zài zhuōzi shang',meaning:'El libro está sobre la mesa.',teachMode:'hidden',points:['在 + lugar + 上 = sobre']},
  ]}),
  itemLesson({id:'chinese-reading-bridge-02',title:'Leer frases completas · 2 · Comer y beber',description:'Frases con 要, 不, clasificadores y 吗.',introText:'Lee primero; muestra el pinyin solo si lo necesitas.',items:[
    {target:'我喝茶，他喝咖啡。',pinyin:'wǒ hē chá, tā hē kāfēi',meaning:'Yo tomo té y él toma café.',teachMode:'hidden'},
    {target:'你要米饭吗？',pinyin:'nǐ yào mǐfàn ma',meaning:'¿Quieres arroz?',teachMode:'hidden'},
    {target:'我不要面条。',pinyin:'wǒ bú yào miàntiáo',meaning:'No quiero fideos.',teachMode:'hidden',points:['不 + 要 → bú yào']},
    {target:'我要两个苹果。',pinyin:'wǒ yào liǎng ge píngguǒ',meaning:'Quiero dos manzanas.',teachMode:'hidden'},
    {target:'这杯水很热。',pinyin:'zhè bēi shuǐ hěn rè',meaning:'Este vaso de agua está muy caliente.',teachMode:'hidden',points:['这 + clasificador + sustantivo']},
  ]}),
  itemLesson({id:'chinese-reading-bridge-03',title:'Leer frases completas · 3 · Salir',description:'Lugares, transporte y tiempo.',introText:'Fíjate en el orden: quién + cuándo + cómo + verbo + adónde.',items:[
    {target:'我们去公园吧。',pinyin:'wǒmen qù gōngyuán ba',meaning:'Vamos al parque.',teachMode:'hidden',points:['吧 al final = propuesta']},
    {target:'他坐地铁去学校。',pinyin:'tā zuò dìtiě qù xuéxiào',meaning:'Él va a la escuela en metro.',teachMode:'hidden',points:['坐 + transporte + 去 + lugar']},
    {target:'图书馆在哪里？',pinyin:'túshūguǎn zài nǎlǐ',meaning:'¿Dónde está la biblioteca?',teachMode:'hidden'},
    {target:'今天天气很好。',pinyin:'jīntiān tiānqì hěn hǎo',meaning:'Hoy hace buen tiempo.',teachMode:'hidden'},
    {target:'明天我不上班。',pinyin:'míngtiān wǒ bú shàngbān',meaning:'Mañana no trabajo.',teachMode:'hidden'},
  ]}),
];
readingBridge.lessons=[...rbLessons.slice(0,2),reviewLesson({id:'chinese-reading-bridge-review-02',title:'Repaso breve 1',lessons:rbLessons.slice(0,2),count:8}),rbLessons[2],reviewLesson({id:'chinese-reading-bridge-test-16',title:'Prueba · Leer frases completas',lessons:rbLessons,isTest:true,count:12})];
setUnitInfo('reading-bridge','Leer frases completas','Frases nuevas con palabras conocidas para leer caracteres con el pinyin oculto.');

const storyBridge=unit('story-bridge');
const sbLessons=[
  itemLesson({id:'chinese-story-bridge-01',title:'Primer diálogo · 1 · Ana conoce a Wang Lei',description:'Presentarse y decir de dónde eres.',introText:'Escucha el diálogo completo línea por línea. Ana es mexicana; Wang Lei es chino. Repite cada línea en voz alta.',items:[
    {target:'你好，我叫王磊。',pinyin:'nǐ hǎo, wǒ jiào Wáng Lěi',meaning:'Hola, me llamo Wang Lei.',explanation:'Wang Lei saluda. 王 es el apellido y va primero.'},
    {target:'你好！我叫安娜。',pinyin:'nǐ hǎo! wǒ jiào Ānnà',meaning:'¡Hola! Me llamo Ana.',explanation:'Ana responde con la misma estructura.'},
    {target:'你是哪国人？',pinyin:'nǐ shì nǎ guó rén',meaning:'¿De qué país eres?',explanation:'Wang Lei: 哪 (qué) + 国 (país) + 人 (persona).'},
    {target:'我是墨西哥人。你呢？',pinyin:'wǒ shì Mòxīgē rén. nǐ ne',meaning:'Soy mexicana. ¿Y tú?',explanation:'Ana: país + 人 = nacionalidad. 呢 devuelve la pregunta.'},
    {target:'我是中国人。',pinyin:'wǒ shì Zhōngguó rén',meaning:'Soy chino.',explanation:'Wang Lei: 中国 (China) + 人.'},
  ]}),
  itemLesson({id:'chinese-story-bridge-02',title:'Primer diálogo · 2 · Hablar un poco de chino',description:'Elogios, modestia y despedida.',introText:'Continúa el diálogo. Fíjate en la respuesta modesta a un elogio: en chino no se dice «gracias», sino «哪里哪里».',items:[
    {target:'你会说汉语吗？',pinyin:'nǐ huì shuō Hànyǔ ma',meaning:'¿Hablas chino?',explanation:'Wang Lei: 会 = saber hacer algo aprendido.'},
    {target:'我会说一点儿。',pinyin:'wǒ huì shuō yìdiǎnr',meaning:'Hablo un poquito.',explanation:'Ana: 一点儿 = un poco (con la «r» final del norte).'},
    {target:'你的汉语很好！',pinyin:'nǐ de Hànyǔ hěn hǎo',meaning:'¡Tu chino es muy bueno!',explanation:'Wang Lei: 的 (posesión) + 很 + adjetivo.'},
    {target:'哪里哪里。',pinyin:'nǎlǐ nǎlǐ',meaning:'No es para tanto.',explanation:'Ana responde con modestia. Aquí 哪里 no pregunta «dónde».',points:['Respuesta típica a un elogio']},
    {target:'明天见！',pinyin:'míngtiān jiàn',meaning:'¡Hasta mañana!',explanation:'明天 (mañana) + 见 (ver): «nos vemos mañana».'},
  ]}),
];
storyBridge.lessons=[...sbLessons,reviewLesson({id:'chinese-story-bridge-test-08',title:'Prueba · Primer diálogo',lessons:sbLessons,isTest:true,count:10})];
setUnitInfo('story-bridge','Primer diálogo','Un diálogo completo con Ana y Wang Lei antes de abrir tu primera historia.');

// ── C6. Traducciones y ejemplos erróneos ─────────────────────────────────
const survival=unit('survival'),vocabulary=unit('vocabulary');
const shiNote='是 une dos sustantivos (我是学生 = soy estudiante). No hay una palabra única para «sí»: se responde repitiendo el verbo (是, 对, 好).';
for(const data of [survival,vocabulary]){
  for(const activity of allActivities(data)){
    for(const [target,from,to] of [['是','sí','ser; sí (así es)'],['不是','no','no ser; no (no es así)']]){
      const about=activity.target===target||activity.answer===target;
      if(about){
        for(const key of ['meaning','answer','explanation'])if(activity[key]===from)activity[key]=to;
        for(const end of ['','.'])if(activity.explanation===`La forma escrita correcta es «${target}»: ${from}${end}`)activity.explanation=`La forma escrita correcta es «${target}»: ${to}${end}`;
        if(activity.type==='teach_concept')activity.usage_note=shiNote;
      }
      // Como distractor en otras preguntas se muestra la glosa nueva.
      if(activity.options&&(about||activity.answer!==from))activity.options=activity.options.map(option=>option===from?to:option);
    }
  }
}
for(const [from,to] of [
  ['我有二本书。 — Tengo dos libros.','我有两本书。 — Tengo dos libros. Ojo: delante de un clasificador, «dos» se dice 两 (liǎng), no 二.'],
  ['我刷牙齿。 — Me cepillo los dientes.','我的牙齿很白。 — Mis dientes son muy blancos. («Lavarse los dientes» es 刷牙.)'],
  ['我要全杯水。 — Quiero el vaso lleno de agua.','全家都来了。 — Vino toda la familia.'],
  ['我要一袋米饭。 — Quiero una bolsa de arroz cocido.','我要一袋面包。 — Quiero una bolsa de pan.'],
  ['这个三块。 — Esto cuesta tres unidades.','这个三块钱。 — Esto cuesta tres yuanes. (Al hablar, 块 = yuan.)'],
  ['谢谢，你给我水。 — Gracias, me das agua.','谢谢你给我水。 — Gracias por darme agua.'],
  ['一年有十二个月份。 — Un año tiene doce meses.','一年有十二个月。 — Un año tiene doce meses. (月份 se usa sobre todo por escrito.)'],
  ['孩子睡了。 — El niño durmió.','孩子睡了。 — El niño ya se durmió.'],
  ['我们走吧。 — Vamos caminando.','我们走吧。 — Vámonos.'],
])replaceText(vocabulary,from,to);
// Los clasificadores se usaban en ejemplos sin explicarse.
for(const activity of allActivities(vocabulary).filter(activity=>activity.type==='teach_concept'&&activity.target==='个'))activity.usage_note='Número + clasificador + sustantivo: 三个苹果 (tres manzanas). 个 sirve para casi todo; otros: 本 (libros), 杯 (tazas), 张 (cosas planas), 件 (ropa).';
for(const activity of allActivities(vocabulary).filter(activity=>activity.type==='teach_concept'&&activity.target==='二'))activity.usage_note='二 se usa al contar y dentro de números (十二). Delante de un clasificador se usa 两: 两本书, 两个人.';

const fixes={
  'a1-1-identity':[['我会说一点汉语。','Hablo un poco de este idioma.','Hablo un poco de chino.']],
  'a1-1-routine':[['起床','despertarse','levantarse']],
  'a1-2-time':[['我迟到了。','Llego tarde.','Llegué tarde.'],['我们明天见吧。','Quedemos mañana.','Nos vemos mañana.']],
  'a1-2-social':[['时间','hora','tiempo (disponible)']],
  'a1-2-health':[['这个药一天吃两次。','Tome esto dos veces al día.','Esta medicina se toma dos veces al día.']],
  'a2-1-future':[['打算','intención','planear, tener la intención de']],
  'a2-1-comparison':[['这个房间更便宜。','La habitación es menos cara.','Esta habitación es más barata.']],
  'a2-1-ability':[['我可以坐这个座位吗？','¿Puedo usar este asiento?','¿Puedo sentarme en este asiento?'],['这里可以拍照。','Aquí se puede tomar fotos.','Aquí se pueden tomar fotos.'],['允许','permitido','permitir']],
  'a2-2-workStudy':[['允许','permitido','permitir']],
};
for(const [id,list] of Object.entries(fixes))for(const [target,from,to] of list){const data=unit(id);fixMeaning(data,target,from,to);if(from.includes(' '))replaceText(data,from,to);}

// ── Pinyin: casi ninguna tarjeta de A0–A1 lo tenía ──────────────────────
const PINYIN={
  '一':'yī','一些':'yìxiē','一点':'yìdiǎn','七':'qī','三':'sān','三点。':'sān diǎn','上班':'shàngbān','下午':'xiàwǔ','下班':'xiàbān','下雨':'xià yǔ','下雪':'xià xuě','不':'bù','不客气':'bú kèqi','不是':'bú shì','个':'gè','中午':'zhōngwǔ','为什么':'wèishénme','九':'jiǔ','书':'shū','买':'mǎi','二':'èr','二十':'èrshí','云':'yún','五':'wǔ','人':'rén','人们':'rénmen','什么':'shénme','什么时候':'shénme shíhou','今天':'jīntiān','他':'tā','他们':'tāmen','份':'fèn','休息':'xiūxi','住':'zhù','作业':'zuòyè','你':'nǐ','你们':'nǐmen','你叫什么名字？':'nǐ jiào shénme míngzi','便宜':'piányi','做':'zuò','做饭':'zuòfàn','儿子':'érzi','充电':'chōngdiàn','先生':'xiānsheng','全':'quán','八':'bā','公交车':'gōngjiāochē','公司':'gōngsī','公园':'gōngyuán','六':'liù','关':'guān','再':'zài','写':'xiě','冬天':'dōngtiān','冷':'lěng','几':'jǐ','几点？':'jǐ diǎn','出租车':'chūzūchē','办公室':'bàngōngshì','勺子':'sháozi','包':'bāo','医生':'yīshēng','医院':'yīyuàn','十':'shí','十一':'shíyī','十七':'shíqī','十三':'shísān','十九':'shíjiǔ','十二':'shí\'èr','十五':'shíwǔ','十八':'shíbā','十六':'shíliù','十四':'shísì','千':'qiān','半':'bàn','卖':'mài','厨房':'chúfáng','去':'qù','可以':'kěyǐ','可能':'kěnéng','吃':'chī','吃饭':'chīfàn','同事':'tóngshì','名字':'míngzi','听':'tīng','听见':'tīngjiàn','和':'hé','咖啡':'kāfēi','哥哥':'gēge','哪里':'nǎlǐ','商场':'shāngchǎng','商店':'shāngdiàn','喜欢':'xǐhuan','喝':'hē','嘴巴':'zuǐba','四':'sì','因为':'yīnwèi','图书馆':'túshūguǎn','地铁':'dìtiě','坐':'zuò','块':'kuài','城市':'chéngshì','夏天':'xiàtiān','外套':'wàitào','多':'duō','多大':'duō dà','多少':'duōshao','大':'dà','天气':'tiānqì','天空':'tiānkōng','太阳':'tàiyáng','头':'tóu','女':'nǚ','女儿':'nǚ\'ér','女士':'nǚshì','她':'tā','她们':'tāmen','好':'hǎo','妈妈':'māma','妹妹':'mèimei','姐姐':'jiějie','姓':'xìng','学习':'xuéxí','学校':'xuéxiào','学生':'xuésheng','孩子':'háizi','客厅':'kètīng','家':'jiā','家人':'jiārén','小':'xiǎo','少':'shǎo','山':'shān','工作':'gōngzuò','市中心':'shì zhōngxīn','市场':'shìchǎng','带':'dài','帮助':'bāngzhù','帽子':'màozi','年':'nián','年轻':'niánqīng','广场':'guǎngchǎng','床':'chuáng','开':'kāi','开始':'kāishǐ','开车':'kāichē','弟弟':'dìdi','很多':'hěn duō','心':'xīn','快':'kuài','怎么':'zěnme','您':'nín','想':'xiǎng','慢':'màn','我':'wǒ','我们':'wǒmen','我叫安娜。':'wǒ jiào Ānnà','我来自墨西哥。':'wǒ láizì Mòxīgē','房间':'fángjiān','手':'shǒu','手套':'shǒutào','手机':'shǒujī','打扫':'dǎsǎo','找':'zhǎo','护士':'hùshi','放':'fàng','教室':'jiàoshì','斤':'jīn','新':'xīn','旧':'jiù','早':'zǎo','早上':'zǎoshang','明天':'míngtiān','星期':'xīngqī','星期一':'xīngqīyī','星期三':'xīngqīsān','星期二':'xīngqī\'èr','星期五':'xīngqīwǔ','星期六':'xīngqīliù','星期四':'xīngqīsì','星期日':'xīngqīrì','春天':'chūntiān','昨天':'zuótiān','是':'shì','晚':'wǎn','晚上':'wǎnshang','晴天':'qíngtiān','月':'yuè','月份':'yuèfèn','有':'yǒu','朋友':'péngyou','机场':'jīchǎng','来':'lái','杯':'bēi','杯子':'bēizi','树':'shù','桌子':'zhuōzi','棕色':'zōngsè','椅子':'yǐzi','橙子':'chéngzi','橙色':'chéngsè','步行':'bùxíng','母亲':'mǔqīn','每':'měi','水':'shuǐ','汽车':'qìchē','没有':'méiyǒu','河':'hé','洗':'xǐ','洗澡':'xǐzǎo','浴室':'yùshì','海':'hǎi','消息':'xiāoxi','火车':'huǒchē','灯':'dēng','灰色':'huīsè','热':'rè','照片':'zhàopiàn','父亲':'fùqīn','爸爸':'bàba','牙齿':'yáchǐ','牛奶':'niúnǎi','现在':'xiànzài','瓶':'píng','电池':'diànchí','电脑':'diànnǎo','电视':'diànshì','电话':'diànhuà','男':'nán','疼':'téng','病':'bìng','瘦':'shòu','白色':'báisè','百':'bǎi','盒':'hé','盘':'pán','看见':'kànjiàn','眼睛':'yǎnjing','睡':'shuì','睡觉':'shuìjiào','知道':'zhīdào','短':'duǎn','矮':'ǎi','碗':'wǎn','秋天':'qiūtiān','穿':'chuān','窗户':'chuānghu','站':'zhàn','笔':'bǐ','第一':'dì yī','第三':'dì sān','第二':'dì èr','等':'děng','米饭':'mǐfàn','紫色':'zǐsè','累':'lèi','红色':'hóngsè','纸':'zhǐ','结束':'jiéshù','给':'gěi','绿色':'lǜsè','网络':'wǎngluò','老':'lǎo','老师':'lǎoshī','老板':'lǎobǎn','考试':'kǎoshì','耳朵':'ěrduo','胖':'pàng','能 / 可以':'néng / kěyǐ','脚':'jiǎo','脸':'liǎn','自己':'zìjǐ','自行车':'zìxíngchē','船':'chuán','花':'huā','苹果':'píngguǒ','茶':'chá','草':'cǎo','葡萄':'pútao','蓝色':'lánsè','街道':'jiēdào','衣服':'yīfu','衬衫':'chènshān','袋':'dài','袜子':'wàzi','裙子':'qúnzi','裤子':'kùzi','要':'yào','说':'shuō','请':'qǐng','请问':'qǐngwèn','读':'dú','课本':'kèběn','谁':'shéi','谢谢':'xièxie','贵':'guì','走':'zǒu','走路':'zǒulù','起床':'qǐchuáng','超市':'chāoshì','路':'lù','身体':'shēntǐ','车站':'chēzhàn','软件':'ruǎnjiàn','还':'hái','这':'zhè','这里':'zhèlǐ','那':'nà','那边那个':'nàbiān nàge','那里':'nàlǐ','都':'dōu','酒店':'jiǔdiàn','钥匙':'yàoshi','钱':'qián','长':'cháng','门':'mén','问':'wèn','阴天':'yīntiān','雨':'yǔ','雨衣':'yǔyī','零':'líng','需要':'xūyào','面包':'miànbāo','面条':'miàntiáo','鞋子':'xiézi','风':'fēng','飞机':'fēijī','餐厅':'cāntīng','香蕉':'xiāngjiāo','高':'gāo','鸡蛋':'jīdàn','黄色':'huángsè','黑色':'hēisè','鼻子':'bízi',
  // A1
  '你好':'nǐ hǎo','早上好':'zǎoshang hǎo','很高兴认识你。':'hěn gāoxìng rènshi nǐ','晚上好':'wǎnshang hǎo','再见':'zàijiàn','谢谢。':'xièxie','请。':'qǐng','国家':'guójiā','语言':'yǔyán','我会说一点汉语。':'wǒ huì shuō yìdiǎn Hànyǔ','我不明白。':'wǒ bù míngbai','这是我的家人。':'zhè shì wǒ de jiārén','他是我的朋友。':'tā shì wǒ de péngyou','她是我的妹妹。':'tā shì wǒ de mèimei','我有两个弟弟。':'wǒ yǒu liǎng ge dìdi','他是谁？':'tā shì shéi','你多大？':'nǐ duō dà','女人':'nǚrén','男人':'nánrén','我妈妈在这里工作。':'wǒ māma zài zhèlǐ gōngzuò','我们住在一起。':'wǒmen zhù zài yìqǐ','在这里。':'zài zhèlǐ','在哪里？':'zài nǎlǐ','洗手间':'xǐshǒujiān','是我的。':'shì wǒ de','不在这里。':'bú zài zhèlǐ','钥匙在桌子上。':'yàoshi zài zhuōzi shang','我的房间很小。':'wǒ de fángjiān hěn xiǎo','有两把椅子。':'yǒu liǎng bǎ yǐzi','门开着。':'mén kāizhe','每天':'měitiān','七点':'qī diǎn','下班以后':'xiàbān yǐhòu','睡觉以前':'shuìjiào yǐqián','我七点起床。':'wǒ qī diǎn qǐchuáng','我下午学习。':'wǒ xiàwǔ xuéxí','我们一起吃饭。':'wǒmen yìqǐ chīfàn','我星期天不工作。':'wǒ xīngqītiān bù gōngzuò','我饿了。':'wǒ è le','我渴了。':'wǒ kě le','我要这个。':'wǒ yào zhège','请结账。':'qǐng jiézhàng','我早上喝茶。':'wǒ zǎoshang hē chá','我要一点米饭。':'wǒ yào yìdiǎn mǐfàn','肉':'ròu','蔬菜':'shūcài','这个苹果很好吃。':'zhège píngguǒ hěn hǎochī','我不吃肉。':'wǒ bù chī ròu','银行':'yínháng','车站在哪里？':'chēzhàn zài nǎlǐ','就在附近。':'jiù zài fùjìn','一直往前走。':'yìzhí wǎng qián zǒu','不好意思。':'bù hǎoyìsi','车站在左边。':'chēzhàn zài zuǒbian','我去学校。':'wǒ qù xuéxiào','左边':'zuǒbian','右边':'yòubian','银行就在附近。':'yínháng jiù zài fùjìn','怎么去公园？':'zěnme qù gōngyuán','价格':'jiàgé','这个多少钱？':'zhège duōshao qián','我需要大一点的尺码。':'wǒ xūyào dà yìdiǎn de chǐmǎ','尺码':'chǐmǎ','有蓝色的吗？':'yǒu lánsè de ma','现金':'xiànjīn','可以刷卡吗？':'kěyǐ shuā kǎ ma','我只有现金。':'wǒ zhǐ yǒu xiànjīn','卡':'kǎ','试衣间':'shìyījiān','试衣间在哪里？':'shìyījiān zài nǎlǐ','太贵了。':'tài guì le','现在几点？':'xiànzài jǐ diǎn','现在三点半。':'xiànzài sān diǎn bàn','我们明天见吧。':'wǒmen míngtiān jiàn ba','我星期一有空。':'wǒ xīngqīyī yǒu kòng','我八点到。':'wǒ bā diǎn dào','约会在下个星期。':'yuēhuì zài xià ge xīngqī','我迟到了。':'wǒ chídào le','星期五见。':'xīngqīwǔ jiàn','票':'piào','一张票，谢谢。':'yì zhāng piào, xièxie','火车什么时候出发？':'huǒchē shénme shíhou chūfā','公共汽车':'gōnggòng qìchē','这辆公共汽车去市中心吗？':'zhè liàng gōnggòng qìchē qù shì zhōngxīn ma','下一站是什么？':'xià yí zhàn shì shénme','站台':'zhàntái','公交站':'gōngjiāozhàn','需要换乘吗？':'xūyào huànchéng ma','火车晚点了。':'huǒchē wǎndiǎn le','目的地':'mùdìdì','我在这里下车。':'wǒ zài zhèlǐ xià chē','要多长时间？':'yào duō cháng shíjiān','肚子':'dùzi','我头疼。':'wǒ tóu téng','我从昨天开始发烧。':'wǒ cóng zuótiān kāishǐ fāshāo','喉咙':'hóulóng','发烧':'fāshāo','我需要看医生。':'wǒ xūyào kàn yīshēng','哪里有药店？':'nǎlǐ yǒu yàodiàn','药':'yào','药店':'yàodiàn','我对青霉素过敏。':'wǒ duì qīngméisù guòmǐn','这个药一天吃两次。':'zhège yào yì tiān chī liǎng cì','我感觉好多了。':'wǒ gǎnjué hǎo duō le','请叫救护车。':'qǐng jiào jiùhùchē','今天是晴天。':'jīntiān shì qíngtiān','明天会下雨。':'míngtiān huì xià yǔ','雪':'xuě','天气很冷。':'tiānqì hěn lěng','带一把雨伞。':'dài yì bǎ yǔsǎn','我要一件外套。':'wǒ yào yí jiàn wàitào','天气变化很快。':'tiānqì biànhuà hěn kuài','雨伞':'yǔsǎn','现在十度。':'xiànzài shí dù','周末天气怎么样？':'zhōumò tiānqì zěnmeyàng','聚会':'jùhuì','邀请':'yāoqǐng','你想来吗？':'nǐ xiǎng lái ma','好啊，我很愿意。':'hǎo a, wǒ hěn yuànyì','计划':'jìhuà','时间':'shíjiān','对不起，我不能来。':'duìbuqǐ, wǒ bù néng lái','我们什么时候见？':'wǒmen shénme shíhou jiàn','地方':'dìfang','我们在哪里见？':'wǒmen zài nǎlǐ jiàn','我六点以后有空。':'wǒ liù diǎn yǐhòu yǒu kòng','周末':'zhōumò','可以带一个朋友来吗？':'kěyǐ dài yí ge péngyou lái ma','把地址发给我。':'bǎ dìzhǐ fā gěi wǒ',
};
const pinyinUnits=course.levels.flatMap(level=>level.unitIds).filter(id=>['survival','essentials','vocabulary'].includes(id)||/^a1-/.test(id));
for(const id of pinyinUnits){
  const a0=!id.startsWith('a1-');
  for(const activity of allActivities(unit(id))){
    if(!['teach_concept','select_translation'].includes(activity.type)||activity.pinyin)continue;
    const pinyin=PINYIN[activity.target];if(!pinyin)continue;
    activity.pinyin=pinyin;activity.pinyin_mode=activity.type==='teach_concept'&&a0?'visible':'hidden';
  }
}

// ── C7. Más respuestas aceptadas y diálogos con margen (A1) ──────────────
const accepted={
  '你叫什么名字？':['您叫什么名字？','你叫什么？','您贵姓？'],
  '我来自墨西哥。':['我是墨西哥人。','我从墨西哥来。'],
  '他是谁？':['这是谁？','他是哪位？'],
  '你多大？':['你多大了？','你几岁？','您多大年纪？'],
  '钥匙在桌子上。':['钥匙在桌上。','钥匙在桌子上面。'],
  '我的房间很小。':['我房间很小。','我的房间小。'],
  '我七点起床。':['我7点起床。','我早上七点起床。'],
  '我下午学习。':['下午我学习。'],
  '我早上喝茶。':['早上我喝茶。'],
  '我要一点米饭。':['我要一点儿米饭。','请给我一点米饭。'],
  '车站在左边。':['车站在左面。','车站在左手边。'],
  '左边':['左面','左'],
  '可以刷卡吗？':['能刷卡吗？','我可以刷卡吗？'],
  '我八点到。':['我8点到。','我八点钟到。'],
  '约会在下个星期。':['约会是下个星期。','约会在下周。'],
  '需要换乘吗？':['要换乘吗？','需要换车吗？','要换车吗？'],
  '这个药一天吃两次。':['这个药一天吃2次。','这种药一天吃两次。'],
  '我要一件外套。':['我需要一件外套。','我要外套。'],
  '我们在哪里见？':['我们在哪儿见？','在哪里见？','我们在哪里见面？'],
  '我六点以后有空。':['我6点以后有空。','六点以后我有空。','我六点后有空。'],
  '我去学校。':['我要去学校。'],
};
const FREE_TYPES=new Set(['typed_translation','speak_and_transcribe','open_question','dictation']);
const widen=target=>{const extra=accepted[target.answer];if(!extra?.length)return;target.accepted_answers=[...new Set([...(target.accepted_answers||[target.answer]),...extra])];};
for(const id of course.levels.flatMap(level=>level.unitIds).filter(id=>id.startsWith('a1-'))){
  for(const activity of allActivities(unit(id))){
    if(FREE_TYPES.has(activity.type)&&activity.type!=='dictation')widen(activity);
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
