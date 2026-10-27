// Estilo «Cine negro»: noticiario de los años 40 en blanco y negro. Técnicas del
// paquete: luz de persiana con penumbra, humo en el haz, yeso, periódico que gira,
// fichas policiales, odómetro mecánico, sello de goma, iris / cortinilla / reloj y
// el acabado de proyección (vaivén, grano de nitrato, halo, polvo, raya, bandas).
import {beatTimes,fitFont,wrapLines} from './shared.js';

const H=window.H,E=H.ease,sm=H.smooth,BAR=54,TAU=Math.PI*2;
const KR='"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif';
const OSW=`"Oswald",${KR}`,LIME=`"Limelight",${KR}`,ANTON=`"Anton",${KR}`,ELITE=`"Special Elite",${KR}`,COUR=`"Courier Prime",${KR}`,PLAY=`"Playfair Display",${KR}`,FRAK=`"UnifrakturMaguntia",${KR}`;
const gy=(v,a=1)=>`rgba(${v},${v},${v},${a})`;
const NZ=H.makeNoise(46);
const W=1280,HH=720;

// ---------- texturas estáticas (se hornean una vez) ----------
const C={};
const lay=(key,w,h)=>{const l=C[key]||(C[key]=H.layer(w,h));const x=l.getContext('2d');x.setTransform(1,0,0,1,0,0);x.globalAlpha=1;x.globalCompositeOperation='source-over';x.filter='none';x.clearRect(0,0,w,h);return l;};
// yeso pintado (media ~128, se usa en 'overlay')
function plaster(){
  if(C.plaster)return C.plaster;
  const w=W>>1,h=HH>>1,s=H.layer(w,h),x=s.getContext('2d'),img=x.createImageData(w,h),d=img.data,R=H.rng(1331),nz=H.makeNoise(1332);
  for(let y=0;y<h;y++)for(let xx=0;xx<w;xx++){const v=128+nz.fbm2(xx*0.018,y*0.018,3)*30+nz.n2(xx*0.16,y*0.16)*8+(R()-0.5)*12,i=(y*w+xx)*4;d[i]=d[i+1]=d[i+2]=v;d[i+3]=255;}
  x.putImageData(img,0,0);const c=H.layer(W,HH);c.getContext('2d').drawImage(s,0,0,W,HH);return(C.plaster=c);
}
// estratos de humo de cigarro (blanco, alfa = densidad)
function hazeTex(){
  if(C.haze)return C.haze;
  const w=W>>1,h=HH>>1,s=H.layer(w,h),x=s.getContext('2d'),img=x.createImageData(w,h),d=img.data,nz=H.makeNoise(1414);
  for(let y=0;y<h;y++)for(let xx=0;xx<w;xx++){const q=nz.n2(xx*0.004,y*0.01)*1.6,v=nz.fbm2(xx*0.007+q,y*0.02,4),i=(y*w+xx)*4;d[i]=d[i+1]=d[i+2]=255;d[i+3]=H.clamp((v+0.15)*1.5)*255;}
  x.putImageData(img,0,0);return(C.haze=s);
}
// luz de persiana: lamas de 34 px, huecos de 17, pendiente 0.5, penumbra real; el vaivén se aplica al dibujarla
function slats(o){
  const key='sl'+JSON.stringify(o);if(C[key])return C[key];
  const w=W>>1,h=HH>>1,l=H.layer(w,h),x=l.getContext('2d'),x0=o.x0,X1=W+200,dy=(X1-x0)*0.5;
  x.save();x.filter=`blur(${(o.blur||3)/2}px)`;x.scale(0.5,0.5);x.globalAlpha=o.alpha;x.fillStyle='#fff';x.beginPath();
  for(let k=-12;k<50;k++){const y=k*34;x.moveTo(x0,y);x.lineTo(X1,y-dy);x.lineTo(X1,y-dy+17);x.lineTo(x0,y+17);x.closePath();}
  x.fill();
  if(o.mullion){const [mx,ms]=o.mullion;x.globalAlpha=1;x.globalCompositeOperation='destination-out';x.strokeStyle='#000';x.lineWidth=9;x.beginPath();x.moveTo(mx-60*ms,-60);x.lineTo(mx+(HH+60)*ms,HH+60);x.stroke();}
  x.restore();
  if(o.edge){x.save();x.globalCompositeOperation='destination-in';x.scale(0.5,0.5);const g=x.createLinearGradient(x0-30,0,x0+o.edge,0);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,1)');x.fillStyle=g;x.fillRect(0,0,W,HH);x.restore();}
  return(C[key]=l);
}
// grano de nitrato: tabla de ruido sembrada; cada fotograma (24 fps) lee desde otro desfase
function grainBuf(){
  if(C.grain)return C.grain;
  const n=W*HH+65536,g=new Float32Array(n),r=H.rng(901);
  for(let i=0;i<n;i++)g[i]=r()+r()+r()-1.5;
  return(C.grain=g);
}

// ---------- utilería del plató ----------
const pool=(c,x,y,rx,ry,a)=>{c.save();c.globalCompositeOperation='screen';c.translate(x,y);c.scale(1,ry/rx);const g=c.createRadialGradient(0,0,0,0,0,rx);g.addColorStop(0,`rgba(255,255,255,${a})`);g.addColorStop(0.5,`rgba(255,255,255,${a*0.45})`);g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(-rx,-rx,rx*2,rx*2);c.restore();};
const screenL=(c,l,a=1,dy=0)=>{c.save();c.globalCompositeOperation='screen';c.globalAlpha=a;c.drawImage(l,0,dy,W,HH);c.restore();};
const tex=(c,a)=>{c.save();c.globalCompositeOperation='overlay';c.globalAlpha=a;c.drawImage(plaster(),0,0);c.restore();};
// humo visible solo donde lo atraviesa la luz
function haze(c,mask,a,t){
  const w4=W>>2,h4=HH>>2,hl=lay('hz',w4,h4),hx=hl.getContext('2d'),hz=hazeTex(),off=(t*4.5)%w4;
  hx.drawImage(hz,-off,0,w4,h4);hx.drawImage(hz,w4-off,0,w4,h4);
  hx.globalCompositeOperation='destination-in';hx.drawImage(mask,0,0,w4,h4);hx.globalCompositeOperation='source-over';
  screenL(c,hl,a);
}
// rótulo de noticiario: mayúsculas blancas con contorno negro
function NR(c,s,x,y,size,prog=1,align='center',fam=OSW,weight=700){
  if(prog<=0)return;c.save();c.globalAlpha=Math.min(1,prog*2);c.font=`${weight} ${size}px ${fam}`;c.textAlign=align;c.lineJoin='round';c.lineWidth=size*0.16;c.strokeStyle=gy(0);c.strokeText(s,x,y);c.fillStyle=gy(250);c.fillText(s,x,y);c.restore();
}
const halftone=c=>{if(!C.ht){const p=H.layer(6,12),x=p.getContext('2d');x.fillStyle='rgba(0,0,0,0.16)';for(const [px,py] of [[0,0],[6,0],[0,12],[6,12],[3,6]]){x.beginPath();x.arc(px,py,1.5,0,7);x.fill();}C.ht=p;}return c.createPattern(C.ht,'repeat');};
const contain=(c,img,x,y,w,h)=>{const iw=img.width||1,ih=img.height||1,s=Math.min(w/iw,h/ih);c.drawImage(img,x+(w-iw*s)/2,y+(h-ih*s)/2,iw*s,ih*s);};
const fitText=(c,s,maxW,size,font)=>fitFont(c,[s],maxW,size,font);

// periódico que entra girando
function newspaper(c,cx,cy,sc,rot,head,sub,img){
  c.save();c.translate(cx,cy);c.rotate(rot);c.scale(sc,sc);
  c.fillStyle='rgba(0,0,0,0.1)';for(let k=8;k>=0;k--){const g=k*2.5;c.fillRect(-380+12-g,-240+18-g,760+2*g,480+2*g);}
  const np=c.createLinearGradient(-380,-240,380,240);np.addColorStop(0,gy(240));np.addColorStop(0.5,gy(224));np.addColorStop(1,gy(196));c.fillStyle=np;c.fillRect(-380,-240,760,480);
  const fd=c.createLinearGradient(-30,0,30,0);fd.addColorStop(0,'rgba(0,0,0,0)');fd.addColorStop(0.45,'rgba(0,0,0,0.13)');fd.addColorStop(0.55,'rgba(255,255,255,0.18)');fd.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=fd;c.fillRect(-30,-240,60,480);
  c.fillStyle=gy(25);c.textAlign='center';c.font=`400 50px ${FRAK}`;c.fillText('El Diario del Repaso',0,-184);
  c.fillRect(-360,-168,720,3);c.fillRect(-360,-160,720,1);
  c.font=`400 15px ${COUR}`;c.fillText('EDICIÓN DE LA TARDE  ★  CINCO CENTAVOS',0,-144);
  const hs=fitText(c,head,700,78,`400 SIZEpx ${ANTON}`);c.font=`400 ${hs}px ${ANTON}`;c.fillText(head,0,-66);
  const ss=fitText(c,sub,700,40,`italic 400 SIZEpx ${PLAY}`);c.font=`italic 400 ${ss}px ${PLAY}`;c.fillText(sub,0,-20);
  const ph=c.createRadialGradient(-250,60,20,-210,110,230);ph.addColorStop(0,gy(200));ph.addColorStop(1,gy(90));c.fillStyle=ph;c.fillRect(-360,5,330,215);
  if(img)contain(c,img,-354,11,318,203);
  c.fillStyle=halftone(c);c.fillRect(-360,5,330,215);c.strokeStyle=gy(40);c.lineWidth=2;c.strokeRect(-360,5,330,215);
  c.fillStyle=gy(110);for(let col=0;col<2;col++)for(let k=0;k<19;k++)c.fillRect(-10+col*190,9+k*11,172-(k%7===6?70:0),4);
  c.restore();
}
// ficha de prueba: foto con placa de registro, esquina levantada y chincheta
function evidence(c,x,y,w,img,num,rot){
  const h=w*1.25;c.save();c.translate(x,y);c.rotate(rot);
  c.save();c.shadowColor='rgba(0,0,0,0.65)';c.shadowBlur=14;c.shadowOffsetX=8;c.shadowOffsetY=10;c.fillStyle=gy(230);c.fillRect(-w/2,-h/2,w,h);c.restore();
  const pg=c.createLinearGradient(-w/2,-h/2,w/2,h/2);pg.addColorStop(0,gy(248));pg.addColorStop(1,gy(205));c.fillStyle=pg;c.fillRect(-w/2,-h/2,w,h);
  const bg=c.createLinearGradient(0,-h/2,0,h/2);bg.addColorStop(0,gy(170));bg.addColorStop(1,gy(92));c.fillStyle=bg;c.fillRect(-w/2+10,-h/2+10,w-20,h-20);
  c.strokeStyle=gy(105,0.8);c.lineWidth=1;for(let k=1;k<6;k++){const yy=-h/2+10+k*(h-20)/6;c.beginPath();c.moveTo(-w/2+10,yy);c.lineTo(w/2-10,yy);c.stroke();}
  if(img)contain(c,img,-w/2+18,-h/2+18,w-36,h*0.6);
  c.fillStyle=gy(22);c.fillRect(-w*0.4,h*0.17,w*0.8,h*0.27);c.fillStyle=gy(70);c.fillRect(-w*0.4,h*0.17,w*0.8,2);
  c.fillStyle=gy(235);c.textAlign='center';c.font=`700 36px ${OSW}`;c.fillText('PRUEBA',0,h*0.17+42);
  c.font=`700 29px ${COUR}`;c.fillText(`Nº ${String(num).padStart(3,'0')}`,0,h*0.17+80);
  c.strokeStyle=gy(60,0.5);c.strokeRect(-w/2+10.5,-h/2+10.5,w-21,h-21);
  const cs=w*0.15,ex=w/2,ey=h/2;c.fillStyle='rgba(0,0,0,0.35)';c.beginPath();c.moveTo(ex-cs,ey);c.lineTo(ex,ey-cs);c.lineTo(ex+3,ey+4);c.fill();
  const cg=c.createLinearGradient(ex-cs,ey-cs,ex-cs*0.4,ey-cs*0.4);cg.addColorStop(0,gy(255));cg.addColorStop(1,gy(170));c.fillStyle=cg;c.beginPath();c.moveTo(ex-cs,ey);c.lineTo(ex,ey-cs);c.quadraticCurveTo(ex-cs*0.55,ey-cs*0.55,ex-cs*0.82,ey-cs*0.82);c.closePath();c.fill();
  c.fillStyle='rgba(0,0,0,0.5)';c.beginPath();c.arc(3,-h/2+9,6,0,7);c.fill();
  const pn=c.createRadialGradient(-2,-h/2+3,0.5,0,-h/2+5,7);pn.addColorStop(0,gy(245));pn.addColorStop(0.4,gy(120));pn.addColorStop(1,gy(30));c.fillStyle=pn;c.beginPath();c.arc(0,-h/2+5,7,0,7);c.fill();
  c.restore();
}
// contador mecánico de tambores; roll desplaza cada tambor hacia abajo y deja entrar «next» por arriba
function odometer(c,x,y,str,h,roll=0,next=null){
  const w=h*0.62,n=str.length,bw=n*(w+4)+12,bh=h+16;
  c.save();c.shadowColor='rgba(0,0,0,0.7)';c.shadowBlur=14;c.shadowOffsetX=6;c.shadowOffsetY=9;
  const bz=c.createLinearGradient(0,y-8,0,y-8+bh);bz.addColorStop(0,gy(92));bz.addColorStop(0.5,gy(40));bz.addColorStop(1,gy(18));c.fillStyle=bz;c.fillRect(x-8,y-8,bw,bh);c.restore();
  c.fillStyle=gy(170);c.fillRect(x-8,y-8,bw,2);c.fillStyle=gy(8);c.fillRect(x-8,y+h+6,bw,2);c.fillRect(x-2,y-2,bw-12,h+4);
  for(let k=0;k<n;k++){
    const wx=x+k*(w+4),ch=str[k],nx=next?next[k]:ch,r=nx!==ch?roll:0;
    c.save();c.beginPath();c.rect(wx,y,w,h);c.clip();
    const g2=c.createLinearGradient(0,y,0,y+h);g2.addColorStop(0,gy(120));g2.addColorStop(0.5,gy(240));g2.addColorStop(1,gy(120));c.fillStyle=g2;c.fillRect(wx,y,w,h);
    c.fillStyle=gy(20);c.font=`700 ${Math.round(h*0.8)}px ${COUR}`;c.textAlign='center';
    c.fillText(ch,wx+w/2,y+h*0.78+r*h);if(r)c.fillText(nx,wx+w/2,y+h*0.78-h+r*h);
    c.restore();
  }
  const gl=c.createLinearGradient(0,y,0,y+h);gl.addColorStop(0,'rgba(0,0,0,0.35)');gl.addColorStop(0.12,'rgba(255,255,255,0.22)');gl.addColorStop(0.3,'rgba(255,255,255,0.04)');gl.addColorStop(0.85,'rgba(0,0,0,0)');gl.addColorStop(1,'rgba(0,0,0,0.3)');
  c.fillStyle=gl;c.fillRect(x,y,n*(w+4)-4,h);
  return bw;
}
// sello de goma golpeado como énfasis
function stamp(c,x,y,word,p,rot=-0.16,size=44){
  if(p<=0)return;c.save();c.translate(x,y);c.rotate(rot);const s=2.2-1.2*E.out(p);c.scale(s,s);c.globalAlpha=Math.min(1,p*1.5);
  c.font=`700 ${size}px ${OSW}`;const bw=c.measureText(word).width+56,bh=size*1.7;
  c.fillStyle=gy(10,0.72);c.fillRect(-bw/2-6,-bh/2-6,bw+12,bh+12);c.strokeStyle=gy(245);c.lineWidth=6;c.strokeRect(-bw/2,-bh/2,bw,bh);
  c.fillStyle=gy(245);c.textAlign='center';c.fillText(word,0,size*0.36);
  const r=H.rng(word.length*31);c.fillStyle=gy(10,0.75);for(let i=0;i<26;i++){c.beginPath();c.arc(r.range(-bw/2,bw/2),r.range(-bh/2,bh/2),r.range(0.8,2.4),0,7);c.fill();}
  c.restore();
}
// cinta de teletipo que se escribe letra a letra
function tape(c,str,x,y,size,prog,rot=-0.03){
  if(prog<=0)return;const chars=[...str],shown=chars.slice(0,Math.ceil(chars.length*H.clamp(prog))).join('');
  c.save();c.font=`400 ${size}px ${ELITE}`;const full=c.measureText(str).width+52,wv=Math.min(full,c.measureText(shown).width+52),h=size*1.5;
  c.translate(x,y);c.rotate(rot);const L=-full/2;
  c.save();c.shadowColor='rgba(0,0,0,0.6)';c.shadowBlur=12;c.shadowOffsetX=5;c.shadowOffsetY=8;c.fillStyle=gy(225);c.fillRect(L,-h/2,wv,h);c.restore();
  const tg=c.createLinearGradient(0,-h/2,0,h/2);tg.addColorStop(0,gy(244));tg.addColorStop(1,gy(200));c.fillStyle=tg;c.fillRect(L,-h/2,wv,h);
  c.fillStyle=gy(20);c.textBaseline='middle';c.fillText(shown,L+26,2);c.restore();
}
// intertítulo art déco: cartón negro con doble filete blanco
function intertitle(c,cx,cy,w,h,a){
  c.save();c.globalAlpha=a;c.fillStyle=gy(12,0.86);c.fillRect(cx-w/2,cy-h/2,w,h);
  c.strokeStyle=gy(235);c.lineWidth=3;c.strokeRect(cx-w/2+10,cy-h/2+10,w-20,h-20);c.lineWidth=1;c.strokeRect(cx-w/2+18,cy-h/2+18,w-36,h-36);
  c.fillStyle=gy(235);for(const [sx,sy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const px=cx+sx*(w/2-10),py=cy+sy*(h/2-10);c.beginPath();c.moveTo(px,py-9);c.lineTo(px+9,py);c.lineTo(px,py+9);c.lineTo(px-9,py);c.fill();}
  c.restore();
}
// micrófono de cinta (estudio de radio) con ondas de noticiario que laten
function mic(c,x,y,t,p){
  if(p<=0)return;c.save();c.globalAlpha=Math.min(1,p*1.4);
  const pg=c.createLinearGradient(x-8,0,x+8,0);pg.addColorStop(0,gy(40));pg.addColorStop(0.4,gy(190));pg.addColorStop(1,gy(30));c.fillStyle=pg;c.fillRect(x-7,y+100,14,456-y);
  c.fillStyle=gy(20);c.beginPath();c.ellipse(x,560,90,14,0,0,TAU);c.fill();c.fillStyle=gy(120);c.fillRect(x-90,556,180,3);
  c.strokeStyle=gy(70);c.lineWidth=12;c.beginPath();c.arc(x,y+30,82,0.1,Math.PI-0.1);c.stroke();c.strokeStyle=gy(200,0.6);c.lineWidth=3;c.beginPath();c.arc(x,y+30,86,1.6,2.9);c.stroke();
  c.save();c.shadowColor='rgba(0,0,0,0.7)';c.shadowBlur=18;c.shadowOffsetX=8;c.shadowOffsetY=10;c.fillStyle=gy(60);c.beginPath();c.roundRect(x-62,y-110,124,220,62);c.fill();c.restore();
  c.save();c.beginPath();c.roundRect(x-62,y-110,124,220,62);c.clip();
  const cg=c.createLinearGradient(x-62,0,x+62,0);cg.addColorStop(0,gy(55));cg.addColorStop(0.28,gy(235));cg.addColorStop(0.5,gy(150));cg.addColorStop(1,gy(30));c.fillStyle=cg;c.fillRect(x-62,y-110,124,220);
  c.fillStyle=gy(20,0.55);for(let yy=y-104;yy<y+110;yy+=8)c.fillRect(x-62,yy,124,3);
  c.fillStyle=gy(18);c.fillRect(x-62,y-11,124,22);c.fillStyle=gy(210);c.fillRect(x-62,y-11,124,2);
  c.fillStyle='rgba(255,255,255,0.4)';c.fillRect(x-36,y-104,9,208);c.restore();
  for(let i=0;i<3;i++){
    const pulse=0.5+0.5*Math.sin(t*6-i*0.9),a=H.clamp(p*2-0.5-i*0.2)*(0.35+0.65*pulse);if(a<=0)continue;
    for(const sd of [-1,1]){c.save();c.globalAlpha=a;c.lineCap='round';
      for(const [col,lw] of [[gy(0),13],[gy(250),7]]){c.strokeStyle=col;c.lineWidth=lw;c.beginPath();c.arc(x,y,110+i*46,sd>0?-0.55:Math.PI-0.55,sd>0?0.55:Math.PI+0.55);c.stroke();}
      c.restore();}
  }
  c.restore();
}

// ---------- escenarios ----------
function office(c,t){
  c.fillStyle=gy(14);c.fillRect(-10,-10,W+20,HH+20);pool(c,640,380,620,420,0.16);
  screenL(c,slats({x0:300,alpha:0.2,blur:7,edge:180}),1,(t*6)%34);tex(c,0.7);
}
function lampCone(){
  if(C.cone)return C.cone;
  const cl=H.layer(W>>2,HH>>2),cx=cl.getContext('2d');cx.scale(0.25,0.25);cx.filter='blur(4.5px)';
  const vg=cx.createLinearGradient(0,54,0,720);vg.addColorStop(0,'rgba(255,255,255,0.7)');vg.addColorStop(0.35,'rgba(255,255,255,0.32)');vg.addColorStop(1,'rgba(255,255,255,0.1)');
  cx.fillStyle=vg;cx.beginPath();cx.moveTo(600,54);cx.lineTo(680,54);cx.lineTo(1250,720);cx.lineTo(30,720);cx.fill();
  cx.filter='none';const core=cx.createRadialGradient(640,60,10,640,200,260);core.addColorStop(0,'rgba(255,255,255,0.45)');core.addColorStop(1,'rgba(255,255,255,0)');
  cx.globalCompositeOperation='source-atop';cx.fillStyle=core;cx.fillRect(0,0,W,HH);return(C.cone=cl);
}
// sala de interrogatorio: lámpara colgante, haz con humo, mesa y motas de polvo
function room(c,t){
  c.fillStyle=gy(10);c.fillRect(-10,-10,W+20,HH+20);pool(c,640,360,640,420,0.07);
  const cl=lampCone();screenL(c,cl,0.75);haze(c,cl,0.5,t);tex(c,0.6);
  const tg=c.createLinearGradient(0,560,0,720);tg.addColorStop(0,gy(58));tg.addColorStop(1,gy(12));c.fillStyle=tg;c.fillRect(-10,560,W+20,170);
  c.fillStyle=gy(150);c.fillRect(-10,556,W+20,3);c.fillStyle=gy(70);c.fillRect(-10,559,W+20,3);
  pool(c,640,600,470,70,0.42);
  const bg0=c.createRadialGradient(640,62,2,640,62,70);bg0.addColorStop(0,'rgba(255,255,255,0.9)');bg0.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=bg0;c.fillRect(570,20,140,110);
  const sh=c.createLinearGradient(590,0,690,0);sh.addColorStop(0,gy(12));sh.addColorStop(0.3,gy(70));sh.addColorStop(1,gy(10));c.fillStyle=sh;c.beginPath();c.moveTo(590,40);c.lineTo(690,40);c.lineTo(670,60);c.lineTo(610,60);c.fill();
  c.fillStyle=gy(250);c.fillRect(612,59,56,3);
  const Rm=H.rng(4242);
  for(let k=0;k<44;k++){const yb=Rm()*620,ph=Rm()*6.28,u=Rm()*2-1,r=Rm()*1.4+0.7,my=80+((yb+t*11)%620),hw=40+(my-54)/666*570,mx=640+u*hw*0.85+Math.sin(t*0.7+ph)*7;c.fillStyle=`rgba(255,255,255,${(0.35+0.45*Rm())*(1-my/900)})`;c.beginPath();c.arc(mx,my,r,0,7);c.fill();}
}
// el detective a contraluz (silueta del paquete)
function detectivePath(x){
  x.beginPath();x.moveTo(700,720);x.bezierCurveTo(706,560,716,470,742,420);x.bezierCurveTo(756,392,770,372,778,352);x.lineTo(770,334);x.bezierCurveTo(772,322,776,312,780,304);
  x.lineTo(772,300);x.lineTo(770,292);x.lineTo(764,284);x.lineTo(766,276);x.lineTo(758,264);x.lineTo(764,258);x.bezierCurveTo(766,248,770,240,772,232);x.lineTo(730,226);
  x.bezierCurveTo(728,220,740,214,772,212);x.bezierCurveTo(776,190,786,168,812,160);x.bezierCurveTo(828,156,848,160,862,158);x.bezierCurveTo(880,164,888,190,890,206);
  x.bezierCurveTo(912,208,934,214,938,222);x.bezierCurveTo(918,230,896,230,880,230);x.bezierCurveTo(878,260,872,290,868,306);x.bezierCurveTo(886,318,900,322,910,330);
  x.bezierCurveTo(960,344,1000,366,1018,410);x.bezierCurveTo(1036,470,1044,580,1050,720);x.closePath();
}
const figT=c=>{c.translate(980,0);c.scale(0.9,0.9);c.translate(-760,60);};
function endLight(){
  if(C.endL)return C.endL;
  const base=slats({x0:380,alpha:0.85,blur:6,edge:170,mullion:[640,0.55]}),sl=H.layer(W>>1,HH>>1),sx=sl.getContext('2d');sx.drawImage(base,0,0);
  const shL=H.layer(W>>2,HH>>2),shx=shL.getContext('2d');shx.filter='blur(3px)';shx.scale(0.25,0.25);shx.translate(-130,40);figT(shx);shx.fillStyle='#000';detectivePath(shx);shx.fill();
  sx.globalCompositeOperation='destination-out';sx.globalAlpha=0.85;sx.drawImage(shL,0,0,W>>1,HH>>1);
  const ox=890,oy=140,rl=H.layer(W-ox,HH-oy),rx=rl.getContext('2d');
  rx.save();rx.translate(-ox,-oy);figT(rx);rx.fillStyle='#fff';detectivePath(rx);rx.fill();rx.restore();
  rx.save();rx.globalCompositeOperation='destination-out';rx.translate(-ox-6,-oy+3);figT(rx);detectivePath(rx);rx.fill();rx.restore();
  const rm=H.layer(W>>1,HH>>1),rmx=rm.getContext('2d');rmx.fillStyle='rgba(255,255,255,0.35)';rmx.fillRect(0,0,W>>1,HH>>1);rmx.drawImage(sl,0,0);
  rx.globalCompositeOperation='destination-in';rx.drawImage(rm,-ox,-oy,W,HH);
  return(C.endL={sl,rl,ox,oy});
}
function endScene(c,t){
  c.fillStyle=gy(12);c.fillRect(-10,-10,W+20,HH+20);
  const {sl,rl,ox,oy}=endLight(),sw=Math.sin(t)*4;
  screenL(c,sl,0.78,sw);tex(c,0.55);haze(c,sl,0.4,t);
  const wl=lay('wisp',W>>2,HH>>2),wc=wl.getContext('2d');wc.filter='blur(2px)';wc.scale(0.25,0.25);wc.lineCap='round';
  for(let s=0;s<3;s++){wc.strokeStyle=`rgba(255,255,255,${0.15-s*0.035})`;wc.lineWidth=10+s*12;wc.beginPath();const wx=860+s*30+Math.sin(t*0.6+s)*10;wc.moveTo(wx,520);wc.bezierCurveTo(wx-60,420-s*10,wx+70+Math.sin(t*0.8)*20,300,wx-10,150+s*20);wc.stroke();}
  screenL(c,wl);
  c.save();figT(c);c.fillStyle=gy(8);detectivePath(c);c.fill();c.restore();
  c.save();figT(c);detectivePath(c);c.restore();c.save();c.clip();screenL(c,sl,0.12,sw);c.restore();
  c.save();c.globalCompositeOperation='screen';c.drawImage(rl,ox,oy);c.restore();
}

// ---------- contenido de cada beat ----------
function countdown(c,cx,cy,phaseP,secs,label){
  const rem=secs*(1-phaseP),n=Math.max(1,Math.ceil(rem)),roll=E.inOut(H.clamp((n-rem-0.8)/0.2)),h=170,w=h*0.62;
  c.save();c.lineCap='round';
  for(let i=0;i<12;i++){const a=-Math.PI/2+i*TAU/12;c.strokeStyle=gy(235,0.8);c.lineWidth=4;c.beginPath();c.moveTo(cx+Math.cos(a)*160,cy+Math.sin(a)*160);c.lineTo(cx+Math.cos(a)*176,cy+Math.sin(a)*176);c.stroke();}
  for(const [col,lw] of [[gy(0),14],[gy(245),7]]){c.strokeStyle=col;c.lineWidth=lw;c.beginPath();c.arc(cx,cy,145,-Math.PI/2,-Math.PI/2+TAU*Math.max(0.002,1-phaseP));c.stroke();}
  c.restore();
  odometer(c,cx-w/2-2,cy-h/2,String(n),h,roll,String(n-1));
  NR(c,label,cx,cy+240,50,H.clamp(phaseP*8));
}
// texto que cae de golpe (escala 1.7 → 1) con el flash de magnesio
function slam(c,lines,cx,y,fs,fam,p){
  if(p<=0)return;const s=1.7-0.7*E.out(p),lh=fs*1.12,mid=y+(lines.length-1)*lh/2-fs*0.35;
  c.save();c.translate(cx,mid);c.scale(s,s);c.translate(-cx,-mid);lines.forEach((l,i)=>NR(c,l,cx,y+i*lh,fs,p,'center',fam));c.restore();
  return lines.length*lh;
}
function drawBeat(c,t,S,beat){
  const local=t-beat.t0;
  if(beat.kind==='title'){
    office(c,t);const p=E.out(sm(0.1,1.0,local));
    newspaper(c,640,318,0.04+0.9*p,(1-p)*Math.PI*5-0.04,`REPASO · CLASE ${beat.classNumber}`,beat.unitTitle||'',S.assets.scene);
    NR(c,'¿Cuánto recuerdas?',640,628,56,sm(1.4,1.9,local));
    return;
  }
  if(beat.kind==='end'){
    endScene(c,t);
    c.save();c.textAlign='center';c.shadowColor='rgba(0,0,0,0.9)';c.shadowBlur=12;c.fillStyle=gy(242);
    const a=(t0)=>H.clamp((local-t0)/0.5);
    c.globalAlpha=a(0.5);c.font=`400 92px ${LIME}`;c.fillText('¡Muy bien!',470,250);
    c.globalAlpha=a(1.1);c.font=`400 54px ${LIME}`;c.fillText(`${beat.total} frases repasadas`,470,350);
    c.globalAlpha=a(1.4);c.fillRect(466.5,380,7,32);c.beginPath();c.moveTo(452,406);c.lineTo(488,406);c.lineTo(470,432);c.closePath();c.fill();
    c.globalAlpha=a(1.8);const fs=fitText(c,'Mañana vuelven: ¡no las sueltes!',820,46,`400 SIZEpx ${LIME}`);c.font=`400 ${fs}px ${LIME}`;c.fillText('Mañana vuelven: ¡no las sueltes!',470,500);
    c.restore();return;
  }
  const {think,reveal}=beatTimes(beat),item=beat.item,img=S.assets.picture(item.picture),listen=beat.kind==='listen';
  room(c,t);
  NR(c,listen?'ESCUCHA':'¿CÓMO SE DICE?',70,122,54,sm(0.05,0.4,local),'left');
  const ow=odometer(c,1046,72,String(beat.number),58);NR(c,`/ ${beat.total}`,1046+ow+4,126,46,1,'left');
  if(img){const pp=E.out(sm(0.25,0.75,local));evidence(c,H.lerp(1480,1010,pp),372,300,img,beat.number,-0.04+(1-pp)*0.3);}
  const cx=img?470:640,maxW=img?640:1000;
  if(t<think[0]){
    if(listen)mic(c,cx,310,t,sm(0.2,0.7,local));
    else{
      const font=`400 SIZEpx ${LIME}`,lines=wrapLines(c,item.es,maxW-90,70,font,2),fs=fitFont(c,lines,maxW-90,70,font),lh=fs*1.22,ch=lines.length*lh+96,a=sm(0.25,0.7,local);
      intertitle(c,cx,316,maxW,ch,a);
      c.save();c.textAlign='center';c.fillStyle=gy(242);c.font=`400 ${fs}px ${LIME}`;
      lines.forEach((l,i)=>{c.globalAlpha=sm(0.45+i*0.35,0.9+i*0.35,local);c.fillText(l,cx,316-(lines.length-1)*lh/2+fs*0.35+i*lh);});c.restore();
    }
  }else if(t<reveal[0]){
    countdown(c,cx,300,(t-think[0])/(think[1]-think[0]),think[1]-think[0],listen?'¿Qué significa?':'¡Dilo en voz alta!');
  }else{
    const r=t-reveal[0];
    if(r<0.4)pool(c,cx,290,560,380,0.95*(1-r/0.4));
    if(listen){
      const font=`700 SIZEpx ${OSW}`,es=item.es.toUpperCase(),lines=wrapLines(c,es,maxW,80,font,2),fs=fitFont(c,lines,maxW,80,font);
      const used=slam(c,lines,cx,250,fs,OSW,sm(0,0.14,r))||0;
      const kf=`400 SIZEpx ${ELITE}`,ks=fitText(c,item.ko,maxW-60,60,kf);
      tape(c,item.ko,cx,250+used+48,ks,(r-0.8)/0.7);
    }else{
      const font=`700 SIZEpx ${OSW}`,lines=wrapLines(c,item.ko,maxW,128,font,2),fs=fitFont(c,lines,maxW,128,font,56);
      const used=slam(c,lines,cx,290,fs,OSW,sm(0,0.14,r))||0;
      c.save();c.globalAlpha=sm(0.6,1.0,r);c.textAlign='center';c.shadowColor='rgba(0,0,0,0.9)';c.shadowBlur=10;c.fillStyle=gy(228);
      const sf=fitText(c,item.es,maxW,48,`400 SIZEpx ${ELITE}`);c.font=`400 ${sf}px ${ELITE}`;c.fillText(item.es,cx,290+used+30);c.restore();
    }
    stamp(c,img?1010:cx+310,img?478:560,'¡CORRECTO!',sm(1.4,1.52,r),-0.16,40);
  }
}

// ---------- acabado de proyección ----------
function finish(ctx,t){
  const fr24=Math.floor(t*24),Rg=H.rng(7000+fr24),flick=1+NZ.n2(t*9,4.4)*0.05;
  const soft=lay('soft',W,HH),sfx=soft.getContext('2d');sfx.filter='blur(0.8px)';sfx.drawImage(ctx.canvas,0,0);sfx.filter='none';ctx.drawImage(soft,0,0);
  const LV=C.lv||(C.lv=new Float32Array(766)),LA=C.la||(C.la=new Float32Array(766));
  for(let s=0;s<766;s++){let v=Math.min(1,s/765*flick);v=v<0.5?0.5*Math.pow(2*v,1.5):1-0.5*Math.pow(2-2*v,1.3);LV[s]=v;LA[s]=0.15*(0.5+0.8*Math.sqrt(v*(1-v)+0.04));}
  const img=ctx.getImageData(0,0,W,HH),d=img.data,G=grainBuf();let p=Math.floor(Rg()*65536);
  for(let i=0;i<d.length;i+=4,p++){const s=d[i]+d[i+1]+d[i+2];let v=LV[s]+G[p]*LA[s];v=v<0?0:v>1?1:v;d[i]=v*255;d[i+1]=v*252;d[i+2]=v*246;}
  ctx.putImageData(img,0,0);
  const hl=lay('bloom',W>>2,HH>>2),hx=hl.getContext('2d');hx.filter='blur(6px) brightness(1.2)';hx.drawImage(ctx.canvas,0,0,W>>2,HH>>2);hx.filter='none';
  ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=0.25;ctx.drawImage(hl,0,0,W,HH);ctx.restore();
  H.vignette(ctx,W,HH,0.7,'0,0,0');
  for(let k=0;k<50;k++){const white=Rg()<0.6;ctx.fillStyle=white?`rgba(255,255,250,${Rg.range(0.4,0.9)})`:`rgba(0,0,0,${Rg.range(0.5,0.9)})`;const x=Rg()*W,y=Rg()*HH,r=Rg()<0.9?Rg.range(0.6,1.8):Rg.range(2,4);ctx.beginPath();ctx.ellipse(x,y,r,r*Rg.range(0.5,1),Rg()*3,0,7);ctx.fill();}
  ctx.strokeStyle='rgba(255,255,250,0.3)';ctx.lineWidth=1.2;ctx.beginPath();for(let y=0;y<=HH;y+=20)ctx.lineTo(300+Math.sin(t*6)*4+NZ.n2(3,y*0.01)*4,y);ctx.stroke();
  ctx.fillStyle='#000';ctx.fillRect(0,0,W,BAR);ctx.fillRect(0,HH-BAR,W,BAR);
}

// tipo de cambio de escena: iris, cortinilla dura o barrido de reloj (el cierre siempre con iris)
const transKind=beat=>beat.kind==='end'?0:beat.index%3;

export default {
  id:'noir',
  name:'Cine negro',
  fonts:['400 76px "Anton"','700 40px "Oswald"','400 66px "Limelight"','400 52px "Special Elite"','700 30px "Courier Prime"','400 15px "Courier Prime"','italic 400 36px "Playfair Display"','400 50px "UnifrakturMaguntia"'],
  fontCss:'https://fonts.googleapis.com/css2?family=Anton&family=Courier+Prime:wght@400;700&family=Limelight&family=Oswald:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,800;1,400&family=Special+Elite&family=UnifrakturMaguntia&display=block',
  readsPixels:true,
  frame(ctx,Wc,Hc,t,S){
    const wx=NZ.n2(t*3.1,0.3)*2.2,wy=NZ.n2(0.7,t*2.7)*2.8;
    ctx.fillStyle='#000';ctx.fillRect(0,0,W,HH);
    ctx.save();ctx.translate(wx,wy);
    if(S.prev&&S.local<0.7){
      const L=S.local,kind=transKind(S.beat),prevT=S.prev.t1-0.001;
      if(kind===0){
        const out=L<0.35,r=out?760*(1-E.in(sm(0,0.33,L))):760*E.out(sm(0.37,0.7,L)),[ix,iy]=S.beat.kind==='end'?[470,370]:[640,360];
        ctx.fillStyle='#000';ctx.fillRect(-10,-10,W+20,HH+20);
        ctx.save();ctx.beginPath();ctx.arc(ix,iy,Math.max(0.1,r),0,TAU);ctx.clip();out?drawBeat(ctx,prevT,S,S.prev):drawBeat(ctx,t,S,S.beat);ctx.restore();
      }else if(kind===1){
        const w=E.inOut(L/0.7)*(W+40);drawBeat(ctx,prevT,S,S.prev);
        ctx.save();ctx.beginPath();ctx.rect(-10,-10,w+10,HH+20);ctx.clip();drawBeat(ctx,t,S,S.beat);ctx.restore();
        ctx.fillStyle=gy(250);ctx.fillRect(w-3,-10,3,HH+20);
      }else{
        const a=E.inOut(L/0.7)*TAU;drawBeat(ctx,prevT,S,S.prev);
        ctx.save();ctx.beginPath();ctx.moveTo(640,360);ctx.arc(640,360,900,-Math.PI/2,-Math.PI/2+a);ctx.closePath();ctx.clip();drawBeat(ctx,t,S,S.beat);ctx.restore();
      }
    }else drawBeat(ctx,t,S,S.beat);
    ctx.restore();
    finish(ctx,t);
    // hornea por adelantado una textura por fotograma (humo, cono, luz final) para no dar tirones al cambiar de escena
    for(const [key,fn] of [['haze',hazeTex],['cone',lampCone],['endL',endLight]])if(!C[key]){fn();break;}
  },
  // Banda de noticiario: proyector y crepitar óptico debajo (se apagan con voz), papel, tambores,
  // sellos y campanilla en los eventos; metales con sordina para el título y el cierre.
  score(k,timeline){
    const sm2=H.smooth,D=timeline.duration;
    const brass=(t,notes,dur,g)=>notes.forEach((n,i)=>{for(const det of [-7,7])k.tone(t,{f:n,type:'sawtooth',detune:det,dur,gain:0.03*g,a:0.03,hold:dur*0.55,filter:'lowpass',f2:[[0,700],[0.06,2200],[dur,900]],q:0.7,pan:(i-(notes.length-1)/2)*0.3,verb:0.35});});
    const iris=(t,dur,open)=>k.noise(t,{dur,color:'pink',filter:'bandpass',f:open?[[0,500],[dur,2400]]:[[0,2400],[dur,500]],q:1.4,gain:0.16,a:dur*0.6,minor:true});
    const when=(f,v,a,b)=>{for(let t=a;t<=b;t+=0.002)if(f(t)>=v)return t;return b;};
    k.bed('projector',0,D,{gain:1.0});k.bed('vinyl',0,D,{gain:0.6});
    for(const beat of timeline.beats){
      const t0=beat.t0;
      if(beat.index){const kind=transKind(beat);
        if(kind===0){iris(t0,0.33,false);iris(t0+0.37,0.33,true);}
        else if(kind===1)k.play('swish',t0+0.05,{dur:0.5,gain:0.5,minor:true});
        else{for(let i=0;i<5;i++)k.play('tock',t0+0.04+i*0.12,{f:1100+i*120,gain:0.35,minor:true});}
      }
      if(beat.kind==='title'){
        const p=t=>E.out(sm2(0.1,1.0,t));
        for(let h=1;h<5;h++){const th=when(t=>p(t)*5,h,0.1,1.0);k.noise(th-0.03,{dur:0.09,color:'pink',filter:'bandpass',f:[[0,900],[0.05,2600],[0.09,1400]],q:0.8,gain:0.22*(0.35+0.18*h),a:0.03,minor:true});}
        k.play('slap',1.0,{gain:0.6,minor:true});
        k.withMinor(()=>{brass(1.05,['G3'],0.12,1);brass(1.19,['G3'],0.12,1);brass(1.33,['C4','E4','G4'],0.9,1.1);});
        continue;
      }
      if(beat.kind==='end'){k.withMinor(()=>brass(t0+0.9,['F3','C4','A4'],0.55,0.7));brass(t0+3.3,['C3','G3','E4','C5'],0.9,0.75);continue;}
      const {think,reveal}=beatTimes(beat);
      k.play('paper',t0+0.3,{dur:0.3,gain:0.8,pan:0.5,minor:true});
      // el tambor cae cuando el número cambia: en think0 + (duración - m)
      const secs=think[1]-think[0];for(let m=Math.ceil(secs)-1;m>=1;m--)k.play('tock',think[0]+secs-m,{f:600,gain:0.45,pan:0.1,minor:true});
      k.play('stamp',reveal[0],{gain:0.55});k.noise(reveal[0],{dur:0.05,filter:'highpass',f:3000,gain:0.2,minor:true});
      if(beat.kind==='listen')k.play('typing',reveal[0]+0.8,{n:Math.min(10,[...beat.item.ko].length),rate:0.07,gain:0.4,pan:0.3,minor:true});
      k.play('stamp',reveal[0]+1.52,{gain:0.4,pan:0.4,minor:true});k.play('bell',reveal[0]+1.6,{f:'A6',gain:0.45,pan:0.4,minor:true});
    }
  },
};
