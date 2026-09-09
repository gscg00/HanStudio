const example=(label,text,meaning='')=>({label,text,audio:text,...(meaning?{meaning}:{})});

export const japaneseReadingExamples={
 'japanese-reading-00-03-a-teach':[
  example('FILA K · A','か','Primera mora de la fila K.'),example('FILA K · I','き','Segunda mora de la fila K.'),
  example('FILA K · U','く','Tercera mora de la fila K.'),example('FILA K · E','け','Cuarta mora de la fila K.'),example('FILA K · O','こ','Quinta mora de la fila K.'),
 ],
 'japanese-reading-00-03-b-teach':[
  example('SONIDO QUE SE APRENDE DIRECTAMENTE','し'),example('SONIDO QUE SE APRENDE DIRECTAMENTE','ち'),
  example('SONIDO QUE SE APRENDE DIRECTAMENTE','つ'),example('SONIDO QUE SE APRENDE DIRECTAMENTE','ふ'),
 ],
 'japanese-reading-00-04-a-teach':[
  example('DAKUTEN · か CAMBIA A','が','El signo modifica la consonante.'),
  example('HANDAKUTEN · は CAMBIA A','ぱ','El círculo modifica la consonante.'),
 ],
 'japanese-reading-00-04-b-teach':[
  example('KANA PEQUEÑO EN COMBINACIÓN','きゃ','Se lee como una sola mora combinada.'),
  example('CONSONANTE DOBLE EN CONTEXTO','きって','La っ prepara la consonante doble.'),
 ],
 'japanese-reading-00-05-a-teach':[
  example('VOCAL NORMAL','おばさん','Tía o señora.'),
  example('VOCAL LARGA','おばあさん','Abuela o señora mayor.'),
 ],
};

export function applyJapaneseReadingExamples(lessons){
 for(const activity of lessons.flatMap(lesson=>lesson.activities||[])){
  const examples=japaneseReadingExamples[activity.id];
  if(!examples)continue;
  activity.audio='';activity.slow_audio='';activity.audio_examples=examples;
 }
 return lessons;
}
