// Animación de cómo se arma un bloque de hangeul: las letras llegan separadas,
// cada una con el color de su papel (inicial, vocal, final), se colocan en su
// sitio dentro del cuadrado y se funden en la sílaba real. Lógica pura + HTML.

const INITIALS=[...'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'];
const VOWELS=[...'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'];
const FINALS=['',...'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'];
const VERTICAL=new Set([...'ㅏㅐㅑㅒㅓㅔㅕㅖㅣ']),HORIZONTAL=new Set([...'ㅗㅛㅜㅠㅡ']);

const esc=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
export const isSyllable=char=>{const code=char.codePointAt(0);return code>=0xac00&&code<=0xd7a3;};

export function decompose(syllable){
  if(!isSyllable(syllable))return null;
  const index=syllable.codePointAt(0)-0xac00,vowel=VOWELS[Math.floor(index%588/28)];
  return {syllable,initial:INITIALS[Math.floor(index/588)],vowel,final:FINALS[index%28],shape:VERTICAL.has(vowel)?'vertical':HORIZONTAL.has(vowel)?'horizontal':'mixed'};
}

// Rectángulos (en % del cuadrado) de cada letra según la forma de la vocal.
export function blockLayout({shape,final}){
  const low=final?58:100;
  if(shape==='vertical')return {initial:[0,0,52,low],vowel:[52,0,48,low],...(final?{final:[8,58,84,42]}:{})};
  if(shape==='horizontal')return {initial:[14,0,72,final?36:54],vowel:[0,final?34:52,100,final?28:48],...(final?{final:[14,62,72,38]}:{})};
  return {initial:[0,0,56,final?34:50],vowel:[0,final?30:44,100,final?34:56],...(final?{final:[14,64,72,36]}:{})};
}

// Qué sílabas animar para una tarjeta de las lecciones de letras.
export function syllablesForCard({target='',audio=''}={}){
  const text=String(target).trim();
  if(/^inicial\s*\+/.test(text))return ['한'];
  const formula=text.match(/=\s*(\S+)\s*$/u);
  if(formula)return [...formula[1]].filter(isSyllable).slice(0,3);
  const own=[...text].filter(isSyllable);
  if(own.length)return [...new Set(own)].slice(0,3);
  // Una letra suelta (ㄱ, ㅏ): se muestra dentro de su sílaba de ejemplo (가, 아).
  return [...String(audio)].filter(isSyllable).slice(0,1);
}

export function blockAnimationHTML(syllables,{highlight=''}={}){
  const parts=syllables.map(decompose).filter(Boolean);
  if(!parts.length)return '';
  // Con 2 o 3 sílabas el cuadrado se achica para que quepan en un móvil.
  const BOX=parts.length>=3?92:parts.length===2?112:132;
  const blocks=parts.map((part,index)=>{
    const layout=blockLayout(part),roles=['initial','vowel','final'].filter(role=>part[role]),gap=BOX*0.72;
    const pieces=roles.map((role,order)=>{
      const [x,y,w,h]=layout[role],size=Math.min(w,h)/100*BOX*0.92;
      // Punto de partida: las letras en fila, separadas, a la altura del cuadrado.
      const startX=(order-(roles.length-1)/2)*gap+BOX/2,dx=startX-(x+w/2)/100*BOX,dy=BOX*0.62+BOX/2-(y+h/2)/100*BOX;
      return `<span class="hb-piece hb-${role}${part[role]===highlight?' hb-focus':''}" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%;font-size:${size.toFixed(1)}px;--dx:${dx.toFixed(1)}px;--dy:${dy.toFixed(1)}px">${esc(part[role])}</span>`;
    }).join('');
    return `<div class="hb-block" style="--i:${index}"><div class="hb-square">${pieces}<span class="hb-result" lang="ko">${esc(part.syllable)}</span></div></div>`;
  }).join('');
  const roles=new Set(parts.flatMap(part=>['initial','vowel','final'].filter(role=>part[role])));
  const legend=[['initial','inicial'],['vowel','vocal'],['final','final (batchim)']].filter(([role])=>roles.has(role)).map(([role,label])=>`<span class="hb-key hb-${role}">${label}</span>`).join('');
  return `<figure class="hb-anim" style="--box:${BOX}px" aria-label="Cómo se arma ${esc(syllables.join(''))}: ${esc(parts.map(part=>[part.initial,part.vowel,part.final].filter(Boolean).join(' + ')+' = '+part.syllable).join('; '))}">${blocks}<figcaption><span class="hb-legend">${legend}</span><button type="button" class="hb-replay" data-hb-replay>Ver otra vez</button></figcaption></figure>`;
}

// «Ver otra vez»: se reemplaza la figura por una copia para reiniciar las animaciones.
if(typeof document!=='undefined')document.addEventListener('click',event=>{
  const button=event.target.closest('[data-hb-replay]');
  if(!button)return;
  const figure=button.closest('.hb-anim');
  figure?.replaceWith(figure.cloneNode(true));
});
