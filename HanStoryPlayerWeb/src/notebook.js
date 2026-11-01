// Cuaderno: todo lo que el curso enseña, para consultarlo como un diccionario y una
// gramática propios. Módulo puro (sin DOM) para poder probarlo con node:test.
import{allClassSpecs,doneClassIds,resolveClass}from'./class_plan.js';

const norm=value=>String(value??'').normalize('NFD').replace(/\p{Mn}/gu,'').toLowerCase().replace(/[¿¡?!.,;:()«»"']/g,' ').replace(/\s+/g,' ').trim();

// Una entrada por clase, en orden. seen: ya la hiciste.
export function notebookClasses(units,{language='',stories=null,state=null}={}){
  const done=doneClassIds(state);
  return allClassSpecs(units,{language,stories}).filter(spec=>!spec.kind).map((spec,index)=>{
    const{id,title,level,items,rule}=resolveClass(spec,units,language);
    return{id,number:index+1,title,level,items,rule,seen:done.has(id)};
  });
}

// Busca en las dos direcciones (idioma y español) y en las explicaciones de gramática.
export function searchNotebook(classes,query,{limit=40}={}){
  const wanted=norm(query);
  if(!wanted)return{items:[],rules:[]};
  const hit=text=>norm(text).includes(wanted),seen=new Set(),items=[];
  for(const entry of classes)for(const item of entry.items){
    if((hit(item.target)||hit(item.meaning))&&!seen.has(item.target)){seen.add(item.target);items.push({...item,classTitle:entry.title,seen:entry.seen});}
  }
  // Primero lo que ya viste y lo que empieza por lo buscado: es lo que más se consulta.
  items.sort((a,b)=>Number(b.seen)-Number(a.seen)||Number(norm(b.target).startsWith(wanted)||norm(b.meaning).startsWith(wanted))-Number(norm(a.target).startsWith(wanted)||norm(a.meaning).startsWith(wanted)));
  return{items:items.slice(0,limit),rules:classes.filter(entry=>entry.rule&&hit(entry.rule)).slice(0,6)};
}
