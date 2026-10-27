// Línea de tiempo del video de repaso. Lógica pura: a partir de lo visto en la
// clase decide los «beats» (título, preguntas, cierre), cuándo habla cada voz
// y cuánto dura cada pausa para recordar. El reproductor y los estilos solo
// leen esta estructura.

const TITLE_DUR=3.4,END_DUR=4.2,INTRO=0.7,TAIL=1.1;
// Una palabra suelta se recuerda antes que una frase: menos espera.
const thinkTime=(text,mode)=>{const sentence=/\s/.test(String(text).trim());return mode==='listen'?(sentence?3.2:2.6):(sentence?4.2:3.2);};

// Duración estimada de la voz; si la voz real tarda más, el reproductor espera.
export const estimateSpeech=(text,lang)=>{
  const clean=String(text||'').replace(/[\s.,!?¿¡…«»"']/g,'');
  return lang==='es'?0.45+clean.length*0.068:0.5+[...clean].length*0.21;
};

// Se repasa TODO lo visto en la clase (nada queda fuera), sin fichas de regla
// ni repetidos; frases y palabras alternadas para que no se agolpen.
export function pickRecapItems(items){
  const seen=new Set(),usable=(items||[]).filter(item=>item?.target&&item?.meaning&&!/[+→=]/.test(item.target)&&!seen.has(item.target)&&seen.add(item.target));
  const sentences=usable.filter(item=>/\s/.test(item.target.trim())),words=usable.filter(item=>!/\s/.test(item.target.trim())),out=[];
  while(sentences.length||words.length){if(sentences.length)out.push(sentences.shift());if(words.length)out.push(words.shift());}
  return out;
}

export function buildRecapTimeline({classNumber=1,unitTitle='',items=[],languageName='coreano'}={}){
  const picked=pickRecapItems(items),beats=[],speech=[];
  let t=0;
  const say=(at,lang,text,voice,beatIndex)=>{const est=estimateSpeech(text,lang);speech.push({id:speech.length,t:at,est,lang,text,voice,beat:beatIndex});return est;};

  beats.push({kind:'title',index:0,t0:0,t1:TITLE_DUR,classNumber,unitTitle,total:picked.length,languageName});
  say(0.45,'es',`Repaso de la clase ${classNumber}. ¿Cuánto recuerdas?`,'es',0);
  t=TITLE_DUR;

  picked.forEach((item,i)=>{
    const index=beats.length,mode=i%2?'produce':'listen',voice=Math.floor(i/2)%2?'ko-m':'ko-f';
    const askAt=t+INTRO,phases={};
    if(mode==='listen'){
      const heard=say(askAt,'ko',item.target,voice,index);
      phases.ask=[t,askAt+heard+0.35];
      phases.think=[phases.ask[1],phases.ask[1]+thinkTime(item.target,mode)];
      const r0=phases.think[1],es=say(r0+0.15,'es',item.meaning,'es',index),again=say(r0+0.15+es+0.45,'ko',item.target,voice,index);
      phases.reveal=[r0,r0+0.15+es+0.45+again+TAIL];
    }else{
      const asked=say(askAt,'es',item.meaning,'es',index);
      phases.ask=[t,askAt+asked+0.35];
      phases.think=[phases.ask[1],phases.ask[1]+thinkTime(item.target,mode)];
      const r0=phases.think[1],first=say(r0+0.15,'ko',item.target,voice,index),second=say(r0+0.15+first+0.55,'ko',item.target,voice,index);
      phases.reveal=[r0,r0+0.15+first+0.55+second+TAIL];
    }
    beats.push({kind:mode,index,t0:t,t1:phases.reveal[1],item:{ko:item.target,es:item.meaning,picture:item.meaning},number:i+1,total:picked.length,phases});
    t=phases.reveal[1];
  });

  const endIndex=beats.length;
  beats.push({kind:'end',index:endIndex,t0:t,t1:t+END_DUR,total:picked.length,classNumber});
  say(t+0.5,'es','¡Muy bien! Mañana lo repasamos otra vez.','es',endIndex);
  t+=END_DUR;
  return {duration:t,beats,speech,items:picked,classNumber,unitTitle};
}

// Estado de la escena en el instante t: lo que un estilo necesita para dibujar.
export function sceneAt(timeline,t){
  const beats=timeline.beats;
  let beat=beats[beats.length-1];
  for(const candidate of beats)if(t>=candidate.t0&&t<candidate.t1){beat=candidate;break;}
  const local=Math.max(0,t-beat.t0),dur=beat.t1-beat.t0;
  let phase='',phaseP=0;
  if(beat.phases){
    for(const name of ['ask','think','reveal']){const [a,b]=beat.phases[name];if(t>=a&&t<b){phase=name;phaseP=(t-a)/(b-a);break;}}
    if(!phase){phase='reveal';phaseP=1;}
  }
  const speaking=timeline.speech.filter(item=>t>=item.t&&t<item.t+item.est+0.35);
  return {t,beat,prev:beats[beat.index-1]||null,next:beats[beat.index+1]||null,local,dur,progress:dur?local/dur:1,inP:Math.min(1,local/0.7),outP:Math.max(0,1-(beat.t1-t)/0.5),phase,phaseP,speaking,duration:timeline.duration};
}
