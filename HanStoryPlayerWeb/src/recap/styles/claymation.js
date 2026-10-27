// Estilo «Plastilina»: stop-motion sobre un plató de plastilina. Técnicas del paquete:
// cada pieza es un bulto de plastilina horneado (relieve con normales, subsuperficie
// cálida, brillo céreo, huellas dactilares y marcas de palillo), animado a doses
// (12 fps) con squash & stretch al aparecer; las piezas se caen de la mesa o se
// barren a un lado para cambiar de escena; letras y números son plastilina prensada
// y se rehacen cada vez que cambian. Acabado de lente: soft-light cálido/frío,
// viñeta, parpadeo de exposición por fotograma y grano.
import {beatTimes,fitFont,glyphUnits,wrapLines} from './shared.js';

const H=window.H,TAU=Math.PI*2;
const KR='"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif';
const FR=px=>`700 ${px}px "Fredoka",${KR}`;
const W=1280,HH=720;
const nrm=a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l];};
const LIGHT=nrm([-0.5,-0.66,0.58]),HALF=nrm([LIGHT[0],LIGHT[1],LIGHT[2]+1]);
const POP=[[0.5,0.42],[1.16,0.8],[0.9,1.14],[1.04,0.97],[1,1]];
const PAL=['#f2c14e','#f07b5a','#f6efe3','#ef8fb0','#a8dd8a'];
const CREAM='#f6efe3',YEL='#f2c14e',CORAL='#f07b5a',NAVY='#2e3760',GREEN='#4f9a52';

// ---------- horneado de bultos de plastilina (del paquete) ----------
const CLX={};
const cnz=()=>CLX.nz||(CLX.nz=H.makeNoise(8));
const bake=(key,w,h,o)=>{
  if(CLX[key])return CLX[key];
  const nz=cnz(),R=o.R||14,pad=Math.ceil(R*2+6),ox=o.ox||0,oy=o.oy||0;
  const W2=Math.ceil(w+pad*2),H2=Math.ceil(h+pad*2);
  const M=H.layer(W2,H2),mc=M.getContext('2d',{willReadFrequently:true});
  mc.translate(pad,pad);mc.fillStyle='#fff';mc.strokeStyle='#fff';o.draw(mc);
  const ds=3,sw=Math.ceil(W2/ds),sh=Math.ceil(H2/ds);
  const Bs=H.layer(sw,sh),bsc=Bs.getContext('2d');bsc.filter=`blur(${R/ds}px)`;bsc.drawImage(M,0,0,sw,sh);
  const B=H.layer(W2,H2),bc=B.getContext('2d',{willReadFrequently:true});bc.drawImage(Bs,0,0,W2,H2);
  const md=mc.getImageData(0,0,W2,H2).data,bd=bc.getImageData(0,0,W2,H2).data;
  const Hh=new Float32Array(W2*H2),A=new Float32Array(W2*H2),lump=o.lump??1.2,seed=o.seed||1;
  for(let y=0;y<H2;y++)for(let x=0;x<W2;x++){
    const i=y*W2+x,a=bd[i*4+3]/255,ap=H.clamp((a-0.42)/0.58);A[i]=ap;if(!md[i*4+3])continue;
    const X=x+ox,Y=y+oy;Hh[i]=Math.sqrt(1-(1-ap)*(1-ap))*R*(o.dome??1.1)+nz.n2(X*0.025+seed,Y*0.025)*lump+nz.n2(X*0.11+(o.boil||0)*1.7,Y*0.11+seed)*0.35;
  }
  (o.fps||[]).forEach(f=>{ // huellas dactilares
    const R2=f[2],ang=f[3],ca=Math.cos(ang),sa=Math.sin(ang);
    for(let y=Math.max(0,Math.floor(f[1]+pad-R2));y<=Math.min(H2-1,f[1]+pad+R2);y++)for(let x=Math.max(0,Math.floor(f[0]+pad-R2));x<=Math.min(W2-1,f[0]+pad+R2);x++){
      const dx0=x-pad-f[0],dy0=y-pad-f[1],dx=dx0*ca+dy0*sa,dy=(-dx0*sa+dy0*ca)*1.45,d=Math.hypot(dx,dy);if(d>=R2)continue;
      Hh[y*W2+x]+=Math.sin(d*1.6+nz.n2(dx*0.06+ang,dy*0.06)*2.5)*0.22*Math.pow(1-d/R2,1.5)*H.smooth(-0.6,0.4,Math.cos(Math.atan2(dy,dx)-ang*2));
    }
  });
  (o.marks||[]).forEach(m=>{ // marcas de palillo
    const [ax,ay,bx,by]=m.map((v,i)=>(i<4?v+pad:v)),vx=bx-ax,vy=by-ay,L2=vx*vx+vy*vy||1,dep=m[4]||1.2;
    for(let y=Math.max(0,Math.floor(Math.min(ay,by)-9));y<=Math.min(H2-1,Math.max(ay,by)+9);y++)for(let x=Math.max(0,Math.floor(Math.min(ax,bx)-9));x<=Math.min(W2-1,Math.max(ax,bx)+9);x++){
      const u=H.clamp(((x-ax)*vx+(y-ay)*vy)/L2),d=Math.hypot(x-ax-vx*u,y-ay-vy*u);if(d>8)continue;
      Hh[y*W2+x]+=Math.sin(Math.PI*Math.min(1,u*1.05+0.02))*(-dep*Math.exp((-d*d)/(o.markW||3.2))+0.4*dep*Math.exp(-((d-3.4)**2)/2));
    }
  });
  const out=mc.createImageData(W2,H2),od=out.data,base=H.hex(o.color),sss=o.sss||[1.12,0.92,0.85];
  for(let y=1;y<H2-1;y++)for(let x=1;x<W2-1;x++){
    const i=y*W2+x,ma=md[i*4+3];if(!ma)continue;
    const n=nrm([-(Hh[i+1]-Hh[i-1])*0.5,-(Hh[i+W2]-Hh[i-W2])*0.5,1]);
    const diff=H.clamp((n[0]*LIGHT[0]+n[1]*LIGHT[1]+n[2]*LIGHT[2]+0.42)/1.42),spec=Math.pow(Math.max(0,n[0]*HALF[0]+n[1]*HALF[1]+n[2]*HALF[2]),26)*(o.spec??0.3);
    const k=(0.3+0.86*diff)*(0.72+0.28*Math.min(1,A[i]*1.4)),sh2=1-diff,k4=i*4;
    od[k4]=Math.min(255,base[0]*k*(1+(sss[0]-1)*sh2)+spec*255);od[k4+1]=Math.min(255,base[1]*k*(1+(sss[1]-1)*sh2)+spec*245);od[k4+2]=Math.min(255,base[2]*k*(1+(sss[2]-1)*sh2)+spec*230);od[k4+3]=ma;
  }
  const O=H.layer(W2,H2);O.getContext('2d').putImageData(out,0,0);O.pad=pad;O.w=w;O.h=h;
  return(CLX[key]=O);
};
// coloca un sprite: (x,y) = esquina del bulto; ancla (ax,ay) local para aplastar / girar
const place=(ctx,spr,x,y,o={})=>{
  if(!spr)return;const ax=o.ax??spr.w/2,ay=o.ay??spr.h;ctx.save();
  if(o.shadow!==false){const s=o.shadow||{};ctx.shadowColor=`rgba(40,20,10,${s.a??0.4})`;ctx.shadowBlur=s.blur??10;ctx.shadowOffsetX=s.dx??6;ctx.shadowOffsetY=s.dy??7;}
  ctx.translate(x+ax,y+ay);if(o.rot)ctx.rotate(o.rot);ctx.scale(o.sx??1,o.sy??1);ctx.translate(-ax,-ay);ctx.drawImage(spr,-spr.pad,-spr.pad);ctx.restore();
};
const prn=(seed,w,h,n,R)=>{const r=H.rng(seed);return Array.from({length:n},()=>[r.range(w*0.15,w*0.85),r.range(h*0.15,h*0.85),R*r.range(0.7,1.2),r()*50]);};
const mctx=()=>CLX.m||(CLX.m=H.layer(4,4).getContext('2d'));
let fontsOk=false;
const fontsReady=()=>fontsOk||(fontsOk=(()=>{try{return document.fonts.check('700 44px "Fredoka"');}catch{return true;}})());
const glyph=(ch,px,col)=>{
  const c=mctx();c.font=FR(px);const w=Math.ceil(c.measureText(ch).width)+4,h=Math.ceil(px*1.05);
  return bake('g'+(fontsReady()?1:0)+ch+px+col,w,h,{R:Math.max(4,px*0.075),dome:1.3,lump:0.8,seed:ch.charCodeAt(0)+ch.length,color:col,draw:x=>{x.font=FR(px);x.fillText(ch,2,px*0.82);},fps:px>60?prn(ch.charCodeAt(0)+px,w,h,1,px*0.18):[]});
};
const wordW=(str,px)=>{const c=mctx();c.font=FR(px);let w=0;for(const ch of glyphUnits(str))w+=c.measureText(ch).width+px*0.04;return w;};

// ---------- utilería horneada ----------
const SPR={
  check:()=>bake('check',120,100,{R:10,lump:0.6,seed:74,color:GREEN,draw:c=>{c.lineWidth=26;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(14,54);c.lineTo(44,84);c.lineTo(106,16);c.stroke();}}),
  star:()=>bake('star',120,120,{R:12,lump:0.6,seed:75,color:YEL,spec:0.5,draw:c=>{c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+(i/10)*TAU,r=i%2?24:58;c.lineTo(60+Math.cos(a)*r,62+Math.sin(a)*r);}c.closePath();c.fill();}}),
  disc:()=>bake('disc',300,300,{R:22,lump:1.2,seed:51,color:CREAM,sss:[1.05,1,0.98],draw:c=>{c.beginPath();c.arc(150,150,150,0,TAU);c.fill();},fps:prn(52,300,300,2,26)}),
  ball:i=>bake('ball'+(i%3),44,44,{R:10,dome:1.3,lump:0.5,seed:60+i%3,color:[CORAL,YEL,'#ef8fb0'][i%3],spec:0.5,draw:c=>{c.beginPath();c.arc(22,22,22,0,TAU);c.fill();}}),
  wave:i=>{const r=170+i*58,a=0.62,w=r*2+40,h=Math.ceil(2*r*Math.sin(a))+40;return bake('wave'+i,w,h,{R:7,dome:1.3,lump:0.6,seed:20+i,color:CREAM,draw:c=>{c.lineWidth=16;c.lineCap='round';for(const [a0,a1] of [[-a,a],[Math.PI-a,Math.PI+a]]){c.beginPath();c.arc(w/2,h/2,r,a0,a1);c.stroke();}}});},
};
// altavoz de plastilina: caja, cono y tweeter (compuesto una vez)
function speaker(){
  if(CLX.spk)return CLX.spk;
  const C=H.layer(220,290),c=C.getContext('2d');
  const pc=(spr,x,y,b=5)=>{c.save();c.shadowColor='rgba(40,20,10,0.4)';c.shadowBlur=b;c.shadowOffsetX=3;c.shadowOffsetY=4;c.drawImage(spr,x-spr.pad,y-spr.pad);c.restore();};
  pc(bake('spkBody',200,270,{R:16,lump:1.2,seed:33,color:CORAL,draw:x=>{x.beginPath();x.roundRect(0,0,200,270,28);x.fill();},fps:prn(34,200,270,2,22),marks:[[20,248,180,248,1.4]]}),10,10);
  pc(bake('spkCone',150,150,{R:20,dome:0.6,lump:0.8,seed:35,color:CREAM,draw:x=>{x.beginPath();x.arc(75,75,75,0,TAU);x.fill();},marks:[[75,8,75,40,1.6],[75,110,75,142,1.6],[8,75,40,75,1.6],[110,75,142,75,1.6]]}),45,105);
  pc(bake('spkDome',54,54,{R:12,dome:1.4,lump:0.3,seed:36,color:'#23202a',spec:0.8,draw:x=>{x.beginPath();x.arc(27,27,27,0,TAU);x.fill();}}),93,153);
  pc(bake('spkTw',50,50,{R:10,dome:1.2,lump:0.4,seed:37,color:YEL,draw:x=>{x.beginPath();x.arc(25,25,25,0,TAU);x.fill();}}),85,32);
  C.pad=0;C.w=220;C.h=290;return(CLX.spk=C);
}
// cuadro de plastilina con la ilustración dentro (compuesto una vez por imagen)
function picCard(key,img,w,h){
  const k='pic'+key+w+'x'+h;if(CLX[k])return CLX[k];
  const C=H.layer(w+20,h+20),c=C.getContext('2d');
  const slab=bake('slab'+w+'x'+h,w-24,h-24,{R:10,dome:0.6,lump:0.8,seed:5,color:CREAM,sss:[1.04,1,1],draw:x=>{x.beginPath();x.roundRect(0,0,w-24,h-24,14);x.fill();},fps:prn(6,w-24,h-24,2,20)});
  c.drawImage(slab,22-slab.pad,22-slab.pad);
  if(img){const iw=img.width||1,ih=img.height||1,s=Math.min((w-70)/iw,(h-70)/ih);c.save();c.globalAlpha=0.94;c.drawImage(img,10+(w-iw*s)/2,10+(h-ih*s)/2,iw*s,ih*s);c.restore();}
  const fr=bake('frame'+w+'x'+h,w,h,{R:12,dome:1.2,lump:1.4,seed:7,color:YEL,draw:x=>{x.beginPath();x.roundRect(0,0,w,h,26);x.fill();x.globalCompositeOperation='destination-out';x.beginPath();x.roundRect(26,26,w-52,h-52,14);x.fill();x.globalCompositeOperation='source-over';},fps:prn(8,w,h,3,22),marks:[[30,12,w*0.4,12,1.2],[w-12,h*0.3,w-12,h*0.6,1.2]]});
  c.save();c.shadowColor='rgba(40,20,10,0.45)';c.shadowBlur=8;c.shadowOffsetX=4;c.shadowOffsetY=5;c.drawImage(fr,10-fr.pad,10-fr.pad);c.restore();
  C.pad=0;C.w=w+20;C.h=h+20;
  if(!img||img.complete!==false)CLX[k]=C;
  return C;
}
// plató: pared y mesa, horneados una vez
function set(ctx){
  if(!CLX.bg){
    const nz=cnz(),C=H.layer(W,HH),c=C.getContext('2d');
    c.fillStyle='#3f8593';c.fillRect(0,0,W,HH);
    const wall=bake('wall',W,520,{R:4,dome:0,lump:3.2,seed:3,color:'#4f9fae',spec:0.12,draw:x=>x.fillRect(-30,-30,W+60,580),fps:prn(11,W,470,12,30),markW:14});
    c.save();c.filter='blur(1.6px)';c.drawImage(wall,-wall.pad,-wall.pad);c.restore();
    const g=c.createRadialGradient(620,220,30,640,300,760);g.addColorStop(0,'rgba(255,240,200,0.22)');g.addColorStop(1,'rgba(10,20,30,0.35)');c.fillStyle=g;c.fillRect(0,0,W,HH);
    const tab=bake('table',W+80,240,{R:22,dome:1.0,lump:2.4,seed:80,color:'#d0703f',draw:x=>{x.beginPath();x.moveTo(0,14);for(let X=0;X<=W+80;X+=20)x.lineTo(X,6+nz.n2(X*0.01,3)*8);x.lineTo(W+80,300);x.lineTo(0,300);x.closePath();x.fill();},fps:prn(81,W,200,7,30),marks:(()=>{const r=H.rng(82);return Array.from({length:6},()=>{const x=r.range(40,W),y=r.range(40,200),a=r()*TAU,l=r.range(50,110);return[x,y,x+Math.cos(a)*l,y+Math.sin(a)*l,1.2];});})(),markW:16});
    c.save();c.shadowColor='rgba(40,20,10,0.35)';c.shadowBlur=30;c.shadowOffsetY=-10;c.drawImage(tab,-40-tab.pad,500-tab.pad);c.restore();
    const g2=c.createLinearGradient(0,600,0,HH);g2.addColorStop(0,'rgba(60,20,10,0)');g2.addColorStop(1,'rgba(60,20,10,0.35)');c.fillStyle=g2;c.fillRect(0,600,W,120);
    CLX.bg=C;
  }
  ctx.drawImage(CLX.bg,0,0);
}
// sombra de contacto sobre la mesa
const AO=()=>CLX.ao||(CLX.ao=(()=>{const C=H.layer(240,100),c=C.getContext('2d');c.filter='blur(10px)';c.fillStyle='rgb(70,20,5)';c.beginPath();c.ellipse(120,50,90,22,0,0,TAU);c.fill();return C;})());
const contact=(ctx,cx,cy,rx,ry,a=0.45)=>{ctx.save();ctx.globalAlpha=a;ctx.drawImage(AO(),cx-(rx*120)/90,cy-(ry*50)/22,(rx*240)/90,(ry*100)/22);ctx.restore();};

// ---------- vida de una pieza (a doses): aparece con squash & stretch, se va cayendo o barrida ----------
// G: {lt tiempo local cuantizado, leave segundos desde que el beat se desmonta, mode, all/dry para precalentar}
function life(G,st,o={}){
  if(G.all)return{sx:1,sy:1,dx:0,dy:0,rot:0};
  const lt=G.lt;if(lt+1e-6<st)return null;
  const k=Math.floor((lt-st)*12+1e-6),e=POP[Math.min(4,k>>1)],stag=(o.stag||0)/24;
  let d=-1,mode=G.mode;
  if(o.en!=null&&lt>=o.en){d=lt-o.en-stag;mode=o.mode||'fall';}
  if(G.leave!=null){const dd=G.leave-(mode==='fall'?stag:0);if(dd>d)d=dd;}
  let dx=0,dy=0,rot=0;
  if(d>=0){const q=d+1/12;if(mode==='fall'){dy=2400*q*q;rot=((((o.seed||0)*37)%10)/10-0.5)*q*5;}else dx=2600*q*q;if(dy>900||dx>1500)return null;}
  return{sx:e[0],sy:e[1],dx,dy,rot};
}
const obj=(G,ctx,spr,x,y,L,o={})=>{if(L&&!G.dry)place(ctx,spr(),x+L.dx,y+L.dy,{...o,sx:(o.sx??1)*L.sx,sy:(o.sy??1)*L.sy,rot:(o.rot||0)+L.rot});};
// palabra de letras prensadas, una pieza por letra
function word(G,ctx,str,x,y,px,st,cols=PAL,o={}){
  const m=mctx();m.font=FR(px);let cx=x,i=0;const step=o.step??1/24,off=o.colOff||0;
  for(const ch of glyphUnits(str)){
    const w=m.measureText(ch).width;
    if(ch!==' '){
      const col=typeof cols==='string'?cols:cols[(i+off)%cols.length];
      if(G.dry)G.req.push([ch,px,col]);
      else{const L=life(G,st+i*step,{seed:i+off,stag:i,en:o.en,mode:o.mode});
        if(L){const jr=H.rng(ch.charCodeAt(0)*7+i+off);place(ctx,glyph(ch,px,col),cx+L.dx+(o.dx||0),y-px*0.82+L.dy,{sx:L.sx,sy:L.sy,rot:(jr()-0.5)*0.14+L.rot,shadow:{blur:px*0.09,dx:px*0.05,dy:px*0.07,a:0.45}});}}
    }
    cx+=w+px*0.04;i++;
  }
}
// bloque centrado de hasta 2 líneas que cabe en maxW
function block(G,ctx,text,cx,y,maxW,size,st,cols,o={}){
  const font=FR('SIZE').replace('SIZEpx','SIZEpx'),m=mctx(),ls=wrapLines(m,text,maxW,size,font,2),fs=fitFont(m,ls,maxW*0.95,size,font,o.min||40),lh=fs*1.12;
  const y0=o.mid?y-(ls.length-1)*lh/2+fs*0.36:y;let k=0;ls.forEach((l,i)=>{word(G,ctx,l,cx-wordW(l,fs)/2,y0+i*lh,fs,st+k/24,cols,{...o,colOff:k});k+=[...l].length;});
  return ls.length*lh;
}

// ---------- contenido de cada beat ----------
function drawBeat(G,ctx,S,beat){
  const lt=G.lt,fr=G.fr;
  if(beat.kind==='title'){
    word(G,ctx,`REPASO · CLASE ${beat.classNumber}`,56,150,70,0.1,PAL);
    block(G,ctx,beat.unitTitle||'',390,310,640,80,0.7,CREAM,{min:48,mid:true});
    const sc=S.assets.scene;obj(G,ctx,()=>picCard('scene',sc,410,290),800,130,life(G,0.4,{seed:2}),{shadow:{blur:16,dx:10,dy:12,a:0.45}});
    const q='¿Cuánto recuerdas?';word(G,ctx,q,640-wordW(q,72)/2,632,72,1.3,YEL);
    return;
  }
  if(beat.kind==='end'){
    const m='¡Muy bien!';word(G,ctx,m,640-wordW(m,128)/2,250,128,0.5,PAL,{step:1/12});
    const f=`${beat.total} frases repasadas`;word(G,ctx,f,640-wordW(f,78)/2,390,78,1.1,CREAM);
    block(G,ctx,'Mañana vuelven: ¡no las sueltes!',640,632,1180,66,1.7,YEL);
    obj(G,ctx,SPR.star,1090,70,life(G,1.0,{seed:5}),{rot:Math.round(lt*6)*0.08,ax:60,ay:60,shadow:{blur:10,dx:6,dy:8,a:0.45}});
    obj(G,ctx,SPR.star,90,330,life(G,1.25,{seed:6}),{sx:0.7,sy:0.7,rot:-Math.round(lt*6)*0.08,ax:60,ay:60,shadow:{blur:10,dx:6,dy:8,a:0.45}});
    return;
  }
  const {think,reveal}=beatTimes(beat),item=beat.item,img=S.assets.picture(item.picture),listen=beat.kind==='listen';
  const th=think[0]-beat.t0,rv=reveal[0]-beat.t0,secs=think[1]-think[0],cx=img?440:640,maxW=img?720:1000;
  word(G,ctx,listen?'ESCUCHA':'¿Cómo se dice?',40,100,66,0.3,listen?YEL:CORAL);
  const cnt=`${beat.number}/${beat.total}`;word(G,ctx,cnt,1240-wordW(cnt,66),100,66,0.4,CREAM);
  if(img){const L=life(G,0.45,{seed:3});if(L&&!G.dry){contact(ctx,1040+L.dx,512+L.dy,150*L.sx,12);}obj(G,ctx,()=>picCard(item.picture,img,300,300),880,195,L,{shadow:{blur:14,dx:8,dy:10,a:0.45}});}
  // pregunta
  if(G.all||lt<th+0.8){
    if(listen){
      const L=life(G,0.5,{en:th,seed:1});if(L&&!G.dry)contact(ctx,cx+L.dx,512+L.dy,120*L.sx,12);
      obj(G,ctx,speaker,cx-110,220,L,{sx:1.3,sy:1.3,shadow:{blur:16,dx:10,dy:10,a:0.45}});
      const ph=Math.floor(lt*6)%4;
      for(let i=0;i<3;i++){if(!G.all&&i>=ph&&lt<th)continue;const s=SPR.wave(i);obj(G,ctx,()=>s,cx-s.w/2,367-s.h/2,life(G,0.9+i/6,{en:th,seed:i+4}),{ay:s.h/2,shadow:{blur:6,dx:4,dy:6,a:0.4}});}
    }else block(G,ctx,item.es,cx,290,maxW,120,0.6,PAL,{en:th,mid:true,min:56});
  }
  // cuenta atrás: disco con el número re-prensado cada segundo y bolitas que se caen de la mesa
  if(G.all||(lt>=th-0.1&&lt<rv+0.8)){
    const L=life(G,th,{en:rv,seed:2});obj(G,ctx,SPR.disc,cx-150,100,L,{ay:150,shadow:{blur:18,dx:10,dy:12,a:0.45}});
    const N=Math.ceil(secs-1e-6);
    for(let n=N;n>=1;n--){
      const st=th+Math.max(0,secs-n),en=Math.min(rv,th+secs-(n-1));if(!G.all&&(lt<st-0.01||lt>en+0.8))continue;
      const s=String(n),px=190;word(G,ctx,s,cx-wordW(s,px)/2,330,px,st+1/12,NAVY,{step:0,en,mode:'fall'});
    }
    for(let j=0;j<N;j++){const bx=cx-(N-1)*32+j*64-22;obj(G,ctx,()=>SPR.ball(j),bx,462,life(G,th+0.1+j/12,{en:th+secs-j,seed:j+9}),{shadow:{blur:6,dx:4,dy:5,a:0.4}});}
    const lab=listen?'¿Qué significa?':'¡Dilo en voz alta!';word(G,ctx,lab,640-wordW(lab,72)/2,632,72,th+0.2,CREAM,{en:rv});
  }
  // respuesta
  if(G.all||lt>=rv){
    const shake=lt>=rv+0.25&&lt<rv+0.6?((fr%2)*2-1)*7:0;
    if(listen){
      block(G,ctx,item.es,cx,270,maxW,116,rv,PAL,{min:56,dx:shake,mid:true});
      block(G,ctx,item.ko,img?440:580,632,img?720:880,86,rv+0.8,YEL,{min:44});
    }else{
      block(G,ctx,item.ko,cx,280,maxW,170,rv,YEL,{min:60,dx:shake,step:1/12,mid:true});
      block(G,ctx,item.es,img?440:580,632,img?720:880,70,rv+0.7,CREAM,{min:40});
    }
    obj(G,ctx,SPR.check,1100,520,life(G,rv+1.3,{seed:7}),{shadow:{blur:10,dx:6,dy:8,a:0.45}});
  }
}

// precalienta las letras del beat actual y del siguiente (unas pocas por fotograma)
function prewarm(S){
  if(!fontsReady())return;
  for(const beat of [S.beat,S.next]){
    if(!beat)continue;const key='req'+beat.index;
    if(!CLX[key]){const G={all:true,dry:true,req:[],lt:0,fr:0};drawBeat(G,null,S,beat);CLX[key]={list:G.req,i:0};}
    const R=CLX[key];let n=0;const t0=performance.now();
    while(R.i<R.list.length&&n<4&&performance.now()-t0<8){const [ch,px,col]=R.list[R.i++];if(!CLX['g1'+ch+px+col]){glyph(ch,px,col);n++;}}
  }
}

export default {
  id:'claymation',
  name:'Plastilina',
  fonts:['700 92px "Fredoka"','700 44px "Fredoka"'],
  fontCss:'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&display=block',
  readsPixels:true,
  frame(ctx,Wc,Hc,t,S){
    const tq=Math.floor(t*12)/12,fr=Math.floor(t*12);
    set(ctx);
    // cambio de escena: el animador tira las piezas del beat anterior (caen o se barren) y pone las nuevas
    if(S.prev&&tq-S.beat.t0<0.8){const p=S.prev;drawBeat({lt:p.t1-p.t0,leave:tq-S.beat.t0,mode:S.beat.index%2?'fall':'right',fr},ctx,S,p);}
    drawBeat({lt:tq-S.beat.t0,leave:null,mode:'fall',fr},ctx,S,S.beat);
    // acabado de lente
    ctx.save();ctx.globalCompositeOperation='soft-light';
    const gg=ctx.createLinearGradient(0,0,W,HH);gg.addColorStop(0,'rgba(255,220,170,0.5)');gg.addColorStop(1,'rgba(40,60,90,0.4)');ctx.fillStyle=gg;ctx.fillRect(0,0,W,HH);ctx.restore();
    H.vignette(ctx,W,HH,0.42,'20,12,8');
    {const f=(H.rng(900+fr)()-0.5)*0.06;ctx.fillStyle=f>0?`rgba(255,240,220,${f})`:`rgba(0,0,0,${-f})`;ctx.fillRect(0,0,W,HH);}
    H.grain(ctx,W,HH,0.03,4+fr);
    prewarm(S);
  },
  // Plastilina en un plató: cada pieza cae con un «plop» blando y grave, los aplastes chapotean,
  // lo que se cae de la mesa aterriza fuera de cuadro con golpes sordos; todo en la rejilla de 12 fps.
  score(k,timeline){
    const q=s=>Math.ceil(s*12-1e-6)/12;
    const plop=(t,g=1,f=170,p=0,minor=true)=>{k.tone(t,{f:[[0,f*1.6],[0.06,f*0.7]],dur:0.11,gain:0.3*g,pan:p,minor});k.noise(t,{dur:0.05,color:'brown',filter:'lowpass',f:700,gain:0.28*g,a:0.002,pan:p,minor});k.noise(t,{dur:0.04,filter:'bandpass',f:520,q:1.5,gain:0.1*g,a:0.002,pan:p,minor});};
    const squelch=(t,g=1,p=0,d=0.14,minor=true)=>{k.noise(t,{dur:d,color:'pink',filter:'bandpass',f:[[0,280],[d,650]],q:2,gain:0.3*g,a:0.02,pan:p,minor});k.tone(t,{f:[[0,90],[d,130]],dur:d,gain:0.12*g,pan:p,minor});};
    const floor=(t,n,g=1)=>{for(let i=0;i<n;i++)k.noise(t+i*0.07+(i%2)*0.02,{dur:0.09,color:'brown',filter:'lowpass',f:260,gain:0.32*g*(1-i*0.08),a:0.003,pan:(i%3-1)*0.3,minor:true});};
    const smear=(t,d,g=1)=>{k.noise(t,{dur:d,color:'brown',filter:'bandpass',f:[[0,260],[d,520]],q:1.3,gain:0.28*g,a:d*0.3,minor:true});};
    k.bed('room',0,timeline.duration,{gain:0.45});
    for(const beat of timeline.beats){
      const t0=beat.t0;
      if(beat.index){beat.index%2?floor(t0+0.3,5,0.8):smear(t0,0.5,0.8);}
      if(beat.kind==='title'){for(let i=0;i<4;i++)plop(q(0.1+i*0.18),0.35,200);plop(q(0.4),0.8,130,0.5);squelch(q(0.4)+1/12,0.5,0.5);plop(q(1.3),0.5,180);continue;}
      if(beat.kind==='end'){for(let i=0;i<5;i++)plop(q(t0+0.5+i/12),0.4,190+i*10);plop(q(t0+1.0),0.6,150,0.6);k.play('success',t0+3.3,{f:'C5',gain:0.45});continue;}
      const {think,reveal}=beatTimes(beat),secs=think[1]-think[0];
      plop(q(t0+0.3),0.4,210,-0.5);plop(q(t0+0.45),0.7,130,0.6);
      if(beat.kind==='listen'){plop(q(t0+0.5),0.8,120,0);squelch(q(t0+0.5)+1/12,0.5,0);}
      plop(q(think[0]),0.8,120,0,true);floor(think[0]+0.25,3,0.6);
      for(let m=Math.ceil(secs)-1;m>=1;m--){const tt=q(think[0]+secs-m);plop(tt+1/12,0.6,200,0);k.noise(tt+0.2,{dur:0.09,color:'brown',filter:'lowpass',f:260,gain:0.25,a:0.003,minor:true});}
      plop(q(reveal[0]),1.0,150,0,false);squelch(q(reveal[0])+1/12,0.6,0);floor(reveal[0]+0.3,3,0.6);
      k.play('slap',q(reveal[0]+1.3),{gain:0.5,pan:0.6,minor:true});k.play('success',q(reveal[0]+1.35),{f:'C5',gain:0.35,minor:true});
    }
  },
};
