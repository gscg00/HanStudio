import {resolveTeachingLinks} from './guided_teaching_links.js';

export function retryWithTeaching(lesson,errors){
 const result=[],seen=new Set();
 for(const error of errors){
  const activity=error.activity;
  if(!activity)continue;
  const index=lesson.activities.findIndex(a=>a.id===activity.id);
  const links=index>=0?resolveTeachingLinks(lesson.activities,index):{sources:[],invalid:[]};
  if(!links.invalid.length)for(const source of links.sources){
   if(!seen.has(source.id)){result.push(source);seen.add(source.id);}
  }
  if(!seen.has(activity.id)){result.push(activity);seen.add(activity.id);}
 }
 return result;
}
