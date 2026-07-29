const COMBINING_MARKS=/[\u0300-\u036f]/g;
const PUNCTUATION=/[\s.,!?¿¡;:()[\]{}"'“”‘’«»…·・，。！？；：、]/g;
const ARABIC_MARKS=/[\u0640\u064B-\u065F\u0670]/g;

function foldLatin(value){
  return value.normalize('NFKD').replace(COMBINING_MARKS,'');
}

export function normalizeGuidedAnswer(value,{language='',keepSpaces=false}={}){
  let text=String(value??'').normalize('NFKC').trim().toLocaleLowerCase();
  if(language==='Arabic')text=text.replace(ARABIC_MARKS,'').replace(/[إأآٱ]/g,'ا').replace(/ى/g,'ي');
  if(['English','French','German','Italian','Portuguese','Spanish'].includes(language))text=foldLatin(text);
  text=text.replace(PUNCTUATION,keepSpaces?' ':'').replace(/\s+/g,keepSpaces?' ':'').trim();
  return text;
}

function levenshtein(a,b){
  const row=Array.from({length:b.length+1},(_,index)=>index);
  for(let i=1;i<=a.length;i++){
    let previous=row[0];
    row[0]=i;
    for(let j=1;j<=b.length;j++){
      const held=row[j];
      row[j]=Math.min(row[j]+1,row[j-1]+1,previous+(a[i-1]===b[j-1]?0:1));
      previous=held;
    }
  }
  return row[b.length];
}

function finalComposition(value){
  const text=String(value??'').trim();
  // Algunas tarjetas muestran una fórmula didáctica ("ch + a → cha" o
  // "ㅁ + ㅜ + ㄴ = 문"), pero el estudiante debe escribir solamente el
  // resultado. Conservamos la fórmula como respuesta compatible y añadimos
  // automáticamente su resultado final como respuesta válida.
  const match=text.match(/(?:→|=)\s*([^=→]+)\s*$/u);
  return match?.[1]?.trim()||'';
}

function acceptedAnswers(activity){
  const values=[activity.answer,...(activity.accepted_answers||[])].filter(value=>value!==undefined&&value!==null);
  return [...new Set(values.flatMap(value=>{
    const raw=String(value);
    const final=finalComposition(raw);
    // El resultado va primero: si falla, el mensaje muestra lo que realmente
    // se pidió escribir y no la fórmula usada solo como apoyo visual.
    return final&&final!==raw?[final,raw]:[raw];
  }))];
}

export function evaluateGuidedAnswer(activity,given,language=''){
  if(given==='__skipped__'&&activity.optional)return{correct:true,skipped:true,normalized:'',expected:''};
  if(activity.type==='guided_dialogue'||activity.type==='stage_scenario'){
    const responses=Array.isArray(given)?given:given?.responses||[];
    const learnerTurns=(activity.turns||[]).filter(turn=>turn.role==='learner');
    if(!learnerTurns.length)return{correct:true,skipped:false,normalized:'',expected:''};
    let correct=0;
    const turns=learnerTurns.map((turn,index)=>{
      const result=evaluateGuidedAnswer({...turn,type:turn.response_type||'open_question'},responses[index]??'',language);
      if(result.correct)correct++;
      return result;
    });
    const required=Number(activity.minimum_correct||learnerTurns.length);
    return{
      correct:correct>=required,
      skipped:false,
      turns,
      correctTurns:correct,
      totalTurns:learnerTurns.length,
      expected:learnerTurns
        .map(turn=>acceptedAnswers(turn)[0]||'')
        .filter(Boolean)
        .join(' · ')
    };
  }
  const keepSpaces=activity.joiner===' '||['typed_translation','dictation','complete_without_options','transform_sentence','open_question','speak_and_transcribe'].includes(activity.type);
  const normalized=normalizeGuidedAnswer(given,{language,keepSpaces});
  const candidates=acceptedAnswers(activity).map(answer=>({
    raw:answer,
    normalized:normalizeGuidedAnswer(answer,{language,keepSpaces})
  }));
  let match=candidates.find(candidate=>candidate.normalized===normalized);
  if(!match&&activity.allow_minor_typos&&normalized.length>=8){
    match=candidates.find(candidate=>levenshtein(candidate.normalized,normalized)<=Math.max(1,Math.floor(candidate.normalized.length*.08)));
  }
  return{correct:Boolean(match),skipped:false,normalized,expected:candidates[0]?.raw||'',matched:match?.raw||''};
}

export function answerFeedback(activity,given,language=''){
  const result=evaluateGuidedAnswer(activity,given,language);
  if(result.skipped)return{...result,message:'Práctica oral omitida. Puedes volver a intentarla desde el repaso.'};
  if(result.correct){
    const dialogueMessage=result.totalTurns
      ? `${result.correctTurns} de ${result.totalTurns} respuestas comunican correctamente la idea.`
      : 'La respuesta comunica correctamente la idea.';
    return{...result,message:activity.success_message||dialogueMessage};
  }
  const expected=result.expected||activity.answer||'';
  const dialogueMessage=result.totalTurns
    ? `Revisa el intercambio: ${result.correctTurns} de ${result.totalTurns} respuestas fueron correctas.${expected?` Modelo: ${expected}`:''}`
    : `Respuesta esperada: ${expected}`;
  return{...result,message:activity.error_message||dialogueMessage};
}
