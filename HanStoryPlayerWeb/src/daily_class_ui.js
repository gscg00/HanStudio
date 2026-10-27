// Interfaz de la Clase del día. Se instala sobre JapaneseCourseApp (el motor
// de todos los cursos guiados) envolviendo unos pocos métodos, para no tocar
// el flujo de lecciones existente.
import{JapaneseCourseApp,lessonActivitiesForPresentation,reviewItemsForSession}from'./japanese_course_app.js';
import{completeGuidedLesson,completeGuidedReview,reviewSchedule,scoreActivities,GUIDED_PASSING_SCORE}from'./guided_course_logic.js';
import{xpService}from'./xp_service.js';
import{pickVoice}from'./voices.js';
import{illustrationFor,hasIllustration,sceneFor,sceneSvg}from'./data/illustrations.js';
import{DAILY_PHASES,advanceLearnIndex,dailyBudgetForLevel,buildCloseSet,buildPracticeSet,buildReviewSet,completePhase,createDailyClass,currentClass,dailyStateId,dailyStatus,listeningLines,markExtraStudy,normalizeDailyState,pickTodayLessons,previousClass,shuffle,taughtItems}from'./daily_class.js';

const esc=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const reducedMotion=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const weekday=now=>now.toLocaleDateString('es',{weekday:'long',day:'numeric',month:'long'});
const proto=JapaneseCourseApp.prototype;
const original={renderMap:proto.renderMap,renderRoute:proto.renderRoute,speakTts:proto.speakTts,shell:proto.shell,renderActivity:proto.renderActivity,renderTeachingActivity:proto.renderTeachingActivity,continue:proto.continue,handleClick:proto.handleClick,mountToday:proto.mountToday,stop:proto.stop};

const dailyEnabled=app=>Boolean(app.definition?.dailyClass);
const icon=path=>`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const NAV_ICONS={
  home:icon('<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'),
  today:icon('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  stories:icon('<path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>'),
  profile:icon('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
};

// Cada personaje con su propia voz sintetizada, como en una grabación de Assimil.
const MAIN_CHARACTERS=new Set(['아나','민호','Ana','Ben','Léa','Jonas','Marco','João','Миша','小明','健太','آنا','عمر']);
const voiceFor=(speaker,gender,lang)=>pickVoice(lang,{gender,seedName:speaker&&!MAIN_CHARACTERS.has(speaker)?speaker:''});

Object.assign(proto,{
  async loadDaily(){
    if(this.daily)return this.daily;
    const saved=await this.get('metadata',dailyStateId(this.definition.slug)).catch(()=>null);
    this.daily=normalizeDailyState(saved,this.definition.slug);
    return this.daily;
  },
  async saveDaily(){await this.put('metadata',this.daily).catch(()=>{});},

  orderedUnits(){return(this.course?.units||[]).map(unit=>this.units.get(unit.id)).filter(Boolean);},

  // Vocabulario ya visto (o de la unidad actual) para generar distractores creíbles.
  // Distractores: solo lo que ya conoces (clases anteriores, lecciones superadas
  // y, fuera del repaso, lo de hoy). Una opción nunca vista es una pista falsa.
  itemPool(entry,{includeToday=true}={}){
    const done=new Set(this.progress.completedLessons||[]),known=new Map();
    const add=item=>{if(!known.has(item.target))known.set(item.target,item);};
    this.daily.classes.filter(item=>item!==entry).forEach(item=>item.items.forEach(add));
    for(const unit of this.orderedUnits())for(const lesson of unit.lessons)if(done.has(lesson.id))taughtItems(lesson).forEach(add);
    if(includeToday)entry.items.forEach(add);
    else entry.items.forEach(item=>known.delete(item.target));
    if(known.size>=6)return[...known.values()];
    // Al principio del curso todavía no hay suficiente: se completa con la unidad actual.
    const unitIds=new Set(entry.lessons.map(lesson=>lesson.unitId)),pool=[...known.values()];
    for(const unit of this.orderedUnits())if(unitIds.has(unit.id))for(const lesson of unit.lessons)taughtItems(lesson).forEach(item=>{if(!known.has(item.target)&&(includeToday||!entry.items.some(today=>today.target===item.target)))pool.push(item);});
    return pool;
  },

  async ensureTodayClass(force=false){
    await this.loadDaily();
    const status=dailyStatus(this.daily);
    if(status==='in-progress'||(status==='done-today'&&!force))return currentClass(this.daily);
    const currentUnit=this.findLesson(this.progress.currentLesson)?.unit.id,levelIndex=Math.max(0,(this.course.levels||[]).findIndex(level=>level.unitIds?.includes(currentUnit)));
    const lessons=pickTodayLessons(this.orderedUnits(),{startLessonId:this.progress.currentLesson,completedLessons:this.progress.completedLessons,isUnitAccessible:id=>this.unitAccessible(id),budget:dailyBudgetForLevel(levelIndex)});
    if(!lessons.length)return currentClass(this.daily);
    const items=lessons.flatMap(ref=>taughtItems(this.findLesson(ref.lessonId)?.lesson));
    this.daily=createDailyClass(this.daily,{lessons,items});
    await this.saveDaily();
    return currentClass(this.daily);
  },

  // ── Pantalla principal: el mapa del día ───────────────────────────────
  async renderToday(){
    this.dailyMode=false;this.dailyStep=null;
    const entry=await this.ensureTodayClass(),status=dailyStatus(this.daily),now=new Date();
    if(!entry){this.shell(`<section class="dc-today"><div class="dc-empty"><b>✓</b><h1>¡Terminaste el curso!</h1><p>Sigue con el repaso espaciado y las Historias.</p><button class="primary" data-jp-route="review">Ir al repaso</button></div></section>`,'Hoy');return;}
    const done=status==='done-today',yesterday=previousClass(this.daily),next=DAILY_PHASES[entry.phaseIndex],unit=this.units.get(entry.lessons[0]?.unitId),title=unit?.title||'Clase del día',reviewCount=yesterday?.items?.length||0;
    // Resumen para la pantalla de inicio, que no carga el curso.
    if(entry.title!==title||this.daily.totalLessons!==this.allLessons().length){entry.title=title;this.daily.language=this.language;this.daily.totalLessons=this.allLessons().length;this.saveDaily();}
    const details={review:reviewCount?`${reviewCount} palabras de la clase ${yesterday.number}`:entry.number>1?'Nada pendiente de la clase anterior':'Tu primera clase: todavía no hay nada que repasar',listen:'Escucha las frases de hoy y repítelas',learn:`${entry.items.length} palabras y frases nuevas con dibujo`,practice:'Escuchar, elegir, armar frases y escribir',close:'Frases de tus cómics y video de repaso'};
    const nodes=DAILY_PHASES.map((phase,index)=>{const state=entry.phasesDone.includes(phase.id)?'done':index===entry.phaseIndex&&!done?'current':'locked';return`<li class="dc-step ${state}" style="--i:${index}"><span class="dc-step-dot" aria-hidden="true">${state==='done'?'✓':index+1}</span><div><strong>${esc(phase.title)}</strong><span>${esc(details[phase.id])}</span></div></li>`;}).join('');
    const chips=(items,cls='')=>items.slice(0,10).map((item,index)=>`<span class="dc-chip ${cls}" style="--i:${index}" lang="${esc(this.definition.htmlLang)}" dir="auto">${hasIllustration(item.meaning)?`<i aria-hidden="true">${illustrationFor(item.meaning)}</i>`:''}${esc(item.target)}<em>${esc(item.meaning)}</em></span>`).join('');
    const scene=sceneFor(unit?.id,entry.items);
    const action=done?'':`<div class="dc-dock"><button class="primary dc-cta" data-dc-action="start-phase" data-dc-phase="${esc(next?.id)}">${entry.phaseIndex?`Seguir con la fase ${entry.phaseIndex+1}`:'Empezar la clase'} · ${esc(next?.short||'')} <span aria-hidden="true">→</span></button><small>Puedes parar al terminar cualquier fase y seguir mañana.</small></div>`;
    const doneBlock=done?`<section class="dc-done"><div class="dc-done-burst" aria-hidden="true">${'<i></i>'.repeat(12)}</div><h2>Clase ${entry.number} completada</h2><p>La próxima clase se abre mañana. Dormir entre clases es parte del método: mañana empezaremos repasando esto.</p><div class="dc-extra"><h3>¿Quieres seguir?</h3><button data-dc-action="recap">▶ Video de repaso de hoy</button><button data-dg-action="start">◆ Minijuego: imagen, sonido y palabra</button><button data-dc-action="replay-listen">♪ Volver a escuchar las frases de hoy</button><button data-dc-action="free-practice">✎ Práctica libre con todo lo visto</button><button data-jp-action="stories">▤ Leer una Historia</button><button class="dc-advance" data-dc-action="advance">Adelantar la clase de mañana</button></div></section>`:'';
    this.shell(`<section class="dc-today ${done?'is-done':''}">
      <div class="dc-title"><span class="dc-eyebrow">${esc(this.definition.name.toUpperCase())} · CLASE ${entry.number}</span><h1>${esc(title)}</h1><p>${esc(weekday(now).replace(/^./,char=>char.toUpperCase()))}</p></div>
      <div class="dc-banner">${scene?`<div class="dc-banner-scene" aria-hidden="true">${scene.replace('<svg ','<svg preserveAspectRatio="xMidYMid slice" ')}</div>`:''}<span class="dc-banner-chip">${entry.items.length} nuevas${reviewCount?` · ${reviewCount} de repaso`:''}</span></div>
      <ol class="dc-steps">${nodes}</ol>
      ${action}${doneBlock}
      <div class="dc-columns">${entry.items.length?`<section class="dc-card"><h2>Hoy aprenderás</h2><div class="dc-chips">${chips(entry.items)}</div></section>`:''}${yesterday?.items?.length?`<section class="dc-card"><h2>Repasaremos de la clase ${yesterday.number}</h2><div class="dc-chips">${chips(yesterday.items,'old')}</div></section>`:`<section class="dc-card"><h2>Cómo funciona</h2><p>Cada clase empieza repasando la anterior. Lo que veas hoy volverá mañana, en 3 días, en una semana y en un mes.</p></section>`}</div>
      ${this.todayReviewCard()}
      <details class="dc-map"><summary><span>Mapa del curso</span><small>Todas las unidades, tu progreso y las lecciones sueltas</small></summary><div class="dc-map-body">${this.captureMap()}</div></details>
    </section>`,'Hoy');
  },

  // ── Hoy es la sección principal: incluye el repaso espaciado y el mapa ──
  todayReviewCard(){
    const due=reviewSchedule(this.progress).due.length,allowance=this.reviewAllowance(),available=Math.min(due,allowance.remaining);
    return `<section class="dc-card dc-srs"><div><h2>Repaso espaciado</h2><p>${available?`${available} tarjeta${available===1?'':'s'} de días anteriores te esperan. Cada una vuelve a 1, 3, 7, 14 y 30 días.`:due?'Completaste tu límite de repaso de hoy.':'Estás al día: no hay tarjetas pendientes.'}</p><small>${allowance.completed} de ${allowance.limit} repasadas hoy · el límite se cambia en Perfil.</small></div>${available?'<button class="primary" data-jp-action="start-review">Repasar ahora</button>':''}</section>`;
  },
  // El mapa se dibuja con el motor original y se inserta dentro de Hoy.
  captureMap(){
    let html='';
    this.shell=content=>{html=content;};
    try{original.renderMap.call(this);}finally{delete this.shell;}
    return html;
  },

  // ── Transición animada entre fases ─────────────────────────────────────
  renderPhaseIntro(phase,{subtitle='',onStart}){
    const index=DAILY_PHASES.indexOf(phase);
    this.dailyIntro=onStart;
    this.shell(`<section class="dc-intro" style="--phase:${index}"><div class="dc-intro-num" aria-hidden="true">${index+1}</div><span class="dc-eyebrow">FASE ${index+1} DE ${DAILY_PHASES.length}</span><h1>${esc(phase.title)}</h1><p>${esc(subtitle||phase.description)}</p><button class="primary" data-dc-action="intro-go">Comenzar</button><button class="dc-link" data-dc-action="to-today">Volver al plan de hoy</button></section>`,'Hoy');
  },

  async startPhase(phaseId){
    const entry=await this.ensureTodayClass(),phase=DAILY_PHASES.find(item=>item.id===phaseId)||DAILY_PHASES[entry.phaseIndex];
    if(!phase)return this.renderToday();
    const seed=`${entry.number}-${phase.id}`,yesterday=previousClass(this.daily)?.items||[],pool=this.itemPool(entry);
    if(phase.id==='review'){
      const allowance=this.reviewAllowance(),srs=reviewItemsForSession(this.progress,Math.min(allowance.remaining,8));
      const activities=buildReviewSet(yesterday,srs.map(item=>item.activity).filter(Boolean),this.itemPool(entry,{includeToday:false}),{seed});
      if(!activities.length)return this.finishPhase(phase,null,{note:'Es tu primera clase: todavía no hay nada que repasar.'});
      return this.renderPhaseIntro(phase,{subtitle:`${activities.length} preguntas sobre lo que viste antes. Sin ver las respuestas: así se fortalece la memoria.`,onStart:()=>this.runSet(phase,activities,{srsItems:srs})});
    }
    if(phase.id==='listen'){
      const lines=await this.listenLines(entry);
      if(!lines.length)return this.finishPhase(phase,null);
      const stories=this.dailyStories.length;
      return this.renderPhaseIntro(phase,{subtitle:stories?`${stories===1?'Una historia':`${stories} historias`} con ${lines.length} frases. Primero solo escuchas, luego lees con traducción y notas, y al final repites en voz alta.`:`${lines.length} frases. Primero solo escuchas, luego lees con traducción y al final repites en voz alta.`,onStart:()=>this.renderListen(lines,0)});
    }
    if(phase.id==='learn'){
      const total=entry.lessons.length,current=entry.lessons[entry.learnIndex];
      if(!current)return this.finishPhase(phase,null);
      return this.renderPhaseIntro(phase,{subtitle:total>1?`Lección ${entry.learnIndex+1} de ${total}: ${this.findLesson(current.lessonId)?.lesson.title||''}`:'',onStart:()=>this.runLesson(current)});
    }
    if(phase.id==='practice'){
      const activities=buildPracticeSet(entry.items,pool,{seed,hasPicture:hasIllustration});
      if(!activities.length)return this.finishPhase(phase,null);
      return this.renderPhaseIntro(phase,{onStart:()=>this.runSet(phase,activities)});
    }
    const activities=buildCloseSet(entry.items,yesterday,pool,{seed});
    if(!activities.length)return this.finishPhase(phase,null);
    return this.renderPhaseIntro(phase,{onStart:()=>this.runSet(phase,activities)});
  },

  // Historias tipo Larousse/Assimil: una por lección, en stories/<unitId>.json.
  async loadStories(entry){
    this.storyCache??=new Map();
    const unitIds=[...new Set(entry.lessons.map(ref=>ref.unitId))],lessonIds=entry.lessons.map(ref=>ref.lessonId);
    const files=await Promise.all(unitIds.map(async unitId=>{
      if(!this.storyCache.has(unitId))this.storyCache.set(unitId,await this.fetch(`library/courses/${this.definition.directory}/stories/${unitId}.json`).catch(()=>null));
      return this.storyCache.get(unitId);
    }));
    const stories=files.flatMap(file=>file?.stories||[]).filter(story=>lessonIds.includes(story.lessonId)&&story.lines?.length);
    return stories.sort((a,b)=>lessonIds.indexOf(a.lessonId)-lessonIds.indexOf(b.lessonId));
  },
  async listenLines(entry){
    this.dailyStories=await this.loadStories(entry);
    if(!this.dailyStories.length)return listeningLines(entry.items);
    return this.dailyStories.flatMap((story,index)=>story.lines.map(line=>({target:line.text,meaning:line.translation,audio:line.text,slowAudio:line.text,speaker:line.speakerEs||line.speaker,speakerKo:line.speaker,gender:line.gender||'',reading:line.reading||'',story:index})));
  },

  beginActivities(activities,step,title){
    this.dailyMode=true;this.dailyStep=step;this.reviewMode=false;
    this.lesson={id:`daily-${step.phase.id}-${Date.now()}`,title,activities};
    this.unit=step.unit||{id:'daily',lessons:[this.lesson]};
    this.activityIndex=0;this.answers={};this.blockSelections={};this.speechState=null;this.feedback=null;
    this.renderActivity();
  },
  runSet(phase,activities,{srsItems=[]}={}){this.beginActivities(activities,{kind:'set',phase,srsItems},phase.title);},
  runLesson(ref){
    const found=this.findLesson(ref.lessonId);
    if(!found)return this.renderToday();
    const phase=DAILY_PHASES.find(item=>item.id==='learn');
    this.dailyMode=true;this.dailyStep={kind:'lesson',phase,ref,unit:found.unit};this.reviewMode=false;
    this.lesson={...found.lesson,activities:lessonActivitiesForPresentation(this.course,found.unit,found.lesson)};
    this.unit=found.unit;this.activityIndex=0;this.answers={};this.blockSelections={};this.speechState=null;this.feedback=null;
    this.renderActivity();
  },

  async finishDailyActivities(){
    const step=this.dailyStep,result=scoreActivities(this.lesson.activities,this.answers,this.language);
    this.dailyMode=false;
    if(step.kind==='free'){this.daily=markExtraStudy(this.daily);await this.saveDaily();return this.renderCheckpoint(null,result,{free:true});}
    if(step.kind==='set'){
      if(step.srsItems?.length){this.progress=completeGuidedReview(this.progress,step.srsItems,result,this.progressConfig());this.reviewedToday+=step.srsItems.length;await this.put('metadata',this.progress);}
      // El cierre termina con frases reales de tus cómics que usan lo de hoy.
      if(step.phase.id==='close'){const comics=this.comicCardsForToday();if(comics.length)return this.renderComics(comics,0,result);}
      return this.finishPhase(step.phase,result);
    }
    // Lección real: se guarda igual que desde el mapa (progreso, repaso espaciado, XP).
    const passing=Number(this.lesson.passingScore??this.course.unlockRules?.minimumScore??GUIDED_PASSING_SCORE),passed=result.percentage>=passing;
    this.progress=completeGuidedLesson(this.progress,this.unit,this.lesson,result,this.progressConfig(this.lesson));
    if(passed){
      const lessonType=this.lesson.isReview?'review':this.lesson.isTest?'test':this.lesson.isUnitFinal?'unitFinal':'normal';
      const reward=await xpService.awardLessonXP({languageId:this.language,courseId:this.course.courseId||`${this.definition.slug}-from-zero`,lessonId:this.lesson.id,score:result.percentage,completedAt:new Date().toISOString(),lessonType,xpReward:this.lesson.xpReward}).catch(()=>null);
      result.awardedXp=reward?.xp||0;
      if(this.unit.lessons.at(-1)?.id===this.lesson.id)this.unlockNextUnit(this.unit);
    }
    await this.put('metadata',this.progress);
    if(!passed)return this.renderLessonRetry(step.ref,result,passing);
    const entry=currentClass(this.daily),nextIndex=entry.learnIndex+1;
    this.daily=advanceLearnIndex(this.daily,nextIndex);
    if(nextIndex<entry.lessons.length){await this.saveDaily();return this.renderCheckpoint(step.phase,result,{lessonBreak:true,nextIndex,total:entry.lessons.length});}
    return this.finishPhase(step.phase,result);
  },

  renderLessonRetry(ref,result,passing){
    const errors=(result.errors||[]).slice(0,8);
    this.dailyRetryRef=ref;
    this.shell(`<section class="dc-checkpoint retry"><div class="dc-ring" style="--p:${result.percentage}"><b>${result.percentage}%</b></div><span class="dc-eyebrow">CASI</span><h1>Repitamos esta lección con calma</h1><p>Para avanzar necesitas ${passing} %. Repetir ahora, con todo fresco, es exactamente como se aprende.</p>${errors.length?`<div class="dc-chips">${errors.map(error=>`<span class="dc-chip old" lang="${esc(this.definition.htmlLang)}" dir="auto">${esc(error.activity?.target||error.answer)}</span>`).join('')}</div>`:''}<button class="primary" data-dc-action="retry-lesson">Repetir la lección</button><button class="dc-link" data-dc-action="to-today">Parar aquí por hoy</button></section>`,'Hoy');
  },

  async finishPhase(phase,result,{note=''}={}){
    this.daily=completePhase(this.daily,phase.id,result);
    await this.saveDaily();
    if(currentClass(this.daily).completedDate)return this.renderClassComplete();
    return this.renderCheckpoint(phase,result,{note});
  },

  // ── Checkpoint animado ─────────────────────────────────────────────────
  renderCheckpoint(phase,result,{note='',lessonBreak=false,nextIndex=0,total=0,free=false}={}){
    const entry=currentClass(this.daily),next=DAILY_PHASES[entry.phaseIndex],percent=result?.total?result.percentage:100,doneCount=entry.phasesDone.length;
    const title=free?'Práctica libre terminada':lessonBreak?`Lección ${nextIndex} de ${total} superada`:`${phase.title}: hecho`;
    const nextLabel=free?'':lessonBreak?`Seguir con la lección ${nextIndex+1}`:`Seguir: ${next.title}`;
    const nextAttr=lessonBreak?'learn':next?.id;
    this.shell(`<section class="dc-checkpoint"><div class="dc-ring" style="--p:${percent}"><b>${result?.total?`${percent}%`:'✓'}</b></div><span class="dc-eyebrow">${free?'PRÁCTICA EXTRA':'CHECKPOINT GUARDADO'}</span><h1>${esc(title)}</h1>${result?.total?`<p>${result.correct} de ${result.total} correctas.${result.errors?.length?' Lo que fallaste volverá antes en tus repasos.':''}</p>`:''}${note?`<p>${esc(note)}</p>`:''}${free?'':`<div class="dc-mini-path">${DAILY_PHASES.map((item,index)=>`<i class="${entry.phasesDone.includes(item.id)?'done':index===entry.phaseIndex?'current':''}" title="${esc(item.title)}"></i>`).join('')}</div><p class="dc-small">${doneCount} de ${DAILY_PHASES.length} fases · si tienes que irte, mañana retomas desde aquí.</p>`}${nextLabel?`<button class="primary" data-dc-action="start-phase" data-dc-phase="${esc(nextAttr)}">${esc(nextLabel)} →</button>`:''}<button class="dc-link" data-dc-action="to-today">${free?'Volver':'Salir por hoy'}</button></section>`,'Hoy');
  },

  renderClassComplete(){
    const entry=currentClass(this.daily),results=Object.values(entry.results||{}),correct=results.reduce((sum,item)=>sum+item.correct,0),total=results.reduce((sum,item)=>sum+item.total,0);
    this.shell(`<section class="dc-checkpoint complete"><div class="dc-done-burst" aria-hidden="true">${'<i></i>'.repeat(14)}</div><div class="dc-ring" style="--p:100"><b>★</b></div><span class="dc-eyebrow">CLASE ${entry.number} COMPLETADA</span><h1>¡Listo por hoy!</h1><p>${entry.items.length} elementos nuevos · ${total?`${Math.round(correct/total*100)} % de aciertos`:''}</p><p>Mañana empezaremos repasando exactamente esto. Volver a verlo después de dormir es lo que lo fija.</p><div class="dc-chips">${entry.items.slice(0,12).map(item=>`<span class="dc-chip" lang="${esc(this.definition.htmlLang)}" dir="auto">${esc(item.target)}<em>${esc(item.meaning)}</em></span>`).join('')}</div><button class="primary" data-dc-action="recap">▶ Ver el video de repaso</button><button data-dg-action="start">◆ Jugar con las imágenes</button><button class="dc-link" data-dc-action="to-today">Terminar sin video</button></section>`,'Hoy');
  },

  // ── Fase de escucha (Assimil) ──────────────────────────────────────────
  renderListen(lines,step){
    this.stopPlayback?.();
    this.dailyListen={lines,step,current:-1,replay:Boolean(this.dailyListen?.replay&&this.dailyListen.lines===lines)};
    const steps=['Solo escucha','Lee y escucha','Repite en voz alta'];
    const tabs=steps.map((label,index)=>`<span class="${index===step?'active':index<step?'done':''}">${index+1}. ${label}</span>`).join('');
    const lang=esc(this.definition.htmlLang);
    let body='';
    const stories=lines.some(line=>line.story!==undefined)?this.dailyStories||[]:[];
    const lineItem=(line,index)=>`<li data-dc-line="${index}" style="--i:${index}"><button data-dc-action="play-line" data-dc-line="${index}">${line.speaker?`<span class="dc-line-speaker">${esc(line.speaker)}</span>`:''}<span class="dc-line-ko" lang="${lang}" dir="auto">${esc(line.target)}</span>${line.reading?`<span class="dc-line-reading">${esc(line.reading)}</span>`:''}<span class="dc-line-es">${esc(line.meaning)}</span></button>${!line.speaker&&hasIllustration(line.meaning)?`<i class="dc-line-pic" aria-hidden="true">${illustrationFor(line.meaning)}</i>`:''}</li>`;
    const sceneOf=story=>sceneSvg(story.scene)||sceneSvg('generic');
    if(step===0){
      const pictures=stories.length?'':lines.filter(line=>hasIllustration(line.meaning)).slice(0,6).map(line=>`<figure data-dc-line="${lines.indexOf(line)}">${illustrationFor(line.meaning)}</figure>`).join('');
      const scenes=stories.map((story,index)=>`<figure class="dc-story-scene" data-dc-story="${index}">${sceneOf(story)}<figcaption>${esc(story.title)}</figcaption></figure>`).join('');
      body=`<p class="dc-listen-help">No intentes leer ni traducir. Mira la escena y deja que tu oído se acostumbre: escucha todo una o dos veces.</p>${scenes?`<div class="dc-story-scenes">${scenes}</div>`:`<div class="dc-orb" aria-hidden="true"><i></i><i></i><i></i><span>♪</span></div><div class="dc-listen-pictures">${pictures}</div>`}<p class="dc-listen-count" aria-live="polite"></p><div class="dc-listen-actions"><button class="primary" data-dc-action="play-all">▶ Escuchar todo</button><button data-dc-action="listen-step" data-dc-step="1">Siguiente paso →</button></div>`;
    }else if(step===1){
      const list=stories.length?stories.map((story,storyIndex)=>`<section class="dc-story"><div class="dc-story-head"><i aria-hidden="true">${sceneOf(story)}</i><h3>${esc(story.title)}</h3></div><ol class="dc-lines">${lines.map((line,index)=>line.story===storyIndex?lineItem(line,index):'').join('')}</ol>${story.notes?.length?`<details class="dc-notes"><summary>Notas de la lección</summary><dl>${story.notes.map(note=>`<dt lang="${lang}" dir="auto">${esc(note.ko)}</dt><dd>${esc(note.es)}</dd>`).join('')}</dl></details>`:''}</section>`).join(''):`<ol class="dc-lines">${lines.map(lineItem).join('')}</ol>`;
      body=`<p class="dc-listen-help">Ahora escucha mientras lees. Toca cualquier frase para oírla otra vez.${stories.length?' Abre las notas para entender cada detalle.':''}</p><div class="dc-lines-wrap">${list}</div><div class="dc-listen-actions"><button class="primary" data-dc-action="play-all">▶ Escuchar todo leyendo</button><button data-dc-action="listen-step" data-dc-step="2">Siguiente paso →</button></div>`;
    }else{
      const index=Math.max(0,Math.min(lines.length-1,this.dailyShadowIndex||0)),line=lines[index],story=stories[line.story];
      const picture=story?`<div class="dc-shadow-scene" aria-hidden="true">${sceneOf(story)}</div>`:hasIllustration(line.meaning)?`<div class="dc-shadow-pic" aria-hidden="true">${illustrationFor(line.meaning)}</div>`:'';
      body=`<p class="dc-listen-help">Escucha la frase y repítela en voz alta imitando el ritmo y la entonación. No pasa nada si no sale perfecta.</p><div class="dc-shadow" style="--n:${lines.length}"><div class="dc-shadow-count">${index+1} / ${lines.length}</div>${picture}${line.speaker?`<div class="dc-line-speaker">${esc(line.speaker)}</div>`:''}<div class="dc-shadow-ko" lang="${lang}" dir="auto">${esc(line.target)}</div>${line.reading?`<div class="dc-line-reading">${esc(line.reading)}</div>`:''}<div class="dc-shadow-es">${esc(line.meaning)}</div><div class="dc-shadow-turn" aria-live="polite"><span>Escucha…</span><div class="dc-shadow-bar"><i></i></div></div></div><div class="dc-listen-actions"><button data-dc-action="shadow-again">↺ Otra vez</button><button data-dc-action="shadow-slow">Lento</button>${index<lines.length-1?`<button class="primary" data-dc-action="shadow-next">Siguiente frase →</button>`:`<button class="primary" data-dc-action="listen-finish">Terminar la fase ✓</button>`}</div>`;
    }
    this.shell(`<section class="dc-listen step-${step}"><header class="jp-activity-top"><button data-dc-action="to-today" aria-label="Salir de la fase">✕</button><div class="dc-listen-tabs">${tabs}</div></header>${body}</section>`,'Hoy');
    if(step===2)this.shadowLine('normal');
  },

  async playLines(){
    const state=this.dailyListen;if(!state)return;
    const token=Symbol('play');this.dailyPlayToken=token;
    const count=this.root.querySelector('.dc-listen-count'),orb=this.root.querySelector('.dc-orb');
    orb?.classList.add('playing');
    for(let index=0;index<state.lines.length;index++){
      if(this.dailyPlayToken!==token)return;
      this.highlightLine(index);
      if(count)count.textContent=`${index+1} / ${state.lines.length}`;
      const ok=await this.playLine(state.lines[index]);
      if(!ok||this.dailyPlayToken!==token)break;
      await wait(650);
    }
    if(this.dailyPlayToken===token){orb?.classList.remove('playing');this.highlightLine(-1);if(count)count.textContent='¡Muy bien! Puedes escucharlo otra vez o pasar al siguiente paso.';}
  },
  highlightLine(index){
    this.root.querySelectorAll('[data-dc-line]').forEach(element=>element.classList.toggle('speaking',Number(element.dataset.dcLine)===index));
    const story=this.dailyListen?.lines[index]?.story;
    this.root.querySelectorAll('[data-dc-story]').forEach(element=>element.classList.toggle('speaking',story!==undefined&&Number(element.dataset.dcStory)===story));
    const active=this.root.querySelector(`li[data-dc-line="${index}"]`);
    active?.scrollIntoView({block:'nearest',behavior:reducedMotion()?'auto':'smooth'});
  },
  async shadowLine(mode){
    const state=this.dailyListen;if(!state)return;
    const token=Symbol('shadow');this.dailyPlayToken=token;
    const line=state.lines[Math.max(0,this.dailyShadowIndex||0)],turn=this.root.querySelector('.dc-shadow-turn');
    if(!turn)return;
    turn.classList.remove('your-turn');turn.querySelector('span').textContent='Escucha…';
    await wait(250);
    const ok=await this.playLine(line,mode);
    if(!ok||this.dailyPlayToken!==token)return;
    const seconds=Math.min(7,1.8+[...line.target].length*0.16)*(mode==='slow'?1.4:1);
    turn.style.setProperty('--t',`${seconds}s`);
    turn.classList.add('your-turn');turn.querySelector('span').textContent='Tu turno: dilo en voz alta';
    await wait(seconds*1000);
    if(this.dailyPlayToken===token){turn.classList.remove('your-turn');turn.querySelector('span').textContent='¿Otra vez? O pasa a la siguiente.';}
  },

  // ── Video de repaso: lo del día, estilo distinto cada clase ─────────────
  async renderRecap(styleId){
    const entry=currentClass(this.daily);
    if(!entry?.items?.length)return this.showToast('Todavía no hay nada que repasar en video.');
    const [{buildRecapTimeline},{createRecapPlayer},{RECAP_STYLES,styleIndexForDay,loadRecapStyle}]=await Promise.all([import('./recap/recap_timeline.js'),import('./recap/recap_player.js'),import('./recap/styles/index.js')]);
    const chosen=RECAP_STYLES[styleIndexForDay(new Date(),this.definition.slug)].id;
    const unit=this.units.get(entry.lessons[0]?.unitId);
    this.shell(`<section class="dc-recap"><div class="dc-recap-head"><div><span class="dc-eyebrow">VIDEO DE REPASO · CLASE ${entry.number}</span><h1>¿Cuánto recuerdas de hoy?</h1><p>Escucha, intenta recordar durante la cuenta atrás y luego comprueba. Sin subtítulos tu oído trabaja más; actívalos si te pierdes.</p></div></div>
      <div class="dc-recap-stage"><canvas class="dc-recap-canvas" aria-label="Video de repaso"></canvas><div class="dc-recap-loading">Preparando el video…</div></div>
      <div class="dc-recap-controls"><button data-dc-action="recap-prev" aria-label="Pregunta anterior">⏮</button><button class="primary" data-dc-action="recap-play" aria-label="Reproducir">▶</button><button data-dc-action="recap-next" aria-label="Pregunta siguiente">⏭</button><input type="range" class="dc-recap-seek" min="0" max="1000" value="0" aria-label="Posición"><span class="dc-recap-time">0:00</span><button class="dc-recap-toggle" data-dc-action="recap-cc" aria-pressed="false" title="Subtítulos">CC</button><button class="dc-recap-toggle on" data-dc-action="recap-sound" aria-pressed="true" title="Efectos de sonido">♪</button><button data-dc-action="recap-full" aria-label="Pantalla completa">⛶</button></div>
      <button class="dc-link" data-dc-action="to-today">Volver al plan de hoy</button></section>`,'Hoy');
    const canvas=this.root.querySelector('.dc-recap-canvas'),[style]=await Promise.all([loadRecapStyle(chosen)]);
    const timeline=buildRecapTimeline({classNumber:entry.number,unitTitle:unit?.title||'',items:entry.items});
    const format=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
    let last='';
    this.recapPlayer?.destroy();
    const courseAudio=text=>{const path=this.audioManifest?.[text]||this.audioManifest?.[String(text).replace(/[.!?。！？]+$/,'')];return path?this.url(`library/courses/${this.definition.directory}/${path}`):null;};
    const narrator=await this.loadNarratorAudio();
    this.recapPlayer=await createRecapPlayer({canvas,style,timeline,languageName:this.definition.name,audioUrlFor:(text,lang)=>lang==='tl'?courseAudio(text):narrator(text),langCode:this.definition.languageCode||this.definition.htmlLang,pictureFor:illustrationFor,sceneSvg:sceneFor(unit?.id),onState:state=>{
      const key=`${Math.floor(state.t*4)}|${state.playing}|${state.ended}`;if(key===last)return;last=key;
      const seek=this.root.querySelector('.dc-recap-seek'),play=this.root.querySelector('[data-dc-action="recap-play"]'),time=this.root.querySelector('.dc-recap-time');
      if(seek&&document.activeElement!==seek)seek.value=String(Math.round(state.t/state.duration*1000));
      if(play){play.textContent=state.playing?'⏸':state.ended?'↺':'▶';play.setAttribute('aria-label',state.playing?'Pausar':'Reproducir');}
      if(time)time.textContent=`${format(state.t)} / ${format(state.duration)}`;
    }});
    this.root.querySelector('.dc-recap-loading')?.remove();
    const seek=this.root.querySelector('.dc-recap-seek');
    seek?.addEventListener('input',()=>this.recapPlayer?.seek(Number(seek.value)/1000*timeline.duration));
  },

  // ── En tus cómics: frases reales con lo aprendido (dentro del cierre) ──
  comicLevelLimit(){
    const unit=this.units.get(currentClass(this.daily)?.lessons?.[0]?.unitId),index=Math.max(0,(this.course.levels||[]).findIndex(level=>level.unitIds?.includes(unit?.id)));
    return Math.min(4,2+Math.max(0,index-1));
  },
  comicCardsForToday(){
    const entry=currentClass(this.daily);if(!entry||!this.mangaCards?.length)return[];
    // En clases de alfabeto se enseñan letras sueltas: no hay palabras que buscar.
    if(entry.lessons.every(ref=>/reading|hangul|hiragana|katakana|rhythm|alphabet/.test(ref.unitId)))return[];
    const words=[...entry.items,...(previousClass(this.daily)?.items||[])].map(item=>String(item.target).replace(/[.!?¿¡。？！]/g,'').trim()).filter(Boolean);
    const escape=word=>word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    // Igual que scripts/build_comic_reading.py: palabra entera en alfabetos
    // latinos; en coreano una sílaba suelta solo cuenta sola o con partícula.
    const has=(text,word)=>{
      if(/[A-Za-zÀ-ÿ]/.test(word))return new RegExp(`(?<![\\wÀ-ÿ])${escape(word)}(?![\\wÀ-ÿ])`,'i').test(text);
      if(/\s/.test(word))return text.includes(word);
      const tokens=` ${text.split(/[\s.,!?…"“”'‘’()\[\]~]+/).join(' ')} `;
      return [...word].length===1?new RegExp(` ${escape(word)}(은|는|이|가|을|를|에|에서|에게|도|의|로|으로|와|과|하고|만|요|야|아)? `).test(tokens):tokens.includes(` ${word}`);
    };
    const shown=new Set(this.daily.shownComics||[]),limit=this.comicLevelLimit();
    return this.mangaCards
      .filter(card=>!shown.has(card.id)&&Number(card.level||2)<=limit)
      .map(card=>({card,hits:words.filter(word=>has(card.text,word))}))
      .filter(entry=>entry.hits.length)
      .sort((a,b)=>b.hits.length-a.hits.length||a.card.text.length-b.card.text.length)
      // Una frase por cómic cuando se puede: más variedad de voces y contextos.
      .reduce((picked,entry,index,all)=>{if(picked.length<3&&!picked.some(other=>other.card.source===entry.card.source))picked.push(entry);if(index===all.length-1)for(const rest of all)if(picked.length<3&&!picked.includes(rest))picked.push(rest);return picked;},[]);
  },
  renderComics(list,index,result){
    this.dailyComics={list,index,result};
    const {card,hits}=list[index],lang=esc(this.definition.htmlLang),revealed=this.dailyComicReveal;
    let text=esc(card.text);
    for(const word of hits)text=text.split(esc(word)).join(`<mark>${esc(word)}</mark>`);
    this.shell(`<section class="dc-comic"><div class="dc-comic-head"><span class="dc-eyebrow">CIERRE · EN TUS CÓMICS · ${index+1} DE ${list.length}</span><h1>Lo de hoy, en una historia real</h1></div>
      <article class="dc-comic-card"><div class="dc-comic-source">${esc(card.source)}${card.page?` · pág. ${card.page}`:''}</div><button class="dc-comic-text" data-dc-action="comic-audio" lang="${lang}" dir="auto">${text}<small>▶</small></button>
      ${revealed?`<div class="dc-comic-reveal"><strong>${esc(card.translation)}</strong>${card.note?`<p>${esc(card.note)}</p>`:''}<dl>${(card.breakdown||[]).map(part=>`<dt lang="${lang}" dir="auto">${esc(part.term)}</dt><dd>${esc(part.meaning)}</dd>`).join('')}</dl></div>
      <div class="dc-comic-actions"><button data-dc-action="comic-next" data-dc-ok="0">No del todo · repasarla</button><button class="primary" data-dc-action="comic-next" data-dc-ok="1">La entendí →</button></div>`:`<p class="dc-comic-help">Léela y escúchala. ¿Qué crees que dice? Las palabras marcadas las viste hoy.</p><button class="primary" data-dc-action="comic-reveal">Ver mi traducción</button>`}
      </article><button class="dc-link" data-dc-action="comic-skip">Saltar y terminar la clase</button></section>`,'Hoy');
    if(!revealed)this.playKeyAudio(card.text,'normal',false);
  },
  async comicNext(ok){
    const state=this.dailyComics;if(!state)return;
    const card=state.list[state.index].card;
    this.daily.shownComics=[...new Set([...(this.daily.shownComics||[]),card.id])].slice(-2000);
    if(!ok&&!(this.mangaState.savedIds||[]).includes(card.id)){this.mangaState.savedIds=[...(this.mangaState.savedIds||[]),card.id];await this.saveMangaState();}
    this.dailyComicReveal=false;
    if(state.index+1<state.list.length)return this.renderComics(state.list,state.index+1,state.result);
    this.dailyComics=null;await this.saveDaily();
    return this.finishPhase(DAILY_PHASES.find(phase=>phase.id==='close'),state.result);
  },

  // Cuántas veces aparece una palabra en tus cómics (solo conteos).
  async loadComicFrequency(){
    if(this.comicFrequency!==undefined)return this.comicFrequency;
    const data=await this.fetch('library/personal_manga/frequency.json').catch(()=>null);
    this.comicFrequency=data?.languages?.[this.language]||null;
    return this.comicFrequency;
  },

  // Frases fijas del narrador grabadas (library/recap_audio). El resto, voz del sistema.
  async loadNarratorAudio(){
    if(!this.narratorManifest)this.narratorManifest=(await this.fetch('library/recap_audio/manifest.json').catch(()=>null))?.items||{};
    return text=>{const path=this.narratorManifest[String(text).replace(/\d+/g,'N')];return path?this.url(`library/recap_audio/${path}`):null;};
  },

  // Repetición libre después de terminar la clase.
  startFreePractice(){
    const items=shuffle(this.daily.classes.flatMap(entry=>entry.items),`free-${Date.now()}`).slice(0,12);
    if(!items.length)return this.showToast('Todavía no hay contenido para practicar.');
    const pool=this.daily.classes.flatMap(entry=>entry.items),phase={id:'free',title:'Práctica libre'};
    const activities=buildCloseSet(items,[],pool,{seed:`free-${Date.now()}`,limit:12});
    this.beginActivities(activities,{kind:'free',phase},'Práctica libre');
  },

  // ── Imágenes estilo Rosetta ────────────────────────────────────────────
  renderPictureActivity(activity,total){
    const selected=this.answers[activity.id]||'';
    const options=activity.options.map((option,index)=>`<button class="jp-answer dc-picture-option ${selected===option?'selected':''} ${this.feedback&&option===activity.answer?'correct-option':''}" data-jp-answer="${esc(option)}" ${this.feedback?'disabled':''} aria-label="Opción ${index+1}">${illustrationFor(option)}${this.feedback?`<small>${esc(option)}</small>`:''}</button>`).join('');
    this.shell(`<section class="jp-activity"><header class="jp-activity-top"><button data-jp-action="leave-lesson">✕</button><div class="jp-progress"><i style="width:${(this.activityIndex+1)/total*100}%"></i></div><strong>${this.activityIndex+1}/${total}</strong></header><main class="jp-question"><span class="jp-type">ESCUCHA Y MIRA</span><h1>${esc(activity.prompt)}</h1><button class="jp-big-audio" data-jp-audio="normal" data-jp-audio-source="prompt" aria-label="Escuchar">▶</button><div class="jp-answers dc-picture-grid">${options}</div><div class="jp-listen-row"><button data-jp-audio="slow" data-jp-audio-source="prompt">Lento</button></div></main>${this.feedback?`<footer class="jp-feedback ${this.feedback.correct?'correct':'wrong'}"><div><strong>${this.feedback.correct?'¡Muy bien!':'Todavía no'}</strong><p>${esc(activity.explanation)}</p></div><button class="primary" data-jp-action="continue">Continuar</button></footer>`:`<footer class="jp-check"><button class="primary" data-jp-action="check" ${selected?'':'disabled'}>Comprobar</button></footer>`}</section>`,'Hoy');
    if(!this.feedback&&!this.dailyAutoPlayed?.has(activity.id)){(this.dailyAutoPlayed??=new Set()).add(activity.id);this.playKeyAudio(activity.audio,'normal',false);}
  },

  // ── Envolturas de métodos existentes ───────────────────────────────────
  shell(content,section='Mapa'){
    if(this.recapPlayer&&!content.includes('dc-recap')){this.recapPlayer.destroy();this.recapPlayer=null;}
    if(dailyEnabled(this))content=content.replace(/data-jp-route="(course|review)"/g,'data-jp-route="today"').replace(/Volver al mapa/g,'Volver a Hoy');
    original.shell.call(this,content,section);
    if(!dailyEnabled(this))return;
    const nav=this.root.querySelector('.jp-app-nav');
    if(nav){
      // Inicio sustituye al botón «← Idioma», que en el móvil quedaba debajo de la barra.
      const active=section==='Perfil'?'profile':'today',tab=(attrs,icon,label,on=false)=>`<button class="jp-app-tab ${on?'active':''}" ${attrs} ${on?'aria-current="page"':''}>${NAV_ICONS[icon]}${label}</button>`;
      nav.innerHTML=`<div class="jp-app-tabs">${tab('data-jp-action="exit"','home','Inicio')}${tab('data-jp-route="today"','today','Hoy',active==='today')}${tab('data-jp-action="stories"','stories','Historias')}${tab('data-jp-route="profile"','profile','Perfil',active==='profile')}</div>`;
    }
    if(section==='Hoy')this.setBreadcrumb?.([this.definition.name,'Clase del día']);
  },
  renderActivity(){
    const activity=this.lesson?.activities?.[this.activityIndex];
    if(activity?.picture)return this.renderPictureActivity(activity,this.lesson.activities.length);
    original.renderActivity.call(this);
    if(this.dailyMode){const type=this.root.querySelector('.jp-type');if(type&&this.dailyStep?.phase)type.textContent=`${this.dailyStep.phase.title.toUpperCase()}${activity?.dailyKind==='recall'?' · RECUERDA':''}`;}
  },
  renderTeachingActivity(activity,total){
    original.renderTeachingActivity.call(this,activity,total);
    const meaning=String(activity.meaning||activity.explanation||'').trim(),svg=meaning&&illustrationFor(meaning);
    const target=this.root.querySelector('.jp-teach-symbol');
    if(svg&&target&&!this.root.querySelector('.dc-illustration'))target.insertAdjacentHTML('beforebegin',`<figure class="dc-illustration" aria-hidden="true">${svg}</figure>`);
    const word=String(activity.target||'').replace(/[.!?¿¡。？！]/g,'').trim();
    const badge=count=>{const box=this.root.querySelector('.jp-teach-meaning');if(count>=2&&box&&!this.root.querySelector('.dc-freq'))box.insertAdjacentHTML('afterend',`<p class="dc-freq">Aparece ${count} veces en tus cómics</p>`);};
    if(this.comicFrequency)badge(this.comicFrequency[word]||0);
    else if(this.comicFrequency===undefined)this.loadComicFrequency().then(map=>{if(map&&this.lesson?.activities?.[this.activityIndex]===activity)badge(map[word]||0);});
  },
  async continue(){
    if(this.dailyMode&&this.lesson&&this.activityIndex>=this.lesson.activities.length-1){this.cancelSpeech();return this.finishDailyActivities();}
    return original.continue.call(this);
  },
  renderRoute(){
    // Curso y Repaso viven ahora dentro de Hoy.
    if(dailyEnabled(this)&&/^#\/[^/]+(\/(course|review))?\/?$/.test(location.hash)){history.replaceState(null,'',`#/${this.definition.slug}/today`);}
    return original.renderRoute.call(this);
  },
  mountToday(){
    if(!dailyEnabled(this))return original.mountToday.call(this);
    if(this.root.querySelector('.dc-today'))return;
    const path=this.root.querySelector('.jp-learning-path');
    if(!path||this.root.querySelector('.jp-today-plan'))return;
    path.insertAdjacentHTML('beforebegin','<section class="jp-today-plan"><div><span>HOY</span><h2>Tu clase del día</h2><p>Repaso de ayer, escucha, lecciones nuevas, práctica y cierre, con checkpoints para parar cuando lo necesites.</p></div><button class="primary" data-jp-route="today">Abrir la clase de hoy</button></section>');
  },
  stop(){this.dailyPlayToken=null;this.recapPlayer?.destroy();this.recapPlayer=null;return original.stop.call(this);},
  speakTts(text,rate=1,onState=null){
    const voice=voiceFor(this.dailySpeaker||'',this.dailyGender||'',this.definition.languageCode||this.definition.htmlLang);
    if(!voice)return original.speakTts.call(this,text,rate,onState);
    return new Promise(resolve=>{
      const synth=window.speechSynthesis,utterance=new SpeechSynthesisUtterance(String(text));
      utterance.voice=voice;utterance.lang=voice.lang;utterance.rate=Math.max(.5,Math.min(1.5,rate*(this.ttsRate||1)));
      let finished=false;const done=ok=>{if(finished)return;finished=true;if(this.finishPlayback===done)this.finishPlayback=null;onState?.(ok?'idle':'error');resolve(ok);};
      this.finishPlayback=done;utterance.onstart=()=>onState?.('playing');utterance.onend=()=>done(true);utterance.onerror=()=>done(false);
      synth.cancel();synth.speak(utterance);
    });
  },
  playLine(line,mode='normal'){this.dailySpeaker=line?.speakerKo||'';this.dailyGender=line?.gender||'';return this.playKeyAudio(line.audio,mode,false).finally(()=>{this.dailySpeaker='';this.dailyGender='';});},
  handleClick(event){
    const leave=event.target.closest('[data-jp-action="leave-lesson"]');
    if(leave&&this.dailyMode){this.dailyMode=false;this.cancelSpeech();this.showToast('Tu último checkpoint sigue guardado.');return this.renderToday();}
    const action=event.target.closest('[data-dc-action]');
    if(!action)return original.handleClick.call(this,event);
    const name=action.dataset.dcAction;
    if(!['play-line','play-all','shadow-again','shadow-slow'].includes(name)&&!name.startsWith('recap')){this.dailyPlayToken=null;this.stopPlayback?.();}
    if(name==='start-phase')return this.startPhase(action.dataset.dcPhase);
    if(name==='intro-go'){const go=this.dailyIntro;this.dailyIntro=null;return go?.();}
    if(name==='to-today'){this.dailyMode=false;return this.renderToday();}
    if(name==='retry-lesson')return this.runLesson(this.dailyRetryRef);
    if(name==='play-all')return this.playLines();
    if(name==='play-line'){const index=Number(action.dataset.dcLine);this.dailyPlayToken=null;this.highlightLine(index);return this.playLine(this.dailyListen.lines[index]);}
    if(name==='listen-step'){this.dailyShadowIndex=0;return this.renderListen(this.dailyListen.lines,Number(action.dataset.dcStep));}
    if(name==='shadow-again')return this.shadowLine('normal');
    if(name==='shadow-slow')return this.shadowLine('slow');
    if(name==='shadow-next'){this.dailyShadowIndex=(this.dailyShadowIndex||0)+1;return this.renderListen(this.dailyListen.lines,2);}
    if(name==='listen-finish'){if(this.dailyListen?.replay){this.dailyListen=null;return this.renderToday();}this.dailyListen=null;return this.finishPhase(DAILY_PHASES.find(phase=>phase.id==='listen'),null);}
    if(name==='replay-listen'){return this.listenLines(currentClass(this.daily)).then(lines=>{if(!lines.length)return;this.renderListen(lines,1);this.dailyListen.replay=true;});}
    if(name==='free-practice')return this.startFreePractice();
    if(name==='comic-reveal'){this.dailyComicReveal=true;const state=this.dailyComics;return this.renderComics(state.list,state.index,state.result);}
    if(name==='comic-next')return this.comicNext(action.dataset.dcOk==='1');
    if(name==='comic-audio'){const state=this.dailyComics;return this.playKeyAudio(state.list[state.index].card.text,'normal',false);}
    if(name==='comic-skip'){const state=this.dailyComics;this.dailyComics=null;this.dailyComicReveal=false;return this.finishPhase(DAILY_PHASES.find(phase=>phase.id==='close'),state?.result||null);}
    if(name==='recap')return this.renderRecap(action.dataset.dcStyle);
    if(name==='recap-play')return this.recapPlayer?.toggle();
    if(name==='recap-prev')return this.recapPlayer?.step(-1);
    if(name==='recap-next')return this.recapPlayer?.step(1);
    if(name==='recap-cc'||name==='recap-sound'){const on=action.getAttribute('aria-pressed')!=='true';action.setAttribute('aria-pressed',String(on));action.classList.toggle('on',on);return name==='recap-cc'?this.recapPlayer?.setSubtitles(on):this.recapPlayer?.setSound(on);}
    if(name==='recap-full'){const stage=this.root.querySelector('.dc-recap-stage');return document.fullscreenElement?document.exitFullscreen():stage?.requestFullscreen?.();}
    if(name==='advance'){
      if(!window.confirm('Te recomendamos esperar a mañana: repasar después de dormir es lo que fija la memoria. ¿Adelantar la siguiente clase de todos modos?'))return;
      return this.ensureTodayClass(true).then(()=>this.renderToday());
    }
  },
});
