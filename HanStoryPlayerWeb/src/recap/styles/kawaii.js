// Estilo «Anime kawaii»: ilustración chibi plana en pasteles, contorno ciruela
// de grosor uniforme, UNA sombra cel y un brillo; todo aparece «a dos» (15 fps)
// con rebote y squash, destellos que parpadean y escenas que cambian con iris de
// estrella o corazón. Técnicas del paquete: cel/ol/shine, pop/squash/bob, kText/kWord,
// fondo de lunares·estrellas·corazones, twinkles, confetti, impactLines, wipe.
import {beatTimes,fitFont,wrapLines} from './shared.js';

const H=window.H,TAU=Math.PI*2;
const C={plum:'#5a3659',dark:'#3b2342',pink:'#ffbfd2',pinkS:'#f597b7',pinkD:'#ff6f9c',mint:'#bff0dc',mintS:'#86d6b9',mintD:'#3fb98e',
  butter:'#fff0a6',butterS:'#f5d06a',butterD:'#ffd84d',lav:'#ded2ff',lavS:'#b7a2f2',lavD:'#8f74e6',sky:'#c6e7ff',skyS:'#8cc6f2',skyD:'#5aa9ea',
  cream:'#fffaf4',creamS:'#e4d8f6',red:'#ff6b8a',white:'#ffffff'};
const TH={pink:{base:'#ffe7ef',dot:'#ffd3e1',acc:'#fff3b0',kind:'dots'},mint:{base:'#ddf6ec',dot:'#c4ecdb',acc:'#fff1a0',kind:'stars'},
  lav:{base:'#efe8ff',dot:'#e0d4ff',acc:'#ffd0e0',kind:'clouds'},butter:{base:'#fff6d8',dot:'#ffeab0',acc:'#ffc4d6',kind:'hearts'}};
const HANGUL='"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif';
const FONT=`"Fredoka",${HANGUL}`;
const WD=0.6; // duración del iris entre escenas
const q15=t=>Math.floor(t*15+1e-6)/15; // anime «a dos» a 30 fps

// ---------- trazados ----------
const scaleOf=ctx=>{const m=ctx.getTransform();return Math.hypot(m.a,m.b)||1;};
const rrP=(x,y,w,h,r)=>{const p=new Path2D();p.roundRect(x,y,w,h,r);return p;};
const ellP=(x,y,rx,ry,rot=0)=>{const p=new Path2D();p.ellipse(x,y,rx,ry,rot,0,TAU);return p;};
function roundPoly(pts,rad){const p=new Path2D(),n=pts.length,mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2],s=mid(pts[n-1],pts[0]);p.moveTo(s[0],s[1]);for(let i=0;i<n;i++){const c=pts[i],m=mid(c,pts[(i+1)%n]);p.arcTo(c[0],c[1],m[0],m[1],rad);}p.closePath();return p;}
const starPts=(cx,cy,R,r,n=5,rot=-Math.PI/2)=>{const out=[];for(let i=0;i<n*2;i++){const a=rot+i*Math.PI/n,rr=i%2?r:R;out.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr]);}return out;};
const starP=(cx,cy,R,rot=-Math.PI/2,ratio=0.5,n=5)=>roundPoly(starPts(cx,cy,R,R*ratio,n,rot),R*0.12);
function heartP(cx,cy,s,rot=0){const p=new Path2D(),m=new DOMMatrix().translate(cx,cy).rotate(rot*180/Math.PI).scale(s,s),q=new Path2D();q.moveTo(0,0.9);q.bezierCurveTo(-0.15,0.75,-1,0.3,-1,-0.25);q.bezierCurveTo(-1,-0.78,-0.35,-0.98,0,-0.5);q.bezierCurveTo(0.35,-0.98,1,-0.78,1,-0.25);q.bezierCurveTo(1,0.3,0.15,0.75,0,0.9);q.closePath();p.addPath(q,m);return p;}
function spark4P(cx,cy,R,rot=0){const p=new Path2D(),k=R*0.16,pts=[[0,-R],[R,0],[0,R],[-R,0]],cs=[[k,-k],[k,k],[-k,k],[-k,-k]],tr=([x,y])=>[cx+x*Math.cos(rot)-y*Math.sin(rot),cy+x*Math.sin(rot)+y*Math.cos(rot)],s0=tr(pts[0]);p.moveTo(s0[0],s0[1]);for(let i=0;i<4;i++){const c=tr(cs[i]),e=tr(pts[(i+1)%4]);p.quadraticCurveTo(c[0],c[1],e[0],e[1]);}p.closePath();return p;}
function cloudP(cx,cy,s){const p=new Path2D();[[-70,10,42],[-30,-18,52],[22,-26,58],[70,4,44],[30,22,46],[-22,24,44]].forEach(([x,y,r])=>{p.moveTo(cx+(x+r)*s,cy+y*s);p.arc(cx+x*s,cy+y*s,r*s,0,TAU);});return p;}

// ---------- entintado: relleno plano + UNA sombra cel (luz arriba-izquierda) + contorno ciruela ----------
function ol(ctx,p,w=4.5,col=C.plum){ctx.save();ctx.lineWidth=w/scaleOf(ctx);ctx.strokeStyle=col;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke(p);ctx.restore();}
function cel(ctx,p,base,shade,dx=-8,dy=-8,w=4.5){ctx.save();ctx.fillStyle=shade;ctx.fill(p);ctx.clip(p);ctx.translate(dx,dy);ctx.fillStyle=base;ctx.fill(p);ctx.restore();if(w)ol(ctx,p,w);}
function shine(ctx,x,y,rx,ry,rot=-0.6,a=0.95){ctx.save();ctx.fillStyle=`rgba(255,255,255,${a})`;ctx.fill(ellP(x,y,rx,ry,rot));ctx.restore();}

// ---------- gramática de movimiento ----------
function pop(t,t0,k=1){const u=t-t0;if(u<=0)return{s:0,sx:0,sy:0,u};const s=1-Math.exp(-9*u)*Math.cos(18*u),q=Math.exp(-8*u)*Math.sin(18*u)*0.28*k;return{s,sx:s*(1+q),sy:s*(1-q),u};}
function squash(t,tl,amp=0.22){const u=t-tl;if(u<0)return[1,1];const q=Math.exp(-7*u)*Math.cos(16*u)*amp;return[1+q,1-q];}
const bob=(t,ph=0,a=8)=>Math.sin(t*TAU*0.85+ph)*a;

// ---------- rotulación: tipo redondo grueso, contorno de color y sombra suave ----------
function kText(ctx,str,x,y,size,o={}){
  ctx.save();ctx.font=`${o.weight||700} ${size}px ${o.font||FONT}`;ctx.textAlign=o.align||'center';ctx.textBaseline='alphabetic';ctx.lineJoin='round';ctx.miterLimit=2;
  const lw=size*(o.lw||0.24);
  if(o.outer){ctx.strokeStyle=o.outer;ctx.lineWidth=lw+size*(o.ow||0.13);ctx.strokeText(str,x,y);}
  if(o.shadow!==false){ctx.shadowColor='rgba(90,54,89,0.32)';ctx.shadowBlur=size*0.12;ctx.shadowOffsetY=size*0.07;}
  ctx.strokeStyle=o.line||C.pinkD;ctx.lineWidth=lw;ctx.strokeText(str,x,y);
  ctx.shadowColor='transparent';ctx.fillStyle=o.fill||C.white;ctx.fillText(str,x,y);ctx.restore();
}
// cada letra salta por su cuenta, anclada a la línea base
function kWord(ctx,str,cx,y,size,t,t0,stg,o={}){
  const chars=[...str];ctx.save();ctx.font=`${o.weight||700} ${size}px ${o.font||FONT}`;
  const ws=chars.map(c=>ctx.measureText(c).width),tot=ws.reduce((a,b)=>a+b,0)+(o.track||0)*(chars.length-1);ctx.restore();
  let x=cx-tot/2;
  chars.forEach((c,i)=>{const w=ws[i],p=pop(t,t0+i*stg,1.3);
    if(c!==' '&&p.s>0){const hop=p.u<0.25?-Math.sin(p.u/0.25*Math.PI)*size*0.18:0;ctx.save();ctx.translate(x+w/2,y+hop);ctx.rotate((o.wob||0)*Math.sin(t*6+i*1.3));ctx.scale(Math.min(p.sx,p.s,1),p.sy);kText(ctx,c,0,0,size,o);ctx.restore();}
    x+=w+(o.track||0);});
  return tot;
}
// dos líneas parejas en vez de una larga y una huérfana
function balanced(ctx,text,maxW,size,font){
  let best=wrapLines(ctx,text,maxW,size,font,2);if(best.length<2)return best;
  ctx.save();ctx.font=font.replace('SIZE',size);const wd=l=>ctx.measureText(l).width;
  for(let mw=maxW-20;mw>maxW*0.4;mw-=20){const l=wrapLines(ctx,text,mw,size,font,2);if(l.length!==2||wd(l[1])>wd(l[0])||Math.max(wd(l[0]),wd(l[1]))>maxW)break;best=l;}
  ctx.restore();return best;
}
// texto largo: parte en líneas, ajusta el tamaño y centra el bloque en cy (letra a letra o de golpe)
function kFit(ctx,text,cx,cy,maxW,size,t,t0,o={},stg=0.025){
  const font=`${o.weight||700} SIZEpx ${o.font||FONT}`,lines=balanced(ctx,text,maxW,size,font),fs=fitFont(ctx,lines,maxW,size,font),lh=fs*1.16;
  let w=0,y=cy-(lines.length-1)*lh/2+fs*0.36,k=0;
  for(const line of lines){
    if(stg)w=Math.max(w,kWord(ctx,line,cx,y,fs,t,t0+k*stg,stg,o));
    else{const p=pop(t,t0,1.2);if(p.s>0){ctx.save();ctx.translate(cx,y);ctx.scale(p.sx,p.sy);kText(ctx,line,0,0,fs,o);ctx.restore();}ctx.save();ctx.font=font.replace('SIZE',fs);w=Math.max(w,ctx.measureText(line).width);ctx.restore();}
    k+=[...line].length;y+=lh;
  }
  return{w,h:lh*lines.length,fs};
}

// ---------- caras de anime ----------
function eye(ctx,x,y,rx,ry,iris,kind='normal',side=1,look=[0,0]){
  ctx.save();ctx.translate(x,y);ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=C.dark;
  if(kind==='happy'){ctx.beginPath();ctx.moveTo(-rx*0.95,ry*0.18);ctx.quadraticCurveTo(0,-ry*0.85,rx*0.95,ry*0.18);ctx.lineWidth=rx*0.32;ctx.stroke();}
  else if(kind==='squeeze'){ctx.beginPath();ctx.moveTo(-rx*0.65*side,-ry*0.5);ctx.lineTo(rx*0.6*side,0);ctx.lineTo(-rx*0.65*side,ry*0.5);ctx.lineWidth=rx*0.3;ctx.stroke();}
  else if(kind==='star'){const p=starP(0,0,rx*1.2,-Math.PI/2,0.5);ctx.fillStyle=C.butterD;ctx.fill(p);ctx.lineWidth=rx*0.15;ctx.stroke(p);shine(ctx,-rx*0.22,-rx*0.28,rx*0.2,rx*0.14,-0.5,1);}
  else{const lx=look[0]*rx*0.16,ly=look[1]*ry*0.12;
    ctx.fillStyle=C.dark;ctx.fill(ellP(0,0,rx,ry));
    const g=ctx.createLinearGradient(0,-ry,0,ry);g.addColorStop(0,C.dark);g.addColorStop(0.42,H.rgba(H.mix(iris,C.dark,0.35)));g.addColorStop(1,H.rgba(H.mix(iris,'#ffffff',0.45)));
    ctx.fillStyle=g;ctx.fill(ellP(lx,ly+ry*0.06,rx*0.8,ry*0.82));ctx.fillStyle='#28142c';ctx.fill(ellP(lx,ly+ry*0.02,rx*0.42,ry*0.44));
    ctx.fillStyle=H.rgba(H.mix(iris,'#ffffff',0.65),0.9);ctx.fill(ellP(lx,ly+ry*0.6,rx*0.46,ry*0.16));
    ctx.fillStyle=C.white;ctx.fill(ellP(lx-rx*0.3,ly-ry*0.36,rx*0.34,ry*0.28));ctx.fill(ellP(lx+rx*0.34,ly+ry*0.3,rx*0.14,ry*0.12));
    ctx.beginPath();ctx.ellipse(0,0,rx*1.06,ry*1.04,0,Math.PI*1.13,Math.PI*1.87);ctx.lineWidth=rx*0.22;ctx.stroke();}
  ctx.restore();
}
function mouth(ctx,x,y,w,kind='smile'){
  ctx.save();ctx.translate(x,y);ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=C.dark;ctx.lineWidth=w*0.26;
  if(kind==='w'){ctx.beginPath();ctx.moveTo(-w,-w*0.15);ctx.quadraticCurveTo(-w*0.5,w*0.75,0,0);ctx.quadraticCurveTo(w*0.5,w*0.75,w,-w*0.15);ctx.stroke();}
  else if(kind==='flat'){ctx.beginPath();ctx.moveTo(-w*0.5,0);ctx.lineTo(w*0.5,0);ctx.stroke();}
  else if(kind==='o'){const p=ellP(0,0,w*0.5,w*0.58);ctx.fillStyle='#b8456f';ctx.fill(p);ctx.lineWidth=w*0.22;ctx.stroke(p);}
  else{const p=new Path2D();p.moveTo(-w,-w*0.2);p.quadraticCurveTo(0,w*1.7,w,-w*0.2);p.closePath();ctx.fillStyle='#b8456f';ctx.fill(p);ctx.save();ctx.clip(p);ctx.fillStyle='#ff8fab';ctx.fill(ellP(0,w*0.85,w*0.6,w*0.42));ctx.restore();ctx.lineWidth=w*0.22;ctx.stroke(p);}
  ctx.restore();
}
function blush(ctx,x,y,rx,ry){ctx.save();ctx.fillStyle='rgba(255,135,170,0.55)';ctx.fill(ellP(x,y,rx,ry));ctx.strokeStyle='rgba(255,95,145,0.85)';ctx.lineWidth=rx*0.13;ctx.lineCap='round';ctx.beginPath();for(let i=-1;i<=1;i++){ctx.moveTo(x+i*rx*0.45-rx*0.1,y+ry*0.35);ctx.lineTo(x+i*rx*0.45+rx*0.1,y-ry*0.35);}ctx.stroke();ctx.restore();}

// ---------- mascota: un conejito mochi (토끼) chibi ----------
function rig(ctx,x,y,s,P,footY){
  ctx.translate(x,y);ctx.scale(s,s);
  const k=1-Math.min(P.lift||0,140)/280;ctx.fillStyle='rgba(90,54,89,0.13)';ctx.fill(ellP(0,footY+30,120*k,18*k));
  ctx.translate(0,-(P.lift||0));const sq=P.sq||[1,1];ctx.translate(0,footY);ctx.rotate(P.tilt||0);ctx.scale(sq[0],sq[1]);ctx.translate(0,-footY);
}
function bunny(ctx,x,y,s,P={}){
  ctx.save();rig(ctx,x,y,s,P,150);
  for(const sd of [-1,1]){ctx.save();ctx.translate(sd*50,-62);ctx.rotate(sd*(0.2+(P.ear||0)*(sd>0?1:0.5)));const e=ellP(0,-78,30,84);cel(ctx,e,C.cream,C.creamS,-6,-6);ctx.fillStyle=C.pink;ctx.fill(ellP(sd*3,-70,13,58));ctx.restore();}
  const arm=(sd,a)=>{ctx.save();ctx.translate(sd*118,70);ctx.rotate(-sd*a);cel(ctx,ellP(sd*10,26,22,30,-sd*0.25),C.cream,C.creamS,-5,-5);ctx.restore();};
  const aL=P.armL||0.15,aR=P.armR||0.15;if(aL<1.2)arm(-1,aL);if(aR<1.2)arm(1,aR);
  cel(ctx,ellP(0,30,140,120),C.cream,C.creamS,-14,-14);
  shine(ctx,-86,-26,26,11,-0.6);shine(ctx,-52,-56,7,7,0);
  cel(ctx,heartP(0,118,20),C.pink,C.pinkS,-3,-3,3.5);
  if(aL>=1.2)arm(-1,aL);if(aR>=1.2)arm(1,aR);
  const ek=P.eyes||'normal';eye(ctx,-50,22,30,40,'#f07aa8',ek,1,P.look);eye(ctx,50,22,30,40,'#f07aa8',ek,-1,P.look);
  blush(ctx,-92,62,22,12);blush(ctx,92,62,22,12);mouth(ctx,0,66,12,P.mouth||'w');
  ctx.restore();
}

// ---------- props y emotes ----------
function sweat(ctx,x,y,s,rot=0.25){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.scale(s,s);const p=new Path2D();p.moveTo(0,-30);p.bezierCurveTo(8,-12,20,2,20,14);p.arc(0,14,20,0,Math.PI);p.bezierCurveTo(-20,2,-8,-12,0,-30);p.closePath();cel(ctx,p,C.sky,C.skyS,-4,-4,4);shine(ctx,-6,12,4,7,0.3);ctx.restore();}
function sparkle(ctx,x,y,R,fill=C.white,rot=0,w=3.5){if(R<=0.5)return;const p=spark4P(x,y,R,rot);ctx.fillStyle=fill;ctx.fill(p);if(w)ol(ctx,p,w);}
function heart(ctx,x,y,s,fill=C.pinkD,rot=0){cel(ctx,heartP(x,y,s,rot),fill,H.rgba(H.mix(fill,C.plum,0.25)),-s*0.12,-s*0.12,3.5);shine(ctx,x-s*0.45,y-s*0.35,s*0.18,s*0.12,-0.6);}
function impactLines(ctx,x,y,r0,t,t0,n=8,col=C.plum){const u=(t-t0)/0.3;if(u<0||u>1)return;ctx.save();ctx.strokeStyle=col;ctx.lineCap='round';ctx.lineWidth=6;ctx.globalAlpha=1-u*0.6;ctx.beginPath();for(let i=0;i<n;i++){const a=i/n*TAU+0.3,a0=r0+u*30,a1=r0+24+u*46;ctx.moveTo(x+Math.cos(a)*a0,y+Math.sin(a)*a0);ctx.lineTo(x+Math.cos(a)*a1,y+Math.sin(a)*a1);}ctx.stroke();ctx.restore();}
function confetti(ctx,t,t0,x,y,n,seed,spread=1){
  const tau=t-t0;if(tau<0||tau>2.4)return;const r=H.rng(seed),cols=[C.pinkD,C.mintD,C.butterD,C.skyD,C.lavD,C.pink];
  for(let i=0;i<n;i++){const a=-Math.PI/2+(r()-0.5)*2.6*spread,v=r.range(380,820),rs=r.range(-8,8),c=cols[i%cols.length],kind=i%4,sz=r.range(9,15),px=x+Math.cos(a)*v*tau*0.8,py=y+Math.sin(a)*v*tau*0.8+520*tau*tau;
    if(py>760)continue;ctx.save();ctx.translate(px,py);ctx.rotate(rs*tau);ctx.scale(1,Math.cos(tau*9+i));ctx.fillStyle=c;
    ctx.fill(kind===0?rrP(-sz*0.6,-sz*0.35,sz*1.2,sz*0.7,3):kind===1?ellP(0,0,sz*0.45,sz*0.45):kind===2?starP(0,0,sz*0.7):heartP(0,0,sz*0.5));ctx.restore();}
}
// píldora con texto (marcador de esquina)
function tag(ctx,x,y,label,fill,size=32){ctx.save();ctx.translate(x,y);ctx.font=`700 ${size}px ${FONT}`;const w=Math.max(ctx.measureText(label).width+size*1.1,size*1.6),h=size*1.5;cel(ctx,rrP(-w/2,-h/2,w,h,h/2),fill,H.rgba(H.mix(fill,C.plum,0.15)),-3,-3,3.5);ctx.fillStyle=C.plum;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,0,2);ctx.restore();}
// tarjeta de foto: marco cel, fondo de lunares y la ilustración dentro
function picCard(ctx,img,cx,cy,w,h,t,t0,seed){
  const p=pop(t,t0);if(p.s<=0)return;
  ctx.save();ctx.translate(cx,cy+bob(t,seed,4));ctx.rotate(0.03*Math.sin(t*1.3+seed));ctx.scale(p.sx,p.sy);
  cel(ctx,rrP(-w/2,-h/2,w,h,28),'#fffdfb','#eadcf2',-7,-7,5);
  const iw=w-40,ih=h-40,inner=rrP(-iw/2,-ih/2,iw,ih,18);
  ctx.save();ctx.clip(inner);ctx.fillStyle='#ffeef4';ctx.fillRect(-iw/2,-ih/2,iw,ih);ctx.fillStyle='#ffdce8';
  for(let j=0;j*26<ih+26;j++)for(let i=0;i*26<iw+26;i++)ctx.fill(ellP(-iw/2+i*26+(j%2)*13,-ih/2+j*26,4,4));
  if(img){const nw=img.naturalWidth||img.width||1,nh=img.naturalHeight||img.height||1,k=Math.min((iw-16)/nw,(ih-16)/nh);ctx.drawImage(img,-nw*k/2,-nh*k/2,nw*k,nh*k);}
  ctx.restore();ol(ctx,inner,3.5);
  heart(ctx,w/2-22,-h/2+8,18,C.pinkD,0.3);sparkle(ctx,-w/2+16,h/2-14,14+5*Math.max(0,Math.sin(t*5+seed)),C.butter,0,3);
  ctx.restore();
}
// fondo pastel: nubes sin contorno a la deriva y patrón de lunares/estrellas/corazones
function bg(ctx,W,Hh,t,th,seed=1){
  ctx.fillStyle=th.base;ctx.fillRect(0,0,W,Hh);const r=H.rng(seed);
  ctx.save();ctx.globalAlpha=th.kind==='clouds'?0.95:0.7;ctx.fillStyle=C.white;
  for(let i=0,nc=th.kind==='clouds'?6:3;i<nc;i++){const s=r.range(0.9,1.6),x=((r.range(0,W+300)+t*r.range(8,16))%(W+300))-150,y=r.range(60,Hh-40);ctx.fill(cloudP(x,y,s));}
  ctx.restore();
  const sx=66,sy=48,ox=(t*12)%(sx*2),oy=(t*7)%(sy*2);
  for(let j=-2;j<Hh/sy+2;j++)for(let i=-2;i<W/sx+2;i++){const x=i*sx+(j&1?sx/2:0)+ox,y=j*sy+oy;
    if((j&1)&&th.kind!=='dots'&&th.kind!=='clouds'){ctx.fillStyle=th.acc;ctx.fill(th.kind==='stars'?starP(x,y,10,-Math.PI/2+(i+j)*0.3):heartP(x,y,9));}
    else{ctx.fillStyle=th.dot;ctx.fill(ellP(x,y,8,8));}}
}
function twinkles(ctx,W,Hh,t,seed,n=9,avoid){const r=H.rng(seed);for(let i=0;i<n;i++){const x=r.range(40,W-40),y=r.range(40,Hh-40),R=r.range(9,18),ph=r()*TAU,sp=r.range(2.5,4.5);if(avoid&&avoid(x,y))continue;const k=Math.max(0,Math.sin(t*sp+ph));if(k<0.1)continue;sparkle(ctx,x,y,R*(0.4+0.6*k),i%3?C.white:C.butter,0,0);}}
// iris de estrella/corazón con borde grueso de caramelo
function wipe(ctx,u,shape,cx,cy,drawB){
  const e=u*u*(3-2*u),rot=-Math.PI/2+u*0.9,p=shape==='heart'?heartP(cx,cy,1900*e*e+4,0):starP(cx,cy,1800*e*e+4,rot,0.52);
  ctx.save();ctx.clip(p);drawB();ctx.restore();
  ctx.save();ctx.lineJoin='round';ctx.strokeStyle=C.plum;ctx.lineWidth=34;ctx.stroke(p);ctx.strokeStyle=shape==='heart'?C.pink:C.butter;ctx.lineWidth=24;ctx.stroke(p);ctx.strokeStyle=C.white;ctx.lineWidth=6;ctx.globalAlpha=0.8;ctx.stroke(p);ctx.restore();
}

// ---------- piezas del repaso ----------
// nota musical cel (para el «escucha»)
function note(ctx,x,y,s,fill,shade){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.rotate(-0.15);ctx.fillStyle=C.plum;ctx.fillRect(10,-62,9,64);const f=new Path2D();f.moveTo(14,-64);f.quadraticCurveTo(46,-52,40,-20);f.quadraticCurveTo(36,-40,16,-42);f.closePath();cel(ctx,f,fill,shade,-2,-2,3.5);cel(ctx,ellP(0,0,20,15,-0.4),fill,shade,-4,-4,4.5);shine(ctx,-6,-5,5,3,-0.5);ctx.restore();}
// altavoz kawaii con ondas de caramelo que laten y notas que suben
function speaker(ctx,x,y,t,t0){
  const p=pop(t,t0,1.2);if(p.s<=0)return;
  ctx.save();ctx.translate(x,y);ctx.scale(p.sx,p.sy);
  ctx.lineCap='round';
  for(let i=0;i<3;i++){const k=0.5+0.5*Math.sin(t*7-i*1.1),r=70+i*46;ctx.beginPath();ctx.arc(30,0,r,-0.75,0.75);ctx.strokeStyle=C.plum;ctx.lineWidth=17+k*4;ctx.stroke();ctx.strokeStyle=[C.mint,C.sky,C.lav][i];ctx.lineWidth=8+k*4;ctx.stroke();}
  cel(ctx,rrP(-130,-48,70,96,20),C.lav,C.lavS,-5,-5);
  cel(ctx,roundPoly([[-68,-44],[20,-110],[20,110],[-68,44]],18),C.pink,C.pinkS,-8,-8);
  shine(ctx,-40,-38,14,6,-0.6);
  for(let i=0;i<3;i++){const u=((t-t0)*0.55+i/3)%1,sc=Math.sin(Math.min(1,u*1.25)*Math.PI)*0.95;if(sc>0.05)note(ctx,190+i*44+Math.sin(u*8+i)*16,90-u*260,sc,[C.butter,C.mint,C.pink][i],[C.butterS,C.mintS,C.pinkS][i]);}
  ctx.restore();
}
// cuenta atrás: disco de mantequilla, anillo de puntos de caramelo que se apagan y número que rebota
function countdown(ctx,cx,cy,t,think,label){
  const dur=think[1]-think[0],pp=H.clamp((t-think[0])/dur),left=Math.max(1,Math.ceil(dur*(1-pp)-1e-6));
  const pin=pop(t,think[0]);if(pin.s<=0)return;
  ctx.save();ctx.translate(cx,cy);ctx.scale(pin.sx,pin.sy);
  cel(ctx,ellP(0,0,120,120),C.butter,C.butterS,-10,-10,5);shine(ctx,-62,-64,22,10,-0.6);
  const N=24;for(let i=0;i<N;i++){const a=-Math.PI/2+i/N*TAU,on=(i+0.5)/N>=pp;ctx.fillStyle=on?[C.pinkD,C.mintD,C.lavD,C.skyD][i%4]:'rgba(90,54,89,0.16)';const r=on?10:6;ctx.fill(ellP(Math.cos(a)*156,Math.sin(a)*156,r,r));}
  const a=-Math.PI/2+pp*TAU;cel(ctx,starP(Math.cos(a)*156,Math.sin(a)*156,24,t*3),C.butterD,C.butterS,-3,-3,4);
  ctx.restore();
  const pn=pop(t,think[0]+Math.max(0,dur-left),1.5);
  if(pn.s>0){ctx.save();ctx.translate(cx,cy+54);ctx.scale(pn.sx,pn.sy);kText(ctx,String(left),0,0,156,{fill:C.white,line:C.pinkD,outer:C.plum,ow:0.08,lw:0.16});ctx.restore();}
  const pl=pop(t,think[0]+0.2);if(pl.s>0){ctx.save();ctx.translate(cx,cy+240);ctx.rotate(-0.03);ctx.scale(pl.sx,pl.sy);kText(ctx,label,0,0,52,{fill:C.white,line:C.lavD});ctx.restore();}
}
// marca de «correcto»: botón menta con palomita blanca y líneas de impacto
function okMark(ctx,x,y,t,t0,R=42){
  const p=pop(t,t0,1.5);if(p.s<=0)return;
  ctx.save();ctx.translate(x,y);ctx.rotate(-0.1);ctx.scale(p.sx,p.sy);cel(ctx,ellP(0,0,R,R),C.mintD,'#2fa078',-5,-5,5);
  ctx.strokeStyle=C.white;ctx.lineWidth=R*0.27;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(-R*0.42,R*0.05);ctx.lineTo(-R*0.1,R*0.37);ctx.lineTo(R*0.45,-R*0.3);ctx.stroke();ctx.restore();
  impactLines(ctx,x,y,R+14,t,t0,10,C.mintD);
}
// píldora de cabecera, como el titular encogido de la referencia
function header(ctx,text,t,t0,fill,shade,line){
  const p=pop(t,t0,1.2);if(p.s<=0)return;
  ctx.save();ctx.font=`700 46px ${FONT}`;const w=ctx.measureText(text).width+64;ctx.translate(36+w/2,62);ctx.rotate(-0.02);ctx.scale(p.sx,p.sy);
  cel(ctx,rrP(-w/2,-38,w,76,38),fill,shade,-4,-4);kText(ctx,text,0,17,46,{line,lw:0.26});ctx.restore();
}
function burst(ctx,cx,cy,rx,ry,t,t0){for(let i=0;i<7;i++){const a=i/7*TAU+0.4,p=pop(t,t0+i*0.04),k=0.7+0.3*Math.sin(t*6+i*2);sparkle(ctx,cx+Math.cos(a)*rx,cy+Math.sin(a)*ry,(10+(i%3)*6)*p.s*k,i%2?C.white:C.butterD,0,3);}}

function drawBeat(ctx,W,Hh,t,S,beat){
  const local=t-beat.t0,seed=beat.index*97+11,t0=beat.t0;
  if(beat.kind==='title'){
    const head=`REPASO · CLASE ${beat.classNumber}`,fs=fitFont(ctx,[head],660,66,`700 SIZEpx ${FONT}`);
    kWord(ctx,head,420,168,fs,t,t0+0.2,0.035,{fill:C.white,line:C.pinkD,wob:0.02});
    kFit(ctx,beat.unitTitle||'',420,288,640,58,t,t0+0.95,{fill:C.white,line:C.lavD},0);
    const ps=pop(t,t0+1.7,1.3);if(ps.s>0){ctx.save();ctx.translate(420,420);ctx.rotate(-0.05+0.03*Math.sin(t*4));ctx.scale(ps.sx,ps.sy);kText(ctx,'¿Cuánto recuerdas?',0,0,56,{fill:C.butter,line:C.pinkD,outer:C.plum,lw:0.2});ctx.restore();}
    for(const [tt,x,y,sz] of [[t0+1.9,760,382,70],[t0+2.05,804,318,46]]){const p=pop(t,tt,1.4);if(p.s<=0)continue;ctx.save();ctx.translate(x,y);ctx.rotate(0.14*Math.sin(t*9+x));ctx.scale(p.sx,p.sy);kText(ctx,'?',0,0,sz,{fill:C.butter,line:C.pinkD,outer:C.plum,lw:0.2});ctx.restore();}
    if(S.assets.scene)picCard(ctx,S.assets.scene,980,300,420,300,t,t0+0.5,seed);
    // la mascota cae y rebota (boing)
    if(local>=0.15){let y=600,sq;const land=0.45;if(local<land){const u=(local-0.15)/(land-0.15);y=600-640*(1-u*u);sq=[0.86,1.16];}else sq=squash(t,t0+land,0.26);
      bunny(ctx,1150,y,0.42,{sq,lift:local>land+0.5?Math.max(0,bob(t,0,8)):0,eyes:local>2.6&&local<2.74?'happy':'normal',look:[-0.5,-0.4],mouth:local<1?'o':'smile',ear:0.15*Math.sin(t*5),armL:local>1.7?2.2+0.3*Math.sin(t*9):0.15});}
    return;
  }
  if(beat.kind==='end'){
    kWord(ctx,'¡Muy bien!',640,236,104,t,t0+0.15,0.05,{fill:C.white,line:C.mintD,outer:C.plum,ow:0.09,lw:0.2,wob:0.03});
    const p1=pop(t,t0+0.9);if(p1.s>0){ctx.save();ctx.translate(640,360);ctx.scale(p1.sx,p1.sy);kText(ctx,`${beat.total} frases repasadas`,0,0,56,{fill:C.white,line:C.pinkD});ctx.restore();}
    const p2=pop(t,t0+1.5);if(p2.s>0){ctx.save();ctx.translate(560,464);ctx.rotate(-0.02);ctx.scale(p2.sx,p2.sy);kText(ctx,'Mañana vuelven: ¡no las sueltes!',0,0,48,{fill:C.butter,line:C.lavD,outer:C.plum,ow:0.1,lw:0.2});ctx.restore();}
    const hop=Math.max(0,Math.sin(t*TAU*1.5))*18;
    bunny(ctx,1110,600,0.44,{eyes:local<2.4?'star':'happy',mouth:'smile',armL:2.3+0.35*Math.sin(t*9),armR:2.3+0.35*Math.sin(t*9+1.5),lift:hop,sq:squash(t,t0+0.1,0.15),ear:0.2*Math.sin(t*8)});
    for(let i=0;i<6;i++){const u=((t-t0)*0.6+i/6)%1;heart(ctx,[150,330,820,980,240,700][i]+Math.sin(u*9+i)*14,720-u*260,(12+6*Math.sin(u*Math.PI))*H.clamp(local*2),[C.pinkD,C.pink,C.red][i%3]);}
    confetti(ctx,t,t0+0.3,640,210,46,seed,1.1);
    return;
  }
  const {think,reveal}=beatTimes(beat),item=beat.item,img=S.assets.picture(item.picture),listen=beat.kind==='listen';
  const cx=img?430:600,maxW=img?600:900;
  header(ctx,listen?'ESCUCHA':'¿CÓMO SE DICE?',t,t0+0.1,listen?C.mint:C.pink,listen?C.mintS:C.pinkS,listen?C.mintD:C.pinkD);
  const pc=pop(t,t0+0.25);if(pc.s>0){ctx.save();ctx.translate(1170,62);ctx.scale(pc.sx,pc.sy);tag(ctx,0,0,`${beat.number} / ${beat.total}`,C.butter,32);ctx.restore();}
  if(img)picCard(ctx,img,950,340,300,300,t,t0+0.35,seed);
  let P={look:[-0.5,-0.2],mouth:'w',lift:Math.max(0,bob(t,seed,6)),ear:0.12*Math.sin(t*4)};
  if(t<think[0]){
    if(listen){ctx.save();ctx.translate(cx-60,330);ctx.scale(1.3,1.3);speaker(ctx,0,0,t,t0+0.3);ctx.restore();P={...P,eyes:'normal',mouth:'o',ear:0.35*Math.sin(t*9),look:[-0.8,-0.5]};}
    else{const p=pop(t,t0+0.3,1.2);if(p.s>0)kFit(ctx,item.es,cx,320,maxW,76,t,t0+0.3,{fill:C.white,line:C.lavD,outer:C.plum,ow:0.08,lw:0.18});}
  }else if(t<reveal[0]){
    countdown(ctx,cx,300,t,think,listen?'¿Qué significa?':'¡Dilo en voz alta!');
    const pp=(t-think[0])/(think[1]-think[0]);P={...P,eyes:pp>0.6?'squeeze':'normal',look:[0.5,-0.6],mouth:'flat'};
    if(pp>0.45)sweat(ctx,1205,520+H.clamp((pp-0.45)*2)*22,pop(t,think[0]+(think[1]-think[0])*0.45).s*0.9,0.35);
  }else{
    const r0=reveal[0],r=t-r0;
    // momento clave: acercamiento con rebote y destellos
    const z=1+0.08*H.smooth(r0,r0+0.12,t)*(1-H.smooth(r0+0.5,r0+0.9,t));
    ctx.save();ctx.translate(cx,300);ctx.scale(z,z);ctx.translate(-cx,-300);
    let main,yMain;
    if(listen){
      main=kFit(ctx,item.es,cx,250,img?maxW:maxW-120,80,t,r0,{fill:C.white,line:C.mintD,outer:C.plum,ow:0.08,lw:0.18});yMain=250;
      kFit(ctx,item.ko,cx,250+main.h/2+70,maxW,60,t,r0+0.75,{fill:C.white,line:C.skyD,lw:0.16},0);
    }else{
      main=kFit(ctx,item.ko,cx,260,img?maxW:maxW-120,112,t,r0,{fill:C.white,line:C.pinkD,outer:C.plum,ow:0.08,lw:0.15},0.05);yMain=260;
      kFit(ctx,item.es,cx,260+main.h/2+56,maxW,42,t,r0+0.6,{fill:C.white,line:C.lavD,lw:0.22},0);
    }
    burst(ctx,cx,yMain,Math.min(main.w/2+70,maxW/2+40),main.h/2+56,t,r0+0.12);
    ctx.restore();
    // con foto, el sello de «correcto» cae sobre la esquina de la tarjeta; sin foto, junto a la respuesta
    if(img)okMark(ctx,812,200,t,r0+0.5,48);else okMark(ctx,Math.min(cx+main.w/2+64,1070),yMain-main.h/2+6,t,r0+0.5);
    confetti(ctx,t,r0+0.05,cx,yMain,34,seed);
    P={...P,eyes:'star',mouth:'smile',armL:2.3+0.3*Math.sin(t*12),armR:2.1+0.3*Math.sin(t*12+1),sq:squash(t,r0,0.2),lift:r<0.6?0:P.lift};
    void r;
  }
  bunny(ctx,1165,600,0.4,P);
}

function scene(ctx,W,Hh,t,S,beat){
  const th={title:TH.pink,listen:TH.mint,produce:TH.lav,end:TH.butter}[beat.kind];
  bg(ctx,W,Hh,t,th,3+beat.index);
  twinkles(ctx,W,Hh,t,21+beat.index,10,(x,y)=>x<900&&y>150&&y<600);
  drawBeat(ctx,W,Hh,t,S,beat);
}

export default {
  id:'kawaii',
  name:'Anime kawaii',
  fonts:['700 80px "Fredoka"','600 30px "Fredoka"','900 46px "Zen Maru Gothic"'],
  fontCss:'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&family=Zen+Maru+Gothic:wght@500;900&display=block',
  readsPixels:false,
  frame(ctx,W,Hh,t,S){
    const tq=q15(t);
    // cambio de escena a la manera del medio: iris de estrella o corazón con borde de caramelo
    if(S.prev&&S.local<WD){
      scene(ctx,W,Hh,S.prev.t1-0.001,S,S.prev);
      wipe(ctx,S.local/WD,S.beat.index%2?'star':'heart',640,380,()=>scene(ctx,W,Hh,Math.max(tq,S.beat.t0),S,S.beat));
    }else scene(ctx,W,Hh,tq,S,S.beat);
  },
  score(k,timeline){
    // sonidos tiernos hechos con k.tone/k.noise (como explainerSound de la referencia), discretos bajo la voz
    const bloop=(t,f=420,g=1,minor=true)=>{k.tone(t,{f:[[0,f*0.7],[0.07,f*1.35]],dur:0.11,gain:0.2*g,minor});k.noise(t,{dur:0.012,filter:'bandpass',f:1600,q:1.2,gain:0.05*g,minor});};
    const boing=(t,g=1)=>{k.tone(t,{f:[[0,150],[0.05,290],[0.12,190],[0.2,250],[0.3,210],[0.4,225]],type:'triangle',dur:0.45,gain:0.22*g,minor:true});k.tone(t,{f:[[0,75],[0.06,140],[0.3,110]],dur:0.3,gain:0.2*g,minor:true});};
    const bell=(t,f,g=1,o={})=>{const hz=k.hz(f);k.tone(t,{f:hz,dur:o.dur||0.9,gain:0.09*g,a:0.004,verb:0.35,pan:o.pan,minor:o.minor});k.tone(t,{f:hz*2,dur:0.3,gain:0.025*g,a:0.003,verb:0.3,pan:o.pan,minor:o.minor});};
    const twinkle=(t,n=3,g=1)=>{const ns=['G4','C5','E5','G5','A5','C6'];for(let i=0;i<n;i++)bell(t+i*0.06,ns[(i*2+n)%ns.length],0.55*g,{dur:0.7,pan:i%2?0.35:-0.35,minor:true});};
    const iris=(t,d,base)=>{k.tone(t,{f:[[0,k.hz(base)/2],[d,k.hz(base)*1.5]],dur:d+0.05,gain:0.05,a:d*0.6,verb:0.3,minor:true});k.noise(t,{dur:d,color:'pink',filter:'bandpass',f:[[0,300],[d,1800]],q:0.8,gain:0.11,a:d*0.7,minor:true});twinkle(t+d*0.75,3,0.7);};
    for(const beat of timeline.beats){
      const t0=beat.t0;
      if(beat.index)iris(t0,WD,['C5','D5','E5','G5'][beat.index%4]);
      if(beat.kind==='title'){k.tone(0.15,{f:[[0,700],[0.3,320]],dur:0.3,gain:0.05,minor:true});boing(0.45,0.9);bloop(0.2,520,0.7);bloop(0.95,600,0.7);bloop(1.7,700,0.8);continue;}
      if(beat.kind==='end'){bloop(t0+0.15,560,0.8);bloop(t0+0.9,620,0.6);['G4','C5','E5','G5'].forEach((n,i)=>bell(t0+1.5+i*0.05,n,1.1,{dur:1.4}));k.tone(t0+1.5,{f:'C3',type:'triangle',dur:1.2,gain:0.08,a:0.02});continue;}
      const {think,reveal}=beatTimes(beat),dur=think[1]-think[0];
      bloop(t0+0.12,480,0.6);bloop(t0+0.35,560,0.5);
      bloop(think[0],420,0.7);
      for(let n=Math.ceil(dur-1e-6);n>=1;n--){const s=think[0]+Math.max(0,dur-n);if(s>think[0]+0.05)k.play('tock',s,{f:900,gain:0.3,minor:true});}
      ['C5','E5','G5','C6'].forEach((n,i)=>bell(reveal[0]+i*0.07,n,0.85-i*0.08,{dur:0.8}));
      twinkle(reveal[0]+0.35,4,0.6);bloop(reveal[0]+0.5,640,0.5);
    }
  },
};
