import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const root=new URL('../',import.meta.url);
// Editorially reviewed shared forms. Not a rule that matching text is correct.
const shared={
 English:'no|hotel|taxi|internet|Australia|hospital|cereal|taco|pasta|jeans|picnic|plan',
 French:'venir|gris|café|kilo|taxi|moto|internet|dormir|venir de|bien|sociable|La',
 German:'Plan',
 Italian:'uno|no|persona|casa|padre|madre|mano|farmacia|cura|libro|verde|rosa|vino|pera|uva|pasta|carne|pollo|poco|tanto|litro|centro|biblioteca|museo|teatro|bar|metro|taxi|moto|minuto|primavera|aula|maestro|maestra|banco|internet|foto|lago|cielo|medicina|alto',
 Portuguese:'ser|estar|ir|querer|poder|casado|amigo|amiga|gente|nariz|boca|dedo|médico|hospital|consulta|casa|mesa|cama|sofá|papel|bolsa|camisa|vestido|azul|verde|rosa|cinco|seis|alimento|arroz|fruta|banana|carne|sopa|café|comprar|vender|mercado|barato|caro|litro|menos|todo|cada|cesta|pedido|fila|oferta|peso|suficiente|resto|centro|avenida|parque|bicicleta|tarde|semana|sábado|domingo|abril|agosto|sol|calor|teclado|internet|foto|flor|mar|campo|comer|beber|dormir|esperar|abrir|descansar|feliz|triste|porque|Por favor.|país|antes de dormir|Comemos juntos.|banco|metro|destino|garganta|hora|lugar|finalmente|próximo|reservar|decidir|igual|diferente|alto|rápido|permitido|reserva|recibo|claro'
};
const names={French:['Camille','Jérôme','Jérôme Lafarge','Curitiba'],German:['Lina','Elias','Lina Berger','Berger','Anna','Martin','Noah']};
const notes={
 French:{'venir de':'En esta entrada, venir de expresa origen o procedencia. Delante de un infinitivo también puede expresar una acción recién terminada: acabar de hacer algo. El complemento permite distinguir ambos usos.','La':'Aquí La es el artículo definido femenino singular la. La mayúscula inicial no cambia esa función; no se está enseñando el nombre de una nota musical.'},
 Italian:{cura:'En este ejemplo, cura se refiere al tratamiento o cuidado para recuperar la salud. No confundas este sentido con el español el cura, que designa a un sacerdote.'}
};
for(const language of Object.keys(shared)){
 const dir=new URL(`library/courses/${language}/`,root),course=JSON.parse(fs.readFileSync(new URL('course.json',dir),'utf8'));
 for(const ref of course.units){
  const file=new URL(ref.manifest,dir),raw=fs.readFileSync(file,'utf8'),unit=JSON.parse(raw);
  for(const lesson of unit.lessons)for(const a of lesson.activities){
   const form=a.target,meaning=a.type==='select_translation'&&/^¿Qué significa/.test(a.prompt||'');
   if(names[language]?.includes(form)&&a.type.startsWith('teach_')){
    a.usage_note='Es un nombre propio: conserva su escritura y escucha su pronunciación. No es una palabra común que debas traducir.';
   }
   if(notes[language]?.[form]&&(a.type.startsWith('teach_')||meaning))a.usage_note=notes[language][form];
   if(names[language]?.includes(form)&&meaning){
    a.prompt=`¿Qué representa «${form}» en este material?`;
    const explanation=form==='Curitiba'?'Un nombre de ciudad':`Un nombre propio: ${form}`;
    a.options=a.options.map(option=>option===a.answer?explanation:option);a.answer=explanation;
    a.explanation='Es un nombre propio. En esta actividad se conserva su escritura, no se traduce como una palabra común.';
   }
   if(language==='German'&&form==='B, E, R, G, E, R.'&&meaning){
    a.prompt='¿Qué representa esta secuencia de letras?';
    a.options=a.options.map(option=>option===a.answer?'El deletreo de Berger':option);
    a.answer='El deletreo de Berger';a.explanation='Las letras, leídas en orden, forman el apellido Berger. El audio pronuncia sus nombres en alemán.';
   }
  }
  const next=JSON.stringify(unit,null,2)+'\n';if(next!==raw)fs.writeFileSync(file,next);
 }
}
const report=JSON.parse(execFileSync(process.execPath,[new URL('scripts/audit_guided_courses.mjs',root).pathname],{maxBuffer:16*1024*1024}));
const reviewed=[],unresolved=[];
for(const issue of report.issues.filter(i=>['identity_translation','reviewed_identity_translation'].includes(i.code))){
 const unit=JSON.parse(fs.readFileSync(new URL(`library/courses/${issue.language}/units/${issue.unitId}.json`,root),'utf8'));
 const activity=unit.lessons.find(l=>l.id===issue.lessonId).activities.find(a=>a.id===issue.activityId);
 const row={language:issue.language,unitId:issue.unitId,activityId:issue.activityId,prompt:activity.prompt,target:activity.target,answer:activity.answer};
 if(shared[issue.language]?.split('|').includes(activity.target))reviewed.push({...row,classification:'shared_form',note:notes[issue.language]?.[activity.target]||'La forma española coincide en al menos el sentido presentado. No implica identidad de todos los usos ni de la pronunciación.'});
 else unresolved.push(row);
}
fs.writeFileSync(new URL('course-authoring/qa_identity_review.json',root),JSON.stringify({reviewed,unresolved,scope:'Revisión editorial de coincidencias concretas. Sin certificación externa de todo el catálogo.'},null,2)+'\n');
console.log({reviewed:reviewed.length,unresolved:unresolved.length});
