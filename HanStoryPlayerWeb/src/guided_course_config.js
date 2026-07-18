export const GUIDED_COURSES=Object.freeze({
  English:{slug:'english',directory:'English',name:'Inglés',flag:'🇬🇧',htmlLang:'en',languageCode:'en',accent:'#315b78',worldIcons:['A','Hi','I','?','12','W','R','B'],tagline:'Pronuncia, comprende y empieza a leer historias en inglés.'},
  Korean:{slug:'korean',directory:'Korean',name:'Coreano',flag:'🇰🇷',htmlLang:'ko',languageCode:'ko',accent:'#8c4f6c',worldIcons:['한','안','나','뭐','열','말','글','책'],tagline:'Lee hangul y construye una base práctica para tus historias.'},
  Russian:{slug:'russian',directory:'Russian',name:'Ruso',flag:'🇷🇺',htmlLang:'ru',languageCode:'ru',accent:'#48638c',worldIcons:['Я','Пр','Мы','Где','12','Сл','Чт','Кн'],tagline:'Domina el cirílico y las estructuras que abren la lectura.'},
  Italian:{slug:'italian',directory:'Italian',name:'Italiano',flag:'🇮🇹',htmlLang:'it',languageCode:'it',accent:'#438069',worldIcons:['À','Ci','Io','?','12','Pa','Le','Li'],tagline:'Aprende a leer y comunicarte con una base italiana clara.'},
  French:{slug:'french',directory:'French',name:'Francés',flag:'🇫🇷',htmlLang:'fr',languageCode:'fr',accent:'#586b9a',worldIcons:['É','Sa','Je','Où','12','Mo','Li','Lv'],tagline:'Entrena oído y lectura antes de entrar a textos graduados.'},
  German:{slug:'german',directory:'German',name:'Alemán',flag:'🇩🇪',htmlLang:'de',languageCode:'de',accent:'#7a5d42',worldIcons:['Ä','Ha','Ich','Wo','12','W','L','B'],tagline:'Comprende la lectura y el orden de la oración alemana.'},
  Japanese:{slug:'japanese',directory:'Japanese',name:'Japonés',flag:'🇯🇵',htmlLang:'ja',languageCode:'ja',accent:'#b74e55',worldIcons:['あ','ア','♪','言','文','動','形','会','日','本'],tagline:'Aprende a leer antes de entrar a tus primeras historias.'},
  Chinese:{slug:'chinese',directory:'Chinese',name:'Chino',flag:'🇨🇳',htmlLang:'zh',languageCode:'zh',accent:'#9a5145',worldIcons:['拼','你','我','吗','十','词','读','书'],tagline:'Escucha tonos, reconoce pinyin y construye frases útiles.'},
  Portuguese:{slug:'portuguese',directory:'Portuguese',name:'Portugués',flag:'🇵🇹',htmlLang:'pt',languageCode:'pt',accent:'#39775f',worldIcons:['Ç','Oi','Eu','?','12','Pa','Le','Li'],tagline:'Afina la pronunciación y empieza a leer portugués real.'},
  Arabic:{slug:'arabic',directory:'Arabic',name:'Árabe',flag:'🇸🇦',htmlLang:'ar',languageCode:'ar',accent:'#7a6543',worldIcons:['أ','ت','أنا','؟','١٢','ك','ق','ص'],tagline:'Aprende el alfabeto conectado y las frases más esenciales.'},
});

export const guidedCourseForLanguage=language=>GUIDED_COURSES[language]||null;
export const guidedCourseForSlug=slug=>Object.entries(GUIDED_COURSES).find(([,value])=>value.slug===String(slug||'').toLowerCase())||null;
export const guidedProgressId=language=>language==='Japanese'?'jp-guided-progress-v1':`guided:${GUIDED_COURSES[language]?.slug||String(language).toLowerCase()}:v1`;
