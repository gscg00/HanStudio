// Prepare the current small letter group before asking learners to distinguish it.
// Keep activity IDs and existing audio; never borrow letters from a future group.
export function sequenceAlphabetLessons(lessons){
 const learned=[];
 for(const lesson of lessons){
  if(!/^Alfabeto \d+/.test(lesson.title||'')||lesson.isReview||lesson.isTest)continue;
  const cards=lesson.activities.filter(a=>a.type==='teach_concept');
  if(!cards.length)continue;
  for(const card of cards)if(card.target&&!learned.includes(card.target))learned.push(card.target);
  const questions=lesson.activities.filter(a=>a.type==='listening_choice');
  for(const q of questions){
   if(!learned.includes(q.answer))throw Error(`Respuesta no enseñada: ${q.id}`);
   const position=Math.max(0,(q.options||[]).indexOf(q.answer));
   const alternatives=[...new Set([...(q.options||[]),...cards.map(c=>c.target),...learned])].filter(x=>x!==q.answer&&learned.includes(x)).slice(0,2);
   alternatives.splice(Math.min(position,alternatives.length),0,q.answer);
   q.options=alternatives;
   q.teaching_refs=cards.filter(c=>q.options.includes(c.target)).map(c=>c.id);
  }
  lesson.activities=[...lesson.activities.filter(a=>a.type==='lesson_intro'),...cards,...lesson.activities.filter(a=>a.type!=='lesson_intro'&&a.type!=='teach_concept')];
 }
 return lessons;
}
