// Estilo «Origami Studio»: papel plegado sobre una mesa de estudio con fondo
// infinito. Técnicas del paquete: facetas planas con luz clave + relleno por
// cara, mapa de pliegues (valle oscuro / monte iluminado), degradado por faceta,
// textura de fibra sobre el papel, sombras suaves de mesa + oclusión de contacto
// en máscaras a media resolución, destello de la luz clave en el momento clave,
// viñeta y grano. Las tarjetas tienda se pliegan y repliegan, las flechas son
// papel plegado sobre la mesa y la cámara hace un travelling por la mesa entre beats.
import {beatTimes,fitFont,wrapLines,inLanguageLabel} from './shared.js';

const H=window.H;
const TAU=Math.PI*2;
const HANGUL='"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif';
const SGF=`700 SIZEpx "Space Grotesk",${HANGUL}`,SG=px=>SGF.replace('SIZE',px);
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],mul=(a,s)=>[a[0]*s,a[1]*s,a[2]*s];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l];};
const rotY=(p,a)=>{const c=Math.cos(a),s=Math.sin(a);return[p[0]*c+p[2]*s,p[1],-p[0]*s+p[2]*c];};
const cl=H.clamp,seg=(t,a,b)=>H.ease.inOut(cl((t-a)/(b-a)));
const pop=(t,a,d=0.45)=>{const u=cl((t-a)/d);if(u<=0)return 0;const c1=1.5,c3=c1+1;return 1+c3*Math.pow(u-1,3)+c1*Math.pow(u-1,2);};
const ORANGE=[232,135,76],CREAM=[246,242,233],INK='#23242a',RED=[214,74,58],GREEN=[92,170,104],MUS=[241,182,68],IND=[58,82,150],CORAL=[240,138,126],TEAL=[44,160,150];
const OXC={};

const makeTex=seed=>{
  const S=256,cv=H.layer(S,S),x=cv.getContext('2d'),r=H.rng(seed),img=x.createImageData(S,S),d=img.data;
  for(let i=0;i<d.length;i+=4){const n=r(),w=n>0.5;d[i]=d[i+1]=d[i+2]=w?255:0;d[i+3]=Math.abs(n-0.5)*34;}
  x.putImageData(img,0,0);x.lineCap='round';
  for(let n=0;n<260;n++){const px=r()*S,py=r()*S,len=r.range(3,14),a=r()*TAU;x.strokeStyle=r()<0.6?`rgba(255,255,255,${r.range(0.06,0.16)})`:`rgba(60,40,20,${r.range(0.04,0.09)})`;x.lineWidth=r.range(0.4,0.9);for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){x.beginPath();x.moveTo(px+ox*S,py+oy*S);x.lineTo(px+ox*S+Math.cos(a)*len,py+oy*S+Math.sin(a)*len);x.stroke();}}
  return cv;
};

// ---------- impresión sobre el papel (unidades del lienzo: 400 de ancho) ----------
const printer=(lines,opt={})=>(c,w,h)=>{
  c.textAlign='center';c.textBaseline='middle';
  lines.forEach(([txt,fr,yy,col])=>{let px=fr*h;c.font=SG(px);const mw=c.measureText(txt).width;if(mw>w*0.9){px*=(w*0.9)/mw;c.font=SG(px);}c.fillStyle=col||opt.ink||INK;c.fillText(txt,w/2,h*yy);});
};
// Texto largo en una o dos líneas que caben en el ancho.
const para=(c,txt,w,h,fr,yy,col,max=2)=>{const L=wrapLines(c,txt,w*0.9,fr*h,SGF,max),fs=fitFont(c,L,w*0.9,fr*h,SGF,6);c.font=SG(fs);c.fillStyle=col;c.textAlign='center';c.textBaseline='middle';L.forEach((s,i)=>c.fillText(s,w/2,h*yy+(i-(L.length-1)/2)*fs*1.06));};
// Papel a dos tonos: banda de color arriba con su etiqueta.
const band=(c,w,h,col,label,frac=0.2)=>{c.fillStyle=H.rgba(col,0.92);c.fillRect(0,0,w,h*frac);if(label){c.font=SG(h*frac*0.62);c.fillStyle='#fff';c.textAlign='center';c.textBaseline='middle';c.fillText(label,w/2,h*frac*0.52,w*0.92);}};
const picturePaint=img=>(c,w,h)=>{c.fillStyle='rgba(198,222,236,0.9)';c.fillRect(w*0.06,h*0.06,w*0.88,h*0.88);if(!img)return;const iw=img.naturalWidth||img.width||1,ih=img.naturalHeight||img.height||1,s=Math.min(w*0.8/iw,h*0.8/ih);c.drawImage(img,w/2-iw*s/2,h/2-ih*s/2,iw*s,ih*s);};

// Construye las facetas de una escena. Devuelve la lista de caras.
function builder(){
  const faces=[],face=(pts,col,extra={})=>faces.push({pts,col,...extra});
  // tarjeta tienda: se pliega desde plana (u 0..1); la cara frontal lleva la impresión. y0 la eleva (sobre un pedestal).
  const tent=(x,z,w,h,rot,u,paint,col=CREAM,y0=0)=>{
    if(u<=0)return;
    const dz=0.34,Lf=Math.hypot(h,dz),th=Math.atan2(h,dz)*Math.min(1,u),T=p=>add(rotY(p,rot),[x,y0,z]);
    const rid=[0,Lf*Math.sin(th),dz-Lf*Math.cos(th)],BLf=[-w,0.003,dz],BRf=[w,0.003,dz],TR=[w,rid[1],rid[2]],TL=[-w,rid[1],rid[2]],bz=rid[2]-dz*Math.min(1,u);
    face([TL,TR,[w,0.003,bz],[-w,0.003,bz]].map(T),col.map(v=>v*0.97));
    face([BLf,BRf,TR,TL].map(T),col,{map:[T(TL),T(TR),T(BLf)],paint});
  };
  // flecha plegada sobre la mesa (pliegue central), crece con p
  const arrowFlat=(x0,z0,x1,z1,p,col)=>{
    if(p<=0)return;
    const ex=H.lerp(x0,x1,p),ez=H.lerp(z0,z1,p),a=Math.atan2(ez-z0,ex-x0),len=Math.hypot(ex-x0,ez-z0),dx=Math.cos(a),dz=Math.sin(a),nx=-dz,nz2=dx;
    const hw=0.22,hl=Math.min(0.55,len*0.5),y=0.012,cr=0.05,P=(s,n,yy=y)=>[x0+dx*s+nx*n,yy,z0+dz*s+nz2*n],sEnd=len-hl;
    face([P(0,-hw),P(sEnd,-hw),P(sEnd,0,y+cr),P(0,0,y+cr)],col);face([P(0,0,y+cr),P(sEnd,0,y+cr),P(sEnd,hw),P(0,hw)],col.map(v=>v*0.98));
    face([P(sEnd,-hw*2.2),P(len,0,y+cr*0.4),P(sEnd,0,y+cr*1.6)],col);face([P(sEnd,0,y+cr*1.6),P(len,0,y+cr*0.4),P(sEnd,hw*2.2)],col);
  };
  // tira de papel de pie en el plano de cámara, con un pliegue en medio
  const strip=(a,b,wdt,col)=>{const d=sub(b,a),n=norm([-d[1],d[0],0]),m=mul(add(a,b),0.5);face([add(a,mul(n,wdt)),add(m,[n[0]*wdt,n[1]*wdt,0.04]),add(m,[-n[0]*wdt,-n[1]*wdt,0.04]),add(a,mul(n,-wdt))],col);face([add(m,[n[0]*wdt,n[1]*wdt,0.04]),add(b,mul(n,wdt)),add(b,mul(n,-wdt)),add(m,[-n[0]*wdt,-n[1]*wdt,0.04])],col.map(v=>v*0.94));};
  // columna plisada en acordeón: 12 pliegues monte/valle, tapa en abanico
  const column=(x,z,hgt,col,r0=0.24)=>{
    if(hgt<=0.01)return;const n=12,ring=y=>Array.from({length:n},(_,k)=>{const a=((k+0.5)/n)*TAU,r=k%2?r0*0.82:r0;return[x+Math.cos(a)*r,y,z+Math.sin(a)*r];}),A=ring(0.01),B=ring(hgt);
    for(let k=0;k<n;k++){const k2=(k+1)%n;face([A[k],A[k2],B[k2],B[k]],k%2?col.map(v=>v*0.92):col);}
    const cc=[x,hgt+0.035,z];for(let k=0;k<n;k++)face([B[k],B[(k+1)%n],cc],col.map(v=>Math.min(255,v*(k%2?1.0:1.06))));
  };
  const star=(x,y,z,s,spin)=>{
    const c=[x,y,z],pts=[];for(let i=0;i<10;i++){const a=-Math.PI/2+(i/10)*TAU,rr=(i%2?0.42:1)*s;pts.push(add(c,rotY([Math.cos(a)*rr,-Math.sin(a)*rr,0],spin)));}
    const f1=add(c,rotY([0,0,0.3*s],spin)),f2=add(c,rotY([0,0,-0.3*s],spin));
    for(let i=0;i<10;i++){face([pts[i],pts[(i+1)%10],f1],i%2?MUS:MUS.map(v=>v*0.85));face([pts[(i+1)%10],pts[i],f2],MUS.map(v=>v*0.8));}
  };
  const pinwheel=(x,z,s,ang,col)=>{
    face([[x-0.02,0,z],[x+0.02,0,z],[x+0.02,1.2*s,z],[x-0.02,1.2*s,z]],[200,190,170]);
    const c=[x,1.2*s,z+0.05];for(let i=0;i<4;i++){const a=ang+(i*TAU)/4,a2=a+0.9;face([c,add(c,[Math.cos(a)*0.42*s,Math.sin(a)*0.42*s,0.02]),add(c,[Math.cos(a2)*0.3*s,Math.sin(a2)*0.3*s,0.12])],i%2?col:col.map(v=>v*0.8));}
  };
  // marca de correcto: dos tiras verdes plegadas
  const check=(c0,vs)=>{if(vs<=0)return;strip(add(c0,[-0.32*vs,0.02,0]),add(c0,[-0.08*vs,-0.24*vs,0]),0.07,GREEN);strip(add(c0,[-0.08*vs,-0.24*vs,0.02]),add(c0,[0.42*vs,0.36*vs,0.02]),0.07,GREEN);};
  // caja de papel (altavoz) que se despliega hacia arriba: frente impreso
  const box=(x,z,w,h,d,u,paint,col)=>{
    if(u<=0)return;const hh=h*H.ease.out(u),P=(a,b,c)=>[x+a,b,z+c];
    face([P(-w,0,d),P(w,0,d),P(w,hh,d),P(-w,hh,d)],col,{map:[P(-w,hh,d),P(w,hh,d),P(-w,0,d)],paint});
    face([P(-w,hh,d),P(w,hh,d),P(w,hh,-d),P(-w,hh,-d)],col.map(v=>v*1.02));
    face([P(w,0,d),P(w,0,-d),P(w,hh,-d),P(w,hh,d)],col.map(v=>v*0.95));face([P(-w,0,-d),P(-w,0,d),P(-w,hh,d),P(-w,hh,-d)],col.map(v=>v*0.95));
  };
  return{faces,tent,arrowFlat,strip,column,star,pinwheel,check,box};
}

// ================= escenas del repaso =================
const STATION=i=>(i%2)*10.5;
const speakerPaint=pulse=>(c,w,h)=>{c.fillStyle='#3a5296';c.fillRect(w*0.06,h*0.06,w*0.88,h*0.88);const x=w/2,y=h*0.52,R=Math.min(w,h)*0.32;c.fillStyle='#23242a';c.beginPath();c.arc(x,y,R,0,TAU);c.fill();c.fillStyle='#f6f2e9';c.beginPath();c.arc(x,y,R*(0.78+0.06*pulse),0,TAU);c.fill();c.strokeStyle='rgba(60,40,20,0.35)';c.lineWidth=3;for(let k=1;k<4;k++){c.beginPath();c.arc(x,y,R*(0.2+k*0.17)*(1+0.05*pulse),0,TAU);c.stroke();}c.fillStyle='#e8874c';c.beginPath();c.arc(x,y,R*0.2,0,TAU);c.fill();};
// fold: 1 normal; <1 las tarjetas se repliegan (salida del beat)
function scene(B,beat,t,S,X,fold=1){
  const L=t-beat.t0,u=(a,b)=>seg(L,a,b)*fold;
  B.pinwheel(X-5.2,-2.6,1.0,0.3+t*1.2,TEAL);B.pinwheel(X+5.4,-2.4,0.85,1.1-t*1.5,MUS);
  if(beat.kind==='title'){
    const sc=S.assets.scene;
    B.tent(sc?X-1.3:X,0.6,sc?2.3:3,1.5,0,u(0.1,0.9),(c,w,h)=>{band(c,w,h,IND,(beat.kit||'KIT DE REPASO')+' · DOBLA AQUÍ',0.17);printer([[(beat.heading||`REPASO · CLASE ${beat.classNumber}`),0.3,0.43]])(c,w,h);para(c,beat.unitTitle||'',w,h,0.2,0.75,'#3a8f86',1);});
    if(sc)B.tent(X+2.6,0.5,1.15,1.45,-0.12,u(0.5,1.1),picturePaint(sc));
    B.tent(X-0.2,2.6,2.0,0.55,0,u(1.4,1.8),printer([[(beat.tagline||'¿Cuánto recuerdas?'),0.62,0.55,'#e45a3e']]));
    B.arrowFlat(X-3.6,1.7,X-2.2,2.4,seg(L,1.1,1.5)*fold,MUS);
    return;
  }
  if(beat.kind==='end'){
    B.tent(X,0.6,2.6,1.5,0,u(0.1,0.9),(c,w,h)=>{band(c,w,h,GREEN,'¡MODELO TERMINADO!',0.17);printer([['¡Muy bien!',0.4,0.45,'#2f8a5a'],[(beat.tally||`${beat.total} frases repasadas`),0.23,0.78]])(c,w,h);});
    B.tent(X,2.6,2.4,0.55,0,u(1.3,1.7),printer([[(beat.closing||'Mañana vuelven: ¡no las sueltes!'),0.55,0.55,'#e45a3e']]));
    const sp=pop(L,1.0,0.5)*fold;if(sp>0)B.star(X+2.9,2.15+0.12*Math.sin(t*3),0.5,0.42*sp,(L-1)*2.5);
    B.check([X-2.2,2.0,0.8],pop(L,1.2,0.35)*fold);
    return;
  }
  const {ask,think,reveal}=beatTimes(beat),item=beat.item,img=S.assets.picture(item.picture),listen=beat.kind==='listen';
  const cx=img?X-1.35:X,hw=img?2.0:2.7,col=listen?TEAL:RED;
  // carteles sobre pedestales plisados al fondo
  const sg=u(0,0.5);
  B.column(X-3.1,-1.2,1.7*sg,col,0.2);B.tent(X-3.1,-1.5,1.5,0.8,0.05,sg,(c,w,h)=>{c.fillStyle=H.rgba(col,0.9);c.fillRect(0,0,w,h*0.14);printer([[listen?'ESCUCHA':'¿CÓMO SE DICE?',0.58,0.57,listen?'#2a7f77':'#c8402f']])(c,w,h);},CREAM,1.7*sg);
  B.column(X+3.1,-1.2,1.7*sg,MUS,0.2);B.tent(X+3.1,-1.5,0.95,0.8,-0.05,sg,printer([[`${beat.number} / ${beat.total}`,0.6,0.55]]),CREAM,1.7*sg);
  if(img)B.tent(X+2.5,0.5,1.05,1.45,-0.12,u(0.4,0.9),picturePaint(img));
  const tA=think[0],tR=reveal[0];
  if(t<tA+0.25){
    const down=1-seg(t,tA,tA+0.25);
    if(listen){
      const pulse=t<ask[1]?0.5+0.5*Math.sin(t*14):0;
      B.box(cx,0.6,0.75,1.35,0.5,u(0.3,0.9)*down,speakerPaint(pulse),CREAM);
      // ondas de sonido: tiras de papel plegadas que laten a ambos lados
      if(L>0.9&&down>0.5)for(let i=0;i<3;i++){const ph=((L-0.9)*0.9+1-i*0.25)%1,s=pop(ph,0,0.3)*(1-cl((ph-0.75)/0.25));if(s<=0)continue;const R=1.05+i*0.38;
        for(const d of[-1,1]){const P=k=>{const a=-0.7+1.4*k/3;return[cx+d*Math.cos(a)*R,0.75+Math.sin(a)*R*0.85,1.1];};for(let k=0;k<3;k++)B.strip(P(k),P(k+1),0.06*s,[MUS,ORANGE,CORAL][i]);}}
    }else B.tent(cx,0.6,hw,1.5,0,u(0.3,0.9)*down,(c,w,h)=>{band(c,w,h,IND,'SIGNIFICADO',0.17);para(c,item.es,w,h,0.36,0.58,INK);});
  }else if(t<tR+0.25){
    // cuenta atrás: tarjeta que se repliega un poco en cada segundo + columnas plisadas que se doblan
    const dur=think[1]-think[0],rem=dur*(1-cl((t-tA)/dur)),left=Math.max(1,Math.ceil(rem-1e-6)),since=1-(rem-Math.floor(rem));
    const dip=t<tR?1-0.25*Math.sin(Math.PI*cl(since/0.18)):1-seg(t,tR,tR+0.25);
    B.tent(cx,0.6,hw-0.6,1.5,0,seg(t,tA+0.25,tA+0.6)*dip*fold,(c,w,h)=>{band(c,w,h,MUS,'TIEMPO',0.17);printer([[String(left),0.5,0.5],[listen?'¿Qué significa?':'¡Dilo en voz alta!',0.17,0.85,'#e45a3e']])(c,w,h);});
    const n=Math.ceil(dur-1e-6);for(let i=0;i<n;i++){const stand=cl(rem-(n-1-i));B.column(cx+(i-(n-1)/2)*0.72,2.3,0.6*H.ease.out(stand)*(t<tR?1:0),i%2?TEAL:MUS,0.24);}
  }else{
    const r=t-tR,big=listen?item.es:item.ko,uu=pop(r,0.2,0.45)*fold;
    if(uu>0)B.tent(cx,0.6,hw,1.5,0,uu,listen?(c,w,h)=>{band(c,w,h,GREEN,'¡SIGNIFICA!',0.17);para(c,big,w,h,0.36,0.58,'#2f8a5a');}:(c,w,h)=>{band(c,w,h,IND,inLanguageLabel(),0.17);para(c,big,w,h,0.46,0.6,'#2f4f96');});
    B.tent(cx,2.25,hw-0.2,0.55,0,seg(r,listen?0.8:0.6,listen?1.1:0.9)*fold,listen?printer([[item.ko,0.62,0.55,'#2f4f96']]):(c,w,h)=>para(c,item.es,w,h,0.55,0.55,INK,1));
    B.check([cx+hw-0.35,1.72,1.0],pop(r,1.2,0.35)*fold);
    B.arrowFlat(cx-hw-0.2,1.9,cx-hw+0.5,2.35,seg(r,0.7,1.0)*fold,MUS);
  }
}

// ---------- render (la misma terminación que el original) ----------
function render(ctx,W,Hh,t,faces,E,TG,flash){
  const fwd=norm(sub(TG,E)),right=norm(cross(fwd,[0,1,0])),up=cross(right,fwd),F=1180,PCX=640,PCY=372;
  const proj=p=>{const d=sub(p,E),z=dot(d,fwd);return[PCX+(F*dot(d,right))/z,PCY-(F*dot(d,up))/z,z];};
  const Lkey=norm([-0.55,1.0,0.55]),Lfill=norm([0.9,0.25,0.35]),Ls=mul(Lkey,-1);
  faces.forEach(f=>{
    const [a,b,c]=f.pts;let n=norm(cross(sub(b,a),sub(c,a)));const cen=mul(f.pts.reduce((s,p)=>add(s,p),[0,0,0]),1/f.pts.length);
    if(dot(n,sub(E,cen))<0)n=mul(n,-1);
    const I=0.36+0.7*Math.max(0,dot(n,Lkey))+0.16*Math.max(0,dot(n,Lfill))+0.1*Math.max(0,-n[1]);
    f.rgb=f.col.map((ch,i)=>Math.min(255,ch*I*[1.04,1,0.95][i]));f.I=I;f.n=n;f.cen=cen;f.sp=f.pts.map(proj);f.z=f.sp.reduce((s,p)=>s+p[2],0)/f.sp.length;
  });
  const vis=faces.filter(f=>f.sp.every(p=>p[2]>0.5));
  // mapa de pliegues: aristas compartidas entre facetas = valle (oscuro) o monte (iluminado)
  {
    const ek=p=>Math.round(p[0]*1000)+','+Math.round(p[1]*1000)+','+Math.round(p[2]*1000),edges=new Map();
    vis.forEach((f,fi)=>f.pts.forEach((p,i)=>{const q=f.pts[(i+1)%f.pts.length],a=ek(p),b=ek(q),k=a<b?a+'|'+b:b+'|'+a,e=edges.get(k);if(e)e.push(fi);else edges.set(k,[fi]);(f.ek||(f.ek=[]))[i]=k;}));
    vis.forEach((f,fi)=>{f.ekind=f.ek.map(k=>{const fs=edges.get(k);if(!fs||fs.length!==2)return 0;const g=vis[fs[0]===fi?fs[1]:fs[0]],d=dot(sub(g.cen,f.cen),f.n);return d>0.004?-1:d<-0.004?1:0;});});
  }
  vis.sort((a,b)=>b.z-a.z);
  // fondo infinito del estudio (cacheado)
  ctx.drawImage(OXC.bg||(OXC.bg=(()=>{
    const C=H.layer(W,Hh),c=C.getContext('2d'),bg=c.createLinearGradient(0,0,0,Hh);
    bg.addColorStop(0,'#c9d3cf');bg.addColorStop(0.45,'#dde3de');bg.addColorStop(0.62,'#e6e6de');bg.addColorStop(1,'#d8d5ca');c.fillStyle=bg;c.fillRect(0,0,W,Hh);
    const spot=c.createRadialGradient(560,330,40,600,380,780);spot.addColorStop(0,'rgba(255,252,240,0.6)');spot.addColorStop(1,'rgba(255,252,240,0)');c.fillStyle=spot;c.fillRect(0,0,W,Hh);
    c.globalAlpha=0.6;c.fillStyle=c.createPattern(OXC.tex||(OXC.tex=makeTex(5)),'repeat');c.fillRect(0,0,W,Hh);return C;
  })()),0,0);
  // sombras suaves de mesa + oclusión de contacto, en máscaras a media resolución
  const lowL=(key,sc0)=>{const w=Math.ceil(W*sc0),h=Math.ceil(Hh*sc0);let L=OXC[key];if(!L||L.width!==w)L=OXC[key]=H.layer(w,h);const c=L.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,w,h);c.setTransform(sc0,0,0,sc0,0,0);return[L,c];};
  {
    const [SL,sc]=lowL('SLh',0.5);sc.fillStyle='#000';
    vis.forEach(f=>{if(f.pts.every(p=>p[1]<0.02))return;sc.beginPath();f.pts.forEach((p,i)=>{const s=proj(add(p,mul(Ls,p[1]/-Ls[1])));i?sc.lineTo(s[0],s[1]):sc.moveTo(s[0],s[1]);});sc.closePath();sc.fill();});
    const [CL,cc]=lowL('CLh',0.5);cc.fillStyle='#000';
    vis.forEach(f=>{let mn=1e9;f.pts.forEach(p=>{if(p[1]<mn)mn=p[1];});if(mn>0.22)return;cc.beginPath();f.pts.forEach((p,i)=>{const s=proj([p[0],0,p[2]]);i?cc.lineTo(s[0],s[1]):cc.moveTo(s[0],s[1]);});cc.closePath();cc.fill();});
    const w=SL.width,h=SL.height;let M=OXC.SM;if(!M||M.width!==w)M=OXC.SM=H.layer(w,h);
    const m=M.getContext('2d');m.globalAlpha=1;m.filter='none';m.fillStyle='#fff';m.fillRect(0,0,w,h);
    m.filter='blur(6px)';m.globalAlpha=0.38;m.drawImage(SL,0,0);m.filter='blur(2.5px)';m.globalAlpha=0.6;m.drawImage(CL,0,0);m.filter='none';m.globalAlpha=1;
    ctx.save();ctx.globalCompositeOperation='multiply';ctx.drawImage(M,0,0,W,Hh);ctx.restore();
  }
  // facetas: degradado de luz por faceta, canto iluminado, pliegues valle/monte, impresión
  const OL=OXC.OL||(OXC.OL=H.layer(W,Hh)),o=OL.getContext('2d');o.clearRect(0,0,W,Hh);o.lineJoin='round';
  const Lscr=[-0.6,-0.8];
  vis.forEach(f=>{
    const sp=f.sp;let mnx=1e9,mxx=-1e9,mny=1e9,mxy=-1e9;
    sp.forEach(p=>{if(p[0]<mnx)mnx=p[0];if(p[0]>mxx)mxx=p[0];if(p[1]<mny)mny=p[1];if(p[1]>mxy)mxy=p[1];});
    if(mxx<-20||mnx>W+20||mxy<-20||mny>Hh+20)return;
    const gx=(mnx+mxx)/2,gy=(mny+mxy)/2,rr=Math.max(1,Math.max(mxx-mnx,mxy-mny)/2),g=o.createLinearGradient(gx+Lscr[0]*rr,gy+Lscr[1]*rr,gx-Lscr[0]*rr,gy-Lscr[1]*rr);
    g.addColorStop(0,H.rgba(f.rgb.map(v=>Math.min(255,v*1.05)),1));g.addColorStop(1,H.rgba(f.rgb.map(v=>v*0.94),1));
    o.beginPath();sp.forEach((p,i)=>(i?o.lineTo(p[0],p[1]):o.moveTo(p[0],p[1])));o.closePath();o.fillStyle=g;o.fill();
    o.strokeStyle=H.rgba(f.rgb,1);o.lineWidth=0.7;o.stroke();o.strokeStyle=`rgba(255,255,250,${0.05+0.08*Math.min(1,f.I)})`;o.lineWidth=0.6;o.stroke();
    for(const kind of[-1,1]){let any=false;sp.forEach((p,i)=>{if(f.ekind[i]!==kind)return;if(!any){o.beginPath();any=true;}const q=sp[(i+1)%sp.length];o.moveTo(p[0],p[1]);o.lineTo(q[0],q[1]);});if(!any)continue;if(kind<0){o.strokeStyle=H.rgba(f.rgb.map(v=>v*0.55),0.55);o.lineWidth=0.9;}else{o.strokeStyle=`rgba(255,250,242,${0.1+0.2*cl(f.I-0.5)})`;o.lineWidth=0.8;}o.stroke();}
    if(f.paint){
      const [p0,p1,p3]=f.map.map(proj),cw=400,ch=400*(Math.hypot(p3[0]-p0[0],p3[1]-p0[1])/Math.max(1,Math.hypot(p1[0]-p0[0],p1[1]-p0[1])));
      if(ch>2&&ch<4000){o.save();o.beginPath();sp.forEach((p,i)=>(i?o.lineTo(p[0],p[1]):o.moveTo(p[0],p[1])));o.closePath();o.clip();o.setTransform((p1[0]-p0[0])/cw,(p1[1]-p0[1])/cw,(p3[0]-p0[0])/ch,(p3[1]-p0[1])/ch,p0[0],p0[1]);f.paint(o,cw,ch);o.restore();}
    }
  });
  o.save();o.globalCompositeOperation='source-atop';o.globalAlpha=0.9;o.fillStyle=o.createPattern(OXC.tex,'repeat');o.fillRect(0,0,W,Hh);o.restore();
  ctx.drawImage(OL,0,0);
  // énfasis: destello de la luz clave en el momento que importa
  if(flash>0.01){ctx.save();ctx.globalCompositeOperation='screen';ctx.fillStyle=`rgba(255,240,215,${flash*0.18})`;ctx.fillRect(0,0,W,Hh);ctx.restore();}
  H.vignette(ctx,W,Hh,0.28,'30,40,40');
  H.grain(ctx,W,Hh,0.022,3+Math.floor(t*24));
}
// cámara de la estación: empuje hacia la respuesta en el reveal
let S0=null;
function camFor(beat,t,X){
  let zoom=0;const dx=0;
  if(beat.phases){const r=t-beat.phases.reveal[0];zoom=seg(r,0.15,0.6);if(beat.item&&S0.assets.picture(beat.item.picture))zoom*=0.6;}
  return{E:[X+0.3+dx,2.35+zoom*0.1,7.7-zoom*0.75],TG:[X+dx,0.85-zoom*0.05,0]};
}

export default {
  id:'origami',
  name:'Origami',
  fonts:['700 30px "Space Grotesk"','400 15px "Space Mono"'],
  fontCss:'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=Space+Mono:wght@400;700&display=block',
  readsPixels:true,
  frame(ctx,W,Hh,t,S){
    S0=S;const beat=S.beat,X=STATION(beat.index),B=builder();
    let cam=camFor(beat,t,X);
    // Cambio de escena: las tarjetas del beat anterior se repliegan sobre la mesa
    // mientras la cámara hace travelling hasta la siguiente estación.
    if(S.prev&&S.local<0.7){
      const PX=STATION(S.prev.index),pt=S.prev.t1-0.001,pc=camFor(S.prev,pt,PX),u=seg(S.local,0,0.7);
      scene(B,S.prev,pt,S,PX,1-seg(S.local,0,0.45));
      const mix=(a,b)=>a.map((v,i)=>H.lerp(v,b[i],u));
      cam={E:mix(pc.E,cam.E),TG:mix(pc.TG,cam.TG)};
    }
    scene(B,beat,t,S,X);
    let flash=0;
    if(beat.phases)flash=Math.exp(-Math.pow((t-beat.phases.reveal[0]-0.55)*5,2));
    else if(beat.kind==='end')flash=Math.exp(-Math.pow((S.local-1.05)*5,2));
    render(ctx,W,Hh,t,B.faces,cam.E,cam.TG,flash);
  },
  // Sonido: papel plegándose en una mesa de estudio tranquila.
  score(k,timeline){
    const crease=(t,g=1,p=0,minor=true)=>{k.noise(t,{dur:0.028,filter:'bandpass',f:1700,q:1.1,gain:0.55*g,a:0.001,pan:p,minor});k.noise(t,{dur:0.07,color:'brown',filter:'lowpass',f:520,gain:0.42*g,a:0.002,pan:p,minor});};
    const fold=(t0,t1,g=1,p=0,minor=true)=>{const d=t1-t0;k.noise(t0,{dur:d,color:'pink',filter:'bandpass',f:[[0,520],[d,1300]],q:0.6,gain:0.095*g,a:d*0.55,pan:p,minor:true});for(let i=1;i<=3;i++)k.noise(t0+d*(0.25+i*0.17),{dur:0.018,filter:'bandpass',f:1500+i*250,q:1.2,gain:0.07*g,a:0.001,pan:p,minor:true});crease(t1,g,p,minor);};
    const glide=(t,d)=>k.noise(t,{dur:d,color:'brown',filter:'lowpass',f:[[0,220],[d*0.5,420],[d,220]],gain:0.09,a:d*0.5,minor:true});
    const tick=(t,g,p=0)=>{k.noise(t,{dur:0.02,filter:'bandpass',f:1500,q:1.6,gain:0.26*g,a:0.001,pan:p,minor:true});k.tone(t,{f:240,dur:0.03,gain:0.05*g,pan:p,minor:true});};
    const slideSheet=(t0,t1,g=1,p=0)=>{const d=t1-t0;k.noise(t0,{dur:d,filter:'bandpass',f:[[0,700],[d,1000]],q:0.7,gain:0.08*g,a:d*0.4,hold:d*0.3,pan:p,minor:true});crease(t1,0.45*g,p);};
    for(const beat of timeline.beats){
      const t0=beat.t0;
      if(beat.index){glide(t0,0.7);fold(t0,t0+0.45,0.5,-0.3);}
      if(beat.kind==='title'){fold(0.1,0.9,1.3,0,false);slideSheet(1.1,1.5,0.8,-0.4);fold(1.4,1.8,0.7);continue;}
      if(beat.kind==='end'){fold(t0+0.1,t0+0.9,1.2,0,false);fold(t0+1.3,t0+1.7,0.7);['C5','E5','G5'].forEach((f,i)=>k.play('ding',t0+1.05+i*0.09,{f,gain:[0.3,0.26,0.34][i]}));continue;}
      const {think,reveal}=beatTimes(beat);
      fold(t0+0.3,t0+0.9,0.6);
      fold(think[0]+0.25,think[0]+0.6,0.6);
      for(let s=think[0]+1;s<think[1]-0.2;s+=1)tick(s,0.8);
      fold(reveal[0]+0.2,reveal[0]+0.5,1.1,0,false);k.play('ding',reveal[0]+0.55,{f:'E5',gain:0.42});
      fold(reveal[0]+0.7,reveal[0]+1.0,0.5);
      k.play('success',reveal[0]+1.25,{f:'G5',gain:0.2,minor:true});
    }
  },
};
