const unique=items=>[...new Set((items||[]).filter(Boolean))];
const dateValue=value=>{const stamp=Date.parse(value||'');return Number.isFinite(stamp)?stamp:0;};
const newer=(a,b)=>dateValue(a?.updatedAt||a?.lastDate||a?.lastStudyDate||a?.lastSeen||a?.completedAt)>=dateValue(b?.updatedAt||b?.lastDate||b?.lastStudyDate||b?.lastSeen||b?.completedAt)?a:b;
const maxScore=(a={},b={})=>Number(a.percentage??a.score??0)>=Number(b.percentage??b.score??0)?a:b;

export function mergeProgressData(local={},remote={}){
  const recent=newer(local,remote)||{},merged={...local,...remote,...recent};
  for(const key of ['completedLessons','unlockedUnits','unlockedLessons','favorites','activityDates'])merged[key]=unique([...(local[key]||[]),...(remote[key]||[])]);
  merged.xp=Math.max(Number(local.xp||0),Number(remote.xp||0));
  merged.lessonScores={};for(const key of unique([...Object.keys(local.lessonScores||{}),...Object.keys(remote.lessonScores||{})]))merged.lessonScores[key]=maxScore(local.lessonScores?.[key],remote.lessonScores?.[key]);
  merged.masteryByItem={};for(const key of unique([...Object.keys(local.masteryByItem||{}),...Object.keys(remote.masteryByItem||{})])){const a=local.masteryByItem?.[key]||{},b=remote.masteryByItem?.[key]||{},last=newer(a,b)||{};merged.masteryByItem[key]={...a,...b,...last,correct:Math.max(Number(a.correct||0),Number(b.correct||0)),wrong:Math.max(Number(a.wrong||0),Number(b.wrong||0)),stage:Number(last.stage||0)};}
  const mistakes=[...(local.mistakes||[]),...(remote.mistakes||[])],mistakeMap=new Map();for(const item of mistakes){const key=item.activityId||item.itemId||JSON.stringify(item),old=mistakeMap.get(key),latest=newer(item,old);if(!old||latest===item)mistakeMap.set(key,item);}merged.mistakes=[...mistakeMap.values()];merged.reviewDue=unique(merged.mistakes.map(item=>item.dueAt));
  const settingsRecent=newer(local.settings||{},remote.settings||{});if(settingsRecent)merged.settings={...settingsRecent};
  merged.streak=calculateStreak(merged.activityDates,local,remote);
  return merged;
}

export function calculateStreak(activityDates=[],local={},remote={}){const days=unique(activityDates).sort();if(!days.length)return Number((newer(local,remote)||{}).streak||0);let streak=1;for(let index=days.length-1;index>0;index--){const current=Date.parse(`${days[index]}T00:00:00Z`),previous=Date.parse(`${days[index-1]}T00:00:00Z`);if(current-previous!==86400000)break;streak++;}return streak;}

export function mergeSnapshots(local=[],remote=[]){const map=new Map(local.map(record=>[record.entityKey,structuredClone(record)]));for(const record of remote){const old=map.get(record.entityKey);if(!old){map.set(record.entityKey,structuredClone(record));continue;}map.set(record.entityKey,{...old,...record,value:mergeProgressData(old.value||{},record.value||{}),updatedAt:[old.updatedAt,record.updatedAt].sort().at(-1)});}return[...map.values()];}
