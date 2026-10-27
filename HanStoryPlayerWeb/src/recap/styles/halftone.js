// Estilo «Cómic pop»: viñeta Lichtenstein ampliada. Técnicas del paquete: tramas
// Ben-Day escalonadas en rojo y azul, amarillo primario plano, plancha de color y
// plancha de línea separadas con mal registro (2.5 px), papel envejecido con fibra,
// cartelas, globos, explosiones con contador Bangers, flechas gordas, rótulos con
// halo blanco y la cámara que lee la tira viñeta a viñeta (se aleja en el medianil).
import {beatTimes,fitFont,wrapLines} from './shared.js';

const H=window.H,PE=H.ease,TAU=Math.PI*2;
const C={red:'#e2231a',blue:'#1f5fbf',yellow:'#ffd51f',black:'#141210',white:'#fbf6ea'};
const KR='"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif';
const BANG=`"Bangers",${KR}`;
const W=1280,HH=720,PPW=1200,PPH=660,PG=44;
const pX=i=>i*(PPW+PG);
const seg=(t,a,b)=>H.clamp((t-a)/(b-a));
const popIn=(t,t0)=>(t<t0?0:1+0.3*(1-PE.out(seg(t,t0,t0+0.16)))*(t-t0<0.16?1:0));

// ---------- cachés ----------
const K={};
const lay=(key,w=W,h=HH)=>{const l=K[key]||(K[key]=H.layer(w,h));const x=l.getContext('2d');x.setTransform(1,0,0,1,0,0);x.globalAlpha=1;x.globalCompositeOperation='source-over';x.clearRect(0,0,w,h);return l;};
// campo de puntos Ben-Day (rejilla escalonada) dentro del recorte actual
function benday(x,color,s,r,x0,y0,x1,y1,seed,rgain){
  const rr=H.rng(seed);x.fillStyle=color;x.beginPath();
  for(let j=0,y=y0;y<y1+s;j++,y+=s*0.5){const off=(j&1)?s*0.5:0;
    for(let xx=x0+off;xx<x1+s;xx+=s){const g=rgain?rgain(xx,y):1,rad=r*g*(1+(rr()-0.5)*0.08);if(rad<0.4)continue;const px=xx+(rr()-0.5)*0.6,py=y+(rr()-0.5)*0.6;x.moveTo(px+rad,py);x.arc(px,py,rad,0,TAU);}}
  x.fill();
}
// fondos de viñeta: se hornean una vez por tipo
const BG={
  title:c=>{c.fillStyle=C.white;c.fillRect(0,0,PPW,PPH);benday(c,C.blue,17,5.2,-10,-10,PPW,PPH,3,(x,y)=>0.75+0.3*H.smooth(0,1400,x+y*0.4));},
  listen:c=>{c.fillStyle=C.yellow;c.fillRect(0,0,PPW,PPH);benday(c,C.red,18,5.4,-10,-10,PPW,PPH,5,(x,y)=>H.smooth(760,40,Math.hypot(x-380,y-330)));},
  produce:c=>{c.fillStyle=C.white;c.fillRect(0,0,PPW,PPH);benday(c,C.blue,16,3.6,-10,-10,PPW,PPH,9,(x,y)=>0.6+0.3*H.smooth(1200,0,x));},
  end:c=>{c.fillStyle=C.yellow;c.fillRect(0,0,PPW,PPH);benday(c,C.red,18,5.4,-10,-10,PPW,PPH,41,(x,y)=>H.smooth(800,100,Math.hypot(x-600,y-280)));},
};
const bg=kind=>K['bg'+kind]||(K['bg'+kind]=(()=>{const l=H.layer(PPW,PPH);BG[kind](l.getContext('2d'));return l;})());
// trama fina de imprenta para las ilustraciones (patrón de 5 puntos, como la del paquete)
const screenPat=c=>{if(!K.scr){const s=8,p=H.layer(s,s),x=p.getContext('2d');x.fillStyle='rgba(20,18,16,0.32)';for(const [px,py] of [[0,0],[s,0],[0,s],[s,s],[s/2,s/2]]){x.beginPath();x.arc(px,py,1.5,0,TAU);x.fill();}K.scr=p;}return c.createPattern(K.scr,'repeat');};
// papel: amarilleo de baja frecuencia, bordes envejecidos y fibra (multiplicadores del paquete, horneados)
function paper(){
  if(K.paper)return K.paper;
  const nz=H.makeNoise(41),LW=160,LH=90,lo=H.layer(LW,LH),lx=lo.getContext('2d'),li=lx.createImageData(LW,LH);
  for(let y=0;y<LH;y++)for(let x=0;x<LW;x++){const i=(y*LW+x)*4;li.data[i]=128+127*nz.fbm2(x*0.06,y*0.06,3);li.data[i+3]=255;}
  lx.putImageData(li,0,0);const big=H.layer(W,HH),bx=big.getContext('2d',{willReadFrequently:true});bx.drawImage(lo,0,0,W,HH);
  const lf=bx.getImageData(0,0,W,HH),d=lf.data,r=H.rng(5);
  for(let y=0,p=0;y<HH;y++)for(let x=0;x<W;x++,p++){const i=p*4,n=(d[i]-128)/128,g=r()-0.5,ex=Math.min(x,W-x,y,HH-y),age=1-0.06*(1-H.smooth(0,160,ex))-0.025*n;
    d[i]=255*age*(1+g*0.05);d[i+1]=255*(age-0.01)*(1+g*0.05);d[i+2]=255*(age-0.045)*(1+g*0.06);d[i+3]=255;}
  bx.putImageData(lf,0,0);return(K.paper=big);
}

// ---------- recursos del cómic (c = plancha de color, k = plancha de línea) ----------
const bubble=(x,cx,cy,rx,ry)=>{x.beginPath();x.ellipse(cx,cy,rx,ry,0,0,TAU);};
function balloon(c,k,cx,cy,rx,ry,tx,ty,sc){
  if(sc<=0)return;
  const tail=x=>{const a=Math.atan2(ty-cy,tx-cx);x.beginPath();x.moveTo(cx+Math.cos(a-0.22)*rx*0.9,cy+Math.sin(a-0.22)*ry*0.9);x.lineTo(tx,ty);x.lineTo(cx+Math.cos(a+0.22)*rx*0.9,cy+Math.sin(a+0.22)*ry*0.9);x.closePath();};
  for(const x of [c,k]){x.save();x.translate(cx,cy);x.scale(sc,sc);x.translate(-cx,-cy);}
  k.lineWidth=8;k.strokeStyle=C.black;if(tx!=null){tail(k);k.stroke();}bubble(k,cx,cy,rx,ry);k.stroke();
  c.fillStyle=C.white;bubble(c,cx,cy,rx,ry);c.fill();if(tx!=null){tail(c);c.fill();}
  k.save();k.globalCompositeOperation='destination-out';bubble(k,cx,cy,rx,ry);k.fill();k.restore();
  k.lineWidth=8;bubble(k,cx,cy,rx,ry);k.stroke();
  k.save();k.globalCompositeOperation='destination-out';bubble(k,cx,cy,rx-4,ry-4);k.fill();k.restore();
  for(const x of [c,k])x.restore();
}
const burstPath=(x,cx,cy,rx,ry,n,seed)=>{const rr=H.rng(seed);x.beginPath();for(let i=0;i<n*2;i++){const a=(i/(n*2))*TAU,R=i%2?rr.range(0.6,0.72):rr.range(0.92,1.12);x.lineTo(cx+Math.cos(a)*rx*R,cy+Math.sin(a)*ry*R);}x.closePath();};
function burst(c,k,cx,cy,rx,ry,sc,fill,seed){
  if(sc<=0)return;c.fillStyle=fill;burstPath(c,cx,cy,rx*sc,ry*sc,14,seed);c.fill();
  k.lineWidth=8;k.strokeStyle=C.black;k.lineJoin='miter';burstPath(k,cx,cy,rx*sc,ry*sc,14,seed);k.stroke();k.lineJoin='round';
}
function say(k,txt,size,x,y,sc=1,align='center',rot=0){
  if(sc<=0)return;k.save();k.translate(x,y);k.rotate(rot);k.scale(sc,sc);k.fillStyle=C.black;k.font=`400 ${size}px ${BANG}`;k.letterSpacing='2px';k.textAlign=align;k.textBaseline='middle';k.fillText(txt,0,0);k.restore();
}
// rótulo calado: halo blanco en ambas planchas, letra negra encima
function sayK(c,k,txt,size,x,y,sc=1,align='center',rot=0,halo=12){
  if(sc<=0)return;
  for(const x_ of [c,k]){x_.save();x_.translate(x,y);x_.rotate(rot);x_.scale(sc,sc);x_.font=`400 ${size}px ${BANG}`;x_.letterSpacing='2px';x_.textAlign=align;x_.textBaseline='middle';x_.lineJoin='round';x_.lineWidth=halo;x_.strokeStyle=C.white;x_.strokeText(txt,0,0);x_.restore();}
  say(k,txt,size,x,y,sc,align,rot);
}
const textW=(k,txt,size)=>{k.save();k.font=`400 ${size}px ${BANG}`;k.letterSpacing='2px';const w=k.measureText(txt).width;k.restore();return w;};
// cartela que entra deslizándose desde la izquierda (o la derecha)
function box(c,k,x0,y0,txt,size,fill,t0,t,fromRight=false){
  if(t<t0)return;const w=textW(k,txt,size)+36,h=size*1.45,X=fromRight?x0-w:x0,u=PE.back(seg(t,t0,t0+0.25)),dx=(1-u)*(fromRight?w+40:-w-40);
  c.fillStyle=fill;c.fillRect(X+dx,y0,w,h);k.lineWidth=6;k.strokeStyle=C.black;k.strokeRect(X+dx,y0,w,h);
  say(k,txt,size,X+dx+18,y0+h/2+2,1,'left');
}
function cbox(c,k,cx,cy,txt,size,fill,sc){ // cartela centrada
  if(sc<=0)return;const w=textW(k,txt,size)+44,h=size*1.45;
  for(const x of [c,k]){x.save();x.translate(cx,cy);x.scale(sc,sc);x.translate(-cx,-cy);}
  c.fillStyle=fill;c.fillRect(cx-w/2,cy-h/2,w,h);k.lineWidth=6;k.strokeStyle=C.black;k.strokeRect(cx-w/2,cy-h/2,w,h);say(k,txt,size,cx,cy+2);
  for(const x of [c,k])x.restore();
}
// flecha gorda de cómic a lo largo de una cuadrática, dibujada con progreso u
function fatArrow(c,k,p0,cp,p1,u,w,fill){
  if(u<=0)return;
  const q=s=>[(1-s)*(1-s)*p0[0]+2*(1-s)*s*cp[0]+s*s*p1[0],(1-s)*(1-s)*p0[1]+2*(1-s)*s*cp[1]+s*s*p1[1]];
  const N=24,L=[],R=[],end=u*0.86;
  for(let i=0;i<=N;i++){const s=(i/N)*end,a=q(s),b=q(Math.min(1,s+0.01));let dx=b[0]-a[0],dy=b[1]-a[1];const l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;const ww=w*(0.6+0.4*(i/N))/2;L.push([a[0]-dy*ww,a[1]+dx*ww]);R.push([a[0]+dy*ww,a[1]-dx*ww]);}
  const e=q(end),tip=q(Math.min(1,end+0.14));let dx=tip[0]-e[0],dy=tip[1]-e[1];const l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;const hw=w*1.1;
  const path=x=>{x.beginPath();x.moveTo(L[0][0],L[0][1]);L.forEach(p=>x.lineTo(p[0],p[1]));x.lineTo(e[0]-dy*hw,e[1]+dx*hw);x.lineTo(tip[0],tip[1]);x.lineTo(e[0]+dy*hw,e[1]-dx*hw);for(let i=R.length-1;i>=0;i--)x.lineTo(R[i][0],R[i][1]);x.closePath();};
  c.fillStyle=fill;path(c);c.fill();k.lineWidth=6;k.strokeStyle=C.black;k.lineJoin='round';path(k);k.stroke();
}
// líneas de acción alrededor de un centro (laten a 8 fps)
function actionLines(k,cx,cy,r0,len,n,t,seed){
  const rr=H.rng(seed),th=Math.floor(t*8)%2;k.save();k.strokeStyle=C.black;k.lineWidth=6;k.lineCap='round';
  for(let i=0;i<n;i++){const a=(i/n)*TAU+rr.range(-0.12,0.12),r1=r0+len*(0.7+0.3*rr())+th*16;k.beginPath();k.moveTo(cx+Math.cos(a)*r0,cy+Math.sin(a)*r0*0.7);k.lineTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1*0.7);k.stroke();}
  k.restore();
}
// viñeta insertada: la ilustración impresa con trama y borde de tinta
function inset(c,k,img,x,y,w,h,rot,sc){
  if(sc<=0)return;
  for(const q of [c,k]){q.save();q.translate(x+w/2,y+h/2);q.rotate(rot);q.scale(sc,sc);q.translate(-w/2,-h/2);}
  c.fillStyle=C.white;c.fillRect(0,0,w,h);
  if(img){const iw=img.width||1,ih=img.height||1,s=Math.min((w-30)/iw,(h-30)/ih);c.drawImage(img,(w-iw*s)/2,(h-ih*s)/2,iw*s,ih*s);}
  c.fillStyle=screenPat(c);c.fillRect(0,0,w,h);
  k.lineWidth=9;k.strokeStyle=C.black;k.strokeRect(0,0,w,h);k.save();k.translate(4,3);k.lineWidth=5;k.strokeRect(0,0,w,h);k.restore();
  for(const q of [c,k])q.restore();
}
// tic azul de acierto
function tick(c,k,x,y,u){
  if(u<=0)return;c.fillStyle=C.blue;c.beginPath();c.arc(x,y,52*u,0,TAU);c.fill();
  k.save();k.translate(x,y);k.scale(u,u);k.lineWidth=7;k.strokeStyle=C.black;k.beginPath();k.arc(0,0,52,0,TAU);k.stroke();k.restore();
  c.save();c.translate(x,y);c.scale(u,u);c.lineWidth=14;c.lineCap='round';c.lineJoin='round';c.strokeStyle=C.white;c.beginPath();c.moveTo(-22,0);c.lineTo(-6,18);c.lineTo(24,-18);c.stroke();c.restore();
}
// altavoz de bocina con ondas y notas: «escucha» sin texto
function horn(c,k,x,y,t,p){
  if(p<=0)return;
  for(const q of [c,k]){q.save();q.translate(x,y);const s=PE.back(p);q.scale(s,s);q.rotate(-0.12);}
  const cone=q=>{q.beginPath();q.moveTo(-150,-28);q.lineTo(-60,-34);q.bezierCurveTo(10,-60,60,-120,92,-150);q.lineTo(92,150);q.bezierCurveTo(60,120,10,60,-60,34);q.lineTo(-150,28);q.closePath();};
  c.fillStyle=C.yellow;cone(c);c.fill();
  c.save();cone(c);c.clip();c.beginPath();c.rect(-160,10,280,160);c.clip();benday(c,C.red,12,3.3,-160,0,120,170,12);c.restore();
  c.fillStyle=C.red;c.beginPath();c.ellipse(92,0,26,150,0,0,TAU);c.fill();c.fillStyle=C.black;c.fillRect(-190,-22,44,44);
  k.strokeStyle=C.black;k.lineWidth=12;cone(k);k.stroke();k.save();k.translate(4,4);k.lineWidth=7;cone(k);k.stroke();k.restore();
  k.lineWidth=9;k.beginPath();k.ellipse(92,0,26,150,0,0,TAU);k.stroke();k.fillStyle=C.white;k.beginPath();k.ellipse(-120,-14,16,5,-0.1,0,TAU);k.fill();
  for(let i=0;i<3;i++){const on=(Math.floor(t*6)+i)%3!==0;if(!on)continue;k.lineWidth=14;k.lineCap='round';k.beginPath();k.arc(110,0,90+i*55,-0.7,0.7);k.stroke();}
  const bob=Math.floor(t*6)%2?-8:0;
  for(const [nx,ny,s] of [[200,-170+bob,1],[300,-120-bob,0.8]]){c.fillStyle=C.blue;k.fillStyle=C.black;k.lineWidth=8;k.beginPath();k.ellipse(nx,ny,22*s,16*s,-0.4,0,TAU);k.fill();k.beginPath();k.moveTo(nx+18*s,ny-4*s);k.lineTo(nx+18*s,ny-80*s);k.quadraticCurveTo(nx+40*s,ny-60*s,nx+50*s,ny-40*s);k.stroke();}
  for(const q of [c,k])q.restore();
}
// cuenta atrás: número Bangers que revienta de una explosión cada segundo
function countdown(c,k,cx,cy,phaseP,secs,label,t){
  const rem=secs*(1-phaseP),n=Math.max(1,Math.ceil(rem)),since=n-rem,sc=1+0.3*(1-PE.out(H.clamp(since/0.16)));
  actionLines(k,cx,cy,200,60,16,t,n);
  burst(c,k,cx,cy,190,170,sc,n%2?C.white:C.yellow,40+n);
  say(k,String(n),190,cx,cy+10,sc);
  sayK(c,k,label,58,cx,cy+260,popIn(phaseP*secs,0),'center',-0.03);
}
// texto en varias líneas (calado)
function lines(c,k,ls,fs,cx,cy,sc,halo=0){
  const lh=fs*1.02;ls.forEach((l,i)=>{const y=cy-(ls.length-1)*lh/2+i*lh;halo?sayK(c,k,l,fs,cx,y,sc,'center',0,halo):say(k,l,fs,cx,y,sc);});
}

// ---------- una viñeta por beat ----------
function drawPanel(c,k,slot,t,S,beat){
  const x0=pX(slot),local=t-beat.t0;
  for(const x of [c,k]){x.save();x.translate(x0,0);x.beginPath();x.rect(0,0,PPW,PPH);x.clip();}
  const kind=beat.kind;c.drawImage(bg(kind),0,0);
  if(kind==='title'){
    box(c,k,22,20,`REPASO · CLASE ${beat.classNumber}`,58,C.yellow,0.1,local);
    inset(c,k,S.assets.scene,640,96,520,350,0.025,PE.back(seg(local,0.3,0.55)));
    const unit=(beat.unitTitle||'').toUpperCase(),ff='400 SIZEpx '+BANG,ls=wrapLines(k,unit,400,80,ff,2),fs=fitFont(k,ls,400,80,ff,44);
    balloon(c,k,320,330,270,160,640,250,PE.back(seg(local,0.5,0.75)));
    lines(c,k,ls,fs,320,330,popIn(local,0.75));
    sayK(c,k,'¿CUÁNTO RECUERDAS?',76,620,580,popIn(local,1.3),'center',-0.04,14);
    const bob=Math.floor(local*6)%2?-6:0;
    if(local>1.6){say(k,'?',96,1110,560+bob,1,'center',0.2);say(k,'?',66,1050,610-bob,1,'center',0.35);}
  }else if(kind==='end'){
    const sh=local>0.6&&local<1.0?Math.sin(local*90)*6:0,bs=PE.back(seg(local,0.55,0.8));
    if(local>0.8)actionLines(k,600+sh,230,250,80,20,t,7);
    burst(c,k,600+sh,230,330,190,bs,C.red,13);
    sayK(c,k,'¡MUY BIEN!',120,600+sh,230,bs,'center',-0.05,14);
    cbox(c,k,600,425,`${beat.total} FRASES REPASADAS`,54,C.white,PE.back(seg(local,1.1,1.35)));
    cbox(c,k,600,550,'MAÑANA VUELVEN: ¡NO LAS SUELTES!',48,C.yellow,PE.back(seg(local,1.7,1.95)));
  }else{
    const {think,reveal}=beatTimes(beat),item=beat.item,img=S.assets.picture(item.picture),listen=kind==='listen',T=beat.t0+local;
    box(c,k,22,20,listen?'ESCUCHA':'¿CÓMO SE DICE?',54,listen?C.white:C.yellow,0.05,local);
    box(c,k,PPW-22,20,`${beat.number} / ${beat.total}`,44,C.white,0.2,local,true);
    if(img)inset(c,k,img,820,130,340,340,0.03,PE.back(seg(local,0.3,0.55)));
    const cx=img?400:600,maxW=img?620:980;
    if(T<think[0]){
      if(listen)horn(c,k,cx-60,350,T,seg(local,0.25,0.6));
      else{
        const es=item.es.toUpperCase(),ff='400 SIZEpx '+BANG,ls=wrapLines(k,es,maxW-170,86,ff,2),fs=fitFont(k,ls,maxW-170,86,ff,44),rx=Math.min(maxW/2,Math.max(...ls.map(l=>textW(k,l,fs)))/2+90),ry=Math.max(130,ls.length*fs*0.6+70);
        balloon(c,k,cx,320,rx,ry,img?820:cx+rx*0.6,img?380:320+ry+70,PE.back(seg(local,0.3,0.55)));
        lines(c,k,ls,fs,cx,325,popIn(local,0.5));
      }
    }else if(T<reveal[0]){
      countdown(c,k,cx,290,(T-think[0])/(think[1]-think[0]),think[1]-think[0],listen?'¿QUÉ SIGNIFICA?':'¡DILO EN VOZ ALTA!',T);
    }else{
      const r=T-reveal[0],sh=r<0.45?Math.sin(r*90)*7*(1-r/0.45):0,ff='400 SIZEpx '+BANG;
      if(listen){
        const es=item.es.toUpperCase(),ls=wrapLines(k,es,maxW-170,90,ff,2),fs=fitFont(k,ls,maxW-170,90,ff,56),rx=Math.min(maxW/2,Math.max(...ls.map(l=>textW(k,l,fs)))/2+90),ry=ls.length*fs*0.6+60,sc=PE.back(seg(r,0,0.25));
        if(r>0.2)actionLines(k,cx+sh,240,Math.max(rx,ry)+10,60,18,T,3);
        balloon(c,k,cx+sh,240,rx,ry,null,null,sc);lines(c,k,ls,fs,cx+sh,245,sc);
        const ks=fitFont(k,[item.ko],maxW-60,66,ff,40);cbox(c,k,cx,240+ry+90,item.ko,ks,C.yellow,PE.back(seg(r,0.8,1.05)));
      }else{
        const ls=wrapLines(k,item.ko,maxW-120,120,ff,2),fs=fitFont(k,ls,maxW-120,120,ff,56),tw=Math.max(...ls.map(l=>textW(k,l,fs))),rx=Math.min(maxW/2+30,tw/2+120),ry=ls.length*fs*0.62+80,sc=PE.back(seg(r,0,0.25));
        if(r>0.2)actionLines(k,cx+sh,250,Math.max(rx,ry)*0.95,60,18,T,4);
        burst(c,k,cx+sh,250,rx,ry,sc,C.yellow,21);lines(c,k,ls,fs,cx+sh,255,sc,12);
        const es=item.es.toUpperCase(),ss=fitFont(k,[es],maxW-60,48,ff,32);cbox(c,k,cx,250+ry+60,es,ss,C.white,PE.back(seg(r,0.6,0.85)));
      }
      tick(c,k,1110,470,PE.back(seg(r,1.3,1.55)));
      sayK(c,k,'¡BIEN!',60,1110,566,popIn(r,1.45),'center',0.06,12);
    }
  }
  for(const x of [c,k])x.restore();
  k.save();k.translate(x0,0);k.lineWidth=9;k.strokeStyle=C.black;k.strokeRect(0,0,PPW,PPH);k.restore();
}

export default {
  id:'halftone',
  name:'Cómic pop',
  fonts:['400 66px "Bangers"','400 30px "Bangers"'],
  fontCss:'https://fonts.googleapis.com/css2?family=Bangers&display=block',
  readsPixels:false,
  frame(ctx,Wc,Hc,t,S){
    const col=lay('col'),key=lay('key'),c=col.getContext('2d'),k=key.getContext('2d');
    c.fillStyle=C.white;c.fillRect(0,0,W,HH);
    // la cámara lee la tira: al cambiar de beat se desliza a la viñeta siguiente alejándose un poco
    const two=S.prev&&S.local<0.7,u=two?PE.inOut(H.clamp(S.local/0.7)):0,dip=two?Math.sin(Math.PI*u):0;
    const cx=u*(PPW+PG)+PPW/2,cy=PPH/2,z=1-0.2*dip;
    for(const x of [c,k]){x.save();x.translate(W/2,HH/2);x.scale(z,z);x.translate(-cx,-cy);x.lineJoin='round';x.lineCap='round';}
    if(two){drawPanel(c,k,0,S.prev.t1-0.001,S,S.prev);drawPanel(c,k,1,t,S,S.beat);}
    else drawPanel(c,k,0,t,S,S.beat);
    for(const x of [c,k])x.restore();
    // imprenta: plancha de color desplazada (mal registro), plancha de línea multiplicada, papel
    ctx.fillStyle=C.white;ctx.fillRect(0,0,W,HH);
    ctx.drawImage(col,2.5,-1.5);
    ctx.globalCompositeOperation='multiply';ctx.drawImage(key,0,0);ctx.drawImage(paper(),0,0);ctx.globalCompositeOperation='source-over';
  },
  // Un cómic leído por sus onomatopeyas: rótulos que caen con golpe seco, explosiones BAM,
  // la cámara se desliza suave por la tira, el contador revienta cada segundo.
  score(k,timeline){
    const punch=(t,g,p=0,minor=true)=>{const o={minor};k.tone(t,{...o,f:[[0,210],[0.09,70]],dur:0.14,gain:0.42*g,pan:p});k.noise(t,{...o,dur:0.06,filter:'bandpass',f:1100,q:0.9,gain:0.34*g,a:0.001,pan:p});k.noise(t,{...o,dur:0.015,filter:'highpass',f:2600,gain:0.14*g,a:0.001,pan:p});};
    const bam=(t,g,p=0)=>{k.play('thud',t,{f:120,gain:0.9*g,pan:p});k.noise(t,{dur:0.42,color:'pink',filter:'lowpass',f:[[0,3200],[0.4,380]],gain:0.34*g,a:0.002,verb:0.25,pan:p});k.noise(t,{dur:0.05,filter:'bandpass',f:1400,q:0.8,gain:0.3*g,a:0.001,pan:p});};
    const glide=b=>k.noise(b-0.35,{dur:0.75,color:'brown',filter:'lowpass',f:[[0,260],[0.35,700],[0.75,240]],q:0.7,gain:0.2,a:0.33,minor:true});
    const backAt=(a,b)=>{for(let i=0;i<=200;i++){const t=a+(b-a)*i/200;if(PE.back(i/200)>=1-1e-6)return t;}return b;};
    k.bed('room',0,timeline.duration,{gain:0.18});
    for(const beat of timeline.beats){
      const t0=beat.t0;
      if(beat.index)glide(t0+0.35);
      if(beat.kind==='title'){
        k.play('slap',backAt(0.1,0.35),{gain:0.35,pan:-0.5,minor:true});k.play('pop',backAt(0.3,0.55),{f:260,gain:0.5,pan:0.4,minor:true});
        k.play('pop',backAt(0.5,0.75),{f:330,gain:0.6,pan:-0.3,minor:true});punch(0.75,0.7,-0.3);punch(1.3,0.8,0);
        continue;
      }
      if(beat.kind==='end'){bam(t0+0.55,0.6);punch(t0+1.1,0.5,0);punch(t0+1.7,0.5,0);['C5','E5','G5','C6'].forEach((f,i)=>k.play('ding',t0+3.3+i*0.07,{f,gain:0.34-i*0.05,pan:(i-1.5)*0.2}));continue;}
      const {think,reveal}=beatTimes(beat);
      k.play('slap',t0+0.08,{gain:0.3,pan:-0.5,minor:true});k.play('pop',t0+backAt(0.3,0.55),{f:240,gain:0.5,pan:0.5,minor:true});
      const secs=think[1]-think[0];k.play('pop',think[0],{f:300,gain:0.5,minor:true});
      for(let m=Math.ceil(secs)-1;m>=1;m--){const tt=think[0]+secs-m;k.play('pop',tt,{f:280,gain:0.45,minor:true});k.play('tick',tt,{gain:0.4,minor:true});}
      bam(reveal[0],0.45);
      k.play('pop',reveal[0]+backAt(0.6,0.85),{f:300,gain:0.4,minor:true});
      k.play('success',reveal[0]+backAt(1.3,1.55),{f:'C5',gain:0.4,minor:true});
    }
  },
};
