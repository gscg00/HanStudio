// Estilos del video de repaso. Se cargan bajo demanda y rotan por número de
// clase, así cada día el repaso tiene otro aspecto.
export const RECAP_STYLES=[
  {id:'whiteboard',name:'Pizarra blanca',load:()=>import('./whiteboard.js')},
  {id:'kawaii',name:'Anime kawaii',load:()=>import('./kawaii.js')},
  {id:'shadow',name:'Teatro de sombras',load:()=>import('./shadow.js')},
  {id:'techglow',name:'Neón tecnológico',load:()=>import('./techglow.js')},
  {id:'papercraft',name:'Maqueta de papel',load:()=>import('./papercraft.js')},
  {id:'ukiyoe',name:'Grabado ukiyo-e',load:()=>import('./ukiyoe.js')},
  {id:'origami',name:'Origami',load:()=>import('./origami.js')},
  {id:'noir',name:'Cine negro',load:()=>import('./noir.js')},
  {id:'halftone',name:'Cómic pop',load:()=>import('./halftone.js')},
  {id:'claymation',name:'Plastilina',load:()=>import('./claymation.js')},
];

export const styleIndexForClass=number=>((Math.max(1,number)-1)%RECAP_STYLES.length);

export async function loadRecapStyle(id){
  const entry=RECAP_STYLES.find(style=>style.id===id)||RECAP_STYLES[0];
  return (await entry.load()).default;
}
