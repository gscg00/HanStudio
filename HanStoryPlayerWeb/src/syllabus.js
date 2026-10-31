// Plan de enseñanza de la clase del día: el orden en que un profesor enseñaría
// un idioma, no el orden de los cursos viejos. Cada tema tiene una meta que se
// puede usar en la vida real («saludar y despedirte»). El material sale de los
// cursos: cada palabra o frase se asigna a un tema por su unidad o, en las
// unidades generales (vocabulario frecuente, pronombres…), por su significado.
// La lectura (letras, kana) va en paralelo: un poco cada día.

const norm=value=>String(value??'').normalize('NFD').replace(/\p{Mn}/gu,'').toLowerCase().replace(/[¿¡?!.,;:()«»"']/g,' ').replace(/\s+/g,' ').trim();

// Unidades que enseñan a leer: van en la pista de lectura, no en los temas.
export const READING_UNITS=new Set(['hangul-foundations','reading-foundations','reading','hiragana-01','katakana','rhythm']);

const words=list=>list.split('|').map(key=>key.startsWith('=')?'='+norm(key.slice(1)):norm(key));
export const SYLLABUS=[
  {id:'saludos',goal:'Saludar y despedirte',keys:words('hola|adios|hasta luego|hasta manana|buenos dias|buenas tardes|buenas noches|gracias|muchas gracias|de nada|por favor|perdon|disculpe|lo siento|bienvenido|que tal|como estas|bien gracias|nos vemos')},
  {id:'presentarse',goal:'Presentarte: tu nombre, de dónde eres y qué idioma hablas',keys:words('me llamo|como te llamas|nombre|soy de|pais|mucho gusto|encantado|yo|usted|ella|nosotros|idioma|hablo|habla|mexico|mexicano|espanol|soy|eres|estudiante')},
  {id:'sobrevivir',goal:'Sobrevivir en una conversación: no entiendo, más despacio, ayuda',keys:words('no entiendo|no lo entiendo|repita|repitalo|otra vez|despacio|ayuda|ayudeme|auxilio|no se|esta bien|de acuerdo|=si|=no|=quiza|un poco|bano|donde esta el bano')},
  {id:'numeros',goal:'Contar del 0 al 10',keys:words('cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez')},
  {id:'objetos',goal:'Señalar cosas: esto, eso, aquí, allí',keys:words('esto|eso|aquello|este|ese|aquel|aqui|ahi|alli|alla|cosa|libro|lapiz|cuaderno|bolsa|telefono|llave|reloj|gafas|paraguas')},
  {id:'frases',goal:'Tus primeras frases: ser, tener, haber y decir que no',keys:words('ser|estar|tener|haber|hay|no hay|es|son|negacion|no es|ir|venir|querer|poder|hacer')},
  {id:'comida',goal:'Comida y bebida: pedir lo que quieres',units:['a1-1-food'],keys:words('comida|comer|beber|agua|cafe|te|leche|zumo|jugo|refresco|cerveza|vino|pan|arroz|sopa|fideos|carne|pescado|pollo|huevo|fruta|verdura|manzana|platano|naranja|uva|queso|mantequilla|azucar|sal|tengo hambre|tengo sed|hambre|sed|delicioso|rico|restaurante|menu|cafeteria|plato|vaso|cuchara|tenedor|cuchillo|la cuenta|desayuno|almuerzo|cena')},
  {id:'familia',goal:'Hablar de tu familia y de las personas',units:['a1-1-people'],keys:words('familia|padre|madre|papa|mama|padres|hermano|hermana|hijo|hija|abuelo|abuela|esposo|esposa|marido|mujer|hombre|nino|nina|persona|amigo|amiga|novio|novia|profesor|profesora|medico|bebe')},
  {id:'preguntas',goal:'Hacer preguntas: qué, quién, dónde, cuándo, cómo, por qué',keys:words('que|quien|donde|cuando|como|por que|cual|cuanto|cuantos')},
  {id:'tiempo',goal:'Los días, la hora y cuándo pasan las cosas',units:['a1-2-time'],keys:words('lunes|martes|miercoles|jueves|viernes|sabado|domingo|hoy|manana|ayer|ahora|que hora es|son las|es la una|hora|minuto|semana|fin de semana|mes|ano|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|tarde|noche|dia')},
  {id:'casa',goal:'Tu casa y tus cosas',units:['a1-1-home'],keys:words('casa|habitacion|cuarto|puerta|ventana|pared|cocina|cama|mesa|silla|sofa|nevera|refrigerador|salon|sala|escalera|departamento|piso')},
  {id:'rutina',goal:'Tu día a día: acciones y rutina',units:['a1-1-routine'],keys:words('levantarse|dormir|despertar|lavarse|ducharse|limpiar|cocinar|abrir|cerrar|empezar|terminar|esperar|ayudar|trabajar|estudiar|leer|escribir|escuchar|hablar|ver|caminar|sentarse|correr|jugar|voy|va|vengo|viene|como|come|bebo|bebe|hago|hace')},
  {id:'lugares',goal:'Lugares de la ciudad y cómo llegar',units:['a1-1-places'],keys:words('ciudad|calle|camino|cruce|semaforo|parque|plaza|escuela|biblioteca|oficina|correos|banco|hotel|hospital|museo|estacion|aeropuerto|puerto|tienda|mercado|izquierda|derecha|recto|derecho|cerca|lejos|aqui esta')},
  {id:'compras',goal:'Comprar: precios, dinero y contar más',units:['a1-2-shopping'],keys:words('precio|dinero|cuanto cuesta|caro|barato|cartera|recibo|pagar|comprar|vender|elegir|necesitar|mucho|poco|mas|todo|mitad|once|doce|trece|catorce|quince|dieciseis|diecisiete|dieciocho|diecinueve|veinte|cien|mil')},
  {id:'transporte',goal:'Moverte: transporte y trayectos',units:['a1-2-transport'],keys:words('autobus|metro|taxi|tren|avion|bicicleta|coche|carro|moto|motocicleta|a pie|parada|boleto|billete|viajar|llegar|salir')},
  {id:'salud',goal:'Tu cuerpo, cómo te sientes y pedir ayuda médica',units:['a1-2-health'],keys:words('cuerpo|cabeza|pelo|ojo|nariz|boca|oreja|mano|pie|brazo|pierna|vientre|barriga|cuello|garganta|diente|medicina|enfermo|sano|cansado|fiebre|tos|resfriado|herida|dolor|duele')},
  {id:'clima',goal:'El clima, la ropa y los colores',units:['a1-2-weather'],keys:words('clima|tiempo|lluvia|llover|viento|nube|nublado|despejado|calor|frio|primavera|verano|otono|invierno|ropa|camisa|pantalon|falda|vestido|zapatos|calcetines|sombrero|abrigo|guantes|rojo|azul|amarillo|verde|negro|blanco|morado|rosa|gris|marron|cafe|color')},
  {id:'planes',goal:'Invitar y hacer planes',units:['a1-2-social'],keys:words('invitar|fiesta|juntos|quieres|vamos|cita|libre|ocupado|me gusta|gustar')},
];

// Temas A2 y B1: uno por unidad, en el orden del curso.
const LATER_UNITS=[['a2-1-past','Contar lo que pasó'],['a2-1-future','Hablar de planes y del futuro'],['a2-1-comparison','Describir y comparar'],['a2-1-ability','Decir lo que puedes y debes hacer'],['a2-1-services','Resolver trámites y problemas'],['a2-1-conversation','Conversaciones conectadas'],['a2-2-opinions','Dar opiniones y razones'],['a2-2-experiences','Viajes y experiencias'],['a2-2-workStudy','Trabajo y estudio'],['a2-2-technology','Tecnología y comunicación'],['a2-2-culture','Costumbres y cultura'],['a2-2-problemSolving','Resolver imprevistos'],[null,'Vocabulario útil para leer historias'],['b1-1-narrative','Narrar con detalle'],['b1-1-cause-effect','Causas y consecuencias'],['b1-1-media','Historias, cine y medios'],['b1-1-emotions','Relaciones y emociones'],['b1-1-society','Sociedad y entorno'],['b1-1-register','Registro y cortesía'],['b1-2-conditions','Hipótesis y condiciones'],['b1-2-nuance','Opiniones con matices'],['b1-2-negotiation','Decidir y negociar'],['b1-2-projects','Proyectos y colaboración'],['b1-2-perspectives','Perspectivas y argumentos'],['b1-2-conversation','Conversaciones extensas']];
export const THEMES=[...SYLLABUS,...LATER_UNITS.map(([unit,goal])=>({id:unit||'general',goal,units:unit?[unit]:[]}))];
const themeIndex=new Map(THEMES.map((theme,index)=>[theme.id,index]));
const unitTheme=new Map(THEMES.flatMap(theme=>(theme.units||[]).map(unit=>[unit,theme.id])));
// En unidades de frases básicas, lo que no encaje en otro tema son «primeras frases».
const GRAMMAR_UNITS=new Set(['essentials','questions','first-sentences']);

// Tema de una palabra: por su unidad temática; si no, por palabras clave del significado.
export function themeFor(unitId,meaning){
  if(unitId==='a1-1-identity'){const key=keywordTheme(meaning,['saludos','sobrevivir']);return key||'presentarse';}
  if(unitTheme.has(unitId))return unitTheme.get(unitId);
  return keywordTheme(meaning)||(GRAMMAR_UNITS.has(unitId)?'frases':'general');
}
function keywordTheme(meaning,only=null){
  const text=` ${norm(meaning)} `,gloss=norm(String(meaning).split(/[;/,(]/)[0]),first=` ${gloss} `;
  // Las instrucciones de un ejercicio («Por favor, elija») no son vocabulario de un tema.
  if(/\b(elij|elig|seleccion)/.test(text))return null;
  const themes=SYLLABUS.filter(theme=>!only||only.includes(theme.id));
  const match=(test)=>themes.find(theme=>theme.keys.some(test))?.id||null;
  // De lo más específico a lo más general: glosa exacta, frase en la glosa principal,
  // palabra en la glosa principal y, por último, frase en cualquier parte.
  return match(key=>key.startsWith('=')&&gloss===key.slice(1))
    ||match(key=>!key.startsWith('=')&&key.includes(' ')&&first.includes(` ${key} `))
    ||match(key=>!key.startsWith('=')&&!key.includes(' ')&&first.includes(` ${key} `))
    ||match(key=>!key.startsWith('=')&&key.includes(' ')&&text.includes(` ${key} `));
}
export const themeRank=id=>themeIndex.get(id)??themeIndex.get('general');
export const themeGoal=id=>THEMES[themeRank(id)]?.goal||'';
