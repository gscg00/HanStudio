// Pestaña Escribir: aprender dónde está cada letra del idioma en tu teclado.
//   · Contrarreloj: niveles de 10 (letras → palabras cortas → palabras → frases).
//   · Asteroides: las palabras caen con su traducción y se destruyen escribiéndolas.
//   · Metro (idea de metroTyping): cada estación es una frase de tus clases; tu tren
//     avanza al escribirla y compite con el tren de tu mejor tiempo.
//   · Dictado relámpago: solo se oye; se escribe antes de que se acabe el tiempo.
// La traducción aparece dentro del juego (noir · negro), sin pantallas de lista al
// final que saquen de la inmersión. Las letras que más fallas salen más (como keybr).
// El teclado físico escribe en el idioma gracias a native_typing.js.
import{JapaneseCourseApp}from'./japanese_course_app.js';
import{decomposeHangulText,physicalLayout}from'./guided_virtual_keyboard.js';
import{nativeTypingEnabled,setNativeTyping,POSITIONAL,finishKana}from'./native_typing.js';
import{ui}from'./ui_icons.js';
const hudHTML=(wave,lives,score)=>`<b>Ola ${wave+1}</b><span class="ty-lives" aria-label="${Math.max(0,lives)} vidas">${ui('heart',{size:16}).repeat(Math.max(0,lives))}</span><b>${score}</b>`;
import{dateKey}from'./daily_class.js';
import{DAILY_TASK_COUNT,advanceDailyTask,dailyTaskItems,dailyTaskState,LEVELS,buildLevel,correctPrefix,normalizeTyped,dictationItems,levelResult,raceProgress,raceTexts,timeFor,typedMatches,typingPool,updateWeakness,waveSettings,waveWords,weakFirst}from'./typing_logic.js';

const esc=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const proto=JapaneseCourseApp.prototype,original={renderRoute:proto.renderRoute,handleClick:proto.handleClick,stop:proto.stop};
const typingRoute=slug=>new RegExp(`^#/${slug}/typing(?:/(\\w+))?`);
const recordId=slug=>`typing:${slug}:v1`;
const KEY_ROWS=[['KeyQ','KeyW','KeyE','KeyR','KeyT','KeyY','KeyU','KeyI','KeyO','KeyP','BracketLeft','BracketRight'],['KeyA','KeyS','KeyD','KeyF','KeyG','KeyH','KeyJ','KeyK','KeyL','Semicolon','Quote'],['KeyZ','KeyX','KeyC','KeyV','KeyB','KeyN','KeyM','Comma','Period','Slash']];
const LATIN={BracketLeft:'[',BracketRight:']',Semicolon:';',Quote:"'",Comma:',',Period:'.',Slash:'/'};
const latinOf=code=>LATIN[code]||code.replace('Key','');
const REVEAL_OK=1600,REVEAL_MISS=2400,REVEAL_DAILY=900;
const svg=body=>`<svg viewBox="0 0 120 80" aria-hidden="true">${body}</svg>`;
const GAME_ART={
  clock:svg('<rect width="120" height="80" fill="#f3e3d6"/><circle cx="60" cy="42" r="24" fill="#fffdf8" stroke="#1b3a32" stroke-width="3"/><path d="M60 42V28M60 42l10 6" stroke="#b8501f" stroke-width="3" stroke-linecap="round"/><rect x="54" y="12" width="12" height="6" rx="2" fill="#1b3a32"/>'),
  rocks:svg('<rect width="120" height="80" fill="#10201b"/><circle cx="20" cy="14" r="1.5" fill="#fff8"/><circle cx="95" cy="24" r="1.5" fill="#fff8"/><circle cx="70" cy="8" r="1.5" fill="#fff8"/><path d="M30 18l12-4 10 6-2 10-12 4-9-6z" fill="#5e6e68"/><path d="M78 32l10-3 8 5-2 8-10 3-7-5z" fill="#5e6e68"/><path d="M60 52l-9 22h18z" fill="#f2b48f"/>'),
  race:svg('<rect width="120" height="80" fill="#ede5d7"/><path d="M0 34h120M0 58h120" stroke="#d9cdb8" stroke-width="2" stroke-dasharray="6 6"/><rect x="62" y="22" width="26" height="12" rx="4" fill="#b8501f"/><circle cx="68" cy="36" r="4" fill="#1b3a32"/><circle cx="82" cy="36" r="4" fill="#1b3a32"/><rect x="34" y="46" width="26" height="12" rx="4" fill="#5e6e6866"/><circle cx="40" cy="60" r="4" fill="#5e6e6866"/><circle cx="54" cy="60" r="4" fill="#5e6e6866"/><path d="M104 14v52" stroke="#1b3a32" stroke-width="3"/><path d="M104 14h12v10h-12z" fill="#1b3a32"/>'),
  ear:svg('<rect width="120" height="80" fill="#ddebdf"/><path d="M38 46a22 22 0 0 1 44 0" fill="none" stroke="#1b3a32" stroke-width="5"/><rect x="31" y="44" width="12" height="20" rx="5" fill="#2f7a4f"/><rect x="77" y="44" width="12" height="20" rx="5" fill="#2f7a4f"/><path d="M96 30q8 10 0 20M102 24q14 16 0 32" fill="none" stroke="#b8501f" stroke-width="3" stroke-linecap="round"/>'),
};

Object.assign(proto,{
  async typingSources(){
    const daily=this.loadDaily?await this.loadDaily().catch(()=>null):null;
    const known=(daily?.classes||[]).flatMap(entry=>[...(entry.items||[]),...(entry.words||[])]).map(item=>({...item,known:true}));
    const topics=this.loadVideoTopics?await this.loadVideoTopics().catch(()=>[]):[];
    const basics=topics.filter(topic=>topic.category==='basico').flatMap(topic=>topic.items);
    return typingPool([...known,...basics],this.language);
  },
  async typingRecord(){return(await this.get('metadata',recordId(this.definition.slug)).catch(()=>null))||{id:recordId(this.definition.slug),levels:{},asteroids:0,race:0,dictation:0,weak:{}};},
  async saveTypingRecord(record){await this.put('metadata',{...record,updatedAt:new Date().toISOString()}).catch(()=>{});},

  // Mapa del teclado: cada tecla con su letra; la siguiente que hace falta se ilumina.
  keyboardMap(next=''){
    const layout=physicalLayout(this.language);
    if(!layout)return '';
    const codeOf=new Map([...Object.entries(layout.base).map(([code,char])=>[char,{code,shift:false}]),...Object.entries(layout.shift).map(([code,char])=>[char,{code,shift:true}])]);
    const want=codeOf.get(next);
    return`<div class="ty-keyboard" dir="ltr" aria-hidden="true">${KEY_ROWS.map(row=>`<div class="ty-row">${row.filter(code=>layout.base[code]).map(code=>`<span class="ty-key ${want?.code===code?'next':''}"><b lang="${esc(this.definition.htmlLang)}">${esc(want?.code===code&&want.shift?layout.shift[code]:layout.base[code])}</b><small>${esc(latinOf(code))}</small></span>`).join('')}</div>`).join('')}${want?.shift?'<p class="ty-shift">Mantén <b>Mayús</b> (Shift)</p>':''}</div>`;
  },
  // La siguiente letra que falta escribir (en coreano, la siguiente pieza del bloque).
  nextLetter(target,typed){
    const split=text=>this.language==='Korean'?[...decomposeHangulText(text)]:[...String(text)];
    const want=split(target),have=split(typed);
    let index=0;while(index<have.length&&have[index]===want[index])index++;
    if(index<have.length)return '';
    return want[index]||'';
  },
  typedValue(input){return this.language==='Japanese'?finishKana(input.value):input.value;},
  // «noir · negro» unos segundos y se sigue: la traducción sin salir del juego.
  revealHTML(item,ok){return`<p class="ty-reveal ${ok?'ok':'miss'}"><b lang="${esc(this.definition.htmlLang)}" dir="auto">${esc(item.text)}</b><span>${esc(item.meaning)}</span></p>`;},

  async renderTyping(){
    window.__hanstudioApp=this;
    const [pool,record]=await Promise.all([this.typingSources(),this.typingRecord()]);
    this.typingPool=pool;this.typingWeak=record.weak||{};
    const positional=POSITIONAL.has(this.language),native=nativeTypingEnabled(),name=this.definition.name.toLowerCase();
    const how=positional?`Tu teclado escribe en ${name} por posición, como un teclado nativo.`:this.language==='Japanese'?'Escribe en rōmaji y se convierte en kana: ka → か, shi → し, tsu → つ, kk → っ, nn → ん.':this.language==='Chinese'?'Para escribir caracteres chinos activa el método de entrada pinyin de tu sistema.':'Escribe con tu teclado de siempre; los acentos cuentan.';
    const chips=LEVELS.map((level,index)=>{const best=record.levels[level.id],count=pool.filter(item=>item.level===level.id).length,locked=index>0&&!record.levels[LEVELS[index-1].id]?.passed;return`<button class="ty-chip ${best?.passed?'done':''}" data-ty-level="${level.id}" ${count<4||locked?'disabled':''} title="${esc(locked?'Pasa el nivel anterior (8 de 10)':level.note)}">${index+1}. ${esc(level.title)}${best?` · ${best.correct}/10`:''}</button>`;}).join('');
    const weakCount=Object.keys(record.weak||{}).length,day=dateKey(new Date()),task=dailyTaskState(record.daily,day),taskItems=dailyTaskItems(pool,day);
    this.dailyTask={day,items:taskItems};
    const taskTotal=taskItems.length,taskDone=Math.min(task.done,taskTotal),taskPercent=taskTotal?Math.round(taskDone/taskTotal*100):0;
    const taskCard=taskTotal?`<article class="ty-daily ${task.completed?'done':''}"><div class="ty-daily-head"><span class="ty-daily-icon">${ui(task.completed?'check':'pencil',{size:22})}</span><div><span class="dc-eyebrow">TAREA DE HOY</span><h2>${task.completed?'Hecha por hoy':`${taskTotal} palabras para escribir`}</h2><p>${task.completed?'Mañana hay otras. Puedes repetirla si quieres.':'Sin reloj: ve a tu ritmo y fíjate dónde está cada letra.'}</p></div>${task.streak?`<span class="ty-streak" title="Días seguidos">${task.streak} día${task.streak===1?'':'s'}</span>`:''}</div><div class="ty-daily-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${taskTotal}" aria-valuenow="${taskDone}"><i style="width:${taskPercent}%"></i></div><div class="ty-daily-foot"><small>${taskDone} de ${taskTotal}</small><button class="${task.completed?'':'primary'}" data-ty-daily>${task.completed?'Repetir':taskDone?'Seguir':'Empezar'}</button></div></article>`:'';
    const card=(art,title,text,action,extra='',disabled=false)=>`<article class="ty-game-card"><span class="ty-art">${GAME_ART[art]}</span><div><h2>${esc(title)}</h2><p>${esc(text)}</p>${extra}</div>${action?`<button class="primary" ${action} ${disabled?'disabled':''}>Jugar</button>`:''}</article>`;
    this.shell(`<section class="ty-view" data-typing-lang="${esc(this.language)}"><div class="dc-title"><span class="dc-eyebrow">${esc(this.definition.name.toUpperCase())} · ESCRIBIR</span><h1>Escribe con tu teclado</h1><p>${esc(how)}</p></div>
      ${positional?`<details class="ty-mapbox"><summary>Ver el mapa del teclado</summary>${this.keyboardMap()}<label class="ty-toggle"><input type="checkbox" data-ty-native ${native?'checked':''}> Mi teclado escribe en ${esc(name)} (desactívalo si ya tienes el teclado ${esc(name)} instalado)</label></details>`:''}
      ${taskCard}
      <h2 class="ty-section">Juegos</h2>
      <div class="ty-games">
        ${card('clock','Contrarreloj','Escribe antes de que se acabe el tiempo; verás qué significa cada una al terminarla.','',`<div class="ty-chips">${chips}</div>${weakCount?`<p class="ty-note">${weakCount} letra${weakCount===1?'':'s'} difícil${weakCount===1?'':'es'}: saldrán más en «Letras».</p>`:''}`)}
        ${card('rocks','Asteroides','Cada asteroide trae una palabra y su traducción. Escríbela antes de que choque con tu nave.','data-ty-asteroids',record.asteroids?`<p class="ty-note">Récord: ${record.asteroids} puntos</p>`:'',pool.length<6)}
        ${card('race','Metro','Cada estación es una frase de tus clases: escríbela para avanzar. Tu tren compite con el de tu mejor tiempo.','data-ty-race',record.race?`<p class="ty-note">Mejor tiempo: ${record.race.toFixed(1)} s</p>`:'',pool.length<6)}
        ${card('ear','Dictado relámpago','Solo lo oyes: escríbelo antes de que se acabe el tiempo.','data-ty-dictation',record.dictation?`<p class="ty-note">Mejor: ${record.dictation}/10</p>`:'',pool.length<6)}
      </div>
    </section>`,'Escribir');
  },

  // ── Contrarreloj ──
  startTypingLevel(levelId){
    window.__hanstudioApp=this;
    let items=buildLevel(this.typingPool||[],levelId,{seed:Date.now()%997,count:30});
    // Letras: primero las que más fallas.
    if(levelId==='letters')items=weakFirst(items,this.typingWeak);
    items=items.slice(0,10);
    if(!items.length)return this.renderTyping();
    this.typing={mode:'level',levelId,items,index:0,answers:[]};
    this.renderTypingItem();
  },
  renderTypingItem(){
    const state=this.typing,item=state.items[state.index],dictation=state.mode==='dictation';
    if(state.mode==='daily')return this.renderDailyTaskItem();
    const seconds=timeFor(item.text,this.language,{level:LEVELS.findIndex(level=>level.id===state.levelId)})+(dictation?3:0);
    this.shell(`<section class="ty-run" data-typing-lang="${esc(this.language)}"><div class="ty-top"><button class="ty-quit" data-ty-quit aria-label="Salir">${ui('close')}</button><span>${state.index+1} / ${state.items.length}</span></div>
      <div class="ty-timer"><i style="animation-duration:${seconds}s"></i></div>
      <div class="ty-stage">${dictation?`<button class="ty-listen" data-ty-replay aria-label="Escuchar otra vez">${ui('sound',{size:40})}</button>`:`<p class="ty-target" lang="${esc(this.definition.htmlLang)}" dir="auto">${esc(item.text)}</p>`}</div>
      <input class="ty-input" data-ty-input autocomplete="off" autocapitalize="off" spellcheck="false" lang="${esc(this.definition.htmlLang)}" dir="auto" aria-label="${dictation?'Escribe lo que oyes':`Escribe: ${esc(item.text)}`}">
      <div class="ty-map">${dictation?'':this.keyboardMap(this.nextLetter(item.text,''))}</div></section>`,'Escribir');
    this.root.querySelector('[data-ty-input]')?.focus();
    if(dictation)this.playKeyAudio?.(item.text,'normal',false);
    clearTimeout(this.typingTimer);
    this.typingTimer=setTimeout(()=>this.finishTypingItem(false),seconds*1000);
  },
  // Tarea del día: sin reloj, con la palabra, su significado y la tecla siguiente.
  startDailyTask(){
    window.__hanstudioApp=this;
    const task=this.dailyTask;if(!task?.items?.length)return this.renderTyping();
    this.typingRecord().then(record=>{
      const saved=dailyTaskState(record.daily,task.day),start=saved.completed?0:Math.min(saved.done,task.items.length-1);
      this.typing={mode:'daily',items:task.items,index:start,answers:[],day:task.day,repeat:saved.completed};
      this.renderTypingItem();
    });
  },
  renderDailyTaskItem(){
    const state=this.typing,item=state.items[state.index],total=state.items.length;
    this.shell(`<section class="ty-run ty-daily-run" data-typing-lang="${esc(this.language)}"><div class="ty-top"><button class="ty-quit" data-ty-quit aria-label="Salir">${ui('close')}</button><span>Tarea de hoy · ${state.index+1} / ${total}</span></div>
      <div class="ty-daily-bar"><i style="width:${state.index/total*100}%"></i></div>
      <div class="ty-stage"><p class="ty-target" lang="${esc(this.definition.htmlLang)}" dir="auto">${esc(item.text)}</p>${item.meaning?`<p class="ty-meaning">${esc(item.meaning)}</p>`:''}</div>
      <input class="ty-input" data-ty-input autocomplete="off" autocapitalize="off" spellcheck="false" lang="${esc(this.definition.htmlLang)}" dir="auto" aria-label="Escribe: ${esc(item.text)}">
      <p class="ty-hint" aria-live="polite"></p>
      <div class="ty-map">${this.keyboardMap(this.nextLetter(item.text,''))}</div></section>`,'Escribir');
    this.root.querySelector('[data-ty-input]')?.focus();
    clearTimeout(this.typingTimer);
  },
  onTypingInput(input){
    const state=this.typing;if(!state||state.revealing)return;
    const item=state.items[state.index];
    if(state.mode==='daily'){
      const typed=this.typedValue(input),wrong=input.value&&!typedMatches(typed,item.text,this.language)&&(this.language==='Korean'?!this.nextLetter(item.text,input.value):!normalizeTyped(item.text,this.language).startsWith(normalizeTyped(input.value,this.language)));
      input.classList.toggle('wrong',Boolean(wrong));
      const hint=this.root.querySelector('.ty-hint');if(hint)hint.textContent=wrong?'Esa letra no va: bórrala y prueba otra.':'';
    }
    if(state.mode!=='dictation'){const map=this.root.querySelector('.ty-map');if(map)map.innerHTML=this.keyboardMap(this.nextLetter(item.text,input.value));}
    if(typedMatches(this.typedValue(input),item.text,this.language))this.finishTypingItem(true);
  },
  finishTypingItem(ok){
    const state=this.typing;if(!state||state.revealing)return;
    clearTimeout(this.typingTimer);
    const item=state.items[state.index];
    state.answers.push({...item,ok});state.revealing=true;
    if(state.levelId==='letters')this.typingWeak=updateWeakness(this.typingWeak,item.text,ok);
    const stage=this.root.querySelector('.ty-stage'),input=this.root.querySelector('[data-ty-input]');
    if(stage)stage.innerHTML=this.revealHTML(item,ok);
    if(input)input.disabled=true;
    this.root.querySelector('.ty-timer i')?.style.setProperty('animation-play-state','paused');
    if(state.mode==='dictation'&&!ok)this.playKeyAudio?.(item.text,'normal',false);
    if(state.mode==='daily'){
      this.root.querySelector('.ty-hint')?.replaceChildren();
      this.typingRecord().then(async record=>{
        if(!state.repeat){record.daily=advanceDailyTask(dailyTaskState(record.daily,state.day),state.items.length,state.day);await this.saveTypingRecord(record);}
        state.record=record.daily;
      });
    }
    setTimeout(()=>{if(this.typing!==state)return;state.revealing=false;state.index++;state.index<state.items.length?this.renderTypingItem():this.renderTypingResult();},state.mode==='daily'?REVEAL_DAILY:ok?REVEAL_OK:REVEAL_MISS);
  },
  async renderTypingResult(){
    const state=this.typing,result=levelResult(state.answers),record=await this.typingRecord();
    record.weak=this.typingWeak||record.weak||{};
    let title,line,again,next='';
    if(state.mode==='daily'){
      const task=dailyTaskState(record.daily,state.day);
      this.typing=null;
      return this.renderTypingScore('Tarea de hoy',task.streak>1?`¡Hecha! ${task.streak} días seguidos`:'¡Hecha! Mañana hay otras palabras','<button class="primary" data-ty-menu>Ir a los juegos</button>',{back:false});
    }
    if(state.mode==='dictation'){
      const best=result.correct>(record.dictation||0);if(best)record.dictation=result.correct;
      title='Dictado relámpago';line=`${result.correct} de ${result.total}${best?' · ¡nuevo récord!':''}`;again='data-ty-dictation';
    }else{
      const old=record.levels[state.levelId];
      if(!old||result.correct>old.correct||result.passed&&!old.passed)record.levels[state.levelId]={...result,date:new Date().toISOString()};
      const index=LEVELS.findIndex(level=>level.id===state.levelId),nextLevel=LEVELS[index+1];
      title=LEVELS[index].title;line=`${result.correct} de ${result.total} · ${result.passed?'¡nivel superado!':'necesitas 8 para pasar'}`;again=`data-ty-level="${state.levelId}"`;
      if(result.passed&&nextLevel)next=`<button data-ty-level="${nextLevel.id}">Siguiente: ${esc(nextLevel.title)}</button>`;
    }
    await this.saveTypingRecord(record);
    this.typing=null;
    this.renderTypingScore(title,line,`<button class="primary" ${again}>Otra vez</button>${next}`);
  },
  // Fin de una partida: solo el resultado, sin listas que saquen del juego.
  renderTypingScore(title,line,buttons,{back=true}={}){
    this.shell(`<section class="ty-run ty-score"><span class="dc-eyebrow">${esc(title.toUpperCase())}</span><h1>${esc(line)}</h1><div class="ty-actions">${buttons}${back?'<button data-ty-menu>Volver</button>':''}</div></section>`,'Escribir');
    this.root.querySelector('.ty-actions .primary')?.focus();
  },

  // ── Dictado relámpago ──
  startDictation(){
    window.__hanstudioApp=this;
    const items=dictationItems(this.typingPool||[],{seed:Date.now()%997});
    if(!items.length)return this.renderTyping();
    this.typing={mode:'dictation',levelId:'words',items,index:0,answers:[]};
    this.renderTypingItem();
  },

  // ── Carrera ──
  async startRace(){
    window.__hanstudioApp=this;
    const texts=raceTexts(this.typingPool||[],{seed:Date.now()%997}),record=await this.typingRecord();
    if(!texts.length)return this.renderTyping();
    const total=texts.reduce((sum,item)=>sum+[...item.text].length,0);
    this.race={texts,index:0,done:0,total,start:0,best:record.race||0,revealing:false};
    this.shell(`<section class="ty-run ty-race" data-typing-lang="${esc(this.language)}"><div class="ty-top"><button class="ty-quit" data-ty-quit aria-label="Salir">${ui('close')}</button><span class="ty-clock">0.0 s</span></div>
      <div class="ty-metro" style="--n:${texts.length}">${this.race.best?'<span class="ty-train ghost" style="--p:0" title="Tu mejor tiempo"></span>':''}<span class="ty-train you" style="--p:0"></span>${['Salida',...texts.map((item,index)=>index+1)].map((label,index)=>`<span class="ty-station ${index?'':'reached'}" style="--at:${index/texts.length}" data-station="${index}"><i></i><small>${index?'':'Salida'}</small></span>`).join('')}</div>
      <div class="ty-stage"><p class="ty-sentence" lang="${esc(this.definition.htmlLang)}" dir="auto"></p></div>
      <input class="ty-input" data-ty-race-input autocomplete="off" autocapitalize="off" spellcheck="false" lang="${esc(this.definition.htmlLang)}" dir="auto" aria-label="Escribe la frase">
      <p class="ty-note">El reloj empieza con tu primera tecla.</p></section>`,'Escribir');
    this.paintRace('');
    this.root.querySelector('[data-ty-race-input]')?.focus();
    const tick=()=>{
      const race=this.race;if(!race||!this.root.querySelector('.ty-race'))return;
      if(race.start){const elapsed=(performance.now()-race.start)/1000;const clock=this.root.querySelector('.ty-clock');if(clock)clock.textContent=`${elapsed.toFixed(1)} s`;
        const ghost=this.root.querySelector('.ty-train.ghost');if(ghost&&race.best)ghost.style.setProperty('--p',Math.min(1,elapsed/race.best));}
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  },
  paintRace(typed){
    const race=this.race,item=race.texts[race.index],sentence=this.root.querySelector('.ty-sentence');if(!sentence)return;
    const ok=correctPrefix(typed,item.text),chars=[...item.text];
    sentence.innerHTML=`<span class="done">${esc(chars.slice(0,ok).join(''))}</span>${[...typed].length>ok?`<span class="wrong">${esc(chars.slice(ok,[...typed].length).join('')||' ')}</span>`:''}<span>${esc(chars.slice(Math.max(ok,[...typed].length)).join(''))}</span>`;
    this.root.querySelector('.ty-train.you')?.style.setProperty('--p',(race.index+ok/Math.max(1,[...item.text].length))/race.texts.length);
  },
  onRaceInput(input){
    const race=this.race;if(!race||race.revealing)return;
    if(!race.start)race.start=performance.now();
    const value=this.typedValue(input),item=race.texts[race.index];
    this.paintRace(value);
    if(!typedMatches(value,item.text,this.language))return;
    race.done+=[...item.text].length;race.revealing=true;input.value='';
    const station=this.root.querySelector(`[data-station="${race.index+1}"]`);
    if(station){station.classList.add('reached');station.querySelector('small').innerHTML=`<b lang="${esc(this.definition.htmlLang)}">${esc(item.text)}</b> ${esc(item.meaning)}`;}
    this.root.querySelector('.ty-train.you')?.style.setProperty('--p',(race.index+1)/race.texts.length);
    const stage=this.root.querySelector('.ty-stage');
    if(stage)stage.innerHTML=this.revealHTML(item,true);
    setTimeout(()=>{
      if(this.race!==race)return;
      race.revealing=false;race.index++;
      if(race.index>=race.texts.length)return this.finishRace();
      if(stage)stage.innerHTML=`<p class="ty-sentence" lang="${esc(this.definition.htmlLang)}" dir="auto"></p>`;
      this.paintRace('');
    },1200);
  },
  async finishRace(){
    const race=this.race;if(!race)return;
    // Las pausas para leer la traducción no cuentan.
    const seconds=Math.max(0.1,(performance.now()-race.start)/1000-1.2*(race.texts.length-1)),record=await this.typingRecord(),best=!record.race||seconds<record.race;
    if(best){record.race=Math.round(seconds*10)/10;await this.saveTypingRecord(record);}
    this.race=null;
    this.renderTypingScore('Metro',`${seconds.toFixed(1)} s${best?' · ¡nuevo récord!':` · tu mejor: ${record.race.toFixed(1)} s`}`,'<button class="primary" data-ty-race>Otra vez</button>');
  },

  // ── Asteroides ──
  startAsteroids(){
    window.__hanstudioApp=this;
    this.shell(`<section class="ty-game" data-typing-lang="${esc(this.language)}"><div class="ty-top"><button class="ty-quit" data-ty-quit aria-label="Salir">${ui('close')}</button><span class="ty-hud">${hudHTML(0,3,0)}</span></div>
      <canvas class="ty-canvas" width="720" height="460" aria-label="Juego de asteroides"></canvas>
      <input class="ty-input" data-ty-shoot autocomplete="off" autocapitalize="off" spellcheck="false" lang="${esc(this.definition.htmlLang)}" dir="auto" placeholder="Escribe la palabra" aria-label="Escribe la palabra de un asteroide"></section>`,'Escribir');
    const canvas=this.root.querySelector('.ty-canvas'),input=this.root.querySelector('[data-ty-shoot]'),ctx=canvas.getContext('2d');
    const game={wave:0,lives:3,score:0,rocks:[],queue:waveWords(this.typingPool,0,Date.now()%997),spawnIn:0.5,sparks:[],over:false,last:performance.now()};
    this.asteroids=game;input.focus();
    const family=this.language==='Korean'?'"Noto Sans KR","Apple SD Gothic Neo"':this.language==='Japanese'?'"Hiragino Sans","Noto Sans JP"':'Inter';
    const big=`600 22px ${family},sans-serif`,small='500 14px Inter,sans-serif';
    const step=now=>{
      if(this.asteroids!==game||!canvas.isConnected)return;
      const dt=Math.min(0.05,(now-game.last)/1000);game.last=now;
      const settings=waveSettings(game.wave);
      game.spawnIn-=dt;
      if(game.spawnIn<=0&&game.queue.length){const item=game.queue.shift();game.rocks.push({...item,x:90+Math.random()*(canvas.width-180),y:-24,speed:(canvas.height-60)/settings.fall,spin:Math.random()*6});game.spawnIn=settings.gap;}
      for(const rock of game.rocks){rock.y+=rock.speed*dt;rock.spin+=dt;}
      const hit=game.rocks.filter(rock=>rock.y>=canvas.height-70);
      if(hit.length){game.lives-=hit.length;game.rocks=game.rocks.filter(rock=>!hit.includes(rock));hit.forEach(rock=>game.sparks.push({x:rock.x,y:rock.y,t:0,miss:true,item:rock}));}
      game.sparks=game.sparks.filter(spark=>(spark.t+=dt)<(spark.miss?1.6:1.1));
      if(!game.queue.length&&!game.rocks.length&&game.lives>0){game.wave++;game.queue=waveWords(this.typingPool,game.wave,game.score);game.spawnIn=1.5;}
      ctx.fillStyle='#10201b';ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle='#ffffff55';for(let i=0;i<40;i++){ctx.fillRect((i*97+now/40)%canvas.width,(i*53)%canvas.height,2,2);}
      const shipX=canvas.width/2,shipY=canvas.height-30;
      ctx.fillStyle='#f2b48f';ctx.beginPath();ctx.moveTo(shipX,shipY-22);ctx.lineTo(shipX-18,shipY+12);ctx.lineTo(shipX+18,shipY+12);ctx.closePath();ctx.fill();
      ctx.textAlign='center';ctx.textBaseline='middle';
      for(const rock of game.rocks){
        // La palabra y su traducción en el mismo asteroide: «noir / negro».
        ctx.font=big;const w1=ctx.measureText(rock.text).width;ctx.font=small;const w2=ctx.measureText(rock.meaning).width;
        const width=Math.max(70,Math.max(w1,w2)+30);
        ctx.save();ctx.translate(rock.x,rock.y);ctx.fillStyle='#5e6e68';ctx.beginPath();for(let i=0;i<9;i++){const angle=i/9*Math.PI*2+rock.spin*0.2,r=(i%2?0.9:1)*width/2;ctx.lineTo(Math.cos(angle)*r,Math.sin(angle)*r*0.72);}ctx.closePath();ctx.fill();
        ctx.fillStyle='#fffdf8';ctx.font=big;ctx.fillText(rock.text,0,-8);ctx.fillStyle='#f2c9ae';ctx.font=small;ctx.fillText(rock.meaning,0,13);ctx.restore();
      }
      // Al destruir (o chocar) queda un momento «palabra · traducción» flotando.
      for(const spark of game.sparks){
        const life=spark.miss?1.6:1.1,alpha=1-spark.t/life;
        if(!spark.miss){ctx.fillStyle=`rgba(242,180,143,${alpha*0.6})`;ctx.beginPath();ctx.arc(spark.x,spark.y,10+spark.t*70,0,Math.PI*2);ctx.fill();}
        ctx.fillStyle=spark.miss?`rgba(255,140,120,${alpha})`:`rgba(255,253,248,${alpha})`;ctx.font=small;ctx.fillText(`${spark.item.text} · ${spark.item.meaning}`,spark.x,spark.y-20-spark.t*30);
      }
      const hud=this.root.querySelector('.ty-hud');if(hud)hud.innerHTML=hudHTML(game.wave,game.lives,game.score);
      if(game.lives<=0)return this.endAsteroids();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },
  onAsteroidInput(input){
    const game=this.asteroids;if(!game)return;
    const rock=game.rocks.find(item=>typedMatches(this.typedValue(input),item.text,this.language));
    if(!rock)return;
    game.rocks=game.rocks.filter(item=>item!==rock);game.sparks.push({x:rock.x,y:rock.y,t:0,item:rock});
    game.score+=10+[...rock.text].length*2;input.value='';
  },
  async endAsteroids(){
    const game=this.asteroids;if(!game||game.over)return;game.over=true;
    const record=await this.typingRecord(),best=game.score>(record.asteroids||0);
    if(best){record.asteroids=game.score;await this.saveTypingRecord(record);}
    this.asteroids=null;
    this.renderTypingScore('Asteroides',`${game.score} puntos · ola ${game.wave+1}${best?' · ¡nuevo récord!':''}`,'<button class="primary" data-ty-asteroids>Otra vez</button>');
  },

  stop(){clearTimeout(this.typingTimer);this.typing=null;this.asteroids=null;this.race=null;return original.stop.call(this);},
  handleClick(event){
    const button=event.target.closest('[data-ty-daily],[data-ty-level],[data-ty-asteroids],[data-ty-race],[data-ty-dictation],[data-ty-replay],[data-ty-menu],[data-ty-quit]');
    if(!button)return original.handleClick.call(this,event);
    if(button.hasAttribute('data-ty-replay')){const item=this.typing?.items?.[this.typing.index];if(item)this.playKeyAudio?.(item.text,'normal',false);this.root.querySelector('[data-ty-input]')?.focus();return;}
    clearTimeout(this.typingTimer);
    if(button.dataset.tyLevel)return this.startTypingLevel(button.dataset.tyLevel);
    if(button.hasAttribute('data-ty-daily'))return this.startDailyTask();
    if(button.hasAttribute('data-ty-asteroids'))return this.startAsteroids();
    if(button.hasAttribute('data-ty-race'))return this.startRace();
    if(button.hasAttribute('data-ty-dictation'))return this.startDictation();
    if(button.hasAttribute('data-ty-quit')&&this.asteroids)return this.endAsteroids();
    this.typing=null;this.asteroids=null;this.race=null;
    return this.renderTyping();
  },
  async renderRoute(){
    // Al irse a otra pestaña a mitad de juego, nada sigue corriendo ni vuelve a dibujarse encima.
    if(!(this.active&&typingRoute(this.definition.slug).test(location.hash))){clearTimeout(this.typingTimer);this.typing=null;this.asteroids=null;this.race=null;return original.renderRoute.call(this);}
    this.root.className='japanese-guided-course guided-course';
    this.root.style.setProperty('--jp-orange',this.definition.accent);
    this.root.innerHTML='<div class="jp-loading compact"><i></i></div>';
    await this.renderTyping();
    window.scrollTo({top:document.querySelector('main')?.offsetTop||0,behavior:'auto'});
  },
});

// Escuchas propias (los campos se crean en cada pantalla).
document.addEventListener('input',event=>{
  const app=window.__hanstudioApp;if(!app)return;
  if(event.target.matches?.('[data-ty-input]'))app.onTypingInput(event.target);
  if(event.target.matches?.('[data-ty-shoot]'))app.onAsteroidInput(event.target);
  if(event.target.matches?.('[data-ty-race-input]'))app.onRaceInput(event.target);
});
document.addEventListener('change',event=>{if(event.target.matches?.('[data-ty-native]'))setNativeTyping(event.target.checked);});
