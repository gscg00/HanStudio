// Estilo «Neón tecnológico»: el look de motion graphics de los canales de tecnología.
// Espacio azul marino a índigo con brillos eléctricos a la deriva, rejilla en
// perspectiva y partículas; tarjetas oscuras con borde de neón degradado, mosaicos de
// iconos de línea que se dibujan, conectores con pulsos de luz, titulares degradados
// palabra a palabra y bloom en todo lo brillante. Técnicas del paquete: background(),
// bloom(), card(), tile(), pill(), gtext/revealLine, eyebrow, connector/pulseOn,
// glowDot/ring y el «empujón de cámara» con estelas de velocidad entre escenas.
import {beatTimes,fitFont,wrapLines,inLanguageLabel} from './shared.js';

const H=window.H,E=H.ease,cl=H.clamp,lerp=H.lerp;
const seg=(a,b,t)=>cl((t-a)/(b-a)),eo=(a,b,t)=>E.out(seg(a,b,t)),eio=(a,b,t)=>E.inOut(seg(a,b,t)),ebk=(a,b,t)=>(t<=a?0:t>=b?1:E.back(seg(a,b,t)));
const fract=x=>x-Math.floor(x),rgb=(c,a)=>H.rgba(c,a),bump=(t,t0,k=6)=>(t<t0?0:Math.exp(-(t-t0)*k));
const HANGUL='"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif';
const HEAD=`"Space Grotesk",${HANGUL}`,UI=`"Inter",${HANGUL}`,F=(w,s,fam)=>`${w} ${s}px ${fam||HEAD}`;
const C={cyan:'#3fe3ff',blue:'#3d7bff',violet:'#8f5bff',magenta:'#e04dff',indigo:'#4b3bff',red:'#ff4f7a',green:'#3cf0b4',white:'#eef2ff',muted:'#9aa3d8'};
const GRAD_HEAD=['#ffffff','#c8f4ff','#7fdcff','#9a78ff'],GRAD_NUM=['#7ff0ff','#5d9bff','#a77bff'],GRAD_OK=['#ffffff','#9ffbe0',C.green];
const TR=0.7;
const rr=(c,x,y,w,h,r)=>{c.beginPath();c.roundRect(x,y,w,h,r);};

// ---------- iconos de línea (caja -1..1 escalada por u) ----------
const dotP=(c,x,y,r)=>{c.moveTo(x+r,y);c.arc(x,y,r,0,Math.PI*2);};
const ICONS={
  speaker(c,u){c.moveTo(-0.8*u,-0.24*u);c.lineTo(-0.44*u,-0.24*u);c.lineTo(-0.02*u,-0.6*u);c.lineTo(-0.02*u,0.6*u);c.lineTo(-0.44*u,0.24*u);c.lineTo(-0.8*u,0.24*u);c.closePath();
    c.moveTo(0.22*u,-0.28*u);c.quadraticCurveTo(0.4*u,0,0.22*u,0.28*u);c.moveTo(0.42*u,-0.52*u);c.quadraticCurveTo(0.74*u,0,0.42*u,0.52*u);},
  mic(c,u){c.roundRect(-0.26*u,-0.8*u,0.52*u,0.98*u,0.26*u);c.moveTo(-0.52*u,-0.1*u);c.quadraticCurveTo(-0.52*u,0.46*u,0,0.46*u);c.quadraticCurveTo(0.52*u,0.46*u,0.52*u,-0.1*u);c.moveTo(0,0.46*u);c.lineTo(0,0.8*u);c.moveTo(-0.3*u,0.8*u);c.lineTo(0.3*u,0.8*u);},
  check(c,u){c.moveTo(-0.58*u,0.02*u);c.lineTo(-0.16*u,0.44*u);c.lineTo(0.62*u,-0.42*u);},
  chat(c,u){c.moveTo(-0.5*u,-0.66*u);c.lineTo(0.5*u,-0.66*u);c.quadraticCurveTo(0.82*u,-0.66*u,0.82*u,-0.34*u);c.lineTo(0.82*u,0.12*u);c.quadraticCurveTo(0.82*u,0.44*u,0.5*u,0.44*u);c.lineTo(-0.1*u,0.44*u);c.lineTo(-0.48*u,0.8*u);c.lineTo(-0.44*u,0.44*u);c.quadraticCurveTo(-0.82*u,0.44*u,-0.82*u,0.12*u);c.lineTo(-0.82*u,-0.34*u);c.quadraticCurveTo(-0.82*u,-0.66*u,-0.5*u,-0.66*u);for(const x of [-0.36,0,0.36])dotP(c,x*u,-0.11*u,0.05*u);},
  sparkle(c,u){const star=(x,y,r)=>{c.moveTo(x,y-r);c.quadraticCurveTo(x,y,x+r,y);c.quadraticCurveTo(x,y,x,y+r);c.quadraticCurveTo(x,y,x-r,y);c.quadraticCurveTo(x,y,x,y-r);};star(-0.14*u,0.12*u,0.72*u);star(0.56*u,-0.56*u,0.26*u);},
};

// ---------- fondo: espacio degradado, brillos a la deriva, rejilla en perspectiva, partículas ----------
const GLOWS=[{c:C.blue,x:0.16,y:0.24,r:520,a:0.24},{c:C.violet,x:0.82,y:0.18,r:560,a:0.3},{c:C.cyan,x:0.6,y:0.95,r:440,a:0.17},{c:C.magenta,x:1.0,y:0.72,r:380,a:0.17},{c:C.indigo,x:0.42,y:0.62,r:560,a:0.12}];
const PARTS=(()=>{const r=H.rng(77);return Array.from({length:90},()=>({x:r(),y:r(),s:r.range(0.6,2.1),sp:r.range(0.004,0.018),ph:r()*6.28,c:r.pick([C.cyan,C.violet,'#ffffff',C.blue]),z:r.range(0.3,1)}));})();
function background(ctx,W,Hh,t,camX=0,lvl=1){
  const g=ctx.createLinearGradient(0,0,W*0.5,Hh);g.addColorStop(0,'#03041a');g.addColorStop(0.55,'#080a2d');g.addColorStop(1,'#120b3c');ctx.fillStyle=g;ctx.fillRect(0,0,W,Hh);
  ctx.save();ctx.globalCompositeOperation='lighter';
  GLOWS.forEach((b,i)=>{const x=(b.x+0.05*Math.sin(t*0.21+i*1.9))*W-camX*0.1,y=(b.y+0.06*Math.cos(t*0.17+i*2.7))*Hh,r=b.r*(1+0.07*Math.sin(t*0.3+i)),rg=ctx.createRadialGradient(x,y,0,x,y,r);rg.addColorStop(0,rgb(b.c,b.a*lvl));rg.addColorStop(0.4,rgb(b.c,b.a*0.38*lvl));rg.addColorStop(1,rgb(b.c,0));ctx.fillStyle=rg;ctx.fillRect(x-r,y-r,2*r,2*r);});
  ctx.restore();
  ctx.save();const ox=((-camX*0.3)%40+40)%40;for(let y=20;y<Hh*0.56;y+=40){ctx.fillStyle=`rgba(150,170,255,${0.09*lvl*(y/(Hh*0.56))})`;for(let x=ox;x<W;x+=40)ctx.fillRect(x-1,y-1,2,2);}ctx.restore();
  const hy=Hh*0.6,vx=W/2-camX*0.25;ctx.save();ctx.lineWidth=1;
  const sg=ctx.createLinearGradient(0,hy,0,Hh);sg.addColorStop(0,'rgba(110,140,255,0)');sg.addColorStop(0.3,`rgba(110,140,255,${0.07*lvl})`);sg.addColorStop(1,`rgba(140,170,255,${0.22*lvl})`);ctx.strokeStyle=sg;ctx.beginPath();
  const sh=fract(camX/900);for(let i=-34;i<=34;i++){const k=i-sh;ctx.moveTo(vx+k*12,hy);ctx.lineTo(vx+k*190,Hh+260);}
  const roll=fract(t*0.35);for(let k=0;k<26;k++){const d=k+1-roll,y=hy+230/d;if(y>Hh+2)continue;ctx.moveTo(0,y);ctx.lineTo(W,y);}ctx.stroke();
  const hz=ctx.createLinearGradient(0,0,W,0);hz.addColorStop(0,'rgba(90,140,255,0)');hz.addColorStop(0.5,`rgba(120,180,255,${0.18*lvl})`);hz.addColorStop(1,'rgba(90,140,255,0)');ctx.fillStyle=hz;ctx.fillRect(0,hy-1,W,2);ctx.restore();
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(const p of PARTS){const x=fract(p.x+0.006*Math.sin(t*0.5+p.ph)-camX*0.0003*p.z)*W,y=fract(p.y-t*p.sp)*Hh,a=(0.2+0.55*(0.5+0.5*Math.sin(t*1.7+p.ph*3)))*lvl*p.z;
    if(p.s>1.7){const rg=ctx.createRadialGradient(x,y,0,x,y,p.s*6);rg.addColorStop(0,rgb(p.c,a*0.35));rg.addColorStop(1,rgb(p.c,0));ctx.fillStyle=rg;ctx.fillRect(x-p.s*6,y-p.s*6,p.s*12,p.s*12);}
    ctx.fillStyle=rgb(p.c,a);ctx.beginPath();ctx.arc(x,y,p.s*0.7,0,6.283);ctx.fill();}
  ctx.restore();
}
// bloom: reducción con umbral, dos radios de desenfoque, sumados de vuelta
let BL=null;
function bloom(ctx,amt=1){
  const cv=ctx.canvas;if(!BL)BL={a:H.layer(320,180),b:H.layer(320,180),c:H.layer(160,90)};
  const a=BL.a.getContext('2d'),b=BL.b.getContext('2d'),c=BL.c.getContext('2d');
  a.globalCompositeOperation='copy';a.filter='brightness(0.9) contrast(2.6) saturate(1.4)';a.drawImage(cv,0,0,320,180);a.filter='none';
  b.globalCompositeOperation='copy';b.filter='blur(2.5px)';b.drawImage(BL.a,0,0);b.filter='none';
  c.globalCompositeOperation='copy';c.filter='blur(4px)';c.drawImage(BL.a,0,0,160,90);c.filter='none';
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=0.45*amt;ctx.drawImage(BL.b,0,0,cv.width,cv.height);ctx.globalAlpha=0.5*amt;ctx.drawImage(BL.c,0,0,cv.width,cv.height);ctx.restore();
}

// ---------- piezas ----------
function glowDot(ctx,x,y,col,r,a=1){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgb('#ffffff',a));g.addColorStop(0.16,rgb(col,0.9*a));g.addColorStop(0.45,rgb(col,0.22*a));g.addColorStop(1,rgb(col,0));ctx.fillStyle=g;ctx.fillRect(x-r,y-r,2*r,2*r);}
function ring(ctx,x,y,r,col,a,lw=2){if(a<=0.001)return;ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=rgb(col,a);ctx.lineWidth=lw;ctx.beginPath();ctx.arc(x,y,r,0,6.283);ctx.stroke();ctx.restore();}
// tarjeta oscura translúcida, brillo interior y borde fino degradado
function card(ctx,x,y,w,h,o={}){
  const r=o.r??22,acc=o.acc||[C.cyan,C.violet];ctx.save();ctx.globalAlpha*=o.a??1;
  ctx.shadowColor='rgba(0,0,12,0.6)';ctx.shadowBlur=44;ctx.shadowOffsetY=18;
  const fg=ctx.createLinearGradient(x,y,x,y+h);fg.addColorStop(0,'rgba(22,26,72,0.8)');fg.addColorStop(1,'rgba(8,9,32,0.86)');ctx.fillStyle=fg;rr(ctx,x,y,w,h,r);ctx.fill();ctx.shadowColor='transparent';
  ctx.save();rr(ctx,x,y,w,h,r);ctx.clip();
  const ig=ctx.createRadialGradient(x+w*0.25,y,0,x+w*0.25,y,Math.max(w,h)*0.8);ig.addColorStop(0,rgb(acc[0],0.17));ig.addColorStop(1,rgb(acc[0],0));ctx.fillStyle=ig;ctx.fillRect(x,y,w,h);
  const ig2=ctx.createRadialGradient(x+w,y+h,0,x+w,y+h,Math.max(w,h)*0.7);ig2.addColorStop(0,rgb(acc[1],0.14));ig2.addColorStop(1,rgb(acc[1],0));ctx.fillStyle=ig2;ctx.fillRect(x,y,w,h);ctx.restore();
  const bg=ctx.createLinearGradient(x,y,x+w,y+h);bg.addColorStop(0,rgb(acc[0],0.95));bg.addColorStop(0.4,rgb(acc[1],0.4));bg.addColorStop(0.72,'rgba(255,255,255,0.07)');bg.addColorStop(1,rgb(acc[1],0.6));
  ctx.strokeStyle=bg;ctx.lineWidth=1.5;rr(ctx,x+0.75,y+0.75,w-1.5,h-1.5,r);ctx.stroke();
  const hl=ctx.createLinearGradient(x,0,x+w,0);hl.addColorStop(0,'rgba(255,255,255,0)');hl.addColorStop(0.3,'rgba(200,240,255,0.5)');hl.addColorStop(0.65,'rgba(255,255,255,0)');ctx.strokeStyle=hl;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+r,y+1.5);ctx.lineTo(x+w-r,y+1.5);ctx.stroke();
  if(o.flash>0.01){ctx.globalCompositeOperation='lighter';ctx.strokeStyle=rgb(o.flashCol||C.cyan,o.flash);ctx.lineWidth=3;rr(ctx,x+1,y+1,w-2,h-2,r);ctx.stroke();ctx.save();rr(ctx,x,y,w,h,r);ctx.clip();ctx.fillStyle=rgb(o.flashCol||C.cyan,o.flash*0.08);ctx.fillRect(x,y,w,h);ctx.restore();}
  ctx.restore();
}
// mosaico redondeado con borde degradado e icono de línea brillante que se dibuja
function tile(ctx,cx,cy,s,icon,o={}){
  const a=o.a??1,sc=o.sc??1,col=o.col||[C.cyan,C.violet],glow=o.glow??1,draw=o.draw??1;if(a<=0.003||sc<=0.003)return;
  ctx.save();ctx.translate(cx,cy);ctx.scale(sc,sc);ctx.globalAlpha*=a;const r=s*0.26,h=s/2;
  ctx.save();ctx.globalCompositeOperation='lighter';const hg=ctx.createRadialGradient(0,0,s*0.25,0,0,s*1.15);hg.addColorStop(0,rgb(col[0],Math.min(0.5,0.2*glow)));hg.addColorStop(0.5,rgb(col[1],Math.min(0.25,0.07*glow)));hg.addColorStop(1,rgb(col[1],0));ctx.fillStyle=hg;ctx.fillRect(-s*1.15,-s*1.15,s*2.3,s*2.3);ctx.restore();
  ctx.save();ctx.shadowColor='rgba(0,0,10,0.55)';ctx.shadowBlur=s*0.3;ctx.shadowOffsetY=s*0.1;const bg=ctx.createLinearGradient(0,-h,0,h);bg.addColorStop(0,'#171b4d');bg.addColorStop(1,'#090a28');ctx.fillStyle=bg;rr(ctx,-h,-h,s,s,r);ctx.fill();ctx.restore();
  ctx.save();rr(ctx,-h,-h,s,s,r);ctx.clip();const ig=ctx.createRadialGradient(-h*0.5,-h*0.7,0,-h*0.5,-h*0.7,s);ig.addColorStop(0,rgb(col[0],0.3));ig.addColorStop(1,rgb(col[0],0));ctx.fillStyle=ig;ctx.fillRect(-h,-h,s,s);
  const ig2=ctx.createRadialGradient(h*0.6,h*0.8,0,h*0.6,h*0.8,s*0.8);ig2.addColorStop(0,rgb(col[1],0.26));ig2.addColorStop(1,rgb(col[1],0));ctx.fillStyle=ig2;ctx.fillRect(-h,-h,s,s);
  if(glow>1.05){ctx.fillStyle=rgb(col[0],Math.min(0.25,(glow-1)*0.12));ctx.fillRect(-h,-h,s,s);}ctx.restore();
  const sg=ctx.createLinearGradient(-h,-h,h,h);sg.addColorStop(0,H.rgba(H.mix(col[0],'#ffffff',0.2),1));sg.addColorStop(1,col[1]);ctx.strokeStyle=sg;ctx.lineWidth=Math.max(1.6,s*0.022);rr(ctx,-h+1,-h+1,s-2,s-2,r);ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,0.09)';ctx.lineWidth=1;rr(ctx,-h+6,-h+6,s-12,s-12,r*0.75);ctx.stroke();
  if(draw>0){const icg=ctx.createLinearGradient(-h*0.5,-h*0.5,h*0.5,h*0.5);icg.addColorStop(0,H.rgba(H.mix(col[0],'#ffffff',0.45),1));icg.addColorStop(1,H.rgba(H.mix(col[1],'#ffffff',0.15),1));ctx.strokeStyle=icg;ctx.lineWidth=Math.max(1.8,s*0.042);ctx.lineCap='round';ctx.lineJoin='round';if(draw<1)ctx.setLineDash([draw*s*2.4,1e4]);ctx.beginPath();ICONS[icon](ctx,s*0.3);ctx.stroke();ctx.setLineDash([]);}
  ctx.restore();
}
function pill(ctx,x,y,text,o={}){
  const a=o.a??1;if(a<=0.003)return;const size=o.size||24,col=o.col||[C.cyan,C.violet];
  ctx.save();ctx.globalAlpha*=a;ctx.translate(x,y);ctx.scale(o.sc??1,o.sc??1);ctx.font=F(600,size,UI);
  const tw=ctx.measureText(text).width,dotW=o.dot?size*0.75:0,w=tw+size*1.3+dotW,h=size*1.62;
  ctx.fillStyle=o.fill||'rgba(10,12,42,0.88)';rr(ctx,-w/2,-h/2,w,h,h/2);ctx.fill();
  const g=ctx.createLinearGradient(-w/2,0,w/2,0);g.addColorStop(0,rgb(col[0],0.9));g.addColorStop(1,rgb(col[1],0.7));ctx.strokeStyle=g;ctx.lineWidth=1.4;rr(ctx,-w/2+0.7,-h/2+0.7,w-1.4,h-1.4,h/2);ctx.stroke();
  if(o.dot){ctx.fillStyle=col[0];ctx.beginPath();ctx.arc(-w/2+size*0.75,0,size*0.17,0,6.283);ctx.fill();}
  ctx.fillStyle=o.textCol||C.white;ctx.textBaseline='middle';ctx.textAlign='left';ctx.fillText(text,-w/2+size*0.65+dotW,size*0.04);ctx.restore();
  return w;
}
function gtext(ctx,s,x,y,size,o={}){
  ctx.font=F(o.w||700,size,o.fam);ctx.textAlign='left';ctx.textBaseline='alphabetic';
  const w=ctx.measureText(s).width,x0=o.align==='center'?x-w/2:o.align==='right'?x-w:x,cols=o.cols||GRAD_HEAD,g=ctx.createLinearGradient(x0,y-size,x0+w,y);
  cols.forEach((c,i)=>g.addColorStop(i/(cols.length-1),c));ctx.fillStyle=g;ctx.fillText(s,x0,y);return w;
}
// palabras que suben y aparecen una a una, con un solo degradado en toda la línea
function revealLine(ctx,s,x,y,size,prog,o={}){
  ctx.font=F(o.w||700,size,o.fam);const words=s.split(' '),full=ctx.measureText(s).width,x0=o.align==='center'?x-full/2:x,cols=o.cols||GRAD_HEAD,g=ctx.createLinearGradient(x0,y-size,x0+full,y);
  cols.forEach((c,i)=>g.addColorStop(i/(cols.length-1),c));
  ctx.save();ctx.fillStyle=g;ctx.textAlign='left';ctx.textBaseline='alphabetic';let cx=x0;const n=words.length;
  words.forEach((wd,i)=>{const p=E.out(cl(prog*(n+1.5)-i,0,1)),ww=ctx.measureText(wd+(i<n-1?' ':'')).width;if(p>0){ctx.globalAlpha=p*(o.a??1);ctx.fillText(wd,cx,y+(1-p)*size*0.45);}cx+=ww;});
  ctx.restore();return{x0,w:full};
}
function eyebrow(ctx,s,x,y,o={}){
  const a=o.a??1;if(a<=0.003)return;const size=o.size||18,col=o.col||C.cyan;
  ctx.save();ctx.globalAlpha*=a;ctx.font=F(600,size,UI);ctx.letterSpacing='3px';const w=ctx.measureText(s).width+22,x0=o.align==='center'?x-w/2:x;
  ctx.globalCompositeOperation='lighter';glowDot(ctx,x0+5,y-size*0.36,col,12+size*0.2);ctx.globalCompositeOperation='source-over';
  ctx.fillStyle=col;ctx.beginPath();ctx.arc(x0+5,y-size*0.36,3.2+size*0.06,0,6.283);ctx.fill();
  ctx.fillStyle=rgb(H.mix(col,'#ffffff',0.25),1);ctx.textAlign='left';ctx.fillText(s,x0+22+size*0.15,y);ctx.letterSpacing='0px';ctx.restore();
}
// conectores muestreados + pulsos de luz
function bez(x0,y0,x1,y1,x2,y2,x3,y3,n=48){const P=[];let L=0,px=x0,py=y0;for(let i=0;i<=n;i++){const u=i/n,m=1-u,x=m*m*m*x0+3*m*m*u*x1+3*m*u*u*x2+u*u*u*x3,y=m*m*m*y0+3*m*m*u*y1+3*m*u*u*y2+u*u*u*y3;if(i)L+=Math.hypot(x-px,y-py);P.push({x,y,l:L});px=x;py=y;}P.L=L;return P;}
function ptAt(P,f){const tl=cl(f)*P.L;for(let i=1;i<P.length;i++)if(P[i].l>=tl){const a=P[i-1],b=P[i],k=(tl-a.l)/Math.max(1e-6,b.l-a.l);return{x:lerp(a.x,b.x,k),y:lerp(a.y,b.y,k)};}return P[P.length-1];}
function sub(ctx,P,a,b){a=cl(a);b=cl(b);ctx.beginPath();if(b<=a)return;const s=ptAt(P,a);ctx.moveTo(s.x,s.y);const la=a*P.L,lb=b*P.L;for(const p of P)if(p.l>la&&p.l<lb)ctx.lineTo(p.x,p.y);const e=ptAt(P,b);ctx.lineTo(e.x,e.y);}
function pulseOn(ctx,P,p,col,len=0.16,a=1){ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';const n=8;for(let i=0;i<n;i++){const a0=p-len*(i+1)/n,a1=p-len*i/n;if(a1<=0||a0>=1)continue;ctx.strokeStyle=rgb(col,0.85*a*(1-i/n));ctx.lineWidth=3.4-i*0.3;sub(ctx,P,a0,a1);ctx.stroke();}if(p>=0&&p<=1){const h=ptAt(P,p);glowDot(ctx,h.x,h.y,col,18,a);}ctx.restore();}
function connector(ctx,P,o={}){
  const d=o.draw??1,a=o.a??1;if(d<=0||a<=0.003)return;const c0=(o.col||[])[0]||C.cyan,c1=(o.col||[])[1]||C.violet;
  ctx.save();ctx.globalAlpha*=a;ctx.lineCap='round';const s=P[0],e=P[P.length-1],g=ctx.createLinearGradient(s.x,s.y,e.x,e.y);g.addColorStop(0,rgb(c0,0.75));g.addColorStop(1,rgb(c1,0.75));
  ctx.globalCompositeOperation='lighter';ctx.strokeStyle=rgb(c0,0.08);ctx.lineWidth=9;sub(ctx,P,0,d);ctx.stroke();
  ctx.globalCompositeOperation='source-over';ctx.strokeStyle=g;ctx.lineWidth=o.lw||1.8;sub(ctx,P,0,d);ctx.stroke();
  ctx.fillStyle='#0b0d30';ctx.strokeStyle=c0;ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(s.x,s.y,4,0,6.283);ctx.fill();ctx.stroke();
  if(d>=1){ctx.strokeStyle=c1;ctx.beginPath();ctx.arc(e.x,e.y,4,0,6.283);ctx.fill();ctx.stroke();}
  if(d<1){const hp=ptAt(P,d);ctx.globalCompositeOperation='lighter';glowDot(ctx,hp.x,hp.y,c0,16);}
  ctx.restore();for(const p of o.pulses||[])if(p>0&&p-0.16<d)pulseOn(ctx,P,Math.min(p,d),o.pc||'#9ff0ff',0.16,a);
}

// ---------- piezas del repaso ----------
function balanced(ctx,text,maxW,size,font){
  let best=wrapLines(ctx,text,maxW,size,font,2);if(best.length<2)return best;
  ctx.save();ctx.font=font.replace('SIZE',size);const wd=l=>ctx.measureText(l).width;
  for(let mw=maxW-20;mw>maxW*0.4;mw-=20){const l=wrapLines(ctx,text,mw,size,font,2);if(l.length!==2||wd(l[1])>wd(l[0])||Math.max(wd(l[0]),wd(l[1]))>maxW)break;best=l;}
  ctx.restore();return best;
}
// titular degradado ajustado y centrado en cy; prog revela palabra a palabra
function headline(ctx,text,cx,cy,maxW,size,prog,o={}){
  const font=F(o.w||700,'SIZE',o.fam),lines=balanced(ctx,text,maxW,size,font),fs=fitFont(ctx,lines,maxW,size,font),lh=fs*1.14;let w=0,y=cy-(lines.length-1)*lh/2+fs*0.36;
  lines.forEach((line,i)=>{const r=revealLine(ctx,line,cx,y,fs,cl(prog*lines.length-i),{...o,align:'center'});w=Math.max(w,r.w);y+=lh;});
  return{w,h:lh*lines.length,fs};
}
// tarjeta-pantalla con la ilustración sobre un panel de cristal claro
function picCard(ctx,img,cx,cy,w,h,t,t0){
  const p=ebk(t0,t0+0.5,t);if(p<=0.003)return;
  ctx.save();ctx.translate(cx,cy);ctx.scale(p,p);ctx.globalAlpha=cl(p*2);
  ctx.save();ctx.globalCompositeOperation='lighter';const fg=ctx.createRadialGradient(0,0,0,0,0,w*0.85);fg.addColorStop(0,rgb(C.violet,0.22));fg.addColorStop(1,rgb(C.blue,0));ctx.fillStyle=fg;ctx.fillRect(-w,-h,w*2,h*2);ctx.restore();
  card(ctx,-w/2,-h/2,w,h,{r:24,flash:0.7*bump(t,t0+0.3,4)});
  const iw=w-36,ih=h-36;ctx.save();rr(ctx,-iw/2,-ih/2,iw,ih,14);ctx.clip();
  const pg=ctx.createLinearGradient(0,-ih/2,0,ih/2);pg.addColorStop(0,'#8a95d2');pg.addColorStop(1,'#5a64a8');ctx.fillStyle=pg;ctx.fillRect(-iw/2,-ih/2,iw,ih);
  if(img){const nw=img.naturalWidth||img.width||1,nh=img.naturalHeight||img.height||1,k=Math.min((iw-20)/nw,(ih-20)/nh);ctx.save();ctx.filter='brightness(0.74) saturate(1.25)';ctx.drawImage(img,-nw*k/2,-nh*k/2,nw*k,nh*k);ctx.restore();}
  // barrido de reflejo que cruza el cristal
  const sx=lerp(-iw,iw,fract((t-t0)*0.25)),sg=ctx.createLinearGradient(sx-60,-ih/2,sx+60,ih/2);sg.addColorStop(0,'rgba(255,255,255,0)');sg.addColorStop(0.5,'rgba(255,255,255,0.28)');sg.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=sg;ctx.fillRect(-iw/2,-ih/2,iw,ih);
  ctx.restore();ctx.strokeStyle=rgb(C.cyan,0.55);ctx.lineWidth=1.5;rr(ctx,-iw/2,-ih/2,iw,ih,14);ctx.stroke();
  ctx.restore();
}
// insignia de «correcto»: disco verde, palomita blanca, onda de choque
function okBadge(ctx,x,y,t,t0,R=36){
  const p=ebk(t0,t0+0.35,t);if(p<=0.003)return;const b=bump(t,t0,3);
  ring(ctx,x,y,R+(1-b)*70,C.green,0.8*b,3);
  ctx.save();ctx.translate(x,y);ctx.scale(p,p);ctx.globalCompositeOperation='lighter';glowDot(ctx,0,0,C.green,R*2.2,0.5);ctx.globalCompositeOperation='source-over';
  ctx.fillStyle=H.rgba(H.mix(C.green,'#0a0b2a',0.55),1);ctx.beginPath();ctx.arc(0,0,R,0,6.283);ctx.fill();ctx.strokeStyle=C.green;ctx.lineWidth=2.5;ctx.stroke();
  ctx.strokeStyle='#ffffff';ctx.lineWidth=R*0.16;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ICONS.check(ctx,R*0.8);ctx.stroke();ctx.restore();
}
// ecualizador: barras degradadas que bailan con el audio
function eq(ctx,x,y,w,h,t,a,seed){
  const nz=H.makeNoise(seed),n=11,bw=w/n*0.56;ctx.save();ctx.globalAlpha*=a;
  for(let i=0;i<n;i++){const env=Math.sin((i+0.5)/n*Math.PI),v=0.18+0.82*env*(0.5+0.5*nz.n2(t*3.2,i*0.7)),bh=h*v,bx=x+i*w/n+(w/n-bw)/2;
    const g=ctx.createLinearGradient(0,y-bh/2,0,y+bh/2);g.addColorStop(0,C.cyan);g.addColorStop(1,C.violet);ctx.fillStyle=g;rr(ctx,bx,y-bh/2,bw,bh,bw/2);ctx.fill();}
  ctx.restore();
}
// cuenta atrás: anillo de progreso degradado con cabeza brillante y número que cuenta
function countdown(ctx,cx,cy,t,think,label){
  const dur=think[1]-think[0],pp=cl((t-think[0])/dur),left=Math.max(1,Math.ceil(dur*(1-pp)-1e-6)),ch=think[0]+Math.max(0,dur-left),inA=eo(think[0],think[0]+0.35,t),R=132;
  ctx.save();ctx.globalAlpha*=inA;
  ctx.save();ctx.globalCompositeOperation='lighter';const fg=ctx.createRadialGradient(cx,cy,0,cx,cy,260);fg.addColorStop(0,rgb(C.blue,0.22));fg.addColorStop(1,rgb(C.violet,0));ctx.fillStyle=fg;ctx.fillRect(cx-260,cy-260,520,520);ctx.restore();
  ctx.strokeStyle='rgba(120,140,255,0.16)';ctx.lineWidth=12;ctx.beginPath();ctx.arc(cx,cy,R,0,6.283);ctx.stroke();
  for(let i=0;i<60;i++){const a=-Math.PI/2+i/60*6.283,l=i%5?6:14;ctx.strokeStyle=rgb(C.muted,i%5?0.25:0.5);ctx.lineWidth=i%5?1:2;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*(R+18),cy+Math.sin(a)*(R+18));ctx.lineTo(cx+Math.cos(a)*(R+18+l),cy+Math.sin(a)*(R+18+l));ctx.stroke();}
  const a0=-Math.PI/2+pp*6.283,a1=-Math.PI/2+6.283,lg=ctx.createLinearGradient(cx-R,cy-R,cx+R,cy+R);lg.addColorStop(0,C.cyan);lg.addColorStop(1,C.violet);
  ctx.strokeStyle=lg;ctx.lineWidth=8;ctx.lineCap='round';ctx.beginPath();ctx.arc(cx,cy,R,a0,a1);ctx.stroke();
  ctx.globalCompositeOperation='lighter';glowDot(ctx,cx+Math.cos(a0)*R,cy+Math.sin(a0)*R,C.cyan,30);ring(ctx,cx,cy,R*0.62+(1-bump(t,ch,4))*60,C.cyan,0.4*bump(t,ch,4),2);ctx.globalCompositeOperation='source-over';
  ctx.save();ctx.translate(cx,cy+56);const k=1+0.1*bump(t,ch,7);ctx.scale(k,k);gtext(ctx,String(left),0,0,164,{align:'center',cols:bump(t,ch,5)>0.3?['#ffffff','#c4f8ff','#a8ffe4']:GRAD_NUM});ctx.restore();
  ctx.font=F(600,44,UI);ctx.fillStyle='#d8defc';ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.globalAlpha*=eo(think[0]+0.15,think[0]+0.5,t);ctx.fillText(label,cx,cy+R+96);
  ctx.restore();
}

function drawBeat(ctx,W,Hh,t,S,beat){
  const local=t-beat.t0,t0=beat.t0,sway=()=>{ctx.translate(W/2,Hh/2);const k=1.02-0.02*eo(t0,t0+3,t);ctx.scale(k,k);ctx.translate(-W/2+4*Math.sin(t*0.55),-Hh/2+3*Math.cos(t*0.47));};
  ctx.save();sway();
  if(beat.kind==='title'){
    eyebrow(ctx,'TU REPASO DIARIO',90,170,{a:eo(t0+0.2,t0+0.6,t),size:30});
    headline(ctx,`REPASO · CLASE ${beat.classNumber}`,90+300,250,600,70,seg(t0+0.35,t0+1.1,t));
    ctx.save();ctx.globalAlpha=eo(t0+1.0,t0+1.5,t);ctx.font=F(600,44,UI);const fs=fitFont(ctx,[beat.unitTitle||''],600,44,F(600,'SIZE',UI));ctx.font=F(600,fs,UI);ctx.fillStyle='#b3bbec';ctx.textAlign='center';ctx.fillText(beat.unitTitle||'',390,340+(1-eo(t0+1.0,t0+1.5,t))*10);ctx.restore();
    const pa=eo(t0+1.6,t0+2.0,t);pill(ctx,390,440,'¿Cuánto recuerdas?',{size:38,a:pa,sc:0.9+0.1*pa,dot:true,col:[C.cyan,C.magenta]});
    if(S.assets.scene){const P=bez(700,440,730,440,760,330,790,330);connector(ctx,P,{draw:eio(t0+1.6,t0+2.1,t),pulses:t>t0+2.1?[fract((t-t0-2.1)*0.6)]:[]});picCard(ctx,S.assets.scene,1000,330,400,300,t,t0+0.6);}
  }else if(beat.kind==='end'){
    headline(ctx,'¡Muy bien!',640,210,900,110,seg(t0+0.15,t0+0.7,t));
    const ca=eo(t0+0.7,t0+1.1,t);
    if(ca>0){ctx.save();ctx.globalAlpha=ca;const v=Math.round(beat.total*E.out(seg(t0+0.8,t0+1.8,t))),done=bump(t,t0+1.8,4);
      ctx.font=F(700,84,HEAD);const wN=ctx.measureText(String(beat.total)).width;ctx.font=F(600,44,UI);const sE=' frases repasadas',wE=ctx.measureText(sE).width,x0=640-(wN+wE)/2;
      if(done>0.02){ctx.globalCompositeOperation='lighter';glowDot(ctx,x0+wN/2,320,C.cyan,200,0.3*done);ctx.globalCompositeOperation='source-over';}
      gtext(ctx,String(v),x0+wN,350,84,{align:'right',cols:done>0.05?['#ffffff','#b6f6ff','#c3b2ff']:GRAD_NUM});ctx.font=F(600,44,UI);ctx.fillStyle='#d8defc';ctx.textAlign='left';ctx.fillText(sE,x0+wN,350);ctx.restore();}
    ctx.save();ctx.globalAlpha=eo(t0+1.5,t0+2.0,t);ctx.font=F(600,42,UI);ctx.fillStyle='#b8c0f0';ctx.textAlign='center';ctx.fillText('Mañana vuelven: ¡no las sueltes!',640,450+(1-eo(t0+1.5,t0+2,t))*14);ctx.restore();
    const ul=eio(t0+2.0,t0+2.4,t);if(ul>0){const hw=330*ul,ug=ctx.createLinearGradient(310,0,970,0);ug.addColorStop(0,rgb(C.cyan,0));ug.addColorStop(0.3,C.cyan);ug.addColorStop(0.7,C.violet);ug.addColorStop(1,rgb(C.violet,0));ctx.save();ctx.strokeStyle=ug;ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(640-hw,478);ctx.lineTo(640+hw,478);ctx.stroke();ctx.globalCompositeOperation='lighter';glowDot(ctx,640+hw,478,C.cyan,20,1-ul*0.6);glowDot(ctx,640-hw,478,C.violet,20,1-ul*0.6);ctx.restore();}
    const P=bez(560,590,600,590,680,590,720,590,12);const p1=ebk(t0+0.4,t0+0.85,t),p2=ebk(t0+0.6,t0+1.05,t);
    connector(ctx,P,{draw:eio(t0+0.6,t0+1.0,t),col:[C.cyan,C.green],pulses:t>t0+1.2?[0,1].map(k=>fract((t-t0-1.2)*0.8+k*0.5)):[],pc:'#b8fff0'});
    tile(ctx,500,590,100,'chat',{sc:p1,a:cl(p1*2),col:[C.cyan,C.blue],glow:1.4+1.2*bump(t,t0+0.65,4)});tile(ctx,780,590,100,'check',{sc:p2,a:cl(p2*2),col:[C.cyan,C.green],glow:1.5+1.6*bump(t,t0+1.8,3)+0.3*Math.sin(t*3)});
  }else{
    const {think,reveal}=beatTimes(beat),item=beat.item,img=S.assets.picture(item.picture),listen=beat.kind==='listen';
    const cx=img?420:620,maxW=img?640:940;
    eyebrow(ctx,listen?'ESCUCHA':'¿CÓMO SE DICE?',56,86,{a:eo(t0+0.1,t0+0.45,t),size:40,col:listen?C.cyan:C.magenta});
    pill(ctx,1180,72,`${beat.number} / ${beat.total}`,{size:32,a:eo(t0+0.2,t0+0.5,t),col:[C.cyan,C.violet]});
    if(img)picCard(ctx,img,980,350,320,320,t,t0+0.35);
    if(t<think[0]){
      if(listen){
        const p=ebk(t0+0.3,t0+0.8,t),tx=cx-120;
        for(let i=0;i<2;i++){const q=fract((t-t0)*0.8+i*0.5);ring(ctx,tx,330,90+q*120,i?C.violet:C.cyan,0.35*(1-q)*p,2);}
        tile(ctx,tx,330,170,'speaker',{sc:p,a:cl(p*2),glow:1.5+1.8*bump(t,t0+0.6,4)+0.4*Math.sin(t*3),draw:eo(t0+0.4,t0+1.1,t)});
        eq(ctx,tx+130,330,240,150,t,eo(t0+0.7,t0+1.1,t),beat.index+5);
        if(img){const P=bez(tx+390,330,tx+440,330,760,350,815,350);connector(ctx,P,{draw:eio(t0+0.9,t0+1.3,t),pulses:t>t0+1.3?[0,1].map(k=>fract((t-t0-1.3)*0.7+k*0.5)):[]});}
      }else{
        card(ctx,cx-maxW/2-30,170,maxW+60,300,{a:eo(t0+0.2,t0+0.5,t)});
        eyebrow(ctx,'EN ESPAÑOL',cx-maxW/2,224,{a:eo(t0+0.3,t0+0.6,t),size:28,col:C.violet});
        headline(ctx,item.es,cx,340,maxW-20,78,seg(t0+0.35,t0+1.0,t));
      }
    }else if(t<reveal[0]){
      countdown(ctx,cx,290,t,think,listen?'¿Qué significa?':'¡Dilo en voz alta!');
    }else{
      const r0=reveal[0],hitB=bump(t,r0,3.2);
      card(ctx,cx-maxW/2-30,150,maxW+60,370,{a:eo(r0,r0+0.25,t),flash:0.9*hitB,acc:[C.green,C.cyan],flashCol:C.green});
      eyebrow(ctx,listen?'SIGNIFICA':inLanguageLabel(),cx-maxW/2,204,{a:eo(r0,r0+0.3,t),size:28,col:C.green});
      if(t>r0)for(let i=0;i<2;i++){const q=1-bump(t,r0+i*0.12,2.5);ring(ctx,cx,320,80+q*300,i?C.violet:C.cyan,0.6*(1-q),3);}
      ctx.save();ctx.translate(cx,320);const k=1+0.08*hitB;ctx.scale(k,k);ctx.translate(-cx,-320);
      if(hitB>0.02){ctx.save();ctx.globalCompositeOperation='lighter';glowDot(ctx,cx,310,C.cyan,300,0.3*hitB);ctx.restore();}
      let main;
      if(listen){
        main=headline(ctx,item.es,cx,305,maxW-20,80,seg(r0,r0+0.5,t),{cols:GRAD_OK});
        headline(ctx,item.ko,cx,305+main.h/2+66,maxW-20,58,seg(r0+0.75,r0+1.1,t),{cols:GRAD_HEAD});
      }else{
        main=headline(ctx,item.ko,cx,300,maxW-20,112,seg(r0,r0+0.4,t),{cols:GRAD_OK});
        ctx.save();ctx.globalAlpha=eo(r0+0.6,r0+0.9,t);ctx.font=F(600,42,UI);const fs=fitFont(ctx,[item.es],maxW-20,42,F(600,'SIZE',UI));ctx.font=F(600,fs,UI);ctx.fillStyle='#d8defc';ctx.textAlign='center';ctx.fillText(item.es,cx,300+main.h/2+58);ctx.restore();
      }
      ctx.restore();
      if(img)okBadge(ctx,830,200,t,r0+0.5,40);else okBadge(ctx,Math.min(cx+main.w/2+70,cx+maxW/2+10),300-main.h/2,t,r0+0.5);
    }
  }
  ctx.restore();
}

export default {
  id:'techglow',
  name:'Neón tecnológico',
  fonts:['700 80px "Space Grotesk"','600 26px "Inter"','400 22px "Inter"'],
  fontCss:'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Space+Grotesk:wght@400;700&display=block',
  readsPixels:false,
  frame(ctx,W,Hh,t,S){
    const tr=S.prev&&S.local<TR,u=tr?S.local/TR:1;
    // la cámara se desplaza un poco por cada escena; en el cambio, la rejilla y los brillos se deslizan
    const camX=(S.beat.index-(tr?1-E.inOut(u):0))*260+20*S.local;
    background(ctx,W,Hh,t,camX,0.45+0.55*eo(0,0.8,t));
    if(tr){
      // empujón de cámara a través de la escena anterior: escala, estelas de velocidad y destello
      if(u<0.5){const z=1+3*E.in(u*2);ctx.save();ctx.globalAlpha=1-u*2;ctx.translate(640,330);ctx.scale(z,z);ctx.translate(-640,-330);drawBeat(ctx,W,Hh,S.prev.t1-0.001,S,S.prev);ctx.restore();}
      else{const v=(u-0.5)*2,z=0.86+0.14*E.out(v);ctx.save();ctx.globalAlpha=v;ctx.translate(640,330);ctx.scale(z,z);ctx.translate(-640,-330);drawBeat(ctx,W,Hh,t,S,S.beat);ctx.restore();}
      const st=Math.sin(Math.PI*u),zp=E.in(Math.min(1,u*1.4));
      ctx.save();ctx.globalCompositeOperation='lighter';const r=H.rng(5+S.beat.index);
      for(let i=0;i<46;i++){const ang=r()*6.283,r0=60+r()*200+zp*400,len=80+r()*260*(0.3+zp),c=r.pick([C.cyan,C.violet,C.blue]),x0=640+Math.cos(ang)*r0,y0=330+Math.sin(ang)*r0,x1=640+Math.cos(ang)*(r0+len),y1=330+Math.sin(ang)*(r0+len),g=ctx.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,rgb(c,0));g.addColorStop(1,rgb(c,0.5*st));ctx.strokeStyle=g;ctx.lineWidth=1+r()*2;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();}
      glowDot(ctx,640,330,C.cyan,700,0.5*Math.exp(-Math.pow((u-0.5)/0.17,2)));ctx.restore();
    }else drawBeat(ctx,W,Hh,t,S,S.beat);
    bloom(ctx,1);
    H.vignette(ctx,W,Hh,0.45,'2,3,16');
  },
  score(k,timeline){
    // diseño limpio de motion graphics: whoosh suave, blips de cristal, ticks digitales; discreto bajo la voz
    const whoosh=(t,dur,g=1,top=1500,minor=true)=>k.noise(t,{dur,color:'pink',filter:'bandpass',f:[[0,260],[dur*0.55,top],[dur,420]],q:0.8,gain:0.16*g,a:dur*0.5,verb:0.2,minor});
    const glass=(t,f,g=1,o={})=>{k.tone(t,{f,dur:0.5,gain:0.13*g,a:0.003,verb:0.35,pan:o.pan||0,minor:o.minor});k.tone(t,{f:k.hz(f)*2,dur:0.18,gain:0.035*g,a:0.002,verb:0.3,pan:o.pan||0,minor:o.minor});k.tone(t,{f:k.hz(f)/2,type:'triangle',dur:0.12,gain:0.08*g,a:0.002,pan:o.pan||0,minor:o.minor});};
    const tick=(t,g=1,f=1700)=>{k.noise(t,{dur:0.016,filter:'bandpass',f,q:3,gain:0.36*g,a:0.001,pan:0.15,minor:true});k.tone(t,{f:f*0.55,dur:0.035,gain:0.065*g,a:0.001,pan:0.15,minor:true});};
    for(const beat of timeline.beats){
      const t0=beat.t0;
      if(beat.index){whoosh(t0-0.05,0.75,1.1,1700);k.play('thud',t0+TR/2,{f:85,gain:0.3,minor:true});}
      if(beat.kind==='title'){whoosh(0.2,0.6,0.7,1300);glass(0.62,'A4',0.9,{pan:0.4});glass(1.62,'E5',0.6,{minor:true});continue;}
      if(beat.kind==='end'){glass(t0+0.5,'E4',0.8,{pan:-0.3});glass(t0+0.75,'A4',0.8,{pan:0.3});
        for(let n=1;n<=beat.total;n++){const s=t0+0.8+(1-Math.cbrt(1-n/beat.total))*1.0;tick(s,0.9,1600);}
        ['A3','E4','A4','C#5'].forEach((n,i)=>k.tone(t0+1.8+i*0.03,{f:n,type:i?'sine':'triangle',dur:1.7,gain:0.08,a:0.015,verb:0.45,pan:(i-1.5)*0.25}));
        k.noise(t0+2.0,{dur:0.4,filter:'bandpass',f:[[0,900],[0.4,1800]],q:1.2,gain:0.05,a:0.2,minor:true});continue;}
      const {think,reveal}=beatTimes(beat),dur=think[1]-think[0];
      glass(t0+0.45,beat.kind==='listen'?'E4':'C5',0.6,{pan:-0.3,minor:true});
      whoosh(think[0],0.35,0.5,1200);
      for(let n=Math.ceil(dur-1e-6);n>=1;n--){const s=think[0]+Math.max(0,dur-n);tick(s,0.9,n===1?1500:1700);}
      glass(reveal[0]+0.02,'C5',0.9,{pan:0.3});glass(reveal[0]+0.1,'G5',0.8,{pan:0.3});glass(reveal[0]+0.18,'C6',0.4,{pan:0.3,minor:true});
      k.tone(reveal[0],{f:[[0,72],[0.6,38]],dur:0.9,gain:0.35,a:0.004,minor:true});
    }
  },
};
