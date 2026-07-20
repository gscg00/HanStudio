import{all,get,put}from'./storage.js';

export const DEFAULT_DAILY_REVIEW_LIMIT=20;
export const DAILY_REVIEW_LIMIT_OPTIONS=Object.freeze([10,20,30,50,100]);
const localDateKey=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;

const clampReviewLimit=value=>{
  const number=Number(value);
  return DAILY_REVIEW_LIMIT_OPTIONS.includes(number)?number:DEFAULT_DAILY_REVIEW_LIMIT;
};

export function normalizeUserSettings(value={}){
  return{id:'settings:global',dailyReviewLimit:clampReviewLimit(value.dailyReviewLimit),updatedAt:value.updatedAt||''};
}

export async function loadUserSettings(){
  return normalizeUserSettings(await get('metadata','settings:global').catch(()=>null));
}

export async function saveUserSettings(changes={}){
  const current=await loadUserSettings(),next=normalizeUserSettings({...current,...changes,updatedAt:new Date().toISOString()});
  await put('metadata',next);
  window.dispatchEvent(new CustomEvent('hanstory-settings-changed',{detail:next}));
  return next;
}

export async function reviewsCompletedToday(now=new Date()){
  const today=localDateKey(now),courses=(await all('metadata').catch(()=>[])).filter(value=>value?.id==='jp-guided-progress-v1'||String(value?.id||'').startsWith('guided:'));
  const reviewed=new Set();
  for(const course of courses)for(const item of course.mistakes||[]){
    if(!item.lastReviewedAt)continue;
    const reviewedAt=new Date(item.lastReviewedAt);
    if(!Number.isNaN(reviewedAt.valueOf())&&localDateKey(reviewedAt)===today)reviewed.add(`${course.id}:${item.activityId}`);
  }
  return reviewed.size;
}
