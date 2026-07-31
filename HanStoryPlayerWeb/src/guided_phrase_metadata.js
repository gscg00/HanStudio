// Reviewed phrase support for the guided courses.  This is intentionally
// authored data: the player must never derive glosses or audio examples from
// a sentence automatically.
export const PHRASE_SUPPORT_BY_LANGUAGE={
  Korean:{
    '사울 씨, 잘 잤어요?':{word_breakdown:[
      {text:'사울 씨',meaning:'Saul + 씨 (tratamiento respetuoso)'},{text:'잘',meaning:'bien'},{text:'잤어요',meaning:'dormiste / durmió'}
    ],usage_note:'잘 잤어요? es una pregunta amable para saber si alguien durmió bien.',context_note:'Se usa como saludo por la mañana.'},
    '네, 잘 잤어요. 그런데 아직 조금 피곤해요.':{word_breakdown:[
      {text:'네',meaning:'sí'},{text:'잘 잤어요',meaning:'dormí bien'},{text:'그런데',meaning:'pero / sin embargo'},{text:'아직',meaning:'todavía'},{text:'조금',meaning:'un poco'},{text:'피곤해요',meaning:'estoy cansado/a'}
    ],usage_note:'En coreano se puede omitir “yo” cuando el contexto ya deja claro quién habla.'},
    '괜찮아요. 오늘은 천천히 쉬어도 돼요.':{word_breakdown:[
      {text:'괜찮아요',meaning:'está bien / no pasa nada'},{text:'오늘은',meaning:'hoy (como tema)'},{text:'천천히',meaning:'despacio'},{text:'쉬어도 돼요',meaning:'puedes descansar'}
    ],usage_note:'-아/어도 돼요 expresa permiso: “puedes / está bien que…”.'},
    '사울 씨, 아침이에요. 일어나야 해요.':{word_breakdown:[
      {text:'사울 씨',meaning:'Saul + tratamiento respetuoso'},{text:'아침이에요',meaning:'es de mañana'},{text:'일어나야 해요',meaning:'tienes que levantarte'}
    ],usage_note:'-아/어야 해요 expresa necesidad: “tener que…”.'},
    '벌써 아침이에요? 시간이 빨라요.':{word_breakdown:[
      {text:'벌써',meaning:'ya (con sorpresa o antes de lo esperado)'},{text:'아침이에요',meaning:'es de mañana'},{text:'시간이',meaning:'el tiempo (como sujeto)'},{text:'빨라요',meaning:'es rápido'}
    ],usage_note:'벌써 suele transmitir que algo llegó antes de lo esperado.'},
    '네. 마을에서는 아침이 아주 중요해요.':{word_breakdown:[
      {text:'네',meaning:'sí'},{text:'마을에서는',meaning:'en la aldea'},{text:'아침이',meaning:'la mañana'},{text:'아주',meaning:'muy'},{text:'중요해요',meaning:'es importante'}
    ],usage_note:'-에서는 sitúa la afirmación en un lugar o contexto.'},
    '여기는 부엌이에요. 여기에서 음식을 만들어요.':{word_breakdown:[
      {text:'여기는',meaning:'aquí (como tema)'},{text:'부엌이에요',meaning:'es la cocina'},{text:'여기에서',meaning:'aquí, en este lugar'},{text:'음식을',meaning:'la comida (objeto)'},{text:'만들어요',meaning:'preparo / se prepara'}
    ],usage_note:'여기는 nombra el tema; 여기에서 indica el lugar donde ocurre la acción.'},
    '부엌은 음식을 만드는 곳이에요.':{word_breakdown:[
      {text:'부엌은',meaning:'la cocina (como tema)'},{text:'음식을',meaning:'la comida (objeto)'},{text:'만드는',meaning:'que prepara / donde se prepara'},{text:'곳이에요',meaning:'es un lugar'}
    ],usage_note:'El verbo antes de 곳 describe qué se hace en ese lugar.'},
    '맞아요. 그리고 저기는 방이에요.':{word_breakdown:[
      {text:'맞아요',meaning:'correcto / así es'},{text:'그리고',meaning:'y / luego'},{text:'저기는',meaning:'allí, lejos de ambos'},{text:'방이에요',meaning:'es una habitación'}
    ],usage_note:'여기 es “aquí”; 저기 es “allí”, lejos de quien habla y escucha.'},
    '사울 씨는 오늘 그 방에서 쉬면 돼요.':{word_breakdown:[
      {text:'사울 씨는',meaning:'Saul (como tema)'},{text:'오늘',meaning:'hoy'},{text:'그 방에서',meaning:'en esa habitación'},{text:'쉬면 돼요',meaning:'puedes / basta con descansar'}
    ],usage_note:'-(으)면 돼요 significa que una acción es suficiente o adecuada.'},
    '정말요? 감사합니다. 이 집은 따뜻해요.':{word_breakdown:[
      {text:'정말요?',meaning:'¿de verdad?'},{text:'감사합니다',meaning:'gracias'},{text:'이 집은',meaning:'esta casa (como tema)'},{text:'따뜻해요',meaning:'es cálida / acogedora'}
    ],usage_note:'따뜻해요 puede describir temperatura o un ambiente acogedor.'},
    '우리 집이라고 생각해도 돼요.':{word_breakdown:[
      {text:'우리',meaning:'nuestro / nuestra'},{text:'집이라고',meaning:'como “casa”'},{text:'생각해도 돼요',meaning:'puedes pensar / considerar'}
    ],usage_note:'La expresión invita a tratar el lugar como propio, de forma amable.'},
    '아침 먹을래요? 밥하고 국이 있어요.':{word_breakdown:[
      {text:'아침',meaning:'desayuno / mañana'},{text:'먹을래요?',meaning:'¿quieres comer?'},{text:'밥하고',meaning:'arroz y'},{text:'국이',meaning:'sopa (como sujeto)'},{text:'있어요',meaning:'hay'}
    ],usage_note:'-을래요? propone algo de forma informal y amable.'},
    '네, 먹고 싶어요. 조금 배고파요.':{word_breakdown:[
      {text:'네',meaning:'sí'},{text:'먹고 싶어요',meaning:'quiero comer'},{text:'조금',meaning:'un poco'},{text:'배고파요',meaning:'tengo hambre'}
    ],usage_note:'-고 싶어요 expresa el deseo propio de hacer una acción.'},
    '천천히 먹어요. 아직 뜨거워요.':{word_breakdown:[
      {text:'천천히',meaning:'despacio'},{text:'먹어요',meaning:'come / comemos'},{text:'아직',meaning:'todavía'},{text:'뜨거워요',meaning:'está caliente'}
    ],usage_note:'En contexto, 먹어요 puede sonar como una recomendación amable: “come despacio”.'}
  }
};
