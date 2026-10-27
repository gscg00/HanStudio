// Clase del día: convierte el mapa de lecciones en una sesión diaria de
// 30–45 minutos con fases y checkpoints. Este módulo solo contiene lógica
// pura (sin DOM) para poder probarla con node:test.

const DAY=86400000;
const TEACH_TYPES=new Set(['teach_concept','teach_word','teach_pattern','teach_kana','teach_kanji']);

// Presupuesto de actividades nuevas por clase (≈10–12 s por actividad).
export const DAILY_NEW_ACTIVITY_BUDGET=48;
// Con el nivel crece lo que cabe en una clase: al principio todo es nuevo y
// cuesta más; después el alumno avanza más rápido con la misma media hora.
export const dailyBudgetForLevel=levelIndex=>DAILY_NEW_ACTIVITY_BUDGET+Math.min(3,Math.max(0,levelIndex))*8;
export const DAILY_MAX_LESSONS=6;
export const DAILY_REVIEW_LIMIT=24;

export const DAILY_PHASES=Object.freeze([
  {id:'review',title:'Repaso de ayer',short:'Repaso',minutes:8,icon:'↻',description:'Recupera lo que aprendiste ayer antes de añadir nada nuevo.'},
  {id:'listen',title:'Escucha y repite',short:'Escucha',minutes:8,icon:'♪',description:'Escucha las frases de hoy, léelas con traducción y repítelas en voz alta.'},
  {id:'learn',title:'Aprende lo nuevo',short:'Aprende',minutes:14,icon:'✦',description:'Imagen, sonido y significado: las lecciones nuevas de hoy.'},
  {id:'practice',title:'Práctica activa',short:'Práctica',minutes:7,icon:'✎',description:'Ahora lo produces tú: arma frases, recuerda palabras y escribe lo que oyes.'},
  {id:'close',title:'Cierre del día',short:'Cierre',minutes:5,icon:'★',description:'Mezcla de hoy y de ayer para fijarlo antes de irte.'},
]);

export const dailyStateId=slug=>`daily:${slug}:v1`;

export function dateKey(now=new Date()){
  const d=new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function defaultDailyState(slug){
  return {id:dailyStateId(slug),classes:[],extraStudyDates:[],updatedAt:null};
}

export function normalizeDailyState(saved,slug){
  const base=defaultDailyState(slug);
  if(!saved||typeof saved!=='object')return base;
  return {...base,...saved,classes:Array.isArray(saved.classes)?saved.classes:[]};
}

export const currentClass=state=>state.classes.at(-1)||null;
export const previousClass=state=>state.classes.length>1?state.classes.at(-2):null;
export const isClassComplete=entry=>Boolean(entry?.completedDate);

// Qué debe ver el estudiante hoy:
// - 'in-progress': hay una clase sin terminar (se retoma, aunque sea de otro día).
// - 'done-today': ya terminó la clase de hoy; la siguiente se abre mañana.
// - 'ready': se puede crear una clase nueva.
export function dailyStatus(state,now=new Date()){
  const entry=currentClass(state);
  if(!entry)return 'ready';
  if(!isClassComplete(entry))return 'in-progress';
  return entry.completedDate===dateKey(now)?'done-today':'ready';
}

export function hoursUntilTomorrow(now=new Date()){
  const next=new Date(now);next.setHours(24,0,0,0);
  return Math.max(1,Math.ceil((next-now)/3600000));
}

const meaningOf=activity=>String(activity.meaning||activity.explanation||'').trim();
const isSentence=text=>/\s/.test(String(text).trim());

// Elementos enseñados en una lección: lo que luego se repasa y se practica.
export function taughtItems(lesson){
  const seen=new Set(),items=[];
  for(const activity of lesson?.activities||[]){
    if(!TEACH_TYPES.has(activity.type))continue;
    const target=String(activity.target||'').trim(),meaning=meaningOf(activity);
    if(!target||!meaning||seen.has(target))continue;
    // Una explicación larga no es una glosa: no sirve como opción ni como tarjeta.
    if(meaning.length>48)continue;
    // Las tarjetas de lectura con fórmulas (ㅁ + ㅏ → 마) no son vocabulario.
    if(/[+→=]/.test(target))continue;
    seen.add(target);
    items.push({target,meaning,audio:activity.audio||target,slowAudio:activity.slow_audio||activity.audio||target,activityId:activity.id,lessonId:lesson.id});
  }
  return items;
}

// Elige las lecciones nuevas de hoy siguiendo el orden del curso.
export function pickTodayLessons(ordered,{startLessonId,completedLessons=[],isUnitAccessible=()=>true,budget=DAILY_NEW_ACTIVITY_BUDGET,maxLessons=DAILY_MAX_LESSONS}={}){
  const flat=ordered.flatMap(unit=>(unit.lessons||[]).map(lesson=>({unit,lesson})));
  let start=flat.findIndex(item=>item.lesson.id===startLessonId);
  if(start<0)start=flat.findIndex(item=>!completedLessons.includes(item.lesson.id));
  if(start<0)return [];
  const picked=[];let used=0;
  for(let i=start;i<flat.length&&picked.length<maxLessons;i++){
    const item=flat[i];
    if(!isUnitAccessible(item.unit.id)&&picked.length)break;
    const size=(item.lesson.activities||[]).length;
    if(picked.length&&used+size>budget)break;
    picked.push({unitId:item.unit.id,lessonId:item.lesson.id});
    used+=size;
    // Una prueba cierra la clase: no se mezcla con contenido nuevo detrás.
    if(item.lesson.isTest)break;
  }
  return picked;
}

export function createDailyClass(state,{lessons,items,now=new Date()}){
  const number=(currentClass(state)?.number||0)+1;
  const entry={number,createdDate:dateKey(now),completedDate:null,lessons,items,phaseIndex:0,phasesDone:[],learnIndex:0,results:{},updatedAt:now.toISOString()};
  return {...state,classes:[...state.classes,entry].slice(-60),updatedAt:now.toISOString()};
}

export function completePhase(state,phaseId,result=null,now=new Date()){
  const entry={...currentClass(state)};
  if(!entry.phasesDone.includes(phaseId))entry.phasesDone=[...entry.phasesDone,phaseId];
  entry.phaseIndex=Math.max(entry.phaseIndex,DAILY_PHASES.findIndex(phase=>phase.id===phaseId)+1);
  if(result)entry.results={...entry.results,[phaseId]:{correct:result.correct,total:result.total,percentage:result.percentage}};
  if(entry.phaseIndex>=DAILY_PHASES.length)entry.completedDate=dateKey(now);
  entry.updatedAt=now.toISOString();
  return {...state,classes:[...state.classes.slice(0,-1),entry],updatedAt:now.toISOString()};
}

export function advanceLearnIndex(state,index,now=new Date()){
  const entry={...currentClass(state),learnIndex:index,updatedAt:now.toISOString()};
  return {...state,classes:[...state.classes.slice(0,-1),entry],updatedAt:now.toISOString()};
}

export function markExtraStudy(state,now=new Date()){
  const today=dateKey(now);
  return state.extraStudyDates.includes(today)?state:{...state,extraStudyDates:[...state.extraStudyDates,today].slice(-90)};
}

// ── Generación de ejercicios ────────────────────────────────────────────

function hash(text){let h=2166136261;for(const ch of String(text)){h^=ch.codePointAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function seeded(seed){let s=hash(seed)||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%100000)/100000;};}
export function shuffle(list,seed){const rand=seeded(seed),copy=[...list];for(let i=copy.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}

function distractors(item,pool,count,key,seed){
  const same=pool.filter(other=>other[key]!==item[key]&&other.meaning!==item.meaning&&isSentence(other.target)===isSentence(item.target));
  const rest=pool.filter(other=>other[key]!==item[key]&&other.meaning!==item.meaning&&!same.includes(other));
  return [...new Set([...shuffle(same,seed),...shuffle(rest,seed+'r')].map(other=>other[key]))].slice(0,count);
}

const baseActivity=(item,id,extra)=>({id,target:'',options:[],answer:'',explanation:'',audio:item.audio,slow_audio:item.slowAudio,tags:['daily'],xp:10,sourceActivityId:item.activityId,...extra});

// Recordar en la dirección difícil: ves el significado y eliges la forma en el idioma.
export function recallChoice(item,pool,seed){
  const options=shuffle([item.target,...distractors(item,pool,2,'target',seed)],`${seed}o${item.target}`);
  return baseActivity(item,`daily-recall-${seed}-${hash(item.target)}`,{type:'select_translation',dailyKind:'recall',prompt:`¿Cómo se dice «${item.meaning}»?`,target:item.meaning,targetIsSpanish:true,options,answer:item.target,audio:'',slow_audio:'',optionAudio:true,explanation:`«${item.meaning}» se dice «${item.target}».`});
}

// Escuchar y elegir el significado (comprensión sin ver la escritura).
export function listenMeaning(item,pool,seed){
  const options=shuffle([item.meaning,...distractors(item,pool,2,'meaning',seed)],`${seed}o${item.target}`);
  return baseActivity(item,`daily-listen-${seed}-${hash(item.target)}`,{type:'listening_choice',dailyKind:'listen',prompt:'Escucha y elige qué significa',options,answer:item.meaning,explanation:`Escuchaste «${item.target}»: ${item.meaning}.`});
}

// Rosetta: escucha y elige la imagen.
export function pictureChoice(item,pool,seed,hasPicture){
  const others=distractors(item,pool.filter(other=>hasPicture(other.meaning)),2,'meaning',seed);
  if(others.length<2)return null;
  const options=shuffle([item.meaning,...others],`${seed}o${item.target}`);
  return baseActivity(item,`daily-picture-${seed}-${hash(item.target)}`,{type:'listening_choice',dailyKind:'picture',picture:true,prompt:'Escucha y toca la imagen correcta',options,answer:item.meaning,explanation:`«${item.target}» = ${item.meaning}.`});
}

// Armar la frase con bloques (producción guiada).
export function buildSentence(item,seed){
  const words=String(item.target).trim().split(/\s+/);
  if(words.length<2)return null;
  return baseActivity(item,`daily-build-${seed}-${hash(item.target)}`,{type:'build_with_blocks',dailyKind:'build',prompt:`Arma la frase: «${item.meaning}»`,target:item.meaning,options:shuffle(words,`${seed}b${item.target}`),joiner:' ',answer:item.target,accepted_answers:[item.target],explanation:`La frase es «${item.target}».`,xp:15});
}

// Dictado corto: solo palabras breves para no frustrar con el teclado.
export function dictation(item,seed){
  const text=String(item.target).trim();
  if(isSentence(text)||[...text].length>4)return null;
  return baseActivity(item,`daily-dictation-${seed}-${hash(item.target)}`,{type:'dictation',dailyKind:'dictation',prompt:'Escucha y escribe lo que oyes',instruction:`Significa «${item.meaning}». Escribe la palabra en el alfabeto del idioma.`,answer:text,accepted_answers:[text],allow_minor_typos:true,explanation:`Escuchaste «${text}» (${item.meaning}).`,xp:20});
}

// Fase 1: repaso de ayer + repaso espaciado pendiente.
export function buildReviewSet(yesterdayItems,srsActivities,pool,{seed,limit=DAILY_REVIEW_LIMIT}={}){
  const out=[];
  shuffle(yesterdayItems,seed).forEach((item,index)=>{
    out.push(index%2?listenMeaning(item,pool,seed):recallChoice(item,pool,seed));
  });
  // Lo de ayer va primero; el repaso espaciado completa hasta el límite.
  const fromYesterday=out.slice(0,Math.ceil(limit*2/3));
  const srs=srsActivities.slice(0,limit-fromYesterday.length);
  return shuffle([...fromYesterday,...srs],seed+'mix');
}

// Fase 4: producción con lo aprendido hoy.
export function buildPracticeSet(todayItems,pool,{seed,hasPicture=()=>false,limit=16}={}){
  const out=[];let dictations=0;
  for(const item of shuffle(todayItems,seed)){
    const build=buildSentence(item,seed);
    if(build){out.push(build);continue;}
    const picture=hasPicture(item.meaning)?pictureChoice(item,pool,seed,hasPicture):null;
    if(picture)out.push(picture);
    if(dictations<3){const dict=dictation(item,seed);if(dict){out.push(dict);dictations++;continue;}}
    if(!picture)out.push(recallChoice(item,pool,seed));
  }
  return out.slice(0,limit);
}

// Fase 5: mezcla de hoy y ayer, solo comprensión rápida.
export function buildCloseSet(todayItems,yesterdayItems,pool,{seed,limit=10}={}){
  const today=shuffle(todayItems,seed).slice(0,Math.ceil(limit*0.6));
  const yesterday=shuffle(yesterdayItems,seed+'y').slice(0,limit-today.length);
  return shuffle([...today,...yesterday],seed+'c').map((item,index)=>index%3===2?recallChoice(item,pool,seed+'c'):listenMeaning(item,pool,seed+'c'));
}

// Fase 2 (Assimil): líneas para escuchar, leer y repetir. Se priorizan las frases.
export function listeningLines(todayItems,limit=12){
  const sentences=todayItems.filter(item=>isSentence(item.target));
  const words=todayItems.filter(item=>!isSentence(item.target));
  return [...sentences,...words].slice(0,limit);
}

export const daysBetween=(a,b)=>Math.round((new Date(b)-new Date(a))/DAY);
