// Prepara un alumno de prueba (solo en local): clases hechas hasta la que cumple `pred`.
export async function seed(lang,dir,pred){
  const P=await import('/src/class_plan.js'),comics=await import(`/src/data/comics/${dir}.js`).catch(()=>null);
  if(comics)P.registerComics(lang,comics.COMIC_SCENES);
  const course=await(await fetch(`/library/courses/${dir}/course.json`)).json(),units=[],readDone=[];
  for(const unit of course.units){const r=await fetch(`/library/courses/${dir}/units/${unit.id}.json`);if(!r.ok)continue;const data=await r.json();units.push({...data,id:unit.id,title:unit.title,description:unit.description});if(P.READING_UNITS.has(unit.id))for(const lesson of data.lessons||[])readDone.push(lesson.id);}
  const map=new Map(units.map(u=>[u.id,u])),specs=P.allClassSpecs(map,{language:lang}),stop=Math.max(0,specs.findIndex(pred)),day=new Date(Date.now()-864e5).toLocaleDateString('en-CA');
  const classes=specs.slice(0,stop).map((spec,i)=>{const r=P.resolveClass(spec,map,lang);return{plan:2,kind:'class',number:i+1,classId:r.id,title:r.title,goal:r.goal,module:r.module,level:r.level,lines:[],items:r.items,lessons:[],phaseIndex:20,phasesDone:[],learnIndex:0,results:{},createdDate:day,completedDate:day};});
  const memory={};classes.forEach((c,i)=>c.items.forEach(it=>memory[it.target]={box:1,due:i>stop-4?day:'2030-01-01'}));
  const db=await new Promise(r=>{const q=indexedDB.open('hanstory-player');q.onsuccess=()=>r(q.result);}),t=db.transaction('metadata','readwrite'),store=t.objectStore('metadata'),slug=dir.toLowerCase();
  store.put({id:`daily:${slug}:v1`,classes,extraStudyDates:[],memory});
  const g=await new Promise(r=>{const q=store.get(`guided:${slug}:v1`);q.onsuccess=()=>r(q.result);});
  store.put({...(g||{id:`guided:${slug}:v1`,language:lang}),completedLessons:readDone,unlockedUnits:course.units.map(u=>u.id)});
  await new Promise(r=>t.oncomplete=r);
  return`${specs[stop]?.title} (#${stop})`;
}
export async function clear(slugs){
  const db=await new Promise(r=>{const q=indexedDB.open('hanstory-player');q.onsuccess=()=>r(q.result);}),t=db.transaction('metadata','readwrite'),store=t.objectStore('metadata');
  for(const slug of slugs){store.delete(`daily:${slug}:v1`);store.delete(`guided:${slug}:v1`);}
  await new Promise(r=>t.oncomplete=r);
}
