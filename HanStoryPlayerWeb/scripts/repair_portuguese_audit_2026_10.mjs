// Correcciones críticas de la auditoría del curso de portugués
// (docs/AUDITORIA_PORTUGUES_2026-10-27.md). Idempotente: se puede volver a
// ejecutar sin duplicar lecciones ni respuestas. Base: portugués europeo
// (pt-PT, la voz del audio); las formas de Brasil se etiquetan como variante.
import fs from 'node:fs';

const dir=new URL('../library/courses/Portuguese/',import.meta.url);
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
// Igual, pero solo palabras completas (no toca «estrela» al cambiar «tela»).
function replaceWord(data,from,to,{skip=()=>false}={}){
  const pattern=new RegExp(`(?<![\\p{L}])${from.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(?![\\p{L}])`,'gu');
  const walk=value=>{
    if(typeof value==='string')return value.replace(pattern,to);
    if(Array.isArray(value))return value.map(walk);
    if(value&&typeof value==='object'){for(const key of Object.keys(value))value[key]=walk(value[key]);}
    return value;
  };
  for(const lesson of data.lessons)for(const activity of lesson.activities)if(!skip(activity))walk(activity);
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
    if(!item.explanation)item.explanation=kind==='sound'?`«${item.target}» se pronuncia ${item.sound}.`:`${item.meaning}.`;
    const others=item.others||items.filter(other=>other!==item).map(other=>kind==='sound'?other.sound:other.meaning).filter(text=>text!==answer).slice(index%2,index%2+2);
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
  return {id,title,description:isTest?'Prueba de dominio de la unidad.':'Repaso acumulativo breve.',...(isTest?{isTest:true,isUnitFinal:true,xpReward:30}:{isReview:true}),activities:[intro(`${id}-intro`,title,isTest?'Responde sin ayudas. Necesitas el porcentaje mínimo para continuar.':'Repasa sin mirar las respuestas: así se fortalece la memoria.'),...activities]};
};
const upsertLessons=(data,lessons,beforeId)=>{
  for(const lesson of lessons){
    const existing=data.lessons.findIndex(item=>item.id===lesson.id);
    if(existing>=0){data.lessons[existing]=lesson;continue;}
    const at=data.lessons.findIndex(item=>item.id===beforeId);
    data.lessons.splice(at<0?data.lessons.length:at,0,lesson);
  }
};
// Reescribe una unidad completa: lecciones, repasos cada dos lecciones y prueba.
function rebuildUnit(id,{title,description,lessons,testId}){
  const data=unit(id),out=[];
  lessons.forEach((lesson,index)=>{
    out.push(lesson);
    if(index%2===1&&index<lessons.length-1)out.push(reviewLesson({id:`portuguese-${id}-review-${String(index+1).padStart(2,'0')}`,title:`Repaso breve ${Math.ceil(index/2)}`,lessons:lessons.slice(index-1,index+1),count:8}));
  });
  out.push(reviewLesson({id:testId,title:`Prueba · ${title}`,lessons,isTest:true,count:Math.min(20,lessons.length*3)}));
  Object.assign(data,{title,description});data.reward={...data.reward,badge:title};
  data.lessons=out;
  Object.assign(course.units.find(entry=>entry.id===id),{title,description});
}
const course=load('course.json');

// ── C1. reading: sonidos de letras erróneos o engañosos ──────────────────
const reading=unit('reading');
// Las respuestas no incluyen palabras de ejemplo con la propia letra (se
// adivinarían); los ejemplos van en las lecciones 7–10.
for(const [letter,olds,to] of [
  ['C',['se','k (ca, co, cu); s ante e/i (cidade)'],'k ante a, o, u; s ante e, i'],
  ['G',['ye','g de gato; ante e/i, como la j francesa (gente)'],'g de «gato» ante a, o, u; ante e, i, como la j francesa'],
  ['J',['y francesa','como la j francesa o la «y» rioplatense (janela)'],'como la j francesa o la «y» rioplatense'],
  ['Q',['ke','k: se escribe qu- (quatro, queijo)'],'k (va siempre seguida de u)'],
  ['S',['ese'],'s; entre vocales, z; al final de sílaba, sh en Portugal'],
  ['Z',['ze'],'z sonora, como un zumbido (no es s)'],
  ['O',['o'],'o (ó abierta, ô cerrada); sin acento, casi u'],
  ['E',['e'],'e (é abierta, ê cerrada); sin acento, casi muda en Portugal'],
]){
  for(const from of olds){
    replaceText(reading,from,to,{whole:true});
    replaceText(reading,`${letter}: ${from}`,`${letter}: ${to}`,{whole:true});
  }
}

// ── C2. Reglas de pronunciación que un hispanohablante necesita (pt-PT) ──
const vowels=itemLesson({id:'portuguese-reading-07',title:'Sonidos y lectura · 7 · Vocales sin acento (Portugal)',description:'En Portugal las vocales átonas se reducen: es lo que más sorprende al oído hispano.',kind:'sound',introText:'En portugués europeo solo la sílaba tónica conserva su vocal clara. La e sin acento casi desaparece, la o sin acento suena u y la a final se apaga. Si lees como en español no reconocerás lo que oyes.',items:[
  {target:'pequeno',sound:'[p(e)-KÊ-nu]',explanation:'La e átona casi desaparece y la o final suena u: [p(e)-KÊ-nu].',points:['Sílaba tónica: -que-','e átona: casi muda','o final: u'],others:['[pe-KE-no]','[pi-KÉ-ni]']},
  {target:'telefone',sound:'[t(e)l(e)-FÓN]',explanation:'Las e sin acento casi no se oyen: [t(e)l(e)-FÓN].',points:['Tónica: -fo-','La e final casi no se pronuncia'],others:['[te-le-FO-ne]','[te-le-FO-ni]']},
  {target:'obrigado',audio:'Obrigado.',sound:'[o-bri-GÁ-du]',explanation:'La o final átona suena u: [o-bri-GÁ-du].',points:['La o final átona siempre suena u: obrigado, pequeno, carro'],others:['[o-bri-GA-do]','[o-bri-GA-da]']},
  {target:'casa',sound:'[KÁ-zɐ]',explanation:'La s entre vocales suena z y la a final se apaga: [KÁ-zɐ].',points:['s entre vocales: z','a final átona: débil, casi «ë»'],others:['[KA-sa]','[KA-sha]']},
  {target:'leite',sound:'[LEI-t(e)]',explanation:'La e final casi no se oye: [LEI-t(e)]. En Brasil suena [LEI-chi].',points:['ei: diptongo','e final átona: casi muda'],others:['[lei-TÉ]','[LEI-chi]']},
]});
const nasals=itemLesson({id:'portuguese-reading-08',title:'Sonidos y lectura · 8 · Vocales nasales',description:'ão, ãe, õe y la m o n final que nasalizan sin sonar.',kind:'sound',introText:'La tilde (~) y la m o n al final de sílaba indican que el aire sale también por la nariz. No añadas una n o una m española al final: bem no es «bem», es «bẽi».',items:[
  {target:'pão',sound:'[pãu] (nasal)',explanation:'ão es un diptongo nasal: «au» por la nariz, sin n final.',points:['ão: diptongo nasal','Aparece en não, mão, pão, estação'],others:['[PA-o] (dos sílabas)','[pan] (con n)']},
  {target:'mãe',sound:'[mãi] (nasal)',explanation:'ãe es un diptongo nasal: «ai» por la nariz.',points:['ãe: diptongo nasal','mãe = madre'],others:['[MA-e] (dos sílabas)','[man] (con n)']},
  {target:'põe',sound:'[põi] (nasal)',explanation:'õe es un diptongo nasal: «oi» por la nariz.',points:['õe: diptongo nasal','Plurales: estação → estações'],others:['[PO-e] (dos sílabas)','[pon] (con n)']},
  {target:'bem',sound:'[bẽi] (nasal)',explanation:'-em final suena «ẽi» nasal: la m no se pronuncia y los labios no se cierran.',points:['-em final: «ẽi» nasal','La m no se pronuncia'],others:['[bem] (cerrando los labios)','[ben] (con n)']},
  {target:'sim',sound:'[sĩ] (nasal)',explanation:'-im final: i nasal, sin m.',points:['-im final: i nasal'],others:['[sim] (cerrando los labios)','[si] (sin nasal)']},
  {target:'um',sound:'[ũ] (nasal)',explanation:'-um final: u nasal, sin m.',points:['-um final: u nasal','um = un, uno'],others:['[um] (cerrando los labios)','[un] (con n)']},
]});
const digraphs=itemLesson({id:'portuguese-reading-09',title:'Sonidos y lectura · 9 · lh, nh, ch, ç y qu',description:'Grupos de letras que el español escribe de otra forma.',kind:'sound',introText:'Algunas combinaciones se leen como un solo sonido: nh es la ñ, lh se parece a «ll» con l, ch es «sh» y ç es siempre s.',items:[
  {target:'vinho',sound:'[VI-ñu]',explanation:'nh es la ñ española: [VI-ñu].',points:['nh = ñ','vinho = vino'],others:['[VIN-jo]','[VI-no]']},
  {target:'filho',sound:'[FI-lyu]',explanation:'lh: lengua en el paladar, como una l pegada a una i muy breve: [FI-lyu].',points:['lh: como «l» + «y» en una sola sílaba','filho = hijo'],others:['[FIL-jo]','[FI-yo]']},
  {target:'chave',sound:'[SHÁ-v(e)]',explanation:'ch suena sh, nunca como la ch española: [SHÁ-v(e)].',points:['ch = sh','chave = llave'],others:['[CHA-ve]','[KA-ve]']},
  {target:'praça',sound:'[PRÁ-sɐ]',explanation:'ç suena siempre s: [PRÁ-sɐ].',points:['ç solo va ante a, o, u','Nunca suena k ni z'],others:['[PRA-ka]','[PRA-za]']},
  {target:'queijo',sound:'[KEI-zhu]',explanation:'qu ante e/i suena k (la u no suena); j suena como la j francesa: [KEI-zhu].',points:['qu ante e/i: k','j: como la «y» rioplatense de «yo»'],others:['[KUEI-jo]','[KEI-ko]']},
]});
const positions=itemLesson({id:'portuguese-reading-10',title:'Sonidos y lectura · 10 · S, R, Z y G según la posición',description:'La misma letra cambia de sonido según dónde aparece.',kind:'sound',introText:'En Portugal la s final suena sh, la s entre vocales suena z, la r inicial es fuerte (de garganta o como rr) y la z es siempre sonora.',items:[
  {target:'três',sound:'[TRÉSH]',explanation:'En Portugal la s final suena sh: [TRÉSH]. En Brasil suele sonar s.',points:['s al final de sílaba: sh','En Brasil suele sonar s'],others:['[TRES]','[TRE]']},
  {target:'mesa',sound:'[MÊ-zɐ]',explanation:'La s entre vocales suena z: [MÊ-zɐ].',points:['s entre vocales: z','ss entre vocales: s (passo)'],others:['[ME-sa]','[ME-sha]']},
  {target:'rua',sound:'[RRÚ-ɐ] (r fuerte)',explanation:'La r inicial es fuerte, de garganta o como rr: [RRÚ-ɐ].',points:['r inicial y rr: fuertes','rua = calle'],others:['[RU-a] (r suave)','[LU-a]']},
  {target:'caro',sound:'[KÁ-ru]',explanation:'La r entre vocales es suave, como en español «caro»: [KÁ-ru].',points:['Compara caro (caro) y carro (coche)'],others:['[KA-rro]','[KA-lo]']},
  {target:'zero',sound:'[ZÉ-ru] (z sonora)',explanation:'La z es siempre sonora, como un zumbido; no es la s del español de México: [ZÉ-ru].',points:['z siempre sonora','En español de México la z suena s: aquí no'],others:['[SE-ru] (con s)','[THE-ru] (z de España)']},
  {target:'gente',sound:'[ZHÊN-t(e)]',explanation:'g ante e/i suena como la j francesa: [ZHÊN-t(e)].',points:['ge/gi: zh','ga/go/gu: g de gato'],others:['[JEN-te]','[GUEN-te]']},
]});
upsertLessons(reading,[vowels,nasals,digraphs,positions],'portuguese-reading-test-08');
const readingTest=reading.lessons.find(lesson=>lesson.id==='portuguese-reading-test-08');
const readingExtra=reviewLesson({id:'x',title:'',lessons:[vowels,nasals,digraphs,positions],isTest:true,count:8}).activities.slice(1).map((activity,index)=>({...activity,id:`portuguese-reading-test-08-new-${index+1}`}));
readingTest.activities=[...readingTest.activities.filter(activity=>!activity.id.startsWith('portuguese-reading-test-08-new-')),...readingExtra];

// ── C1. survival: era una copia de pronombres; ahora saludos, cortesía y registro
rebuildUnit('survival',{title:'Comunicación esencial',description:'Saludos, cortesía, tú y usted, y frases para pedir ayuda.',testId:'portuguese-survival-test-05',lessons:[
  itemLesson({id:'portuguese-survival-01',title:'Comunicación esencial · 1 · Saludos',description:'Saludar y despedirse según la hora.',introText:'Saluda según la hora: bom dia hasta el mediodía, boa tarde hasta que oscurece y boa noite después (también para despedirte).',items:[
    {target:'olá',meaning:'hola'},
    {target:'bom dia',meaning:'buenos días'},
    {target:'boa tarde',meaning:'buenas tardes',points:['Desde el mediodía hasta que oscurece']},
    {target:'boa noite',meaning:'buenas noches',points:['Sirve para saludar y para despedirse']},
    {target:'até logo',meaning:'hasta luego'},
    {target:'adeus',meaning:'adiós',usage:'Más definitivo que «Até logo». Entre amigos también se oye «Tchau».'},
  ]}),
  itemLesson({id:'portuguese-survival-02',title:'Comunicación esencial · 2 · Cortesía',description:'Gracias, por favor y disculpas.',introText:'«Gracias» concuerda con quien habla: un hombre dice obrigado y una mujer obrigada.',items:[
    {target:'Obrigado.',meaning:'Gracias (lo dice un hombre).',points:['Significa «agradecido»: concuerda con quien habla']},
    {target:'Obrigada.',meaning:'Gracias (lo dice una mujer).',points:['Una mujer siempre dice obrigada']},
    {target:'Por favor.',meaning:'Por favor.'},
    {target:'Desculpe.',meaning:'Disculpe.',usage:'Con amigos: «Desculpa».'},
    {target:'Com licença.',meaning:'Con permiso.'},
    {target:'De nada.',meaning:'De nada.'},
  ]}),
  itemLesson({id:'portuguese-survival-03',title:'Comunicación esencial · 3 · Tú y usted',description:'tu, o senhor / a senhora y você en Portugal y en Brasil.',introText:'En Portugal se usa tu con familia y amigos, y o senhor / a senhora (con el verbo en 3.ª persona) para tratar de usted. Você existe, pero en Portugal puede sonar distante; en Brasil es lo normal.',items:[
    {target:'tu',meaning:'tú (familia y amigos)',points:['Verbo en 2.ª persona: tu estás, tu falas']},
    {target:'o senhor',meaning:'usted (a un hombre)',points:['Verbo en 3.ª persona: O senhor está bem?']},
    {target:'a senhora',meaning:'usted (a una mujer)',points:['A senhora fala inglês? = ¿Usted habla inglés?']},
    {target:'Como estás?',meaning:'¿Cómo estás?',points:['tu → estás']},
    {target:'Como está?',meaning:'¿Cómo está (usted)?',points:['o senhor / a senhora / você → está']},
    {target:'Estou bem, obrigado.',meaning:'Estoy bien, gracias.',usage:'Si eres mujer: «Estou bem, obrigada».'},
  ]}),
  itemLesson({id:'portuguese-survival-04',title:'Comunicación esencial · 4 · Pedir ayuda',description:'Frases para entender y hacerte entender.',introText:'Con estas frases puedes pedir que te repitan, que hablen más despacio o preguntar por el baño.',items:[
    {target:'Sim.',meaning:'Sí.'},
    {target:'Não sei.',meaning:'No sé.'},
    {target:'Não compreendo.',meaning:'No entiendo.'},
    {target:'Pode repetir, por favor?',meaning:'¿Puede repetir, por favor?'},
    {target:'Fale mais devagar, por favor.',meaning:'Hable más despacio, por favor.'},
    {target:'Onde é a casa de banho?',meaning:'¿Dónde está el baño?',usage:'En Portugal: casa de banho; en Brasil: banheiro.'},
  ]}),
]});

// ── C1. time: era la misma copia; ahora números, horas, días y precios ───
rebuildUnit('time',{title:'Números, horas, días y precios',description:'Números del 0 al 20, la hora, los días de la semana y los precios en euros.',testId:'portuguese-time-test-10',lessons:[
  itemLesson({id:'portuguese-time-01',title:'Números y tiempo · 1 · Del 0 al 3',description:'Uno y dos tienen forma masculina y femenina.',introText:'Um/uma y dois/duas concuerdan con el sustantivo: um livro, uma casa; dois livros, duas casas.',items:[
    {target:'zero',meaning:'cero'},
    {target:'um',meaning:'uno (masculino)',points:['um livro = un libro']},
    {target:'uma',meaning:'una (femenino)',points:['uma casa = una casa']},
    {target:'dois',meaning:'dos (masculino)',points:['dois livros']},
    {target:'duas',meaning:'dos (femenino)',points:['duas casas']},
    {target:'três',meaning:'tres',sound:'La s final suena sh en Portugal.'},
  ]}),
  itemLesson({id:'portuguese-time-02',title:'Números y tiempo · 2 · Del 4 al 8',description:'Números que se parecen al español pero suenan distinto.',introText:'Fíjate en las vocales finales: quatro suena «cuátru» y oito «óitu».',items:[
    {target:'quatro',meaning:'cuatro'},{target:'cinco',meaning:'cinco'},{target:'seis',meaning:'seis'},{target:'sete',meaning:'siete'},{target:'oito',meaning:'ocho'},
  ]}),
  itemLesson({id:'portuguese-time-03',title:'Números y tiempo · 3 · Del 9 al 14',description:'Hasta catorce.',introText:'En Portugal se dice catorze; en Brasil también quatorze.',items:[
    {target:'nove',meaning:'nueve'},{target:'dez',meaning:'diez'},{target:'onze',meaning:'once'},{target:'doze',meaning:'doce'},{target:'treze',meaning:'trece'},{target:'catorze',meaning:'catorce',usage:'En Brasil también «quatorze».'},
  ]}),
  itemLesson({id:'portuguese-time-04',title:'Números y tiempo · 4 · Del 15 al 20',description:'Las formas de Portugal: dezasseis, dezassete, dezanove.',introText:'Portugal y Brasil escriben distinto del 16 al 19: dezasseis / dezesseis, dezassete / dezessete, dezanove / dezenove. Aquí se practica la forma de Portugal.',items:[
    {target:'quinze',meaning:'quince'},
    {target:'dezasseis',meaning:'dieciséis',usage:'En Brasil: «dezesseis».'},
    {target:'dezassete',meaning:'diecisiete',usage:'En Brasil: «dezessete».'},
    {target:'dezoito',meaning:'dieciocho'},
    {target:'dezanove',meaning:'diecinueve',usage:'En Brasil: «dezenove».'},
    {target:'vinte',meaning:'veinte'},
  ]}),
  itemLesson({id:'portuguese-time-05',title:'Números y tiempo · 5 · La hora',description:'Preguntar y decir la hora.',introText:'Como en español: «É uma hora» (singular) y «São duas horas» (plural). Para la una y las dos se usa la forma femenina: uma, duas (la hora es femenina).',items:[
    {target:'Que horas são?',meaning:'¿Qué hora es?'},
    {target:'É uma hora.',meaning:'Es la una.',points:['Singular: é']},
    {target:'São duas horas.',meaning:'Son las dos.',points:['Plural: são','duas: femenino, porque hora es femenino']},
    {target:'É meio-dia.',meaning:'Es mediodía.'},
    {target:'São dez e um quarto.',meaning:'Son las diez y cuarto.'},
  ]}),
  itemLesson({id:'portuguese-time-06',title:'Números y tiempo · 6 · Los días de la semana',description:'De segunda-feira a domingo.',introText:'Los días laborables se cuentan desde el domingo: segunda-feira (lunes) es el «segundo día». En la conversación se acorta: segunda, terça, quarta…',items:[
    {target:'segunda-feira',meaning:'lunes',memory:'2.º día contando desde el domingo'},
    {target:'terça-feira',meaning:'martes',memory:'3.er día'},
    {target:'quarta-feira',meaning:'miércoles',memory:'4.º día'},
    {target:'quinta-feira',meaning:'jueves',memory:'5.º día'},
    {target:'sexta-feira',meaning:'viernes',memory:'6.º día'},
    {target:'sábado',meaning:'sábado'},
    {target:'domingo',meaning:'domingo'},
  ]}),
  itemLesson({id:'portuguese-time-07',title:'Números y tiempo · 7 · Precios',description:'Euros y cêntimos.',introText:'En Portugal se paga en euros y cêntimos (en Brasil, reais y centavos).',items:[
    {target:'Quanto custa?',meaning:'¿Cuánto cuesta?'},
    {target:'um euro',meaning:'un euro'},
    {target:'cinco euros',meaning:'cinco euros',sound:'La s final de euros suena sh.'},
    {target:'cinquenta cêntimos',meaning:'cincuenta céntimos',usage:'En Brasil: «centavos».'},
    {target:'Custa dez euros.',meaning:'Cuesta diez euros.'},
  ]}),
]});

// ── C1. questions duplicaba essentials; ahora preguntas completas y negación
rebuildUnit('questions',{title:'Preguntas y estructura',description:'Preguntas completas, porquê / porque é que y la negación con não.',testId:'portuguese-questions-test-03',lessons:[
  itemLesson({id:'portuguese-questions-01',title:'Preguntas y estructura · 1 · Preguntas completas',description:'Las palabras interrogativas dentro de frases útiles.',introText:'En Portugal es muy frecuente añadir «é que» tras la palabra interrogativa: Onde é que fica? Porque é que…? Para preguntar «¿por qué?» se dice porquê (sola) o porque é que (con verbo).',items:[
    {target:'O que é isto?',meaning:'¿Qué es esto?'},
    {target:'Onde fica o hotel?',meaning:'¿Dónde está el hotel?',points:['ficar = estar situado (lugares que no se mueven)']},
    {target:'Quando chega o comboio?',meaning:'¿Cuándo llega el tren?',usage:'En Brasil: «trem».'},
    {target:'Porquê?',meaning:'¿Por qué?',points:['Sola, al final: porquê','En Brasil se escribe «Por quê?»']},
    {target:'Porque é que estudas português?',meaning:'¿Por qué estudias portugués?',points:['porque é que + verbo','La respuesta empieza por porque (porque)']},
    {target:'Como se diz isto em português?',meaning:'¿Cómo se dice esto en portugués?'},
  ]}),
  itemLesson({id:'portuguese-questions-02',title:'Preguntas y estructura · 2 · Sí, no y negación',description:'Preguntar solo con la entonación y negar con não.',introText:'Una pregunta de sí/no no cambia el orden: solo sube la entonación. Para responder se repite el verbo: «Falas português?» — «Falo.» La negación não va siempre antes del verbo.',items:[
    {target:'Falas português?',meaning:'¿Hablas portugués?',points:['Mismo orden que la afirmación; solo cambia la entonación']},
    {target:'Falo, sim.',meaning:'Sí, lo hablo.',points:['Se responde repitiendo el verbo']},
    {target:'Não falo inglês.',meaning:'No hablo inglés.',points:['não + verbo']},
    {target:'Não, não falo.',meaning:'No, no lo hablo.'},
    {target:'Também não.',meaning:'Tampoco.'},
  ]}),
]});
course.units.find(entry=>entry.id==='questions').description='Preguntas completas, porquê / porque é que y la negación con não.';

// ── C3. essentials: conjugar en presente; por que → porquê ───────────────
const essentials=unit('essentials');
const presentRegular=itemLesson({id:'portuguese-essentials-07',title:'Pronombres y verbos esenciales · 7 · El presente: -ar, -er, -ir',description:'La regla que convierte falar en falo, falas, fala…',introText:'Quita -ar, -er o -ir y añade la terminación de la persona. -ar: -o, -as, -a, -amos, -am. -er: -o, -es, -e, -emos, -em. -ir: -o, -es, -e, -imos, -em. Con o senhor / você se usa la forma de ele/ela.',items:[
  {target:'falo',meaning:'hablo (eu)',points:['falar → fal- + o']},
  {target:'falas',meaning:'hablas (tu)',points:['fal- + as']},
  {target:'fala',meaning:'habla (ele, ela, o senhor, você)',points:['fal- + a']},
  {target:'falamos',meaning:'hablamos (nós)',points:['fal- + amos']},
  {target:'falam',meaning:'hablan (eles, elas, vocês)',points:['fal- + am','vocês = ustedes; «vós» casi no se usa']},
  {target:'bebo',meaning:'bebo (eu)',points:['beber → beb- + o','-er: bebo, bebes, bebe, bebemos, bebem']},
  {target:'abrimos',meaning:'abrimos (nós)',points:['abrir → abr- + imos','-ir: abro, abres, abre, abrimos, abrem']},
]});
presentRegular.activities.push(
  {id:'portuguese-essentials-07-production-blocks',type:'build_with_blocks',prompt:'Arma la frase: «No bebo café»',target:'No bebo café.',options:['bebo','café.','Eu','não'],joiner:' ',answer:'Eu não bebo café.',accepted_answers:['Eu não bebo café.','Não bebo café.'],explanation:'Eu (yo) · não (no, siempre antes del verbo) · bebo (bebo) · café.',audio:'Eu não bebo café.',slow_audio:'Eu não bebo café.',image:null,writing_asset:null,tags:['production','blocks'],xp:15},
  {id:'portuguese-essentials-07-production-typed',type:'typed_translation',prompt:'Escribe la forma de «falar» para «nós»',target:'falar (nós)',instruction:'Escribe solo la forma conjugada.',answer:'falamos',accepted_answers:['falamos','nós falamos'],allow_minor_typos:false,explanation:'falar → fal- + amos → falamos.',audio:'falamos',slow_audio:'falamos',image:null,writing_asset:null,tags:['production'],xp:20},
);
const presentIrregular=itemLesson({id:'portuguese-essentials-08',title:'Pronombres y verbos esenciales · 8 · Verbos irregulares',description:'sou, estou, tenho, vou, quero, posso, faço.',introText:'Los verbos más frecuentes son irregulares en la forma de «eu». Apréndelos como palabras nuevas: sou (soy), estou (estoy), tenho (tengo), vou (voy).',items:[
  {target:'sou',meaning:'soy',points:['ser: sou, és, é, somos, são']},
  {target:'estou',meaning:'estoy',points:['estar: estou, estás, está, estamos, estão']},
  {target:'tenho',meaning:'tengo',points:['ter: tenho, tens, tem, temos, têm']},
  {target:'vou',meaning:'voy',points:['ir: vou, vais, vai, vamos, vão']},
  {target:'quero',meaning:'quiero',points:['querer: quero, queres, quer, queremos, querem']},
  {target:'posso',meaning:'puedo',points:['poder: posso, podes, pode, podemos, podem']},
  {target:'faço',meaning:'hago',points:['fazer: faço, fazes, faz, fazemos, fazem']},
]});
upsertLessons(essentials,[presentRegular,presentIrregular],'portuguese-essentials-test-08');
const essentialsTest=essentials.lessons.find(lesson=>lesson.id==='portuguese-essentials-test-08');
const essentialsExtra=reviewLesson({id:'x',title:'',lessons:[presentRegular,presentIrregular],isTest:true,count:6}).activities.slice(1).map((activity,index)=>({...activity,id:`portuguese-essentials-test-08-new-${index+1}`}));
essentialsTest.activities=[...essentialsTest.activities.filter(activity=>!activity.id.startsWith('portuguese-essentials-test-08-new-')),...essentialsExtra];

// tu / você: la glosa y la nota describían el uso de Brasil como general.
const registerNote='En Portugal: tu con familia y amigos; para «usted» se usa o senhor / a senhora. «Você» es normal en Brasil, pero en Portugal puede sonar distante. Con você se conjuga como con él/ella.';
for(const activity of allActivities(essentials).filter(activity=>activity.target==='tu / você'&&activity.type==='teach_concept')){
  activity.usage_note=registerNote;activity.context_note='';
  activity.word_breakdown=[{text:'tu',meaning:'tú',note:'2.ª persona informal (Portugal)'},{text:'/',meaning:'o (separador de alternativas)',note:'signo; indica opción'},{text:'você',meaning:'tú / usted',note:'normal en Brasil; en Portugal, tratamiento distante. Verbo en 3.ª persona'}];
}
// «por que» es la grafía brasileña de la pregunta; en Portugal: porquê / porque é que.
for(const id of ['essentials','vocabulary']){
  const data=unit(id);
  replaceText(data,'por que','porquê',{whole:true});
  replaceText(data,'¿Qué significa «por que»?','¿Qué significa «porquê»?',{whole:true});
  replaceText(data,'La forma escrita correcta es «por que»: por qué.','La forma escrita correcta es «porquê»: por qué.',{whole:true});
  for(const activity of allActivities(data).filter(activity=>activity.target==='porquê'&&activity.type==='teach_concept')){
    activity.explanation='Pregunta por la causa. En Portugal: «Porquê?» sola o «Porque é que…?» con verbo. La respuesta usa porque (porque).';
    activity.usage_note='En Brasil se escribe «Por que…?» y «Por quê?».';activity.context_note='';
    activity.word_breakdown=[{text:'porquê',meaning:'por qué',note:'pregunta sobre causa o motivo (grafía de Portugal)'}];
  }
}

// ── C1. reading-bridge y story-bridge eran la misma copia de pronombres ──
rebuildUnit('reading-bridge',{title:'Escucha y lectura guiada',description:'Frases cortas con los verbos en presente y estar a + infinitivo.',testId:'portuguese-reading-bridge-test-04',lessons:[
  itemLesson({id:'portuguese-reading-bridge-01',title:'Escucha y lectura guiada · 1 · Presentarse',description:'Frases con sou, estou y tenho.',introText:'Lee y escucha frases completas con los verbos que ya conjugas. En Portugal se pone artículo delante del nombre de una persona conocida: o Pedro, a Ana.',items:[
    {target:'Eu sou o Pedro.',meaning:'Soy Pedro.',points:['En Portugal: artículo + nombre propio (o Pedro, a Ana)']},
    {target:'Sou mexicano.',meaning:'Soy mexicano.'},
    {target:'Sou mexicana.',meaning:'Soy mexicana.'},
    {target:'Estou cansado.',meaning:'Estoy cansado.',usage:'Una mujer dice «Estou cansada».'},
    {target:'Tenho vinte anos.',meaning:'Tengo veinte años.'},
  ]}),
  itemLesson({id:'portuguese-reading-bridge-02',title:'Escucha y lectura guiada · 2 · El día a día',description:'Frases con verbos regulares e irregulares.',introText:'Fíjate en la terminación de cada verbo: dice quién hace la acción.',items:[
    {target:'Vou para casa.',meaning:'Me voy a casa.'},
    {target:'Estudo português todos os dias.',meaning:'Estudio portugués todos los días.'},
    {target:'A Ana está em casa.',meaning:'Ana está en casa.'},
    {target:'O Pedro tem dois irmãos.',meaning:'Pedro tiene dos hermanos.'},
    {target:'Moramos em Lisboa.',meaning:'Vivimos en Lisboa.',points:['morar = vivir (residir)']},
  ]}),
  itemLesson({id:'portuguese-reading-bridge-03',title:'Escucha y lectura guiada · 3 · Lo que estoy haciendo',description:'estar a + infinitivo, la forma de Portugal.',introText:'Para «estoy haciendo» en Portugal se dice estar a + infinitivo: estou a estudar. En Brasil se usa el gerundio: estou estudando.',items:[
    {target:'Estou a estudar.',meaning:'Estoy estudiando.',usage:'En Brasil: «Estou estudando».'},
    {target:'Estou a ler um livro.',meaning:'Estoy leyendo un libro.'},
    {target:'Ela está a trabalhar.',meaning:'Ella está trabajando.'},
    {target:'O que estás a fazer?',meaning:'¿Qué estás haciendo?'},
    {target:'Estamos a comer.',meaning:'Estamos comiendo.'},
  ]}),
]});
rebuildUnit('story-bridge',{title:'Puente hacia las historias',description:'Artículos, contracciones (do, na, ao, à, num) y posesivos con artículo.',testId:'portuguese-story-bridge-test-03',lessons:[
  itemLesson({id:'portuguese-story-bridge-01',title:'Puente hacia las historias · 1 · Artículos y contracciones con de y em',description:'o, a, do, da, no, na.',introText:'El artículo es o (el) y a (la). Se une a las preposiciones: de + o = do, de + a = da, em + o = no, em + a = na. Las verás en cada línea de las historias.',items:[
    {target:'o comboio',meaning:'el tren',points:['o = el'],usage:'Forma de Portugal; en Brasil: «o trem».'},
    {target:'a mesa',meaning:'la mesa',points:['a = la']},
    {target:'a casa da Ana',meaning:'la casa de Ana',points:['de + a = da']},
    {target:'Sou do México.',meaning:'Soy de México.',points:['de + o = do']},
    {target:'Estou no Porto.',meaning:'Estoy en Oporto.',points:['em + o = no']},
    {target:'Vivo na cidade.',meaning:'Vivo en la ciudad.',points:['em + a = na']},
  ]}),
  itemLesson({id:'portuguese-story-bridge-02',title:'Puente hacia las historias · 2 · ao, à, num y posesivos',description:'a + o = ao, a + a = à; o meu, a minha.',introText:'a + o = ao, a + a = à (con acento grave). em + um = num, em + uma = numa. En Portugal el posesivo suele llevar artículo: o meu livro, a minha casa.',items:[
    {target:'Vou ao mercado.',meaning:'Voy al mercado.',points:['a + o = ao']},
    {target:'Vou à praia.',meaning:'Voy a la playa.',points:['a + a = à']},
    {target:'o meu livro',meaning:'mi libro',points:['En Portugal: artículo + posesivo']},
    {target:'a minha casa',meaning:'mi casa'},
    {target:'num café',meaning:'en un café',points:['em + um = num']},
    {target:'numa loja',meaning:'en una tienda',points:['em + uma = numa']},
  ]}),
]});

// ── I. vocabulary: formas de Brasil sin etiquetar → norma europea ────────
const vocabulary=unit('vocabulary');
const swaps=[
  ['suco','sumo','En Portugal: sumo. En Brasil: suco.'],
  ['equipe','equipa','En Portugal: equipa. En Brasil: equipe.'],
  ['bebê','bebé','En Portugal: bebé. En Brasil: bebê.'],
  ['tela','ecrã','En Portugal: ecrã. En Brasil: tela.'],
  ['aplicativo','aplicação','En Portugal: aplicação (o app). En Brasil: aplicativo.'],
  ['xícara','chávena','En Portugal: chávena. En Brasil: xícara.'],
  ['marrom','castanho','En Portugal: castanho. En Brasil: marrom.'],
  ['cinza','cinzento','En Portugal: cinzento. En Brasil: cinza.'],
  ['sacola','saco','En Portugal: saco (de compras). En Brasil: sacola.'],
  ['metrô','metro','En Portugal: metro. En Brasil: metrô.'],
  ['ruim','mau','En Portugal: mau (malo). En Brasil es muy común «ruim».'],
  ['porta-roupa','cabide','cabide = percha o perchero. «porta-roupa» no es de uso corriente.'],
];
for(const [from,to] of swaps)replaceWord(vocabulary,from,to);
for(const [,to,note] of swaps)for(const activity of allActivities(vocabulary).filter(activity=>activity.type==='teach_concept'&&activity.target===to))activity.usage_note=note;
// saco y bolsa ya no comparten la misma glosa.
for(const activity of allActivities(vocabulary).filter(activity=>activity.target==='saco'||(activity.type==='listening_choice'&&activity.answer==='saco'))){
  if(activity.meaning==='bolsa')activity.meaning='bolsa de la compra';
  if(activity.answer==='bolsa'){activity.options=activity.options.map(option=>option==='bolsa'?'bolsa de la compra':option);activity.answer='bolsa de la compra';activity.explanation='bolsa de la compra';}
  for(const key of ['explanation','sound_hint'])if(activity[key])activity[key]=activity[key].replace(/^bolsa\. /,'bolsa de la compra. ').replace('«saco»: bolsa.','«saco»: bolsa de la compra.');
}
for(const activity of allActivities(vocabulary).filter(activity=>activity.target==='cabide'||(activity.type==='listening_choice'&&activity.answer==='cabide'))){
  if(activity.meaning==='perchero')activity.meaning='percha / perchero';
  if(activity.answer==='perchero'){activity.options=activity.options.map(option=>option==='perchero'?'percha / perchero':option);activity.answer='percha / perchero';activity.explanation='percha / perchero';}
  for(const key of ['explanation','sound_hint'])if(activity[key])activity[key]=activity[key].replace(/^perchero\. /,'percha / perchero. ').replace('«cabide»: perchero.','«cabide»: percha / perchero.');
}
// Ejemplos agramaticales, brasileños o incoherentes con Portugal.
for(const [from,to] of [
  ['Minha nariz está fria. — Mi nariz está fría.','O meu nariz está frio. — Mi nariz está fría.'],
  ['O internet está lento. — Internet está lento.','A internet está lenta. — Internet está lento.'],
  ['Minha idade é dez anos. — Mi edad es diez años.','Que idade tens? — ¿Qué edad tienes?'],
  ['Ela levanta cedo. — Ella se levanta temprano.','Ela levanta-se cedo. — Ella se levanta temprano.'],
  ['Eu quero sair, mas está chovendo. — Quiero salir, pero está lloviendo.','Eu quero sair, mas está a chover. — Quiero salir, pero está lloviendo.'],
  ['Janeiro é quente. — Enero es caluroso.','Janeiro é frio. — Enero es frío.'],
  ['Junho é frio. — Junio es frío.','Junho é quente. — Junio es caluroso.'],
  ['Meu dedo está machucado. — Mi dedo está lastimado.','O meu dedo está magoado. — Mi dedo está lastimado.'],
  ['O ônibus chega às sete. — El autobús llega a las siete.','O autocarro chega às sete. — El autobús llega a las siete.'],
  ['O ônibus vai chegar. — El autobús va a llegar.','O autocarro vai chegar. — El autobús va a llegar.'],
  ['Este curso usa portugués brasileño: você es la forma común para una persona y se conjuga como él/ella, no como tú.','En Brasil, você es la forma normal de «tú». En Portugal se usa tu con amigos y o senhor / a senhora para «usted»; você puede sonar distante. Se conjuga como él/ella.'],
  ['Você é meu amigo.','Você é o meu amigo.'],
  // Concordancia tras cambiar a la forma de Portugal.
  ['O aplicação é fácil.','A aplicação é fácil.'],
  ['A saco está cheia.','O saco está cheio.'],
  ['A mesa é castanho.','A mesa é castanha.'],
  ['A ecrã é grande.','O ecrã é grande.'],
  ['A equipa trabalha junto. — El equipo trabaja junto.','A equipa trabalha em conjunto. — El equipo trabaja en conjunto.'],
])replaceText(vocabulary,from,to);
// En Portugal el posesivo lleva artículo y «hay» es «há».
const examplePattern=/(Ejemplo: )(Meu|Minha|Meus|Minhas) /g,article={Meu:'O meu',Minha:'A minha',Meus:'Os meus',Minhas:'As minhas'};
for(const activity of allActivities(vocabulary))for(const key of ['explanation','sound_hint'])if(typeof activity[key]==='string'){
  activity[key]=activity[key].replace(examplePattern,(_,prefix,word)=>`${prefix}${article[word]} `).replace(/(Ejemplo: )Tem ([^—]*?) — (¿?)Hay/g,'$1Há $2 — $3Hay');
}
// Falsos amigos frecuentes para hispanohablantes.
const falseFriends={
  'escritório':'Falso amigo: «oficina» en portugués significa «taller».',
  'copo':'Falso amigo: copo es «vaso»; la copa de vino es «taça».',
  'acordar':'Falso amigo: no significa «acordar» ni «recordar» (= lembrar-se), sino despertarse.',
  'rio':'Ojo: en el ejemplo, largo significa «ancho»; «largo» en español es comprido.',
  'tarde':'tarde = tarde (hora avanzada) y también la tarde (parte del día): à tarde.',
  'aula':'aula = clase (la sesión); turma = el grupo de alumnos.',
  'turma':'turma = el grupo de alumnos; aula = la sesión de clase.',
};
for(const activity of allActivities(vocabulary).filter(activity=>activity.type==='teach_concept'&&falseFriends[activity.target]))activity.usage_note=falseFriends[activity.target];
for(const id of ['a1-1-routine']){
  for(const activity of allActivities(unit(id)).filter(activity=>activity.type==='teach_concept'&&activity.target==='acordar'))activity.usage_note=falseFriends.acordar;
}
for(const id of ['a2-1-ability','a2-2-culture','b1-1-media']){
  for(const activity of allActivities(unit(id)).filter(activity=>activity.type==='teach_concept'&&/\btirar\b/.test(activity.target)))activity.usage_note='Falso amigo: tirar = quitar o sacar (tirar fotografias = sacar fotos); «tirar a la basura» es deitar fora.';
}

// ── I. Traducciones al español erróneas o con registro mezclado ──────────
const order=course.levels.flatMap(level=>level.unitIds);
const spanishFixes=[
  ['Hablo un poco de este idioma.','Hablo un poco de portugués.'],
  ['¿Cuántos años tienes?','¿Cuántos años tiene?'],
  ['Lleva un paraguas.','Lleve un paraguas.'],
  ['Debes mostrar tu pasaporte.','Tiene que mostrar el pasaporte.'],
  ['Aquí se puede tomar fotos.','Aquí puede tomar fotos.'],
  ['La factura no es correcta.','La cuenta no está bien.'],
  ['Hasta cierto punto, el resultado fue positivo.','En general, el resultado fue positivo.'],
  ['Hay una diferencia sutil entre estas dos expresiones.','Las expresiones difieren ligeramente.'],
  ['¿Qué tan segura es esa información?','¿Esta información es fiable?'],
  ['La idea parece buena; sin embargo, puede ser costosa.','Buena idea, pero quizá salga cara.'],
  ['Entiendo tu punto, aunque lo veo de otra manera.','Entiendo tu punto, pero no estoy de acuerdo.'],
  ['Probablemente funcione, siempre que todos participen.','Debería funcionar si todos participan.'],
  ['Aceptaría si cambiamos la fecha.','Aceptaría si cambiáramos la fecha.'],
  ['Entonces, ¿quedamos de acuerdo en este plan?','Entonces, ¿estamos de acuerdo?'],
  ['Propongo que probemos esta opción primero.','Probemos primero esta opción.'],
  ['Podemos ceder en el precio, pero no en la calidad.','Cedemos en el precio, no en la calidad.'],
  ['Tenemos que decidir qué es prioritario.','¿Qué va primero?'],
  ['¿Qué cambiaríamos la próxima vez?','¿Qué cambiamos la próxima vez?'],
  ['Conviene considerar también el contexto histórico.','Consideremos también el contexto histórico.'],
  ['Comparar ambas perspectivas ayuda a comprender el problema.','Comparar perspectivas aclara el problema.'],
  ['En resumen, tenemos dos opciones principales.','En resumen, tenemos dos opciones.'],
  ['Si tuviera más tiempo, aprendería otro idioma.','Si tuviera tiempo, aprendería otro idioma.'],
  ['En caso de que necesites ayuda, llámame.','Si necesitas ayuda, llámame.'],
];
for(const id of order.filter(id=>/^[ab]\d-/.test(id))){
  const data=unit(id);
  for(const [from,to] of spanishFixes)replaceText(data,from,to);
  replaceText(data,'factura','cuenta (lo que hay que pagar)',{whole:true});
  replaceText(data,'«conta»: factura.','«conta»: cuenta (lo que hay que pagar).');
  if(/^a2-/.test(id)){replaceText(data,'saber','saber (hacer algo)',{whole:true});replaceText(data,'«saber fazer»: saber.','«saber fazer»: saber (hacer algo).');}
}
replaceText(unit('a1-1-people'),'niño','niño / niña',{whole:true});
replaceText(unit('a1-1-people'),'«criança»: niño.','«criança»: niño / niña.');
for(const activity of allActivities(unit('a1-1-people')).filter(activity=>activity.type==='teach_concept'&&activity.target==='criança'))activity.usage_note='criança es siempre femenino (a criança) aunque se refiera a un niño.';
for(const activity of allActivities(unit('a1-1-identity')).filter(activity=>activity.type==='teach_concept'&&activity.target==='Obrigado.'))activity.usage_note='Lo dice un hombre. Una mujer dice «Obrigada».';

// a1-2-health: el alumno debía decir la frase del médico.
const health=unit('a1-2-health');
for(const activity of allActivities(health)){
  if(activity.id==='portuguese-a1-2-health-production-speak')Object.assign(activity,{prompt:'Di en voz alta: «Dói-me a cabeça.»',target:'Me duele la cabeza.',answer:'Dói-me a cabeça.',accepted_answers:['Dói-me a cabeça.'],explanation:'El modelo es «Dói-me a cabeça.». También puedes escribirlo.',audio:'Dói-me a cabeça.',slow_audio:'Dói-me a cabeça.'});
  if(activity.id==='portuguese-a1-2-health-production-dialogue'){
    activity.turns[2].translation='Quieres expresar: «Me duele la cabeza.».';
    Object.assign(activity.turns[3],{prompt:'Di o escribe en portugués: «Me duele la cabeza.»',answer:'Dói-me a cabeça.',audio:'Dói-me a cabeça.'});
    activity.turns[3].accepted_answers=[...new Set(['Dói-me a cabeça.',...(activity.turns[3].accepted_answers||[]).filter(answer=>answer!=='Tome isto duas vezes por dia.')])];
  }
}

// ── C. Producción: variantes correctas aceptadas y diálogos con margen ───
const accepted={
  'Como se chama?':['Como te chamas?','Qual é o seu nome?','Qual é o teu nome?','Como é que se chama?'],
  'Sou do México.':['Eu sou do México.','Sou mexicano.','Sou mexicana.'],
  'Quem é?':['Quem é ele?','Quem é ela?'],
  'Quantos anos tem?':['Quantos anos tens?','Que idade tem?','Que idade tens?'],
  'língua':['idioma','a língua'],
  'A chave está em cima da mesa.':['A chave está na mesa.','A chave está sobre a mesa.'],
  'O meu quarto é pequeno.':['Meu quarto é pequeno.','O quarto é pequeno.'],
  'Levanto-me às sete.':['Eu levanto-me às sete.','Levanto-me às 7.','Levanto-me às 7h.'],
  'Estudo à tarde.':['Eu estudo à tarde.','Estudo de tarde.'],
  'Bebo chá de manhã.':['Eu bebo chá de manhã.','De manhã bebo chá.','Bebo chá pela manhã.'],
  'Quero um pouco de arroz.':['Queria um pouco de arroz.','Um pouco de arroz, por favor.'],
  'A estação fica à esquerda.':['A estação está à esquerda.','Fica à esquerda.'],
  'Vou para a escola.':['Vou à escola.','Eu vou para a escola.'],
  'Posso pagar com cartão?':['Posso pagar por cartão?','Aceitam cartão?','Pode ser com cartão?'],
  'Só tenho dinheiro.':['Só tenho numerário.','Só tenho dinheiro vivo.','Tenho só dinheiro.'],
  'Chego às oito.':['Chego às 8.','Eu chego às oito.','Chego às 8h.'],
  'Tenho de mudar?':['Tenho que mudar?','Tenho de fazer transbordo?','Tenho de mudar de comboio?'],
  'O comboio está atrasado.':['O comboio vem atrasado.','O comboio tem atraso.'],
  'Tenho alergia à penicilina.':['Sou alérgico à penicilina.','Sou alérgica à penicilina.'],
  'Dói-me a cabeça.':['Tenho dor de cabeça.','Estou com dor de cabeça.'],
  'Preciso de um casaco.':['Eu preciso de um casaco.','Preciso dum casaco.'],
  'O tempo muda depressa.':['O tempo muda rapidamente.'],
  'Onde nos encontramos?':['Onde é que nos encontramos?','Onde nos vemos?'],
  'Tenho tempo depois das seis.':['Tenho tempo depois das 6.','Estou livre depois das seis.'],
};
const FREE_TYPES=new Set(['typed_translation','speak_and_transcribe','open_question']);
const widen=target=>{const extra=accepted[target.answer];if(!extra)return;target.accepted_answers=[...new Set([...(target.accepted_answers||[target.answer]),...extra])];};
for(const id of order.filter(id=>/^[ab]\d-/.test(id))){
  for(const activity of allActivities(unit(id))){
    if(id.startsWith('a1-')&&FREE_TYPES.has(activity.type))widen(activity);
    if(activity.turns){
      if(id.startsWith('a1-'))activity.turns.filter(turn=>turn.role==='learner').forEach(widen);
      const learners=activity.turns.filter(turn=>turn.role==='learner').length;
      if(learners>=3)activity.minimum_correct=learners-1;
    }
  }
}

// ── Política de variantes en course.json ─────────────────────────────────
course.variantPolicy.note='Base: portugués europeo (pt-PT), la misma variedad que el audio. Las formas de Brasil se presentan etiquetadas como variante (ônibus, trem, banheiro, celular, você…).';

// ── Guardar ────────────────────────────────────────────────────────────
const changed=[];
for(const [name,file] of files){
  const after=JSON.stringify(file.data,null,2)+'\n';
  if(after!==file.before){fs.writeFileSync(file.url,after);changed.push(name);}
}
console.log(JSON.stringify({changed},null,1));
