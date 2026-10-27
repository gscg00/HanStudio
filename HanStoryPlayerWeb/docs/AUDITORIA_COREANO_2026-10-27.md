# Auditoría del curso de coreano (HanStoryPlayerWeb) — perspectiva de alumno hispanohablante desde cero

Fecha: 2026-10-27 · Alcance: `library/courses/Korean` (course.json, 45 unidades activas, 447 lecciones, 7.768 actividades) · Solo lectura; no se modificó ningún archivo del proyecto.

**Método.**
- Recorrí todas las actividades con scripts `python3 -I`. Comprobé estructura, opciones, respuestas, audio, solapamiento entre unidades, reciclaje, uso de letras antes de enseñarlas y posición de la respuesta.
- Leí línea a línea todo el nivel *foundations* (A0) y todo A1-1 y A1-2.
- Muestreé con cuidado A2-1, A2-2, B1-1 y B1-2 (al menos dos lecciones completas, el diálogo y la prueba de cada unidad), y además las escaneé con grep.

**Nota sobre la severidad.** Cuando cito un ítem de lección, recuerda que los repasos (`review-*`) y las pruebas (`test-*`) son copias literales de ese ítem, con las mismas opciones en el mismo orden. Corregir el ítem de la lección no basta: hay que regenerar también su repaso y su prueba.

**Notas previas que no repito.** Lo ya documentado en `docs/QA_*.md`: la secuencia de vocales y consonantes básicas ya reparada, `teaching_refs`, la integridad técnica del audio y la fragilidad de la producción japonesa. Solo cito problemas que siguen presentes en los datos actuales.

---

## 0. Resumen en cifras

| Métrica | Valor |
|---|---|
| Unidades en `levels` / archivos en `units/` | 45 / 51 (6 huérfanos) |
| Actividades | 7.768 (1.450 teach_concept, 2.764 select_translation, 2.761 listening_choice) |
| Producción en foundations | **4 de 2.026 actividades evaluables (0,2 %)** |
| Producción en A1-1 … B1-2 | 42–43 por nivel (≈7,4 %); el resto es reconocimiento con 3 opciones |
| Ítems nuevos por lección | foundations ≈ 6,9 (máx. 10 en *vocabulary*); A1–B1 exactamente 4 (plantilla fija) |
| Ítems enseñados que **nunca** reaparecen en unidades posteriores | 827 de 1.236 (67 %) |
| Unidades duplicadas | *time* = 57/60 ítems de *survival*; en A2–B1 cada unidad hereda 8/16 ítems de otra |
| Letras usadas sin enseñarse nunca | ㄲ ㄸ ㅃ ㅆ ㅉ, ㅐ ㅔ ㅒ ㅖ, ㅘ ㅙ ㅚ ㅝ ㅟ ㅢ y los batchim dobles ㄶ ㅄ ㄺ ㄵ ㄼ |
| Claves de audio ausentes del manifiesto | 1 clave («무엇») en 8 actividades |
| Archivos de audio sin referencia en el manifiesto | 15 |
| Posición de la respuesta (3 opciones) | 1.ª 39 %, 2.ª 33 %, 3.ª 28 % (sesgo leve hacia la primera) |
| Duración estimada del curso completo | unas 27–35 h; a 45 min/día se termina en ~40 días. Es muy poco para el «B1» que promete (un B1 real de coreano requiere varios cientos de horas) |

---

## 1. CRÍTICO — bloquea el aprendizaje o enseña algo incorrecto

### C1. El alfabeto queda incompleto: 21 grafías se usan sin enseñarse nunca
- No existe ninguna tarjeta, en ninguna unidad, para:
  - Las consonantes tensas **ㄲ ㄸ ㅃ ㅆ ㅉ**.
  - Las vocales **ㅐ ㅔ ㅒ ㅖ**.
  - Los diptongos **ㅘ ㅙ ㅚ ㅝ ㅞ ㅟ ㅢ**.
  - Los batchim dobles.
- Primeras apariciones sin enseñanza previa:
  - ㅔ y ㅖ: `survival / korean-survival-01 / korean-survival-01-1-teach` (안녕하세요) y `-01-5-teach` (화장실이 어디예요?).
  - ㅆ y ㅘ: `korean-survival-01-1-listen`.
  - ㅐ: `korean-survival-01-4-teach` (말해 주세요).
  - ㅙ y ㄶ: `korean-survival-02-2-teach` (괜찮아요).
  - ㅝ: `korean-survival-02-5-teach` (뭐).
  - ㅄ: `essentials / korean-essentials-09 / -09-4-teach` (없어요).
  - ㄸ: `korean-essentials-01-2-listen`.
  - ㅢ: `vocabulary / korean-vocabulary-01-5-teach` (의사).
  - ㅃ: `korean-vocabulary-01-7-listen` (오빠).
  - ㅟ: `korean-vocabulary-04-7-teach` (귀).
  - ㄲ: `korean-vocabulary-06-10-teach`.
  - ㅚ: `korean-vocabulary-09-8-teach` (회색).
  - ㅉ: `korean-vocabulary-25-2-teach`.
  - ㄺ: `korean-vocabulary-03-10-teach` (읽습니다).
- Además, `courses/Korean.unlockRules.requireReadingMastery` declara dominada la lectura tras *hangul-foundations* + *reading*, cuando el alumno todavía no puede leer 안녕하세요 ni 감사합니다 letra por letra.
- **Corrección:** añadir a *reading* (antes de *survival*) tres lecciones con el mismo patrón que ya funciona en *hangul-foundations* (tarjeta → escucha → reconocimiento):
  1. ㅐ/ㅔ (애/에; para un hispanohablante ambas suenan «e», y conviene decirlo), ㅒ/ㅖ (얘/예).
  2. Tensas en contraste triple: 가/카/까, 다/타/따, 바/파/빠, 사/싸, 자/차/짜.
  3. Diptongos 와/워/왜/웨/외/위/의, con la nota de que 의 se lee [의], [이] o [에] según la posición.
  - Incluir una tarjeta de batchim dobles (없어요 [업써요], 괜찮아요 [괜차나요], 읽다 [익따]).

### C2. No se enseña ninguna regla de pronunciación encadenada
- El curso solo dice que el batchim «cierra la sílaba» (`korean-hangul-00-batchim-*`, `korean-essentials-07-5-teach`). Ni en A0 ni en A1 hay tarjetas sobre:
  - **연음 (encadenamiento):** 한국어 [한구거], 이름이 [이르미], 음식이 [음시기], 맛있어요 [마시써요], 길이에요 [기리에요].
  - **Nasalización:** 감사합니다 [감사함니다], 합니다 [함니다].
  - **ㅎ débil:** 괜찮아요 [괜차나요], 좋아요 [조아요].
  - **Tensificación:** 학교 [학꾜], 없어요 [업써요].
  - **Neutralización a 7 sonidos finales:** 부엌 [부억], 밖 [박], 옷 [옫].
- Los primeros audios ya los contienen. La consigna de `korean-hangul-00-words-intro` y de `-word-*-teach`, «Lee cada bloque una sola vez y luego une», hace que el alumno lea 한국어 como [한-국-어] y luego no reconozca lo que oye.
- **Corrección:** una lección «Cómo suenan los bloques juntos» al final de *reading*, con cuatro reglas y un ejemplo con audio de cada una. Añadir `sound_hint` a los ítems afectados de A0 y A1.

### C3. Foundations es casi 100 % reconocimiento y no enseña a conjugar
- De 2.026 actividades evaluables de A0, solo 4 son de producción, todas en `hangul-foundations / korean-hangul-foundations-production-checkpoint`.
- En todo A0 no hay ninguna tarjeta con la regla de **-아요/-어요/-해요**:
  - Solo se enseñan 있어요/없어요 e 이에요/예요 (`korean-essentials-09-*`).
  - Los verbos se enseñan en forma de diccionario (이다, 있다, 가다, 오다, 하다, 원하다, 할 수 있다 en `korean-essentials-02/03`).
  - Desde *reading-bridge* aparecen formas conjugadas: 마셔요, 먹어요, 깼어요, 열어요, 조심하세요, 나가고 싶어요.
- Para un alumno tipo Assimil/Rosetta, que aprende por repetición, esto deja sin generalizar todo lo que repite.
- **Corrección:**
  - Añadir a *essentials* una lección: quitar -다; ㅏ/ㅗ → -아요; resto → -어요; 하다 → 해요; contracciones 마시+어 → 마셔, 오+아 → 와.
  - Añadir 안 + verbo con 3 ejemplos.
  - Añadir 1–2 actividades de producción (dictado o bloques) por lección de A0.

### C4. La unidad *time* duplica *survival*, y *questions* duplica *essentials*
- `time` (16 lecciones) comparte **57 de 60** ítems con `survival`, en el mismo orden: saludos, números del 0 al 20, días y pronombres. Su título, «Números, tiempo y vida diaria», promete contenido que no tiene.
- `questions` (2 lecciones) comparte 7 de 9 ítems con `essentials-03/04`.
- En total son unas 600 actividades de repetición presentadas como unidades nuevas.
- **Corrección:** reescribir *time* con contenido nuevo:
  - Números nativos 1–10 con contadores (개, 명, 시, 살).
  - Contracciones 한/두/세/네.
  - La hora (세 시 삼십 분).
  - 월/일 con las excepciones 유월/시월.
  - Precios (천, 만, 원).
  - Fusionar *questions* con *essentials* o ampliarla con preguntas completas (뭐예요? 어디예요? 누구예요? 언제예요? 왜요?).

### C5. Ejemplos agramaticales en *vocabulary*: verbos en forma de diccionario
- Ubicación: `vocabulary / korean-vocabulary-28 … 30`, actividades 28-10, 29-1, 29-2, 29-8 y 30-3 a 30-10 (teach).
- Ejemplos actuales: «나는 학교에 가다.», «비가 오다. 하지만 우리는 가다.», «피곤하다. 그래서 일찍 자다.», «나는 빵 그리고 우유를 먹다.»
- **Corrección:** «저는 학교에 가요.», «비가 와요. 하지만 우리는 가요.», «피곤해요. 그래서 일찍 자요.», «빵을 먹어요. 그리고 우유를 마셔요.» (그리고 no une sustantivos, y la leche se 마시다).

### C6. Traducciones erróneas en *vocabulary* y en los puentes
| Ubicación | Actual | Corrección |
|---|---|---|
| `vocabulary / korean-vocabulary-13 / -13-9-teach` | «버터를 바꿔요. — Pongo mantequilla.» (바꾸다 = cambiar) | «빵에 버터를 발라요. — Unto mantequilla en el pan.» |
| `vocabulary / -29-7-teach/-meaning`, `-08-4-teach` | 새롭다 = «nuevo»; ejemplo «신발이 새로워요» | Enseñar «새 = nuevo (delante del sustantivo)»: «새 신발이에요.» Si se mantiene 새롭다, glosarlo como «novedoso, fresco». |
| `vocabulary / -31-5, -31-6, -42-3` | 이주 = «Mudanza» | 이주 = «migración, traslado a otra región o país»; mudanza = 이사 |
| `story-bridge / korean-story-bridge-02 / -02-5-teach, -meaning`; `review-03-2`; `test-08-4` | «길이에요.» = «Es la longitud.»; el WB analiza 길이 + 에요 | 길 + 이에요 = «Es un camino.» El contexto del libro L01, pista 1072, es un sendero en el bosque. Además el análisis actual contradice la regla 이에요/예요 que el curso enseña. |
| `reading-bridge / korean-reading-bridge-01 / -01-4-teach, -meaning` | «아루?» = «¿Ah, sí? / ¿Ah, tú?»; WB: «루?: no se puede analizar» | «¿Aru?» (Saúl repite el nombre para confirmar) |
| `reading-bridge / -05-2-teach, -meaning` | «몰라요?» = «¿No lo sé?» | «¿No lo sabe?» |
| `reading-bridge / -08-2`, `-10-2/3/4`; `test-16-7`, `test-16-9` | 마셔요? = «¿Bebe?»; 먹어요. = «Como / come / comen.» | Según el diálogo: «¿Me la bebo?», «Coma.», «¿(Lo) como?», «Sí, coma.» Añadir la nota: «-아/어요 afirma, pregunta o invita según la entonación». |
| `reading-bridge / -08-1-teach` (WB) | «-어요/-아요 → -셔요» (sugiere el honorífico -시-) | «마시- + -어요 → 마셔요 (ㅣ+ㅓ → ㅕ)» |

### C7. Producción: casi imposible acertar con variantes correctas
- **La tolerancia a erratas no funciona.** Todas las actividades de producción y todos los turnos de diálogo llevan `allow_minor_typos: true`. Pero `src/guided_course_answers.js` (línea ~87) exige además `activity.answer_policy==='spelling_tolerant'`, y solo 1 de las 7.768 actividades lo tiene.
- **Los espacios cuentan.** `keepSpaces` está activo en typed_translation, dictation, open_question y speak_and_transcribe. Por eso «이름이뭐예요?» falla.
- **Una sola respuesta aceptada.** Se rechazan, por ejemplo:
  - «멕시코에서 왔어요.» (sin 저는, que es lo más natural)
  - «8시에 도착해요.» / «7시에 일어나요.» (cifras; el reconocimiento de voz suele devolver cifras)
  - «어디서 만날까요?»
  - «열쇠가 탁자 위에 있어요.»
- **Sin margen en los diálogos.** `minimum_correct` es igual al número de turnos (2/2 y 3/3; p. ej. `a1-2-social / korean-a1-2-social-production-dialogue`).
- **Corrección:**
  - Añadir `answer_policy:"spelling_tolerant"` en datos o arreglar la condición.
  - Normalizar los espacios en coreano y aceptar cifras arábigas.
  - Ampliar los `accepted_answers` (listas propuestas por unidad en el anexo A).
  - Poner `minimum_correct = n-1`.

### C8. A2–B1: la mitad de cada unidad es contenido heredado, y B1 contiene material de A2
- Cada unidad de A2-1 a B1-2 tiene 16 ítems, de los cuales **8 son idénticos** a los de una unidad anterior y se vuelven a presentar con teach_concept como si fueran nuevos. Cadenas detectadas:
  - past → experiences → b1-1-narrative → b1-2-perspectives
  - services → problemSolving → b1-1-register → b1-2-negotiation
  - comparison → culture → b1-1-society
  - conversation → opinions → b1-1-emotions
  - …
- `b1-1-society` enseña como «B1» las palabras sueltas de A2-1: 더, 덜, 같다, 다르다, 높다, 빠르다. Su `production-open` pide «alto» → «높다».
- `b1-1-emotions` enseña los conectores de A2-1 (정말, 물론, 아마…).
- «¿Qué significa «아마»?» aparece **16 veces** en el curso.
- **Corrección:** convertir los 8 ítems heredados en repaso (sin teach_concept) y añadir 8 ítems nuevos del tema de cada unidad.

### C9. `b1-1-register` no enseña registro
- No hay ninguna tarjeta sobre 합니다체 / 해요체 / 반말 ni sobre honoríficos (-시-, 드리다, 께서). No aparece ningún ejemplo en 반말, y la mitad de los ítems no tratan de registro (p. ej. «지금 전화하면 곧 올 거예요.»).
- El registro se mezcla en todo el curso sin explicación (ver I1). Esta unidad debería resolverlo.
- **Corrección:**
  - Añadir una tarjeta: «합니다체 (감사합니다): formal, avisos y trabajo · 해요체 (감사해요): cortés cotidiano · 반말 (고마워): amigos o menores».
  - Añadir pares mínimos: 도와주시겠어요? / 도와줄래요? / 도와줄래? y 감사합니다 / 고마워요 / 고마워.

---

## 2. IMPORTANTE

### I1. Registro mezclado sin explicación desde la primera lección de vocabulario
- `vocabulary / korean-vocabulary-01 / -01-1-teach`:
  - La nota dice que 나 es casual, pero el ejemplo es «나는 학생입니다» (casual + 합니다체).
  - **Corrección:** «나는 학생이야.» o «저는 학생이에요.»
- Fases de registro sin ninguna regla explicada al alumno:
  - L01–06 y L17–19 en 합니다체.
  - L04–27 en 해요체.
  - L28–30 en forma de diccionario.
  - L31–48 en 반말 («잘 모르겠어», «다시 생각할래», «저장할 수 없나 봐»).
- `korean-essentials-03-2-teach` (원하다):
  - Ejemplo «나는 커피를 원한다» (한다체). Además, 원하다 no es la forma de pedir algo.
  - **Corrección:** «커피 주세요.» / «커피를 마시고 싶어요.»
- `a1-1-identity`: 감사합니다 y 부탁합니다 (합니다체) conviven con 해요체 sin nota.

### I2. Pronombres engañosos para un hispanohablante
- **당신 = «usted / tú»** (`korean-essentials-01-3-teach`):
  - Dirigirse a alguien con 당신 suena brusco; se reserva para parejas, anuncios o discusiones.
  - **Corrección:** glosa «tú (pareja / escrito; evitar al hablar con alguien)» y la nota «para "usted" se usa el nombre + 씨 o el cargo».
  - `b1-2-projects / korean-b12-projects-02-11-teach` usa «당신은 발표를 맡아 주세요» entre compañeros. **Corrección:** «민수 씨가 발표를 맡아 주세요.»
- **그 «él», 그녀 «ella», 그들 «ellos»**:
  - Ubicaciones: `korean-essentials-01-4/5`, `-02-2`, `korean-vocabulary-01-5/6`; frases en `a1-1-people-01-10`, `-02-11` y 50 apariciones en B1.
  - Son pronombres de la lengua escrita.
  - **Corrección:** nota «al hablar se usa 그 사람 / 이 사람 / el nombre». Cambiar los ejemplos a «이 사람은 제 친구예요.»
- **Pares que se solapan:**
  - 그것 «eso, aquello» / 저것 «aquello» (`korean-vocabulary-01-8/9`) → 그것 = «eso (cerca del oyente)», 저것 = «aquello (lejos de ambos)».
  - `korean-vocabulary-02-1-teach` usa 저 como «aquel» (저 남자) justo después de enseñar 저 = «yo», y lo traduce «Ese hombre». **Corrección:** «Aquel hombre es alto.», con una nota de homonimia.

### I3. Descripciones de sonidos engañosas en *reading*
- `korean-reading-07-1-teach/-meaning`: «자: ya/cha suave». Un hispanohablante leerá «ya». **Corrección:** «cha suave, sin soplo de aire (nunca "ya")».
- `korean-reading-02-4-teach`: «ㅈ: entre ch y y fuerte». **Corrección:** «ch suave, sin aire; en medio de palabra se acerca a "y" rehilada».
- `korean-reading-03-4-teach`: «ㅎ: h aspirada». **Corrección:** «como una j muy suave o la h inglesa; nunca muda».
- `korean-reading-01-4-teach`: «ㄹ: entre r suave y l». Añadir: «al inicio o entre vocales, r suave; al final de sílaba, l».
- Distractores no enseñados o triviales:
  - `korean-reading-01-1-listen` ofrece ㅋ (se enseña en reading-03).
  - Casi todas las escuchas mezclan una consonante con dos vocales (ㄱ / ㅋ / ㅕ; ㄴ / ㅌ / ㅗ), y se aciertan por categoría sin escuchar.
  - **Corrección:** usar distractores de la misma clase y ya enseñados (ㄱ / ㄴ / ㄷ).
- `korean-reading-06-1-meaning` («¿Cómo se pronuncia «나»?»): el distractor «yo» es justamente el significado de 나. Sustituirlo por «ma».
- `korean-hangul-00-word-milk-teach` / `-word-milk-q` / `-test-reading` usa 우유 (ㅠ) antes de enseñar ㅠ (`korean-reading-05-2-teach`). Cambiar por 오이 o 아이, o mover la palabra.

### I4. Las tarjetas «regla» se reutilizan con palabras reales
- Ubicaciones: `survival / korean-survival-12 / -12-3, -12-4, -12-5` y `essentials / korean-essentials-07 / -07-1, -07-2, -07-3`.
- Usan 가, 너 y 도 como ejemplos de «bloque». Pero 가 es partícula, 너 = «tú» y 도 = «también».
- En el lexicón queda registrado «너 = Se lee de izquierda a derecha dentro del bloque».
- Las preguntas «¿Qué debes recordar sobre «너»?» se responden por eliminación entre frases genéricas.
- Las de *survival-12* están además fuera de lugar: teoría de hangul tras los números.
- **Corrección:** eliminarlas de *survival* (están duplicadas en *essentials*) y usar ejemplos sin significado léxico (기, 노, 두).

### I5. Números: dos sistemas sin regla
- *survival* y *time* enseñan los sino-coreanos 0–20, y en seguida aparece «세 시예요» (nativo) sin nota.
- *vocabulary-09/10* enseña los nativos 하나–아홉 mezclados con colores. Falta 열 = 10 (y 열 se enseña como «fiebre», `korean-vocabulary-06-1`).
- Se usan sin explicación 두 개, 한 장, 세 명, 두 명 y 두 번 (contracciones y contadores).
  - Ubicaciones: `korean-vocabulary-10-4`, `-16-8/9/10`, `story-bridge-05-4/5`, `a1-1-people-02-12`, `a1-2-transport-01-09`, `a1-2-health-03-14`.
- La unidad `a1-2-shopping` («Compras y precios») no contiene ningún precio, ni 원, ni 천, ni 만.
- `a1-2-time` («Fechas, horas y citas») no tiene 분, 월 ni 일.
- **Corrección:** ver C4. Una tarjeta-regla: «nativos (한·두·세·네…) para la hora, la edad y los contadores; sino-coreanos (일·이·삼…) para minutos, fechas, precios y grados». Añadir «열 = diez / fiebre».

### I6. Gramática usada antes de enseñarse (A1)
En A1 ningún teach_concept explica gramática: son frase + traducción. Aparecen sin nota:

| Gramática | Ítem |
|---|---|
| -지 못해요 | `a1-1-identity-04-16`; además «이해하지 못해요» suena poco natural → «잘 모르겠어요» o «이해가 안 돼요» |
| -(으)ㄴ 후에 | `a1-1-routine-02-11`, «일한 후에» |
| -기 전에 | `-02-12` |
| -지 않아요 | `routine-04-16`, `food-04-16` |
| -아/어 있다 | `a1-1-home-04-16`, «문이 열려 있어요» |
| 은/는 vs 이/가 | `a1-1-places-01-09` vs `-03-13` |
| -(으)ㄹ 수 있어요 | `a1-2-shopping-03-13` |
| -아/어야 해요 | `a1-2-transport-03-13` |
| -(으)ㄹ까요 | `a1-2-social-02-12`, `-03-13` |
| -(으)ㄹ래요 | `social-01-09` |
| -아/어도 돼요 | `social-04-15` |
| -(으)ㄹ 거예요 | `a1-2-weather-01-10` |
| irregular ㅂ | `weather-02-11`, «추워요» |
| pasado + -아/어지다 | `transport-03-14`, `health-04-15` |
| irregular 르 | `health-04-16`, «불러 주세요» |
| -(으)ㄹ게요 | `shopping-02-12` |
| -고 싶어요 | `reading-bridge-12-3` |
| 도 | `story-bridge-05-2`, `reading-bridge-05-3` |
| -(으)로 | `story-bridge-03-2` |
| pasado | `reading-bridge-01-1`, «깼어요» |

- **Corrección:** añadir `usage_note` de una línea en cada caso (los textos están propuestos en el anexo B) y, en cada unidad de A1, una teach_pattern con la estructura principal y 2–3 verbos distintos.

### I7. Traducciones engañosas en A0 y A1
| Ubicación | Actual | Corrección |
|---|---|---|
| `korean-survival-01-3-*`, `korean-time-01-4-*` | 잘 모르겠어요 = «No lo entiendo bien.» | «No estoy seguro / No lo sé bien.» (para «no entiendo»: 이해가 안 돼요). En *reading-bridge*, 모르겠어요 = «No lo sé»: unificar. |
| `a1-1-identity-04-15-meaning/-listen` | «Hablo un poco de este idioma.» (el teach dice «…de coreano») | «Hablo un poco de coreano.» |
| `a1-1-identity-02-12-*` | 부탁합니다 = «Por favor.» | «Se lo pido / Por favor (al pedir un favor)». Nota: para pedir cosas se usa N 주세요. |
| `a1-1-identity-02-03-*` | 좋은 저녁이에요 = «buenas noches». Es un calco del inglés; la propia nota lo admite. | Sustituir por 안녕히 주무세요 o 안녕히 계세요. |
| `a1-1-routine-01-01-*` | 일어나다 = «despertarse» (la frase 03-13 dice «me levanto») | «levantarse» (despertarse = 깨다) |
| `a1-1-food-03-14-*` | 밥을 조금 주세요 = «Quiero un poco de arroz.» | «Deme un poco de arroz, por favor.» |
| `a1-1-food-02-11-*` | «이것을 원해요.» (poco natural) | «이거 주세요.» |
| `a1-2-time-04-15-*` | 늦을 것 같아요 = «Llego tarde.» | «Creo que voy a llegar tarde.» |
| `a1-2-social-02-04-*` | 시간 = «hora» | «tiempo (libre); horas de duración»; la hora del reloj es 시. |
| `a1-2-health` producción (dictation, speak, diálogo, situación 2) | El alumno debe decir «이 약을 하루에 두 번 드세요», que es una frase del médico | Frase del paciente: «머리가 아파요.» |
| `reading-bridge-04-2-meaning` | Opciones «Es aquí.» y «Sí, es aquí.» | Cambiar el distractor por «Es una casa.» |
| `story-bridge-03-3-meaning` | «¿Por aquí?» vs «Por aquí, por favor.» | Distractor «Es un árbol.» |
| `story-bridge-03-2-*` | 이쪽으로 가요 = «Por aquí, por favor.» | «Vamos por aquí.» |
| `story-bridge-06-3-*` | 도와주세요? = «¿Me ayuda, por favor?» (es eco) | «¿«Ayuda»?» |
| `b1-1-cause-effect-03-14` (+ `b1-2-conditions-03-06`) | «Aunque estaba cansada, terminó el trabajo» (contradice su propia nota) | «Aunque estaba cansado/a, terminé el trabajo.» |
| `b1-1-cause-effect-01-09` (+ `b1-2-conditions-01-01`) | 길이 막혀서 = «la carretera estaba cerrada» | «había atasco» |
| `b1-2-conversation-04-16` | «예를 들어서 결론을 설명해 주실 수 있나요?» = «¿Puedes explicarlo con un ejemplo?» | «예를 들어 설명해 주실 수 있나요?» = «¿Podría explicarlo con un ejemplo?» |
| `a2-1-past-04-07` y `-production-open` | 일어났어요 = «ocurrió» (sin sujeto se entiende «me levanté») | «사고가 일어났어요.» |
| `a2-1-ability-04-07`, `a2-2-workStudy-04-07`, `-production-open` | «necesario» → solo acepta «필수다» | Lema «필수(이다)»; aceptar también 필요하다 / 필요해요. |

### I8. Ítems con colores, homónimos y partículas mal elegidas en *vocabulary*
- **Colores como predicado nominal:**
  - Ubicación: `-08-9/10`, `-09-1…4`.
  - Actual: «사과는 빨강이에요», «눈이 하양이에요».
  - Corrección: «사과는 빨개요 / 빨간색이에요», «눈이 하얘요». Explicar 빨강 ↔ 빨간색 ↔ 빨갛다.
- **Homónimos sin nota:**
  - 눈 (ojo / nieve; `-04-4` vs `-09-4`)
  - 배 (barriga / barco / pera)
  - 차 (té / coche)
  - 열 (fiebre / diez)
  - 쓰다 (escribir / usar / ponerse)
  - 새 (pájaro / nuevo)
- **Partícula errónea:** `-18-7-teach` «우체국에 편지를 보냅니다» → «우체국에서 편지를 보내요».
- **Ejemplos que no se traducen:**
  - Ubicación: `-03-3…6` (형/오빠/누나/언니).
  - Problema: el ejemplo «저는 형이 있어요.» lleva como traducción una explicación.
  - Corrección: «Tengo un hermano mayor.», más la nota de uso con amigos mayores.
- **Bloque L31–50 fuera de nivel, bajo el título «Vocabulario frecuente»:**
  - Contiene 무인도, 개행, 공백, 북반구, 전세기, 마음은 굴뚝같다…
  - Mezcla gramática (~게 되다, ~는 줄 알았어요) y frases en 반말.
  - Muchas fichas no tienen ejemplo.
  - Las respuestas van en mayúscula y los distractores en minúscula (`-32-4`, `test-67-10`), así que se adivinan.
  - **Corrección:** mover el bloque a las unidades de historia o a A2+, y normalizar las mayúsculas.

### I9. Los diálogos guiados no son diálogos
- Ocurre en las 36 unidades de A1–B1: `*-production-dialogue` / `stage_scenario`.
- Los turnos «model» solo dicen «Situación N». No hay ninguna intervención del interlocutor en coreano. En `a1-1-places`, la situación 3 es la palabra «izquierda».
- **Corrección:** turnos reales del interlocutor en coreano.
  - Ejemplo para *shopping*: «이거 얼마예요?» → «만 오천 원이에요.» → alumno «카드로 결제할 수 있어요?» → «죄송해요, 현금만 돼요.» → alumno «현금만 있어요.»
  - Para Assimil, estos diálogos son la pieza clave de repetición. Deberían estar al inicio de cada unidad (`dialogue_model` con audio), no solo al final.

### I10. Repasos y pruebas memorizables
- En A1–B1, todos los ítems de repaso y de prueba son copias exactas de la lección: mismas opciones, mismo orden, mismos distractores. Se comprobó byte a byte en A1-1 y en las 24 unidades de A2–B1.
- Además, los distractores suelen ser de otra categoría (una palabra suelta frente a una frase) o salen de un conjunto fijo de familia y cuerpo sin relación con el tema. Se aciertan por longitud o categoría.
- **Corrección:** barajar las opciones y generar distractores de la misma categoría y lección en repasos y pruebas.

### I11. Reciclaje insuficiente para un método de repetición
- El 67 % de los ítems enseñados (827 de 1.236) no reaparece en ninguna unidad posterior.
- En *vocabulary* (500 ítems en 50 lecciones de 10), los repasos retoman solo 4 de cada 10 ítems, y la prueba final mide 10 ítems al azar sobre 500.
- **Corrección:**
  - Repaso espaciado entre unidades: cada lección debería incluir 2–3 ítems de unidades anteriores.
  - Partir *vocabulary* en bloques temáticos intercalados con *survival*/*essentials*, en lugar de 500 ítems seguidos (≈ 1.500 actividades) entre A0 y los puentes.

### I12. Contenido mal presentado en los puentes (*reading-bridge*, *story-bridge*)
- Son frases sueltas del Libro 1 sin indicar quién habla ni la frase anterior, de ahí los errores de C6.
- `story-bridge-06` dedica 4 de sus 5 ítems a variantes de 도와주세요, ya enseñado en `survival-02-3`.
- Los ecos de una palabra (방., 물., 벽..., 집?, 나무., 길.) inflan el contador de «5 elementos nuevos».
- **Corrección:** mostrar al hablante y la línea previa, y agrupar los ecos con su frase.

---

## 3. MENOR

- **Tú y usted alternados en las traducciones.**
  - A0: «Repítalo / Hable…» (usted) frente a «¿Cómo te llamas?» (tú) en `survival-02-5`, `questions-02-3`.
  - `reading-bridge`: 깼어요? «¿Te despertaste?» frente a 괜찮아요? «¿Está bien?».
  - `a1-2-weather-02-12`: «Lleva un paraguas» frente a «Tome…».
  - Unificar en usted para 해요체 con desconocidos.
- **Glosas sinónimas sin matiz:**
  - 가방/봉지 «bolsa»
  - 가게/상점 «tienda»
  - 사다/구입하다
  - 날씨/기후 «clima»
  - 내일/아침 «mañana»
  - 테이블/탁자 «mesa»
  - Añadir «(formal)», «(parte del día)», etc.
- **Notas con erratas o spanglish en *vocabulary*:**
  - «Envio» (`-25-1`)
  - «hage flexible» (`-28-7`)
  - «formas polidas» (`-26-10`)
  - «Formal/polite», «coloquial-polite» (`-36-2`, `-46-2`, `-47-2`)
  - nota truncada «resultado no int» (`-37-9`)
- **`korean-vocabulary-05-8` USA:** «건강해요 (formal cortés)». 해요 es cortés informal.
- **`korean-vocabulary-05-7` USA:** «Conjugar quitando -다 (아파요)». Falta explicar la elisión de ㅡ.
- **`korean-vocabulary-04-6`:** «입을 닫으세요» → «입을 다무세요»; además, traducir en usted.
- **Honoríficos ausentes:** «아버지는 집에 있습니다» → «계세요» (`-02-10`); «할아버지는 책을 읽습니다» → «읽으세요» (`-03-10`). En cambio, `-03-2` usa 바쁘십니다 sin explicar.
- **`reading-bridge-09-1` USA (감사합니다):** la nota se cita a sí misma. Reescribir: «Formal y segura; más cercano: 고마워요 / 고마워».
- **`story-bridge-03-5`:** 저쪽 = «ese lado» → «aquel lado».
- **`story-bridge-01-3` CON:** «밖이 + -에요» → «밖 + 이에요».
- **`reading-bridge-02` mezcla Saul/Saúl** y le falta el ítem -2 (la descripción dice 5).
- **Traducciones o colocaciones mejorables en A1-2:**
  - 싸다 / 비싸다: glosar «ser barato / caro (→ 싸요, 비싸요)».
  - 파란색도 있어요?: falta «también».
  - 달 / 주 / 늦게: añadir acepciones.
  - «주말 날씨는 어때요?» → «¿Qué tal el tiempo este fin de semana?».
  - «여섯 시 이후에» → «후에».
- **Traducciones o colocaciones mejorables en A1-1:**
  - 함께 → 같이.
  - 곧장 가세요 → 쭉 가세요.
  - 가까이에 있어요 → 가까워요.
  - 계산서 주세요: aceptar también 계산해 주세요.
- **Traducciones imprecisas en A2–B1:**
  - «Aquí se puede tomar fotos» → «se pueden».
  - 주말에 = «al final de la semana» → «el fin de semana».
  - «이 자리에 앉아도 돼요?» = «¿Puedo usar este asiento?» → «¿Puedo sentarme aquí?».
  - 약속 = «promesa»: añadir «cita».
  - «시간이 부족해서 떠났어요» (ilógico) → «…다 끝내지 못했어요».
- **`a2-2-experiences-production-complete`:** el hueco «처음이었어＿» con respuesta «요» es trivial y usa un guion bajo de ancho completo.
- **Bloques triviales:**
  - `korean-hangul-foundations-production-blocks`: 1 bloque («문»).
  - Diálogos de identity, transport, weather y social: 2 bloques.
  - `a1-1-people`: bloques de sílaba sueltas («누, 구, 예, 요, ?»), con una granularidad distinta al resto.
- **`korean-essentials-04-4` / `questions-01-5` (어떻게):** sin ejemplo.
- **안 = «no / negación»:** sin ejemplo (`korean-essentials-05-1`, `questions-02-2`).
- **Días de la semana (`survival-07-5…09-1`):** la nota «formado por elemento + '요일'» no dice nada. Mejor: «월 luna, 화 fuego, 수 agua, 목 madera, 금 metal, 토 tierra, 일 sol», que es una buena mnemotecnia visual.
- **Sesgo de posición:** la respuesta correcta es la primera opción en el 39 % de los casos. Barajar las opciones.

---

## 4. Audio

**Claves que faltan en `audio_manifest.json`.** La clave «무엇» no existe en el manifiesto (8 actividades, todas en `audio_examples`):
- essentials / korean-essentials-03 / korean-essentials-03-5-teach, -03-5-meaning, -03-5-listen
- questions / korean-questions-01 / korean-questions-01-1-teach, -01-1-meaning, -01-1-listen
- questions / korean-questions-test-03 / korean-questions-test-03-1-meaning, -03-1-listen

**Corrección:** generar el audio de «무엇» o cambiar el ejemplo por «뭐», que sí existe.

**Otros datos:**
- Todas las demás claves `audio` y `slow_audio` existen, y todos los archivos referenciados están en `audio/`.
- Hay 15 archivos en `audio/` sin referencia en el manifiesto, posiblemente sobrantes: 0e97cebfc9db5cfcad51610d, 130075a6b52d2d01396046f6, 22fd8e451c6b754ae124b38d, 2c9e343407681e72b5c0bf67, 2ccb2f97ae3b42fc4e6f7d6e, 2ec171d4a0ca5bdec7d4ef85, 43ec19b4b964bd050d305b1e, 4ddfc487273edce715f87dc5, 84c9c5e8dde0705cc92c4c7a, 8ce2ea386d49bdfb400d32c2, 908d94d45fbc85d16067a5c7, a39aee326f1dd3f99bfd593f, abef59c46ece1e4410ed2d88, bbf1e00acc174166763eed43, ec45f2b6441d7ea8d457b74e (.mp3).
- En *reading*, 49 escuchas reproducen una sílaba (가) y piden la letra (ㄱ). Es válido, pero la explicación debería decir «ㄱ es la consonante inicial de 가», no «El sonido corresponde a ㄱ».
- Según el manifiesto, parte del audio es TTS de macOS (Yuna) con `review_status: listening_review_pending`. Para un alumno que aprende imitando, conviene priorizar la revisión auditiva de los ~150 ítems de A0.

---

## 5. Unidades huérfanas y referencias

- `course.json` → `levels[].unitIds` y `units[]` coinciden (45/45). Todos los `manifest` existen.
- **Hay 6 archivos en `units/` que no referencia `course.json`.** Son versiones anteriores, de 7 lecciones, de la estructura por nivel:

| Archivo | Título | Lecciones / actividades |
|---|---|---|
| `a1-1-introductions.json` | Conocerse y presentarse | 7 / 65 (requirements: «Completar Fundamentos para empezar») |
| `a1-2-daily-life.json` | Vida diaria y autonomía | 7 / 83 |
| `a2-1-plans-and-time.json` | Planes, tiempo y decisiones | 7 / 83 |
| `a2-2-description-and-comparison.json` | Describir, comparar y resolver | 7 / 83 |
| `b1-1-narration-and-reasons.json` | Narrar, explicar y dar razones | 7 / 83 |
| `b1-2-independent-reading.json` | Lectura guiada e independencia | 7 / 83 |

- **Corrección:** archivarlos fuera de `units/`, o borrarlos si nada los usa, para que ningún auditor ni generador los tome como contenido vigente.
- No hay unidades referenciadas que falten en disco ni IDs de actividad duplicados.

---

## 6. Recomendaciones pedagógicas para el perfil del alumno (Assimil + Rosetta Stone, 30–60 min/día)

1. **Ver antes de traducir.** El curso es casi todo «¿Qué significa X?» con 3 opciones en español. El estilo Rosetta pide imagen → palabra. La lista `korean_picturable.json` (173 ítems concretos en orden de aparición) permite convertir los select_translation de sustantivos concretos en «escucha y elige la imagen».
2. **Diálogo primero (Assimil).** Cada unidad de A1+ debería abrir con un `dialogue_model` de 6–10 líneas con audio, repetirlo en las lecciones (ida: escuchar y leer; vuelta: traducir al coreano) y cerrar con el diálogo guiado real (I9).
3. **Producción mínima por lección.** Al menos 1 dictado y 1 bloque por lección. Hoy A0 tiene 4 actividades de producción en total.
4. **Sesión diaria.** Una lección de A1 (4 ítems × 3 actividades + intro ≈ 15 actividades) dura 5–8 minutos. Para 30–60 min/día, el alumno hará 4–8 lecciones diarias y terminará A1 en ~3 semanas. Eso confirma que el volumen por nivel es bajo, y a la vez que *vocabulary* (67 lecciones seguidas en A0) es un muro monótono.
5. **Densidad.** A0 mete hasta 10 ítems nuevos por lección (*vocabulary*), mientras que A1–B1 mete 4, de los cuales en A2–B1 solo 2 son realmente nuevos (C8). Conviene invertir el patrón: 5–6 nuevos en A0 con mucha repetición, y 6–8 en A2–B1 más reciclaje.

---

## Anexo A — accepted_answers propuestos (A1)

**A1-1:**
- identity:
  - «이름이 뭐예요?» + «이름이 무엇이에요?», «성함이 어떻게 되세요?»
  - «저는 멕시코에서 왔어요.» + «멕시코에서 왔어요.», «저는 멕시코 사람이에요.», «멕시코 사람이에요.»
- people:
  - «누구예요?» + «누구세요?», «이 사람은 누구예요?»
  - «몇 살이에요?» + «몇 살이세요?», «나이가 어떻게 되세요?»
- home:
  - «열쇠는 탁자 위에 있어요.» + «열쇠가 탁자 위에 있어요.», «열쇠는 테이블 위에 있어요.»
  - «제 방은 작아요.» + «제 방이 작아요.», «방이 작아요.»
- routine:
  - «저는 일곱 시에 일어나요.» + «일곱 시에 일어나요.», «저는 7시에 일어나요.», «7시에 일어나요.»
  - «저는 오후에 공부해요.» + «오후에 공부해요.»
- food:
  - «밥을 조금 주세요.» + «밥 조금 주세요.»
- places:
  - «역은 왼쪽에 있어요.» + «역이 왼쪽에 있어요.», «왼쪽에 있어요.»
  - «저는 학교에 가요.» + «학교에 가요.»

**A1-2:**
- time:
  - «여덟 시에 도착해요.» + «8시에 도착해요.», «여덟시에 도착해요.»
- social:
  - «어디에서 만날까요?» + «어디서 만날까요?», «어디에서 만나요?»
  - «여섯 시 이후에 시간이 있어요.» + «6시 이후에 시간이 있어요.», «여섯 시 후에 시간이 있어요.»
- shopping:
  - «카드로 결제할 수 있어요?» + «카드로 계산할 수 있어요?», «카드 돼요?»
  - «현금만 있어요.» + «저는 현금만 있어요.»
- health:
  - «페니실린 알레르기가 있어요.» + «저는 페니실린 알레르기가 있어요.», «페니실린에 알레르기가 있어요.»
- weather:
  - «코트가 필요해요.» + «코트 필요해요.»

## Anexo B — usage_note de una línea propuestas (selección)

| Estructura | Nota |
|---|---|
| -아/어요 | «Quita -다: ㅏ/ㅗ → -아요 (자요), resto → -어요 (먹어요), 하다 → 해요; 마시+어 → 마셔.» |
| -지 않아요 | «V-지 않아요 = 안 V-아요: 고기를 안 먹어요.» |
| -(으)ㄴ 후에 / -기 전에 | «después de / antes de V: 일한 후에, 자기 전에.» |
| -(으)ㄹ 수 있어요 | «poder (capacidad o posibilidad); 결제하다 → 결제할 수 있어요.» |
| -아/어야 해요 | «tener que: 갈아타다 → 갈아타야 해요.» |
| -(으)ㄹ까요? | «¿…? como propuesta: ¿quedamos…?» |
| -(으)ㄹ 거예요 | «futuro / va a…: 비가 올 거예요.» |
| -아/어도 돼요? | «¿puedo…? (permiso).» |
| -아/어 주세요 | «haga… por favor; 부르다 → 불러 주세요 (irregular 르).» |
| -(으)세요 | «imperativo cortés: 가세요 = vaya.» |
| Contadores | «하나/둘/셋/넷 → 한/두/세/네 delante de un contador: 사과 한 개, 두 명, 세 시.» |
| 은/는 vs 이/가 | «En la pregunta, 이/가 marca lo que se busca; en la respuesta, 은/는 retoma el tema ya conocido.» |
| 에 vs 에서 | «에 = lugar donde se está o al que se va; 에서 = lugar donde ocurre una acción.» |

---

## Estado de las correcciones (27 de octubre de 2026)

Aplicadas con `node scripts/repair_korean_audit_2026_10.mjs` (idempotente) y protegidas por `tests/korean_audit_repairs.test.mjs`.

| Punto | Estado | Qué se hizo |
|---|---|---|
| C1 | Corregido | `reading` 08–10: ㅐ ㅔ ㅒ ㅖ, tensas ㄲ ㄸ ㅃ ㅆ ㅉ (en contraste con suave y aspirada) y diptongos ㅘ ㅝ ㅙ ㅞ ㅚ ㅟ ㅢ. La prueba de lectura incluye 8 preguntas nuevas. |
| C2 | Corregido | `reading` 11 «Cómo suenan los bloques juntos»: encadenamiento, nasalización, ㅎ débil, tensificación, batchim doble y sonidos finales. |
| C3 | Parcial | `essentials` 10: regla -아요/-어요/해요, contracciones y negación con 안, con bloques y escritura. Falta añadir producción a cada lección de A0. |
| C4 | Corregido (`time`) | `time` reescrita: números nativos, contadores 개/명, la hora, meses (유월, 시월) y precios. `questions` sigue duplicando parte de `essentials`. |
| C5 | Corregido | Ejemplos de `vocabulary` 28–30 en presente cortés. |
| C6 | Corregido | 버터, 새롭다/새, 이주, 길이에요, 아루?, 몰라요?, 마셔요/먹어요 y la contracción ㅣ+ㅓ → ㅕ. |
| C7 | Parcial | Los espacios ya no invalidan respuestas en coreano, japonés y chino; variantes del anexo A aceptadas; diálogos de 3 turnos con un error de margen. La tolerancia a erratas sigue limitada a `spelling_tolerant` a propósito (en inglés «can»/«cant» difieren en una letra). |
| C8 | Pendiente | Reescritura de A2–B1. |
| C9 | Pendiente | Lección de registro en `b1-1-register`. |
| I4 | Corregido | Las fichas de bloque ahora muestran la fórmula (ㄱ + ㅏ → 가) y no se presentan como palabras. |

**Audio:** el contenido nuevo usa 39 claves sin grabación (unos 132 caracteres). Hasta generarlas con ElevenLabs, la app usa la voz del dispositivo y `tests/guided_content_audit.test.mjs` falla por `missing_audio_manifest_entry`.
