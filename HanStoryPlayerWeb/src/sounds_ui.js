// «Leer y pronunciar»: el curso de letras y sonidos de cada idioma, separado de la clase
// del día. Lista las lecciones en orden, propone las de hoy, repasa los sonidos ya vistos y
// deja grabarse para comparar la pronunciación con el audio.
// En alfabetos no latinos la clase del día espera a que termine esta sección.
import{JapaneseCourseApp}from'./japanese_course_app.js';
import{LATIN_SCRIPT,READING_UNITS}from'./class_plan.js';
import{ui}from'./ui_icons.js';
import{languageTheme}from'./language_theme.js';

const esc=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const proto=JapaneseCourseApp.prototype,original={renderRoute:proto.renderRoute,handleClick:proto.handleClick};
const soundsRoute=slug=>new RegExp(`^#/${slug}/sounds`);
const isPractice=lesson=>Boolean(lesson.isReview||lesson.isTest||/review|test|checkpoint|production/.test(String(lesson.id)));
const SOUNDS_PER_DAY=3,RECORD_ITEMS=6,REVIEW_ITEMS=12;
const TEACH=new Set(['teach_concept','teach_kana','teach_word']);

// Las lecciones de la sección, en orden. Las de repaso o prueba son práctica: no bloquean
// las siguientes, pero se abren solo cuando ya hiciste lo que repasan.
export function soundLessons(units,completed=[]){
  const done=new Set(completed),out=[];let open=true;
  for(const unit of units.filter(item=>READING_UNITS.has(item.id)))for(const lesson of unit.lessons||[]){
    if(!(lesson.activities||[]).length)continue;
    const practice=isPractice(lesson),finished=done.has(lesson.id);
    out.push({unit,lesson,practice,done:finished,open:finished||open});
    if(!practice&&!finished)open=false;
  }
  return out;
}
export const soundsPending=(units,completed)=>soundLessons(units,completed).filter(entry=>!entry.practice&&!entry.done);

Object.assign(proto,{
  soundEntries(){return soundLessons(this.orderedUnits(),this.progress.completedLessons);},
  // ¿Hace falta terminar esta sección antes de la clase? Solo si el idioma no usa el alfabeto latino.
  soundsGate(){return!LATIN_SCRIPT.has(this.language)&&soundsPending(this.orderedUnits(),this.progress.completedLessons).length>0;},

  sectionSwitch(active){
    return`<nav class="dc-sections" aria-label="Secciones del curso"><button data-jp-route="today" class="${active==='today'?'active':''}" ${active==='today'?'aria-current="page"':''}>Clase del día</button><button data-jp-route="sounds" class="${active==='sounds'?'active':''}" ${active==='sounds'?'aria-current="page"':''}>Leer y pronunciar</button></nav>`;
  },

  renderSounds(){
    const entries=this.soundEntries(),required=entries.filter(entry=>!entry.practice),done=required.filter(entry=>entry.done).length,next=required.filter(entry=>!entry.done).slice(0,SOUNDS_PER_DAY);
    const latin=LATIN_SCRIPT.has(this.language),name=this.definition.name.toLowerCase(),percent=required.length?Math.round(done/required.length*100):100;
    const units=[...new Set(entries.map(entry=>entry.unit))];
    const row=entry=>{
      const state=entry.done?'done':entry.open?'open':'locked',label=entry.practice?'Repaso':entry.done?'Hecha':next.includes(entry)?'Hoy':'';
      return`<li class="sd-lesson ${state}${entry.practice?' practice':''}"><button data-sd-lesson="${esc(entry.lesson.id)}" ${entry.open?'':'disabled'}><span class="sd-dot" aria-hidden="true">${entry.done?ui('check',{size:16}):''}</span><span class="sd-name">${esc(entry.lesson.title||'Lección')}</span>${label?`<small>${label}</small>`:''}</button></li>`;
    };
    const finished=!next.length;
    this.shell(`<section class="sd-view">${this.sectionSwitch('sounds')}
      <header class="sd-head dc-hero"><span class="dc-glyph" aria-hidden="true">${esc(languageTheme(this.language).glyph)}</span><span class="dc-eyebrow">${esc(this.definition.name.toUpperCase())} · LEER Y PRONUNCIAR</span><h1>${finished?'Ya lees y pronuncias':'Letras y sonidos'}</h1><p>${latin?`Aquí aprendes cómo suena el ${esc(name)}: las letras que cambian respecto al español, los sonidos nuevos y el ritmo. Puedes hacerlo a la vez que la clase del día.`:`Antes de la clase del día aprendes a leer el ${esc(name)} y a pronunciarlo bien. En cuanto termines, empiezan las clases.`}</p>
        <div class="dc-course-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><i style="width:${percent}%"></i></div><small class="sd-count">${done} de ${required.length} lecciones</small></header>
      ${finished?`<section class="dc-card sd-today"><h2>Sección terminada</h2><p>Repasa los sonidos de vez en cuando y grábate para comparar: así no se te escapa la pronunciación.</p></section>`:`<section class="dc-card sd-today"><h2>Hoy: ${next.length} lecci${next.length===1?'ón':'ones'}</h2><ol>${next.map(entry=>`<li>${esc(entry.lesson.title||'Lección')}</li>`).join('')}</ol><button class="primary dc-cta" data-sd-lesson="${esc(next[0].lesson.id)}">${done?'Seguir':'Empezar'} ${ui('arrow',{size:18})}</button></section>`}
      <section class="sd-tools"><button data-sd-action="review" ${done?'':'disabled'}>${ui('replay',{size:18})}<span><b>Repasar sonidos</b><small>${REVIEW_ITEMS} preguntas de lo que ya viste</small></span></button><button data-sd-action="record" ${done?'':'disabled'}>${ui('mic',{size:18})}<span><b>Grábate y compara</b><small>Escucha, grábate y oye la diferencia</small></span></button></section>
      ${units.map(unit=>`<section class="sd-unit"><h2>${esc(unit.title)}</h2><ol class="sd-lessons">${entries.filter(entry=>entry.unit===unit).map(row).join('')}</ol></section>`).join('')}
    </section>`,'Hoy');
  },

  runSoundsLesson(id){
    const entry=this.soundEntries().find(item=>item.lesson.id===id);
    if(!entry||!entry.open)return this.renderSounds();
    this.runLesson({unitId:entry.unit.id,lessonId:id},{origin:'sounds'});
  },

  // Al terminar una lección de la sección: grabarse con lo que se acaba de aprender.
  renderSoundsDone(ref,result){
    const entries=this.soundEntries(),next=entries.find(entry=>!entry.practice&&!entry.done),lesson=this.findLesson(ref.lessonId)?.lesson;
    this.soundsRecordItems=this.recordItemsFrom(lesson?[lesson]:[]);
    this.shell(`<section class="dc-checkpoint complete"><span class="dc-check" aria-hidden="true">${ui('check',{size:28})}</span><span class="dc-eyebrow">LEER Y PRONUNCIAR</span><h1>Lección superada</h1><p>${result?.percentage??100}% de aciertos. Antes de seguir, grábate diciendo lo de hoy y compáralo con el audio: es la forma de asegurarte de que lo pronuncias bien.</p>${this.soundsRecordItems.length?'<button class="primary" data-sd-action="record-lesson">Grabarme y comparar</button>':''}${next?`<button class="${this.soundsRecordItems.length?'dc-link':'primary'}" data-sd-lesson="${esc(next.lesson.id)}">Siguiente lección</button>`:''}<button class="dc-link" data-jp-route="sounds">Volver a la lista</button></section>`,'Hoy');
  },

  recordItemsFrom(lessons){
    const seen=new Set(),items=[];
    for(const lesson of lessons)for(const activity of lesson.activities||[]){
      const target=String(activity.target||'').trim();
      if(!TEACH.has(activity.type)||!target||seen.has(target)||[...target].length>24)continue;
      seen.add(target);items.push({target,audio:activity.audio||target,meaning:String(activity.sound_hint||activity.meaning||'').trim()});
    }
    return items.slice(0,RECORD_ITEMS);
  },

  renderRecord(index=0){
    const items=this.soundsRecordItems||[],item=items[index];
    if(!item)return this.renderSounds();
    this.soundsRecordIndex=index;this.soundsRecording=null;
    const supported=Boolean(navigator.mediaDevices?.getUserMedia&&window.MediaRecorder);
    this.shell(`<section class="sd-record"><header class="dc-listen-top"><button data-jp-route="sounds" aria-label="Salir">${ui('close')}</button><div><strong>Grábate y compara</strong><span>${index+1} de ${items.length}</span></div></header>
      <p class="dc-listen-help">1. Escucha. 2. Grábate diciéndolo igual. 3. Oye las dos versiones y repite hasta que se parezcan.</p>
      <div class="sd-target" lang="${esc(this.definition.htmlLang)}" dir="auto">${esc(item.target)}</div>${item.meaning?`<p class="sd-hint">${esc(item.meaning)}</p>`:''}
      <div class="sd-record-actions"><button data-sd-action="model">${ui('play',{size:20})}<span>Escuchar</span></button>${supported?`<button data-sd-action="rec" class="sd-rec">${ui('mic',{size:20})}<span>Grabarme</span></button><button data-sd-action="mine" disabled>${ui('replay',{size:20})}<span>Oírme</span></button>`:'<p class="sd-note">Este navegador no permite grabar. Repite en voz alta justo después del audio.</p>'}</div>
      <footer class="jp-check"><button class="primary" data-sd-action="record-next">${index+1<items.length?'Siguiente':'Terminar'}</button></footer></section>`,'Hoy');
    this.playKeyAudio(item.audio,'normal',false);
  },

  async toggleRecording(button){
    if(this.soundsRecorder?.state==='recording'){this.soundsRecorder.stop();return;}
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true}),chunks=[],recorder=new MediaRecorder(stream);
      this.soundsRecorder=recorder;
      recorder.ondataavailable=event=>chunks.push(event.data);
      recorder.onstop=()=>{stream.getTracks().forEach(track=>track.stop());this.soundsRecording=URL.createObjectURL(new Blob(chunks,{type:recorder.mimeType||'audio/webm'}));button.classList.remove('on');button.querySelector('span').textContent='Grabarme otra vez';const mine=this.root.querySelector('[data-sd-action="mine"]');if(mine)mine.disabled=false;};
      recorder.start();button.classList.add('on');button.querySelector('span').textContent='Detener';
      // Una sílaba o una palabra no necesita más de cuatro segundos.
      setTimeout(()=>{if(recorder.state==='recording')recorder.stop();},4000);
    }catch{this.showToast?.('Activa el permiso del micrófono para grabarte.');}
  },

  // Repaso: preguntas de escucha y reconocimiento de las lecciones ya hechas, mezcladas.
  startSoundsReview(){
    const done=this.soundEntries().filter(entry=>entry.done),pool=done.flatMap(entry=>(entry.lesson.activities||[]).filter(activity=>['listening_choice','select_translation','kana_choice','audio_to_kana','kana_to_audio'].includes(activity.type)));
    if(!pool.length)return this.renderSounds();
    const picked=[...pool].sort((a,b)=>String(a.id).localeCompare(String(b.id))).filter((_,index,list)=>index%Math.max(1,Math.floor(list.length/REVIEW_ITEMS))===0).slice(0,REVIEW_ITEMS);
    this.beginActivities(picked.map(activity=>({...activity,id:`sounds-review-${activity.id}`})),{kind:'sounds-review',phase:{id:'sounds',title:'Repaso de sonidos'}},'Repaso de sonidos');
  },

  async renderRoute(){
    if(!(this.active&&soundsRoute(this.definition.slug).test(location.hash)))return original.renderRoute.call(this);
    this.root.className='japanese-guided-course guided-course';
    this.root.style.setProperty('--jp-orange',this.definition.accent);
    this.dailyMode=false;
    this.renderSounds();
    window.scrollTo({top:document.querySelector('main')?.offsetTop||0,behavior:'auto'});
  },

  handleClick(event){
    const lesson=event.target.closest('[data-sd-lesson]'),action=event.target.closest('[data-sd-action]');
    if(lesson)return this.runSoundsLesson(lesson.dataset.sdLesson);
    if(!action)return original.handleClick.call(this,event);
    const name=action.dataset.sdAction;
    if(name==='review')return this.startSoundsReview();
    if(name==='record'){const done=this.soundEntries().filter(entry=>entry.done&&!entry.practice).slice(-3).map(entry=>entry.lesson);this.soundsRecordItems=this.recordItemsFrom(done);return this.renderRecord(0);}
    if(name==='record-lesson')return this.renderRecord(0);
    if(name==='model')return this.playKeyAudio(this.soundsRecordItems[this.soundsRecordIndex].audio,'normal',false);
    if(name==='rec')return this.toggleRecording(action);
    if(name==='mine'&&this.soundsRecording){this.stopPlayback?.();const audio=new Audio(this.soundsRecording);return audio.play().catch(()=>{});}
    if(name==='record-next'){if(this.soundsRecorder?.state==='recording')this.soundsRecorder.stop();return this.renderRecord(this.soundsRecordIndex+1);}
  },
});
