// Utilidades comunes de los estilos del video de repaso.

// Tramos de una pregunta: ask (escuchar o leer), think (cuenta atrás) y reveal.
export const beatTimes=beat=>beat.phases||{ask:[beat.t0,beat.t1],think:[beat.t1,beat.t1],reveal:[beat.t1,beat.t1]};

// font lleva «SIZE» donde va el tamaño: '700 SIZEpx "Kalam"'.
const withSize=(font,size)=>font.replace('SIZE',Math.round(size));

// Parte un texto en como mucho maxLines líneas que quepan en maxW.
export function wrapLines(ctx,text,maxW,size,font,maxLines=2){
  ctx.save();ctx.font=withSize(font,size);
  const words=String(text||'').split(/\s+/).filter(Boolean),lines=[];let line='';
  for(const word of words){const next=line?`${line} ${word}`:word;if(ctx.measureText(next).width>maxW&&line&&lines.length<maxLines-1){lines.push(line);line=word;}else line=next;}
  if(line)lines.push(line);
  ctx.restore();
  return lines.length?lines:[''];
}

// Mayor tamaño (sin pasar de size) con el que todas las líneas caben en maxW.
export function fitFont(ctx,lines,maxW,size,font,min=28){
  ctx.save();let fs=size;
  for(;fs>min;fs-=2){ctx.font=withSize(font,fs);if(lines.every(line=>ctx.measureText(line).width<=maxW))break;}
  ctx.restore();return fs;
}
