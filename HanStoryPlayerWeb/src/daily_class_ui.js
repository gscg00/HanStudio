// Interfaz de la Clase del día. Se instala sobre JapaneseCourseApp (el motor
// de todos los cursos guiados) envolviendo unos pocos métodos, para no tocar
// el flujo de lecciones existente.
import{JapaneseCourseApp,lessonActivitiesForPresentation,reviewItemsForSession}from'./japanese_course_app.js';
import{completeGuidedLesson,completeGuidedReview,scoreActivities,GUIDED_PASSING_SCORE}from'./guided_course_logic.js';
import{xpService}from'./xp_service.js';
import{pickVoice}from'./voices.js';
import{blockAnimationHTML,syllablesForCard}from'./hangul_blocks.js';
import{kanaAnimationHTML}from'./kana_anim.js';
import{illustrationFor,hasIllustration,sceneFor,sceneSvg}from'./data/illustrations.js';
import{DAILY_PHASES,advanceLearnIndex,estimatedMinutes,buildClassClose,buildClassPractice,buildCloseSet,buildLearnSet,buildReviewSet,classReviewItems,completePhase,createDailyClass,currentClass,dailyStateId,dailyStatus,markExtraStudy,normalizeDailyState,previousClass,shuffle}from'./daily_class.js';
import{CLASS_MODULES,LATIN_SCRIPT,STORY_UNITS,nextSoundLesson,planNextLesson,planProgress}from'./class_plan.js';

const esc=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const reducedMotion=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const weekday=now=>now.toLocaleDateString('es',{weekday:'long',day:'numeric',month:'long'});
const proto=JapaneseCourseApp.prototype;
const original={renderMap:proto.renderMap,renderRoute:proto.renderRoute,speakTts:proto.speakTts,shell:proto.shell,renderActivity:proto.renderActivity,renderTeachingActivity:proto.renderTeachingActivity,continue:proto.continue,handleClick:proto.handleClick,mountToday:proto.mountToday,stop:proto.stop};

const dailyEnabled=app=>Boolean(app.definition?.dailyClass);
// Las clases anteriores al plan por objetivos no se conservan: eran listas de palabras.
const PLAN_VERSION=2;
const partsOf=entry=>entry.kind==='reading'?entry.lessons:[...entry.lessons,{items:true}];
const icon=path=>`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const NAV_ICONS={
  home:icon('<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'),
  today:icon('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  videos:icon('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5v5l4.5-2.5z"/>'),
  profile:icon('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
};

// Cada personaje con su propia voz sintetizada, como en una grabación de Assimil.
const MAIN_CHARACTERS=new Set(['아나','민호','Ana','Ben','Léa','Jonas','Marco','João','Миша','小明','健太','آنا','عمر']);
const voiceFor=(speaker,gender,lang)=>pickVoice(lang,{gender,seedName:speaker&&!MAIN_CHARACTERS.has(speaker)?speaker:''});

Object.assign(proto,{
  async loadDaily(){
    if(this.daily)return this.daily;
    const saved=await this.get('metadata',dailyStateId(this.definition.slug)).catch(()=>null);
    const daily=normalizeDailyState(saved,this.definition.slug);
    this.daily={...daily,classes:daily.classes.filter(entry=>entry.plan===PLAN_VERSION)};
    return this.daily;
  },
  async saveDaily(){await this.put('metadata',this.daily).catch(()=>{});},

  orderedUnits(){return(this.course?.units||[]).map(unit=>this.units.get(unit.id)).filter(Boolean);},

  // Vocabulario ya visto (o de la unidad actual) para generar distractores creíbles.
  // Distractores: solo lo que ya conoces (clases anteriores, lecciones superadas
  // y, fuera del repaso, lo de hoy). Una opción nunca vista es una pista falsa.
  itemPool(entry,{includeToday=true}={}){
    const known=new Map(),add=item=>{if(!known.has(item.target))known.set(item.target,item);};
    this.daily.classes.filter(item=>item!==entry).forEach(item=>item.items.forEach(add));
    if(includeToday)entry.items.forEach(add);
    else entry.items.forEach(item=>known.delete(item.target));
    return[...known.values()];
  },

  // Las historias son el material de escucha: se cargan al preparar una clase nueva.
  async loadClassStories(){
    if(this.classStories)return this.classStories;
    const files=await Promise.all(STORY_UNITS.map(id=>this.fetch(`library/courses/${this.definition.directory}/stories/${id}.json`).catch(()=>null)));
    return this.classStories=Object.fromEntries(STORY_UNITS.map((id,index)=>[id,files[index]?.stories||[]]));
  },

  async ensureTodayClass(force=false){
    await this.loadDaily();
    const status=dailyStatus(this.daily);
    if(status==='in-progress'||(status==='done-today'&&!force))return currentClass(this.daily);
    const stories=await this.loadClassStories(),plan=planNextLesson(this.orderedUnits(),{language:this.language,completedLessons:this.progress.completedLessons,state:this.daily,stories});
    if(!plan)return currentClass(this.daily);
    if(plan.mode==='reading')this.daily=createDailyClass(this.daily,{lessons:plan.lessons,items:[],meta:{plan:PLAN_VERSION,kind:'reading',title:'Aprende a leer'}});
    else{const{id:classId,title,goal,module,level,items,lines,story,replies,rule,task,production}=plan.class;this.daily=createDailyClass(this.daily,{lessons:plan.lessons,items,meta:{plan:PLAN_VERSION,kind:'class',classId,title,goal,module,level,lines,story,replies,rule,task,production}});}
    await this.saveDaily();
    return currentClass(this.daily);
  },

  // ── Pantalla principal: el mapa del día ───────────────────────────────
  async renderToday(){
    this.dailyMode=false;this.dailyStep=null;
    const entry=await this.ensureTodayClass(),status=dailyStatus(this.daily),now=new Date();
    if(!entry){this.shell(`<section class="dc-today"><div class="dc-empty"><b>✓</b><h1>¡Terminaste el curso!</h1><p>Sigue con el repaso espaciado para mantener lo aprendido.</p><button class="primary" data-jp-route="review">Ir al repaso</button></div></section>`,'Hoy');return;}
    const done=status==='done-today',reading=entry.kind==='reading',next=DAILY_PHASES[entry.phaseIndex],title=entry.title,review=classReviewItems(this.daily).filter(item=>!entry.items.some(today=>today.target===item.target));
    // Resumen para la pantalla de inicio, que no carga el curso.
    const progress=planProgress(this.orderedUnits(),{language:this.language,completedLessons:this.progress.completedLessons,state:this.daily});
    if(this.daily.totalItems!==progress.total||this.daily.learnedItems!==progress.done||this.daily.language!==this.language){this.daily.language=this.language;this.daily.totalLessons=this.allLessons().length;this.daily.totalItems=progress.total;this.daily.learnedItems=progress.done;this.saveDaily();}
    const module=CLASS_MODULES.find(item=>item.id===entry.module),dialogue=entry.lines?.some(line=>line.speaker),eyebrow=reading?`${this.definition.name} · Lectura`:`${this.definition.name} · ${entry.level||progress.level} · Clase ${entry.number}${module?` · ${module.title}`:''}`,goal=reading?'Antes de hablar, aprendes a leer: así podrás leer todo lo que veas en las clases.':`Al terminar podrás ${entry.goal}`;
    const details={review:`${review.length} palabras y frases de clases anteriores`,listen:entry.story?`Escucha la historia «${entry.story}»`:dialogue?'Escucha una conversación con lo de hoy':'Escucha, lee y repite lo de hoy',learn:`${entry.items.length} palabras y frases${entry.rule?', y cómo funcionan':''}`,practice:'Reconoce, recuerda y arma frases',close:'Responde y dilo con tus palabras'};
    const shown=this.classSteps(entry),minutes=estimatedMinutes(entry,review.length);
    const nodes=shown.map((phase,index)=>{const state=entry.phasesDone.includes(phase.id)?'done':phase===next&&!done?'current':'locked';return`<li class="dc-step ${state}" style="--i:${index}"><span class="dc-step-dot" aria-hidden="true">${state==='done'?'✓':index+1}</span><div><strong>${esc(phase.title)}</strong><span>${esc(details[phase.id])}</span></div></li>`;}).join('');
    const chips=(items,cls='')=>items.map((item,index)=>`<span class="dc-chip ${cls}" style="--i:${index}" lang="${esc(this.definition.htmlLang)}" dir="auto">${hasIllustration(item.meaning)?`<i aria-hidden="true">${illustrationFor(item.meaning)}</i>`:''}${esc(item.target)}<em>${esc(item.meaning)}</em></span>`).join('');
    const sound=nextSoundLesson(this.orderedUnits(),{language:this.language,completedLessons:this.progress.completedLessons});
    const started=entry.phaseIndex>0||entry.learnIndex>0||Boolean(entry.resume);
    const action=done?'':`<div class="dc-dock"><button class="primary dc-cta" data-dc-action="start-phase" data-dc-phase="${esc(next?.id)}">${reading?`${started?'Seguir':'Empezar'} la lectura`:started?`Seguir: ${esc(next?.title||'')}`:'Empezar la clase'} <span aria-hidden="true">→</span></button><small>${reading?'':`Unos ${minutes} minutos · `}puedes parar cuando quieras</small></div>`;
    const doneBlock=done?`<section class="dc-done"><div class="dc-done-burst" aria-hidden="true">${'<i></i>'.repeat(12)}</div><h2>${reading?'Lectura completada':`Clase ${entry.number} completada`}</h2><p>${entry.goal?`Ya puedes ${esc(entry.goal)} `:''}Por hoy es suficiente. Mañana hay otra clase.</p><details class="dc-extra"><summary>¿Quieres seguir un poco más?</summary>${entry.items.length?`<button data-dc-action="recap">▶ Video de repaso de hoy</button><button data-dg-action="start">◆ Minijuego: imagen, sonido y palabra</button><button data-dc-action="replay-listen">♪ Volver a escuchar lo de hoy</button>`:''}<button data-dc-action="free-practice">✎ Práctica libre con todo lo visto</button>${sound?'<button data-dc-action="sound-lesson">♫ Lección de pronunciación</button>':''}<button class="dc-advance" data-dc-action="advance">Hacer la siguiente clase ahora</button></details></section>`:'';
    this.shell(`<section class="dc-today ${done?'is-done':''}">
      <div class="dc-title"><span class="dc-eyebrow">${esc(eyebrow.toUpperCase())}</span><h1>${esc(title)}</h1>${done?'':`<p class="dc-goal">${esc(goal)}</p>`}<div class="dc-course-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.percent}" aria-label="Avance del idioma"><span><i style="width:${progress.percent}%"></i></span><small>Nivel ${esc(progress.level)} · ${progress.done} de ${progress.total} clases</small></div></div>
      ${reading?`<section class="dc-card dc-reading-note"><h2>Hoy: ${entry.lessons.length} lecci${entry.lessons.length===1?'ón':'ones'} de lectura</h2><p>Las primeras clases son solo letras y sonidos. En cuanto puedas leer empiezan las conversaciones.</p></section>`:done?'':`<ol class="dc-steps">${nodes}</ol>`}
      ${action}${doneBlock}
      ${entry.items.length&&!done?`<details class="dc-card dc-preview"><summary>Ver lo que aprenderás hoy</summary><div class="dc-chips">${chips(entry.items)}</div></details>`:''}
    </section>`,'Hoy');
  },

  // El mapa se dibuja con el motor original y se inserta dentro de Hoy.
  captureMap(){
    let html='';
    this.shell=content=>{html=content;};
    try{original.renderMap.call(this);}finally{delete this.shell;}
    return html;
  },

  // Los pasos que esta clase tiene de verdad: sin repaso el primer día, sin nada en lectura.
  classSteps(entry){
    if(entry.kind==='reading')return[];
    const review=entry.phasesDone.includes('review')||classReviewItems(this.daily).some(item=>!entry.items.some(today=>today.target===item.target));
    return DAILY_PHASES.filter(phase=>(phase.id!=='review'||review)&&(phase.id!=='listen'||entry.items.length));
  },

  async startPhase(phaseId){
    const entry=await this.ensureTodayClass(),phase=DAILY_PHASES.find(item=>item.id===phaseId)||DAILY_PHASES[entry.phaseIndex];
    if(!phase)return this.renderToday();
    const seed=`${entry.number}-${phase.id}`,pool=this.itemPool(entry);
    if(phase.id==='review'){
      const allowance=this.reviewAllowance(),srs=reviewItemsForSession(this.progress,Math.min(allowance.remaining,8)),old=classReviewItems(this.daily).filter(item=>!entry.items.some(today=>today.target===item.target));
      const activities=buildReviewSet(old,srs.map(item=>item.activity).filter(Boolean),this.itemPool(entry,{includeToday:false}),{seed});
      if(!activities.length)return this.finishPhase(phase,null,{skip:true});
      return this.runSet(phase,activities,{srsItems:srs});
    }
    if(phase.id==='listen'){
      const lines=this.listenLines(entry);
      if(!lines.length)return this.finishPhase(phase,null,{skip:true});
      return this.renderListen(lines,0);
    }
    if(phase.id==='learn'){
      const parts=partsOf(entry),current=parts[entry.learnIndex];
      if(!current)return this.finishPhase(phase,null);
      if(current.items)return this.runSet(phase,buildLearnSet(entry.items,{teach:item=>this.teachActivity(item),rule:entry.rule,seed}));
      return this.runLesson(current);
    }
    if(phase.id==='practice'){
      const activities=buildClassPractice(entry.items,pool,{seed,language:this.language});
      if(!activities.length)return this.finishPhase(phase,null,{skip:true});
      return this.runSet(phase,activities);
    }
    const typing=LATIN_SCRIPT.has(this.language)?this.definition.name.toLowerCase():'',production=(this.findLesson(entry.production?.lessonId)?.lesson.activities||[]).filter(activity=>activity.type!=='lesson_intro');
    const activities=entry.items.length?buildClassClose(entry,pool,{seed,typing,production}):[];
    if(!activities.length)return this.finishPhase(phase,null,{skip:true});
    return this.runSet(phase,activities);
  },

  listenLines(entry){return entry.lines?.length?entry.lines:entry.items||[];},
  // La tarjeta original del curso, con sus notas y lectura; los números no tienen.
  teachActivity(item){
    const original=this.findLesson(item.lessonId)?.lesson.activities?.find(activity=>activity.id===item.activityId);
    return original?{...original,gradable:false}:{id:`daily-teach-${item.activityId}`,type:'teach_concept',prompt:'Aprende y escucha',target:item.target,options:[],answer:'',explanation:item.meaning,meaning:item.meaning,audio:item.audio,slow_audio:item.slowAudio,tags:['daily'],xp:2,gradable:false};
  },

  beginActivities(activities,step,title){
    this.dailyMode=true;this.dailyStep=step;this.reviewMode=false;
    this.lesson={id:`daily-${step.phase.id}-${Date.now()}`,title,activities};
    this.unit=step.unit||{id:'daily',lessons:[this.lesson]};
    const resume=step.kind==='set'?currentClass(this.daily)?.resume:null,resumed=resume?.phase===step.phase.id&&activities[resume.index]?.id===resume.id;
    this.activityIndex=resumed?resume.index:0;this.answers=resumed?resume.answers:{};this.blockSelections={};this.speechState=null;this.feedback=null;
    this.renderActivity();
  },
  runSet(phase,activities,{srsItems=[]}={}){this.beginActivities(activities,{kind:'set',phase,srsItems},phase.title);},
  runSoundLesson(){
    const ref=nextSoundLesson(this.orderedUnits(),{language:this.language,completedLessons:this.progress.completedLessons});
    if(ref)this.runLesson(ref,{extra:true});
  },
  runLesson(ref,{extra=false}={}){
    const found=this.findLesson(ref.lessonId);
    if(!found)return this.renderToday();
    const phase=DAILY_PHASES.find(item=>item.id==='learn');
    this.dailyMode=true;this.dailyStep={kind:'lesson',phase,ref,unit:found.unit,extra};this.reviewMode=false;
    this.lesson={...found.lesson,activities:lessonActivitiesForPresentation(this.course,found.unit,found.lesson)};
    this.unit=found.unit;this.activityIndex=0;this.answers={};this.blockSelections={};this.speechState=null;this.feedback=null;
    this.renderActivity();
  },

  async finishDailyActivities(){
    const step=this.dailyStep,result=scoreActivities(this.lesson.activities,this.answers,this.language);
    this.dailyMode=false;
    if(step.kind==='free'){this.daily=markExtraStudy(this.daily);await this.saveDaily();return this.renderCheckpoint(null,result,{free:true});}
    if(step.kind==='set'){
      delete currentClass(this.daily).resume;
      if(step.srsItems?.length){this.progress=completeGuidedReview(this.progress,step.srsItems,result,this.progressConfig());this.reviewedToday+=step.srsItems.length;await this.put('metadata',this.progress);}
      // Lo que se falla vuelve en el próximo repaso.
      const weak=(result.errors||[]).map(error=>this.lesson.activities.find(activity=>activity.id===error.activityId)?.itemTarget).filter(Boolean);
      if(weak.length){const entry=currentClass(this.daily);entry.weak=[...new Set([...(entry.weak||[]),...weak])];}
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
    if(step.extra)return this.renderCheckpoint(null,result,{free:true});
    if(!passed)return this.renderLessonRetry(step.ref,result);
    const entry=currentClass(this.daily),nextIndex=entry.learnIndex+1,total=partsOf(entry).length;
    this.daily=advanceLearnIndex(this.daily,nextIndex);
    if(nextIndex<total){await this.saveDaily();return this.renderCheckpoint(step.phase,result,{lessonBreak:true,nextIndex,total});}
    return this.finishPhase(step.phase,result);
  },
  renderLessonRetry(ref,result){
    const errors=(result.errors||[]).slice(0,8);
    this.dailyRetryRef=ref;
    this.shell(`<section class="dc-checkpoint retry"><span class="dc-eyebrow">CASI</span><h1>Repitamos esta lección con calma</h1><p>Hacerla otra vez ahora, con todo fresco, es como se aprende.</p>${errors.length?`<div class="dc-chips">${errors.map(error=>`<span class="dc-chip old" lang="${esc(this.definition.htmlLang)}" dir="auto">${esc(error.activity?.target||error.answer)}</span>`).join('')}</div>`:''}<button class="primary" data-dc-action="retry-lesson">Repetir la lección</button><button class="dc-link" data-dc-action="to-today">Parar aquí por hoy</button></section>`,'Hoy');
  },

  async finishPhase(phase,result,{note='',skip=false}={}){
    this.daily=completePhase(this.daily,phase.id,result);
    await this.saveDaily();
    if(currentClass(this.daily).completedDate)return this.renderClassComplete();
    // Una fase sin nada que hacer (p. ej. el repaso de la primera clase) no merece un
    // checkpoint «hecho»: se pasa directamente a la siguiente.
    if(skip)return this.startPhase(DAILY_PHASES[currentClass(this.daily).phaseIndex]?.id);
    return this.renderCheckpoint(phase,result,{note});
  },

  // ── Checkpoint animado ─────────────────────────────────────────────────
  renderCheckpoint(phase,result,{note='',lessonBreak=false,nextIndex=0,total=0,free=false}={}){
    const entry=currentClass(this.daily),next=DAILY_PHASES[entry.phaseIndex],steps=this.classSteps(entry),step=steps.indexOf(next)+1;
    const nextPart=lessonBreak&&partsOf(entry)[nextIndex];
    const title=free?'Práctica terminada':lessonBreak?entry.kind==='reading'?`Lección ${nextIndex} de ${total} lista`:'Sonidos listos':`Ahora: ${next?.title||''}`;
    const nextLabel=free?'':lessonBreak?nextPart?.items?'Seguir con la clase':`Seguir con la lección ${nextIndex+1}`:'Continuar';
    const nextAttr=lessonBreak?'learn':next?.id,missed=result?.errors?.length;
    this.shell(`<section class="dc-checkpoint"><span class="dc-check" aria-hidden="true">✓</span>${!free&&!lessonBreak&&step?`<span class="dc-eyebrow">PASO ${step} DE ${steps.length}</span>`:''}<h1>${esc(title)}</h1>${!free&&!lessonBreak&&next?`<p>${esc(next.id==='listen'&&!entry.lines?.some(line=>line.speaker)?'Escucha lo de hoy, léelo y repítelo en voz alta.':next.description)}</p>`:''}${missed?`<p class="dc-soft">Lo que no salió volverá en un repaso.</p>`:''}${note?`<p>${esc(note)}</p>`:''}${nextLabel?`<button class="primary" data-dc-action="start-phase" data-dc-phase="${esc(nextAttr)}">${esc(nextLabel)}</button>`:''}<button class="dc-link" data-dc-action="to-today">${free?'Volver':'Seguir más tarde'}</button></section>`,'Hoy');
  },

  renderClassComplete(){
    const entry=currentClass(this.daily),reading=entry.kind==='reading';
    this.shell(`<section class="dc-checkpoint complete"><span class="dc-check" aria-hidden="true">★</span><span class="dc-eyebrow">${reading?'LECTURA':`CLASE ${entry.number}`} TERMINADA</span><h1>${reading?'¡Listo por hoy!':`Ya puedes ${esc(entry.goal)}`}</h1><p>Mañana empezamos repasando esto.</p><button class="primary" data-dc-action="to-today">Terminar</button>${entry.items.length?`<button class="dc-link" data-dc-action="recap">Ver el video de repaso</button>`:''}</section>`,'Hoy');
  },

  // ── Fase de escucha (Assimil) ──────────────────────────────────────────
  renderListen(lines,step){
    this.stopPlayback?.();
    this.dailyListen={lines,step,current:-1,replay:Boolean(this.dailyListen?.replay&&this.dailyListen.lines===lines)};
    const steps=['Solo escucha','Lee y escucha','Repite en voz alta'];
    const lang=esc(this.definition.htmlLang);
    let body='';
    const stories=lines.some(line=>line.story!==undefined)?this.dailyStories||[]:[];
    const lineItem=(line,index)=>`<li data-dc-line="${index}" style="--i:${index}"><button data-dc-action="play-line" data-dc-line="${index}">${line.speaker?`<span class="dc-line-speaker">${esc(line.speaker)}</span>`:''}<span class="dc-line-ko" lang="${lang}" dir="auto">${esc(line.target)}</span>${line.reading?`<span class="dc-line-reading">${esc(line.reading)}</span>`:''}<span class="dc-line-es">${esc(line.meaning)}</span></button>${!line.speaker&&hasIllustration(line.meaning)?`<i class="dc-line-pic" aria-hidden="true">${illustrationFor(line.meaning)}</i>`:''}</li>`;
    const sceneOf=story=>sceneSvg(story.scene)||sceneSvg('generic');
    if(step===0){
      const pictures=stories.length?'':lines.filter(line=>hasIllustration(line.meaning)).slice(0,6).map(line=>`<figure data-dc-line="${lines.indexOf(line)}">${illustrationFor(line.meaning)}</figure>`).join('');
      const scenes=stories.map((story,index)=>`<figure class="dc-story-scene" data-dc-story="${index}">${sceneOf(story)}<figcaption>${esc(story.title)}</figcaption></figure>`).join('');
      body=`<p class="dc-listen-help">${currentClass(this.daily)?.story?`Hoy escuchas «${esc(currentClass(this.daily).story)}». Habrá palabras nuevas: no te detengas, solo sigue la idea.`:'Todavía no intentes entenderlo todo. Escucha una o dos veces cómo suena.'}</p>${scenes?`<div class="dc-story-scenes">${scenes}</div>`:`<div class="dc-orb" aria-hidden="true"><i></i><i></i><i></i><span>♪</span></div><div class="dc-listen-pictures">${pictures}</div>`}<p class="dc-listen-count" aria-live="polite"></p><div class="dc-listen-actions"><button class="primary" data-dc-action="play-all">▶ Escuchar todo</button><button data-dc-action="listen-step" data-dc-step="1">Siguiente →</button></div>`;
    }else if(step===1){
      const list=stories.length?stories.map((story,storyIndex)=>`<section class="dc-story"><div class="dc-story-head"><i aria-hidden="true">${sceneOf(story)}</i><h3>${esc(story.title)}</h3></div><ol class="dc-lines">${lines.map((line,index)=>line.story===storyIndex?lineItem(line,index):'').join('')}</ol>${story.notes?.length?`<details class="dc-notes"><summary>Notas de la lección</summary><dl>${story.notes.map(note=>`<dt lang="${lang}" dir="auto">${esc(note.ko)}</dt><dd>${esc(note.es)}</dd>`).join('')}</dl></details>`:''}</section>`).join(''):`<ol class="dc-lines">${lines.map(lineItem).join('')}</ol>`;
      body=`<p class="dc-listen-help">Ahora escucha mientras lees. Toca cualquier frase para oírla otra vez.${stories.length?' Abre las notas para entender cada detalle.':''}</p><div class="dc-lines-wrap">${list}</div><div class="dc-listen-actions"><button class="primary" data-dc-action="play-all">▶ Escuchar todo leyendo</button><button data-dc-action="listen-step" data-dc-step="2">Siguiente →</button></div>`;
    }else{
      const index=Math.max(0,Math.min(lines.length-1,this.dailyShadowIndex||0)),line=lines[index],story=stories[line.story];
      const picture=story?`<div class="dc-shadow-scene" aria-hidden="true">${sceneOf(story)}</div>`:hasIllustration(line.meaning)?`<div class="dc-shadow-pic" aria-hidden="true">${illustrationFor(line.meaning)}</div>`:'';
      body=`<p class="dc-listen-help">Escucha la frase y repítela en voz alta imitando el ritmo y la entonación. No pasa nada si no sale perfecta.</p><div class="dc-shadow" style="--n:${lines.length}"><div class="dc-shadow-count">${index+1} / ${lines.length}</div>${picture}${line.speaker?`<div class="dc-line-speaker">${esc(line.speaker)}</div>`:''}<div class="dc-shadow-ko" lang="${lang}" dir="auto">${esc(line.target)}</div>${line.reading?`<div class="dc-line-reading">${esc(line.reading)}</div>`:''}<div class="dc-shadow-es">${esc(line.meaning)}</div><div class="dc-shadow-turn" aria-live="polite"><span>Escucha…</span><div class="dc-shadow-bar"><i></i></div></div></div><div class="dc-listen-actions"><button data-dc-action="shadow-again">↺ Otra vez</button><button data-dc-action="shadow-slow">Lento</button>${index<lines.length-1?`<button class="primary" data-dc-action="shadow-next">Siguiente frase →</button>`:`<button class="primary" data-dc-action="listen-finish">Terminar ✓</button>`}</div>`;
    }
    this.shell(`<section class="dc-listen step-${step}"><header class="dc-listen-top"><button data-dc-action="to-today" aria-label="Salir">✕</button><div><strong>${esc(steps[step])}</strong><span>${step+1} de ${steps.length}</span></div></header>${body}</section>`,'Hoy');
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
    const timeline=buildRecapTimeline({classNumber:entry.number,unitTitle:entry.title||unit?.title||'',items:entry.items});
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

  // Las tarjetas de profesor: la regla de la clase y la tarea final.
  renderTeacherCard(activity,total){
    const lang=esc(this.definition.htmlLang),examples=(activity.examples||[]).map(item=>`<li><button data-jp-audio="normal" data-jp-audio-key="${esc(item.audio)}" aria-label="Escuchar"><span lang="${lang}" dir="auto">${esc(item.target)}</span><em>${esc(item.meaning)}</em></button></li>`).join('');
    this.shell(`<section class="jp-activity"><header class="jp-activity-top"><button data-jp-action="leave-lesson" aria-label="Salir de la lección">✕</button><div class="jp-progress"><i style="width:${(this.activityIndex+1)/total*100}%"></i></div><strong>${this.activityIndex+1}/${total}</strong></header><main class="jp-question dc-teacher"><span class="jp-type">${activity.task?'SIN AYUDA':'EL PROFESOR EXPLICA'}</span><h1>${esc(activity.prompt)}</h1><p class="dc-teacher-text">${esc(activity.explanation)}</p>${examples?`<ul class="dc-teacher-examples">${examples}</ul>`:''}</main><footer class="jp-check"><button class="primary" data-jp-action="continue">${activity.task?'Ya lo dije':'Entendido'}</button></footer></section>`,'Hoy');
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
      const active=section==='Perfil'?'profile':section==='Videos'?'videos':'today',tab=(attrs,icon,label,on=false)=>`<button class="jp-app-tab ${on?'active':''}" ${attrs} ${on?'aria-current="page"':''}>${NAV_ICONS[icon]}${label}</button>`;
      nav.innerHTML=`<div class="jp-app-tabs">${tab('data-jp-action="exit"','home','Inicio')}${tab('data-jp-route="today"','today','Hoy',active==='today')}${tab('data-jp-route="videos"','videos','Videos',active==='videos')}${tab('data-jp-route="profile"','profile','Perfil',active==='profile')}</div>`;
    }
    if(section==='Hoy')this.setBreadcrumb?.([this.definition.name]);
  },
  renderActivity(){
    const activity=this.lesson?.activities?.[this.activityIndex];
    if(activity?.picture)return this.renderPictureActivity(activity,this.lesson.activities.length);
    if(activity?.rule||activity?.task)return this.renderTeacherCard(activity,this.lesson.activities.length);
    original.renderActivity.call(this);
    // Los ejercicios de la clase ya explican todo en el mensaje: no hay más detalles.
    if(this.dailyMode&&activity?.tags?.includes('daily'))this.root.querySelectorAll('.jp-learning-review,[data-jp-action="review-explanation"]').forEach(element=>element.remove());
    if(this.dailyMode){const type=this.root.querySelector('.jp-type');if(type&&this.dailyStep?.phase){const entry=currentClass(this.daily),steps=entry?this.classSteps(entry):[],step=steps.indexOf(this.dailyStep.phase)+1;type.textContent=`${this.dailyStep.phase.title.toUpperCase()}${step?` · PASO ${step} DE ${steps.length}`:''}`;}}
  },
  renderTeachingActivity(activity,total){
    original.renderTeachingActivity.call(this,activity,total);
    // Lecciones de letras de coreano: el bloque se arma delante del alumno.
    if(this.language==='Korean'&&['hangul-foundations','reading'].includes(this.unit?.id)&&!this.root.querySelector('.hb-anim')){
      const syllables=syllablesForCard(activity),html=syllables.length?blockAnimationHTML(syllables,{highlight:/^[ㄱ-ㅣ]$/u.test(String(activity.target).trim())?String(activity.target).trim():''}):'';
      if(html)(this.root.querySelector('.jp-teach-symbol')||this.root.querySelector('.jp-question h1'))?.insertAdjacentHTML('afterend',html);
    }
    // Lecciones de kana: sonido y gemelo, combinaciones (が, きゃ) y tiempos de cada palabra.
    if(this.language==='Japanese'&&['reading-foundations','hiragana-01','katakana','rhythm'].includes(this.unit?.id)&&!this.root.querySelector('.hb-anim')){
      const html=kanaAnimationHTML(activity);
      if(html)(this.root.querySelector('.jp-teach-symbol')||this.root.querySelector('.jp-question h1'))?.insertAdjacentHTML('afterend',html);
    }
    const meaning=String(activity.meaning||activity.explanation||'').trim(),svg=meaning&&illustrationFor(meaning);
    const target=this.root.querySelector('.jp-teach-symbol');
    if(svg&&target&&!this.root.querySelector('.dc-illustration'))target.insertAdjacentHTML('beforebegin',`<figure class="dc-illustration" aria-hidden="true">${svg}</figure>`);
    if(this.dailyMode){const heading=this.root.querySelector('.jp-question h1');if(heading?.textContent.trim()==='Aprende y escucha')heading.remove();}
  },
  async continue(){
    if(this.dailyMode&&this.lesson&&this.activityIndex>=this.lesson.activities.length-1){this.cancelSpeech();return this.finishDailyActivities();}
    await original.continue.call(this);
    // Salir a media parte no borra lo hecho: la próxima vez sigue en la misma pregunta.
    if(this.dailyMode&&this.dailyStep?.kind==='set'){const entry=currentClass(this.daily);entry.resume={phase:this.dailyStep.phase.id,index:this.activityIndex,id:this.lesson.activities[this.activityIndex]?.id,answers:this.answers};this.saveDaily();}
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
    path.insertAdjacentHTML('beforebegin','<section class="jp-today-plan"><div><span>HOY</span><h2>Tu clase del día</h2><p>Repaso, una conversación, lo nuevo, práctica y uso real.</p></div><button class="primary" data-jp-route="today">Abrir la clase de hoy</button></section>');
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
    if(leave&&this.dailyMode){this.dailyMode=false;this.cancelSpeech();this.showToast('Tu avance está guardado.');return this.renderToday();}
    const action=event.target.closest('[data-dc-action]');
    if(!action)return original.handleClick.call(this,event);
    const name=action.dataset.dcAction;
    if(!['play-line','play-all','shadow-again','shadow-slow'].includes(name)&&!name.startsWith('recap')){this.dailyPlayToken=null;this.stopPlayback?.();}
    if(name==='start-phase')return this.startPhase(action.dataset.dcPhase);
    if(name==='to-today'){this.dailyMode=false;return this.renderToday();}
    if(name==='retry-lesson')return this.runLesson(this.dailyRetryRef);
    if(name==='play-all')return this.playLines();
    if(name==='play-line'){const index=Number(action.dataset.dcLine);this.dailyPlayToken=null;this.highlightLine(index);return this.playLine(this.dailyListen.lines[index]);}
    if(name==='listen-step'){this.dailyShadowIndex=0;return this.renderListen(this.dailyListen.lines,Number(action.dataset.dcStep));}
    if(name==='shadow-again')return this.shadowLine('normal');
    if(name==='shadow-slow')return this.shadowLine('slow');
    if(name==='shadow-next'){this.dailyShadowIndex=(this.dailyShadowIndex||0)+1;return this.renderListen(this.dailyListen.lines,2);}
    if(name==='listen-finish'){if(this.dailyListen?.replay){this.dailyListen=null;return this.renderToday();}this.dailyListen=null;return this.finishPhase(DAILY_PHASES.find(phase=>phase.id==='listen'),null);}
    if(name==='replay-listen'){const lines=this.listenLines(currentClass(this.daily));if(!lines.length)return;this.renderListen(lines,1);this.dailyListen.replay=true;return;}
    if(name==='free-practice')return this.startFreePractice();
    if(name==='sound-lesson')return this.runSoundLesson();
    if(name==='recap')return this.renderRecap(action.dataset.dcStyle);
    if(name==='recap-play')return this.recapPlayer?.toggle();
    if(name==='recap-prev')return this.recapPlayer?.step(-1);
    if(name==='recap-next')return this.recapPlayer?.step(1);
    if(name==='recap-cc'||name==='recap-sound'){const on=action.getAttribute('aria-pressed')!=='true';action.setAttribute('aria-pressed',String(on));action.classList.toggle('on',on);return name==='recap-cc'?this.recapPlayer?.setSubtitles(on):this.recapPlayer?.setSound(on);}
    if(name==='recap-full'){const stage=this.root.querySelector('.dc-recap-stage');return document.fullscreenElement?document.exitFullscreen():stage?.requestFullscreen?.();}
    if(name==='advance')return this.ensureTodayClass(true).then(()=>this.renderToday());
  },
});
