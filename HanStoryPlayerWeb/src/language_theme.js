// Identidad visual de cada idioma: un carácter propio y un degradado de dos tonos.
// Se usa en Inicio y en las cabeceras del curso para que cada idioma se reconozca de un vistazo.
// Los dos tonos son oscuros a propósito: el texto blanco encima cumple contraste AA.
export const LANGUAGE_THEMES=Object.freeze({
  English:{glyph:'Aa',a:'#0b3b5c',b:'#13706b'},
  French:{glyph:'É',a:'#1c2a6b',b:'#3b4fb8'},
  German:{glyph:'Ä',a:'#25221f',b:'#7a4a12'},
  Italian:{glyph:'À',a:'#0f3d2a',b:'#1d6b45'},
  Portuguese:{glyph:'Ç',a:'#063d3a',b:'#7a5a06'},
  Japanese:{glyph:'あ',a:'#5a1020',b:'#a8233a'},
  Korean:{glyph:'한',a:'#2a1f6b',b:'#8a1f5c'},
  Russian:{glyph:'Я',a:'#3a1414',b:'#1f3a8a'},
  Chinese:{glyph:'中',a:'#5c1414',b:'#8a4a06'},
  Arabic:{glyph:'ع',a:'#0b3a3a',b:'#14566b'},
});
export const languageTheme=language=>LANGUAGE_THEMES[language]||{glyph:'·',a:'#1f2937',b:'#374151'};
export const themeStyle=language=>{const theme=languageTheme(language);return`--lang-a:${theme.a};--lang-b:${theme.b}`;};
