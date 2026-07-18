export const GUIDED_COURSES=Object.freeze({
  English:{slug:'english',directory:'English',name:'Inglés',htmlLang:'en',languageCode:'en',accent:'#315b78',tagline:'Pronuncia, comprende y empieza a leer historias en inglés.'},
  Korean:{slug:'korean',directory:'Korean',name:'Coreano',htmlLang:'ko',languageCode:'ko',accent:'#8c4f6c',tagline:'Lee hangul y construye una base práctica para tus historias.'},
  Russian:{slug:'russian',directory:'Russian',name:'Ruso',htmlLang:'ru',languageCode:'ru',accent:'#48638c',tagline:'Domina el cirílico y las estructuras que abren la lectura.'},
  Italian:{slug:'italian',directory:'Italian',name:'Italiano',htmlLang:'it',languageCode:'it',accent:'#438069',tagline:'Aprende a leer y comunicarte con una base italiana clara.'},
  French:{slug:'french',directory:'French',name:'Francés',htmlLang:'fr',languageCode:'fr',accent:'#586b9a',tagline:'Entrena oído y lectura antes de entrar a textos graduados.'},
  German:{slug:'german',directory:'German',name:'Alemán',htmlLang:'de',languageCode:'de',accent:'#7a5d42',tagline:'Comprende la lectura y el orden de la oración alemana.'},
  Japanese:{slug:'japanese',directory:'Japanese',name:'Japonés',htmlLang:'ja',languageCode:'ja',accent:'#b74e55',tagline:'Aprende a leer antes de entrar a tus primeras historias.'},
  Chinese:{slug:'chinese',directory:'Chinese',name:'Chino',htmlLang:'zh',languageCode:'zh',accent:'#9a5145',tagline:'Escucha tonos, reconoce pinyin y construye frases útiles.'},
  Portuguese:{slug:'portuguese',directory:'Portuguese',name:'Portugués',htmlLang:'pt',languageCode:'pt',accent:'#39775f',tagline:'Afina la pronunciación y empieza a leer portugués real.'},
  Arabic:{slug:'arabic',directory:'Arabic',name:'Árabe',htmlLang:'ar',languageCode:'ar',accent:'#7a6543',tagline:'Aprende el alfabeto conectado y las frases más esenciales.'},
});

export const guidedCourseForLanguage=language=>GUIDED_COURSES[language]||null;
export const guidedCourseForSlug=slug=>Object.entries(GUIDED_COURSES).find(([,value])=>value.slug===String(slug||'').toLowerCase())||null;
export const guidedProgressId=language=>language==='Japanese'?'jp-guided-progress-v1':`guided:${GUIDED_COURSES[language]?.slug||String(language).toLowerCase()}:v1`;
