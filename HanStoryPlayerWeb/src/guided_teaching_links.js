const teaching=new Set(['teach_concept','teach_word','teach_pattern','teach_kanji','teach_kana']);

// Explicit links must point to teaching already presented in the same lesson.
// An unrelated or future card cannot silence a sequence warning.
export function resolveTeachingLinks(activities,index){
 const refs=activities[index]?.teaching_refs;
 if(refs===undefined)return{declared:false,sources:[],invalid:[]};
 if(!Array.isArray(refs)||!refs.length)return{declared:true,sources:[],invalid:['invalid_teaching_refs']};
 const sources=[],invalid=[];
 for(const id of new Set(refs)){
  const source=activities.slice(0,index).find(a=>a.id===id&&teaching.has(a.type));
  if(source)sources.push(source);else invalid.push(id);
 }
 return{declared:true,sources,invalid};
}
