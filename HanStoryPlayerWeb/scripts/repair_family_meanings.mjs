import fs from 'node:fs';
const root=new URL('../library/courses/',import.meta.url);
let changed=0;
function rewrite(value){
  if(Array.isArray(value))return value.map(rewrite);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,rewrite(item)]));
  if(typeof value!=='string')return value;
  const next=value.replace(/\bhermana\b(?! menor)/gu,'hermana menor').replace(/\bhermano\b(?! menor)/gu,'hermano menor').replace(/\bhermanos\b(?! menores)/gu,'hermanos menores');
  if(next!==value)changed++;return next;
}
for(const language of ['Japanese','Korean','Chinese']){
  const file=new URL(`${language}/units/a1-1-people.json`,root),raw=fs.readFileSync(file,'utf8');
  const next=JSON.stringify(rewrite(JSON.parse(raw)),null,2)+'\n';
  if(next!==raw)fs.writeFileSync(file,next);
}
console.log(JSON.stringify({changed}));
