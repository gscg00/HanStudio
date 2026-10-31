// Perfil rediseñado: cabecera, tres cifras, calendario de las últimas cinco
// semanas y los ajustes como una lista. Envuelve renderProfile del motor de
// cursos y reordena lo que ya dibuja, para no duplicar los ajustes.
import{JapaneseCourseApp}from'./japanese_course_app.js';
import{dateKey}from'./daily_class.js';
import{planProgress}from'./class_plan.js';

const esc=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const proto=JapaneseCourseApp.prototype,originalRenderProfile=proto.renderProfile;
const WEEKS=5;

// Intensidad de cada día: 0 nada, 1 estudió algo, 2 terminó la clase, 3 terminó y siguió estudiando.
export function studyCalendar({activityDates=[],classDates=[],extraDates=[]},now=new Date()){
  const active=new Set(activityDates),classes=new Set(classDates),extra=new Set(extraDates),days=[];
  const end=new Date(now),start=new Date(now);
  // Empieza en lunes para que cada fila sea una semana.
  start.setDate(start.getDate()-((start.getDay()+6)%7)-7*(WEEKS-1));
  for(const day=new Date(start);day<=end;day.setDate(day.getDate()+1)){
    const key=dateKey(day),level=classes.has(key)?(extra.has(key)?3:2):active.has(key)||extra.has(key)?1:0;
    days.push({key,level});
  }
  return days;
}

Object.assign(proto,{
  async renderProfile(){
    originalRenderProfile.call(this);
    const view=this.root.querySelector('.jp-simple-view');
    if(!view||view.classList.contains('pf-view'))return;
    const daily=this.loadDaily?await this.loadDaily().catch(()=>null):null;
    const words=new Set((daily?.classes||[]).flatMap(entry=>(entry.items||[]).map(item=>item.target))).size;
    const calendar=studyCalendar({activityDates:this.progress.activityDates,classDates:(daily?.classes||[]).map(entry=>entry.completedDate).filter(Boolean),extraDates:daily?.extraStudyDates||[]});
    const studied=calendar.filter(day=>day.level).length,today=dateKey(new Date());
    const progress=planProgress(this.orderedUnits(),{language:this.language,completedLessons:this.progress.completedLessons,state:daily});
    const stats=[[progress.level,'tu nivel'],[progress.done,progress.done===1?'clase terminada':'clases terminadas'],[words,'palabras y frases']];
    const settings=view.querySelector('.jp-study-settings');
    // El límite de repasos era del curso antiguo: el repaso ya forma parte de la clase.
    settings?.querySelector('[data-jp-setting="dailyReviewLimit"]')?.closest('label')?.remove();
    view.classList.add('pf-view');
    view.innerHTML=`<div class="pf-head"><span class="pf-avatar" aria-hidden="true">${esc(this.definition.htmlLang.toUpperCase())}</span><div><h1>${esc(this.definition.name)}</h1><p>Tu avance en este idioma</p></div></div>
      <div class="pf-stats">${stats.map(([value,label])=>`<div><b>${esc(value)}</b><span>${esc(label)}</span></div>`).join('')}</div>
      <section class="pf-card"><div class="pf-card-head"><h2>Últimas ${WEEKS} semanas</h2><small>${studied} día${studied===1?'':'s'} con estudio</small></div><div class="pf-calendar" role="img" aria-label="${studied} días con estudio en las últimas ${WEEKS} semanas">${calendar.map(day=>`<i class="l${day.level}${day.key===today?' today':''}" title="${day.key}"></i>`).join('')}</div></section>`;
    if(settings){
      // La cabecera <header> heredaba la franja oscura del encabezado de la página.
      settings.querySelector(':scope>header')?.replaceWith(Object.assign(document.createElement('h2'),{className:'pf-settings-title',textContent:'Ajustes de estudio'}));
      settings.classList.add('pf-card','pf-settings');
      view.append(settings);
    }
  },
});
