export function sequenceKoreanVowels(lessons){
 const learned=new Set();
 for(const lesson of lessons){
  if(!/^korean-hangul-00-vowels-(vertical|horizontal)$/.test(lesson.id))continue;
  const cards=lesson.activities.filter(a=>a.type==='teach_concept');
  for(const card of cards)learned.add(card.audio);
  for(const question of lesson.activities.filter(a=>a.type==='listening_choice')){
   const position=question.options.indexOf(question.answer);
   const options=[...new Set([...question.options,...cards.map(c=>c.audio)])].filter(x=>x!==question.answer&&learned.has(x)).slice(0,2);
   options.splice(Math.max(0,Math.min(position,options.length)),0,question.answer);
   question.options=options;
   question.prompt='Escucha y elige la sílaba que oyes';
   question.teaching_refs=cards.filter(c=>options.includes(c.audio)).map(c=>c.id);
  }
  const layout=lesson.activities.find(a=>a.type==='select_translation'&&a.id.endsWith('-layout'));
  if(layout){const model=cards.find(c=>c.audio===(lesson.id.endsWith('-vertical')?'아':'우'));if(model){layout.target=model.target;layout.audio=model.audio;layout.slow_audio=model.slow_audio||model.audio;}}
  lesson.activities=[...lesson.activities.filter(a=>a.type==='lesson_intro'),...cards,...lesson.activities.filter(a=>!['lesson_intro','teach_concept'].includes(a.type))];
 }
 return lessons;
}
