// Pestaña Videos: lecciones en video por tema para cada idioma.
//   · Lo básico y Situaciones salen de library/courses/<Idioma>/videos.json
//     (scripts/build_topic_videos.mjs), con el material y los audios del curso.
//   · De la calle (slang, dialectos, préstamos) sale de street.json cuando existe.
// Usa el mismo reproductor y los mismos estilos que el video de repaso diario.
import{JapaneseCourseApp}from'./japanese_course_app.js';
import{illustrationFor,sceneSvg}from'./data/illustrations.js';
import{dateKey}from'./daily_class.js';

const esc=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const proto=JapaneseCourseApp.prototype,original={renderRoute:proto.renderRoute};
const CATEGORIES=[
  {id:'basico',title:'Lo básico',note:'Lo primero que se aprende: letras, saludos, números, colores…'},
  {id:'situaciones',title:'Situaciones',note:'Escenas cortas de la vida diaria, frase por frase.'},
  {id:'calle',title:'De la calle',note:'Lo que se oye en la calle y en internet, con su nivel y sus fuentes.'},
];
const videoRoute=slug=>new RegExp(`^#/${slug}/videos(?:/([^/?]+))?`);
const watchedId=slug=>`videos:${slug}:v1`;
const SOURCE_NAMES={'opendict.korean.go.kr':'우리말샘','stdict.korean.go.kr':'표준국어대사전','www.korean.go.kr':'국립국어원','busan.com':'부산일보','busan.go.kr':'부산광역시','kookje.co.kr':'국제신문','imaeil.com':'매일신문','segye.com':'세계일보','ko.wikipedia.org':'위키백과','mediahub.seoul.go.kr':'서울시 미디어허브','dt.co.kr':'디지털타임스'};
// «우리말샘 · 단디» en lugar de la URL completa.
export function sourceLabel(url){
  try{const link=new URL(url),host=link.hostname.replace(/^www\./,''),name=Object.entries(SOURCE_NAMES).find(([domain])=>host===domain.replace(/^www\./,'')||host.endsWith(`.${domain}`))?.[1]||host,word=link.searchParams.get('query')||link.searchParams.get('searchKeyword')||decodeURIComponent(link.pathname.split('/').pop()||'').replace(/_/g,' ');return word&&!/view|\.(do|php|html)$|^\d+$/.test(word)?`${name} · ${word}`:name;}catch{return url;}
}
const format=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

// Datos de un video para la línea de tiempo: título, cierre y cifras en español.
export function topicTimelineOptions(topic,languageName){
  const teach=topic.mode!=='dialogue',count=topic.items.length,unit=topic.id==='letras'?' letras':teach?(count===1?' palabra':' palabras'):(count===1?' frase':' frases');
  return {
    mode:teach?'teach':'quiz',items:topic.items,languageName,
    heading:topic.title.toUpperCase(),unitTitle:topic.subtitle||`${languageName} · ${CATEGORIES.find(category=>category.id===topic.category)?.title||''}`,
    eyebrow:'VIDEO DEL TEMA',kit:'KIT DEL TEMA',tally:`${count}${unit}`,tallyUnit:unit,closing:'Vuelve a verlo mañana y se te quedará.',tagline:teach?'¡Mira, escucha y repite!':'¿Entiendes la escena?',
    titleSpeech:`${topic.title}.`,endSpeech:'¡Muy bien! Vuelve a verlo mañana.',
    voiceFor:topic.mode==='dialogue'?item=>item.gender==='m'?'tl-m':'tl-f':null,
  };
}

Object.assign(proto,{
  async loadVideoTopics(){
    if(this.videoTopics)return this.videoTopics;
    const base=`library/courses/${this.definition.directory}`;
    const [videos,street]=await Promise.all([this.fetch(`${base}/videos.json`).catch(()=>null),this.fetch(`${base}/street.json`).catch(()=>null)]);
    this.videoTopics=[...(videos?.topics||[]),...(street?.topics||[]).map(topic=>({...topic,category:'calle'}))];
    return this.videoTopics;
  },
  async loadWatched(){
    const saved=await this.get('metadata',watchedId(this.definition.slug)).catch(()=>null);
    return saved?.watched||{};
  },

  async renderVideos(){
    const [topics,watched]=await Promise.all([this.loadVideoTopics(),this.loadWatched()]);
    const card=topic=>{const seen=watched[topic.id],teach=topic.mode!=='dialogue';return`<button class="vd-card ${seen?'seen':''}" data-vd-topic="${esc(topic.id)}"><span class="vd-thumb" aria-hidden="true">${(sceneSvg(topic.scene)||sceneSvg('generic')).replace('<svg ','<svg preserveAspectRatio="xMidYMid slice" ')}</span><span class="vd-info"><strong>${esc(topic.title)}</strong><small>${topic.subtitle?`${esc(topic.subtitle)} · `:''}${topic.items.length} ${topic.id==='letras'?'letras':teach?'palabras':'frases'}${topic.level&&!topic.subtitle?` · ${esc(topic.level)}`:''}</small>${seen?'<em>Visto</em>':''}</span></button>`;};
    const sections=CATEGORIES.map(category=>{const list=topics.filter(topic=>topic.category===category.id);return list.length?`<section class="vd-section"><div class="vd-section-head"><h2>${esc(category.title)}</h2><p>${esc(category.note)}</p></div><div class="vd-grid ${category.id==='basico'?'':'vd-list'}">${list.map(card).join('')}</div></section>`:'';}).join('');
    this.shell(`<section class="vd-view"><div class="dc-title"><span class="dc-eyebrow">${esc(this.definition.name.toUpperCase())} · VIDEOS</span><h1>Aprende viendo</h1><p>Mira, escucha y repite. Cada video dura unos minutos.</p></div>${sections||'<p class="vd-empty">Todavía no hay videos para este idioma.</p>'}</section>`,'Videos');
  },

  async renderTopicVideo(id){
    const topics=await this.loadVideoTopics(),topic=topics.find(item=>item.id===id);
    if(!topic)return this.renderVideos();
    const [{buildRecapTimeline},{createRecapPlayer},{RECAP_STYLES,styleIndexForDay,loadRecapStyle}]=await Promise.all([import('./recap/recap_timeline.js'),import('./recap/recap_player.js'),import('./recap/styles/index.js')]);
    // Cada tema cambia de estilo cada día.
    const chosen=RECAP_STYLES[styleIndexForDay(new Date(),`${this.definition.slug}|${topic.id}`)].id;
    const notes=topic.notes?`<details class="vd-notes"><summary>Notas y fuentes</summary><p>${esc(topic.notes)}</p>${(topic.sources||[]).length?`<ul>${topic.sources.map(url=>`<li><a href="${esc(url)}" target="_blank" rel="noopener">${esc(sourceLabel(url))}</a></li>`).join('')}</ul>`:''}</details>`:'';
    const list=`<details class="vd-notes"><summary>Ver todo lo del video</summary><ul class="vd-items">${topic.items.map(item=>`<li><b lang="${esc(this.definition.htmlLang)}" dir="auto">${esc(item.target)}</b><span>${esc(item.meaning)}</span>${item.note?`<small>${esc(item.note)}</small>`:''}</li>`).join('')}</ul></details>`;
    this.shell(`<section class="dc-recap vd-player"><div class="dc-recap-head"><div><span class="dc-eyebrow">${esc(CATEGORIES.find(category=>category.id===topic.category)?.title.toUpperCase()||'VIDEO')}</span><h1>${esc(topic.title)}</h1><p>${topic.mode==='dialogue'?'Escucha cada frase, piensa qué significa y comprueba. Repítela en voz alta.':'Mira, escucha y repite en voz alta cada palabra.'} Los subtítulos están en CC.</p></div></div>
      <div class="dc-recap-stage"><canvas class="dc-recap-canvas" aria-label="Video: ${esc(topic.title)}"></canvas><div class="dc-recap-loading">Preparando el video…</div></div>
      <div class="dc-recap-controls"><button data-dc-action="recap-prev" aria-label="Anterior">⏮</button><button class="primary" data-dc-action="recap-play" aria-label="Reproducir">▶</button><button data-dc-action="recap-next" aria-label="Siguiente">⏭</button><input type="range" class="dc-recap-seek" min="0" max="1000" value="0" aria-label="Posición"><span class="dc-recap-time">0:00</span><button class="dc-recap-toggle" data-dc-action="recap-cc" aria-pressed="false" title="Subtítulos">CC</button><button class="dc-recap-toggle on" data-dc-action="recap-sound" aria-pressed="true" title="Efectos de sonido">♪</button><button data-dc-action="recap-full" aria-label="Pantalla completa">⛶</button></div>
      ${list}${notes}<button class="dc-link" data-jp-route="videos">Volver a Videos</button></section>`,'Videos');
    const canvas=this.root.querySelector('.dc-recap-canvas'),style=await loadRecapStyle(chosen);
    const timeline=buildRecapTimeline(topicTimelineOptions(topic,this.definition.name));
    const keys=new Map(topic.items.map(item=>[item.target,item.audio||item.target]));
    const courseAudio=text=>{const key=keys.get(text)||text,path=this.audioManifest?.[key]||this.audioManifest?.[String(key).replace(/[.!?。！？]+$/,'')]||topic.audio?.[key];return path?this.url(path.startsWith('library/')?path:`library/courses/${this.definition.directory}/${path}`):null;};
    const narrator=await this.loadNarratorAudio();
    let last='',marked=false;
    this.recapPlayer?.destroy();
    this.recapPlayer=await createRecapPlayer({canvas,style,timeline,languageName:this.definition.name,audioUrlFor:(text,lang)=>lang==='tl'?courseAudio(text):narrator(text),langCode:this.definition.languageCode||this.definition.htmlLang,pictureFor:illustrationFor,sceneSvg:sceneSvg(topic.scene),onState:state=>{
      // Se marca como visto al llegar al final.
      if(state.ended&&!marked){marked=true;this.markWatched(topic.id);}
      const key=`${Math.floor(state.t*4)}|${state.playing}|${state.ended}`;if(key===last)return;last=key;
      const seek=this.root.querySelector('.dc-recap-seek'),play=this.root.querySelector('[data-dc-action="recap-play"]'),time=this.root.querySelector('.dc-recap-time');
      if(seek&&document.activeElement!==seek)seek.value=String(Math.round(state.t/state.duration*1000));
      if(play){play.textContent=state.playing?'⏸':state.ended?'↺':'▶';play.setAttribute('aria-label',state.playing?'Pausar':'Reproducir');}
      if(time)time.textContent=`${format(state.t)} / ${format(state.duration)}`;
    }});
    this.root.querySelector('.dc-recap-loading')?.remove();
    const seek=this.root.querySelector('.dc-recap-seek');
    seek?.addEventListener('input',()=>this.recapPlayer?.seek(Number(seek.value)/1000*timeline.duration));
  },
  async markWatched(id){
    const watched=await this.loadWatched();
    watched[id]=dateKey(new Date());
    await this.put('metadata',{id:watchedId(this.definition.slug),watched}).catch(()=>{});
  },

  async renderRoute(){
    const match=this.active&&location.hash.match(videoRoute(this.definition.slug));
    if(!match)return original.renderRoute.call(this);
    this.root.className='japanese-guided-course guided-course';
    this.root.style.setProperty('--jp-orange',this.definition.accent);
    this.root.innerHTML='<div class="jp-loading compact"><i></i></div>';
    await(match[1]?this.renderTopicVideo(decodeURIComponent(match[1])):this.renderVideos());
    window.scrollTo({top:document.querySelector('main')?.offsetTop||0,behavior:'auto'});
  },
});

// Las tarjetas abren su video con una ruta propia, para poder volver atrás.
document.addEventListener('click',event=>{
  const card=event.target.closest('[data-vd-topic]');
  if(!card)return;
  const slug=location.hash.split('/')[1];
  if(slug)location.hash=`#/${slug}/videos/${encodeURIComponent(card.dataset.vdTopic)}`;
});
