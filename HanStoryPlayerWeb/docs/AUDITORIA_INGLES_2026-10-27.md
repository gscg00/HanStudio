# Auditoría del curso de inglés (HanStoryPlayerWeb) — perspectiva de alumno hispanohablante desde cero

Fecha: 2026-10-27 · Alcance: `library/courses/English` (course.json, 45 unidades activas, 448 lecciones y 7.311 actividades antes de las correcciones).

**Método.**
- Recorrí todas las actividades con scripts `python3 -I`. Comprobé estructura, opciones, respuestas, audio, solapamiento entre unidades, reciclaje y posición de la respuesta.
- Leí línea a línea todo *foundations* (reading-foundations, reading, survival, essentials, questions, time, vocabulary, reading-bridge, story-bridge) y todo A1-1 y A1-2, incluida la producción.
- Muestreé A2-1 a B1-2: todas las tarjetas de enseñanza, toda la producción y los diálogos de cada unidad.
- Mismo criterio que `docs/AUDITORIA_COREANO_2026-10-27.md`: los repasos (`review-*`) y las pruebas (`test-*`) son copias literales de los ítems de la lección. Por eso las correcciones se aplican a toda la unidad, no solo a la lección.

---

## 0. Resumen en cifras

| Métrica | Valor |
|---|---|
| Unidades en `levels` / archivos en `units/` | 45 / 51 (6 huérfanos) |
| Actividades | 7.311 (1.396 teach_concept, 2.591 select_translation, 2.619 listening_choice, 257 de producción) |
| Producción en foundations | **4 de 2.070 actividades evaluables (0,2 %)**, todas de copiar «TH» o dictar *ship*/*chair* |
| Respuestas fuera de las opciones / opciones duplicadas | 0 / 0 |
| Unidades duplicadas | *time* = 57/57 ítems de *survival*; *questions* = 7/9 ítems de *essentials*; en A2–B1 cada unidad hereda 8/16 ítems de otra |
| Ítems enseñados que no vuelven a enseñarse en unidades posteriores | ≈ 752 de 1.050 (72 %) |
| Claves de audio ausentes del manifiesto (antes) | 0 |
| Archivos de audio sin referencia en el manifiesto | 26 |
| Posición de la respuesta (3 opciones) | 1.ª 39 %, 2.ª 33 %, 3.ª 28 % |

---

## 1. CRÍTICO — bloquea el aprendizaje o enseña algo incorrecto

### C1. «Sonidos y lectura» no enseña ningún sonido: repite el abecedario
- `reading` (lecciones `english-reading-01` a `-06`) vuelve a enseñar los **nombres** de las 26 letras («A: ei», «B: bi», «W: dábol iu»), que ya se vieron en `reading-foundations / english-reading-00-01…06`.
- En todo A0 no hay ninguna lección de los sonidos que un hispanohablante necesita para leer y entender inglés:
  - Vocales cortas: *cat* /æ/, *sit* /ɪ/, *cup* /ʌ/ (el alumno lee *cup* con «u» española).
  - Vocales largas y pares mínimos: *ship/sheep*, *live/leave*, *food/foot*.
  - La regla de la **e final muda**: *name, home, bike*.
  - La vocal neutra (schwa) y el acento: *about, banana, teacher*, *a cup of tea*.
  - La *s* inicial sin «e» (*school*, *Spain*), las terminaciones **-ed** (t / d / id) y **-s/-es** (s / z / iz), y las letras mudas (*know, write, hour, Wednesday*).
- `reading-foundations` dedica una tarjeta a algunos de estos puntos (`00-07` a `00-12`), pero sin práctica de escucha por contraste.
- Además, en las preguntas de `reading` la respuesta se adivina por la forma: la opción larga «si; ante e/i suele sonar s» frente a «yei» y «kiu» (`english-reading-01-3-meaning`).
- **Corrección:** añadir a `reading`, antes de la prueba, cuatro lecciones con el patrón tarjeta → «¿Cómo se pronuncia?» → escucha con pares mínimos como distractores. Incluir 8 preguntas nuevas en la prueba de la unidad.

### C2. *Essentials* no enseña a conjugar
- El título promete «Ser, estar, tener, ir, querer, poder y hacer», pero solo enseña infinitivos: *to be*, *to have*, *to go*, *to want*, *to do* (`english-essentials-02`, `-03`).
- En ningún punto de A0 aparecen:
  - *I am / you are / he is*: solo la contracción *I'm*, en una ficha cuya explicación es errónea (ver C6).
  - La **-s de tercera persona** (*she works*).
  - *don't / doesn't* ni las preguntas con *do / does*.
- A1 usa todo esto sin explicarlo: «My mother works here.», «I do not work on Sunday.», «Does this bus go downtown?», «When does the train leave?».
- **Corrección:** añadir a *essentials* dos lecciones con producción:
  - *be*: am / is / are, negación y pregunta.
  - Presente simple: -s, don't / doesn't, do / does.

### C3. La unidad *time* duplica *survival*
- `time` (16 lecciones, 231 actividades) enseña **los mismos 57 ítems** que `survival`, en el mismo orden: Hello!, I don't understand, números del 0 al 20, What time is it?, días de la semana, this/that…
- Su título, «Números, tiempo y vida diaria», promete contenido que no tiene.
- No hay ni meses, ni números por encima de 20, ni horas con *past/to*, ni fechas, ni precios. El mismo patrón se detectó en coreano.
- `questions` repite 7 de sus 9 ítems de `essentials`.
- **Corrección:** reescribir `time` con decenas hasta el cien (con el contraste *thirteen/thirty*), la hora (*half past, quarter to*), los meses, las fechas con ordinales y los precios. `questions` se documenta como pendiente.

### C4. La producción rechaza respuestas correctas, y algunas indicaciones no coinciden con la respuesta
- **Contracciones.** `src/guided_course_answers.js` trata el apóstrofo como puntuación: «What's» se normaliza a «what s», que no coincide con «what is». Como cada actividad tenía una sola respuesta aceptada:
  - `a1-1-identity` typed y diálogo rechazan «What's your name?» e «I'm from Mexico.», justo las formas que enseña `survival-02-5` / `-03-1`.
  - Lo mismo ocurre con «I don't…», «I couldn't…», «won't», «That's why», «Let's…».
- **Cifras.** «I get up at 7.», «I arrive at 8.» e «I am free after 6.» se rechazan. El reconocimiento de voz suele devolver cifras.
- **Variantes naturales rechazadas.** Algunos ejemplos:
  - «Who is it?» (`a1-1-people`).
  - «Do I have to change trains?» (`a1-2-transport`).
  - «Where should we meet?» (`a1-2-social`).
  - «book» o «reserve» (`a2-1-future`, open).
  - «so» por *that is why*.
- **La indicación en español no dice lo mismo que la respuesta:**
  - `b1-2-nuance` typed: «No necesariamente significa que sea imposible.» → «That does not make it impossible.»
  - `b1-2-projects` typed: «Conviene prever los riesgos antes de empezar.» → «Let us assess the risks first.»
  - `b1-2-conversation` typed: «Antes de continuar, quisiera aclarar un detalle.» → «First, I want to clarify one detail.»
  - `b1-2-conditions` typed: «En caso de que necesites ayuda, llámame.» → «Call me if you need help.»
- **Diálogos sin margen.** `minimum_correct` es igual al número de turnos, también en los de 3 turnos: `a1-1-places`, `a1-2-social`, `a2-1-conversation`, `a2-2-problemSolving`, `b1-1-register`, `b1-2-conversation`.
- **Corrección:**
  - Generar automáticamente las variantes con y sin contracción.
  - Añadir cifras y las variantes del anexo A.
  - Alinear el español con el inglés (C5).
  - `minimum_correct = n-1` en los diálogos de 3 o más turnos.

### C5. Traducciones que dicen otra cosa (sobre todo en B1-2)
| Ubicación | Inglés | Español actual | Corrección |
|---|---|---|---|
| `b1-2-conditions` | If we leave now, we'll arrive early. | …llegaremos antes de que oscurezca. | …llegaremos temprano. |
| `b1-2-conditions` | If I had time, I'd learn another language. | Si tuviera **más** tiempo… | Si tuviera tiempo… |
| `b1-2-conditions` | The more I practise, the easier it gets. | …más natural me resulta. | …más fácil me resulta. |
| `b1-2-conditions` | Call me if you need help. | En caso de que necesites ayuda, llámame. | Llámame si necesitas ayuda. |
| `b1-2-nuance` | Overall, the result was positive. | Hasta cierto punto, … | En general, … |
| `b1-2-nuance` | I see your point, but I disagree. | …aunque lo veo de otra manera. | …pero no estoy de acuerdo. |
| `b1-2-nuance` | That does not make it impossible. | No necesariamente significa que sea imposible. | Eso no lo hace imposible. |
| `b1-2-nuance` | Is that information reliable? | ¿Qué tan segura es esa información? | ¿Es confiable esa información? |
| `b1-2-negotiation` | So, do we agree? | Entonces, ¿quedamos de acuerdo en este plan? | Entonces, ¿estamos de acuerdo? |
| `b1-2-projects` | What comes first? | Tenemos que decidir qué es prioritario. | ¿Qué va primero? |
| `b1-2-projects` | We will review progress this weekend. | …al final de la semana. | …este fin de semana. |
| `b1-2-perspectives` | What evidence supports that? | ¿Qué argumentos respaldan esa conclusión? | ¿Qué pruebas respaldan eso? |
| `b1-2-perspectives` | Experience shapes our opinions. | La experiencia personal influye en nuestra opinión. | La experiencia moldea nuestras opiniones. |
| `b1-2-conversation` | First, I want to clarify one detail. | Antes de continuar, quisiera aclarar… | Primero, quiero aclarar un detalle. |
| `a1-1-identity-04-15` | I speak a little English. | Hablo un poco de **este idioma**. | Hablo un poco de inglés. |
| `a2-1-ability` | You can take photos here. | Aquí se **puede** tomar fotos. | Aquí se pueden tomar fotos. |

- En total hay 32 frases en español corregidas (29 de B1-2, 1 de A2-1 y 2 de A1); la lista completa está en `spanishFixes` del script de reparación.

### C6. Fichas de regla con explicaciones genéricas: distractores también correctos y reglas falsas
- Ubicación: `survival-12-3…5` y `essentials-06-3…5`, `-07-1…5`, `-08-1…5`. Preguntan «¿Qué debes recordar sobre «X»?» y ofrecen explicaciones de las demás fichas como distractores, pero esas explicaciones valen para varias:
  - «Dos letras forman un solo sonido» (explicación de *sh*) también es cierta para *ch*, *ee*, *oo* y *TH*. Aparece como distractor en `english-survival-12-4-meaning` (ch) y en `english-essentials-07-1-meaning` (oo).
  - «Las contracciones son normales al hablar» (*don't*) también es cierta para *I'm*.
- La ficha `essentials-08-4` («I am → I'm») tiene una explicación que no corresponde: «El verbo be cambia según la persona». No explica la contracción.
- **Corrección:** dar a cada ficha una explicación específica e inequívoca (por ejemplo, «sh suena como cuando pides silencio: ship, she, fish»; «I'm = I am: el apóstrofo sustituye la a de am»).

---

## 2. IMPORTANTE

### I1. Respuestas cortas glosadas solo como «Sí.» / «No.»
- Ítems afectados:
  - `reading-bridge`: «Yes, I am.», «No, I don't.», «No, he isn't.».
  - `story-bridge`: «Yes, I do.», «Yes, you can.», «Yes, there are.».
- Todos se traducen «Sí.» o «No.».
- Además, «Sí.» aparece como distractor en casi todas las preguntas de esas unidades, por ejemplo `english-story-bridge-01-1-meaning`. El alumno acierta por eliminación y no aprende que la respuesta repite el auxiliar.
- **Corrección:**
  - Glosas distintas: «Sí, lo soy.», «No, no lo hablo.», «No, no lo es.», «Sí, tengo uno.», «Sí, puedes.», «Sí, sí hay.».
  - Una nota sobre las respuestas cortas.
  - Quitar «Sí.»/«No.» como distractor.

### I2. Los diálogos guiados no son diálogos
- En las 36 unidades A1–B1, los turnos del interlocutor dicen solo «Situación 1/2/3».
- En `a1-1-places` y `a1-2-social`, el tercer turno pide una sola palabra («left», «weekend»).
- **Corrección:** en A1, poner líneas reales del interlocutor en inglés, con traducción y audio. Por ejemplo, en `a1-2-shopping`:
  - «That is twenty dollars.» → «Can I pay by card?»
  - «Sorry, no cards today.» → «I only have cash.»
- A2–B1 queda pendiente.

### I3. Glosas incompletas o engañosas en *vocabulary* y A1
| Ubicación | Actual | Corrección |
|---|---|---|
| `vocabulary-31` «I am / I'm» | yo soy | yo soy / yo estoy (be es ser **y** estar) |
| `vocabulary-01` «it» | eso / ello | ello (cosa o animal; casi nunca se traduce): «It is a cat» = «Es un gato» |
| `vocabulary-21` «evening» | noche (igual que *night*) | tarde-noche (al anochecer) |
| `vocabulary-45` «should» | deberías | debería / deberías (consejo) |
| `vocabulary-38` «time» | hora | tiempo / hora |
| `vocabulary-26` | «Envio un correo» | «Envío un correo» |
| `a1-1-identity-02-03` «good evening» | buenas noches | buenas tardes / buenas noches (al llegar); para despedirse, *good night* |
| `a1-2-time-04-15` «I am running late.» | Llego tarde. | Voy tarde. |
| `a1-2-health-02-12` «Where is there a pharmacy?» (poco natural) | ¿Dónde hay una farmacia? | «Is there a pharmacy nearby?» = ¿Hay una farmacia cerca? |
| `b1-1-register`, `b1-2-*` «Let us …» (rígido) | — | «Let's …», aceptando también «Let us …» |

### I4. A2–B1: la mitad de cada unidad es contenido heredado
- Igual que en coreano (C8), cada unidad de A2-2 a B1-2 tiene 16 ítems, de los cuales **8 son idénticos** a los de una unidad anterior y se vuelven a presentar con teach_concept. Cadenas detectadas:
  - past → experiences → narrative → perspectives
  - services → technology / problemSolving → register → negotiation
  - comparison → culture → media → nuance
  - comparison → society → projects
  - conversation → opinions / emotions → b1-2-conversation
- `b1-1-society` enseña como B1 *more, less, same, tall, fast*.
- `b1-1-emotions` enseña *really, maybe, then* (A2-1).
- **Corrección (pendiente):** convertir los heredados en repaso y añadir 8 ítems nuevos por unidad.

### I5. Gramática de A1 sin ninguna explicación
- Ítems afectados:
  - present perfect «I have had a fever since yesterday» (`a1-2-health-01-10`)
  - *going to* (`a1-2-weather-01-10`)
  - *shall* (`a1-2-social`)
  - *I'd love to* / *I'll take it* (`a1-2-social`, `a1-2-shopping`)
  - *Does…?* (`a1-2-transport`)
  - *There are* (`a1-1-home`)
- Con C2 ya se cubren *do/does* y la -s.
- **Pendiente:** añadir `usage_note` de una línea a cada uno de estos casos.

### I6. Fichas de regla de lectura dentro de *survival*
- `survival-12-3…5` (sh, ch, ee) aparecen después de los números y duplican `essentials-06-3…5`.
- **Pendiente:** quitarlas de *survival*.

### I7. Variedad de español inconsistente
- Se mezclan formas de España y de México:
  - zumo / jugo de naranja
  - ordenador / computadoras
  - coche
  - billete / boleto
  - marrón
  - pantalones / pantalón
- También se mezcla tú y usted: «Can you help me?» = «¿Puedes…?», pero «Could you repeat that?» = «¿Podría…?»; «Take an umbrella» = «Lleva…», pero «Take this…» = «Tome…».
- El alumno es mexicano. **Pendiente:** unificar a español de México.

---

## 3. MENOR

- **Ejemplos poco naturales en *vocabulary*:**
  - «My eye is blue.» → «My eyes are blue.»
  - «Her age is ten.» → «She is ten.»
  - «The station is busy» = «ocupada» → «concurrida».
  - «This month is busy» = «Este mes está ocupado» (calco).
- **Notas que explican el español en vez del inglés:**
  - `how much`: «concuerda en género y número».
  - `orange juice`: «adjective + noun», aunque *orange* es aquí sustantivo.
- **El bloque `vocabulary-31…50` no tiene ejemplos.** La explicación de estas fichas está vacía.
- **Apóstrofos mezclados:** rectos (') y tipográficos (’) en A1 («I’ll take it», «Let’s meet»). La evaluación los trata igual, pero las claves de audio son distintas.
- **`reading-foundations` y `reading`:** las tarjetas tienen `meaning` vacío y dependen de la pregunta siguiente.
- **Sesgo de posición:** 39 % de las respuestas están en la primera opción.
- **`a1-2-health`:** el alumno debe decir «Take this twice a day», que es la frase del médico. Ahora el diálogo la enmarca como una cita («What did the doctor say?»), pero lo ideal es usar una frase del paciente.
- **`b1-1-register`:** no explica el registro (could / would / can; *I regret to inform you* frente a *sorry*).

---

## 4. Audio

- **Antes de corregir:** todas las claves `audio` y `slow_audio` existían en el manifiesto (991 entradas, ElevenLabs).
- Hay 26 archivos en `audio/` sin referencia en el manifiesto, posiblemente sobrantes. Por ejemplo: 06d9510e3274c950a7cbb5e2, 0b86825f22c1a2322c10d200, 1e01026f0632fd8f41127d6a…
- **Después de corregir:** hay **83 claves nuevas sin grabación** (unos 1.500 caracteres):
  - 57 de actividades: lecturas nuevas, *be* / presente simple, `time` y las frases «Let's…» / «Is there a pharmacy nearby?».
  - 26 de las líneas nuevas del interlocutor en los diálogos A1.
- Hasta generarlas, la app usa la voz del dispositivo. `tests/guided_content_audit.test.mjs` falla por `missing_audio_manifest_entry`.

## 5. Unidades huérfanas y referencias

- `course.json` → `levels[].unitIds` y `units[]` coinciden (45/45), y todos los `manifest` existen.
- **Hay 6 archivos en `units/` que `course.json` no referencia:**

| Archivo | Título | Lecciones / actividades |
|---|---|---|
| `a1-1-introductions.json` | Conocerse y presentarse | 7 / 73 |
| `a1-2-daily-life.json` | Vida diaria y autonomía | 7 / 83 |
| `a2-1-plans-and-time.json` | Planes, tiempo y decisiones | 7 / 83 |
| `a2-2-description-and-comparison.json` | Describir, comparar y resolver | 7 / 83 |
| `b1-1-narration-and-reasons.json` | Narrar, explicar y dar razones | 7 / 83 |
| `b1-2-independent-reading.json` | Lectura guiada e independencia | 7 / 83 |

- **Corrección:** archivarlos fuera de `units/` si nada los usa. No se tocaron.

## 6. Recomendaciones pedagógicas (Assimil + Rosetta Stone, ~40 min/día)

1. **Imagen antes que traducción.** *vocabulary* tiene más de 300 sustantivos concretos (familia, cuerpo, casa, ropa, comida, transporte). Muchas de sus preguntas «¿Qué significa X?» pueden pasar a «escucha y elige la imagen».
2. **Diálogo primero.** Cada unidad de A1+ debería abrir con un `dialogue_model` de 6–10 líneas con audio y cerrar con el diálogo guiado (ya iniciado en A1, ver I2).
3. **Pares mínimos como rutina.** El oído del hispanohablante no separa *ship/sheep*, *cap/cup*, *think/sink*. Conviene 1 escucha de pares mínimos por lección de A0–A1, reutilizando las de `reading-07…10`.
4. **Producción en A0.** Hoy hay 8 actividades de producción en todo foundations (4 originales y 4 nuevas). Lo recomendable es 1 dictado y 1 bloque por lección.
5. **Sesión diaria.**
   - Una lección de A1 (≈15 actividades) dura 6–8 min, así que en 40 min caben 4–5 lecciones.
   - *vocabulary* (67 lecciones seguidas, 1.715 actividades) es un muro monótono. Conviene intercalarlo con *survival* / *essentials* por temas.

---

## Anexo A — accepted_answers añadidos (selección)

- **Automático:** en toda la producción libre (typed, open, speak) y en los turnos de diálogo de A1–B1 se añade la forma con y sin contracción: I am / I'm, what is / what's, do not / don't, does not / doesn't, could not / couldn't, will not / won't, I will / I'll, it is / it's, that is / that's, let us / let's, is not / isn't, I would have / I'd have, you had / you'd.
- **Variantes manuales:**
  - Identidad y personas:
    - «Who is that?» + «Who is it?», «Who is she?», «Who is he?»
  - Horas:
    - «I get up at seven.» + «I get up at 7.», «I get up at 7:00.», «I wake up at seven.»
    - «I arrive at eight.» + «I arrive at 8.», «I arrive at 8:00.»
    - «I am free after six.» + «after 6», «after six o'clock»
  - Compras y transporte:
    - «Can I pay by card?» + «Can I pay with a card?»
    - «Do I need to change?» + «Do I have to change (trains)?», «Do I need to transfer?»
  - Planes:
    - «Where shall we meet?» + «Where should we meet?», «Where are we meeting?»
    - «to book» + «book», «reserve»
  - Conectores:
    - «that is why» + «so», «therefore»
  - B1-2:
    - «Call me if you need help.» + «If you need help, call me.»
    - «I'd have agreed if you'd explained it.» + «I would have agreed if you had explained it.»
  - Lista completa: objeto `accepted` en el script.

---

## Estado de las correcciones (27 de octubre de 2026)

Aplicadas con `node scripts/repair_english_audit_2026_10.mjs` (idempotente: la segunda ejecución imprime `changed: []`) y protegidas por `tests/english_audit_repairs.test.mjs`.

| Punto | Estado | Qué se hizo |
|---|---|---|
| C1 | Corregido | `reading` 07–10: vocales cortas, vocales largas con pares mínimos y e muda, schwa y acento, th sorda y sonora, s inicial, -ed, -s/-es y letras mudas. La prueba de lectura suma 8 preguntas. |
| C2 | Corregido | `essentials` 09 (be: am/is/are, negación y pregunta) y 10 (presente simple: -s, don't/doesn't, do/does), cada una con bloques y escritura. La prueba suma 6 preguntas. |
| C3 | Corregido (`time`) | `time` reescrita en 6 lecciones, 2 repasos y la prueba final: decenas, compuestos, la hora, meses, fechas y precios. No comparte ningún ítem con `survival`. `questions` sigue duplicando parte de `essentials`. |
| C4 | Corregido | Contracciones y cifras aceptadas en toda la producción libre y en los diálogos; variantes del anexo A; diálogos de 3 turnos con un error de margen; indicaciones alineadas con la respuesta. |
| C5 | Corregido | 32 traducciones alineadas con el inglés (29 de B1-2, 1 de A2-1 y 2 de A1). |
| C6 | Corregido | Cada ficha de regla de `survival` y `essentials` tiene una explicación propia; ya no hay distractores también correctos y la ficha de *I'm* explica la contracción. |
| I1 | Corregido | Respuestas cortas con glosa propia y nota sobre el auxiliar; «Sí.»/«No.» ya no se usan como distractores. |
| I2 | Parcial | Los 12 diálogos de A1 tienen interlocutor real en inglés, con traducción y audio. A2–B1 siguen con «Situación N». |
| I3 | Corregido | Glosas de *vocabulary* (I'm, it, evening, should, time, Envío) y de A1 (good evening, running late, pharmacy); «Let us» → «Let's». |
| I4 | Pendiente | Reescritura de los ítems heredados en A2–B1. |
| I5 | Pendiente | Notas de uso para la gramática de A1 no explicada. |
| I6 | Pendiente | Retirar las fichas de lectura de `survival-12`. |
| I7 | Pendiente | Unificar a español de México y a un registro. |

**Audio:** el contenido nuevo usa 83 claves sin grabación. Hasta generarlas con TTS de macOS, la app usa la voz del dispositivo y `tests/guided_content_audit.test.mjs` falla por `missing_audio_manifest_entry`. `tests/guided_stage_walkthrough.test.mjs` cambia su total de actividades: inglés pasa de 7.311 a 7.342.
