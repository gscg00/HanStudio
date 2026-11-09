// Pestaña Escribir: aprender dónde está cada letra del idioma en tu teclado.
//   · Contrarreloj: niveles de 10 (letras → palabras cortas → palabras → frases).
//     Al terminar el nivel se ve qué significa cada una.
//   · Asteroides: las palabras caen y se destruyen escribiéndolas.
// El teclado físico escribe en el idioma gracias a native_typing.js.
import{JapaneseCourseApp}from'./japanese_course_app.js';
import{decomposeHangulText,physicalLayout}from'./guided_virtual_keyboard.js';
import{nativeTypingEnabled,setNativeTyping,POSITIONAL,finishKana}from'./native_typing.js';
import{LEVELS,ITEMS_PER_LEVEL,buildLevel,levelResult,timeFor,typedMatches,typingPool,waveSettings,waveWords}from'./typing_logic.js';

const esc=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const proto=JapaneseCourseApp.prototype,original={renderRoute:proto.renderRoute,handleClick:proto.handleClick,stop:proto.stop};
const typingRoute=slug=>new RegExp(`^#/${slug}/typing(?:/(\\w+))?`);
const recordId=slug=>`typing:${slug}:v1`;
const KEY_ROWS=[['KeyQ','KeyW','KeyE','KeyR','KeyT','KeyY','KeyU','KeyI','KeyO','KeyP','BracketLeft','BracketRight'],['KeyA','KeyS','KeyD','KeyF','KeyG','KeyH','KeyJ','KeyK','KeyL','Semicolon','Quote'],['KeyZ','KeyX','KeyC','KeyV','KeyB','KeyN','KeyM','Comma','Period','Slash']];
const LATIN={BracketLeft:'[',BracketRight:']',Semicolon:';',Quote:"'",Comma:',',Period:'.',Slash:'/'};
const latinOf=code=>LATIN[code]||code.replace('Key','');

Object.assign(proto,{
  async typingSources(){
    const daily=this.loadDaily?await this.loadDaily().catch(()=>null):null;
    const known=(daily?.classes||[]).flatMap(entry=>[...(entry.items||[]),...(entry.words||[])]).map(item=>({...item,known:true}));
    const topics=this.loadVideoTopics?await this.loadVideoTopics().catch(()=>[]):[];
    const basics=topics.filter(topic=>topic.category==='basico').flatMap(topic=>topic.items);
    return typingPool([...known,...basics],this.language);
  },
  async typingRecord(){return(await this.get('metadata',recordId(this.definition.slug)).catch(()=>null))||{id:recordId(this.definition.slug),levels:{},asteroids:0};},

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

  async renderTyping(){
    window.__hanstudioApp=this;
    const [pool,record]=await Promise.all([this.typingSources(),this.typingRecord()]);
    this.typingPool=pool;
    const positional=POSITIONAL.has(this.language),native=nativeTypingEnabled(),name=this.definition.name.toLowerCase();
    const how=positional?`Tu teclado escribe en ${name} por posición, como un teclado nativo: la letra de cada tecla está en el mapa.`:this.language==='Japanese'?'Escribe en rōmaji y se convierte en kana: ka → か, shi → し, tsu → つ, kk → っ, nn → ん. Con Mayús, katakana.':this.language==='Chinese'?'Para escribir caracteres chinos activa el método de entrada pinyin de tu sistema.':'Escribe con tu teclado de siempre; los acentos cuentan.';
    const levels=LEVELS.map((level,index)=>{const best=record.levels[level.id],count=pool.filter(item=>item.level===level.id).length,locked=index>0&&!record.levels[LEVELS[index-1].id]?.passed;return`<button class="ty-card ${locked?'locked':''}" data-ty-level="${level.id}" ${count<4||locked?'disabled':''}><strong>${index+1}. ${esc(level.title)}</strong><small>${esc(locked?'Pasa el nivel anterior (8 de 10)':count<4?'Aún no hay suficiente material':level.note)}</small>${best?`<em>${best.correct}/${best.total}${best.passed?' ✓':''}</em>`:''}</button>`;}).join('');
    this.shell(`<section class="ty-view" data-typing-lang="${esc(this.language)}"><div class="dc-title"><span class="dc-eyebrow">${esc(this.definition.name.toUpperCase())} · ESCRIBIR</span><h1>Escribe con tu teclado</h1><p>${esc(how)}</p></div>
      ${positional?`<label class="ty-toggle"><input type="checkbox" data-ty-native ${native?'checked':''}> Mi teclado escribe en ${esc(name)} (desactívalo si ya tienes el teclado ${esc(name)} instalado)</label>${this.keyboardMap()}`:''}
      <section class="vd-section"><div class="vd-section-head"><h2>Contrarreloj</h2><p>Escribe antes de que se acabe el tiempo. Al final del nivel verás qué significa cada una.</p></div><div class="ty-cards">${levels}</div></section>
      <section class="vd-section"><div class="vd-section-head"><h2>Asteroides</h2><p>Las palabras caen hacia tu nave: escríbelas completas para destruirlas.${record.asteroids?` Tu récord: ${record.asteroids} puntos.`:''}</p></div><button class="primary ty-play" data-ty-asteroids ${pool.length<6?'disabled':''}>Jugar</button></section>
    </section>`,'Escribir');
  },

  // ── Contrarreloj ──
  startTypingLevel(levelId){
    const items=buildLevel(this.typingPool||[],levelId,{seed:Date.now()%997});
    if(!items.length)return this.renderTyping();
    this.typing={levelId,items,index:0,answers:[],started:0};
    this.renderTypingItem();
  },
  renderTypingItem(){
    const state=this.typing,item=state.items[state.index],seconds=timeFor(item.text,this.language,{level:LEVELS.findIndex(level=>level.id===state.levelId)});
    this.shell(`<section class="ty-run" data-typing-lang="${esc(this.language)}"><div class="ty-top"><button class="ty-quit" data-ty-quit aria-label="Salir">✕</button><span>${state.index+1} / ${state.items.length}</span></div>
      <div class="ty-timer"><i style="animation-duration:${seconds}s"></i></div>
      <p class="ty-target" lang="${esc(this.definition.htmlLang)}" dir="auto">${esc(item.text)}</p>
      <input class="ty-input" data-ty-input autocomplete="off" autocapitalize="off" spellcheck="false" lang="${esc(this.definition.htmlLang)}" dir="auto" aria-label="Escribe: ${esc(item.text)}">
      <div class="ty-map">${this.keyboardMap(this.nextLetter(item.text,''))}</div></section>`,'Escribir');
    const input=this.root.querySelector('[data-ty-input]');
    input?.focus();
    clearTimeout(this.typingTimer);
    this.typingTimer=setTimeout(()=>this.finishTypingItem(false),seconds*1000);
  },
  onTypingInput(input){
    const state=this.typing;if(!state)return;
    const item=state.items[state.index],value=this.language==='Japanese'?finishKana(input.value):input.value;
    const map=this.root.querySelector('.ty-map');if(map)map.innerHTML=this.keyboardMap(this.nextLetter(item.text,input.value));
    if(typedMatches(value,item.text,this.language))this.finishTypingItem(true);
  },
  finishTypingItem(ok){
    const state=this.typing;if(!state)return;
    clearTimeout(this.typingTimer);
    state.answers.push({...state.items[state.index],ok});
    const target=this.root.querySelector('.ty-target');
    target?.classList.add(ok?'ok':'miss');
    setTimeout(()=>{if(this.typing!==state)return;state.index++;state.index<state.items.length?this.renderTypingItem():this.renderTypingResult();},ok?250:900);
  },
  async renderTypingResult(){
    const state=this.typing,result=levelResult(state.answers),record=await this.typingRecord(),best=record.levels[state.levelId];
    if(!best||result.correct>best.correct||result.passed&&!best.passed)record.levels[state.levelId]={...result,date:new Date().toISOString()};
    await this.put('metadata',{...record,updatedAt:new Date().toISOString()}).catch(()=>{});
    const index=LEVELS.findIndex(level=>level.id===state.levelId),next=LEVELS[index+1];
    this.shell(`<section class="ty-view"><div class="dc-title"><span class="dc-eyebrow">${esc(LEVELS[index].title.toUpperCase())}</span><h1>${result.correct} de ${result.total}</h1><p>${result.passed?'¡Nivel superado!':'Necesitas 8 de 10 para pasar. Inténtalo otra vez.'}</p></div>
      <ul class="vd-items ty-results">${state.answers.map(answer=>`<li class="${answer.ok?'ok':'miss'}"><b lang="${esc(this.definition.htmlLang)}" dir="auto">${esc(answer.text)}</b><span>${esc(answer.meaning)}</span><small>${answer.ok?'✓ a tiempo':'✗ no dio tiempo'}</small></li>`).join('')}</ul>
      <div class="ty-actions"><button class="primary" data-ty-level="${state.levelId}">Repetir</button>${result.passed&&next?`<button data-ty-level="${next.id}">Siguiente: ${esc(next.title)}</button>`:''}<button data-ty-menu>Volver</button></div></section>`,'Escribir');
    this.typing=null;
  },

  // ── Asteroides ──
  startAsteroids(){
    this.shell(`<section class="ty-game" data-typing-lang="${esc(this.language)}"><div class="ty-top"><button class="ty-quit" data-ty-quit aria-label="Salir">✕</button><span class="ty-hud">Ola 1 · ♥♥♥ · 0</span></div>
      <canvas class="ty-canvas" width="720" height="460" aria-label="Juego de asteroides"></canvas>
      <input class="ty-input" data-ty-shoot autocomplete="off" autocapitalize="off" spellcheck="false" lang="${esc(this.definition.htmlLang)}" dir="auto" placeholder="Escribe una palabra" aria-label="Escribe la palabra de un asteroide"></section>`,'Escribir');
    const canvas=this.root.querySelector('.ty-canvas'),input=this.root.querySelector('[data-ty-shoot]'),ctx=canvas.getContext('2d');
    const game={wave:0,lives:3,score:0,rocks:[],queue:waveWords(this.typingPool,0,Date.now()%997),spawnIn:0.5,sparks:[],seen:[],over:false,last:performance.now()};
    this.asteroids=game;input.focus();
    const font=`600 22px ${this.language==='Korean'?'"Noto Sans KR","Apple SD Gothic Neo"':this.language==='Japanese'?'"Hiragino Sans","Noto Sans JP"':'Inter'},sans-serif`;
    const step=now=>{
      if(this.asteroids!==game||!canvas.isConnected)return;
      const dt=Math.min(0.05,(now-game.last)/1000);game.last=now;
      const settings=waveSettings(game.wave);
      game.spawnIn-=dt;
      if(game.spawnIn<=0&&game.queue.length){const item=game.queue.shift();game.rocks.push({...item,x:70+Math.random()*(canvas.width-140),y:-20,speed:(canvas.height-60)/settings.fall,spin:Math.random()*6});game.spawnIn=settings.gap;}
      for(const rock of game.rocks){rock.y+=rock.speed*dt;rock.spin+=dt;}
      const hit=game.rocks.filter(rock=>rock.y>=canvas.height-70);
      if(hit.length){game.lives-=hit.length;hit.forEach(rock=>game.seen.push({...rock,ok:false}));game.rocks=game.rocks.filter(rock=>!hit.includes(rock));}
      game.sparks=game.sparks.filter(spark=>(spark.t+=dt)<0.6);
      if(!game.queue.length&&!game.rocks.length&&game.lives>0){game.wave++;game.queue=waveWords(this.typingPool,game.wave,game.score);game.spawnIn=1.5;}
      // Dibujo: cielo, estrellas, nave, asteroides con su palabra.
      ctx.fillStyle='#10201b';ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle='#ffffff55';for(let i=0;i<40;i++){ctx.fillRect((i*97+now/40)%canvas.width,(i*53)%canvas.height,2,2);}
      const shipX=canvas.width/2,shipY=canvas.height-30;
      ctx.fillStyle='#f2b48f';ctx.beginPath();ctx.moveTo(shipX,shipY-22);ctx.lineTo(shipX-18,shipY+12);ctx.lineTo(shipX+18,shipY+12);ctx.closePath();ctx.fill();
      ctx.font=font;ctx.textAlign='center';ctx.textBaseline='middle';
      for(const rock of game.rocks){
        const width=Math.max(60,ctx.measureText(rock.text).width+28);
        ctx.save();ctx.translate(rock.x,rock.y);ctx.fillStyle='#5e6e68';ctx.beginPath();for(let i=0;i<9;i++){const angle=i/9*Math.PI*2+rock.spin*0.2,r=(i%2?0.9:1)*width/2;ctx.lineTo(Math.cos(angle)*r,Math.sin(angle)*r*0.62);}ctx.closePath();ctx.fill();
        ctx.fillStyle='#fffdf8';ctx.fillText(rock.text,0,0);ctx.restore();
      }
      for(const spark of game.sparks){ctx.fillStyle=`rgba(242,180,143,${1-spark.t/0.6})`;ctx.beginPath();ctx.arc(spark.x,spark.y,10+spark.t*90,0,Math.PI*2);ctx.fill();}
      const hud=this.root.querySelector('.ty-hud');if(hud)hud.textContent=`Ola ${game.wave+1} · ${'♥'.repeat(Math.max(0,game.lives))} · ${game.score}`;
      if(game.lives<=0)return this.endAsteroids();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },
  onAsteroidInput(input){
    const game=this.asteroids;if(!game)return;
    const value=this.language==='Japanese'?finishKana(input.value):input.value;
    const rock=game.rocks.find(item=>typedMatches(value,item.text,this.language));
    if(!rock)return;
    game.rocks=game.rocks.filter(item=>item!==rock);game.sparks.push({x:rock.x,y:rock.y,t:0});game.seen.push({...rock,ok:true});
    game.score+=10+[...rock.text].length*2;input.value='';
  },
  async endAsteroids(){
    const game=this.asteroids;if(!game||game.over)return;game.over=true;
    const record=await this.typingRecord();
    if(game.score>(record.asteroids||0))await this.put('metadata',{...record,asteroids:game.score,updatedAt:new Date().toISOString()}).catch(()=>{});
    const seen=[...new Map(game.seen.map(item=>[item.text,item])).values()];
    this.shell(`<section class="ty-view"><div class="dc-title"><span class="dc-eyebrow">ASTEROIDES</span><h1>${game.score} puntos</h1><p>Llegaste a la ola ${game.wave+1}.${game.score>(record.asteroids||0)?' ¡Nuevo récord!':''}</p></div>
      <ul class="vd-items ty-results">${seen.map(item=>`<li class="${item.ok?'ok':'miss'}"><b lang="${esc(this.definition.htmlLang)}" dir="auto">${esc(item.text)}</b><span>${esc(item.meaning)}</span><small>${item.ok?'✓ destruida':'✗ chocó'}</small></li>`).join('')}</ul>
      <div class="ty-actions"><button class="primary" data-ty-asteroids>Otra vez</button><button data-ty-menu>Volver</button></div></section>`,'Escribir');
    this.asteroids=null;
  },

  stop(){clearTimeout(this.typingTimer);this.typing=null;this.asteroids=null;return original.stop.call(this);},
  handleClick(event){
    const button=event.target.closest('[data-ty-level],[data-ty-asteroids],[data-ty-menu],[data-ty-quit]');
    if(!button)return original.handleClick.call(this,event);
    clearTimeout(this.typingTimer);
    if(button.dataset.tyLevel)return this.startTypingLevel(button.dataset.tyLevel);
    if(button.hasAttribute('data-ty-asteroids'))return this.startAsteroids();
    if(button.hasAttribute('data-ty-quit')&&this.asteroids)return this.endAsteroids();
    this.typing=null;this.asteroids=null;
    return this.renderTyping();
  },
  async renderRoute(){
    if(!(this.active&&typingRoute(this.definition.slug).test(location.hash)))return original.renderRoute.call(this);
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
});
document.addEventListener('change',event=>{if(event.target.matches?.('[data-ty-native]'))setNativeTyping(event.target.checked);});
