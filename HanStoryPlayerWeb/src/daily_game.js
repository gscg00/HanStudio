// Minijuego de imágenes para después de la clase: une imagen, sonido y palabra
// en el idioma. Nunca muestra la traducción salvo cuando el alumno se equivoca.
import{JapaneseCourseApp}from'./japanese_course_app.js';
import{silhouetteFor,hasIllustration}from'./data/illustrations.js';
import{taughtItems,markExtraStudy}from'./daily_class.js';
import{GAME_SECONDS,answer,createGame,finished,itemOf,markSeen,mastered,nextCard,progress}from'./daily_game_logic.js';

const esc=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const PALETTES=[['#f29b54','#d9533f'],['#3fb3a2','#1f6f78'],['#8a63d2','#4b3c9e'],['#e86a92','#a53b6b'],['#4f9be0','#2f5fa8'],['#7cbf5a','#3f8a52']];
const proto=JapaneseCourseApp.prototype,original={handleClick:proto.handleClick,shell:proto.shell};
const img=(meaning,cls='')=>`<img class="${cls}" alt="" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(silhouetteFor(meaning))}">`;

Object.assign(proto,{
  // Palabras con imagen de todo lo que ya has visto (clases y lecciones superadas).
  gameItems(){
    const done=new Set(this.progress.completedLessons||[]),map=new Map();
    for(const entry of this.daily?.classes||[])for(const item of entry.items)map.set(item.target,item);
    for(const unit of this.orderedUnits())for(const lesson of unit.lessons)if(done.has(lesson.id))for(const item of taughtItems(lesson))map.set(item.target,item);
    return [...map.values()].filter(item=>hasIllustration(item.meaning));
  },

  startGame(){
    const items=this.gameItems();
    if(items.length<4)return this.showToast('El minijuego necesita al menos 4 palabras con imagen. Aparecerán al avanzar en las clases.');
    // Primero lo de hoy, luego lo anterior: el juego cubre todo lo que tiene imagen.
    const today=new Set((this.daily?.classes?.at(-1)?.items||[]).map(item=>item.target));
    const ordered=[...items.filter(item=>today.has(item.target)),...items.filter(item=>!today.has(item.target))];
    this.game=createGame(ordered,{seed:`${Date.now()}`});
    this.game.endsAt=Date.now()+GAME_SECONDS*1000;
    clearInterval(this.gameTimer);
    this.gameTimer=setInterval(()=>this.updateGameClock(),250);
    this.nextGameCard();
  },
  stopGame(){clearInterval(this.gameTimer);this.gameTimer=null;this.game=null;},

  updateGameClock(){
    if(!this.game||!this.root.querySelector('.dg-game'))return this.stopGame();
    const left=Math.max(0,this.game.endsAt-Date.now()),ring=this.root.querySelector('.dg-clock circle.on'),label=this.root.querySelector('.dg-clock b');
    if(ring)ring.style.strokeDashoffset=String(113*(1-left/(GAME_SECONDS*1000)));
    if(label)label.textContent=`${Math.floor(left/60000)}:${String(Math.floor(left/1000)%60).padStart(2,'0')}`;
  },

  nextGameCard(){
    const game=this.game;if(!game)return;
    if(Date.now()>=game.endsAt||finished(game))return this.renderGameEnd();
    game.card=nextCard(game);game.feedback=null;game.pairPick=null;game.paired=[];
    if(!game.card)return this.renderGameEnd();
    this.renderGameCard();
  },

  renderGameCard(){
    const game=this.game,card=game.card,[c1,c2]=PALETTES[game.step%PALETTES.length],lang=esc(this.definition.htmlLang),fb=game.feedback;
    const item=card.target?itemOf(game,card.target):null;
    const option=(target,kind)=>{const it=itemOf(game,target),state=fb?(target===card.target?'is-right':target===fb.picked?'is-wrong':'is-dim'):'';return kind==='image'?`<button class="dg-option dg-image ${state}" data-dg-action="pick" data-dg-target="${esc(target)}" aria-label="Opción">${img(it.meaning)}</button>`:`<button class="dg-option dg-word ${state}" data-dg-action="pick" data-dg-target="${esc(target)}" lang="${lang}" dir="auto">${esc(target)}</button>`;};
    let body='';
    if(card.type==='intro'){
      body=`<button class="dg-intro" data-dg-action="next" aria-label="Continuar">${img(item.meaning,'dg-hero')}<strong lang="${lang}" dir="auto">${esc(item.target)}</strong><span class="dg-hint">Escucha y fíjate. Toca para seguir</span></button>`;
    }else if(card.type==='pick-image'||card.type==='listen'){
      const center=card.type==='listen'?`<button class="dg-ear" data-dg-action="audio" aria-label="Escuchar otra vez">♪</button>`:`<button class="dg-center" data-dg-action="audio" lang="${lang}" dir="auto">${esc(item.target)}<small>▶</small></button>`;
      body=`<div class="dg-corners">${card.options.slice(0,2).map(target=>option(target,'image')).join('')}${center}${card.options.slice(2).map(target=>option(target,'image')).join('')}</div>`;
    }else if(card.type==='pick-word'){
      body=`<div class="dg-picture"><button class="dg-hero-btn" data-dg-action="audio-off" aria-label="Imagen">${img(item.meaning,'dg-hero')}</button><div class="dg-words">${card.options.map(target=>option(target,'word')).join('')}</div></div>`;
    }else if(card.type==='pairs'){
      const done=new Set(game.paired),pick=game.pairPick;
      body=`<p class="dg-pairs-help">Une cada imagen con su palabra</p><div class="dg-pairs"><div>${card.targets.map(target=>`<button class="dg-option dg-image ${done.has(target)?'is-done':''} ${pick===target?'is-picked':''} ${fb?.wrongImage===target?'is-wrong':''}" data-dg-action="pair-image" data-dg-target="${esc(target)}" ${done.has(target)?'disabled':''}>${img(itemOf(game,target).meaning)}</button>`).join('')}</div><div>${card.words.map(target=>`<button class="dg-option dg-word ${done.has(target)?'is-done':''} ${fb?.wrongWord===target?'is-wrong':''}" data-dg-action="pair-word" data-dg-target="${esc(target)}" lang="${lang}" dir="auto" ${done.has(target)?'disabled':''}>${esc(target)}</button>`).join('')}</div></div>`;
    }
    // La traducción solo aparece al equivocarse.
    const reveal=fb&&!fb.ok?`<button class="dg-reveal" data-dg-action="next"><span lang="${lang}" dir="auto">${esc(fb.item.target)}</span><b>${esc(fb.item.meaning)}</b>${fb.otherItem?`<em><span lang="${lang}" dir="auto">${esc(fb.otherItem.target)}</span> = ${esc(fb.otherItem.meaning)}</em>`:''}<small>Toca para seguir</small></button>`:'';
    const done=mastered(game).length,total=game.pool.length;
    this.shell(`<section class="dg-game dg-is-${card.type}" style="--g1:${c1};--g2:${c2}">
      <div class="dg-top"><button data-dg-action="quit" aria-label="Salir del minijuego">✕</button><span>Lo que ya conoces</span><div class="dg-clock"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18"/><circle class="on" cx="20" cy="20" r="18"/></svg><b></b></div></div>
      <div class="dg-stage" data-step="${game.step}">${body}</div>${reveal}
      <div class="dg-bottom"><span>${done} de ${total} dominadas</span><div class="dg-bar"><i style="width:${progress(game)}%"></i></div><span>${progress(game)}%</span></div>
    </section>`,'Hoy');
    this.updateGameClock();
    if(!fb&&card.type==='intro')markSeen(game,card.target);
    if(!fb&&item&&card.type!=='pick-word')this.playKeyAudio(item.audio,'normal',false);
  },

  gamePick(target){
    const game=this.game,card=game?.card;if(!card||game.feedback)return;
    const ok=target===card.target,item=itemOf(game,card.target);
    answer(game,card.target,ok);this.soundEffect?.(ok);
    game.feedback={ok,picked:target,item,otherItem:ok||card.type==='pick-word'?null:itemOf(game,target)};
    if(!ok&&card.type==='pick-word')game.feedback.otherItem=itemOf(game,target);
    this.renderGameCard();
    // Al acertar no se repite el audio: ya sonó al aparecer la tarjeta.
    if(ok){setTimeout(()=>{if(this.game===game&&game.feedback?.ok)this.nextGameCard();},900);}
  },

  gamePair(kind,target){
    const game=this.game,card=game?.card;if(!card)return;
    if(game.feedback&&!game.feedback.ok){game.feedback=null;}
    if(kind==='image'){game.pairPick=target;this.playKeyAudio(itemOf(game,target).audio,'normal',false);return this.renderGameCard();}
    if(!game.pairPick)return this.showToast('Primero toca una imagen.');
    const ok=target===game.pairPick,item=itemOf(game,game.pairPick);
    answer(game,game.pairPick,ok);this.soundEffect?.(ok);
    if(ok){game.paired.push(target);game.pairPick=null;}
    else game.feedback={ok:false,item,otherItem:itemOf(game,target),wrongImage:game.pairPick,wrongWord:target};
    if(game.paired.length===card.targets.length){this.renderGameCard();return setTimeout(()=>{if(this.game===game)this.nextGameCard();},700);}
    this.renderGameCard();
  },

  renderGameEnd(){
    const game=this.game;clearInterval(this.gameTimer);this.gameTimer=null;
    if(!game)return this.renderToday();
    const won=mastered(game),all=finished(game);
    if(this.daily){this.daily=markExtraStudy(this.daily);this.saveDaily();}
    this.shell(`<section class="dg-game dg-is-end" style="--g1:#8a63d2;--g2:#4b3c9e"><div class="dg-end-card"><span>${all?'¡LAS DOMINASTE TODAS!':'¡TIEMPO!'}</span><h1>${won.length} palabra${won.length===1?'':'s'} dominada${won.length===1?'':'s'}</h1><p>${game.correct} aciertos · ${game.mistakes} errores. Las que fallaste vuelven en tu próximo repaso.</p><div class="dg-end-grid">${won.slice(0,24).map(target=>`<figure>${img(itemOf(game,target).meaning)}<figcaption lang="${esc(this.definition.htmlLang)}" dir="auto">${esc(target)}</figcaption></figure>`).join('')}</div><button class="primary" data-dg-action="start">Otra ronda</button><button class="dg-link" data-dg-action="quit">Volver a Hoy</button></div></section>`,'Hoy');
  },

  handleClick(event){
    const action=event.target.closest('[data-dg-action]');
    if(!action)return original.handleClick.call(this,event);
    const name=action.dataset.dgAction,target=action.dataset.dgTarget;
    if(name==='start')return this.startGame();
    if(name==='quit'){this.stopGame();this.stopPlayback?.();return this.renderToday();}
    if(name==='next')return this.nextGameCard();
    if(name==='pick')return this.gamePick(target);
    if(name==='pair-image')return this.gamePair('image',target);
    if(name==='pair-word')return this.gamePair('word',target);
    if(name==='audio'){const item=this.game?.card?.target&&itemOf(this.game,this.game.card.target);if(item)this.playKeyAudio(item.audio,'normal',false);}
  },
  shell(content,section){
    if(this.gameTimer&&!content.includes('dg-game'))this.stopGame();
    return original.shell.call(this,content,section);
  },
});
