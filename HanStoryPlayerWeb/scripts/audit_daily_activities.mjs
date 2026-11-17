// Revisor de los ejercicios que la clase del día genera al momento, en los 10 idiomas.
// Busca lo que confunde a un alumno: dos opciones correctas, opciones repetidas, la
// respuesta escrita en el enunciado o un significado vacío. Uso: node scripts/audit_daily_activities.mjs
import fs from 'node:fs';
import{allClassSpecs,resolveClass,registerComics}from'../src/class_plan.js';
import{optionKey,buildLearnSet,buildClassPractice,buildClassClose,buildReviewSet,buildExamSet,buildWordChecks,recallChoice,listenMeaning}from'../src/daily_class.js';
import{WORD_PACKS}from'../src/data/word_packs.js';

const LANGUAGES=['English','French','German','Italian','Portuguese','Japanese','Korean','Russian','Chinese','Arabic'];
const load=language=>JSON.parse(fs.readFileSync(`library/courses/${language}/course.json`,'utf8')).units.map(unit=>{const path=`library/courses/${language}/units/${unit.id}.json`;return fs.existsSync(path)?{...JSON.parse(fs.readFileSync(path,'utf8')),id:unit.id,title:unit.title,description:unit.description}:null;}).filter(Boolean);
// Mismo criterio que la clase: sin paréntesis, signos ni mayúsculas, con acentos.
const norm=optionKey;
const overlaps=(a,b)=>optionKey(a)===optionKey(b);

export function auditActivity(activity,items){
  const problems=[],options=(activity.options||[]).map(String);
  if(options.length&&!['build_with_blocks'].includes(activity.type)){
    if(new Set(options.map(norm)).size<options.length)problems.push('opciones repetidas');
    if(activity.answer&&!options.includes(activity.answer))problems.push('respuesta fuera de las opciones');
  }
  if(activity.dailyKind==='recall'){
    const answerMeaning=activity.target,others=options.filter(option=>option!==activity.answer);
    for(const option of others){const item=items.find(candidate=>candidate.target===option);if(item&&overlaps(item.meaning,answerMeaning))problems.push(`dos correctas: «${option}» también significa «${item.meaning}»`);}
  }
  if(['listen','picture'].includes(activity.dailyKind)){
    for(const option of options.filter(option=>option!==activity.answer))if(overlaps(option,activity.answer))problems.push(`dos correctas: «${option}» y «${activity.answer}»`);
  }
  if(activity.type==='teach_concept'&&!activity.rule&&!activity.task&&!String(activity.explanation||activity.meaning||'').trim())problems.push('tarjeta sin significado');
  return problems;
}

if(import.meta.url===`file://${process.argv[1]}`){
  const report={};let total=0;
  for(const language of LANGUAGES){
    const comicFile=`src/data/comics/${language}.js`;
    if(fs.existsSync(comicFile))registerComics(language,(await import(`../${comicFile}`)).COMIC_SCENES);
    const ordered=load(language),units=new Map(ordered.map(unit=>[unit.id,unit])),specs=allClassSpecs(units,{language});
    const seen=[],found=new Map();
    specs.forEach((spec,index)=>{
      const entry=resolveClass(spec,units,language),items=entry.items||[];
      seen.push(...items);
      const pool=[...seen],seed=`${index}`;
      const sets=[...buildLearnSet(items,{teach:item=>({type:'teach_concept',meaning:item.meaning,explanation:item.meaning}),rule:entry.rule,seed}),...buildClassPractice(items,pool,{seed,language}),...buildClassClose({...entry,items},pool,{seed,typing:'x'}),...(entry.stage==='exam'?buildExamSet(items,pool,{seed,language}):[])];
      for(const activity of sets)for(const problem of auditActivity(activity,pool)){total++;const key=`${problem.split(':')[0]}`;if(!found.has(key))found.set(key,[]);found.get(key).push(`${spec.id}: ${activity.prompt} → ${problem}`);}
    });
    const pack=WORD_PACKS[language]||[];
    for(let index=0;index<pack.length;index+=12){const day=pack.slice(index,index+12);for(const activity of buildWordChecks(day,[...seen,...pack.slice(0,index+12)],{seed:`w${index}`}))for(const problem of auditActivity(activity,[...seen,...pack])){total++;const key=`vocabulario: ${problem.split(':')[0]}`;if(!found.has(key))found.set(key,[]);found.get(key).push(`${activity.prompt} → ${problem}`);}}
    report[language]=Object.fromEntries([...found].map(([key,list])=>[key,{count:list.length,examples:list.slice(0,4)}]));
  }
  console.log(JSON.stringify(report,null,1));console.log('total',total);
}
