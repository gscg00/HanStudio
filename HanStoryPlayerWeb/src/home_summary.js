// Resumen de cada idioma para la pantalla de inicio. Solo lee lo guardado en
// IndexedDB (progreso del curso guiado y estado de la Clase del día), así que
// no hace falta cargar ningún curso para dibujar el inicio.
import{dateKey}from'./daily_class.js';

const PHASES=5;

const yesterdayKey=now=>{const d=new Date(now);d.setDate(d.getDate()-1);return dateKey(d);};

export function languageSummaries(metadataItems,courses,now=new Date()){
  const byId=new Map(metadataItems.map(item=>[item.id,item])),today=dateKey(now),yesterday=yesterdayKey(now);
  return Object.entries(courses).map(([language,course])=>{
    const progress=byId.get(`guided:${course.slug}:v1`)||(language==='Japanese'?byId.get('jp-guided-progress-v1'):null),daily=byId.get(`daily:${course.slug}:v1`);
    const entry=daily?.classes?.at(-1)||null,completed=progress?.completedLessons?.length||0;
    const doneToday=Boolean(entry?.completedDate&&entry.completedDate===today);
    const phasesDone=entry&&!entry.completedDate?Math.min(PHASES,entry.phasesDone?.length||0):entry?PHASES:0;
    // La racha solo sigue viva si estudiaste hoy o ayer.
    const streak=[today,yesterday].includes(progress?.lastStudyDate)?Number(progress.streak)||0:0;
    const started=Boolean(entry||completed);
    return {language,started,classNumber:entry?.number||0,title:entry?.title||'',phasesDone,phases:PHASES,inProgress:Boolean(entry&&!entry.completedDate),doneToday,completed:daily?.totalItems?daily.learnedItems||0:completed,total:daily?.totalItems||daily?.totalLessons||0,streak,activityDates:progress?.activityDates||[],lastDate:daily?.updatedAt||progress?.updatedAt||progress?.lastStudyDate||''};
  });
}

// La clase que conviene mostrar en grande: una a medias, o la del idioma más reciente sin terminar hoy.
export function featuredSummary(summaries){
  const started=summaries.filter(item=>item.started).sort((a,b)=>String(b.lastDate).localeCompare(String(a.lastDate)));
  return started.find(item=>item.inProgress)||started.find(item=>!item.doneToday)||started[0]||null;
}

export const bestStreak=summaries=>Math.max(0,...summaries.map(item=>item.streak));
