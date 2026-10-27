// Ilustraciones 2D (SVG) para el método imagen + sonido. Se indexan por el
// significado en español, así sirven para todos los idiomas del curso.
// Paleta y trazo comunes para que todo parezca del mismo libro ilustrado.

const INK='#1f3a33',CREAM='#f6e7cf',GREEN='#2f6b5a',ORANGE='#d96c3d',YELLOW='#f2c14e',SKY='#9cc9d9',PINK='#e8a0a8',BROWN='#9a6b4a',GREY='#c9c3b8',SKIN='#f1c7a1',WHITE='#fffdf8',RED='#d2483f',BLUE='#4c7fb8',PURPLE='#8a63a8';
const S=`stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;

const icon=body=>`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img"><ellipse cx="50" cy="92" rx="30" ry="4" fill="${INK}" opacity=".12"/><g ${S}>${body}</g></svg>`;
const scene=body=>`<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg" role="img"><g ${S}>${body}</g></svg>`;

// Personaje sencillo y reutilizable.
function person({x=50,y=0,s=1,hair=INK,shirt=ORANGE,skin=SKIN,long=false,skirt=null,beard=false,grey=false,kid=false,cap=null,coat=null,extra=''}={}){
  const k=kid?.78:1,h=grey?GREY:hair;
  return `<g transform="translate(${x} ${y}) scale(${s*k}) translate(-50 ${kid?28:0})">
    ${long?`<path d="M33 30 Q32 62 40 66 L60 66 Q68 62 67 30 Z" fill="${h}"/>`:''}
    <path d="M30 92 L32 66 Q34 56 50 56 Q66 56 68 66 L70 92 Z" fill="${coat||shirt}"/>
    ${skirt?`<path d="M34 78 L66 78 L70 92 L30 92 Z" fill="${skirt}"/>`:''}
    <circle cx="50" cy="36" r="16" fill="${skin}"/>
    <path d="M34 34 Q36 18 50 18 Q64 18 66 34 Q58 26 50 28 Q42 26 34 34 Z" fill="${h}"/>
    ${cap?`<path d="M33 27 Q50 10 67 27 Z" fill="${cap}"/><path d="M60 27 L74 29" />`:''}
    ${beard?`<path d="M38 42 Q50 58 62 42 Q50 48 38 42 Z" fill="${h}"/>`:''}
    <circle cx="44" cy="37" r="1.6" fill="${INK}" stroke="none"/><circle cx="56" cy="37" r="1.6" fill="${INK}" stroke="none"/>
    <path d="M45 44 Q50 47 55 44" fill="none" stroke-width="2"/>
    ${extra}
  </g>`;
}
const ANA={hair:'#3b2a22',shirt:ORANGE,long:true};
const MINHO={hair:INK,shirt:GREEN};

const dots=n=>icon(`<rect x="14" y="20" width="72" height="60" rx="14" fill="${CREAM}"/>${Array.from({length:n},(_,i)=>{const cols=Math.min(n,3),row=Math.floor(i/3),col=i%3,count=Math.min(3,n-row*3);return`<circle cx="${50+(col-(count-1)/2)*20}" cy="${(n>3?38:50)+row*24}" r="7" fill="${ORANGE}"/>`;}).join('')}`);
const swatch=color=>icon(`<path d="M22 70 Q20 30 50 24 Q82 22 80 52 Q78 66 64 62 Q54 60 56 72 Q58 84 42 82 Q24 80 22 70 Z" fill="${color}"/><circle cx="36" cy="44" r="4" fill="${WHITE}" stroke="none" opacity=".6"/>`);

const ICONS={
  // Comida y bebida
  agua:icon(`<path d="M34 22 L66 22 L62 84 L38 84 Z" fill="${WHITE}"/><path d="M36 44 L64 44 L62 84 L38 84 Z" fill="${SKY}"/><path d="M44 54 Q46 50 48 54" fill="none" stroke="${WHITE}"/>`),
  pan:icon(`<path d="M16 62 Q14 36 50 34 Q86 36 84 62 Q84 74 50 74 Q16 74 16 62 Z" fill="#e0a55c"/><path d="M34 44 L40 58 M50 42 L54 58 M66 44 L68 58" fill="none"/>`),
  arroz:icon(`<path d="M18 50 L82 50 Q80 82 50 82 Q20 82 18 50 Z" fill="${WHITE}"/><path d="M22 50 Q30 30 50 32 Q70 30 78 50 Z" fill="${CREAM}"/><path d="M40 40 l3 -2 M52 38 l3 2 M60 44 l3 -1 M46 46 l2 1" />`),
  'arroz cocido':null,comida:null,
  cafe:icon(`<path d="M24 40 L68 40 L64 80 L28 80 Z" fill="${WHITE}"/><path d="M68 48 Q82 48 80 60 Q78 70 66 68" fill="none"/><path d="M28 46 L64 46" stroke="${BROWN}" stroke-width="6"/><path d="M38 30 Q34 24 38 18 M50 30 Q46 24 50 18" fill="none" opacity=".6"/>`),
  te:icon(`<path d="M20 44 Q20 80 50 80 Q80 80 80 44 Z" fill="${GREEN}"/><path d="M80 52 Q92 52 88 62 Q84 68 76 66" fill="none"/><path d="M42 32 Q38 26 42 20 M56 32 Q52 26 56 20" fill="none" opacity=".6"/>`),
  manzana:icon(`<path d="M50 34 Q30 22 22 44 Q16 70 36 82 Q44 86 50 80 Q56 86 64 82 Q84 70 78 44 Q70 22 50 34 Z" fill="${RED}"/><path d="M50 34 Q50 24 54 16" fill="none"/><path d="M54 24 Q66 16 70 24 Q62 30 54 24 Z" fill="${GREEN}"/>`),
  carne:icon(`<path d="M20 56 Q18 30 46 28 Q76 26 82 50 Q86 74 56 78 Q22 82 20 56 Z" fill="#c4554d"/><path d="M34 52 Q48 40 66 50" fill="none" stroke="${WHITE}"/><circle cx="62" cy="62" r="6" fill="${WHITE}"/>`),
  pescado:icon(`<path d="M16 50 Q40 24 70 46 L86 32 L84 68 L70 54 Q40 76 16 50 Z" fill="${SKY}"/><circle cx="30" cy="47" r="3" fill="${INK}"/><path d="M46 40 Q52 50 46 60" fill="none"/>`),
  huevo:icon(`<path d="M50 16 Q76 20 76 56 Q76 84 50 84 Q24 84 24 56 Q24 20 50 16 Z" fill="${WHITE}"/><circle cx="50" cy="58" r="11" fill="${YELLOW}"/>`),
  leche:icon(`<path d="M34 30 L50 18 L66 30 L66 84 L34 84 Z" fill="${WHITE}"/><path d="M34 30 L66 30" /><path d="M34 52 L66 52 L66 70 L34 70 Z" fill="${SKY}"/>`),
  zumo:icon(`<path d="M32 30 L68 30 L64 84 L36 84 Z" fill="${WHITE}"/><path d="M34 44 L66 44 L64 84 L36 84 Z" fill="#f29a3a"/><path d="M58 30 L66 12" fill="none"/>`),
  sopa:icon(`<path d="M16 46 L84 46 Q82 80 50 80 Q18 80 16 46 Z" fill="${ORANGE}"/><path d="M60 46 L78 18" fill="none"/><path d="M36 34 Q32 28 36 22 M50 34 Q46 28 50 22" fill="none" opacity=".6"/>`),
  fideos:icon(`<path d="M16 50 L84 50 Q82 82 50 82 Q18 82 16 50 Z" fill="${WHITE}"/><path d="M26 50 Q30 38 38 50 Q44 38 50 50 Q56 38 62 50 Q68 38 74 50" fill="${YELLOW}"/><path d="M58 30 L76 14 M64 34 L82 20" fill="none" stroke="${BROWN}"/>`),
  fruta:icon(`<circle cx="38" cy="56" r="18" fill="${RED}"/><circle cx="62" cy="58" r="16" fill="#f29a3a"/><path d="M38 38 Q40 30 44 28 M62 42 L64 34" fill="none"/>`),
  verdura:icon(`<path d="M50 84 Q30 84 30 60 Q30 40 50 40 Q70 40 70 60 Q70 84 50 84 Z" fill="${GREEN}"/><path d="M50 40 Q40 26 30 28 M50 40 Q50 22 56 16 M50 40 Q62 28 72 30" fill="none"/>`),
  verduras:null,
  platano:icon(`<path d="M22 34 Q26 76 76 74 Q82 72 80 68 Q40 64 32 30 Q28 26 22 34 Z" fill="${YELLOW}"/><path d="M22 34 L18 28" />`),
  naranja:icon(`<circle cx="50" cy="56" r="26" fill="#f29a3a"/><path d="M50 30 L50 22" /><path d="M50 26 Q62 16 68 24 Q60 30 50 26 Z" fill="${GREEN}"/><circle cx="42" cy="48" r="2" fill="${INK}" stroke="none" opacity=".3"/><circle cx="58" cy="60" r="2" fill="${INK}" stroke="none" opacity=".3"/>`),
  uva:icon(`${[[50,34],[40,46],[60,46],[32,58],[50,58],[68,58],[42,70],[58,70],[50,82]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="9" fill="${PURPLE}"/>`).join('')}<path d="M50 26 L52 14" />`),
  queso:icon(`<path d="M16 70 L50 30 L84 54 L84 76 L16 76 Z" fill="${YELLOW}"/><path d="M16 70 L84 70" /><circle cx="44" cy="60" r="4" fill="#d9a62f"/><circle cx="66" cy="62" r="3" fill="#d9a62f"/>`),
  mantequilla:icon(`<path d="M18 52 L62 40 L84 50 L84 66 L40 78 L18 68 Z" fill="#f5dd8a"/><path d="M18 52 L40 62 L84 50 M40 62 L40 78" fill="none"/>`),
  azucar:icon(`<rect x="22" y="40" width="22" height="22" fill="${WHITE}"/><rect x="50" y="40" width="22" height="22" fill="${WHITE}"/><rect x="36" y="62" width="22" height="20" fill="${WHITE}"/>`),
  sal:icon(`<path d="M36 34 L64 34 L68 84 L32 84 Z" fill="${WHITE}"/><path d="M36 34 Q50 18 64 34" fill="${GREY}"/><circle cx="46" cy="28" r="1.5" fill="${INK}"/><circle cx="54" cy="28" r="1.5" fill="${INK}"/>`),
  // Casa
  casa:icon(`<path d="M18 46 L50 18 L82 46" fill="${RED}"/><path d="M24 44 L76 44 L76 84 L24 84 Z" fill="${CREAM}"/><path d="M44 84 L44 62 L58 62 L58 84" fill="${BROWN}"/><rect x="30" y="52" width="10" height="10" fill="${SKY}"/>`),
  habitacion:icon(`<path d="M14 24 L86 24 L86 84 L14 84 Z" fill="${CREAM}"/><rect x="58" y="34" width="20" height="18" fill="${SKY}"/><path d="M20 70 L60 70 L60 84 M20 70 L20 84" fill="${WHITE}"/><path d="M20 62 L32 62 L32 70" fill="${PINK}"/>`),
  cocina:icon(`<rect x="16" y="40" width="68" height="44" fill="${WHITE}"/><circle cx="34" cy="50" r="5" fill="${GREY}"/><circle cx="54" cy="50" r="5" fill="${GREY}"/><rect x="24" y="60" width="52" height="18" fill="${GREY}"/><path d="M60 40 L60 28 L78 28 L78 40" fill="${ORANGE}"/>`),
  bano:icon(`<path d="M16 50 L84 50 Q84 80 50 80 Q16 80 16 50 Z" fill="${WHITE}"/><path d="M26 50 L26 30 Q26 22 34 22 L40 22" fill="none"/><circle cx="58" cy="40" r="4" fill="${SKY}"/><circle cx="68" cy="34" r="3" fill="${SKY}"/>`),
  'cuarto de bano':null,
  mesa:icon(`<path d="M12 46 L88 46 L82 38 L18 38 Z" fill="${BROWN}"/><path d="M22 46 L22 84 M78 46 L78 84" fill="none"/>`),
  silla:icon(`<path d="M32 18 L32 56 L68 56 L68 50" fill="none"/><path d="M32 50 L70 50 L70 58 L32 58 Z" fill="${BROWN}"/><path d="M32 18 L52 18 L52 50" fill="none"/><path d="M34 58 L34 86 M68 58 L68 86" />`),
  puerta:icon(`<rect x="28" y="14" width="44" height="72" rx="3" fill="${BROWN}"/><circle cx="62" cy="52" r="3.5" fill="${YELLOW}"/><rect x="36" y="22" width="28" height="22" fill="none" opacity=".5"/>`),
  ventana:icon(`<rect x="20" y="18" width="60" height="64" fill="${SKY}"/><path d="M50 18 L50 82 M20 50 L80 50" fill="none"/><path d="M14 82 L86 82" />`),
  cama:icon(`<path d="M12 56 L88 56 L88 76 L12 76 Z" fill="${WHITE}"/><path d="M12 40 L12 84 M88 56 L88 84" /><rect x="16" y="46" width="22" height="10" rx="5" fill="${PINK}"/><path d="M40 56 L88 56 L88 66 L40 66 Z" fill="${SKY}"/>`),
  sofa:icon(`<path d="M18 50 Q18 36 32 36 L68 36 Q82 36 82 50 L82 72 L18 72 Z" fill="${GREEN}"/><rect x="10" y="52" width="14" height="26" rx="6" fill="${GREEN}"/><rect x="76" y="52" width="14" height="26" rx="6" fill="${GREEN}"/><path d="M24 58 L76 58" />`),
  nevera:icon(`<rect x="28" y="12" width="44" height="76" rx="6" fill="${WHITE}"/><path d="M28 40 L72 40" /><path d="M34 22 L34 32 M34 48 L34 62" />`),
  salon:null,
  escalera:icon(`<path d="M14 84 L14 72 L32 72 L32 58 L50 58 L50 44 L68 44 L68 30 L86 30 L86 84 Z" fill="${CREAM}"/>`),
  lampara:icon(`<path d="M34 20 L66 20 L76 50 L24 50 Z" fill="${YELLOW}"/><path d="M50 50 L50 80 M36 84 L64 84" fill="none"/>`),
  espejo:icon(`<ellipse cx="50" cy="46" rx="24" ry="32" fill="${SKY}"/><path d="M38 34 L48 26 M40 46 L56 32" fill="none" stroke="${WHITE}"/><path d="M50 78 L50 88" />`),
  llave:icon(`<circle cx="32" cy="50" r="14" fill="${YELLOW}"/><circle cx="32" cy="50" r="5" fill="${WHITE}"/><path d="M46 50 L84 50 M74 50 L74 60 M82 50 L82 58" fill="none"/>`),
  // Objetos
  libro:icon(`<path d="M18 28 Q34 22 50 30 L50 82 Q34 74 18 80 Z" fill="${BLUE}"/><path d="M82 28 Q66 22 50 30 L50 82 Q66 74 82 80 Z" fill="${SKY}"/>`),
  lapiz:icon(`<path d="M24 76 L66 22 L78 32 L36 86 Z" fill="${YELLOW}"/><path d="M24 76 L20 90 L36 86" fill="${CREAM}"/><path d="M66 22 L70 16 L82 26 L78 32" fill="${PINK}"/>`),
  cuaderno:icon(`<rect x="24" y="16" width="52" height="70" rx="4" fill="${GREEN}"/><rect x="34" y="28" width="32" height="12" fill="${WHITE}"/><path d="M24 26 L18 26 M24 40 L18 40 M24 54 L18 54 M24 68 L18 68" />`),
  bolsa:icon(`<path d="M22 38 L78 38 L72 86 L28 86 Z" fill="${ORANGE}"/><path d="M36 38 Q36 18 50 18 Q64 18 64 38" fill="none"/>`),
  vaso:icon(`<path d="M32 20 L68 20 L62 84 L38 84 Z" fill="${WHITE}"/><path d="M34 40 L66 40" opacity=".5"/>`),
  plato:icon(`<ellipse cx="50" cy="58" rx="36" ry="18" fill="${WHITE}"/><ellipse cx="50" cy="56" rx="20" ry="9" fill="none" opacity=".5"/>`),
  cuchara:icon(`<ellipse cx="50" cy="28" rx="13" ry="17" fill="${GREY}"/><path d="M50 45 L50 88" stroke-width="6"/>`),
  tenedor:icon(`<path d="M38 14 L38 34 Q38 44 50 44 Q62 44 62 34 L62 14 M50 14 L50 34" fill="none"/><path d="M50 44 L50 88" stroke-width="6"/>`),
  cuchillo:icon(`<path d="M44 12 Q62 24 58 52 L44 52 Z" fill="${GREY}"/><rect x="44" y="52" width="12" height="36" rx="4" fill="${BROWN}"/>`),
  reloj:icon(`<circle cx="50" cy="52" r="32" fill="${WHITE}"/><path d="M50 52 L50 32 M50 52 L64 60" fill="none"/><circle cx="50" cy="52" r="3" fill="${INK}"/>`),
  'telefono movil':icon(`<rect x="32" y="12" width="36" height="76" rx="8" fill="${INK}"/><rect x="37" y="22" width="26" height="52" rx="2" fill="${SKY}" stroke="none"/><circle cx="50" cy="81" r="2.5" fill="${WHITE}" stroke="none"/>`),
  telefono:null,movil:null,
  gafas:icon(`<circle cx="32" cy="54" r="15" fill="${SKY}"/><circle cx="68" cy="54" r="15" fill="${SKY}"/><path d="M47 54 Q50 48 53 54 M17 52 L10 42 M83 52 L90 42" fill="none"/>`),
  paraguas:icon(`<path d="M12 50 Q14 18 50 16 Q86 18 88 50 Q80 44 72 50 Q62 42 50 50 Q38 42 28 50 Q20 44 12 50 Z" fill="${RED}"/><path d="M50 50 L50 80 Q50 88 42 86" fill="none"/>`),
  dinero:icon(`<rect x="14" y="30" width="72" height="42" rx="6" fill="#a8d5a2"/><circle cx="50" cy="51" r="11" fill="${WHITE}"/><path d="M50 44 L50 58" />`),
  efectivo:null,
  tarjeta:icon(`<rect x="14" y="28" width="72" height="46" rx="8" fill="${BLUE}"/><path d="M14 40 L86 40" stroke-width="7"/><rect x="22" y="54" width="16" height="10" rx="2" fill="${YELLOW}"/>`),
  cartera:icon(`<path d="M16 34 L84 34 L84 76 L16 76 Z" fill="${BROWN}"/><path d="M60 46 L84 46 L84 64 L60 64 Z" fill="#7a5238"/><circle cx="68" cy="55" r="3" fill="${YELLOW}"/>`),
  recibo:icon(`<path d="M30 12 L70 12 L70 86 L64 80 L58 86 L52 80 L46 86 L40 80 L34 86 L30 82 Z" fill="${WHITE}"/><path d="M38 28 L62 28 M38 40 L62 40 M38 52 L54 52" fill="none"/>`),
  billete:icon(`<path d="M12 34 L88 34 L88 46 Q82 50 88 54 L88 66 L12 66 L12 54 Q18 50 12 46 Z" fill="${YELLOW}"/><path d="M64 34 L64 66" stroke-dasharray="4 4"/>`),
  mapa:icon(`<path d="M14 24 L38 16 L62 24 L86 16 L86 76 L62 84 L38 76 L14 84 Z" fill="${CREAM}"/><path d="M38 16 L38 76 M62 24 L62 84" fill="none"/><path d="M24 60 Q40 40 54 54 Q66 66 76 40" fill="none" stroke="${RED}" stroke-dasharray="4 5"/>`),
  computadora:icon(`<rect x="16" y="20" width="68" height="46" rx="5" fill="${INK}"/><rect x="22" y="26" width="56" height="34" fill="${SKY}" stroke="none"/><path d="M40 66 L36 80 L64 80 L60 66" fill="${GREY}"/>`),
  ordenador:null,
  foto:icon(`<rect x="14" y="30" width="72" height="50" rx="8" fill="${GREY}"/><path d="M36 30 L42 20 L58 20 L64 30" fill="${GREY}"/><circle cx="50" cy="55" r="14" fill="${SKY}"/>`),
  medicina:icon(`<rect x="22" y="40" width="56" height="26" rx="13" fill="${WHITE}" transform="rotate(-30 50 53)"/><path d="M50 40 L50 66" transform="rotate(-30 50 53)"/><path d="M39 46 L61 60" transform="rotate(-30 50 53)" stroke="none"/><rect x="22" y="40" width="28" height="26" rx="13" fill="${RED}" transform="rotate(-30 50 53)"/>`),
  // Ropa
  ropa:null,
  camisa:icon(`<path d="M30 20 L44 16 Q50 24 56 16 L70 20 L86 36 L76 46 L70 40 L70 86 L30 86 L30 40 L24 46 L14 36 Z" fill="${SKY}"/><path d="M50 26 L50 86" opacity=".4"/>`),
  pantalon:icon(`<path d="M30 14 L70 14 L76 88 L56 88 L50 40 L44 88 L24 88 Z" fill="${BLUE}"/>`),
  falda:icon(`<path d="M34 22 L66 22 L84 82 L16 82 Z" fill="${PINK}"/><path d="M34 30 L66 30" />`),
  vestido:icon(`<path d="M38 14 L44 14 Q50 22 56 14 L62 14 L62 38 L80 86 L20 86 L38 38 Z" fill="${PURPLE}"/><path d="M38 38 L62 38" />`),
  zapatos:icon(`<path d="M12 70 L12 52 L32 52 Q40 64 54 64 Q66 64 66 76 L12 76 Z" fill="${BROWN}"/><path d="M40 60 L48 54" opacity=".5"/><path d="M50 50 L50 34 L70 34 Q76 44 86 46 Q92 48 90 58 L50 58 Z" fill="#7a5238"/>`),
  calcetines:icon(`<path d="M30 14 L48 14 L48 62 Q48 84 28 84 Q16 84 18 72 Q20 64 30 60 Z" fill="${WHITE}"/><path d="M30 24 L48 24" stroke="${RED}" stroke-width="5"/>`),
  sombrero:icon(`<ellipse cx="50" cy="66" rx="40" ry="12" fill="${BROWN}"/><path d="M28 64 Q28 30 50 30 Q72 30 72 64" fill="${BROWN}"/><path d="M28 56 L72 56" stroke="${RED}" stroke-width="5"/>`),
  abrigo:icon(`<path d="M30 16 L42 14 L50 30 L58 14 L70 16 L84 40 L76 86 L24 86 L16 40 Z" fill="${BROWN}"/><path d="M50 30 L50 86" /><circle cx="56" cy="48" r="2.5" fill="${INK}"/><circle cx="56" cy="62" r="2.5" fill="${INK}"/>`),
  guantes:icon(`<path d="M24 84 L24 50 Q22 40 28 40 L28 30 Q30 22 36 28 L36 22 Q40 16 44 24 L44 28 Q50 24 50 34 L50 56 Q58 48 62 54 L50 74 L50 84 Z" fill="${RED}"/>`),
  // Cuerpo
  cabeza:icon(`<circle cx="50" cy="50" r="30" fill="${SKIN}"/><path d="M20 46 Q24 18 50 18 Q76 18 80 46 Q64 32 50 34 Q36 32 20 46 Z" fill="${INK}"/><circle cx="40" cy="52" r="2.5" fill="${INK}"/><circle cx="60" cy="52" r="2.5" fill="${INK}"/><path d="M42 64 Q50 70 58 64" fill="none"/>`),
  ojo:icon(`<path d="M10 50 Q50 14 90 50 Q50 86 10 50 Z" fill="${WHITE}"/><circle cx="50" cy="50" r="14" fill="${BROWN}"/><circle cx="50" cy="50" r="6" fill="${INK}"/>`),
  nariz:icon(`<path d="M50 18 Q46 50 34 64 Q40 76 50 70 Q60 76 66 64 Q54 50 50 18 Z" fill="${SKIN}"/>`),
  boca:icon(`<path d="M16 48 Q50 28 84 48 Q50 82 16 48 Z" fill="${RED}"/><path d="M22 50 Q50 58 78 50" fill="none"/>`),
  oreja:icon(`<path d="M40 16 Q76 14 74 46 Q72 62 58 70 Q54 84 42 82 Q32 80 34 70" fill="${SKIN}"/><path d="M48 34 Q62 32 60 46 Q58 54 50 54" fill="none"/>`),
  mano:icon(`<path d="M30 86 L30 50 Q30 44 26 38 Q22 30 28 30 Q34 30 38 40 L38 18 Q42 12 46 18 L46 40 L46 14 Q50 8 54 14 L54 40 L54 18 Q58 12 62 18 L62 42 L62 26 Q66 20 70 26 L70 60 Q70 86 50 86 Z" fill="${SKIN}"/>`),
  pie:icon(`<path d="M30 14 L50 14 L52 58 Q86 60 86 76 Q86 84 74 84 L28 84 Q22 70 30 14 Z" fill="${SKIN}"/>`),
  pierna:icon(`<path d="M40 10 L60 10 L58 74 L80 78 L80 88 L40 88 Z" fill="${SKIN}"/><path d="M44 44 Q50 48 56 44" fill="none" opacity=".5"/>`),
  brazo:icon(`<path d="M14 40 L60 40 Q74 40 80 56 L86 70 L72 74 L66 60 Q64 56 58 56 L14 56 Z" fill="${SKIN}"/>`),
  barriga:icon(`<path d="M28 14 L72 14 Q84 50 72 86 L28 86 Q16 50 28 14 Z" fill="${SKIN}"/><circle cx="50" cy="56" r="3" fill="${INK}"/>`),
  vientre:null,estomago:null,
  cuello:icon(`<circle cx="50" cy="30" r="18" fill="${SKIN}"/><path d="M42 46 L42 64 L58 64 L58 46" fill="${SKIN}"/><path d="M22 86 Q24 66 42 64 L58 64 Q76 66 78 86 Z" fill="${ORANGE}"/><path d="M40 56 Q50 60 60 56" fill="none" stroke="${RED}"/>`),
  garganta:null,
  diente:icon(`<path d="M24 26 Q24 14 38 16 Q50 20 62 16 Q76 14 76 26 Q76 44 70 52 L66 84 Q60 86 56 66 Q50 60 44 66 Q40 86 34 84 L30 52 Q24 44 24 26 Z" fill="${WHITE}"/>`),
  tos:icon(`<circle cx="36" cy="50" r="22" fill="${SKIN}"/><circle cx="30" cy="46" r="2" fill="${INK}"/><path d="M52 54 L58 54" /><path d="M62 44 Q72 40 74 46 M64 56 Q78 56 80 62 M62 66 Q70 72 72 78" fill="none"/>`),
  resfriado:icon(`<circle cx="50" cy="48" r="26" fill="${SKIN}"/><path d="M24 40 Q50 6 76 40 L74 30 Q50 12 26 30 Z" fill="${RED}"/><path d="M38 50 L44 50 M56 50 L62 50" /><path d="M58 64 Q60 70 56 74" fill="${SKY}"/>`),
  fiebre:icon(`<rect x="44" y="12" width="12" height="56" rx="6" fill="${WHITE}"/><circle cx="50" cy="74" r="12" fill="${RED}"/><path d="M50 74 L50 30" stroke="${RED}" stroke-width="5"/>`),
  // Personas
  persona:icon(person({...MINHO})),
  hombre:icon(person({hair:INK,shirt:BLUE})),
  mujer:icon(person({hair:'#3b2a22',shirt:PINK,long:true,skirt:PURPLE})),
  nino:icon(person({hair:'#5b3a29',shirt:YELLOW,kid:true})),
  nina:null,
  estudiante:icon(person({hair:INK,shirt:GREEN,extra:`<rect x="58" y="64" width="18" height="22" rx="2" fill="${BLUE}"/>`})),
  profesor:icon(`<rect x="8" y="16" width="44" height="30" fill="${GREEN}"/><path d="M16 26 L30 26 M16 34 L40 34" stroke="${WHITE}" fill="none"/>${person({x:62,hair:INK,shirt:BROWN})}`),
  medico:icon(person({hair:INK,shirt:WHITE,extra:`<path d="M40 60 Q40 76 50 76 Q60 76 60 60" fill="none"/><circle cx="50" cy="78" r="3" fill="${GREY}"/>`})),
  amigo:icon(`${person({x:34,s:.8,...ANA})}${person({x:66,s:.8,...MINHO})}`),
  familia:icon(`${person({x:26,s:.8,hair:INK,shirt:BLUE})}${person({x:74,s:.8,hair:'#3b2a22',shirt:PINK,long:true})}${person({x:50,s:.8,hair:'#5b3a29',shirt:YELLOW,kid:true})}`),
  padre:icon(person({hair:INK,shirt:BLUE,beard:true})),
  madre:icon(person({hair:'#3b2a22',shirt:PINK,long:true})),
  hijo:icon(person({hair:INK,shirt:GREEN,kid:true})),
  hija:icon(person({hair:'#3b2a22',shirt:PINK,long:true,kid:true})),
  abuelo:icon(person({shirt:BROWN,grey:true,beard:true})),
  abuela:icon(person({shirt:PURPLE,grey:true,long:true})),
  // Lugares
  escuela:icon(`<path d="M14 42 L50 22 L86 42 Z" fill="${RED}"/><rect x="20" y="42" width="60" height="42" fill="${CREAM}"/><rect x="44" y="62" width="12" height="22" fill="${BROWN}"/><rect x="26" y="50" width="10" height="10" fill="${SKY}"/><rect x="64" y="50" width="10" height="10" fill="${SKY}"/><path d="M50 22 L50 10 L62 14 L50 18" fill="${YELLOW}"/>`),
  estacion:icon(`<rect x="14" y="30" width="72" height="54" fill="${CREAM}"/><path d="M10 30 L90 30 L84 20 L16 20 Z" fill="${GREEN}"/><circle cx="50" cy="44" r="8" fill="${WHITE}"/><path d="M50 44 L50 39 M50 44 L54 46" fill="none" stroke-width="2"/><rect x="40" y="58" width="20" height="26" fill="${SKY}"/>`),
  hospital:icon(`<rect x="18" y="22" width="64" height="62" fill="${WHITE}"/><rect x="40" y="30" width="20" height="20" fill="${WHITE}"/><path d="M50 32 L50 48 M42 40 L58 40" stroke="${RED}" stroke-width="5"/><rect x="42" y="64" width="16" height="20" fill="${SKY}"/>`),
  tienda:icon(`<rect x="16" y="40" width="68" height="44" fill="${CREAM}"/><path d="M12 40 L20 22 L80 22 L88 40 Q80 48 72 40 Q64 48 56 40 Q48 48 40 40 Q32 48 24 40 Q18 46 12 40 Z" fill="${ORANGE}"/><rect x="24" y="52" width="24" height="18" fill="${SKY}"/><rect x="56" y="52" width="18" height="32" fill="${BROWN}"/>`),
  mercado:icon(`<path d="M14 40 L50 18 L86 40 Z" fill="${GREEN}"/><rect x="18" y="56" width="64" height="12" fill="${BROWN}"/><path d="M22 40 L22 84 M78 40 L78 84" /><circle cx="34" cy="52" r="5" fill="${RED}"/><circle cx="46" cy="52" r="5" fill="#f29a3a"/><circle cx="58" cy="52" r="5" fill="${YELLOW}"/><circle cx="70" cy="52" r="5" fill="${GREEN}"/>`),
  banco:icon(`<path d="M12 36 L50 16 L88 36 Z" fill="${GREY}"/><path d="M26 40 L26 76 M42 40 L42 76 M58 40 L58 76 M74 40 L74 76" stroke-width="5"/><rect x="14" y="76" width="72" height="8" fill="${GREY}"/>`),
  parque:icon(`<path d="M10 80 Q50 64 90 80 L90 86 L10 86 Z" fill="#a8d5a2"/><circle cx="36" cy="40" r="20" fill="${GREEN}"/><path d="M36 60 L36 80" stroke-width="5"/><path d="M58 70 L84 70 M60 70 L60 80 M82 70 L82 80 M58 62 L84 62" fill="none" stroke="${BROWN}"/>`),
  aeropuerto:icon(`<path d="M10 50 L54 46 L74 20 L82 22 L70 46 L88 46 Q94 50 88 54 L70 54 L82 78 L74 80 L54 54 L10 50 Z" fill="${WHITE}"/>`),
  biblioteca:icon(`${[[16,BLUE],[30,RED],[44,GREEN],[58,YELLOW],[72,PURPLE]].map(([x,c],i)=>`<rect x="${x}" y="${24+(i%2)*6}" width="12" height="${60-(i%2)*6}" fill="${c}"/>`).join('')}<path d="M10 84 L90 84" />`),
  'oficina de correos':icon(`<rect x="14" y="26" width="72" height="50" rx="4" fill="${WHITE}"/><path d="M14 26 L50 56 L86 26" fill="none"/><rect x="64" y="32" width="14" height="14" fill="${RED}"/>`),
  hotel:icon(`<rect x="22" y="14" width="56" height="72" fill="${CREAM}"/>${[24,38,52].map(y=>`<rect x="30" y="${y}" width="10" height="8" fill="${SKY}"/><rect x="45" y="${y}" width="10" height="8" fill="${SKY}"/><rect x="60" y="${y}" width="10" height="8" fill="${SKY}"/>`).join('')}<rect x="42" y="68" width="16" height="18" fill="${BROWN}"/>`),
  restaurante:icon(`<circle cx="50" cy="54" r="26" fill="${WHITE}"/><circle cx="50" cy="54" r="16" fill="${CREAM}"/><path d="M14 28 L14 50 M10 28 L10 40 Q10 46 14 46 Q18 46 18 40 L18 28 M14 50 L14 84" fill="none"/><path d="M86 28 Q78 40 86 54 L86 84" fill="none"/>`),
  cafeteria:null,
  museo:icon(`<path d="M12 38 L50 16 L88 38 Z" fill="${CREAM}"/><path d="M24 42 L24 76 M40 42 L40 76 M60 42 L60 76 M76 42 L76 76" stroke-width="6"/><rect x="14" y="76" width="72" height="8" fill="${CREAM}"/><path d="M16 38 L84 38" />`),
  ciudad:icon(`<rect x="10" y="44" width="20" height="40" fill="${GREY}"/><rect x="30" y="24" width="22" height="60" fill="${SKY}"/><rect x="52" y="36" width="18" height="48" fill="${CREAM}"/><rect x="70" y="52" width="20" height="32" fill="${GREY}"/><path d="M36 32 L46 32 M36 42 L46 42 M36 52 L46 52" stroke-width="2"/>`),
  camino:icon(`<path d="M40 14 L60 14 L86 86 L14 86 Z" fill="${GREY}"/><path d="M50 22 L50 32 M50 44 L50 56 M50 68 L50 82" stroke="${WHITE}" stroke-width="4"/>`),
  calle:null,
  semaforo:icon(`<rect x="36" y="10" width="28" height="64" rx="8" fill="${INK}"/><circle cx="50" cy="24" r="7" fill="${RED}"/><circle cx="50" cy="42" r="7" fill="${YELLOW}"/><circle cx="50" cy="60" r="7" fill="#7cc576"/><path d="M50 74 L50 90" />`),
  farmacia:icon(`<rect x="18" y="30" width="64" height="54" fill="${WHITE}"/><rect x="36" y="12" width="28" height="28" rx="4" fill="${GREEN}"/><path d="M50 18 L50 34 M42 26 L58 26" stroke="${WHITE}" stroke-width="5"/><rect x="40" y="58" width="20" height="26" fill="${SKY}"/>`),
  oficina:icon(`<rect x="16" y="40" width="68" height="8" fill="${BROWN}"/><path d="M22 48 L22 84 M78 48 L78 84" /><rect x="34" y="18" width="32" height="22" rx="2" fill="${INK}"/><rect x="38" y="22" width="24" height="14" fill="${SKY}" stroke="none"/>`),
  empresa:null,aula:null,
  pizarra:icon(`<rect x="12" y="18" width="76" height="52" rx="3" fill="${GREEN}"/><path d="M22 32 L44 32 M22 44 L60 44 M22 56 L36 56" stroke="${WHITE}" fill="none"/><path d="M30 70 L24 88 M70 70 L76 88" />`),
  examen:icon(`<path d="M24 12 L76 12 L76 88 L24 88 Z" fill="${WHITE}"/><path d="M34 30 L40 36 L50 24" fill="none" stroke="${GREEN}"/><path d="M56 30 L68 30 M56 52 L68 52 M34 70 L68 70" fill="none"/><path d="M34 48 L46 58 M46 48 L34 58" stroke="${RED}"/>`),
  'parada de autobus':icon(`<path d="M30 16 L30 86" stroke-width="4"/><rect x="18" y="14" width="40" height="24" rx="4" fill="${GREEN}"/><rect x="28" y="20" width="20" height="12" rx="3" fill="${WHITE}"/><path d="M50 60 L86 60 L86 86 L50 86 Z" fill="${SKY}" opacity=".7"/>`),
  parada:null,
  // Transporte
  autobus:icon(`<rect x="10" y="26" width="80" height="46" rx="10" fill="${YELLOW}"/><path d="M16 34 L84 34 L84 50 L16 50 Z" fill="${SKY}"/><circle cx="28" cy="74" r="8" fill="${INK}"/><circle cx="72" cy="74" r="8" fill="${INK}"/>`),
  metro:icon(`<rect x="22" y="16" width="56" height="62" rx="14" fill="${BLUE}"/><rect x="30" y="26" width="40" height="22" rx="4" fill="${SKY}"/><circle cx="36" cy="62" r="4" fill="${YELLOW}"/><circle cx="64" cy="62" r="4" fill="${YELLOW}"/><path d="M30 78 L22 90 M70 78 L78 90" />`),
  'estacion de metro':null,
  tren:icon(`<path d="M14 72 L14 36 Q14 24 30 24 L78 24 Q90 24 90 40 L90 72 Z" fill="${RED}"/><rect x="24" y="32" width="20" height="16" fill="${SKY}"/><rect x="52" y="32" width="20" height="16" fill="${SKY}"/><path d="M8 84 L92 84" /><circle cx="30" cy="76" r="6" fill="${INK}"/><circle cx="74" cy="76" r="6" fill="${INK}"/>`),
  taxi:icon(`<path d="M10 70 L10 54 Q12 46 22 46 L30 32 L70 32 L78 46 Q90 46 90 56 L90 70 Z" fill="${YELLOW}"/><path d="M34 36 L64 36 L72 46 L28 46 Z" fill="${SKY}"/><rect x="40" y="22" width="20" height="10" rx="2" fill="${WHITE}"/><circle cx="28" cy="72" r="8" fill="${INK}"/><circle cx="72" cy="72" r="8" fill="${INK}"/>`),
  avion:null,
  bicicleta:icon(`<circle cx="26" cy="64" r="16" fill="none"/><circle cx="74" cy="64" r="16" fill="none"/><path d="M26 64 L42 40 L66 40 L74 64 M42 40 L52 64 L66 40 M40 32 L48 32 M66 40 L62 28 L70 28" fill="none" stroke="${RED}"/>`),
  coche:icon(`<path d="M10 70 L10 54 Q12 46 22 46 L32 30 L66 30 L78 46 Q90 46 90 56 L90 70 Z" fill="${BLUE}"/><path d="M36 34 L62 34 L70 46 L30 46 Z" fill="${SKY}"/><circle cx="28" cy="72" r="8" fill="${INK}"/><circle cx="72" cy="72" r="8" fill="${INK}"/>`),
  motocicleta:icon(`<circle cx="22" cy="66" r="14" fill="none"/><circle cx="78" cy="66" r="14" fill="none"/><path d="M22 66 L44 52 L66 52 L78 66 M40 44 L58 44 L66 52 M66 52 L70 34 L78 34" fill="${RED}"/>`),
  // Naturaleza y clima
  sol:icon(`<circle cx="50" cy="50" r="18" fill="${YELLOW}"/>${Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return`<path d="M${50+Math.cos(a)*26} ${50+Math.sin(a)*26} L${50+Math.cos(a)*36} ${50+Math.sin(a)*36}" />`;}).join('')}`),
  lluvia:icon(`<path d="M24 50 Q14 50 16 40 Q18 30 30 32 Q34 18 50 20 Q64 20 68 32 Q84 30 84 42 Q84 50 74 50 Z" fill="${GREY}"/><path d="M30 60 L26 72 M50 60 L46 72 M70 60 L66 72 M40 76 L36 86 M60 76 L56 86" stroke="${BLUE}"/>`),
  nieve:icon(`${[[50,50,26]].map(([x,y,r])=>[0,60,120].map(a=>`<path d="M${x-Math.cos(a*Math.PI/180)*r} ${y-Math.sin(a*Math.PI/180)*r} L${x+Math.cos(a*Math.PI/180)*r} ${y+Math.sin(a*Math.PI/180)*r}" stroke="${BLUE}"/>`).join('')).join('')}<circle cx="50" cy="50" r="5" fill="${WHITE}"/>`),
  viento:icon(`<path d="M12 36 L60 36 Q72 36 72 26 Q72 16 62 18 M12 52 L78 52 Q90 52 90 62 Q90 72 80 70 M12 68 L50 68" fill="none" stroke="${SKY}" stroke-width="5"/>`),
  nube:icon(`<path d="M22 66 Q8 66 10 52 Q12 40 26 42 Q30 24 50 26 Q66 26 70 40 Q88 38 90 54 Q90 66 76 66 Z" fill="${WHITE}"/>`),
  nublado:null,
  despejado:null,
  arbol:icon(`<circle cx="50" cy="38" r="26" fill="${GREEN}"/><circle cx="34" cy="48" r="14" fill="${GREEN}"/><circle cx="66" cy="48" r="14" fill="${GREEN}"/><path d="M50 56 L50 88" stroke-width="7" stroke="${BROWN}"/>`),
  flor:icon(`<path d="M50 54 L50 88" stroke="${GREEN}"/><path d="M50 74 Q36 64 32 72 Q40 80 50 76" fill="${GREEN}"/>${[0,72,144,216,288].map(a=>`<circle cx="${50+Math.cos(a*Math.PI/180)*13}" cy="${36+Math.sin(a*Math.PI/180)*13}" r="10" fill="${PINK}"/>`).join('')}<circle cx="50" cy="36" r="8" fill="${YELLOW}"/>`),
  hierba:icon(`<path d="M14 86 Q20 50 24 40 Q28 60 30 86 Q34 44 42 30 Q44 60 46 86 Q52 46 60 36 Q62 62 64 86 Q70 52 80 44 Q80 66 82 86 Z" fill="#7cc576"/>`),
  pajaro:icon(`<path d="M24 58 Q24 32 50 32 Q70 32 76 46 L88 44 L80 54 Q76 74 52 76 Q34 76 24 58 Z" fill="${SKY}"/><circle cx="62" cy="44" r="3" fill="${INK}"/><path d="M40 52 Q50 64 62 56" fill="none"/>`),
  animal:icon(`<ellipse cx="52" cy="58" rx="28" ry="18" fill="${BROWN}"/><circle cx="26" cy="42" r="14" fill="${BROWN}"/><path d="M18 30 L16 20 L26 28 M30 28 L34 18 L36 30" fill="${BROWN}"/><circle cx="22" cy="42" r="2" fill="${INK}"/><path d="M34 74 L34 86 M70 74 L70 86 M80 52 Q92 46 88 38" fill="none"/>`),
  perro:null,
  montana:icon(`<path d="M6 84 L38 30 L56 58 L68 42 L94 84 Z" fill="${GREEN}"/><path d="M38 30 L30 44 L38 40 L46 44 Z" fill="${WHITE}"/>`),
  rio:icon(`<path d="M10 86 Q30 64 54 66 Q80 68 74 44 Q68 24 90 14 L90 34 Q84 40 88 52 Q94 82 56 84 Q36 84 30 86 Z" fill="${SKY}"/>`),
  mar:icon(`<path d="M8 50 Q20 42 32 50 Q44 58 56 50 Q68 42 80 50 Q88 54 92 50 L92 86 L8 86 Z" fill="${BLUE}"/><path d="M8 66 Q20 58 32 66 Q44 74 56 66 Q68 58 80 66 Q88 70 92 66" fill="none" stroke="${WHITE}"/><circle cx="74" cy="26" r="10" fill="${YELLOW}"/>`),
  isla:icon(`<path d="M8 74 Q50 64 92 74 L92 86 L8 86 Z" fill="${BLUE}"/><path d="M26 74 Q50 54 74 74 Z" fill="${YELLOW}"/><path d="M52 66 Q54 40 50 26" fill="none" stroke="${BROWN}" stroke-width="4"/><path d="M50 26 Q34 18 26 30 M50 26 Q66 18 74 30 M50 26 Q44 14 34 14" fill="none" stroke="${GREEN}" stroke-width="5"/>`),
  piedra:icon(`<path d="M16 76 Q12 52 34 44 Q48 30 68 40 Q90 50 84 76 Z" fill="${GREY}"/>`),
  roca:null,
  primavera:icon(`<path d="M10 86 L90 86" /><path d="M30 86 L30 56" stroke="${GREEN}"/><circle cx="30" cy="48" r="9" fill="${PINK}"/><path d="M60 86 L60 50" stroke="${GREEN}"/><circle cx="60" cy="42" r="10" fill="${YELLOW}"/><circle cx="80" cy="20" r="8" fill="${YELLOW}"/>`),
  verano:icon(`<circle cx="50" cy="40" r="20" fill="${YELLOW}"/>${Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return`<path d="M${50+Math.cos(a)*26} ${40+Math.sin(a)*26} L${50+Math.cos(a)*34} ${40+Math.sin(a)*34}" />`;}).join('')}<path d="M8 80 Q30 72 50 80 Q70 88 92 80 L92 88 L8 88 Z" fill="${BLUE}"/>`),
  otono:icon(`<path d="M50 14 Q80 30 74 60 Q68 80 50 86 Q32 80 26 60 Q20 30 50 14 Z" fill="${ORANGE}"/><path d="M50 22 L50 88 M50 44 L64 34 M50 58 L36 48 M50 70 L62 62" fill="none"/>`),
  invierno:icon(`<circle cx="50" cy="70" r="18" fill="${WHITE}"/><circle cx="50" cy="38" r="13" fill="${WHITE}"/><circle cx="45" cy="36" r="1.8" fill="${INK}"/><circle cx="55" cy="36" r="1.8" fill="${INK}"/><path d="M50 40 L60 42 L50 43" fill="${ORANGE}"/><path d="M38 50 L62 50" stroke="${RED}" stroke-width="5"/>`),
  'hacer frio':null,'hacer calor':null,
  fiesta:icon(`<path d="M28 86 L44 30 L60 86 Z" fill="${ORANGE}"/><path d="M34 66 L54 66 M38 50 L50 50" fill="none" stroke="${YELLOW}"/><circle cx="70" cy="36" r="12" fill="${PINK}"/><path d="M70 48 Q66 66 72 86" fill="none"/><circle cx="22" cy="30" r="3" fill="${BLUE}"/><circle cx="80" cy="16" r="3" fill="${GREEN}"/><circle cx="60" cy="18" r="3" fill="${RED}"/>`),
  // Colores
  rojo:swatch(RED),azul:swatch(BLUE),amarillo:swatch(YELLOW),verde:swatch('#5aa469'),negro:swatch('#24302d'),blanco:swatch(WHITE),morado:swatch(PURPLE),rosa:swatch(PINK),gris:swatch('#9aa09d'),marron:swatch(BROWN),
  // Números
  uno:dots(1),dos:dots(2),tres:dots(3),cuatro:dots(4),cinco:dots(5),seis:dots(6),
  // Direcciones
  izquierda:icon(`<path d="M84 50 L28 50 M44 32 L24 50 L44 68" fill="none" stroke-width="7"/>`),
  derecha:icon(`<path d="M16 50 L72 50 M56 32 L76 50 L56 68" fill="none" stroke-width="7"/>`),
  // Acciones (rutina)
  dormir:icon(`${person({...ANA,shirt:SKY})}<path d="M70 20 L80 20 L70 30 L80 30 M82 8 L88 8 L82 14 L88 14" fill="none" stroke-width="2.5"/>`),
  comer:icon(`${person({...MINHO})}<ellipse cx="50" cy="80" rx="18" ry="6" fill="${WHITE}"/><path d="M66 54 L70 34 M70 54 L74 34" stroke="${BROWN}"/>`),
  beber:icon(`${person({...ANA})}<path d="M60 46 L74 46 L72 66 L62 66 Z" fill="${SKY}"/>`),
  estudiar:icon(`${person({...ANA})}<path d="M28 74 Q40 68 50 74 L50 92 Q40 86 28 92 Z" fill="${BLUE}"/><path d="M72 74 Q60 68 50 74 L50 92 Q60 86 72 92 Z" fill="${SKY}"/>`),
  trabajar:null,
  noche:icon(`<rect x="10" y="12" width="80" height="76" rx="16" fill="#2b3e63"/><path d="M60 26 Q40 30 42 50 Q44 70 64 72 Q50 80 38 70 Q22 56 32 38 Q42 24 60 26 Z" fill="${YELLOW}"/><circle cx="72" cy="40" r="2" fill="${WHITE}" stroke="none"/><circle cx="24" cy="24" r="2" fill="${WHITE}" stroke="none"/>`),
  hola:icon(person({...ANA,extra:`<path d="M70 62 L82 34" stroke-width="5" stroke="${SKIN}"/><circle cx="83" cy="31" r="5" fill="${SKIN}"/><path d="M88 22 Q92 26 90 32 M78 20 Q82 18 86 20" fill="none" stroke-width="2"/>`})),
  gracias:icon(`${person({...MINHO,extra:''})}<path d="M86 22 Q80 14 74 22 Q74 30 86 38 Q98 30 98 22 Q92 14 86 22 Z" fill="${PINK}" transform="translate(-6 0) scale(.9)"/>`),
};

// Alias: misma imagen para varios significados.
const ALIASES={'arroz cocido':'arroz',comida:'arroz',verduras:'verdura',telefono:'telefono movil',movil:'telefono movil',efectivo:'dinero','cuarto de bano':'bano',salon:'sofa',ordenador:'computadora',nina:'nino',vientre:'barriga',estomago:'barriga',garganta:'cuello',cafeteria:'cafe',empresa:'oficina',aula:'pizarra','estacion de metro':'metro',parada:'parada de autobus',calle:'camino',avion:'aeropuerto',nublado:'nube',despejado:'sol',roca:'piedra',perro:'animal','hacer frio':'invierno','hacer calor':'verano',trabajar:'oficina',ropa:'camisa',amiga:'amigo',profesora:'profesor',medica:'medico','tengo hambre':'comer','tengo sed':'beber',despertarse:'sol',familia:'familia'};

export function normalizeMeaning(meaning){
  let text=String(meaning||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  text=text.split(/[(,;/]/)[0].replace(/[.!?¡¿"«»]/g,'').replace(/^(el|la|los|las|un|una) /,'').trim();
  return text;
}

function lookup(meaning){
  const key=normalizeMeaning(meaning);
  if(!key)return'';
  const direct=ICONS[key];
  if(direct)return direct;
  const alias=ALIASES[key];
  return alias&&ICONS[alias]?ICONS[alias]:'';
}

export const illustrationFor=meaning=>lookup(meaning);

// Versión silueta (blanca, con el detalle como líneas translúcidas) para
// mostrarla sobre fondos de color, sin sombra en el suelo.
export function silhouetteFor(meaning){
  const svg=lookup(meaning);
  if(!svg)return'';
  return svg
    .replace(/<ellipse cx="50" cy="92"[^>]*\/>/,'')
    .replace(/stroke="#1f3a33"/gi,'stroke="rgba(0,0,0,.26)"')
    .replace(/fill="#1f3a33"/gi,'fill="rgba(0,0,0,.26)"')
    .replace(/fill="#(?!1f3a33)[0-9a-f]{3,6}"/gi,'fill="#ffffff"');
}
export const hasIllustration=meaning=>Boolean(lookup(meaning));

// ── Escenas (cabecera de la clase y de las historias) ──────────────────────
const ground=(color='#e9dcc4')=>`<path d="M0 118 L200 118 L200 140 L0 140 Z" fill="${color}" stroke="none"/>`;
const sky=(color='#dbeef3')=>`<rect x="0" y="0" width="200" height="140" fill="${color}" stroke="none"/>`;
const duo=(y=44)=>`${person({x:72,y,s:.85,...ANA})}${person({x:128,y,s:.85,...MINHO})}`;
const SCENES={
  home:scene(`${sky('#f6e7cf')}${ground()}<rect x="12" y="20" width="44" height="40" fill="${SKY}"/><path d="M34 20 L34 60 M12 40 L56 40" fill="none"/><path d="M150 70 Q150 56 164 56 L186 56 Q196 56 196 70 L196 100 L150 100 Z" fill="${GREEN}"/>${duo()}`),
  kitchen:scene(`${sky('#f6e7cf')}${ground('#dcc9a8')}<rect x="8" y="64" width="60" height="54" fill="${WHITE}"/><circle cx="24" cy="72" r="5" fill="${GREY}"/><circle cx="46" cy="72" r="5" fill="${GREY}"/><path d="M30 64 L30 52 Q30 46 40 46 Q50 46 50 52 L50 64" fill="${ORANGE}"/>${person({x:120,y:44,s:.85,...ANA})}${person({x:170,y:44,s:.85,hair:'#3b2a22',shirt:PINK,long:true,grey:true})}`),
  bedroom:scene(`${sky('#e5dcef')}${ground('#d8cbe6')}<rect x="140" y="20" width="40" height="34" fill="#2b3e63"/><circle cx="168" cy="32" r="6" fill="${YELLOW}"/><path d="M20 96 L120 96 L120 118 L20 118 Z" fill="${WHITE}"/><path d="M20 80 L20 120" /><rect x="24" y="86" width="26" height="10" rx="5" fill="${PINK}"/><path d="M52 96 L120 96 L120 106 L52 106 Z" fill="${SKY}"/>${person({x:150,y:48,s:.8,...ANA,shirt:SKY})}`),
  street:scene(`${sky()}${ground('#cfcac0')}<rect x="6" y="40" width="34" height="78" fill="${CREAM}"/><rect x="40" y="22" width="30" height="96" fill="${GREY}"/><rect x="162" y="48" width="34" height="70" fill="${CREAM}"/><path d="M160 50 L160 118" stroke-width="4"/><rect x="152" y="30" width="16" height="22" rx="4" fill="${INK}"/><circle cx="160" cy="36" r="3.5" fill="${RED}" stroke="none"/><circle cx="160" cy="46" r="3.5" fill="#7cc576" stroke="none"/>${duo(46)}`),
  station:scene(`${sky()}${ground('#cfcac0')}<rect x="0" y="40" width="200" height="12" fill="${GREEN}"/><path d="M8 66 L8 52 Q8 44 18 44 L70 44 Q80 44 80 56 L80 100 L8 100 Z" fill="${BLUE}"/><rect x="16" y="54" width="20" height="16" fill="${SKY}"/><rect x="44" y="54" width="20" height="16" fill="${SKY}"/><circle cx="150" cy="24" r="12" fill="${WHITE}"/><path d="M150 24 L150 16 M150 24 L156 27" fill="none" stroke-width="2"/>${person({x:120,y:46,s:.8,...ANA})}${person({x:168,y:46,s:.8,...MINHO})}`),
  school:scene(`${sky()}${ground('#bfe0b5')}<path d="M20 60 L80 30 L140 60 Z" fill="${RED}"/><rect x="30" y="60" width="100" height="58" fill="${CREAM}"/><rect x="70" y="84" width="20" height="34" fill="${BROWN}"/><rect x="40" y="70" width="16" height="14" fill="${SKY}"/><rect x="104" y="70" width="16" height="14" fill="${SKY}"/>${person({x:168,y:46,s:.8,...ANA})}`),
  classroom:scene(`${sky('#f6e7cf')}${ground('#dcc9a8')}<rect x="14" y="14" width="96" height="56" rx="3" fill="${GREEN}"/><path d="M26 30 L60 30 M26 44 L84 44 M26 58 L50 58" stroke="${WHITE}" fill="none"/><path d="M74 58 L100 58" stroke="${WHITE}" fill="none"/><circle cx="90" cy="30" r="5" fill="none" stroke="${WHITE}"/>${person({x:140,y:46,s:.8,hair:INK,shirt:BROWN,beard:true})}${person({x:180,y:52,s:.7,...ANA})}`),
  cafe:scene(`${sky('#f3e1cc')}${ground('#d9c2a3')}<path d="M10 30 L190 30 L182 14 L18 14 Z" fill="${ORANGE}"/><rect x="70" y="88" width="60" height="8" fill="${BROWN}"/><path d="M80 96 L80 118 M120 96 L120 118" /><path d="M88 76 L100 76 L98 88 L90 88 Z" fill="${WHITE}"/><path d="M104 76 L116 76 L114 88 L106 88 Z" fill="${WHITE}"/>${person({x:50,y:46,s:.85,...ANA})}${person({x:150,y:46,s:.85,...MINHO})}`),
  restaurant:scene(`${sky('#f3e1cc')}${ground('#d9c2a3')}<rect x="60" y="88" width="80" height="8" fill="${BROWN}"/><path d="M70 96 L70 118 M130 96 L130 118" /><ellipse cx="86" cy="86" rx="14" ry="4" fill="${WHITE}"/><ellipse cx="114" cy="86" rx="14" ry="4" fill="${WHITE}"/><path d="M80 80 Q86 72 92 80 M108 80 Q114 72 120 80" fill="${ORANGE}"/>${person({x:44,y:46,s:.85,...ANA})}${person({x:156,y:46,s:.85,...MINHO})}`),
  market:scene(`${sky()}${ground()}<path d="M10 50 L60 26 L110 50 Z" fill="${GREEN}"/><rect x="16" y="76" width="88" height="14" fill="${BROWN}"/><path d="M20 50 L20 118 M100 50 L100 118" />${[26,40,54,68,82,96].map((x,i)=>`<circle cx="${x}" cy="70" r="6" fill="${[RED,'#f29a3a',YELLOW,GREEN,PURPLE,RED][i]}"/>`).join('')}${person({x:140,y:46,s:.8,...ANA})}${person({x:182,y:46,s:.8,hair:INK,shirt:WHITE,cap:RED})}`),
  shop:scene(`${sky('#f6e7cf')}${ground('#dcc9a8')}<rect x="8" y="20" width="70" height="80" fill="${WHITE}"/>${[30,50,70].map(y=>`<path d="M8 ${y+14} L78 ${y+14}" />`).join('')}<rect x="14" y="30" width="12" height="14" fill="${RED}"/><rect x="32" y="34" width="14" height="10" fill="${BLUE}"/><rect x="52" y="52" width="16" height="12" fill="${YELLOW}"/><rect x="120" y="80" width="60" height="38" fill="${BROWN}"/>${person({x:100,y:46,s:.8,...ANA})}${person({x:150,y:32,s:.75,hair:INK,shirt:WHITE,beard:true})}`),
  park:scene(`${sky()}${ground('#a8d5a2')}<circle cx="30" cy="52" r="24" fill="${GREEN}"/><path d="M30 76 L30 118" stroke-width="6" stroke="${BROWN}"/><circle cx="176" cy="60" r="18" fill="${GREEN}"/><path d="M176 78 L176 118" stroke-width="5" stroke="${BROWN}"/><circle cx="160" cy="20" r="10" fill="${YELLOW}"/>${duo()}`),
  hospital:scene(`${sky('#eaf3f2')}${ground('#d4e3e1')}<rect x="10" y="20" width="60" height="98" fill="${WHITE}"/><path d="M40 30 L40 50 M30 40 L50 40" stroke="${RED}" stroke-width="6"/>${person({x:110,y:46,s:.8,...ANA})}${person({x:162,y:46,s:.8,hair:INK,shirt:WHITE,extra:`<path d="M40 60 Q40 76 50 76 Q60 76 60 60" fill="none"/>`})}`),
  pharmacy:scene(`${sky('#eaf3f2')}${ground('#d4e3e1')}<rect x="8" y="30" width="80" height="88" fill="${WHITE}"/><rect x="34" y="10" width="28" height="28" rx="4" fill="${GREEN}"/><path d="M48 16 L48 32 M40 24 L56 24" stroke="${WHITE}" stroke-width="5"/>${person({x:120,y:46,s:.8,...ANA})}${person({x:170,y:46,s:.8,hair:'#3b2a22',shirt:WHITE,long:true})}`),
  office:scene(`${sky('#eef0ee')}${ground('#d7d9d5')}<rect x="20" y="76" width="90" height="8" fill="${BROWN}"/><path d="M28 84 L28 118 M102 84 L102 118" /><rect x="44" y="50" width="40" height="26" rx="2" fill="${INK}"/><rect x="48" y="54" width="32" height="18" fill="${SKY}" stroke="none"/>${person({x:150,y:46,s:.85,...MINHO,coat:INK})}`),
  bank:scene(`${sky()}${ground('#cfcac0')}<path d="M10 46 L70 18 L130 46 Z" fill="${GREY}"/>${[22,46,70,94,118].map(x=>`<path d="M${x} 50 L${x} 108" stroke-width="6"/>`).join('')}<rect x="10" y="108" width="120" height="10" fill="${GREY}"/>${person({x:168,y:46,s:.8,...ANA})}`),
  party:scene(`${sky('#fbe3d6')}${ground('#efcdb8')}<path d="M0 20 Q50 40 100 20 Q150 40 200 20" fill="none"/>${[20,50,80,120,150,180].map((x,i)=>`<path d="M${x} ${26+(i%2)*4} L${x+8} ${40+(i%2)*4} L${x+16} ${26+(i%2)*4} Z" fill="${[RED,YELLOW,BLUE,GREEN,PINK,ORANGE][i]}" stroke-width="2"/>`).join('')}<circle cx="24" cy="70" r="12" fill="${PINK}"/><path d="M24 82 Q20 100 26 118" fill="none"/>${duo(46)}`),
  airport:scene(`${sky()}${ground('#cfcac0')}<path d="M20 50 L104 44 L134 14 L146 16 L126 44 L170 44 Q182 50 170 56 L126 56 L146 84 L134 86 L104 56 L20 50 Z" fill="${WHITE}" transform="translate(0 -6) scale(.9)"/>${person({x:80,y:52,s:.75,...ANA,extra:`<rect x="70" y="70" width="18" height="22" rx="3" fill="${BLUE}"/>`})}${person({x:130,y:52,s:.75,...MINHO})}`),
  bus:scene(`${sky()}${ground('#cfcac0')}<rect x="8" y="40" width="120" height="62" rx="12" fill="${YELLOW}"/><path d="M16 50 L120 50 L120 72 L16 72 Z" fill="${SKY}"/><circle cx="36" cy="104" r="10" fill="${INK}"/><circle cx="100" cy="104" r="10" fill="${INK}"/>${person({x:170,y:46,s:.8,...ANA})}`),
  rain:scene(`${sky('#d5dde3')}${ground('#b9c3c8')}<path d="M30 40 Q16 40 18 28 Q20 16 34 18 Q40 4 58 6 Q74 6 78 18 Q96 16 96 30 Q96 40 84 40 Z" fill="${GREY}"/>${[20,40,60,80,140,160,180].map((x,i)=>`<path d="M${x} ${50+(i%3)*10} L${x-4} ${62+(i%3)*10}" stroke="${BLUE}"/>`).join('')}<path d="M86 66 Q88 38 112 36 Q136 38 138 66 Q124 60 112 66 Q100 60 86 66 Z" fill="${RED}"/>${person({x:112,y:52,s:.75,...ANA})}`),
  generic:scene(`${sky('#f6e7cf')}${ground()}<circle cx="170" cy="26" r="12" fill="${YELLOW}"/>${duo()}`),
};

const UNIT_SCENES=[[/home|hogar/,'home'],[/food|comida/,'restaurant'],[/routine/,'bedroom'],[/places|survival|direction/,'street'],[/identity|introduc/,'classroom'],[/people|family/,'park'],[/shopping/,'shop'],[/transport/,'station'],[/health/,'hospital'],[/weather/,'rain'],[/social|party/,'party'],[/work|office|technology/,'office'],[/services/,'bank'],[/reading|hangul|foundations|vocabulary|essentials|questions|time/,'classroom'],[/culture|experiences|narrative/,'park']];

export function sceneSvg(key){return SCENES[key]||'';}
export function sceneFor(unitId=''){
  const match=UNIT_SCENES.find(([pattern])=>pattern.test(String(unitId)));
  return SCENES[match?.[1]||'generic'];
}
export const SCENE_KEYS=Object.keys(SCENES);
