import fs from 'node:fs';
const languages=['Arabic','Chinese','English','French','German','Italian','Japanese','Korean','Portuguese','Russian'];
const order=(id,options,answer)=>{
  if(options.length<2||!options.includes(answer))return options;
  const suffix=id.match(/-([a-z]|\d+)-question$/u)?.[1];
  let seed=/^[a-z]$/u.test(suffix||'')?suffix.codePointAt(0)-96:Number.parseInt(suffix,10)||0;
  if(!seed)for(const char of id)seed=(seed*31+char.codePointAt(0))>>>0;
  const position=seed%options.length,rest=options.filter(option=>option!==answer);
  rest.splice(position,0,answer);return rest;
};
let activities=0;
for(const language of languages){
  const unitName=language==='Korean'?'hangul-foundations':'reading-foundations';
  const file=new URL(`../library/courses/${language}/units/${unitName}.json`,import.meta.url);
  const unit=JSON.parse(fs.readFileSync(file,'utf8'));
  for(const lesson of unit.lessons||[])for(const activity of lesson.activities||[]){
    if(!['listening_choice','select_translation'].includes(activity.type)||!Array.isArray(activity.options)||activity.options.length<2)continue;
    if(activity.option_order_version===3)continue;
    activity.options=order(activity.id,activity.options,activity.answer);
    activity.option_order_version=3;activities++;
  }
  fs.writeFileSync(file,JSON.stringify(unit,null,2)+'\n');
}
console.log(JSON.stringify({activities}));
