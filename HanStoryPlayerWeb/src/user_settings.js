import{all,get,put}from'./storage.js';
import{reviewConceptKey}from'./guided_course_logic.js';

export const DEFAULT_DAILY_REVIEW_LIMIT=20;
export const DAILY_REVIEW_LIMIT_OPTIONS=Object.freeze([10,20,30,50,100]);
export const DEFAULT_TTS_RATE=1;
export const TTS_RATE_OPTIONS=Object.freeze([.85,1,1.15]);
export const DEFAULT_READING_AID_MODE='on_demand';
export const READING_AID_MODES=Object.freeze(['on_demand','always']);
export const DEFAULT_THEME='light';
export const THEMES=Object.freeze(['light','dark']);
export const DEFAULT_FEEDBACK_SOUNDS=true;
const localDateKey=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;

const clampReviewLimit=value=>{
  const number=Number(value);
  return DAILY_REVIEW_LIMIT_OPTIONS.includes(number)?number:DEFAULT_DAILY_REVIEW_LIMIT;
};
const clampTtsRate=value=>TTS_RATE_OPTIONS.includes(Number(value))?Number(value):DEFAULT_TTS_RATE;
const clampReadingAidMode=value=>READING_AID_MODES.includes(value)?value:DEFAULT_READING_AID_MODE;
const clampTheme=value=>THEMES.includes(value)?value:DEFAULT_THEME;

export function normalizeUserSettings(value={}){
  return{id:'settings:global',dailyReviewLimit:clampReviewLimit(value.dailyReviewLimit),ttsRate:clampTtsRate(value.ttsRate),readingAidMode:clampReadingAidMode(value.readingAidMode),theme:clampTheme(value.theme),feedbackSounds:value.feedbackSounds!==false,updatedAt:value.updatedAt||''};
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

export function countReviewsCompletedToday(courses,courseId='',now=new Date()){
  const today=localDateKey(now),reviewed=new Set();
  for(const course of courses||[]){
    if(courseId&&course.id!==courseId)continue;
    for(const item of course.mistakes||[]){
      if(!item.lastReviewedAt)continue;
      const reviewedAt=new Date(item.lastReviewedAt);
      if(!Number.isNaN(reviewedAt.valueOf())&&localDateKey(reviewedAt)===today)reviewed.add(`${course.id}:${reviewConceptKey(item)}`);
    }
  }
  return reviewed.size;
}

export async function reviewsCompletedToday(courseId='',now=new Date()){
  const courses=(await all('metadata').catch(()=>[])).filter(value=>value?.id==='jp-guided-progress-v1'||String(value?.id||'').startsWith('guided:'));
  return countReviewsCompletedToday(courses,courseId,now);
}
