// Estilo «Teatro de sombras»: siluetas negras recortadas con calado de encaje,
// juntas con pasador y varillas finas, apoyadas en una tela retroiluminada por un
// candil (ámbar en la llama, rojo-pardo en los bordes) con gelatinas de color en
// los huecos. Técnicas del paquete: capa por títere con agujeros destination-out,
// gelatinas en multiply, varillas desenfocadas, tela tejida, luz difusa, grano a
// 12 fps, cortinas de encaje y candil que baja y sube para cambiar de escena.
import {beatTimes,fitFont,wrapLines} from './shared.js';

const H=window.H,TAU=Math.PI*2,INK='rgb(20,8,4)';
const HANGUL='"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif';
const FF=`"IM Fell English",${HANGUL}`,NF=`"Libre Baskerville",${HANGUL}`;
const NZ=H.makeNoise(4242),sm=H.smooth,cl=H.clamp,lerp=H.lerp,EO=H.ease.out,EIO=H.ease.inOut;
const TR=0.7; // duración del cambio de escena
const LAY={};
function lay(name,w,h){let c=LAY[name];if(!c)c=LAY[name]=H.layer(w,h);const x=c.getContext('2d');x.setTransform(1,0,0,1,0,0);x.globalCompositeOperation='source-over';x.globalAlpha=1;x.filter='none';x.clearRect(0,0,c.width,c.height);return c;}

// ---------- ayudas de recorte ----------
function cut(p,fn){p.save();p.globalCompositeOperation='destination-out';p.fillStyle='#000';p.strokeStyle='#000';fn();p.restore();}
function dot(c,x,y,r){c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}
function tear(c,x,y,len,w,a){c.save();c.translate(x,y);c.rotate(a);c.beginPath();c.moveTo(0,-w/2);c.quadraticCurveTo(len*0.55,-w*0.45,len,0);c.quadraticCurveTo(len*0.55,w*0.45,0,w/2);c.arc(0,0,w/2,Math.PI/2,Math.PI*1.5);c.fill();c.restore();}
function pin(p,x,y,r=8){cut(p,()=>dot(p,x,y,r));p.fillStyle=INK;dot(p,x,y,r*0.55);}
const both=(cs,fn)=>cs.forEach(fn);
const wpt=(p,x,y)=>{const q=p.getTransform().transformPoint(new DOMPoint(x,y));return[q.x,q.y];};
const swing=(t,t0,amp,k,w)=>(t>t0?amp*Math.exp(-(t-t0)*k)*Math.sin((t-t0)*w):0);
const blinkAt=(t,list)=>list.reduce((m,b)=>Math.max(m,1-Math.abs((t-b)/0.08)),0);

// ---------- ciclo de cada cuadro: luz -> gelatinas -> siluetas -> tela, difusión y grano ----------
function begin(W,Hh){return{W,Hh,S:lay('S',W,Hh),G:lay('G',W,Hh),rods:[]};}
function pup(st,o,fn){
  const P=lay('P',st.W,st.Hh),p=P.getContext('2d'),g=st.G.getContext('2d');p.fillStyle=INK;p.strokeStyle=INK;
  g.save();fn(p,g,st.rods);g.restore();
  const s=st.S.getContext('2d');s.save();s.globalAlpha=o.alpha==null?1:o.alpha;if(o.blur)s.filter=`blur(${o.blur}px)`;s.drawImage(P,0,0);s.restore();
}
const STOPS=[[0,[255,232,168]],[0.16,[255,200,104]],[0.42,[238,132,46]],[0.68,[168,60,20]],[0.88,[84,24,9]],[1,[38,10,4]]];
function lamp(ctx,W,Hh,t,b,flare=0){
  const f=1+0.045*NZ.n2(t*6.1,0.3)+0.025*NZ.n2(t*17.3,2.2),B=Math.max(0,b*f),cx=640+NZ.n2(t*0.9,5)*12,cy=320+NZ.n2(7,t*0.8)*9;
  ctx.fillStyle='#000';ctx.fillRect(0,0,W,Hh);
  const g=ctx.createRadialGradient(cx,cy,0,cx,cy,860+flare*200);
  STOPS.forEach(([o,c])=>g.addColorStop(o,H.rgba(c.map(v=>Math.min(255,v*B+(255-v)*flare*0.7)),1)));
  ctx.fillStyle=g;ctx.fillRect(0,0,W,Hh);
}
function weave(W,Hh){
  if(LAY._weave)return LAY._weave;
  const c=H.layer(W,Hh),x=c.getContext('2d'),img=x.createImageData(W,Hh),d=img.data,r=H.rng(77);
  const row=Float32Array.from({length:Hh},()=>0.6+r()*0.8),col=Float32Array.from({length:W},()=>0.6+r()*0.8);
  for(let y=0;y<Hh;y++)for(let X=0;X<W;X++){const i=(y*W+X)*4,th=(y%3===0?1:y%3===1?0.35:0)*row[y]*(0.7+0.3*Math.sin(X*0.05+row[y]*9)),tv=(X%3===0?1:X%3===1?0.3:0)*col[X]*(0.7+0.3*Math.sin(y*0.043+col[X]*7)),v=255*(1-0.075*th-0.06*tv);d[i]=v;d[i+1]=v*0.985;d[i+2]=v*0.97;d[i+3]=255;}
  x.putImageData(img,0,0);
  const f=H.layer(160,90),fx=f.getContext('2d'),fi=fx.createImageData(160,90);
  for(let y=0;y<90;y++)for(let X=0;X<160;X++){const v=255*(1-0.07*(0.5+0.5*NZ.fbm2(X*0.05,y*0.012,3))-0.03*(0.5+0.5*NZ.n2(X*0.4,y*0.2))),i=(y*160+X)*4;fi.data[i]=fi.data[i+1]=fi.data[i+2]=v;fi.data[i+3]=255;}
  fx.putImageData(fi,0,0);
  x.globalCompositeOperation='multiply';x.imageSmoothingEnabled=true;x.drawImage(f,0,0,W,Hh);
  x.fillStyle='rgba(200,190,180,1)';x.fillRect(214,0,2,Hh);x.fillStyle='rgba(232,226,220,1)';x.fillRect(211,0,7,Hh);
  LAY._weave=c;return c;
}
function grainTile(k){const key='_grain'+k;if(LAY[key])return LAY[key];const c=H.layer(256,256),x=c.getContext('2d'),img=x.createImageData(256,256),r=H.rng(900+k);for(let i=0;i<img.data.length;i+=4){const w=r()<0.5?0:255;img.data[i]=img.data[i+1]=img.data[i+2]=w;img.data[i+3]=r()*26;}x.putImageData(img,0,0);LAY[key]=c;return c;}
function end(ctx,st,t){
  const {W,Hh}=st;
  if(st.rods.length){
    const R=lay('R',W,Hh),r=R.getContext('2d');r.strokeStyle=INK;r.fillStyle=INK;r.lineCap='round';
    st.rods.forEach(([x,y,w,a])=>{r.globalAlpha=a==null?1:a;r.lineWidth=w||3.2;r.beginPath();r.moveTo(x,y);r.lineTo(x+(x-640)*0.14+18,Hh+40);r.stroke();dot(r,x,y,(w||3.2)*1.2);});
    r.globalAlpha=1;const s=st.S.getContext('2d');s.save();s.filter='blur(1.3px)';s.globalAlpha=0.9;s.drawImage(R,0,0);s.restore();
  }
  ctx.save();ctx.globalCompositeOperation='multiply';ctx.drawImage(st.G,0,0);ctx.restore();
  ctx.save();ctx.filter='blur(0.7px)';ctx.globalAlpha=0.97;ctx.drawImage(st.S,0,0);ctx.restore();
  ctx.save();ctx.globalCompositeOperation='multiply';ctx.drawImage(weave(W,Hh),0,0);ctx.restore();
  // la luz se difunde por la tela: brillo que sangra en las sombras y alrededor de los calados
  const hl=lay('half',W/4,Hh/4),hx=hl.getContext('2d');hx.filter='blur(5px)';hx.drawImage(ctx.canvas,0,0,W/4,Hh/4);
  ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=0.13;ctx.drawImage(hl,0,0,W,Hh);ctx.restore();
  // grano que cambia a 12 fps
  const fr=Math.floor(t*12),gt=grainTile(fr%3),gr=H.rng(fr+5);
  ctx.save();ctx.fillStyle=ctx.createPattern(gt,'repeat');ctx.translate(-gr()*256,-gr()*256);ctx.fillRect(0,0,W+256,Hh+256);ctx.restore();
  H.vignette(ctx,W,Hh,0.38,'20,5,2');
}

// ---------- mobiliario del escenario (en caché) ----------
function valance(W){
  if(LAY._val)return LAY._val;const c=H.layer(W,80),p=c.getContext('2d');p.fillStyle=INK;p.strokeStyle=INK;p.fillRect(0,0,W,14);
  for(let x=-16;x<W+32;x+=32){p.beginPath();p.arc(x+16,13,16,0,Math.PI);p.fill();}
  for(let x=32;x<W;x+=64){p.fillRect(x-1,20,2,22);tear(p,x,40,18,9,Math.PI/2);dot(p,x,40,5);}
  cut(p,()=>{for(let x=8;x<W;x+=12)dot(p,x,6,1.8);for(let x=-16;x<W+32;x+=32){dot(p,x+16,20,3.2);tear(p,x+10,17,7,3.4,2.4);tear(p,x+22,17,7,3.4,0.74);}});
  LAY._val=c;return c;
}
function ground(W){
  if(LAY._gnd)return LAY._gnd;const c=H.layer(W,110),p=c.getContext('2d'),r=H.rng(31);p.fillStyle=INK;p.strokeStyle=INK;p.fillRect(0,96,W,14);
  for(let x=-10;x<W+10;x+=5+r()*6){const h=14+r()*34*(0.6+0.4*Math.sin(x*0.013)**2),lean=(r()-0.5)*22,w=2+r()*2.5;p.beginPath();p.moveTo(x-w,100);p.quadraticCurveTo(x+lean*0.3,100-h*0.6,x+lean,100-h);p.quadraticCurveTo(x+lean*0.3+w*0.6,100-h*0.55,x+w,100);p.fill();}
  p.lineCap='round';
  for(let x=60;x<W;x+=150+r()*90){const dir=r()<0.5?-1:1,h=40+r()*26;p.lineWidth=3;p.beginPath();p.moveTo(x,100);p.quadraticCurveTo(x+dir*6,100-h*0.6,x+dir*2,100-h);for(let a=0;a<5.5;a+=0.3){const rr=10*(1-a/6.2);p.lineTo(x+dir*(2+10-Math.cos(a)*rr),100-h-Math.sin(a)*rr);}p.stroke();for(let k=1;k<4;k++)tear(p,x+dir*3,100-h*k/4.2,14,6,dir>0?-0.5:Math.PI+0.5);}
  for(let x=140;x<W;x+=260+r()*120){const h=50+r()*20;p.lineWidth=2;p.beginPath();p.moveTo(x,100);p.quadraticCurveTo(x+8,100-h/2,x+3,100-h);p.stroke();for(let k=0;k<6;k++)tear(p,x+3,100-h,11,6,k*TAU/6);cut(p,()=>dot(p,x+3,100-h,2.4));}
  LAY._gnd=c;return c;
}
// helecho sostenido junto al candil: sombra enorme y muy blanda (sprite desenfocado en caché)
function fernShape(p){p.fillStyle=INK;p.strokeStyle=INK;p.lineWidth=10;p.lineCap='round';p.beginPath();p.moveTo(0,0);p.quadraticCurveTo(40,-200,10,-360);p.stroke();for(let k=1;k<13;k++){const q=k/13,y=-q*340,x=40*Math.sin(q*2.4)-4;tear(p,x,y,110*(1-q*0.6),34*(1-q*0.5),0.2-q*0.3);tear(p,x,y,90*(1-q*0.6),30*(1-q*0.5),Math.PI-0.4+q*0.2);}}
function nearFern(st,t,a){
  if(!LAY._fern){const c=H.layer(380,520),x=c.getContext('2d'),raw=H.layer(380,520),rx=raw.getContext('2d');rx.translate(170,440);fernShape(rx);x.filter='blur(7px)';x.drawImage(raw,0,0);LAY._fern=c;}
  const s=st.S.getContext('2d');s.save();s.globalAlpha=a;s.translate(-60,800);s.rotate(0.62+Math.sin(t*0.8)*0.03);s.drawImage(LAY._fern,-170,-440);s.restore();
}
function stage(st){const s=st.S.getContext('2d');s.drawImage(valance(st.W),0,0);s.drawImage(ground(st.W),0,st.Hh-110);}

// ---------- títeres y piezas ----------
// urraca (까치) mecánica: cola de lágrimas, vientre de encaje, ala con pasador, ojo con gelatina. o: x,y (patas) s wing head tilt look blink
function magpie(p,g,o,rods){
  both([p,g],c=>{c.save();c.translate(o.x,o.y);c.rotate(o.tilt||0);c.scale(o.s,o.s);});
  p.fillStyle=INK;p.strokeStyle=INK;
  [[-0.18,190,34],[0.02,214,30],[0.2,176,26]].forEach(([a,l,w])=>tear(p,-60,-92,l,w,Math.PI+0.42+a));
  cut(p,()=>[[-0.18,190],[0.02,214],[0.2,176]].forEach(([a,l])=>{for(let k=1;k<6;k++){const d=k*l/7+10;dot(p,-60+Math.cos(Math.PI+0.42+a)*d,-92+Math.sin(Math.PI+0.42+a)*d,2.6);}}));
  p.fillRect(-14,-62,9,58);p.fillRect(14,-62,9,58);
  for(const fx of [-10,18])[0.2,1.3,2.8].forEach(a=>tear(p,fx,-4,22,7,a));
  p.beginPath();p.ellipse(0,-110,92,62,-0.18,0,TAU);p.fill();
  cut(p,()=>{for(let row=0;row<3;row++){const n=5-row;for(let k=0;k<n;k++)tear(p,8+(k-(n-1)/2)*20,-92+row*16,12,7,Math.PI/2);}for(let i=0;i<26;i++){const a=i/26*TAU;dot(p,10+Math.cos(a)*70,-112+Math.sin(a)*44,2.6);}});
  g.fillStyle='rgb(90,150,230)';g.beginPath();g.ellipse(8,-78,46,22,0,0,TAU);g.fill();
  // cabeza con pasador
  both([p,g],c=>{c.save();c.translate(64,-150);c.rotate(o.head||0);});
  p.fillStyle=INK;dot(p,22,-18,38);p.beginPath();p.moveTo(52,-30);p.lineTo(98,-16);p.lineTo(52,-6);p.closePath();p.fill();
  cut(p,()=>{dot(p,28,-24,12);for(let k=0;k<9;k++){const a=-2.6+k*0.32;dot(p,22+Math.cos(a)*30,-18+Math.sin(a)*30,2);}});
  g.fillStyle='rgb(255,206,90)';dot(g,28,-24,13);
  const lk=o.look||[0,0];p.fillStyle=INK;dot(p,28+lk[0]*4,-24+lk[1]*4,5.5);
  if(o.blink>0){p.save();p.beginPath();p.arc(28,-24,13,0,TAU);p.clip();p.fillRect(14,-38,28,28*o.blink);p.restore();}
  pin(p,0,0,8);
  both([p,g],c=>c.restore());
  // ala con pasador en el hombro
  both([p,g],c=>{c.save();c.translate(-6,-128);c.rotate(-(o.wing||0));});
  p.fillStyle=INK;p.beginPath();p.moveTo(-10,-10);p.bezierCurveTo(-60,-30,-140,-10,-170,30);p.bezierCurveTo(-120,40,-60,50,-6,24);p.closePath();p.fill();
  cut(p,()=>{[[-40,4,22],[-78,8,24],[-116,14,22],[-150,24,16]].forEach(([x,y,l])=>tear(p,x,y+10,l,8,Math.PI/2+0.6));p.lineWidth=2;p.beginPath();p.moveTo(-14,4);p.bezierCurveTo(-60,-6,-110,6,-160,26);p.stroke();});
  pin(p,0,0,8);
  if(rods)rods.push([...wpt(p,-150,22),2.6]);
  both([p,g],c=>c.restore());
  if(rods)rods.push([...wpt(p,0,-70),3.6]);
  both([p,g],c=>c.restore());
}
// cartel con letras recortadas colgado de un cordel; devuelve su ancho. o: x,y text size hang rot ko
function plaque(p,o){
  const font=o.ko?`700 ${o.size}px ${HANGUL}`:`italic 400 ${o.size}px ${FF}`;
  p.save();p.translate(o.x,o.y);p.rotate(o.rot||0);p.font=font;
  const tw=p.measureText(o.text).width,w=tw+o.size*1.1,h=o.size*1.5;p.fillStyle=INK;p.strokeStyle=INK;
  if(o.hang){p.lineWidth=2;p.beginPath();p.moveTo(0,-h/2);p.lineTo(0,-h/2-o.hang);p.stroke();}
  p.beginPath();p.roundRect(-w/2,-h/2,w,h,h*0.28);p.fill();dot(p,-w/2-4,0,h*0.24);dot(p,w/2+4,0,h*0.24);
  cut(p,()=>{p.lineWidth=2;p.beginPath();p.roundRect(-w/2+6,-h/2+6,w-12,h-12,h*0.2);p.stroke();dot(p,-w/2-4,0,h*0.09);dot(p,w/2+4,0,h*0.09);p.textAlign='center';p.textBaseline='middle';p.fillText(o.text,0,2);});
  p.restore();return w;
}
const plaqueW=(p,text,size,ko)=>{p.save();p.font=ko?`700 ${size}px ${HANGUL}`:`italic 400 ${size}px ${FF}`;const w=p.measureText(text).width+size*1.1;p.restore();return w;};
function badge(p,g,o){
  both([p,g],c=>{c.save();c.translate(o.x,o.y);c.scale(o.s,o.s);});
  p.fillStyle=INK;dot(p,0,0,40);for(let k=0;k<12;k++)dot(p,Math.cos(k*TAU/12)*40,Math.sin(k*TAU/12)*40,7);
  cut(p,()=>dot(p,0,0,31));g.fillStyle='rgb(110,220,120)';dot(g,0,0,33);
  p.strokeStyle=INK;p.lineCap='round';p.lineWidth=11;p.beginPath();p.moveTo(-16,1);p.lineTo(-4,14);p.lineTo(18,-14);p.stroke();
  both([p,g],c=>c.restore());
}
// intertítulo colgante con letras recortadas. o: x,y centro, w,h, rot (desde arriba), lines [{text,size,y,italic,ko}]
function titleCard(p,g,o){
  both([p,g],c=>{c.save();c.translate(o.x,o.y-o.h/2);c.rotate(o.rot||0);c.translate(0,o.h/2);});
  const w=o.w,h=o.h;p.fillStyle=INK;p.strokeStyle=INK;p.lineWidth=2.4;
  p.beginPath();p.moveTo(-w*0.32,-h/2);p.lineTo(-w*0.32,-h/2-900);p.moveTo(w*0.32,-h/2);p.lineTo(w*0.32,-h/2-900);p.stroke();
  p.beginPath();p.roundRect(-w/2,-h/2,w,h,14);p.fill();
  for(let x=-w/2+12;x<=w/2-12;x+=16){dot(p,x,-h/2,6);dot(p,x,h/2,6);}
  for(const sx of [-1,1]){p.beginPath();p.arc(sx*w/2,0,Math.min(h*0.22,40),-Math.PI/2,Math.PI/2,sx<0);p.fill();}
  cut(p,()=>{
    p.lineWidth=3;p.beginPath();p.roundRect(-w/2+14,-h/2+14,w-28,h-28,8);p.stroke();
    for(let x=-w/2+34;x<=w/2-34;x+=11){dot(p,x,-h/2+24,1.8);dot(p,x,h/2-24,1.8);}
    for(const sx of [-1,1])for(const sy of [-1,1]){const cx=sx*(w/2-34),cy=sy*(h/2-34);dot(p,cx,cy,4);[0,1,2].forEach(k=>tear(p,cx,cy,14,6,Math.atan2(-sy,-sx)+(k-1)*0.7+Math.PI));}
    for(const sx of [-1,1])dot(p,sx*(w/2+Math.min(h*0.1,18)),0,Math.min(h*0.07,12));
    o.lines.forEach(L=>{p.font=L.ko?`700 ${L.size}px ${HANGUL}`:`${L.italic?'italic ':''}400 ${L.size}px ${FF}`;p.textAlign='center';p.textBaseline='alphabetic';p.fillText(L.text,0,L.y);});
  });
  both([p,g],c=>c.restore());
}
// luna en marco de encaje: fill = fracción iluminada (la cuenta atrás), burst = rayos
function moon(p,g,o){
  both([p,g],c=>{c.save();c.translate(o.x,o.y);});
  const r=o.r;p.fillStyle=INK;
  if(o.burst>0.01){const L=46*o.burst;for(let k=0;k<16;k++){const a=k/16*TAU+0.1,l=(k%2?0.6:1)*L,w=0.09;p.beginPath();p.moveTo(Math.cos(a-w)*(r+12),Math.sin(a-w)*(r+12));p.lineTo(Math.cos(a)*(r+16+l),Math.sin(a)*(r+16+l));p.lineTo(Math.cos(a+w)*(r+12),Math.sin(a+w)*(r+12));p.fill();dot(p,Math.cos(a)*(r+22+l),Math.sin(a)*(r+22+l),4*o.burst);}}
  dot(p,0,0,r+12);for(let k=0;k<20;k++)dot(p,Math.cos(k*TAU/20)*(r+12),Math.sin(k*TAU/20)*(r+12),5.5);
  cut(p,()=>{dot(p,0,0,r);for(let k=0;k<20;k++)dot(p,Math.cos((k+0.5)*TAU/20)*(r+7),Math.sin((k+0.5)*TAU/20)*(r+7),1.8);});
  g.fillStyle='rgb(255,246,214)';dot(g,0,0,r+1);
  const f=cl(o.fill);p.fillStyle=INK;
  [[-0.3,-0.25,0.16],[0.28,0.1,0.22],[-0.1,0.42,0.12],[0.35,-0.42,0.09]].forEach(([x,y,rr])=>{dot(p,x*r,y*r,rr*r);cut(p,()=>dot(p,x*r+rr*r*0.25,y*r-rr*r*0.2,rr*r*0.72));});
  if(f<0.995){p.save();p.beginPath();p.arc(0,0,r+0.5,0,TAU);p.clip();p.fillStyle=INK;dot(p,-2*r*f,0,r+1);p.restore();}
  both([p,g],c=>c.restore());
}
// gong en su bastidor con un mazo en varilla: el «escucha» del teatro de sombras
function gong(p,g,o,t,rods){
  const {x,y,r}=o,hit=o.hit;
  p.fillStyle=INK;p.strokeStyle=INK;
  p.fillRect(x-r-46,y-r-60,14,2*r+170);p.fillRect(x+r+32,y-r-60,14,2*r+170);p.fillRect(x-r-60,y-r-72,2*r+120,16);
  for(const sx of [-1,1]){tear(p,x+sx*(r+60),y-r-64,30,12,sx>0?0:Math.PI);dot(p,x+sx*(r+39),y-r-64,10);}
  cut(p,()=>{for(let k=0;k<12;k++)dot(p,x-r-50+k*(2*r+100)/11,y-r-64,2.4);});
  const sw=swing(t,hit,0.07,3,16);
  both([p,g],c=>{c.save();c.translate(x,y-r-56);c.rotate(sw);c.translate(0,r+56);});
  p.lineWidth=2.4;p.beginPath();p.moveTo(-r*0.5,-r*0.86);p.lineTo(-r*0.4,-r-56);p.moveTo(r*0.5,-r*0.86);p.lineTo(r*0.4,-r-56);p.stroke();
  dot(p,0,0,r);
  cut(p,()=>{for(let k=0;k<28;k++){const a=k/28*TAU;dot(p,Math.cos(a)*r*0.82,Math.sin(a)*r*0.82,3.2);}p.lineWidth=3;p.beginPath();p.arc(0,0,r*0.62,0,TAU);p.stroke();for(let k=0;k<8;k++)tear(p,0,0,r*0.5,r*0.16,k*TAU/8+0.2);});
  g.fillStyle='rgb(255,186,70)';dot(g,0,0,r*0.9);
  p.fillStyle=INK;dot(p,0,0,r*0.2);pin(p,0,0,7);
  both([p,g],c=>c.restore());
  // ondas de sonido: arcos de puntos perforados que se alejan del gong
  p.fillStyle=INK;
  for(let i=0;i<3;i++){const u=((t-hit)*0.9+i/3)%1;if(t<hit)continue;const R=r+34+u*150,n=9,a0=-0.55;for(const sd of [-1,1])for(let k=0;k<n;k++){const a=a0+k*1.1/(n-1),rr=(1-u)*6.5;if(rr<1)continue;dot(p,x+sd*Math.cos(a)*R,y+Math.sin(a)*R,rr);}}
  // mazo
  const ma=-0.9+0.75*Math.exp(-Math.max(0,t-hit)*6)*(t>hit?1:0)-0.5*sm(hit-0.25,hit,t)*(t<hit?1:0);
  p.save();p.translate(x+r+150,y+150);p.rotate(ma);p.lineWidth=7;p.lineCap='round';p.beginPath();p.moveTo(0,0);p.lineTo(-150,-110);p.stroke();p.beginPath();p.ellipse(-158,-116,24,18,0.6,0,TAU);p.fill();cut(p,()=>{for(let k=0;k<5;k++)dot(p,-150+Math.cos(k*1.26)*12,-112+Math.sin(k*1.26)*9,2);});if(rods)rods.push([...wpt(p,0,0),3.2]);p.restore();
}
// cuadro con gelatina: la ilustración se proyecta a través del hueco como una diapositiva de color
function slide(p,g,o,rods){
  both([p,g],c=>{c.save();c.translate(o.x,o.y);c.rotate(o.rot||0);});
  const w=o.w,h=o.h;p.fillStyle=INK;
  p.beginPath();p.roundRect(-w/2,-h/2,w,h,10);p.fill();
  for(let x=-w/2+8;x<=w/2-8;x+=13){dot(p,x,-h/2,5.5);dot(p,x,h/2,5.5);}for(let y=-h/2+13;y<=h/2-13;y+=13){dot(p,-w/2,y,5.5);dot(p,w/2,y,5.5);}
  const iw=w-34,ih=h-34;
  cut(p,()=>{p.beginPath();p.roundRect(-iw/2,-ih/2,iw,ih,6);p.fill();});
  g.save();g.beginPath();g.roundRect(-iw/2-1,-ih/2-1,iw+2,ih+2,6);g.clip();g.fillStyle='rgb(255,236,200)';g.fillRect(-iw/2,-ih/2,iw,ih);
  if(o.img){const nw=o.img.naturalWidth||o.img.width||1,nh=o.img.naturalHeight||o.img.height||1,k=Math.min(iw/nw,ih/nh);g.drawImage(o.img,-nw*k/2,-nh*k/2,nw*k,nh*k);}
  g.restore();
  p.fillStyle=INK;for(const sx of [-1,1])for(const sy of [-1,1]){p.save();p.translate(sx*(iw/2-2),sy*(ih/2-2));p.beginPath();p.moveTo(0,0);p.lineTo(-sx*30,0);p.quadraticCurveTo(-sx*6,-sy*6,0,-sy*30);p.closePath();p.fill();p.restore();}
  if(rods)rods.push([...wpt(p,0,h/2),3.2]);
  both([p,g],c=>c.restore());
}

// ---------- texto en tarjetas colgantes ----------
function balanced(ctx,text,maxW,size,font){
  let best=wrapLines(ctx,text,maxW,size,font,2);if(best.length<2)return best;
  ctx.save();ctx.font=font.replace('SIZE',size);const wd=l=>ctx.measureText(l).width;
  for(let mw=maxW-20;mw>maxW*0.4;mw-=20){const l=wrapLines(ctx,text,mw,size,font,2);if(l.length!==2||wd(l[1])>wd(l[0])||Math.max(wd(l[0]),wd(l[1]))>maxW)break;best=l;}
  ctx.restore();return best;
}
// rows: [{text,size,italic,ko}] -> líneas ajustadas al ancho, con su línea base relativa al centro
function layoutRows(ctx,rows,maxW){
  const out=[];let tw=0;
  for(const R of rows){const font=R.ko?`700 SIZEpx ${HANGUL}`:`${R.italic?'italic ':''}400 SIZEpx ${FF}`,lines=balanced(ctx,R.text,maxW,R.size,font),fs=fitFont(ctx,lines,maxW,R.size,font);
    ctx.save();ctx.font=font.replace('SIZE',fs);for(const line of lines){tw=Math.max(tw,ctx.measureText(line).width);out.push({text:line,size:fs,italic:R.italic,ko:R.ko});}ctx.restore();}
  const total=out.reduce((s,L)=>s+L.size*1.12,0);let y=-total/2;
  for(const L of out){L.y=y+L.size*0.86;y+=L.size*1.12;}
  return{lines:out,w:Math.max(360,tw+120),h:total+70};
}
// la tarjeta baja por sus cordeles, se balancea y queda colgando
function hangCard(st,t,t0,x,y,rows,maxW){
  const L=layoutRows(st.S.getContext('2d'),rows,maxW);if(t<t0)return L;
  const yy=lerp(-L.h-60,y,EO(sm(t0,t0+0.55,t))),rot=swing(t,t0+0.5,0.06,2.2,7)+Math.sin(t*0.9)*0.008;
  pup(st,{},(p,g)=>titleCard(p,g,{x,y:yy,w:L.w,h:L.h,rot,lines:L.lines}));
  return{...L,y:yy};
}
function dropPlaque(p,t,t0,x,y,text,size,o={}){if(t<t0)return;plaque(p,{x,y:lerp(-60,y,EO(sm(t0,t0+0.3,t))),text,size,rot:swing(t,t0+0.3,0.06,3,9),hang:o.hang??(y-10),ko:o.ko});}

function drawBeat(st,t,S,beat){
  const local=t-beat.t0,t0=beat.t0;
  if(beat.kind==='title'){
    hangCard(st,t,t0+0.15,420,250,[{text:(beat.heading||`REPASO · CLASE ${beat.classNumber}`),size:62},{text:beat.unitTitle||'',size:50,italic:true}],620);
    pup(st,{},p=>dropPlaque(p,t,t0+1.6,420,470,(beat.tagline||'¿Cuánto recuerdas?'),46,{hang:150}));
    if(S.assets.scene&&local>0.5)pup(st,{},(p,g,rods)=>slide(p,g,{x:960,y:lerp(900,300,EO(sm(t0+0.5,t0+1.1,t))),w:400,h:290,rot:swing(t,t0+1.1,0.04,3,9)+Math.sin(t*1.3)*0.01,img:S.assets.scene},rods));
    pup(st,{},(p,g,rods)=>magpie(p,g,{x:lerp(1440,1150,EO(sm(t0+0.6,t0+1.6,t))),y:640-Math.abs(Math.sin(sm(t0+0.6,t0+1.6,t)*Math.PI*3))*24,s:0.72,wing:0.1+(1-sm(t0+1.4,t0+1.9,t))*(0.5+0.5*Math.sin(t*15)),head:Math.sin(t*1.5)*0.05,look:[-1,0],blink:blinkAt(local,[2.6])},rods));
    return;
  }
  if(beat.kind==='end'){
    const c=hangCard(st,t,t0+0.15,600,220,[{text:'¡Muy bien!',size:96,italic:true}],760);
    pup(st,{},p=>{dropPlaque(p,t,t0+0.9,600,400,(beat.tally||`${beat.total} frases repasadas`),46,{hang:Math.max(40,400-((c.y??220)+c.h/2))});dropPlaque(p,t,t0+1.5,600,510,(beat.closing||'Mañana vuelven: ¡no las sueltes!'),42,{hang:70});});
    pup(st,{},(p,g)=>moon(p,g,{x:1130,y:170,r:62,fill:1,burst:EO(sm(t0+0.6,t0+1.0,t))*(1-0.15*Math.sin((t-t0)*6))}));
    const bow=Math.sin(Math.PI*sm(t0+2.0,t0+2.6,t));
    pup(st,{},(p,g,rods)=>magpie(p,g,{x:1130,y:640,s:0.72,tilt:bow*0.25,head:bow*0.3,wing:0.2+bow*0.5+0.4*Math.max(0,Math.sin(t*12))*(1-sm(t0+0.6,t0+1.6,t)),look:[-1,0.2],blink:blinkAt(local,[3.2])},rods));
    return;
  }
  const {think,reveal}=beatTimes(beat),item=beat.item,img=S.assets.picture(item.picture),listen=beat.kind==='listen';
  const cx=img?430:600,maxW=img?560:820;
  // cabecera y contador: carteles colgados de la cenefa
  pup(st,{},p=>{
    const head=listen?'ESCUCHA':'¿CÓMO SE DICE?',hw=plaqueW(p,head,52);dropPlaque(p,t,t0+0.05,40+hw/2,120,head,52,{hang:70});
    const ct=`${beat.number} / ${beat.total}`,cw=plaqueW(p,ct,42);dropPlaque(p,t,t0+0.2,1240-cw/2,112,ct,42,{hang:62});
  });
  if(img)pup(st,{},(p,g,rods)=>slide(p,g,{x:960,y:lerp(900,330,EO(sm(t0+0.25,t0+0.8,t))),w:300,h:300,rot:swing(t,t0+0.8,0.05,3,9)+Math.sin(t*1.2+beat.index)*0.012,img},rods));
  let M={look:[-1,0.1],wing:0.08+Math.sin(t*2.1)*0.03,head:0};
  if(t<think[0]){
    if(listen){const hit=t0+0.55+Math.floor(Math.max(0,local-0.55)/1.1)*1.1;pup(st,{},(p,g,rods)=>gong(p,g,{x:cx-40,y:330,r:96,hit},t,rods));M.head=-0.12;}
    else hangCard(st,t,t0+0.3,cx,300,[{text:item.es,size:76,italic:true}],maxW);
  }else if(t<reveal[0]){
    const dur=think[1]-think[0],pp=cl((t-think[0])/dur),left=Math.max(1,Math.ceil(dur*(1-pp)-1e-6));
    pup(st,{},(p,g)=>{
      moon(p,g,{x:cx-150,y:300,r:104,fill:1-pp,burst:0});
      const ch=think[0]+Math.max(0,dur-left),k=1+0.12*Math.exp(-Math.max(0,t-ch)*8);
      p.save();p.translate(cx+120,378);p.scale(k,k);p.fillStyle=INK;p.font=`400 210px ${NF}`;p.textAlign='center';p.textBaseline='alphabetic';p.fillText(String(left),0,0);p.restore();
      dropPlaque(p,t,think[0]+0.1,cx,520,listen?'¿Qué significa?':'¡Dilo en voz alta!',46,{hang:80});
    });
    M.head=0.15*Math.sin(t*3);
  }else{
    const r0=reveal[0];
    let c;
    if(listen){
      c=hangCard(st,t,r0,cx,250,[{text:item.es,size:80,italic:true}],maxW);
      pup(st,{},p=>dropPlaque(p,t,r0+0.75,cx,c.y+c.h/2+86,item.ko,54,{hang:70,ko:true}));
    }else{
      c=hangCard(st,t,r0,cx,250,[{text:item.ko,size:104,ko:true}],maxW);
      pup(st,{},p=>dropPlaque(p,t,r0+0.6,cx,c.y+c.h/2+80,item.es,42,{hang:64}));
    }
    const bs=EO(sm(r0+0.5,r0+0.68,t))*0.95;
    if(bs>0.01)pup(st,{},(p,g)=>badge(p,g,img?{x:816,y:188,s:bs*1.3}:{x:Math.min(cx+c.w/2+20,1060),y:c.y-c.h/2+10,s:bs}));
    M={look:[-1,-0.3],wing:0.1+(0.5+0.5*Math.sin(t*14))*(1-sm(r0+0.6,r0+1.2,t))*0.8,head:-0.1*Math.sin(Math.PI*sm(r0,r0+0.6,t))};
  }
  pup(st,{},(p,g,rods)=>magpie(p,g,{x:1150,y:640-(M.hop||0),s:0.66,...M,blink:blinkAt(local,[1.9,5.3,9.1])},rods));
}

export default {
  id:'shadow',
  name:'Teatro de sombras',
  fonts:['400 74px "IM Fell English"','italic 400 52px "IM Fell English"','400 88px "Libre Baskerville"'],
  fontCss:'https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=block',
  readsPixels:false,
  frame(ctx,W,Hh,t,S){
    const tr=S.prev&&S.local<TR,first=tr&&S.local<TR/2,beat=first?S.prev:S.beat,tt=first?S.prev.t1-0.001:t;
    // el candil se enciende chisporroteando al empezar y llamea en cada respuesta
    let b=sm(0,0.55,t)*(1-0.35*Math.max(0,NZ.n2(t*23,3.3))*(1-sm(0.35,0.7,t))),flare=0,cover=0;
    if(beat.phases&&tt>=beat.phases.reveal[0])flare=Math.exp(-(tt-beat.phases.reveal[0])*3)*0.32;
    // cambio de escena: cortinas de encaje que se cierran y se abren; al final, el candil baja y sube
    if(tr){if(S.beat.kind==='end')b*=1-0.93*Math.sin(Math.PI*S.local/TR);else cover=first?EIO(S.local/(TR/2)):1-EIO((S.local-TR/2)/(TR/2));}
    lamp(ctx,W,Hh,t,b+flare*0.3,flare);
    const st=begin(W,Hh);
    drawBeat(st,tt,S,beat);
    stage(st);
    nearFern(st,t,0.7);
    if(cover>0.001)pup(st,{},p=>{const e=cover*(W/2+40);for(const sd of [-1,1]){const wave=y=>Math.sin(y*0.018+t*2+sd)*10+Math.sin(y*0.05)*4,inner=y=>(sd<0?e-40+wave(y):W-e+40+wave(y)),outer=sd<0?-60:W+60;
      p.fillStyle=INK;p.beginPath();p.moveTo(outer,-10);for(let y=-10;y<=Hh+10;y+=20)p.lineTo(inner(y),y);p.lineTo(outer,Hh+10);p.closePath();p.fill();
      for(let y=30;y<Hh;y+=24)tear(p,inner(y),y,18,9,sd<0?0:Math.PI);
      cut(p,()=>{for(let k=1;k<9;k++){const x=sd<0?inner(0)-k*70:inner(0)+k*70;for(let y=50;y<Hh-20;y+=22){const xx=x+wave(y)*0.6+Math.sin(y*0.03+k)*6;p.save();p.translate(xx,y);p.rotate(Math.PI/4);p.fillRect(-3.4,-3.4,6.8,6.8);p.restore();}}for(let y=40;y<Hh-20;y+=18)dot(p,inner(y)-sd*18,y,3);});}});
    end(ctx,st,t);
  },
  score(k,timeline){
    // bronce tipo gamelan, golpes de varilla de madera, roce de cuero; todo bajo 2.5 kHz y discreto bajo la voz
    const gam=(t,n,g=1,pan=0,minor=false)=>{const f=k.hz(n);k.tone(t,{f,dur:1.9,gain:0.13*g,a:0.002,pan,verb:0.3,minor});k.tone(t,{f:f*1.007,dur:1.6,gain:0.07*g,a:0.002,pan,verb:0.3,minor});k.tone(t,{f:f*2.01,dur:0.55,gain:0.04*g,a:0.002,pan,minor});k.noise(t,{dur:0.02,filter:'bandpass',f:Math.min(2200,f*1.6),q:2,gain:0.08*g,pan,minor});};
    const tap=(t,f=640,g=0.55,pan=0,minor=true)=>{k.play('tock',t,{f,gain:g,pan,minor});k.noise(t,{dur:0.014,filter:'bandpass',f:1700,q:2.5,gain:0.32*g,a:0.001,pan,minor});};
    const hide=(t,dur,g=0.5,pan=0)=>k.play('paper',t,{dur,gain:g,pan,minor:true});
    const flap=(t,g=0.25,pan=0)=>k.noise(t,{dur:0.11,color:'pink',filter:'lowpass',f:[[0,900],[0.11,300]],gain:g,a:0.03,pan,minor:true});
    k.bed('hum',0.2,timeline.duration,{gain:0.5});k.bed('room',0,timeline.duration,{gain:0.7});
    for(const beat of timeline.beats){
      const t0=beat.t0;
      if(beat.index){
        if(beat.kind==='end')k.noise(t0,{dur:TR,color:'brown',filter:'lowpass',f:[[0,600],[TR/2,140],[TR,600]],gain:0.3,a:0.05,hold:0.4,minor:true});
        else{for(const pan of [-0.7,0.7])k.noise(t0,{dur:0.32,color:'pink',filter:'bandpass',f:[[0,500],[0.2,1500],[0.32,700]],q:0.7,gain:0.2,a:0.12,pan,minor:true});k.play('thud',t0+TR/2,{f:110,gain:0.25,minor:true});for(const pan of [-0.7,0.7])k.noise(t0+TR/2,{dur:0.34,color:'pink',filter:'bandpass',f:[[0,700],[0.2,1500],[0.34,500]],q:0.7,gain:0.18,a:0.12,pan,minor:true});}
      }
      if(beat.kind==='title'){
        k.noise(0.04,{dur:0.45,color:'brown',filter:'lowpass',f:[[0,200],[0.12,700],[0.45,180]],gain:0.35,a:0.05});
        [0.18,0.31,0.47].forEach((t,i)=>k.noise(t,{dur:0.012,filter:'bandpass',f:1300+i*300,q:1.5,gain:0.12,minor:true}));
        hide(0.2,0.3,0.6);tap(0.68,520,0.6,0,false);gam(0.7,'D4',0.8);flap(0.75,0.2,0.6);tap(1.88,760,0.4,-0.2);continue;
      }
      if(beat.kind==='end'){tap(t0+0.68,520,0.6,0,false);gam(t0+0.75,'D4',0.8,-0.2);gam(t0+0.89,'A4',0.75,0);gam(t0+1.03,'D5',0.7,0.2);k.tone(t0+0.75,{f:'D3',dur:2,gain:0.1,a:0.01,verb:0.4});tap(t0+2.3,420,0.6,0.7);continue;}
      const {think,reveal}=beatTimes(beat),dur=think[1]-think[0];
      tap(t0+0.42,700,0.4,-0.6);
      if(beat.kind==='listen')gam(t0+0.55,'A3',0.5,-0.1,true);else tap(t0+0.82,560,0.5,0);
      hide(think[0],0.25,0.35,-0.2);
      for(let n=Math.ceil(dur-1e-6);n>=1;n--){const s=think[0]+Math.max(0,dur-n);tap(s,1150,0.38,0.1);}
      tap(reveal[0]+0.5,520,0.6,0,false);gam(reveal[0]+0.02,'A4',0.7,0.1);gam(reveal[0]+0.14,'D5',0.7,0.1);
    }
  },
};
