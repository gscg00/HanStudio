// Presentation rules shared by every guided language course.
export function productionPresentation(activity) {
  const copying = activity.tags?.includes('copying') || /^Copia\b/i.test(activity.prompt || '');
  if (copying) return {label:'Copia y escribe', instruction:activity.instruction || 'Copia exactamente la grafía mostrada.'};
  if (activity.type === 'build_with_blocks') return {label:'Construye la respuesta', instruction:activity.instruction || 'Toca los bloques en el orden correcto para construir la respuesta.'};
  // A reviewed listening instruction may identify the required writing system
  // or spelling pattern. Legacy `instruction` often contains the answer itself.
  if (activity.type === 'dictation') return {label:'Escribe lo que escuchas', instruction:activity.dictation_instruction || 'Escribe lo que oyes. La puntuación es opcional.'};
  if (activity.type === 'speak_and_transcribe') return {label:'Práctica oral', instruction:activity.instruction || 'Di la frase en voz alta o escríbela; después pulsa Comprobar.'};
  if (activity.type === 'open_question' && !activity.answer_policy) return {label:'Recuerda la expresión', instruction:activity.instruction || 'Escribe la expresión practicada en esta unidad. Puedes escuchar el modelo si necesitas ayuda.'};
  return {label:null, instruction:activity.instruction || 'Escribe tu respuesta y pulsa Comprobar.'};
}

export function canBuildAnswer(activity) {
  const options = activity.options || [], joiner = activity.joiner ?? ' ';
  const target = String(activity.answer || '');
  const failed = new Set();
  function visit(rest, remaining, first) {
    if (!rest) return true;
    const key = JSON.stringify([rest, remaining]);
    if (failed.has(key)) return false;
    const seen = new Set();
    for (let i=0; i<remaining.length; i++) {
      const word=remaining[i];
      if (seen.has(word)) continue;
      seen.add(word);
      const prefix=(first?'':joiner)+word;
      if (rest.startsWith(prefix) && visit(rest.slice(prefix.length), remaining.filter((_,j)=>i!==j), false)) return true;
    }
    failed.add(key);
    return false;
  }
  return Boolean(target && options.length && visit(target, options.map(String), true));
}
