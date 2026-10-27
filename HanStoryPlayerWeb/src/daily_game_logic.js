// Minijuego de imágenes (después de la clase): lógica pura.
// Cada palabra se presenta una vez (imagen + palabra + audio, sin traducción) y
// después se practica de formas cada vez más difíciles. La traducción solo se
// enseña cuando el alumno se equivoca, y esa palabra vuelve antes.

export const GAME_SECONDS=180;
export const GAME_ACTIVE=4;        // palabras «en juego» a la vez
export const GAME_MASTERY=3;       // aciertos para dominar una palabra
export const PAIRS_EVERY=6;        // cada cuántas tarjetas hay una ronda de parejas

// Orden de dificultad: ver la palabra y elegir imagen → ver la imagen y elegir
// la palabra → solo oír y elegir la imagen.
export const STAGES=['pick-image','pick-word','listen'];

function hash(text){let h=2166136261;for(const ch of String(text)){h^=ch.codePointAt(0);h=Math.imul(h,16777619);}return h>>>0;}
export function shuffle(list,seed){let s=hash(seed)||1;const rand=()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%100000)/100000;},copy=[...list];for(let i=copy.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}

export function createGame(items,{seed='game'}={}){
  const seen=new Set(),pool=items.filter(item=>item?.target&&item?.meaning&&!seen.has(item.target)&&seen.add(item.target));
  return {seed,pool,queue:shuffle(pool.map(item=>item.target),seed),active:[],stats:{},step:0,last:'',mistakes:0,correct:0,since:0};
}

const stat=(game,target)=>game.stats[target]||(game.stats[target]={seen:0,correct:0,wrong:0});
export const itemOf=(game,target)=>game.pool.find(item=>item.target===target);
export const mastered=game=>Object.entries(game.stats).filter(([,s])=>s.correct>=GAME_MASTERY).map(([target])=>target);
export const progress=game=>game.pool.length?Math.round(mastered(game).length/game.pool.length*100):0;
export const finished=game=>game.pool.length>0&&mastered(game).length===game.pool.length;

function refill(game){
  game.active=game.active.filter(target=>stat(game,target).correct<GAME_MASTERY);
  while(game.active.length<GAME_ACTIVE&&game.queue.length)game.active.push(game.queue.shift());
}

// Distractores: otras palabras del juego, primero las ya vistas.
function distractors(game,target,count){
  const others=game.pool.map(item=>item.target).filter(other=>other!==target);
  const known=others.filter(other=>stat(game,other).seen),rest=others.filter(other=>!stat(game,other).seen);
  return [...shuffle(known,`${game.seed}${game.step}k`),...shuffle(rest,`${game.seed}${game.step}r`)].slice(0,count);
}

// Siguiente tarjeta. Tipos: intro, pick-image, pick-word, listen, pairs.
export function nextCard(game){
  refill(game);
  if(!game.active.length)return null;
  game.step++;
  const seenActive=game.pool.filter(item=>stat(game,item.target).seen&&stat(game,item.target).correct<GAME_MASTERY);
  if(game.since>=PAIRS_EVERY&&seenActive.length>=3){
    game.since=0;
    const targets=shuffle(seenActive.map(item=>item.target),`${game.seed}${game.step}p`).slice(0,4);
    return {type:'pairs',targets,words:shuffle(targets,`${game.seed}${game.step}w`)};
  }
  game.since++;
  const candidates=game.active.filter(target=>target!==game.last);
  // Prioridad: lo presentado y aún sin acertar, luego presentar algo nuevo,
  // luego lo que lleva menos aciertos. Así cada palabra se practica justo
  // después de conocerla.
  const rank=target=>{const s=stat(game,target);return !s.seen?1:s.correct===0?0:1+s.correct;};
  const target=[...(candidates.length?candidates:game.active)].sort((a,b)=>rank(a)-rank(b)||stat(game,a).seen-stat(game,b).seen)[0];
  game.last=target;
  const s=stat(game,target);
  if(!s.seen)return {type:'intro',target};
  const type=STAGES[Math.min(STAGES.length-1,s.correct)];
  const options=shuffle([target,...distractors(game,target,3)],`${game.seed}${game.step}o`);
  return {type,target,options};
}

export function markSeen(game,target){stat(game,target).seen++;}

// Resultado de una respuesta. Un error resta progreso y la palabra vuelve pronto.
export function answer(game,target,ok){
  const s=stat(game,target);
  s.seen++;
  if(ok){s.correct++;game.correct++;}
  else{s.wrong++;s.correct=Math.max(0,s.correct-1);game.mistakes++;}
  return s;
}
