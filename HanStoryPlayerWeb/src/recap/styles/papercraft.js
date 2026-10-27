// Estilo «Papercraft Models»: maquetas de cartulina impresa (pestañas de pegado,
// líneas de pliegue punteadas) sobre una plancha de corte verde. Técnicas tomadas
// del paquete: mini motor 3D de caras con bisagra (las plantillas se pliegan
// solas), sombreado Lambert por cara, fibra de papel, sombras suaves de una luz
// cálida, desenfoque de fondo, jitter de stop-motion a 12 fps y grano. La cámara
// se desliza por la plancha de una estación a otra entre beats.
import {beatTimes,fitFont,wrapLines,inLanguageLabel} from './shared.js';

const H=window.H;
const PI=Math.PI,HP=PI/2;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const win=(t,a,b)=>clamp((t-a)/(b-a));
const eio=x=>(x<0.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2);
const eback=x=>{if(x<=0)return 0;if(x>=1)return 1;const c=1.9;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2);};
const lerp=(a,b,u)=>a+(b-a)*u;
const TQ=t=>Math.floor(t*12+1e-6)/12; // stop-motion: las maquetas se reposan en «dos» (12 fps)
const HANGUL='"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif';
const FR=`"Fredoka",${HANGUL}`,MONO=`"Space Mono",${HANGUL}`,GROT=`"Space Grotesk",${HANGUL}`;

// ---------- vectores ----------
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const mul=(a,s)=>[a[0]*s,a[1]*s,a[2]*s];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const nrm=a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l];};
const LIGHT=nrm([-0.55,1.0,-0.5]); // luz cálida: arriba a la izquierda, un poco delante

const PAL={card:'#f5f0e4',back:'#e8e0cf',tab:'#ece5d4',blue:'#2f6db3',blueD:'#1f4f8a',orange:'#ee6b2d',yellow:'#f4b630',red:'#d83a2e',green:'#2e9a57',ink:'#22252d',cream:'#f7e6c8',teal:'#279c8e',steel:'#c3c8cd',wood:'#d6b585'};

// ---------- cámara (sin giro: se desliza sobre la plancha) ----------
const makeCam=(tx,tz,D,pitch,W,Hh,ty=0,F=1000)=>{
  const sp=Math.sin(pitch),cp=Math.cos(pitch),C=[tx,ty+D*sp,tz-D*cp];
  const proj=P=>{const dx=P[0]-C[0],dy=P[1]-C[1],dz=P[2]-C[2],zc=-dy*sp+dz*cp,yc=dy*cp+dz*sp;return[W/2+(F*dx)/zc,Hh/2-(F*yc)/zc,zc];};
  const ground=sy=>{const k=(Hh/2-sy)/F,dy=-sp+k*cp,dz=cp+k*sp;if(dy>=-1e-4)return null;const s=-C[1]/dy;return{z:C[2]+s*dz,s};};
  return{C,sp,cp,F,W,H:Hh,proj,ground};
};

// ---------- caras: piezas planas de cartulina impresa ----------
let GID=1;
const mkF=(O,ex,ey,poly,o)=>{let pw=0,ph=0;for(const p of poly){pw=Math.max(pw,p[0]);ph=Math.max(ph,p[1]);}return Object.assign({O,ex,ey,n:nrm(cross(ex,ey)),poly,pw,ph},o);};
const rect=(w,h)=>[[0,0],[w,0],[w,h],[0,h]];
const P3=(f,p)=>[f.O[0]+f.ex[0]*p[0]+f.ey[0]*p[1],f.O[1]+f.ex[1]*p[0]+f.ey[1]*p[1],f.O[2]+f.ex[2]*p[0]+f.ey[2]*p[1]];
// cara hija con bisagra en la arista A->B del padre. th>0 pliega hacia la cara impresa.
const attach=(par,A2,B2,th,poly,o)=>{const A=P3(par,A2),B=P3(par,B2),ex=nrm(sub(A,B)),ey0=cross(par.n,ex),ey=add(mul(ey0,Math.cos(th)),mul(par.n,Math.sin(th)));return mkF(B,ex,ey,poly,Object.assign({hinge:true},o));};
const fromPts=(pts,hint,o)=>{
  let P=pts,n=nrm(cross(sub(P[1],P[0]),sub(P[2],P[0])));
  if(dot(n,hint)<0){P=P.slice().reverse();n=mul(n,-1);}
  const O=P[0],ex=nrm(sub(P[1],P[0])),ey=cross(n,ex);
  let poly=P.map(p=>[dot(sub(p,O),ex),dot(sub(p,O),ey)]);
  const mx=Math.min(...poly.map(p=>p[0])),my=Math.min(...poly.map(p=>p[1]));
  poly=poly.map(p=>[p[0]-mx,p[1]-my]);
  return mkF(add(O,add(mul(ex,mx),mul(ey,my))),ex,ey,poly,o);
};
const xf=(faces,p=[0,0,0],yaw=0,s=1)=>{const c=Math.cos(yaw),sn=Math.sin(yaw),R=v=>[v[0]*c+v[2]*sn,v[1],-v[0]*sn+v[2]*c];return faces.map(f=>Object.assign({},f,{O:add(mul(R(f.O),s),p),ex:mul(R(f.ex),s),ey:mul(R(f.ey),s),n:R(f.n)}));};

// ---------- constructores ----------
const tabPrint=(c,w,h)=>{c.fillStyle='#e3dac6';c.fillRect(0,0,w,h);c.strokeStyle='rgba(120,100,70,0.35)';c.lineWidth=0.8;for(let x=-h;x<w;x+=3.2){c.beginPath();c.moveTo(x,h);c.lineTo(x+h,0);c.stroke();}};
// Caja plegada desde una red en cruz. f=0 plantilla plana, 1 montada.
const box=o=>{
  const {w,d,h}=o,f=o.f==null?1:o.f,grp=GID++,st=0.09;
  const C=k=>(typeof o.col==='string'?o.col:o.col[k]||o.col.side),PR=o.pr||{};
  const A=i=>HP*eio(clamp((f-i*st)/0.62)),ang={front:A(0),right:A(1),back:A(2),left:A(3)};
  if(o.gap&&f>0.85)ang[o.gap]=lerp(ang[o.gap],HP*(1-(o.gapAmt||0.05)),win(f,0.85,1));
  const lift=f>0&&f<1?1.4*Math.sin(PI*f):0;
  const ytop=h*Math.max(Math.sin(ang.front),Math.sin(ang.right),Math.sin(ang.back),Math.sin(ang.left))+0.04+lift;
  const closed=f>=1&&!o.gap;
  const top=mkF([-w/2,ytop,d/2],[1,0,0],[0,0,-1],rect(w,d),{grp,col:C('top'),print:PR.top,closed});
  const out=[top],tf=-HP*eio(win(f,0.12,0.7));
  const side=(k,A2,B2,L)=>{
    const p=attach(top,A2,B2,-ang[k],rect(L,h),{grp,col:C(k),print:PR[k],closed,fl:o.fl});out.push(p);
    if(o.tabs!==false&&(k==='front'||k==='back')&&!closed){const tw=Math.min(1.2,L*0.2),trap=[[0,0],[h,0],[h-tw*0.7,tw],[tw*0.7,tw]];out.push(attach(p,[L,0],[L,h],tf,trap,{grp,col:PAL.tab,print:tabPrint,bias:1.5,fl:false}));out.push(attach(p,[0,h],[0,0],tf,trap,{grp,col:PAL.tab,print:tabPrint,bias:1.5,fl:false}));}
    return p;
  };
  side('back',[0,0],[w,0],w);side('right',[w,0],[w,d],d);const fr=side('front',[w,d],[0,d],w);side('left',[0,d],[0,0],d);
  if(f<0.999)out.push(attach(fr,[w,h],[0,h],-HP*eio(win(f,0.72,1)),rect(w,d),{grp,col:C('bottom')||PAL.card,print:PR.bottom,fl:o.fl}));
  return out;
};
// Tarjeta tienda: dos paneles unidos por un pliegue impreso, con pies de pegado. a: 0 plana .. 1 de pie
const tent=o=>{
  const grp=GID++,al=(o.ang||1.12)*eio(clamp(o.a==null?1:o.a)),s=Math.sin(al),c=Math.cos(al),yr=o.h*s+0.03;
  const fr=mkF([-o.w/2,yr,0],[1,0,0],[0,-s,-c],rect(o.w,o.h),{grp,col:o.col||PAL.card,print:o.pf});
  const bk=mkF([o.w/2,yr,0],[-1,0,0],[0,-s,c],rect(o.w,o.h),{grp,col:o.col2||o.col||PAL.card,print:o.pb||pPlain(PAL.card),hinge:true});
  return[fr,bk,attach(fr,[o.w,o.h],[0,o.h],al,rect(o.w,1.1),{grp,col:PAL.tab,print:tabPrint,fl:false}),attach(bk,[o.w,o.h],[0,o.h],al,rect(o.w,1.1),{grp,col:PAL.tab,print:tabPrint,fl:false})];
};
const prism=(sec,len,fr,col,print,capCol)=>{
  const grp=GID++,out=[],n=sec.length,cx=sec.reduce((s,p)=>s+p[0],0)/n,cy=sec.reduce((s,p)=>s+p[1],0)/n;
  const at=(p,l)=>add(fr.o,add(mul(fr.ax,l),add(mul(fr.u,p[0]),mul(fr.v,p[1]))));
  for(let i=0;i<n;i++){const a=sec[i],b=sec[(i+1)%n],mid=[(a[0]+b[0])/2-cx,(a[1]+b[1])/2-cy];out.push(fromPts([at(a,0),at(a,len),at(b,len),at(b,0)],add(mul(fr.u,mid[0]),mul(fr.v,mid[1])),{grp,col,print,closed:true}));}
  out.push(fromPts(sec.map(p=>at(p,len)),fr.ax,{grp,col:capCol||col,closed:true}));
  out.push(fromPts(sec.map(p=>at(p,0)).reverse(),mul(fr.ax,-1),{grp,col:capCol||col,closed:true}));
  return out;
};
const ngon=(r,n,rot=0)=>Array.from({length:n},(_,i)=>[Math.cos(rot+(i/n)*PI*2)*r,Math.sin(rot+(i/n)*PI*2)*r]);
// Tira de papel plegada en acordeón con punta: las flechas se desenrollan sobre la plancha
const resample=(pts,step=0.5)=>{const out=[pts[0]];for(let i=0;i<pts.length-1;i++){const [ax,az]=pts[i],[bx,bz]=pts[i+1],n=Math.max(1,Math.ceil(Math.hypot(bx-ax,bz-az)/step));for(let j=1;j<=n;j++)out.push([ax+((bx-ax)*j)/n,az+((bz-az)*j)/n]);}return out;};
const pathAt=(P,L)=>{let acc=0;for(let i=0;i<P.length-1;i++){const dx=P[i+1][0]-P[i][0],dz=P[i+1][1]-P[i][1],l=Math.hypot(dx,dz);if(acc+l>=L||i===P.length-2){const u=clamp((L-acc)/(l||1));return[P[i][0]+dx*u,P[i][1]+dz*u,dx/(l||1),dz/(l||1)];}acc+=l;}return[P[0][0],P[0][1],1,0];};
const pathLen=P=>{let L=0;for(let i=0;i<P.length-1;i++)L+=Math.hypot(P[i+1][0]-P[i][0],P[i+1][1]-P[i][1]);return L;};
const strip=(path,prog,o)=>{
  if(prog<=0)return[];
  const P=resample(path),L=pathLen(P),vis=L*clamp(prog),wd=o.w||2.2,hl=Math.min(vis,o.head||3.4),grp=GID++,out=[],seg=o.seg||3.0,body=Math.max(0,vis-hl);
  const pt=(l,side,y)=>{const [x,z,tx,tz]=pathAt(P,l);return[x-tz*side,y,z+tx*side];},yAt=i=>(i%2?0.55:0.07);
  let l0=0,i=0;
  while(l0<body-0.01){const l1=Math.min(body,l0+seg),y0=yAt(i),y1=l1>=body?0.07:yAt(i+1);out.push(fromPts([pt(l0,-wd/2,y0),pt(l1,-wd/2,y1),pt(l1,wd/2,y1),pt(l0,wd/2,y0)],[0,1,0],{grp,col:o.col,print:o.print,fl:false}));l0=l1;i++;}
  if(hl>0.3&&o.head!==0){const hw=wd*(o.hw||1.15);out.push(fromPts([pt(body,-hw,0.07),pt(vis,0,0.07),pt(body,hw,0.07)],[0,1,0],{grp,col:o.col,fl:false}));}
  return out;
};
// Roseta de estrella de papel (diez facetas alrededor de un centro elevado)
const star=(R,r,dep,cA,cB)=>{const grp=GID++,out=[],pts=[];for(let k=0;k<10;k++){const a=-HP+(k*PI)/5,rr=k%2?r:R;pts.push([Math.cos(a)*rr,-Math.sin(a)*rr,0]);}const cen=[0,0,-dep];for(let k=0;k<10;k++)out.push(fromPts([cen,pts[k],pts[(k+1)%10]],[0,0,-1],{grp,col:k%2?cA:cB,fl:false}));return out;};

// ---------- impresión (en décimas de mm sobre la cara) ----------
const rr=(c,x,y,w,h,r)=>{c.beginPath();c.roundRect(x,y,w,h,r);};
const txt=(c,s,x,y,size,col,align='center',font=FR,wt=700)=>{c.font=`${wt} ${size}px ${font}`;c.textAlign=align;c.textBaseline='middle';c.fillStyle=col;c.fillText(s,x,y);};
const fitTxt=(c,s,x,y,size,maxW,col,font=FR,wt=700)=>{c.font=`${wt} ${size}px ${font}`;const m=c.measureText(s).width;if(m>maxW)size*=maxW/m;txt(c,s,x,y,size,col,'center',font,wt);};
// Texto largo: se parte en dos líneas y se ajusta al ancho.
const lines=(c,s,x,y,size,maxW,col,font=FR,wt=700,max=2)=>{const f=`${wt} SIZEpx ${font}`,L=wrapLines(c,s,maxW,size,f,max),fs=fitFont(c,L,maxW,size,f,12);L.forEach((l,i)=>txt(c,l,x,y+(i-(L.length-1)/2)*fs*1.08,fs,col,'center',font,wt));return fs;};
const dots=(c,x0,y0,x1,y1,col='rgba(40,40,40,0.4)',lw=0.8,dash=[3,3])=>{c.save();c.setLineDash(dash);c.strokeStyle=col;c.lineWidth=lw;c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();c.restore();};
const partNo=(c,s,x,y,col='rgba(40,40,40,0.55)')=>txt(c,s,x,y,5.5,col,'left',MONO,700);
const tickMark=(c,x,y,s,col)=>{c.strokeStyle=col;c.lineWidth=s*0.22;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(x-s*0.5,y);c.lineTo(x-s*0.12,y+s*0.4);c.lineTo(x+s*0.55,y-s*0.45);c.stroke();};
const pPlain=col=>(c,w,h)=>{c.fillStyle=col;c.fillRect(0,0,w,h);};
// Etiqueta: banda de color con perforaciones y texto grande.
const pTag=(s,col,size,sub,max=1)=>(c,w,h)=>{
  c.fillStyle=PAL.card;c.fillRect(0,0,w,h);c.fillStyle=col;c.fillRect(0,0,w,h*0.17);
  c.fillStyle='rgba(255,255,255,0.7)';for(let x=6;x<w-3;x+=7){c.beginPath();c.arc(x,h*0.085,0.9,0,7);c.fill();}
  if(sub){fitTxt(c,s,w/2,h*0.47,size,w*0.9,col);fitTxt(c,sub,w/2,h*0.8,size*0.5,w*0.9,PAL.ink,FR,600);}
  else lines(c,s,w/2,h*0.6,size,w*0.9,col,FR,700,max);
  partNo(c,'T'+(s.length%7+1),3,h-5);
};
// Tarjeta de texto principal (encabezado de banda + una o dos líneas grandes).
const pCard=(band,bandCol,s,size,col,sub,subCol,max=2)=>(c,w,h)=>{
  c.fillStyle=PAL.card;c.fillRect(0,0,w,h);c.fillStyle=bandCol;c.fillRect(0,0,w,h*0.17);
  fitTxt(c,band,w/2,h*0.085,h*0.12,w*0.9,'#fff',MONO,700);
  if(sub){lines(c,s,w/2,h*0.4,size,w*0.9,col,FR,700,max);lines(c,sub,w/2,h*0.78,size*0.55,w*0.9,subCol||PAL.blue,FR,600,2);}
  else lines(c,s,w/2,h*0.58,size,w*0.9,col);
  c.fillStyle=bandCol;c.fillRect(w*0.3,h-6,w*0.4,3);
  partNo(c,'A'+(s.length%9+1),3,h-5);
};
// Ilustración pegada en una tarjeta con marco y número de pieza.
const pPicture=(img,label)=>(c,w,h)=>{
  c.fillStyle=PAL.card;c.fillRect(0,0,w,h);c.fillStyle='#bcd9ee';rr(c,7,7,w-14,h-14,4);c.fill();
  if(img){const iw=img.naturalWidth||img.width||1,ih=img.naturalHeight||img.height||1,s=Math.min((w-24)/iw,(h-24)/ih);c.drawImage(img,w/2-iw*s/2,h/2-ih*s/2,iw*s,ih*s);}
  c.strokeStyle='rgba(40,50,70,0.35)';c.lineWidth=1;rr(c,7,7,w-14,h-14,4);c.stroke();
  partNo(c,label||'P1',9,h-3.5);
};
// Frente del altavoz de cartulina: cono impreso que late y rejilla de puntos.
const pSpeaker=pulse=>(c,w,h)=>{
  c.fillStyle=PAL.card;c.fillRect(0,0,w,h);c.fillStyle=PAL.blue;rr(c,6,6,w-12,h-12,6);c.fill();
  const x=w/2,y=h*0.56,R=Math.min(w,h)*0.3;
  c.fillStyle='#151820';c.beginPath();c.arc(x,y,R,0,7);c.fill();
  c.fillStyle=PAL.cream;c.beginPath();c.arc(x,y,R*(0.78+0.06*pulse),0,7);c.fill();
  c.strokeStyle='rgba(60,40,20,0.35)';c.lineWidth=1.2;for(let k=1;k<4;k++){c.beginPath();c.arc(x,y,R*(0.2+k*0.17)*(1+0.05*pulse),0,7);c.stroke();}
  c.fillStyle=PAL.orange;c.beginPath();c.arc(x,y,R*0.2,0,7);c.fill();
  c.fillStyle='rgba(255,255,255,0.6)';for(let i=0;i<9;i++){c.beginPath();c.arc(16+i*((w-32)/8),16,1.6,0,7);c.fill();}
  partNo(c,'S1',8,h-9,'rgba(255,255,255,0.7)');
};
const pFlagV=(c,w,h)=>{c.fillStyle=PAL.green;c.fillRect(0,0,w,h);tickMark(c,w/2,h/2+2,h*0.62,'#fff');};
const pCount=(left,label)=>(c,w,h)=>{
  c.fillStyle=PAL.card;c.fillRect(0,0,w,h);c.fillStyle=PAL.yellow;c.fillRect(0,0,w,h*0.17);
  txt(c,'TIEMPO',w/2,h*0.085,h*0.12,PAL.ink,'center',MONO,700);
  txt(c,String(left),w/2,h*0.5,h*0.56,PAL.ink,'center',FR,700);
  fitTxt(c,label,w/2,h*0.84,h*0.17,w*0.9,PAL.red,FR,700);
};
const pBase=(c,w,h)=>{c.fillStyle=PAL.card;c.fillRect(0,0,w,h);c.strokeStyle=PAL.ink;c.lineWidth=1.2;c.beginPath();c.moveTo(5,h-8);c.lineTo(w-5,h-8);c.stroke();};
const pStripPrint=col=>(c,w,h)=>{c.fillStyle=col;c.fillRect(0,0,w,h);c.strokeStyle='rgba(255,255,255,0.45)';c.lineWidth=1;c.setLineDash([3,3]);c.beginPath();c.moveTo(0,h/2);c.lineTo(w,h/2);c.stroke();c.setLineDash([]);};

const flag=o=>{ // mástil en un cubo, bandera impresa
  const out=[...box({w:3,d:3,h:2.4,col:o.baseCol||PAL.yellow})];
  out.push(...box({w:0.45,d:0.45,h:o.pole,col:PAL.wood}).map(f=>Object.assign(f,{O:add(f.O,[0,2.3,0])})));
  out.push(mkF([0.25,2.3+o.pole-0.2,0],[1,0,0],[0,-1,0],rect(o.fw,o.fh),{grp:GID++,col:o.col,print:o.pf,bcol:o.col,fl:false}));
  return out;
};
// herramientas en la plancha
const ruler=len=>{
  const pr=(c,w,h)=>{
    const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#dfe3e6');g.addColorStop(0.5,'#b8bec4');g.addColorStop(1,'#d4d8db');c.fillStyle=g;c.fillRect(0,0,w,h);
    c.strokeStyle='rgba(25,25,30,0.85)';c.lineWidth=0.5;
    for(let x=10,i=0;x<w-8;x+=1,i++){const L=i%10===0?9:i%5===0?6:3.5;c.beginPath();c.moveTo(x,h);c.lineTo(x,h-L);c.stroke();if(i%10===0&&i)txt(c,String(i/10),x,h-14,5.5,'rgba(25,25,30,0.85)','center',GROT,700);}
  };
  return box({w:len,d:3.6,h:0.22,col:{top:'#c9ced3',side:'#5a4a3a'},pr:{top:pr},tabs:false});
};
const knife=()=>{
  const out=[],fr={o:[0,0.62,0],ax:[1,0,0],u:[0,1,0],v:[0,0,1]};
  const knurl=(c,w,h)=>{c.fillStyle='#9aa1a8';c.fillRect(0,0,w,h);c.strokeStyle='rgba(40,45,50,0.55)';c.lineWidth=0.5;for(let x=0;x<w;x+=1.4){c.beginPath();c.moveTo(x,0);c.lineTo(x+h,h);c.stroke();}c.fillStyle=PAL.blue;c.fillRect(w*0.1,0,w*0.45,h);};
  out.push(...prism(ngon(0.62,8,0.39),11,fr,'#a9b0b6',knurl,'#8d949a'));
  out.push(...prism(ngon(0.7,8,0.39),1.6,{...fr,o:[11,0.62,0]},'#c7ccd1',null,'#9aa1a8'));
  out.push(fromPts([[12.6,0.75,-0.05],[15.6,0.7,0],[12.6,0.45,0.05]],[0,0.2,-1],{grp:GID++,col:'#e3e7ea',fl:false}));
  return out;
};
const glueStick=()=>{
  const band=(c,w,h)=>{c.fillStyle='#f2efe8';c.fillRect(0,0,w,h);c.fillStyle='#7b4fb0';c.fillRect(w*0.18,0,w*0.1,h);c.fillStyle=PAL.yellow;c.fillRect(w*0.32,0,w*0.3,h);c.fillStyle='#7b4fb0';c.fillRect(w*0.66,0,w*0.05,h);};
  const out=prism(ngon(1.5,12),8.5,{o:[0,0,0],ax:[0,1,0],u:[1,0,0],v:[0,0,-1]},'#f2efe8',band,'#f2efe8');
  out.push(...prism(ngon(1.62,12),3.2,{o:[0,8.5,0],ax:[0,1,0],u:[1,0,0],v:[0,0,-1]},'#7b4fb0',null,'#8e62c4'));
  return out;
};

// ---------- la plancha de corte (textura cenital cacheada, dibujada fila a fila en perspectiva) ----------
const MX0=-58,MX1=232,MZ0=-34,MZ1=66,TX0=-170,TZ0=-70,TS=5,TW=500,TD=300;
let MATC=null,FIB=null,SL=null,CL=null,DL=null,FIBP=null;
const matTex=()=>{
  if(MATC)return MATC;
  const c=H.layer(TW*TS,TD*TS),g=c.getContext('2d'),X=x=>(x-TX0)*TS,Z=z=>(z-TZ0)*TS,nz=H.makeNoise(31),r=H.rng(77);
  for(let y=0;y<TD*TS;y+=2){const z=y/TS,v=nz.n2(z*0.35,3.1)*0.5+nz.n2(z*1.7,9.2)*0.25+Math.sin(z*0.9+nz.n2(z*0.05,1)*4)*0.12,k=1+v*0.22,plank=Math.floor((z+4)/19);g.fillStyle=`rgb(${(168+plank%2*8)*k|0},${(117+plank%2*5)*k|0},${76*k|0})`;g.fillRect(0,y,c.width,2);}
  for(let i=0;i<260;i++){const y=r.range(0,c.height),x=r.range(0,c.width);g.strokeStyle=`rgba(${r.chance(0.5)?'70,40,20':'230,190,140'},${r.range(0.05,0.14)})`;g.lineWidth=r.range(0.6,2);g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x+200,y+r.range(-4,4),x+400,y+r.range(-4,4),x+r.range(500,900),y+r.range(-6,6));g.stroke();}
  for(let z=-4;z<TD;z+=19){g.fillStyle='rgba(40,22,10,0.45)';g.fillRect(0,Z(z),c.width,2);}
  g.save();g.filter='blur(10px)';g.fillStyle='rgba(20,10,0,0.55)';g.beginPath();g.roundRect(X(MX0)+6,Z(MZ0)+8,(MX1-MX0)*TS,(MZ1-MZ0)*TS,12);g.fill();g.restore();
  g.fillStyle='#23573f';g.beginPath();g.roundRect(X(MX0),Z(MZ0),(MX1-MX0)*TS,(MZ1-MZ0)*TS+3,12);g.fill();
  g.fillStyle='#2d6c4e';g.beginPath();g.roundRect(X(MX0),Z(MZ0),(MX1-MX0)*TS,(MZ1-MZ0)*TS,12);g.fill();
  g.save();g.beginPath();g.roundRect(X(MX0),Z(MZ0),(MX1-MX0)*TS,(MZ1-MZ0)*TS,12);g.clip();
  for(let i=0;i<520;i++){const x=r.range(X(MX0),X(MX1)),y=r.range(Z(MZ0),Z(MZ1)),rad=r.range(20,120),lt=r.chance(0.5),gr=g.createRadialGradient(x,y,0,x,y,rad);gr.addColorStop(0,lt?`rgba(120,190,150,${r.range(0.03,0.07)})`:`rgba(10,40,25,${r.range(0.04,0.09)})`);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-rad,y-rad,rad*2,rad*2);}
  for(let i=0;i<9000;i++){g.fillStyle=r.chance(0.5)?'rgba(150,210,170,0.18)':'rgba(5,25,15,0.2)';g.fillRect(r.range(X(MX0),X(MX1)),r.range(Z(MZ0),Z(MZ1)),1,1);}
  for(let i=0;i<420;i++){const x=r.range(X(MX0),X(MX1)),y=r.range(Z(MZ0),Z(MZ1)),L=r.range(30,380),a=r.chance(0.6)?r.pick([0,HP,PI/4,-PI/4])+r.range(-0.03,0.03):r.range(0,PI);g.strokeStyle=`rgba(${r.chance(0.7)?'170,220,180':'15,45,30'},${r.range(0.08,0.2)})`;g.lineWidth=r.range(0.5,1.2);g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*L,y+Math.sin(a)*L);g.stroke();}
  // recortes de papel y migas que dejó el cúter
  const cols=[PAL.orange,PAL.yellow,PAL.blue,'#e9e2d0',PAL.red,'#ea8a39'];
  for(let i=0;i<46;i++){const x=r.range(MX0+4,MX1-4),z=r.range(MZ0+10,MZ1-4),s=r.range(0.35,1.0),a=r.range(0,PI*2);g.save();g.translate(X(x),Z(z));g.rotate(a);const pts=r.chance(0.5)?[[0,0],[s*3,0],[s*1.2,s*1.4]]:[[0,0],[s*4.5,0.2],[s*4.4,s*0.6],[0.1,s*0.5]];g.fillStyle='rgba(0,20,10,0.35)';g.beginPath();pts.forEach(([px,py],j)=>(j?g.lineTo(px*TS+2,py*TS+2):g.moveTo(px*TS+2,py*TS+2)));g.fill();g.fillStyle=r.pick(cols);g.beginPath();pts.forEach(([px,py],j)=>(j?g.lineTo(px*TS,py*TS):g.moveTo(px*TS,py*TS)));g.fill();g.restore();}
  g.fillStyle='rgba(214,232,180,0.75)';g.font=`700 ${1.7*TS}px "Space Grotesk"`;g.textAlign='center';g.textBaseline='middle';
  for(let x=MX0+5,i=1;x<MX1-2;x+=5,i++)g.fillText(String(i*5-5),X(x),Z(MZ1-1.6));
  for(let z=MZ0+5,i=1;z<MZ1-2;z+=5,i++)g.fillText(String(i),X(MX0+1.6),Z(z));
  g.restore();
  let ready=true;try{ready=document.fonts.check('700 20px "Space Grotesk"');}catch{}
  if(ready)MATC=c;
  return c;
};
const fibre=()=>{
  if(FIB)return FIB;
  const c=H.layer(256,256),g=c.getContext('2d'),r=H.rng(5);g.fillStyle='#fff';g.fillRect(0,0,256,256);
  for(let i=0;i<2200;i++){const x=r.range(0,256),y=r.range(0,256),a=r.range(0,PI),L=r.range(2,9);g.strokeStyle=`rgba(${r.chance(0.3)?'150,120,90':'120,115,105'},${r.range(0.05,0.16)})`;g.lineWidth=r.range(0.3,0.8);g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+Math.cos(a)*L*0.5+r.range(-1,1),y+Math.sin(a)*L*0.5+r.range(-1,1),x+Math.cos(a)*L,y+Math.sin(a)*L);g.stroke();}
  for(let i=0;i<2500;i++){g.fillStyle=`rgba(110,100,90,${r.range(0.04,0.12)})`;g.fillRect(r.range(0,256),r.range(0,256),0.8,0.8);}
  FIB=c;return c;
};
const drawMat=(ctx,cam,W,Hh)=>{
  const tex=matTex(),step=2;
  ctx.fillStyle='#2a1a0e';ctx.fillRect(0,0,W,Hh);
  for(let sy=0;sy<Hh;sy+=step){const a=cam.ground(sy),b=cam.ground(sy+step),m=cam.ground(sy+step/2);if(!a||!b||!m)continue;const half=((W/2)*m.s)/cam.F,x0=cam.C[0]-half;ctx.drawImage(tex,(x0-TX0)*TS,(b.z-TZ0)*TS,2*half*TS,Math.max(0.6,(a.z-b.z)*TS),0,sy,W,step+0.6);}
  // rejilla impresa nítida (1 cm, más gruesa cada 5 cm, guías a 45 grados)
  const gN=cam.ground(Hh),gF=cam.ground(0)||cam.ground(Hh*0.05);
  const zN=Math.max(MZ0+0.6,gN.z),zF=Math.min(MZ1-0.6,gF.z),xh=((W/2)*gF.s)/cam.F,xa=Math.max(MX0+0.6,cam.C[0]-xh),xb=Math.min(MX1-0.6,cam.C[0]+xh);
  const seg=(ax,az,bx,bz)=>{const p=cam.proj([ax,0,az]),q=cam.proj([bx,0,bz]);ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);};
  ctx.save();ctx.lineCap='butt';
  for(const major of[false,true]){ctx.beginPath();for(let x=Math.ceil(xa);x<=xb;x++)if((Math.abs(x)%5===0)===major)seg(x,zN,x,zF);for(let z=Math.ceil(zN);z<=zF;z++)if((Math.abs(z)%5===0)===major)seg(xa,z,xb,z);ctx.strokeStyle=major?'rgba(222,238,184,0.42)':'rgba(205,230,170,0.2)';ctx.lineWidth=major?1.35:0.9;ctx.stroke();}
  ctx.beginPath();
  for(let k=-300;k<400;k+=50){const z0=MZ0+0.6,z1=MZ1-0.6,A=[clamp(k+z0,MX0,MX1),0],B=[clamp(k+z1,MX0,MX1),0];A[1]=A[0]-k;B[1]=B[0]-k;const za=clamp(A[1],zN,zF),zb=clamp(B[1],zN,zF);if(zb-za>0.5)seg(za+k,za,zb+k,zb);}
  ctx.strokeStyle='rgba(222,238,184,0.22)';ctx.lineWidth=0.9;ctx.stroke();ctx.restore();
  // profundidad de campo: el fondo de la plancha (y la mesa) suavemente desenfocado
  if(!DL)DL=H.layer(W/2,Hh/2);
  const d=DL.getContext('2d');d.setTransform(1,0,0,1,0,0);d.globalCompositeOperation='source-over';d.clearRect(0,0,W/2,Hh/2);
  d.filter='blur(2.2px)';d.drawImage(ctx.canvas,0,0,W/2,Hh/2);d.filter='none';
  const gm=d.createLinearGradient(0,0,0,Hh/2);gm.addColorStop(0,'rgba(0,0,0,1)');gm.addColorStop(0.36,'rgba(0,0,0,0.6)');gm.addColorStop(0.55,'rgba(0,0,0,0)');gm.addColorStop(0.85,'rgba(0,0,0,0)');gm.addColorStop(1,'rgba(0,0,0,0.65)');
  d.globalCompositeOperation='destination-in';d.fillStyle=gm;d.fillRect(0,0,W/2,Hh/2);
  ctx.drawImage(DL,0,0,W,Hh);
};
const hull=pts=>{
  const P=pts.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);if(P.length<3)return P;
  const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],up=[];
  for(const p of P){while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);}
  for(let i=P.length-1;i>=0;i--){const p=P[i];while(up.length>=2&&cr(up[up.length-2],up[up.length-1],p)<=0)up.pop();up.push(p);}
  return lo.slice(0,-1).concat(up.slice(0,-1));
};
const drawFace=(ctx,cam,it)=>{
  const {f,sp,front}=it,n=front?f.n:mul(f.n,-1),lam=Math.max(0,dot(n,LIGHT));
  const path=()=>{ctx.beginPath();sp.forEach((p,i)=>(i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])));ctx.closePath();};
  path();ctx.fillStyle=front?f.col:f.bcol||PAL.back;ctx.fill();
  ctx.save();ctx.clip();
  // marco afín de la impresión (mm) ajustado en el centro de la cara
  const cl=[f.pw/2,f.ph/2],p0=cam.proj(P3(f,cl)),pu=cam.proj(P3(f,[cl[0]+1,cl[1]])),pv=cam.proj(P3(f,[cl[0],cl[1]+1]));
  const a=[pu[0]-p0[0],pu[1]-p0[1]],b=[pv[0]-p0[0],pv[1]-p0[1]];
  ctx.transform(a[0],a[1],b[0],b[1],p0[0]-a[0]*cl[0]-b[0]*cl[1],p0[1]-a[1]*cl[0]-b[1]*cl[1]);ctx.scale(0.1,0.1);
  const W10=f.pw*10,H10=f.ph*10;
  if(!front){ctx.translate(W10,0);ctx.scale(-1,1);}
  const pr=front?f.print:f.bprint;
  if(pr)pr(ctx,W10,H10,f);
  if(front&&f.hinge&&f.fl!==false)dots(ctx,0,1.2,W10,1.2,'rgba(60,45,30,0.42)',0.9,[4,3.5]);
  // fibra de papel (se mueve con la cara)
  const pt=ctx.createPattern(fibre(),'repeat');pt.setTransform(new DOMMatrix([0.45,0,0,0.45,(f.grp*37)%100,(f.grp*53)%100]));FIBP=pt;
  ctx.globalCompositeOperation='multiply';ctx.globalAlpha=0.9;ctx.fillStyle=FIBP;ctx.fillRect(0,0,W10,H10);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  ctx.restore();
  // sombreado Lambert por cara con luz cálida y relleno frío
  const s=0.6+0.08*n[1]+0.52*lam;path();
  if(s<1){ctx.globalCompositeOperation='multiply';ctx.fillStyle=`rgb(${255*Math.min(1,s*(1.0+0.05*lam))|0},${255*Math.min(1,s*0.985)|0},${255*Math.min(1,s*(0.94+0.1*(1-lam)))|0})`;ctx.fill();}
  else{ctx.globalCompositeOperation='screen';ctx.fillStyle=`rgba(255,232,195,${(s-1)*0.7})`;ctx.fill();}
  // oclusión ambiental donde las paredes tocan la plancha
  if(it.minY<0.4&&Math.abs(n[1])<0.6){const g0=it.lowPt,q0=cam.proj([g0[0],0,g0[2]]),q1=cam.proj([g0[0],2.5,g0[2]]),gr=ctx.createLinearGradient(q0[0],q0[1],q1[0],q1[1]);gr.addColorStop(0,'rgba(90,100,90,1)');gr.addColorStop(1,'rgba(255,255,255,1)');ctx.globalCompositeOperation='multiply';ctx.fillStyle=gr;ctx.globalAlpha=0.45;ctx.fill();ctx.globalAlpha=1;}
  ctx.globalCompositeOperation='source-over';
  // cantos de corte claros (el alma blanca de la cartulina)
  ctx.strokeStyle=`rgba(255,247,230,${0.22+0.4*lam})`;ctx.lineWidth=1.05;ctx.lineJoin='round';ctx.stroke();
};
// el cuadro completo: plancha -> piezas planas -> sombras -> piezas de pie (orden del pintor) -> luz
const renderScene=(ctx,W,Hh,cam,faces,tt)=>{
  FIBP=null;drawMat(ctx,cam,W,Hh);
  const items=[],groups=new Map();
  for(const f of faces){
    const wp=f.poly.map(p=>P3(f,p)),sp=wp.map(cam.proj);
    let ok=true,zs=0,minx=1e9,maxx=-1e9,miny=1e9,maxy=-1e9,maxY=-1e9,minY=1e9;
    for(let i=0;i<sp.length;i++){const p=sp[i];if(p[2]<3)ok=false;zs+=p[2];minx=Math.min(minx,p[0]);maxx=Math.max(maxx,p[0]);miny=Math.min(miny,p[1]);maxy=Math.max(maxy,p[1]);maxY=Math.max(maxY,wp[i][1]);minY=Math.min(minY,wp[i][1]);}
    if(!ok)continue;
    if(!groups.has(f.grp))groups.set(f.grp,[]);groups.get(f.grp).push(...wp);
    if(maxx<-40||minx>W+40||maxy<-40||miny>Hh+40)continue;
    const cen=wp.reduce((s,p)=>add(s,p),[0,0,0]).map(v=>v/wp.length),front=dot(f.n,sub(cam.C,cen))>0;
    if(!front&&f.closed)continue;
    items.push({f,sp,front,depth:zs/sp.length+(f.bias||0),ground:maxY<0.8,minY,lowPt:[cen[0],0,cen[2]]});
  }
  const ground=items.filter(i=>i.ground).sort((a,b)=>b.depth-a.depth);
  const stand=items.filter(i=>!i.ground).sort((a,b)=>(a.front!==b.front?(a.front?1:-1):b.depth-a.depth));
  ground.forEach(it=>drawFace(ctx,cam,it));
  // sombras: vértices de cada grupo proyectados según la luz sobre la plancha (suave) + sombra de contacto
  if(!SL){SL=H.layer(W/2,Hh/2);CL=H.layer(W/2,Hh/2);}
  const sg=SL.getContext('2d'),cg=CL.getContext('2d');
  [sg,cg].forEach(g=>{g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,W/2,Hh/2);g.setTransform(0.5,0,0,0.5,0,0);g.fillStyle='#06140c';});
  for(const[,pts]of groups){
    let top=-1e9;for(const p of pts)top=Math.max(top,p[1]);if(top<0.8)continue;
    const sh=hull(pts.map(p=>{const q=cam.proj([p[0]-(LIGHT[0]/LIGHT[1])*p[1],0,p[2]-(LIGHT[2]/LIGHT[1])*p[1]]);return[q[0],q[1]];}));
    sg.beginPath();sh.forEach((p,i)=>(i?sg.lineTo(p[0],p[1]):sg.moveTo(p[0],p[1])));sg.fill();
    const lowp=pts.filter(p=>p[1]<0.7);
    if(lowp.length>2){const ch=hull(lowp.map(p=>{const q=cam.proj([p[0]+0.25,0,p[2]+0.35]);return[q[0],q[1]];}));cg.beginPath();ch.forEach((p,i)=>(i?cg.lineTo(p[0],p[1]):cg.moveTo(p[0],p[1])));cg.fill();}
  }
  ctx.save();ctx.filter='blur(7px)';ctx.globalAlpha=0.42;ctx.drawImage(SL,0,0,W,Hh);ctx.filter='blur(2px)';ctx.globalAlpha=0.5;ctx.drawImage(CL,0,0,W,Hh);ctx.restore();
  stand.forEach(it=>drawFace(ctx,cam,it));
  // charco de luz cálida y caída de la lente
  ctx.save();const lp=ctx.createRadialGradient(W*0.38,Hh*0.35,40,W*0.45,Hh*0.45,W*0.75);
  lp.addColorStop(0,'rgba(255,214,150,0.16)');lp.addColorStop(0.6,'rgba(255,200,140,0.04)');lp.addColorStop(1,'rgba(0,0,0,0)');
  ctx.globalCompositeOperation='soft-light';ctx.fillStyle=lp;ctx.fillRect(0,0,W,Hh);ctx.globalCompositeOperation='source-over';
  H.vignette(ctx,W,Hh,0.42,'20,12,4');ctx.restore();
  H.grain(ctx,W,Hh,0.03,3+Math.floor(tt*12)%7);
};

// jitter de stop-motion: el animador toca la maqueta un pelo cada vez (en dos)
const jit=(id,tq,amp=0.05)=>{const r=H.rng(id*977+Math.floor(tq*12+1e-6)*13);return[r.range(-amp,amp),r.range(-amp,amp),r.range(-amp,amp)*0.12];};
const place=(faces,id,tq,x,y,z,yaw=0,s=1,amp=0.04)=>{const j=jit(id,tq,amp);return xf(faces,[x+j[0],y,z+j[1]],yaw+j[2],s);};
const drop=(q,t0,h=12,dur=0.25)=>{const u=win(q,t0,t0+dur);return q<t0?null:h*(1-u*u);};

// ================= el repaso sobre la plancha =================
// Cada beat ocupa una «estación» de la plancha; la cámara se desliza entre ellas.
const STATION=i=>(i%2)*124;
const CAM={D:64,pitch:0.75,ty:4,tz:10};
// Rehace la escena de un beat en el instante q (ya cuantizado). fold<1 pliega las tarjetas al irse.
function beatFaces(beat,q,S,X,fold=1){
  const F=[],L=q-beat.t0,id=beat.index*50,A=(a,b)=>win(L,a,b)*fold;
  const dress=()=>{F.push(...xf(ruler(34),[X-47,0,-8],-1.25));F.push(...xf(glueStick(),[X+46,0,40],0.3));F.push(...xf(knife(),[X+40,0,-12],-0.6));};
  dress();
  if(beat.kind==='title'){
    const sc=S.assets.scene;
    F.push(...place(tent({w:sc?48:60,h:16,a:A(0.2,0.85),pf:pCard((beat.kit||'KIT DE REPASO')+' · CORTA · DOBLA · PEGA',PAL.blue,(beat.heading||`REPASO · CLASE ${beat.classNumber}`),66,PAL.ink,beat.unitTitle||'',PAL.blue,1)}),id+1,q,sc?X-12:X,0,12,0));
    if(sc)F.push(...place(tent({w:22,h:16,a:A(0.7,1.2),pf:pPicture(sc,'ESCENA')}),id+2,q,X+27,0,12,-0.12));
    const y=drop(q,beat.t0+1.6,12);
    if(y!=null)F.push(...place(tent({w:40,h:7,a:fold,pf:pTag((beat.tagline||'¿Cuánto recuerdas?'),PAL.orange,60)}),id+3,q,X-4,y,-4,0.02));
    return F;
  }
  if(beat.kind==='end'){
    F.push(...place(tent({w:50,h:16,a:A(0.2,0.8),pf:pCard('¡LISTO!  ·  MAQUETA TERMINADA',PAL.green,'¡Muy bien!',84,PAL.green,(beat.tally||`${beat.total} frases repasadas`),PAL.ink,1)}),id+1,q,X-6,0,12,0));
    const y=drop(q,beat.t0+1.3,12);
    if(y!=null)F.push(...place(tent({w:58,h:7,a:fold,pf:pTag((beat.closing||'Mañana vuelven: ¡no las sueltes!'),PAL.orange,56)}),id+2,q,X-4,y,-4,0));
    if(L>=0.9){const s=eback(win(L,0.9,1.2));F.push(...xf(star(5.5,2.4,2,PAL.yellow,'#f7c95a'),[X+26,17,14],0,Math.max(0.05,s)));}
    if(L>=1.0){const s=eback(win(L,1.0,1.3));F.push(...place(flag({pole:11,fw:7,fh:5.5,col:PAL.green,pf:pFlagV}),id+3,q,X+24,0,3,-0.15,Math.max(0.05,s),0.05));}
    return F;
  }
  const {ask,think,reveal}=beatTimes(beat),item=beat.item,img=S.assets.picture(item.picture),listen=beat.kind==='listen';
  const cx=img?X-11:X,mw=img?40:54,hc=listen?PAL.blue:PAL.red;
  // cabecera y contador «n / total»
  F.push(...place(tent({w:listen?26:38,h:9,a:A(0.15,0.55),pf:pTag(listen?'ESCUCHA':'¿CÓMO SE DICE?',hc,62)}),id+1,q,X-(listen?30:24),0,40,0.04));
  F.push(...place(tent({w:17,h:9,a:A(0.3,0.7),pf:pTag(`${beat.number} / ${beat.total}`,PAL.ink,62)}),id+2,q,X+32,0,40,-0.06));
  if(img)F.push(...place(tent({w:21,h:16,a:A(0.6,1.1),pf:pPicture(img,'P'+beat.number)}),id+3,q,X+26,0,12,-0.14));
  const tA=think[0],tR=reveal[0];
  if(q<tA+0.25){
    const down=1-eio(win(q,tA,tA+0.25));
    if(listen){
      // altavoz de cartulina que se pliega desde su plantilla; ondas = tiras que se desenrollan
      const f=eio(win(L,0.35,1.2))*down,pulse=0.5+0.5*Math.sin(q*14);
      F.push(...place(box({w:20,d:11,h:17,f,col:PAL.card,pr:{front:pSpeaker(pulse*(q<ask[1]?1:0)),top:pBase}}),id+4,q,cx,0,12,0));
      if(f>0.95)for(let i=0;i<3;i++){
        const ph=((q-beat.t0-1.2)*0.9+1-i*0.22)%1,r=12+i*5,arc=[];
        for(let k=0;k<=12;k++){const a=-HP-0.9+1.8*k/12;arc.push([cx+Math.cos(a)*r,12-5.5+Math.sin(a)*r*0.8]);}
        if(ph>0)F.push(...strip(arc,eio(clamp(ph*2.2)),{col:[PAL.yellow,PAL.orange,PAL.blue][i],print:pStripPrint([PAL.yellow,PAL.orange,PAL.blue][i]),w:1.6,head:0}));
      }
    }else F.push(...place(tent({w:mw,h:16,a:A(0.45,1.0)*down,pf:pCard('SIGNIFICADO · EN ESPAÑOL',PAL.blue,item.es,74,PAL.ink)}),id+4,q,cx,0,12,0));
  }else if(q<tR+0.2){
    // cuenta atrás: tarjeta impresa que se vuelve a posar cada segundo
    const dur=think[1]-think[0],rem=dur*(1-clamp((q-tA)/dur)),left=Math.max(1,Math.ceil(rem-1e-6)),since=1-(rem-Math.floor(rem));
    const dip=q<tR?1-0.22*Math.sin(PI*clamp(since/0.17)):1-eio(win(q,tR,tR+0.2));
    F.push(...place(tent({w:mw-6,h:16,a:eio(win(q,tA+0.25,tA+0.6))*dip*fold,pf:pCount(left,listen?'¿Qué significa?':'¡Dilo en voz alta!')}),id+5,q,cx,0,12,0));
    // temporizador: una tira de papel que se desenrolla mientras piensas
    F.push(...strip([[cx-24,-1],[cx+22,-1]],clamp((q-tA)/dur),{col:PAL.red,print:pStripPrint(PAL.red),w:2.4,head:2.8}));
  }else{
    const r=q-tR,big=listen?item.es:item.ko;
    // la respuesta se pliega de golpe con un rebote (el momento clave)
    const ang=1.12*(1+0.12*Math.sin(PI*clamp((r-0.45)/0.3))*(r>0.45?1:0));
    F.push(...place(tent({w:mw,h:16,ang,a:eio(win(r,0.15,0.5))*fold,pf:listen?pCard('¡SIGNIFICA!',PAL.green,big,78,PAL.green):pCard(inLanguageLabel(),PAL.blue,big,84,PAL.blue)}),id+6,q,cx,0,12,0));
    const y=drop(q,tR+(listen?0.85:0.65),12);
    if(y!=null)F.push(...place(tent({w:mw-4,h:7,a:fold,pf:listen?pTag(item.ko,PAL.blue,64):pTag(item.es,PAL.ink,52)}),id+7,q,cx,y,-4,0.02));
    if(r>=1.2){const s=eback(win(r,1.2,1.45));F.push(...place(flag({pole:10,fw:7,fh:5.5,col:PAL.green,pf:pFlagV}),id+8,q,img?X+36:X+34,0,-1,-0.15,Math.max(0.05,s),0.05));}
  }
  return F;
}
function camFor(beat,q){
  let D=CAM.D,ty=CAM.ty;
  if(beat.phases){const r=q-beat.phases.reveal[0];if(r>0){const push=eio(win(r,0.2,0.6));D-=6*push;ty+=1*push;}}
  return{D,ty};
}

export default {
  id:'papercraft',
  name:'Maqueta de papel',
  fonts:['700 40px "Fredoka"','600 40px "Fredoka"','700 20px "Space Mono"','700 20px "Space Grotesk"'],
  fontCss:'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&family=Space+Grotesk:wght@400;700&family=Space+Mono:wght@400;700&display=block',
  readsPixels:true,
  frame(ctx,W,Hh,t,S){
    GID=1;
    const q=TQ(t),beat=S.beat,X=STATION(beat.index);
    let faces,cx=X,c=camFor(beat,q);
    // Cambio de escena a la manera del medio: las tarjetas del beat anterior se
    // pliegan sobre la plancha mientras la cámara se desliza a la siguiente estación.
    if(S.prev&&S.local<0.7){
      const u=eio(clamp(S.local/0.7)),PX=STATION(S.prev.index),pc=camFor(S.prev,S.prev.t1-0.001);
      faces=[...beatFaces(S.prev,TQ(S.prev.t1-0.001),S,PX,1-eio(win(S.local,0,0.45))),...beatFaces(beat,q,S,X)];
      cx=lerp(PX,X,u);c={D:lerp(pc.D,c.D,u)+10*Math.sin(PI*u),ty:lerp(pc.ty,c.ty,u)};
    }else faces=beatFaces(beat,q,S,X);
    const cam=makeCam(cx,CAM.tz,c.D,CAM.pitch,W,Hh,c.ty);
    renderScene(ctx,W,Hh,cam,faces,t);
  },
  // Sonido: cartulina sobre la plancha de corte. Todo cae en la rejilla de 12 fps.
  score(k,timeline){
    const S=x=>Math.ceil(x*12-1e-6)/12;
    const crease=(t,g=1,minor=true)=>{k.noise(t-0.012,{dur:0.014,filter:'bandpass',f:2600,q:1.4,gain:0.22*g,a:0.001,minor});k.noise(t,{dur:0.03,filter:'bandpass',f:1500,q:1.1,gain:0.5*g,a:0.001,minor});k.noise(t+0.004,{dur:0.06,color:'brown',filter:'lowpass',f:480,gain:0.38*g,a:0.002,minor});};
    const bend=(t0,t1,g=1)=>{const d=t1-t0;k.noise(t0,{dur:d,color:'pink',filter:'bandpass',f:[[0,450],[d,1100]],q:0.7,gain:0.08*g,a:d*0.5,minor:true});for(let i=1;i<=3;i++)k.noise(t0+d*(i/4),{dur:0.012,filter:'bandpass',f:2000+i*300,q:1.5,gain:0.08*g,a:0.001,minor:true});};
    const tap=(t,g=1,minor=true)=>{k.noise(t,{dur:0.045,color:'brown',filter:'lowpass',f:650,gain:0.4*g,a:0.001,minor});k.noise(t,{dur:0.018,filter:'bandpass',f:1100,q:1,gain:0.12*g,a:0.001,minor});};
    const glide=(t,d,g=1)=>k.noise(t,{dur:d,color:'brown',filter:'lowpass',f:[[0,200],[d*0.5,380],[d,200]],gain:0.1*g,a:d*0.5,minor:true});
    const flick=(t,g=1)=>{k.noise(t,{dur:0.02,filter:'bandpass',f:1700,q:1.6,gain:0.24*g,a:0.001,minor:true});k.tone(t,{f:210,dur:0.03,gain:0.04*g,minor:true});};
    const tentFold=(a,b,g=1,minor=true)=>{bend(S(a),S(b),g);crease(S(b),g,minor);};
    for(const beat of timeline.beats){
      const t0=beat.t0;
      if(beat.index)glide(t0,0.7,1.1);
      if(beat.kind==='title'){tentFold(0.2,0.85,1.2,false);tap(S(1.85),0.8);continue;}
      if(beat.kind==='end'){tentFold(t0+0.2,t0+0.8,1.2,false);tap(S(t0+1.55),1,false);['C4','G4','E5'].forEach((f,i)=>k.play('ding',S(t0+1.6)+i*0.1,{f,gain:[0.34,0.3,0.4][i]}));continue;}
      const {think,reveal}=beatTimes(beat);
      tentFold(t0+0.15,t0+0.55,0.6);
      for(let s=think[0]+1;s<think[1]-0.2;s+=1)flick(S(s),0.8);
      tentFold(think[0]+0.25,think[0]+0.6,0.6);
      tentFold(reveal[0]+0.15,reveal[0]+0.5,1.1,false);
      k.play('ding',S(reveal[0]+0.5),{f:'E5',gain:0.45});
      tap(S(reveal[0]+(beat.kind==='listen'?1.1:0.9)),0.6);
      k.play('success',S(reveal[0]+1.25),{f:'G5',gain:0.2,minor:true});
    }
  },
};
