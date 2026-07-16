import{all,get,put,remove}from'./storage.js';

const JP_ID='jp-guided-progress-v1';
const syncable=(store,value)=>store==='progress'||(store==='metadata'&&(value?.id===JP_ID||String(value?.id||'').startsWith('zero:')||value?.id==='settings:global'));
export function entityKeyFor(store,value){if(store==='progress'){const book=String(value.book||value.id||'').split(':Frases')[0];return book.startsWith('topic:')?book:`book:${book}`;}if(value.id===JP_ID)return'course:japanese';if(String(value.id).startsWith('zero:'))return`course:${String(value.id).slice(5).toLowerCase()}`;return'settings:global';}
export function recordFromWrite(store,value){if(!syncable(store,value))return null;return{entityKey:entityKeyFor(store,value),store,id:value.id,value:structuredClone(value),updatedAt:value.lastDate||value.updatedAt||value.lastStudyDate||new Date().toISOString()};}

export async function readSnapshot(){const progress=(await all('progress')).map(value=>recordFromWrite('progress',value));const metadata=(await all('metadata')).filter(value=>syncable('metadata',value)).map(value=>recordFromWrite('metadata',value));return[...progress,...metadata].filter(Boolean);}
export async function writeSnapshot(records,{clear=true,sync=false}={}){if(clear)await clearSnapshot();for(const record of records||[])await put(record.store,record.value,{sync});}
export async function clearSnapshot(){for(const item of await all('progress'))await remove('progress',item.id,{sync:false});for(const item of(await all('metadata')).filter(value=>syncable('metadata',value)))await remove('metadata',item.id,{sync:false});}
export async function saveBackup(label,records=await readSnapshot()){const backup={id:`backup:${label}:${new Date().toISOString()}`,label,createdAt:new Date().toISOString(),records};await put('progressBackups',backup,{sync:false});return backup;}
export async function saveOwnerSnapshot(owner,records=await readSnapshot()){return put('progressBackups',{id:`owner:${owner}`,label:owner,createdAt:new Date().toISOString(),records},{sync:false});}
export async function ownerSnapshot(owner){return(await get('progressBackups',`owner:${owner}`))?.records||[];}
export async function progressSummary(records=await readSnapshot()){let xp=0,completed=new Set(),latest='';for(const record of records){xp=Math.max(xp,Number(record.value?.xp||0));for(const id of record.value?.completedLessons||[])completed.add(id);const date=record.updatedAt||record.value?.lastDate||record.value?.lastStudyDate||'';if(date>latest)latest=date;}return{xp,completedLessons:completed.size,lastActivity:latest||'Sin actividad'};}
export async function exportProgress(){return{schemaVersion:1,exportedAt:new Date().toISOString(),records:await readSnapshot()};}
export function validateImport(payload){if(!payload||payload.schemaVersion!==1||!Array.isArray(payload.records))throw new Error('El archivo no contiene un respaldo compatible.');for(const record of payload.records)if(!record.entityKey||!['progress','metadata'].includes(record.store)||!record.id||!record.value||record.value.id!==record.id)throw new Error('El respaldo está incompleto o contiene datos no permitidos.');return payload.records;}
