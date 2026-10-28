// Animaciones para las lecciones de kana de japonés:
//   · un kana solo: su sonido y su gemelo en el otro silabario (あ ⇄ ア);
//   · combinaciones: か + ゛ = が, は + ゜ = ぱ, き + ゃ = きゃ (como los bloques del hangeul);
//   · palabras: cada tiempo (mora) se ilumina por turno; っ es una pausa y ー alarga.
// Reutiliza las piezas y colores de hangul_blocks (hb-*). Lógica pura + HTML.

const esc=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const SMALL=new Set([...'ゃゅょぁぃぅぇぉゎャュョァィゥェォヮ']);
const isKana=char=>/[ぁ-ゖァ-ヺー]/u.test(char);
const isHiragana=char=>/[ぁ-ゖ]/u.test(char);
export const twinOf=char=>isHiragana(char)?String.fromCodePoint(char.codePointAt(0)+0x60):/[ァ-ヶ]/u.test(char)?String.fromCodePoint(char.codePointAt(0)-0x60):'';

// Moras: los kana pequeños (ゃ, ィ…) se pegan al anterior; っ, ー y ん cuentan solos.
export function morae(word){
  const out=[];
  for(const char of [...String(word)].filter(isKana)){
    if(SMALL.has(char)&&out.length)out[out.length-1]+=char;else out.push(char);
  }
  return out;
}

// Una sílaba con marca o con kana pequeño se descompone en piezas.
export function kanaParts(syllable){
  const chars=[...syllable];
  if(chars.length===2&&SMALL.has(chars[1]))return {kind:'small',base:chars[0],extra:chars[1],result:syllable};
  if(chars.length===1){
    const [base,mark]=[...chars[0].normalize('NFD')];
    if(mark==='゙')return {kind:'dakuten',base,extra:'゛',result:syllable};
    if(mark==='゚')return {kind:'handakuten',base,extra:'゜',result:syllable};
  }
  return null;
}

// Qué animar en cada tarjeta.
export function kanaCardPlan({target=''}={}){
  const text=String(target).trim();
  if(!text||/[一-鿿]/u.test(text))return null;
  // «か→が · は→ぱ», «きゃ · っ»: una combinación por parte.
  const pieces=text.split(/\s*[·→]\s*|\s+/u).filter(Boolean),composed=pieces.map(kanaParts).filter(Boolean);
  if(composed.length&&/[·→]/u.test(text))return {kind:'compose',parts:composed.slice(0,2)};
  if(pieces.length>1)return pieces.every(piece=>[...piece].length===1&&isKana(piece))?{kind:'beats',rows:[pieces],label:false}:{kind:'beats',rows:pieces.slice(0,2).map(morae).filter(row=>row.length),label:true};
  // っ y ー se entienden mejor dentro de una palabra.
  if(/^[っッ]$/u.test(text))return {kind:'beats',rows:[morae(text==='っ'?'きって':'ベッド')],label:true};
  if(text==='ー')return {kind:'beats',rows:[morae('コーヒー')],label:true};
  const single=kanaParts(text);
  if(single)return {kind:'compose',parts:[single]};
  if([...text].length===1&&isKana(text)&&text!=='ー')return {kind:'twin',kana:text};
  const list=morae(text);
  return list.length?{kind:'beats',rows:[list],label:true}:null;
}

function composeHTML(parts){
  const BOX=parts.length>1?112:132;
  const blocks=parts.map((part,index)=>{
    // La base ocupa el centro; la marca va arriba a la derecha; el kana pequeño, abajo a la derecha.
    const pieces=[['initial',part.base,[4,8,66,84]],['vowel',part.extra,part.kind==='small'?[58,46,40,50]:[64,0,34,38]]];
    const html=pieces.map(([role,char,[x,y,w,h]],order)=>{
      const size=Math.min(w,h)/100*BOX*(role==='vowel'&&part.kind!=='small'?1.1:0.92),startX=(order-.5)*BOX*0.78+BOX/2,dx=startX-(x+w/2)/100*BOX,dy=BOX*1.12-(y+h/2)/100*BOX;
      return `<span class="hb-piece hb-${role}" lang="ja" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%;font-size:${size.toFixed(1)}px;--dx:${dx.toFixed(1)}px;--dy:${dy.toFixed(1)}px">${esc(char)}</span>`;
    }).join('');
    return `<div class="hb-block" style="--i:${index}"><div class="hb-square">${html}<span class="hb-result jk-result" lang="ja">${esc(part.result)}</span></div></div>`;
  }).join('');
  const kinds=new Set(parts.map(part=>part.kind)),extra=kinds.has('small')?'kana pequeño':kinds.has('handakuten')&&kinds.has('dakuten')?'marcas ゛ y ゜':kinds.has('handakuten')?'marca ゜ (handakuten)':'marca ゛ (dakuten)';
  const label=parts.map(part=>`${part.base} + ${part.extra} = ${part.result}`).join('; ');
  return `<figure class="hb-anim" style="--box:${BOX}px" aria-label="${esc(label)}">${blocks}<figcaption><span class="hb-legend"><span class="hb-key hb-initial">kana base</span><span class="hb-key hb-vowel">${extra}</span></span><button type="button" class="hb-replay" data-hb-replay>Ver otra vez</button></figcaption></figure>`;
}

function twinHTML(kana,sound){
  const twin=twinOf(kana),from=isHiragana(kana)?'hiragana':'katakana',to=isHiragana(kana)?'katakana':'hiragana';
  return `<figure class="hb-anim jk-twin" aria-label="${esc(kana)} en ${from}${twin?`; en ${to}: ${twin}`:''}${sound?`; suena ${sound}`:''}"><div class="jk-card jk-main"><b lang="ja">${esc(kana)}</b><small>${from}</small></div>${sound?`<span class="jk-sound">«${esc(sound)}»</span>`:''}${twin?`<div class="jk-card jk-other"><b lang="ja">${esc(twin)}</b><small>en ${to}</small></div>`:''}<figcaption><button type="button" class="hb-replay" data-hb-replay>Ver otra vez</button></figcaption></figure>`;
}

function beatsHTML(rows,label){
  let order=0;
  const html=rows.map(list=>`<div class="jk-row">${list.map((mora,index)=>{
    const kind=/^[っッ]$/u.test(mora)?'pause':mora==='ー'?'long':'';
    return `<span class="jk-beat ${kind}" style="--b:${order++}"><b lang="ja">${esc(mora)}</b><small>${kind==='pause'?'pausa':kind==='long'?'se alarga':index+1}</small></span>`;
  }).join('')}${label&&rows.length>1?`<em>${list.length} tiempos</em>`:''}</div>`).join('');
  const count=rows[0].length;
  return `<figure class="hb-anim jk-beats" aria-label="${esc(rows.map(list=>`${list.join(' · ')}${label?`: ${list.length} tiempos`:''}`).join('; '))}">${html}<figcaption>${label&&rows.length===1?`<span class="hb-legend">${count} tiempo${count===1?'':'s'}: cada uno dura lo mismo</span>`:label?'<span class="hb-legend">Cada tiempo dura lo mismo: una mora más cambia la palabra</span>':''}<button type="button" class="hb-replay" data-hb-replay>Ver otra vez</button></figcaption></figure>`;
}

export function kanaAnimationHTML(activity){
  const plan=kanaCardPlan(activity);
  if(!plan)return '';
  if(plan.kind==='compose')return composeHTML(plan.parts);
  if(plan.kind==='twin')return twinHTML(plan.kana,String(activity.sound_hint||'').match(/«([^»]+)»/u)?.[1]||'');
  return beatsHTML(plan.rows,plan.label);
}
