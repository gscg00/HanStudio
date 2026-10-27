// Estilo «Whiteboard Explainer»: rotulador sobre pizarra blanca. Técnicas
// tomadas del paquete de estilo (marker, mText, wobble, residuo borrado y
// brillo de la pizarra); el contenido es el repaso de la clase.
import {beatTimes,fitFont,glyphUnits,wrapLines} from './shared.js';

const H=window.H;
const BOARD=[236,240,239],K='#1d1f26',B='#1f4fc2',R='#d4262f',G='#16884a';
const HANGUL='"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif';
const MARKER=`"Permanent Marker",${HANGUL}`,HAND=`"Kalam",${HANGUL}`;
const MN=H.makeNoise(4242),NZ=H.makeNoise(11);

const seg=(pts,step=2.5)=>{const out=[];for(let i=0;i<pts.length-1;i++){const [x0,y0]=pts[i],[x1,y1]=pts[i+1],n=Math.max(1,Math.ceil(Math.hypot(x1-x0,y1-y0)/step));for(let j=0;j<n;j++)out.push([x0+(x1-x0)*j/n,y0+(y1-y0)*j/n]);}out.push(pts[pts.length-1]);return out;};
const normals=P=>P.map((p,i)=>{const a=P[Math.max(0,i-1)],b=P[Math.min(P.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1;return[-dy/d,dx/d];});
const wobble=(pts,seed,amp=1.6,freq=0.011)=>{const N=normals(pts);let L=0;return pts.map((p,i)=>{if(i)L+=Math.hypot(p[0]-pts[i-1][0],p[1]-pts[i-1][1]);const o=NZ.n2(L*freq+seed*1.37,seed*0.71)*amp+NZ.n2(L*freq*6+seed,seed+3.3)*amp*0.25;return[p[0]+N[i][0]*o,p[1]+N[i][1]*o];});};
const ell=(cx,cy,rx,ry,a0=0,a1=Math.PI*2)=>{const n=Math.max(10,Math.ceil(Math.abs(a1-a0)*Math.max(rx,ry)/2.5)),out=[];for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n;out.push([cx+Math.cos(a)*rx,cy+Math.sin(a)*ry]);}return out;};
const P=(pts,s,amp=1.7)=>wobble(seg(pts),s,amp);
const tracePath=(ctx,pts)=>{ctx.beginPath();pts.forEach((p,i)=>(i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])));};

// Trazo de rotulador: centro húmedo más claro, bordes con tinta acumulada y vetas secas.
function marker(ctx,pts,col,w,seed,prog=1){
  if(prog<=0)return;
  const Q=prog<1?pts.slice(0,Math.max(2,Math.ceil(pts.length*prog))):pts,r=H.rng(seed),rgb=H.hex(col),N=normals(Q);
  ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
  ctx.strokeStyle=H.rgba(rgb,0.3);ctx.lineWidth=w;tracePath(ctx,Q);ctx.stroke();
  ctx.lineCap='butt';
  for(let i=0;i<Q.length-1;i+=10){const a=0.16+0.22*(0.5+0.5*MN.n2(i*0.03+seed*3.1,seed*0.37));ctx.strokeStyle=H.rgba(rgb,a);ctx.lineWidth=w*0.96;ctx.beginPath();ctx.moveTo(Q[i][0],Q[i][1]);for(let j=i+1;j<=Math.min(Q.length-1,i+10);j++)ctx.lineTo(Q[j][0],Q[j][1]);ctx.stroke();}
  for(let k=0;k<7;k++){const u=k/6-0.5,edge=Math.abs(u)*2,a=(0.08+0.5*Math.pow(edge,2.2))*(0.65+r()*0.7);ctx.strokeStyle=H.rgba(rgb,a);ctx.lineWidth=(w/7)*1.5;const off=u*w*0.84;ctx.beginPath();Q.forEach((p,i)=>{const x=p[0]+N[i][0]*off,y=p[1]+N[i][1]*off;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();}
  for(let k=0;k<4;k++){const off=(r()-0.5)*w*0.6;ctx.strokeStyle=H.rgba(BOARD,0.14+r()*0.2);ctx.lineWidth=0.6+r()*0.6;const s=Math.floor(r()*Q.length*0.4),e=Math.min(Q.length,s+Math.floor(Q.length*(0.3+r()*0.6)));ctx.beginPath();for(let i=s;i<e;i++){const x=Q[i][0]+N[i][0]*off,y=Q[i][1]+N[i][1]*off;i>s?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}
  [Q[0],prog>=1?Q[Q.length-1]:null].forEach((p,j)=>{if(!p)return;const g=ctx.createRadialGradient(p[0],p[1],0,p[0],p[1],w*0.62);g.addColorStop(0,H.rgba(rgb,j?0.25:0.42));g.addColorStop(1,H.rgba(rgb,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(p[0],p[1],w*0.62,0,7);ctx.fill();});
  ctx.restore();
}

// Letras de rotulador, una a una, con temblor por glifo. align: left|center.
function mText(ctx,str,x,y,font,col,seed,prog=1,rot=0,align='left'){
  if(prog<=0)return;
  const r=H.rng(seed),rgb=H.hex(col),chars=glyphUnits(str);
  ctx.save();ctx.font=font;ctx.textBaseline='alphabetic';
  const total=ctx.measureText(str).width;
  ctx.translate(align==='center'?x-Math.cos(rot)*total/2:x,align==='center'?y-Math.sin(rot)*total/2:y);ctx.rotate(rot);
  const n=Math.ceil(chars.length*prog);let cx=0;
  for(let i=0;i<n;i++){const ch=chars[i],wch=ctx.measureText(ch).width;ctx.save();ctx.translate(cx+wch/2,(r()-0.5)*3);ctx.rotate((r()-0.5)*0.07);ctx.fillStyle=H.rgba(rgb,0.8+r()*0.1);ctx.fillText(ch,-wch/2,0);ctx.strokeStyle=H.rgba(rgb,0.7);ctx.lineWidth=1.3;ctx.strokeText(ch,-wch/2,0);ctx.restore();cx+=wch+(r()-0.5)*1.5;}
  ctx.restore();
}

// Pizarra con residuo de una lección borrada (estático: se hornea una vez).
let boardCache=null;
function board(ctx,W,Hh){
  if(!boardCache){
    const cv=H.layer(W,Hh),c=cv.getContext('2d');
    const bg=c.createLinearGradient(0,0,W,Hh);bg.addColorStop(0,'#f6f8f7');bg.addColorStop(0.55,'#ecefee');bg.addColorStop(1,'#dfe4e3');c.fillStyle=bg;c.fillRect(0,0,W,Hh);
    const rb=H.rng(5);for(let i=0;i<14;i++){const x=rb.range(26,W-26),y=rb.range(26,650),rr=rb.range(80,260),g=c.createRadialGradient(x,y,0,x,y,rr);g.addColorStop(0,`rgba(150,160,165,${rb.range(0.015,0.04)})`);g.addColorStop(1,'rgba(150,160,165,0)');c.fillStyle=g;c.fillRect(x-rr,y-rr,rr*2,rr*2);}
    const g=H.layer(W,Hh),gc=g.getContext('2d');gc.strokeStyle='#30343c';gc.fillStyle='#30343c';gc.lineCap='round';gc.lineWidth=7;
    gc.font=`400 52px ${MARKER}`;gc.fillText('VOCABULARIO',820,112);gc.font=`700 34px ${HAND}`;['- repasar ayer','- escuchar x3','- frases ✓'].forEach((s,i)=>gc.fillText(s,850,170+i*44));
    tracePath(gc,wobble(seg([[810,130],[1190,126]]),40));gc.stroke();
    gc.beginPath();gc.arc(190,560,70,0,7);gc.stroke();gc.font=`700 30px ${HAND}`;gc.fillText('1 · 2 · 3',330,640);
    const m=H.layer(W,Hh),mc=m.getContext('2d'),rm=H.rng(77);mc.lineCap='round';
    for(let i=0;i<70;i++){const y=rm.range(40,660),x=rm.range(20,1100),len=rm.range(150,420);mc.strokeStyle=`rgba(0,0,0,${rm.range(0.15,0.8)})`;mc.lineWidth=rm.range(4,26);mc.beginPath();mc.moveTo(x,y);mc.quadraticCurveTo(x+len/2,y+rm.range(-30,30),x+len,y+rm.range(-18,18));mc.stroke();}
    gc.globalCompositeOperation='destination-in';gc.drawImage(m,0,0);
    c.save();c.filter='blur(0.7px)';c.globalAlpha=0.1;c.drawImage(g,0,0);c.restore();
    let ready=true;try{ready=document.fonts.check(`400 52px "Permanent Marker"`);}catch{}
    if(!ready){ctx.drawImage(cv,0,0);return;}
    boardCache=cv;
  }
  ctx.drawImage(boardCache,0,0);
}

// Brillo de la pizarra (se mueve un poco con el tiempo) y viñeta suave.
function sheen(ctx,W,Hh,t){
  ctx.save();const sh=ctx.createLinearGradient(220+t*6,-60,760+t*6,760);
  sh.addColorStop(0,'rgba(255,255,255,0)');sh.addColorStop(0.36,'rgba(255,255,255,0)');sh.addColorStop(0.43,'rgba(255,255,255,0.22)');sh.addColorStop(0.47,'rgba(255,255,255,0.1)');sh.addColorStop(0.5,'rgba(255,255,255,0.26)');sh.addColorStop(0.6,'rgba(255,255,255,0)');sh.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=sh;ctx.fillRect(0,0,W,Hh);ctx.restore();
  H.vignette(ctx,W,Hh,0.18,'40,50,55');
}

const box=(x0,y0,x1,y1)=>[[x0-6,y0+2],[x1+4,y0-2],[x1+1,y1+6],[x0+2,y1+1],[x0+1,y0-8]];

function picture(ctx,img,x,y,size,seed,p){
  marker(ctx,P(box(x,y,x+size,y+size),seed,2),K,6,seed*7,H.clamp(p*1.6));
  if(img&&p>0.3){ctx.save();ctx.globalAlpha=H.clamp((p-0.3)/0.4);ctx.drawImage(img,x+18,y+18,size-36,size-36);ctx.restore();}
}

// Altavoz dibujado con ondas que laten mientras suena.
function speaker(ctx,x,y,t,p,seed){
  marker(ctx,P([[x,y-24],[x+26,y-24],[x+58,y-56],[x+58,y+56],[x+26,y+24],[x,y+24],[x,y-24]],seed,1.2),K,7,seed*3,p);
  for(let i=0;i<3;i++){const pulse=0.5+0.5*Math.sin(t*6-i*0.9);marker(ctx,P(ell(x+70,y,28+i*26,40+i*30,-0.9,0.9),seed+i,0.8),B,6,seed*5+i,H.clamp(p*2-0.6-i*0.15)*(0.55+0.45*pulse));}
}

// Cuenta atrás: un círculo que se cierra y el número reescrito cada segundo.
function countdown(ctx,cx,cy,phaseP,seconds,label,seed){
  const left=Math.max(1,Math.ceil(seconds*(1-phaseP)));
  marker(ctx,P(ell(cx,cy,118,112,-Math.PI/2,-Math.PI/2+Math.PI*2*phaseP),seed,1.4),R,9,seed*3,1);
  mText(ctx,String(left),cx,cy+44,`400 128px ${MARKER}`,K,seed+left,1,0,'center');
  mText(ctx,label,cx,cy+196,`700 46px ${HAND}`,R,seed+9,H.clamp(phaseP*6),-0.01,'center');
}

function writeFit(ctx,text,x,y,maxW,size,font,col,seed,prog,rot=0){
  const lines=wrapLines(ctx,text,maxW,size,font,2),fs=fitFont(ctx,lines,maxW,size,font);
  lines.forEach((line,i)=>mText(ctx,line,x,y+i*fs*1.12,`${font.replace('SIZE',fs)}`,col,seed+i,H.clamp(prog*lines.length-i),rot,'center'));
  return fs*lines.length*1.12;
}

function drawBeat(ctx,W,Hh,t,S,beat){
  const local=t-beat.t0,seed=beat.index*97+11;
  if(beat.kind==='title'){
    mText(ctx,(beat.heading||`REPASO · CLASE ${beat.classNumber}`),96,170,`400 72px ${MARKER}`,K,seed,H.clamp(local/1.1),-0.012);
    marker(ctx,P([[90,198],[420,193],[700,188]],seed,2.2),B,8,seed+1,H.clamp((local-1.1)/0.3));
    writeFit(ctx,beat.unitTitle||'',420,300,640,52,`700 SIZEpx ${HAND}`,K,seed+3,H.clamp((local-1.3)/0.8));
    mText(ctx,(beat.tagline||'¿Cuánto recuerdas?'),420,470,`700 54px ${HAND}`,R,seed+5,H.clamp((local-2)/0.8),-0.02,'center');
    if(S.assets.scene&&local>0.6){const p=H.clamp((local-0.6)/0.8);marker(ctx,P(box(800,250,1190,520),seed+8,2),K,6,seed*7,H.clamp(p*1.6));if(p>0.3){ctx.save();ctx.globalAlpha=H.clamp((p-0.3)/0.4);ctx.drawImage(S.assets.scene,812,262,366,246);ctx.restore();}}
    return;
  }
  if(beat.kind==='end'){
    mText(ctx,'¡Muy bien!',640,250,`400 96px ${MARKER}`,G,seed,H.clamp(local/0.9),-0.015,'center');
    marker(ctx,P([[400,282],[640,276],[880,272]],seed,2),G,8,seed+1,H.clamp((local-0.9)/0.3));
    mText(ctx,(beat.tally||`${beat.total} frases repasadas`),640,390,`700 52px ${HAND}`,K,seed+2,H.clamp((local-1.2)/0.7),0,'center');
    mText(ctx,(beat.closing||'Mañana vuelven: ¡no las sueltes!'),640,470,`700 48px ${HAND}`,R,seed+3,H.clamp((local-1.9)/0.9),-0.01,'center');
    marker(ctx,P([[1010,360],[1030,392],[1080,320]],seed+4,0.8),G,10,seed+5,H.clamp((local-1.1)/0.25));
    return;
  }
  const {ask,think,reveal}=beatTimes(beat),item=beat.item,img=S.assets.picture(item.picture),listen=beat.kind==='listen';
  mText(ctx,`${beat.number} / ${beat.total}`,1120,92,`700 36px ${HAND}`,'#6b7280',seed,1);
  mText(ctx,listen?'ESCUCHA':'¿CÓMO SE DICE?',96,110,`400 50px ${MARKER}`,listen?B:R,seed+1,H.clamp(local/0.6),-0.01);
  marker(ctx,P([[92,132],[360,128]],seed+2,1.6),listen?B:R,7,seed+3,H.clamp((local-0.6)/0.25));
  const pictureX=img?820:0;
  if(img)picture(ctx,img,pictureX,170,330,seed+4,H.clamp((local-0.2)/0.8));
  const cx=img?420:640;
  if(t<think[0]){
    if(listen)speaker(ctx,cx-70,330,t,H.clamp((local-0.3)/0.7),seed+6);
    else writeFit(ctx,item.es,cx,330,img?640:1000,64,`700 SIZEpx ${HAND}`,K,seed+6,H.clamp((local-0.3)/1));
  }else if(t<reveal[0]){
    countdown(ctx,cx,320,(t-think[0])/(think[1]-think[0]),think[1]-think[0],listen?'¿Qué significa?':'¡Dilo en voz alta!',seed+20);
  }else{
    const r=t-reveal[0];
    if(listen){
      const used=writeFit(ctx,item.es,cx,300,img?660:1000,62,`700 SIZEpx ${HAND}`,G,seed+30,H.clamp(r/0.9));
      writeFit(ctx,item.ko,cx,330+used,img?640:1000,58,`400 SIZEpx ${MARKER}`,B,seed+40,H.clamp((r-0.8)/0.8));
    }else{
      const used=writeFit(ctx,item.ko,cx,300,img?660:1000,80,`400 SIZEpx ${MARKER}`,B,seed+30,H.clamp(r/0.9));
      writeFit(ctx,item.es,cx,320+used,img?640:1000,40,`700 SIZEpx ${HAND}`,'#4b5563',seed+40,H.clamp((r-0.6)/0.6));
      ctx.save();ctx.font=`400 ${Math.round(used/1.12)}px ${MARKER}`;const half=Math.min(img?340:600,ctx.measureText(item.ko).width/2+50);ctx.restore();
      marker(ctx,P(ell(cx,300-30,half,74,-2.3,4.2),seed+50,1.6),R,6,seed+51,H.clamp((r-1)/0.4));
    }
    marker(ctx,P([[cx+250,500],[cx+272,532],[cx+330,452]],seed+60,0.8),G,10,seed+61,H.clamp((r-0.4)/0.3));
  }
}

export default {
  id:'whiteboard',
  name:'Pizarra blanca',
  fonts:['400 66px "Permanent Marker"','700 38px "Kalam"'],
  fontCss:'https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=Permanent+Marker&display=block',
  readsPixels:false,
  frame(ctx,W,Hh,t,S){
    board(ctx,W,Hh);
    // Cambio de escena a la manera del medio: el borrador limpia la pizarra.
    if(S.prev&&S.local<0.7){
      const x=-140+S.local/0.7*(W+280);
      ctx.save();ctx.beginPath();ctx.rect(x+60,0,W,Hh);ctx.clip();drawBeat(ctx,W,Hh,S.prev.t1-0.001,S,S.prev);ctx.restore();
      ctx.save();ctx.translate(x,Hh/2);ctx.rotate(-0.05);ctx.fillStyle='#3b4a63';ctx.fillRect(-12,-150,52,300);ctx.fillStyle='#d9d4c7';ctx.fillRect(40,-150,26,300);ctx.restore();
    }else drawBeat(ctx,W,Hh,t,S,S.beat);
    sheen(ctx,W,Hh,t);
  },
  score(k,timeline){
    const stroke=(a,b,gain=0.8,minor=true)=>{k.noise(a,{dur:0.022,filter:'bandpass',f:1500,q:1.4,gain:0.22*gain,a:0.001,minor});k.play('stroke',a,{material:'marker',dur:Math.max(0.05,b-a),gain,minor});};
    for(const beat of timeline.beats){
      if(beat.index)k.play('erase',beat.t0,{dur:0.65,gain:0.5,minor:true});
      if(beat.kind==='title'){stroke(0.05,1.1,0.9);stroke(1.1,1.4,1.1,false);stroke(1.3,2.1,0.7);continue;}
      if(beat.kind==='end'){stroke(beat.t0,beat.t0+0.9,0.9);k.play('success',beat.t0+1.1,{gain:0.7});continue;}
      const {think,reveal}=beatTimes(beat);
      stroke(beat.t0,beat.t0+0.6,0.7);stroke(beat.t0+0.2,beat.t0+0.9,0.6);
      for(let s=think[0];s<think[1]-0.2;s+=1)k.play('tick',s,{gain:0.5,minor:true});
      k.play('ding',reveal[0],{gain:0.55});stroke(reveal[0],reveal[0]+0.9,0.8);
      k.play('success',reveal[0]+0.45,{gain:0.4,minor:true});
    }
  },
};
