// Plan de clases: el orden en que un profesor enseñaría el idioma. Cada clase
// tiene un objetivo («decir tu nombre») y solo enseña lo que ese objetivo necesita.
// Los cursos e historias viejos son el material: aquí se elige qué se usa y cuándo.
// Módulo puro (sin DOM) para poder probarlo con node:test.
//
// Secuencia: contacto social → identidad → números → personas → cosas y lugares →
// acciones → necesidades → tiempo → transacciones (orden habitual en los temarios A1).
// Cada clase sigue presentación → práctica controlada → producción.
//
// Las A1 de los 10 idiomas comparten inventario y posición, así que una referencia
// como 'identity:2' es la misma frase en todos, con su audio ya grabado.
import{CLASS_RULES,CLASS_NUMBERS}from'./data/class_rules.js';
import{UNIT_RULE_KEYS,UNIT_RULES}from'./data/unit_rules.js';
import{themeFor}from'./syllabus.js';

const UNIT_KEYS={identity:'a1-1-identity',people:'a1-1-people',home:'a1-1-home',routine:'a1-1-routine',food:'a1-1-food',places:'a1-1-places',shopping:'a1-2-shopping',time:'a1-2-time'};
const refs=(unit,list)=>list.map(index=>`${unit}:${index}`);

export const CLASS_MODULES=Object.freeze([
  {id:'contacto',title:'Primer contacto'},{id:'personas',title:'Las personas'},{id:'casa',title:'Tu casa y tus cosas'},{id:'dia',title:'Tu día'},{id:'comida',title:'Comer y beber'},{id:'ciudad',title:'Moverte por la ciudad'},{id:'tiempo',title:'El tiempo y las citas'},{id:'compras',title:'De compras'},
]);

// items: lo nuevo de la clase. dialogue: [hablante,referencia]; solo usa lo de hoy o lo
// ya visto. replies: [te dicen,respondes]. task: lo que el alumno hace por su cuenta.
export const CLASS_PLAN=Object.freeze([
  {id:'c01',module:'contacto',title:'Saludar y despedirte',goal:'saludar, dar las gracias y despedirte.',items:refs('identity',[0,1,4,5,6,7]),dialogue:[['A','identity:1'],['B','identity:0'],['A','identity:7'],['B','identity:6'],['A','identity:5'],['B','identity:5']],replies:[['identity:1','identity:0'],['identity:5','identity:5']],task:'Di en voz alta cómo saludarías a alguien por la mañana y por la noche.'},
  {id:'c02',module:'contacto',title:'Decir tu nombre',goal:'decir cómo te llamas y preguntárselo a alguien.',items:refs('identity',[8,10,2,3]),dialogue:[['A','identity:0'],['B','identity:0'],['A','identity:10'],['B','identity:2'],['A','identity:3'],['B','identity:3']],replies:[['identity:10','identity:2'],['identity:2','identity:3']],task:'Di «Me llamo…» con tu nombre real, tres veces, cada vez más fluido.'},
  {id:'c03',module:'contacto',title:'De dónde eres y qué hablas',goal:'decir de dónde eres y avisar que hablas poco.',items:refs('identity',[9,12,13,11,14,15]),dialogue:[['A','identity:10'],['B','identity:2'],['B','identity:11'],['B','identity:14'],['A','identity:3'],['B','identity:15']],replies:[['identity:10','identity:2']],task:'Preséntate entero: saludo, nombre, de dónde eres y que hablas un poco.'},
  {id:'c04',module:'contacto',title:'Contar del 1 al 10',goal:'contar del 1 al 10.',numbers:true,items:[],dialogue:[],replies:[],task:'Cuenta en voz alta del 1 al 10 y luego al revés.'},
  {id:'c05',module:'personas',title:'Tu familia',goal:'presentar a tu familia.',items:[...refs('people',[0,1,4,5,2,6])],dialogue:[['A','people:2'],['B','people:6'],['A','people:0'],['A','people:1']],replies:[],task:'Piensa en una foto de tu familia y di quién es cada persona.'},
  {id:'c06',module:'personas',title:'Quién es esa persona',goal:'preguntar quién es alguien y responder.',items:[...refs('people',[8,12,13,9,10,3])],dialogue:[['A','people:10'],['B','people:3'],['A','people:10'],['B','people:6']],replies:[['people:10','people:3']],task:'Señala a dos personas (o fotos) y di quién es cada una.'},
  {id:'c07',module:'personas',title:'Edad y con quién vives',goal:'preguntar la edad y hablar de con quién vives.',items:[...refs('people',[11,7,15,14])],dialogue:[['A','people:11'],['B','people:7'],['B','people:15'],['B','people:14']],replies:[['people:10','people:3']],task:'Di cuántos hermanos tienes y con quién vives.'},
  {id:'c08',module:'casa',title:'Las partes de la casa',goal:'nombrar las partes de tu casa.',items:[...refs('home',[0,1,4,5,11])],dialogue:[['A','home:0'],['A','home:1'],['A','home:11'],['B','home:4'],['B','home:5']],replies:[],task:'Recorre tu casa con la mente y nombra cada lugar.'},
  {id:'c09',module:'casa',title:'Dónde está',goal:'preguntar dónde está algo y responder.',items:[...refs('home',[13,8,3,2,7,10])],dialogue:[['A','home:3'],['B','home:7'],['A','home:3'],['B','home:10'],['A','home:2'],['B','identity:6']],replies:[['home:3','home:2'],['home:3','home:10']],task:'Elige un objeto cercano y di dónde está.'},
  {id:'c10',module:'casa',title:'Qué hay y de quién es',goal:'decir qué hay en un lugar y de quién es algo.',items:[...refs('home',[9,12,14,15,6])],dialogue:[['A','home:14'],['B','home:15'],['A','home:6']],replies:[],task:'Di qué hay en la habitación donde estás.'},
  {id:'c11',module:'dia',title:'Las acciones de cada día',goal:'nombrar lo que haces cada día.',items:[...refs('routine',[0,1,4,5,8,9,14])],dialogue:[['A','routine:14'],['B','routine:5'],['B','routine:8']],replies:[],task:'Di tres verbos de lo que hiciste hoy, aunque sea sin frase.'},
  {id:'c12',module:'dia',title:'Cuándo haces las cosas',goal:'decir en qué momento haces algo y qué no haces.',items:[...refs('routine',[12,13,2,11,15])],dialogue:[['A','routine:11'],['B','routine:15'],['A','routine:2']],replies:[],task:'Di en qué momento del día estudias.'},
  {id:'c13',module:'dia',title:'A qué hora',goal:'contar tu rutina con horas.',items:[...refs('routine',[3,10,6,7])],dialogue:[['A','routine:10'],['B','routine:6'],['A','routine:7']],replies:[],task:'Di a qué hora te levantas (cambia la hora si hace falta).'},
  {id:'c14',module:'comida',title:'Tengo hambre, quiero esto',goal:'decir que tienes hambre o sed y pedir algo.',items:[...refs('food',[0,1,4,5,8,2,3,6])],dialogue:[['A','food:2'],['B','food:3'],['B','food:0'],['A','food:6'],['A','food:1']],replies:[],task:'Di qué quieres ahora mismo para comer o beber.'},
  {id:'c15',module:'comida',title:'Lo que comes y lo que no',goal:'decir qué comes, qué no y si algo está rico.',items:[...refs('food',[9,12,13,10,14,15])],dialogue:[['A','food:15'],['B','food:13'],['B','food:14'],['A','food:10']],replies:[],task:'Di algo que comes y algo que no comes.'},
  {id:'c16',module:'comida',title:'En el restaurante',goal:'pedir en un restaurante y pagar.',items:[...refs('food',[11,7]),'places:7'],dialogue:[['A','places:7'],['B','identity:0'],['A','food:11'],['B','identity:6'],['A','food:7']],replies:[['identity:0','food:11']],task:'Imagina el restaurante: llama, pide algo y pide la cuenta.'},
  {id:'c17',module:'ciudad',title:'Los lugares de la ciudad',goal:'preguntar dónde está un lugar.',items:[...refs('places',[0,1,4,5,8,9,2,3])],dialogue:[['A','places:7'],['A','places:2'],['B','places:3'],['A','identity:6']],replies:[['places:2','places:3']],task:'Nombra cuatro lugares cerca de tu casa.'},
  {id:'c18',module:'ciudad',title:'Cómo llegar',goal:'pedir y entender indicaciones sencillas.',items:[...refs('places',[12,13,15,6,10,11,14])],dialogue:[['A','places:15'],['B','places:6'],['A','places:2'],['B','places:10']],replies:[['places:15','places:6'],['places:2','places:10']],task:'Explica cómo llegar de tu casa a la tienda más cercana.'},
  {id:'c19',module:'tiempo',title:'Hoy, mañana y ayer',goal:'situar algo en el tiempo.',items:[...refs('time',[0,1,4,5,8,9,12,13])],dialogue:[['A','time:0'],['B','time:1'],['A','time:5']],replies:[],task:'Di qué día es hoy y qué día fue ayer.'},
  {id:'c20',module:'tiempo',title:'Qué hora es',goal:'preguntar la hora y decir cuándo llegas.',items:[...refs('time',[2,3,10,14])],dialogue:[['A','time:2'],['B','time:3'],['A','time:14'],['B','time:10']],replies:[['time:2','time:3']],task:'Mira un reloj y di la hora de una forma parecida.'},
  {id:'c21',module:'tiempo',title:'Quedar con alguien',goal:'proponer una cita y decir cuándo puedes.',items:[...refs('time',[6,7,11,15])],dialogue:[['A','time:6'],['B','time:7'],['A','time:11'],['B','time:15']],replies:[['time:6','time:7']],task:'Propón verte con alguien un día concreto.'},
  {id:'c22',module:'compras',title:'Cuánto cuesta',goal:'preguntar el precio y decir si es caro.',items:[...refs('shopping',[0,1,5,8,2,15])],dialogue:[['A','shopping:2'],['B','shopping:0'],['A','shopping:15']],replies:[['shopping:2','shopping:15']],task:'Señala algo cerca de ti y pregunta cuánto cuesta.'},
  {id:'c23',module:'compras',title:'Probarte ropa',goal:'pedir una talla o color y decidir.',items:[...refs('shopping',[4,13,3,6,14,7])],dialogue:[['A','shopping:14'],['B','places:3'],['A','shopping:3'],['A','shopping:6'],['A','shopping:7']],replies:[],task:'Imagina una tienda: pide otra talla y luego di que te lo llevas.'},
  {id:'c24',module:'compras',title:'Pagar',goal:'preguntar cómo pagar.',items:[...refs('shopping',[9,12,10,11])],dialogue:[['A','shopping:10'],['B','shopping:11']],replies:[['shopping:10','shopping:11']],task:'Repite toda una compra: precio, decisión y pago.'},
]);

// La clase más pequeña que deja el curso completo dentro de COURSE_DAYS.
const fittedSize=new WeakMap();
function extendedSpecs(units,language,stories){
  const anchor=units.values().next().value,known=anchor&&fittedSize.get(anchor);
  if(known)return specsOfSize(units,language,stories,known);
  const days=COURSE_DAYS-readingDays(units);
  let size=MIN_ITEMS,specs=specsOfSize(units,language,stories,size);
  while(specs.length>days&&size<MAX_ITEMS)specs=specsOfSize(units,language,stories,++size);
  if(anchor)fittedSize.set(anchor,size);
  return specs;
}

// Las letras y sonidos: en alfabeto latino el alumno ya puede leer, así que la clase
// empieza a comunicar desde el día 1 y la pronunciación es una lección opcional al
// terminar. En los demás alfabetos van primero: sin ellas no puede leer nada.
export const LATIN_SCRIPT=new Set(['English','French','German','Italian','Portuguese']);
export const READING_UNITS=new Set(['hangul-foundations','reading-foundations','reading','hiragana-01','katakana','rhythm']);
export const READING_LESSONS_PER_CLASS=3;

const TEACH=new Set(['teach_concept','teach_word','teach_pattern']);
const skippedLesson=lesson=>lesson.isReview||lesson.isTest||/review|test|production|checkpoint/.test(String(lesson.id));
const shortMeaning=text=>{const value=String(text||'').trim(),cut=value.indexOf('. ');return cut>0&&cut<60?value.slice(0,cut+1):value;};
const readingOf=activity=>String(activity.sound_hint||'').replace(/^Lectura:\s*/,'')||String(activity.pinyin||'');

// Inventario de una unidad, en el orden en que la unidad lo presenta.
export function unitInventory(unit){
  const seen=new Set(),items=[];
  for(const lesson of unit?.lessons||[]){
    if(skippedLesson(lesson))continue;
    for(const activity of lesson.activities||[]){
      const target=String(activity.target||'').trim();
      if(!TEACH.has(activity.type)||activity.teaching_kind==='rule'||!target||seen.has(target))continue;
      seen.add(target);
      const sentence=/[.?!。？！؟]$/.test(target)||/\s/.test(target);
      items.push({target,glossed:Boolean(activity.meaning),meaning:sentence?String(activity.meaning||activity.explanation||'').trim():shortMeaning(activity.meaning||activity.explanation),audio:activity.audio||target,slowAudio:activity.slow_audio||activity.audio||target,reading:readingOf(activity),activityId:activity.id,lessonId:lesson.id});
    }
  }
  return items;
}

// ── De lo diseñado a mano al B1 ───────────────────────────────────────
// El curso entero cabe en COURSE_DAYS clases. Cada elemento se enseña una sola vez:
// las unidades de A2 y B1 reutilizan frases de otras, y esas ya no cuentan como nuevas.
export const COURSE_DAYS=120;
const MIN_ITEMS=6,MAX_ITEMS=12;
const PLAN_UNITS=['a1-2-transport','a1-2-health','a1-2-weather','a1-2-social','a2-1-past','a2-1-future','a2-1-comparison','a2-1-ability','a2-1-services','a2-1-conversation','a2-2-opinions','a2-2-experiences','a2-2-workStudy','a2-2-technology','a2-2-culture','a2-2-problemSolving','b1-1-narrative','b1-1-cause-effect','b1-1-media','b1-1-emotions','b1-1-society','b1-1-register','b1-2-conditions','b1-2-nuance','b1-2-negotiation','b1-2-projects','b1-2-perspectives','b1-2-conversation'];
// Vocabulario por tema: se enseña justo después del módulo que trata ese tema.
const WORD_UNITS=['a1-1-introductions','survival','essentials','questions','time','vocabulary','first-words','first-sentences','basic-verbs','adjectives'];
// Frases graduadas: práctica de lectura y escucha entre las clases de A2 y B1.
const SENTENCE_UNITS=['reading-bridge','story-bridge'];
const PACKS={
  saludos:['contacto','Más frases de cortesía','responder con naturalidad a saludos y agradecimientos.'],sobrevivir:['contacto','Salir de un apuro','pedir ayuda y hacerte entender cuando te falten palabras.'],presentarse:['contacto','Hablar de ti','contar más cosas sobre ti.'],numeros:['contacto','Más números','usar más números.'],
  familia:['personas','Más sobre las personas','hablar con más detalle de las personas de tu vida.'],preguntas:['personas','Hacer preguntas','hacer más preguntas.'],frases:['personas','Verbos para hacer frases','formar más frases con verbos básicos.'],
  casa:['casa','Más cosas de casa','describir mejor tu casa.'],objetos:['casa','Las cosas que te rodean','nombrar y señalar objetos de tu día.'],rutina:['dia','Más acciones del día','contar con más detalle lo que haces.'],comida:['comida','Más comida y bebida','decir con más detalle lo que comes y bebes.'],lugares:['ciudad','Más lugares','hablar de más lugares de la ciudad.'],tiempo:['tiempo','Días, meses y momentos','decir cuándo pasan las cosas con más precisión.'],compras:['compras','Más palabras para comprar','desenvolverte mejor en una tienda.'],
  transporte:['a1-2-transport','Más sobre transporte','hablar con más detalle de cómo te mueves.'],salud:['a1-2-health','Más sobre salud','explicar mejor cómo te sientes.'],clima:['a1-2-weather','El clima y la ropa','hablar del clima y de lo que llevas puesto.'],planes:['a1-2-social','Más planes','proponer y aceptar más planes.'],
};
const CLASS_TASK={sentences:'Elige una frase de hoy, cámbiala para que hable de ti y dila en voz alta.',words:'Usa tres palabras de hoy en frases sobre tu vida y dilas en voz alta.'};
// Cada módulo escrito a mano cierra con los ejercicios de producción de su unidad.
const MODULE_UNIT={contacto:'a1-1-identity',personas:'a1-1-people',casa:'a1-1-home',dia:'a1-1-routine',comida:'a1-1-food',ciudad:'a1-1-places',tiempo:'a1-2-time',compras:'a1-2-shopping'};
export const STORY_UNITS=['survival','a1-1-identity','a1-1-people','a1-1-home','a1-1-routine','a1-1-food','a1-1-places'];
const MODULE_STORIES={contacto:['survival','a1-1-identity'],personas:['a1-1-people'],casa:['a1-1-home'],dia:['a1-1-routine'],comida:['a1-1-food'],ciudad:['a1-1-places']};
const ARTICLE=/^(der|die|das|le|la|les|l'|l’|il|lo|i|gli|le|o|a|os|as|the|to|un|une|ein|eine) /;
const itemKey=item=>String(item.target).toLowerCase().replace(/[.,;:!?¿¡«»"。？！、]/g,'').trim().replace(ARTICLE,'');
const isSentenceItem=item=>/[.?!。？！]$/.test(item.meaning)||/[.?!。？！؟]$/.test(item.target);
const usableItem=item=>item.meaning.length>0&&item.meaning.length<=120&&item.meaning!==item.target&&!/[+→=]/.test(item.target)&&!/^[A-Za-zÀ-ÿ]$/.test(item.target)&&!/\b(elij|elig|seleccion)/i.test(item.meaning);
const inventoryOf=(units,id)=>units.has(id)?unitInventory(units.get(id)).filter(usableItem):[];
// Al final de estas listas hay formas sueltas sacadas de textos (kommst, Lina, Und): no son vocabulario.
const VOCABULARY_END={German:417,French:431};
const wordInventory=(units,id,language)=>{const list=unitInventory(units.get(id)||{}).slice(0,id==='vocabulary'?VOCABULARY_END[language]??Infinity:Infinity);return list.filter(item=>usableItem(item)&&(item.glossed||id!=='vocabulary'));};
const levelOf=id=>id.startsWith('b1')?'B1':id.startsWith('a2')?'A2':'A1';
const chunkItems=(list,size)=>{
  const chunks=[];
  for(let index=0;index<list.length;index+=size)chunks.push(list.slice(index,index+size));
  if(chunks.length>1&&chunks.at(-1).length<3)chunks.at(-2).push(...chunks.pop());
  return chunks;
};
const productionRef=(units,id)=>{const lesson=units.get(id)?.lessons?.find(item=>/production|checkpoint/.test(String(item.id))&&(item.activities||[]).length);return lesson?{unitId:id,lessonId:lesson.id}:null;};
const readingDays=units=>Math.ceil([...units.values()].filter(unit=>READING_UNITS.has(unit.id)).flatMap(unit=>unit.lessons||[]).filter(lesson=>!skippedLesson(lesson)&&(lesson.activities||[]).length).length/READING_LESSONS_PER_CLASS);
const storyLines=story=>(story.lines||[]).map(line=>({target:line.text,meaning:line.translation,audio:line.text,slowAudio:line.text,reading:'',speaker:line.speakerEs||line.speaker,speakerKo:line.speaker,gender:line.gender}));

function specsOfSize(units,language,stories,size){
  const taught=new Set(CLASS_PLAN.flatMap(spec=>spec.items.map(ref=>refItem(ref,units)).filter(Boolean).map(itemKey)));
  (CLASS_NUMBERS[language]||[]).forEach(target=>taught.add(itemKey({target})));
  const claim=list=>list.filter(item=>{const key=itemKey(item);if(taught.has(key))return false;taught.add(key);return true;});
  const lessons=PLAN_UNITS.map(id=>({id,items:claim(inventoryOf(units,id))})).filter(unit=>unit.items.length);
  const words=claim(WORD_UNITS.flatMap(id=>wordInventory(units,id,language).map(item=>({...item,unitId:id}))));
  const sentences=claim(SENTENCE_UNITS.flatMap(id=>inventoryOf(units,id)));
  const themed=new Map(),general=[];
  for(const item of words){const theme=themeFor(item.unitId,item.meaning);if(PACKS[theme])themed.set(theme,[...(themed.get(theme)||[]),item]);else general.push(item);}
  // Un tema con tres palabras no da para una clase: pasan a las palabras frecuentes.
  for(const[theme,items]of themed)if(items.length<MIN_ITEMS){general.push(...items);themed.delete(theme);}
  const pool=new Map(STORY_UNITS.map(id=>[id,[...(stories?.[id]||[])]])),takeStory=(ids=STORY_UNITS)=>{for(const id of ids){const story=pool.get(id)?.shift();if(story)return story;}return null;};
  const make=(id,module,title,goal,items,extra={})=>{const story=extra.story,lines=story?storyLines(story):items.filter(isSentenceItem);return{id,module,title,goal,resolved:items,lines,story:story?.title||'',level:extra.level||'A1',rule:extra.rule||'',production:extra.production||null,task:CLASS_TASK[items.some(isSentenceItem)?'sentences':'words']};};
  const packs=new Map();
  for(const[theme,[anchor,title,goal]]of Object.entries(PACKS))chunkItems(themed.get(theme)||[],size).forEach((items,index,all)=>{const list=packs.get(anchor)||[];list.push(make(`pack-${theme}-${index+1}`,anchor,all.length>1?`${title} · ${index+1}`:title,goal,items,{story:takeStory(MODULE_STORIES[anchor]||[])}));packs.set(anchor,list);});
  const rules=UNIT_RULES[language]||[];
  const mains=lessons.flatMap(({id,items})=>{
    const unit=units.get(id),goal=String(unit.description||unit.title).replace(/^./,char=>char.toLowerCase()).replace(/\.?$/,'.'),parts=chunkItems(items,size),ruleAt=UNIT_RULE_KEYS.indexOf(id);
    const classes=parts.map((part,index)=>make(`${id}-${index+1}`,id,parts.length>1?`${unit.title} · ${index+1}`:unit.title,goal,part,{level:levelOf(id),rule:index?'':rules[ruleAt]||'',production:index===parts.length-1?productionRef(units,id):null}));
    return[...classes,...(packs.get(id)||[])];
  });
  const fillers=[...chunkItems(general,size).map((items,index)=>({items,index,kind:'words'})),...chunkItems(sentences,size).map((items,index)=>({items,index,kind:'sentences'}))];
  const hand=CLASS_PLAN.flatMap((spec,index)=>{const last=CLASS_PLAN[index+1]?.module!==spec.module,production=last?productionRef(units,MODULE_UNIT[spec.module]):null;return[{...spec,level:'A1',production},...(last?packs.get(spec.module)||[]:[])];});
  // Las clases de palabras generales se reparten entre las de A2 y B1 para que nunca vayan dos seguidas.
  const firstLater=mains.findIndex(spec=>spec.level!=='A1'),later=mains.slice(firstLater<0?mains.length:firstLater),merged=firstLater<0?mains:mains.slice(0,firstLater);
  const totalLater=later.length+fillers.length;let used=0;
  for(let index=0;index<later.length;index++){
    merged.push(later[index]);
    while(used<fillers.length&&(used+1)/(fillers.length+1)<=(index+1)/(later.length+1)){
      const{items,index:number,kind}=fillers[used++],level=later[index].level,title=kind==='words'?`Palabras frecuentes · ${number+1}`:`Lee y entiende · ${number+1}`;
      merged.push(make(`${kind}-${number+1}`,'general',title,kind==='words'?'ampliar tu vocabulario con palabras de uso diario.':'entender frases completas al oírlas y leerlas.',items,{level,story:takeStory()}));
    }
  }
  return totalLater?[...hand,...merged]:[...hand,...mains];
}

const refItem=(ref,units)=>{const[key,index]=ref.split(':');return unitInventory(units.get(UNIT_KEYS[key]))[Number(index)]||null;};

// La clase concreta para un idioma: palabras, diálogo, regla y tarea.
export function resolveClass(spec,units,language){
  const rule=CLASS_RULES[language]?.[Number(spec.id.slice(1))-1]||'';
  if(spec.resolved)return{id:spec.id,title:spec.title,goal:spec.goal,module:spec.module,level:spec.level,items:spec.resolved,lines:spec.lines.map(item=>({...item})),story:spec.story,replies:[],rule:spec.rule,task:spec.task,production:spec.production};
  const items=spec.numbers?(CLASS_NUMBERS[language]||[]).map((target,index)=>({target,meaning:String(index+1),audio:target,slowAudio:target,reading:'',activityId:`numbers-${index+1}`,lessonId:''})):spec.items.map(ref=>refItem(ref,units)).filter(Boolean);
  const lines=spec.dialogue.map(([speaker,ref])=>{const item=refItem(ref,units);return item&&{...item,speaker:speaker==='A'?'Ana':'Leo',speakerKo:speaker==='A'?'Ana':'Leo',gender:speaker==='A'?'f':'m'};}).filter(Boolean);
  const replies=spec.replies.map(([asked,answer])=>({asked:refItem(asked,units),answer:refItem(answer,units)})).filter(pair=>pair.asked&&pair.answer);
  return{id:spec.id,title:spec.title,goal:spec.goal,module:spec.module,level:spec.level||'A1',items,lines,story:'',replies,rule,task:spec.task,production:spec.production||null};
}

export const allClassSpecs=(units,{language='',stories=null}={})=>extendedSpecs(units,language,stories);
export const doneClassIds=state=>new Set((state?.classes||[]).filter(entry=>entry.classId&&entry.completedDate).map(entry=>entry.classId));

function pendingReading(ordered,completedLessons,limit){
  const done=new Set(completedLessons),picked=[];
  for(const unit of ordered){
    if(!READING_UNITS.has(unit.id))continue;
    for(const lesson of unit.lessons||[]){
      if(done.has(lesson.id)||skippedLesson(lesson)||!(lesson.activities||[]).length)continue;
      picked.push({unitId:unit.id,lessonId:lesson.id});
      if(picked.length>=limit)return picked;
    }
  }
  return picked;
}

// Qué toca en la próxima clase: un día de lectura o la siguiente clase del plan.
export function planNextLesson(ordered,{language,completedLessons=[],state=null,stories=null}={}){
  const latin=LATIN_SCRIPT.has(language);
  if(!latin){
    const lessons=pendingReading(ordered,completedLessons,READING_LESSONS_PER_CLASS);
    if(lessons.length)return{mode:'reading',lessons};
  }
  const units=new Map(ordered.map(unit=>[unit.id,unit])),done=doneClassIds(state),spec=allClassSpecs(units,{language,stories}).find(item=>!done.has(item.id));
  if(!spec)return null;
  return{mode:'class',class:resolveClass(spec,units,language),lessons:[]};
}

// La siguiente lección opcional de pronunciación (solo alfabeto latino).
export const nextSoundLesson=(ordered,{language,completedLessons=[]}={})=>LATIN_SCRIPT.has(language)?pendingReading(ordered,completedLessons,1)[0]||null:null;

// Avance real: clases hechas sobre el total, contando los días de lectura pendientes.
export function planProgress(ordered,{language,completedLessons=[],state=null}={}){
  const units=new Map(ordered.map(unit=>[unit.id,unit])),specs=allClassSpecs(units,{language}),total=specs.length,done=doneClassIds(state).size,level=specs.find(spec=>!doneClassIds(state).has(spec.id))?.level||'B1';
  const reading=LATIN_SCRIPT.has(language)?0:Math.ceil(pendingReading(ordered,completedLessons,Infinity).length/READING_LESSONS_PER_CLASS);
  return{done,total,level,remaining:Math.max(0,total-done)+reading,percent:total?Math.min(100,Math.round(done/total*100)):0};
}
