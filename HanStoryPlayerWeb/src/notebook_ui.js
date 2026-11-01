// Pestaña Cuaderno: lo aprendido, clase por clase, y un buscador para todo el curso.
import{JapaneseCourseApp}from'./japanese_course_app.js';
import{notebookClasses,searchNotebook}from'./notebook.js';

const esc=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const proto=JapaneseCourseApp.prototype,original={renderRoute:proto.renderRoute,handleClick:proto.handleClick};
const notebookRoute=slug=>new RegExp(`^#/${slug}/notebook`);

Object.assign(proto,{
  notebookRow(item){
    const lang=esc(this.definition.htmlLang);
    return`<li><button data-nb-audio="${esc(item.audio)}" aria-label="Escuchar"><b lang="${lang}" dir="auto">${esc(item.target)}</b>${item.reading?`<small>${esc(item.reading)}</small>`:''}<span>${esc(item.meaning)}</span></button></li>`;
  },
  async renderNotebook(){
    await this.loadDaily();
    this.notebook=notebookClasses(new Map(this.orderedUnits().map(unit=>[unit.id,unit])),{language:this.language,stories:await this.loadClassStories(),state:this.daily});
    const seen=this.notebook.filter(entry=>entry.seen).reverse();
    const classes=seen.map(entry=>`<details class="nb-class"><summary><span>${esc(entry.title)}</span><small>${entry.items.length}</small></summary>${entry.rule?`<p class="nb-rule">${esc(entry.rule)}</p>`:''}<ul class="nb-items">${entry.items.map(item=>this.notebookRow(item)).join('')}</ul></details>`).join('');
    this.shell(`<section class="nb-view"><h1>Cuaderno</h1><label class="nb-search"><span>Buscar en todo el curso</span><input type="search" data-nb-search placeholder="Palabra en español o en ${esc(this.definition.name.toLowerCase())}" autocomplete="off"></label><div class="nb-results" aria-live="polite"></div><div class="nb-seen">${classes?`<h2>Lo que ya viste</h2>${classes}`:'<p class="nb-empty">Aquí se guarda lo que aprendas en cada clase, con su audio y su explicación.</p>'}</div></section>`,'Cuaderno');
    this.root.querySelector('[data-nb-search]')?.addEventListener('input',event=>this.showNotebookResults(event.target.value));
  },
  showNotebookResults(query){
    const{items,rules}=searchNotebook(this.notebook||[],query),results=this.root.querySelector('.nb-results'),seen=this.root.querySelector('.nb-seen');
    seen.hidden=Boolean(query.trim());
    if(!query.trim()){results.innerHTML='';return;}
    const row=item=>this.notebookRow(item).replace('</button>',`<em>${item.seen?esc(item.classTitle):'Todavía no la has visto'}</em></button>`);
    results.innerHTML=items.length||rules.length?`<ul class="nb-items">${items.map(row).join('')}</ul>${rules.map(entry=>`<article class="nb-rule-hit"><h3>${esc(entry.title)}</h3><p>${esc(entry.rule)}</p></article>`).join('')}`:'<p class="nb-empty">No está en el curso.</p>';
  },
  async renderRoute(){
    if(!(this.active&&notebookRoute(this.definition.slug).test(location.hash)))return original.renderRoute.call(this);
    this.root.className='japanese-guided-course guided-course';
    this.root.style.setProperty('--jp-orange',this.definition.accent);
    this.root.innerHTML='<div class="jp-loading compact"><i></i></div>';
    await this.renderNotebook();
    window.scrollTo({top:document.querySelector('main')?.offsetTop||0,behavior:'auto'});
  },
  handleClick(event){
    const audio=event.target.closest('[data-nb-audio]');
    if(!audio)return original.handleClick.call(this,event);
    return this.playKeyAudio(audio.dataset.nbAudio,'normal',false);
  },
});
