// Estilo «Ukiyo-e Woodblock»: grabado Edo a la manera de Hokusai. Técnicas del
// paquete: líneas talladas de la plancha clave (keyline), garras de espuma,
// corrientes con cabeza de espuma, cartuchos de papel con bokashi, sellos
// bermellón, remolino Naruto, nubes kasumi doradas con mica, cielo ocre con
// bokashi pizarra, mar de Prusia, y el acabado de veta de madera + fibra de
// washi + absorción desigual sobre cada píxel. El cambio de escena es una
// «tirada»: se arranca el grabado anterior y la nueva hoja se imprime plancha a
// plancha (clave, ocre, azul pálido, azul medio, bermellón, Prusia, bokashi).
import {beatTimes,fitFont,wrapLines} from './shared.js';

const H=window.H;
const HANGUL='"AppleMyungjo","Nanum Myeongjo","Noto Serif KR","Apple SD Gothic Neo","Noto Sans KR",serif';
const SERIF=`"Noto Serif JP",${HANGUL}`;
const C={paper:'#ecdfc2',key:'#1b2236',prussD:'#16304f',pruss:'#24507e',mid:'#4d7ca6',light:'#93b4cc',pale:'#c9d6d6',foam:'#f1e8d2',sky:'#e3d2ab',fuji:'#6d84a0',hull:'#7d3f2c',ochre:'#d2a75c',grey:'#9aa8b0',red:'#c4432d',green:'#7a9a6a'};
const E=H.ease,cl=H.clamp,win=(t,a,b)=>cl((t-a)/(b-a));

const fieldNoise=(w,h,seed,cell,oct,sx=1,sy=1)=>{
  const nz=H.makeNoise(seed),gw=Math.ceil(w/cell)+2,gh=Math.ceil(h/cell)+2,g=new Float32Array(gw*gh);
  for(let j=0;j<gh;j++)for(let i=0;i<gw;i++)g[j*gw+i]=nz.fbm2(i*0.35*sx,j*0.35*sy,oct);
  const out=new Float32Array(w*h);
  for(let y=0;y<h;y++){const fy=y/cell,j=fy|0,ty=fy-j;for(let x=0;x<w;x++){const fx=x/cell,i=fx|0,tx=fx-i,k=j*gw+i,a=g[k]+(g[k+1]-g[k])*tx,b=g[k+gw]+(g[k+gw+1]-g[k+gw])*tx;out[y*w+x]=a+(b-a)*ty;}}
  return out;
};
// Catmull-Rom -> polilínea densa
const sample=(pts,per=14)=>{const out=[];for(let i=0;i<pts.length-1;i++){const p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(pts.length-1,i+2)];for(let k=0;k<per;k++){const t=k/per,t2=t*t,t3=t2*t,f=(a,b,c,d)=>0.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);out.push([f(p0[0],p1[0],p2[0],p3[0]),f(p0[1],p1[1],p2[1],p3[1])]);}}out.push(pts[pts.length-1]);return out;};
const normals=poly=>poly.map((p,i)=>{const a=poly[Math.max(0,i-1)],b=poly[Math.min(poly.length-1,i+1)];let tx=b[0]-a[0],ty=b[1]-a[1];const l=Math.hypot(tx,ty)||1;tx/=l;ty/=l;return{tx,ty,nx:ty,ny:-tx};});

// línea de la plancha clave: trazo tallado algo irregular
const keyline=(c,path,w,col=C.key)=>{c.save();c.strokeStyle=col;c.lineJoin='round';c.lineCap='round';c.lineWidth=w;c.stroke(path);c.globalAlpha=0.5;c.lineWidth=w*0.6;c.translate(0.7,0.5);c.stroke(path);c.restore();};
const fillKey=(c,path,col,w=1.8)=>{c.save();c.translate(1.5,1);c.fillStyle=col;c.fill(path);c.restore();keyline(c,path,w);};
const vbok=(c,y0,y1,stops)=>{const g=c.createLinearGradient(0,y0,0,y1);stops.forEach(([u,col])=>g.addColorStop(u,col));return g;};
// una garra de espuma: dedo en gancho más dedos menores
const claw=(c,x,y,nx,ny,tx,ty,L,r)=>{
  const fingers=r.int(3,4);
  for(let f=0;f<fingers;f++){
    const s=L*(1-f*0.2)*r.range(0.85,1.1),off=(f-(fingers-1)/2)*L*0.24,bx=x+tx*off,by=y+ty*off,w=s*0.22;
    const p=new Path2D();p.moveTo(bx-tx*w,by-ty*w);p.quadraticCurveTo(bx+nx*s*0.9+tx*s*0.2,by+ny*s*0.9+ty*s*0.2,bx+nx*s*0.75+tx*s*0.75,by+ny*s*0.75+ty*s*0.75);p.quadraticCurveTo(bx+nx*s*0.45+tx*s*0.55,by+ny*s*0.45+ty*s*0.55,bx+tx*w,by+ty*w);p.closePath();
    c.fillStyle=C.foam;c.fill(p);c.lineWidth=1.6;c.strokeStyle=C.key;c.stroke(p);
  }
};
// corriente con cabeza de garra de espuma (las flechas del medio)
const current=(c,pts,p,foam=true)=>{
  if(p<=0)return;const poly=sample(pts,16),n=Math.max(2,Math.floor(poly.length*p)),part=poly.slice(0,n),nn=normals(part);
  for(const off of[-8,0,8]){c.strokeStyle=off?C.mid:C.pruss;c.lineWidth=off?2:5;c.lineCap='round';c.beginPath();part.forEach(([x,y],i)=>{const X=x+nn[i].nx*off,Y=y+nn[i].ny*off;i?c.lineTo(X,Y):c.moveTo(X,Y);});c.stroke();}
  if(foam){const e=part[part.length-1],q=nn[nn.length-1],r=H.rng(7);claw(c,e[0],e[1],q.tx*0.6+q.nx*0.4,q.ty*0.6+q.ny*0.4,-q.nx,-q.ny,26,r);}
};
// Reparte dos líneas para que queden parejas (el corte voraz deja una palabra sola).
const balance=(c,L,size,font)=>{if(L.length!==2)return L;const w=L.join(' ').split(' ');c.save();c.font=font.replace('SIZE',size);let best=L,bw=1e9;for(let i=1;i<w.length;i++){const a=w.slice(0,i).join(' '),b=w.slice(i).join(' '),m=Math.max(c.measureText(a).width,c.measureText(b).width);if(m<bw){bw=m;best=[a,b];}}c.restore();return best;};
// Cartucho de papel con texto; se parte/ajusta si no cabe. p: aparición; press: sello que baja.
function cart(c,text,x,y,size,p=1,bg='#e8d49a',fg=C.key,maxW=1100,align='center',lines=2){
  if(p<=0)return 0;
  const font=`700 SIZEpx ${SERIF}`,L=balance(c,wrapLines(c,text,maxW-size*1.1,size,font,lines),size,font),fs=fitFont(c,L,maxW-size*1.1,size,font);
  c.save();c.font=font.replace('SIZE',fs);c.textBaseline='middle';
  const tw=Math.max(...L.map(s=>c.measureText(s).width)),w=tw+fs*1.1,h=fs*1.7+(L.length-1)*fs*1.15,x0=align==='center'?x-w/2:align==='right'?x-w:x;
  const k=1+(1-cl(p))*0.25;c.translate(x0+w/2,y);c.scale(k,k);c.translate(-(x0+w/2),-y);c.globalAlpha=Math.min(1,p*1.5);
  const r=new Path2D();r.rect(x0,y-h/2,w,h);
  if(bg[0]==='#'&&bg.length===7){const v=H.hex(bg),lt=v.map(q=>Math.round(q+(255-q)*0.35)),dk=v.map(q=>Math.round(q*0.93));c.fillStyle=vbok(c,y-h/2,y+h/2,[[0,`rgb(${lt})`],[0.45,bg],[1,`rgb(${dk})`]]);}else c.fillStyle=bg;
  c.fill(r);c.strokeStyle=C.key;c.lineWidth=2;c.stroke(r);c.lineWidth=1;c.strokeRect(x0+4,y-h/2+4,w-8,h-8);
  c.fillStyle=fg;c.textAlign='center';L.forEach((s,i)=>c.fillText(s,x0+w/2,y+1+(i-(L.length-1)/2)*fs*1.15));
  c.restore();cart.w=w;return h;
}
const seal=(c,x,y,s,glyph,p,rot=0.05)=>{ // sello bermellón estampado
  if(p<=0)return;const k=1+(1-p)*0.8;c.save();c.translate(x,y);c.rotate(rot);c.scale(k,k);c.globalAlpha=Math.min(1,p*2);
  c.fillStyle=C.red;c.fillRect(-s/2,-s/2,s,s);c.strokeStyle='#efe2c6';c.lineWidth=s*0.06;c.strokeRect(-s*0.4,-s*0.4,s*0.8,s*0.8);
  c.fillStyle='#efe2c6';c.strokeStyle='#efe2c6';c.lineCap='square';c.lineWidth=s*0.13;
  if(glyph==='v'){c.beginPath();c.moveTo(-s*0.24,0);c.lineTo(-s*0.06,s*0.18);c.lineTo(s*0.24,-s*0.2);c.stroke();}
  else{c.font=`900 ${s*0.62}px ${SERIF}`;c.textAlign='center';c.textBaseline='middle';c.fillText(glyph,0,s*0.03);}
  c.restore();
};
// banco de niebla dorada (kasumi) con lóbulos, mica y línea fina; estático -> cacheado
const KAS={};
const kasumi=(c,x,top,bot)=>{
  const key=Math.round(x)+':'+top+':'+bot;let L=KAS[key];
  if(!L){
    const r=H.rng(Math.round(x)+500),bumps=[];
    for(let y=top;y<=bot;y+=60)bumps.push([x-90+r.range(-20,20),y+30]);
    for(let y=bot;y>=top;y-=60)bumps.push([x+90+r.range(-20,20),y]);
    const ox=x-160,oy=top-50,lw=320,lh=bot-top+130;
    L=H.layer(lw,lh);L.ox=ox;L.oy=oy;const k=L.getContext('2d');k.translate(-ox,-oy);
    const shape=new Path2D();shape.rect(x-90,top,180,bot+30-top);bumps.forEach(([bx,by])=>{shape.moveTo(bx+34,by);shape.arc(bx,by,34,0,Math.PI*2);});
    k.strokeStyle='rgba(27,34,54,0.72)';k.lineWidth=2.6;k.lineJoin='round';bumps.forEach(([bx,by])=>{k.beginPath();k.arc(bx,by,34,0,Math.PI*2);k.stroke();});k.strokeRect(x-90,top,180,bot+30-top);
    const g=k.createLinearGradient(x-126,0,x+126,0);g.addColorStop(0,'#ece0bc');g.addColorStop(0.2,'#e2cd92');g.addColorStop(0.5,'#d4b25a');g.addColorStop(0.8,'#e2cd92');g.addColorStop(1,'#ece0bc');
    k.save();k.translate(1.2,0.8);k.fillStyle=g;k.fill(shape);k.restore();
    k.save();k.clip(shape);
    const gv=k.createLinearGradient(0,top-34,0,bot+64);gv.addColorStop(0,'rgba(176,132,48,0.28)');gv.addColorStop(0.45,'rgba(176,132,48,0)');gv.addColorStop(1,'rgba(255,248,220,0.18)');k.fillStyle=gv;k.fillRect(x-160,top-50,320,lh);
    k.strokeStyle='rgba(160,118,40,0.2)';k.lineWidth=1;bumps.forEach(([bx,by],i)=>{const sgn=i<bumps.length/2?-1:1;k.beginPath();k.arc(bx-sgn*7,by,24,sgn<0?Math.PI*0.62:-Math.PI*0.38,sgn<0?Math.PI*1.38:Math.PI*0.38);k.stroke();});
    const mr=H.rng(Math.round(x)+991);for(let i=0;i<1100;i++){const px=mr.range(x-130,x+130),py=mr.range(top-34,bot+64),sz=mr.range(0.6,1.6);k.fillStyle=mr()<0.8?`rgba(255,248,222,${mr.range(0.35,0.7)})`:`rgba(150,110,40,${mr.range(0.15,0.3)})`;k.fillRect(px,py,sz,sz);}
    k.restore();KAS[key]=L;
  }
  c.drawImage(L,L.ox,L.oy);
};
const seaBand=(c,x0,x1,y,t)=>{ // agua con líneas de ola al pie del grabado
  const g=c.createLinearGradient(0,y,0,720);g.addColorStop(0,C.light);g.addColorStop(0.18,C.mid);g.addColorStop(0.6,C.pruss);g.addColorStop(1,C.prussD);c.fillStyle=g;c.fillRect(x0,y,x1-x0,720-y);
  c.strokeStyle='rgba(241,232,210,0.75)';c.lineWidth=1.6;for(let i=0;i<6;i++){const yy=y+14+i*18;c.beginPath();for(let x=x0;x<=x1;x+=8){const v=yy+Math.sin(x*0.03+i*1.7+t*1.2)*3;x===x0?c.moveTo(x,v):c.lineTo(x,v);}c.stroke();}
  c.strokeStyle=C.key;c.lineWidth=2;c.beginPath();for(let x=x0;x<=x1;x+=8){const v=y+Math.sin(x*0.02+t)*4;x===x0?c.moveTo(x,v):c.lineTo(x,v);}c.stroke();
  for(let k=Math.ceil(x0/150);k*150<=x1;k++){const fx=k*150+40*Math.sin(k*2.3),fy=y+Math.sin(fx*0.02+t)*4,r=H.rng(1000+k*7);claw(c,fx,fy,0.25,-1,1,0.25,15+r.range(0,5),r);}
};
const fuji=(c,x,base,peak,half)=>{
  const f=new Path2D();f.moveTo(x-half,base);f.quadraticCurveTo(x-half*0.45,base-(base-peak)*0.45,x-half*0.1,peak);f.lineTo(x+half*0.1,peak-2);f.quadraticCurveTo(x+half*0.45,base-(base-peak)*0.45,x+half,base);f.closePath();
  fillKey(c,f,vbok(c,peak,base,[[0,C.prussD],[0.55,C.fuji],[1,C.light]]));
  const s=half/260,cap=new Path2D(),P=(a,b)=>[x+(a-932)*s*2,peak+(b-400)*s*2];
  cap.moveTo(...P(905,400));cap.lineTo(...P(960,398));cap.lineTo(...P(990,445));[[970,430],[955,450],[935,428],[918,448],[895,432],[880,444]].forEach(([a,b])=>cap.lineTo(...P(a,b)));cap.closePath();fillKey(c,cap,C.foam,1.4);
};

// Fondo común: papel, plancha ocre del cielo con bokashi pizarra, mar, niebla dorada en los bordes.
function backdrop(c,W,Hh,t){
  c.fillStyle=C.paper;c.fillRect(0,0,W,Hh);
  c.fillStyle=vbok(c,0,600,[[0,C.sky],[0.2,C.sky],[0.82,'#e7d8b4'],[1,'#efe5cc']]);c.fillRect(0,0,W,600);
  const sk=c.createLinearGradient(0,0,0,200);sk.addColorStop(0,'rgba(46,62,84,0.85)');sk.addColorStop(1,'rgba(90,100,110,0)');c.fillStyle=sk;c.fillRect(0,0,W,200);
  seaBand(c,-50,W+50,600,t);
}
function edges(c,W,Hh){
  c.fillStyle=vbok(c,0,30,[[0,'#cfac55'],[0.55,'rgba(214,184,104,0.85)'],[1,'rgba(220,194,122,0)']]);c.fillRect(0,0,W,30);
  c.fillStyle=vbok(c,Hh-28,Hh,[[0,'rgba(220,194,122,0)'],[0.45,'rgba(214,184,104,0.85)'],[1,'#cfac55']]);c.fillRect(0,Hh-28,W,28);
}
// Lámina enmarcada: la ilustración impresa en una hoja con doble filete.
function printFrame(c,img,x,y,w,h,p){
  if(p<=0||!img)return;
  c.save();c.globalAlpha=cl(p*1.5);const k=0.92+0.08*E.out(cl(p));c.translate(x,y);c.scale(k,k);
  const r=new Path2D();r.rect(-w/2,-h/2,w,h);fillKey(c,r,'#f1e8d2',2.2);c.strokeStyle=C.key;c.lineWidth=1;c.strokeRect(-w/2+7,-h/2+7,w-14,h-14);
  const iw=img.naturalWidth||img.width||1,ih=img.naturalHeight||img.height||1,s=Math.min((w-34)/iw,(h-34)/ih);
  c.drawImage(img,-iw*s/2,-ih*s/2,iw*s,ih*s);c.restore();
}
// Campana de templo (bonshō) que suena: ondas como corrientes con garras.
function bell(c,x,y,t,p){
  if(p<=0)return;
  c.save();c.globalAlpha=cl(p*1.6);
  c.translate(x,y);c.scale(1.25,1.25);c.translate(-x,-y);
  const beam=new Path2D();beam.rect(x-160,y-166,320,16);fillKey(c,beam,vbok(c,y-166,y-150,[[0,'#94503a'],[1,'#5e2c1e']]),1.6);
  const sw=Math.sin(t*5)*0.08;c.translate(x,y-150);c.rotate(sw*0.3);c.translate(-x,-(y-150));
  c.strokeStyle=C.key;c.lineWidth=4;c.beginPath();c.moveTo(x,y-150);c.lineTo(x,y-128);c.stroke();const hook=new Path2D();hook.ellipse(x,y-136,12,9,0,0,7);keyline(c,hook,3);
  const b=new Path2D();b.moveTo(x-70,y+90);b.lineTo(x-62,y-90);b.quadraticCurveTo(x-60,y-128,x,y-130);b.quadraticCurveTo(x+60,y-128,x+62,y-90);b.lineTo(x+70,y+90);b.closePath();
  fillKey(c,b,vbok(c,y-130,y+90,[[0,'#b07a3a'],[0.5,C.ochre],[1,'#7d4f22']]),2.4);
  c.save();c.clip(b);c.strokeStyle=C.key;c.lineWidth=2;[y-60,y+30,y+70].forEach(yy=>{c.beginPath();c.moveTo(x-80,yy);c.lineTo(x+80,yy);c.stroke();});
  c.fillStyle='#8a5a28';for(let i=0;i<4;i++)for(let j=0;j<2;j++){c.beginPath();c.arc(x-40+i*27,y-95+j*22,5,0,7);c.fill();c.stroke();}
  const seat=new Path2D();seat.arc(x,y+50,14,0,7);fillKey(c,seat,C.red,1.6);c.restore();
  c.restore();
  // ondas del sonido: corrientes que se abren a ambos lados, en bucle
  for(let i=0;i<3;i++){
    const ph=((t*0.9)+1-i*0.3)%1,R=110+i*40;
    for(const d of[-1,1]){const pts=[];for(let k=0;k<=6;k++){const a=-0.75+1.5*k/6;pts.push([x+d*Math.cos(a)*R,y+Math.sin(a)*R*0.9]);}current(c,pts,E.out(cl(ph*1.6))*p,ph>0.25);}
  }
}
// Remolino Naruto: la cuenta atrás gira en el centro.
function whirlpool(c,wx,wy,R,t,wp){
  if(wp<=0)return;const rot=t*0.9;
  const disk=new Path2D();disk.arc(wx,wy,R*wp,0,7);const dg=c.createRadialGradient(wx,wy,0,wx,wy,R*wp);dg.addColorStop(0,C.prussD);dg.addColorStop(0.45,C.pruss);dg.addColorStop(1,C.mid);fillKey(c,disk,dg,2);
  c.save();c.clip(disk);c.strokeStyle='rgba(241,232,210,0.85)';c.lineWidth=3;c.beginPath();for(let a=0;a<26;a+=0.05){const r=R*0.95-a*R*0.036;c.lineTo(wx+Math.cos(a+rot)*r,wy+Math.sin(a+rot)*r);}c.stroke();
  c.strokeStyle=C.pruss;c.lineWidth=5;c.beginPath();for(let a=0;a<26;a+=0.05){const r=R*0.91-a*R*0.036;c.lineTo(wx+Math.cos(a+rot)*r,wy+Math.sin(a+rot)*r);}c.stroke();c.restore();
  const rc=H.rng(3);for(let i=0;i<18;i++){const a=i/18*Math.PI*2+rot*0.5;claw(c,wx+Math.cos(a)*R*wp,wy+Math.sin(a)*R*wp,Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),22*wp,rc);}
}
// anillo de pincel rojo alrededor de lo importante
const ring=(c,x,y,rx,ry,p)=>{if(p<=0)return;c.save();c.strokeStyle=C.red;c.lineWidth=5;c.lineCap='round';c.beginPath();c.ellipse(x,y,rx,ry,-0.04,-1.5,-1.5+Math.PI*1.9*p);c.stroke();c.restore();};

function drawBeat(c,W,Hh,t,S,beat){
  const L=t-beat.t0;
  backdrop(c,W,Hh,t);
  if(beat.kind==='title'){
    const sy=H.lerp(330,170,E.out(win(L,0.1,1.6)));
    c.save();c.globalAlpha=0.95;c.fillStyle=C.red;c.beginPath();c.arc(1010,sy,80,0,7);c.fill();c.restore();
    fuji(c,1010,600,440,240);
    if(S.assets.scene)printFrame(c,S.assets.scene,1000,330,360,250,win(L,0.4,0.9));
    cart(c,(beat.heading||`REPASO · CLASE ${beat.classNumber}`),420,150,62,win(L,0.1,0.45),'#e8d49a',C.key,760);
    cart(c,beat.unitTitle||'',420,285,44,win(L,0.6,0.9),'#f1e8d2',C.pruss,700);
    cart(c,(beat.tagline||'¿Cuánto recuerdas?'),420,430,50,win(L,1.4,1.7),'#e8b07a',C.key,700);
    current(c,[[420,330],[400,360],[422,386]],E.out(win(L,1.1,1.4)));
    seal(c,1172,462,58,'福',win(L,2.0,2.15),-0.06);
  }else if(beat.kind==='end'){
    const sy=H.lerp(520,230,E.out(win(L,0,1.4)));
    c.save();c.fillStyle=C.red;c.beginPath();c.arc(640,sy,74,0,7);c.fill();c.restore();
    fuji(c,640,600,390,270);
    cart(c,'¡Muy bien!',640,160,84,win(L,0.1,0.45),'#e8d49a',C.key,900);
    cart(c,(beat.tally||`${beat.total} frases repasadas`),640,290,48,win(L,0.8,1.1),'#f1e8d2',C.pruss,900);
    current(c,[[640,340],[615,365],[638,392]],E.out(win(L,1.2,1.5)));
    cart(c,(beat.closing||'Mañana vuelven: ¡no las sueltes!'),640,450,46,win(L,1.5,1.8),'#e8b07a',C.key,1000);
    seal(c,1000,290,80,'優',win(L,2.2,2.35),-0.08);
  }else{
    const {ask,think,reveal}=beatTimes(beat),item=beat.item,img=S.assets.picture(item.picture),listen=beat.kind==='listen';
    const cx=img?430:640,maxW=img?720:1040;
    cart(c,listen?'ESCUCHA':'¿CÓMO SE DICE?',48,78,46,win(L,0,0.3),listen?'#c9d6d6':'#e8b07a',C.key,700,'left',1);
    cart(c,`${beat.number} / ${beat.total}`,1232,78,40,win(L,0,0.3),'#f1e8d2',C.key,300,'right',1);
    if(img)printFrame(c,img,1020,340,300,300,win(L,0.3,0.8));
    if(t<think[0]){
      if(listen)bell(c,cx,340,t,win(L,0.2,0.6));
      else cart(c,item.es,cx,320,66,win(L,0.3,0.7),'#e8d49a',C.key,maxW);
    }else if(t<reveal[0]){
      const dur=think[1]-think[0],pp=(t-think[0])/dur,left=Math.max(1,Math.ceil(dur*(1-pp)-1e-6));
      whirlpool(c,cx,320,150,t,E.out(win(t,think[0],think[0]+0.5)));
      cart(c,String(left),cx,320,92,1,'#f1e8d2',C.key,300,'center',1);
      cart(c,listen?'¿Qué significa?':'¡Dilo en voz alta!',cx,528,40,win(t,think[0]+0.2,think[0]+0.5),'#e8b07a',C.red,maxW);
    }else{
      const r=t-reveal[0],big=listen?item.es:item.ko;
      // la respuesta se estampa como una impresión nueva, con el anillo de pincel rojo
      const h=cart(c,big,cx,260,listen?68:100,E.out(win(r,0,0.35)),'#e8d49a',listen?C.key:C.pruss,maxW);
      ring(c,cx,260,Math.min(630,cart.w*0.56+40),h/2+40,win(r,0.35,0.75));
      if(listen)cart(c,item.ko,cx,260+h/2+100,56,win(r,0.8,1.1),'#f1e8d2',C.pruss,maxW,'center',1);
      else cart(c,item.es,cx,260+h/2+96,42,win(r,0.6,0.9),'#f1e8d2',C.key,maxW);
      seal(c,img?cx+300:cx+430,500,78,'v',win(r,1.2,1.35),0.06);
    }
  }
  kasumi(c,-70,140,520);kasumi(c,W+70,140,520);
  edges(c,W,Hh);
}

// --- impresión plancha a plancha (como el hero del paquete) ---
// contexto «solo clave»: lo del color clave imprime; todo lo demás talla (oclusión)
const keyOnly=kc=>{
  const P=CanvasRenderingContext2D.prototype,isKey=st=>typeof st==='string'&&(st.startsWith('#1b2236')||st.startsWith('rgba(27, 34, 54'));
  const wrap=(name,prop)=>{kc[name]=function(...a){if(prop&&isKey(this[prop]))return P[name].apply(this,a);const g=this.globalCompositeOperation;this.globalCompositeOperation='destination-out';P[name].apply(this,a);this.globalCompositeOperation=g;};};
  wrap('fill','fillStyle');wrap('fillRect','fillStyle');wrap('fillText','fillStyle');wrap('stroke','strokeStyle');wrap('strokeRect','strokeStyle');wrap('strokeText','strokeStyle');wrap('drawImage',null);
};
let COL=null,KEY=null,FIELDS=null,FIB=null;
const fields=(W,Hh)=>FIELDS||(FIELDS={warp:fieldNoise(W,Hh,3,30,3),fine:fieldNoise(W,Hh,4,2,2,0.15,2.2),pap:fieldNoise(W,Hh,6,3,2,2.5,0.6),blot:fieldNoise(W,Hh,7,40,4)});
const fibres=(W,Hh)=>{if(FIB)return FIB;FIB=H.layer(W,Hh);const c=FIB.getContext('2d'),rf=H.rng(55);for(let i=0;i<300;i++){const x=rf.range(0,W),y=rf.range(0,Hh),l=rf.range(10,40),a=rf.range(0,Math.PI*2);c.strokeStyle=rf()<0.5?'rgba(255,250,235,0.24)':'rgba(120,95,60,0.13)';c.lineWidth=rf.range(0.5,1.1);c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+Math.cos(a)*l*0.5+rf.range(-6,6),y+Math.sin(a)*l*0.5+rf.range(-6,6),x+Math.cos(a)*l,y+Math.sin(a)*l);c.stroke();}return FIB;};
function pressPrint(ctx,W,Hh,draw,L){
  if(!COL){COL=H.layer(W,Hh);KEY=H.layer(W,Hh);keyOnly(KEY.getContext('2d',{willReadFrequently:true}));}
  const cc=COL.getContext('2d',{willReadFrequently:true}),kc=KEY.getContext('2d',{willReadFrequently:true});
  cc.clearRect(0,0,W,Hh);kc.clearRect(0,0,W,Hh);draw(cc);draw(kc);
  const press=t0=>cl((L-t0)/0.09); // cada impresión cae en ~3 cuadros
  // planchas: 0 clave, 1 cálida (cielo/ocre), 2 azul pálido, 3 azul medio, 4 bermellón/marrón, 5 Prusia
  const prog=[press(0.04),press(0.14),press(0.23),press(0.32),press(0.41),press(0.5)];
  const cd=cc.getImageData(0,0,W,Hh).data,kd=kc.getImageData(0,0,W,Hh).data,out=ctx.createImageData(W,Hh),od=out.data;
  const PA=H.hex(C.paper),SKY=H.hex(C.sky),SL=[46,62,84],BL=Math.hypot(SKY[0]-SL[0],SKY[1]-SL[1],SKY[2]-SL[2]),BD=[(SKY[0]-SL[0])/BL,(SKY[1]-SL[1])/BL,(SKY[2]-SL[2])/BL];
  for(let y=0,p=0;y<Hh;y++)for(let x=0;x<W;x++,p++){
    const i=p*4,r=cd[i],g=cd[i+1],b=cd[i+2];let pl;
    if(kd[i+3]>110)pl=0;
    else if(Math.abs(r-PA[0])+Math.abs(g-PA[1])+Math.abs(b-PA[2])<24||(r>228&&g>220&&b>196))pl=-1;
    else if(g<r*0.6&&r>b)pl=4;
    else if(r>=b)pl=1;
    else{const lum=(r*0.3+g*0.55+b*0.15)/255;pl=lum>0.55?2:lum>0.36?3:5;}
    let R,G,B;
    // el bokashi del cielo se imprime con la plancha del cielo y se limpia al final de arriba abajo
    const qr=SKY[0]-r,qg=SKY[1]-g,qb=SKY[2]-b,proj=qr*BD[0]+qg*BD[1]+qb*BD[2],tl=proj/BL,perp=Math.hypot(qr-BD[0]*proj,qg-BD[1]*proj,qb-BD[2]*proj);
    if(pl!==0&&y<245&&tl>0.03&&tl<0.94&&perp<16){const kb=H.smooth(0,1,(L-0.52-y*0.0006)/0.14),ks=prog[1];R=PA[0]+(SKY[0]-PA[0])*ks+(r-SKY[0])*kb;G=PA[1]+(SKY[1]-PA[1])*ks+(g-SKY[1])*kb;B=PA[2]+(SKY[2]-PA[2])*ks+(b-SKY[2])*kb;}
    else{const k=pl<0?prog[0]:prog[pl];R=PA[0]+(r-PA[0])*k;G=PA[1]+(g-PA[1])*k;B=PA[2]+(b-PA[2])*k;}
    od[i]=R;od[i+1]=G;od[i+2]=B;od[i+3]=255;
  }
  ctx.putImageData(out,0,0);
}
// acabado: veta de madera en cada plancha, fibra de washi, absorción desigual, papel envejecido
function finish(c,W,Hh){
  const img=c.getImageData(0,0,W,Hh),d=img.data,{warp,fine,pap,blot}=fields(W,Hh),rg=H.rng(2);
  for(let y=0,p=0;y<Hh;y++)for(let x=0;x<W;x++,p++){
    const i=p*4,lum=(d[i]*0.3+d[i+1]*0.55+d[i+2]*0.15)/255,inked=cl((0.85-lum)*1.6),plate=cl((0.94-lum)*1.3);
    const grain=Math.sin(y*0.55+warp[p]*26+x*0.004)*0.5+fine[p]*0.8;
    let s=1+grain*(0.07+0.07*inked)*plate;s*=1+pap[p]*0.035+(rg()-0.5)*0.04;s*=1-Math.max(0,blot[p])*0.12*plate;
    d[i]=d[i]*s+6*(1-inked);d[i+1]=d[i+1]*s;d[i+2]=d[i+2]*s*0.97-4*(1-inked);
  }
  c.putImageData(img,0,0);c.drawImage(fibres(W,Hh),0,0);H.vignette(c,W,Hh,0.25,'90,60,30');
}

export default {
  id:'ukiyoe',
  name:'Grabado ukiyo-e',
  fonts:['700 26px "Noto Serif JP"','900 22px "Noto Serif JP"'],
  fontCss:'https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700;900&display=block',
  readsPixels:true,
  frame(ctx,W,Hh,t,S){
    const L=S.local;
    if(L<0.7){
      // Tirada: la hoja nueva se imprime plancha a plancha...
      pressPrint(ctx,W,Hh,c=>drawBeat(c,W,Hh,t,S,S.beat),L);
      // ...mientras el grabado anterior se arranca del taco de derecha a izquierda.
      if(S.prev){
        const u=E.inOut(cl(L/0.45)),edge=W*(1-u)+(-40)*u;
        if(edge>0){
          ctx.save();ctx.beginPath();ctx.rect(0,0,edge,Hh);ctx.clip();drawBeat(ctx,W,Hh,S.prev.t1-0.001,S,S.prev);ctx.restore();
          const fw=Math.min(170,(W-edge)*0.55,edge+40);
          // sombra de la hoja levantada sobre la nueva impresión
          const sh=ctx.createLinearGradient(edge,0,edge+60,0);sh.addColorStop(0,'rgba(40,28,14,0.38)');sh.addColorStop(1,'rgba(40,28,14,0)');ctx.fillStyle=sh;ctx.fillRect(edge,0,60,Hh);
          // dorso del washi doblado sobre sí mismo
          const g=ctx.createLinearGradient(edge-fw,0,edge,0);g.addColorStop(0,'#d9c9a4');g.addColorStop(0.7,'#efe4c9');g.addColorStop(1,'#e2d3b0');
          ctx.fillStyle=g;ctx.fillRect(edge-fw,0,fw,Hh);
          ctx.strokeStyle='rgba(27,34,54,0.35)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(edge-fw,0);ctx.lineTo(edge-fw,Hh);ctx.stroke();
          ctx.save();ctx.beginPath();ctx.rect(edge-fw,0,fw,Hh);ctx.clip();ctx.globalAlpha=0.6;ctx.drawImage(fibres(W,Hh),0,0);ctx.restore();
        }
      }
    }else drawBeat(ctx,W,Hh,t,S,S.beat);
    finish(ctx,W,Hh);
  },
  // Sonido: taller de grabado. Hoja que se arranca + papel (cambio de escena), cincel
  // para cada segundo, sello bermellón + koto que resuelve en la respuesta.
  score(k,timeline){
    const koto=(t,n,g,p=0,minor,bend)=>{const f=k.hz(n);k.tone(t,{f:bend?[[0,f],[0.08,f],[0.5,f*0.89]]:[[0,f*1.012],[0.05,f]],type:'sawtooth',dur:1.3,gain:0.05*g,a:0.002,filter:'lowpass',f2:[[0,2600],[0.25,900],[1.3,500]],q:1.5,pan:p,verb:0.3,minor});k.tone(t,{f,type:'triangle',dur:1.0,gain:0.06*g,a:0.002,pan:p,minor});};
    const sealP=(t,g,p=0,minor)=>{k.play('stamp',t,{gain:0.6*g,pan:p,minor});k.noise(t+0.01,{dur:0.12,color:'pink',filter:'bandpass',f:1100,q:0.7,gain:0.08*g,a:0.01,pan:p,minor});};
    const chisel=(t,g,p=0)=>k.withMinor(()=>{k.noise(t,{dur:0.03,filter:'bandpass',f:1600,q:2,gain:0.3*g,a:0.001,pan:p});k.tone(t,{f:240,dur:0.05,gain:0.08*g,pan:p});});
    const swish=(t,dur,g,p=0)=>k.noise(t,{dur:dur+0.15,color:'pink',filter:'bandpass',f:[[0,400],[dur*0.6,1100],[dur+0.15,500]],q:1.1,gain:0.08*g,a:dur*0.5,pan:p,minor:true});
    const pull=t=>{k.play('paper',t,{dur:0.4,gain:0.6,minor:true});k.noise(t+0.45,{dur:0.2,color:'brown',filter:'lowpass',f:400,gain:0.2,a:0.01,minor:true});};
    koto(0.2,'D4',0.8,-0.2,true);koto(0.32,'A4',0.6,-0.1,true);sealP(2.15,0.5,0.8,true);
    for(const beat of timeline.beats){
      const t0=beat.t0;
      if(beat.index)pull(t0);
      if(beat.kind==='title')continue;
      if(beat.kind==='end'){koto(t0+0.3,'A4',0.7,-0.1,true);swish(t0+1.2,0.3,0.7);sealP(t0+2.35,0.9);['D3','A3','D4','Eb4','G4'].forEach((n,i)=>koto(t0+2.38+i*0.07,n,0.85-i*0.08,(i-2)*0.2));continue;}
      const {think,reveal}=beatTimes(beat);
      k.noise(think[0],{dur:0.8,color:'pink',filter:'bandpass',f:[[0,300],[0.35,900],[0.8,500]],q:2,gain:0.1,a:0.3,pan:-0.2,minor:true});
      for(let s=think[0]+1;s<think[1]-0.2;s+=1)chisel(s,0.8,-0.2);
      sealP(reveal[0]+0.33,0.6,-0.2,true);koto(reveal[0]+0.05,'D4',0.8,-0.2);
      swish(reveal[0]+0.35,0.4,0.6);
      sealP(reveal[0]+1.35,0.9,0.3);['G4','A4','D5'].forEach((n,i)=>koto(reveal[0]+1.37+i*0.1,n,0.8-i*0.1,0.3-0.1*i,true));
    }
  },
};
