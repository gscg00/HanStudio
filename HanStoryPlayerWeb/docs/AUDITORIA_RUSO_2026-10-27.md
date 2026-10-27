# Auditoría del curso de ruso (HanStoryPlayerWeb) — perspectiva de alumno hispanohablante desde cero

Fecha: 2026-10-27 · Alcance: `library/courses/Russian` (course.json, 45 unidades activas, 434 lecciones, 6.869 actividades antes de las correcciones) · Las correcciones se aplicaron después con `scripts/repair_russian_audit_2026_10.mjs` (ver el final).

**Método.**
- Recorrí todas las actividades con scripts `python3 -I`: estructura, opciones, respuestas, audio, solapamiento entre unidades, registro (ты/вы frente a tú/usted), homoglifos latinos dentro de palabras cirílicas, primera aparición de cada letra y posición de la respuesta.
- Leí línea a línea *foundations* (A0: reading-foundations, reading, survival, essentials, questions, time, vocabulary, reading-bridge, story-bridge) y todo A1-1 y A1-2, incluida la producción.
- Muestreé A2-1, A2-2, B1-1 y B1-2 (tarjetas, traducción y pregunta abierta de cada unidad; a2-1-past, a2-1-ability, a2-2-culture, b1-1-register y b1-2-conditions completas).

**Nota sobre la severidad.** Como en coreano, los repasos (`review-*`) y las pruebas (`test-*`) copian literalmente los ítems de la lección. Toda corrección de un ítem debe aplicarse también a su repaso y su prueba (el script lo hace con reemplazos por unidad).

---

## 0. Resumen en cifras

| Métrica | Valor |
|---|---|
| Unidades en `levels` / archivos en `units/` | 45 / 51 (6 huérfanos) |
| Actividades | 6.869 (1.263 teach_concept, 2.435 select_translation, 2.480 listening_choice) |
| Letras usadas antes de enseñarse | 0: `reading-foundations` (primera unidad) presenta las 33 letras, incluidas ё, й, ъ, ь, щ, ы, э, ю, я |
| Homoglifos latinos en texto cirílico | 0 |
| Claves de audio ausentes del manifiesto (antes) | 0; archivos sin referencia: 0 |
| Unidades duplicadas | *time* = 57/57 ítems de *survival*; *reading-bridge* = 57/57 de *survival*; *story-bridge* = 30/30 de *survival*; *questions* = 7/9 de *essentials*; *vocabulary* 31–36 recicla 91 ítems de survival/essentials |
| Tarjetas de conjugación, casos o acento en A0 | 0 / 0 / 0 (ninguna palabra lleva el acento marcado en todo el curso) |
| Producción en foundations | 4 actividades (solo en reading-foundations) |
| Posición de la respuesta (3 opciones) | 1.ª 39 %, 2.ª 32 %, 3.ª 29 % |
| Diálogos sin margen de error | 36 de 36 (`minimum_correct` = número de turnos) |

---

## 1. CRÍTICO

### C1. La lectura se queda en el nombre de las letras: no se enseña a leer palabras
- `reading-foundations` (Alfabeto 1–9) solo presenta el **nombre** de cada letra (бэ, вэ, эн…), y `reading` 01–07 da una equivalencia aproximada («Б: b», «О: o; sin acento se acerca a a»), con el audio del nombre de la letra.
- No hay ninguna sílaba ni palabra para leer antes de *survival*, que arranca con «Здравствуйте!» (cuatro consonantes seguidas, вств con в muda).
- **Corrección:** lecciones de lectura de palabras con transcripción y acento (ver C2).

### C2. No se enseña el acento ni sus consecuencias, ni el ensordecimiento
- `russian-reading-00-15` dice que «la sílaba tónica cambia» pero no da ningún ejemplo; en todo el curso no aparece ni una palabra con el acento marcado (ni con tilde ni en una pista de pronunciación).
- La reducción vocálica se resume en «o; sin acento se acerca a a» (`russian-reading-04-1`); nada sobre е/я átonas → [и].
- El ensordecimiento final (`russian-reading-00-15-b`, «д→т · б→п · г→к») no tiene ejemplo con audio.
- No se explica жи/ши/ци → [жы]/[шы]/[цы], ni que Ь distingue palabras (брат/брать), ni que в suena [ф] ante consonante sorda.
- Para un hispanohablante que lee «como se escribe», молоко sale [molokó] y no reconocerá [малако́] al oírlo.
- **Corrección:** `reading` 08 «Acento y reducción» (молоко, вода, хорошо, сестра, язык, это) y `reading` 09 «Consonantes finales, suaves y siempre duras» (хлеб, друг, год, день, брать, машина); pistas `sound_hint` con acento en todo el contenido nuevo.

### C3. A0 no enseña a conjugar ni ningún caso, y glosa иметь como «tener»
- `essentials` solo presenta infinitivos (быть, иметь, идти, ехать, хотеть, мочь, делать). No hay ninguna tarjeta con я читаю / ты читаешь…, ni con la 2.ª conjugación.
- `russian-essentials-02-4` y `vocabulary-35-8`: **иметь = «tener»**. Un hispanohablante dirá «Я имею брата»; en ruso «tengo» es **у меня есть**, que el curso usa desde `vocabulary-02-10` sin explicarlo.
- No se explica que быть se omite en presente («Я студент»), pese a usarlo desde `vocabulary-01` («Я дома»).
- Casos usados sin ninguna regla en A0 y A1: genitivo tras нет (`a1-1-home-02-12` «Его здесь нет», `vocabulary-15-3` «нет денег»), tras números (`a1-1-people-02-12` «два брата», `vocabulary-11-7` «три книги», `-11-9` «пять ручек»), tras из (`survival-03-1` «из Мексики»); preposicional con в/на (`vocabulary-07-8` «на столе», `-08-1` «в шкафу»); acusativo de dirección y objeto (`a1-1-places-03-14` «в школу», `vocabulary-14-3` «пью воду»). Ningún archivo contiene las palabras «genitivo», «preposicional» ni «conjugación» en A0.
- **Corrección:** `essentials` 09 «Ser, estar y tener» (быть omitido, у меня есть, нет + genitivo), 10 «El presente: dos conjugaciones» (читать / говорить) y 11 «Dónde y adónde: в / на», con producción; glosa de иметь «tener (formal; «tengo» = у меня есть)».

### C4. `time` duplica `survival` al 100 %
- `time` (16 lecciones) presenta **los mismos 57 ítems** que `survival`, en el mismo orden (saludos, 0–20, días, да/нет, это…). Su título promete «Números, tiempo y vida diaria».
- Lo esencial del ruso en este tema falta por completo: la regla **1 / 2–4 / 5+** (час/часа/часов, год/года/лет, рубль/рубля/рублей), «el lunes» = в понедельник, fechas con ordinal, precios y la edad en dativo (Мне двадцать лет).
- **Corrección:** reescribir `time`: decenas (тридцать, сорок, пятьдесят, сто), la hora con час/часа/часов, días con в + acusativo (во вторник, в среду), meses y fechas (в январе, первое мая), precios y edad.

### C5. `reading-bridge` y `story-bridge` también son copias de `survival`
- `reading-bridge` («Oraciones graduadas con comprensión y audio») = los 57 ítems de survival otra vez (16 lecciones, 231 actividades).
- `story-bridge` = los primeros 30 ítems de survival (números 0–20 incluidos) como «Puente hacia las historias».
- Con *time*, el alumno repasa los números del 0 al 20 **cuatro veces** como contenido nuevo (~600 actividades) y nunca lee un texto.
- **Corrección:** `reading-bridge` → historia graduada «Un día de Anna» (30 frases con acento); `story-bridge` → 4 diálogos (cafetería, amigos con ты, la calle con вы, ¿ты o вы?).

### C6. Traducciones y registro erróneos en A1–A2
| Ubicación | Actual | Corrección |
|---|---|---|
| `a1-1-identity-04-15` (+ escucha, repaso, prueba, 14 apariciones) | «Я немного говорю по-русски.» = «Hablo un poco de este idioma.» | «Hablo un poco de ruso.» |
| `a1-1-people-03-14` + producción | «Сколько вам лет?» = «¿Cuántos años **tienes**?» (вам es usted) | «¿Cuántos años tiene?»; nota: a un amigo, «Сколько тебе лет?» |
| `a1-2-weather-02-12` | «Возьмите зонт.» = «**Lleva** un paraguas.» | «Lleve un paraguas.» |
| `a2-1-ability-02-12` | «Вы должны показать паспорт.» = «**Debes** mostrar **tu** pasaporte.» | «Debe mostrar su pasaporte.» |
| `a1-2-time-03-13` + producción | «Я приеду в восемь.» = «Llego a las ocho.» (приеду es futuro perfectivo) | «Llegaré a las ocho.» + nota приеду/приезжаю |
| `a1-2-social-02-04` | время = «hora» | «tiempo» (la hora del reloj es час) |
| `a2-1-ability-02-03`, `a2-2-workStudy-02-03` | нужно = «necesitar» (es un predicativo impersonal) | «hace falta, es necesario» |
| `a1-2-health-02-12` | «Где есть аптека?» (poco natural) | «Где здесь аптека?» |
| `a1-2-health` producción (speak y diálogo) | El alumno-paciente debe decir «Принимайте это два раза в день» (frase del médico) | «У меня болит голова.» |
| `vocabulary-05-1`, `-06-8`, `-04-9` (ejemplos) | «Какой у тебя возраст?», «У меня есть боль.», «Как твоё имя?» (calcos) | «Сколько тебе лет?», «Мне больно.», «Моё имя — Анна.» (+ nota «Меня зовут…») |
| `a2-1-ability-03-13` | «Aquí se puede tomar fotos» | «Aquí se pueden tomar fotos» |

### C7. Producción: se rechazan respuestas correctas y los diálogos no dejan margen
- Una sola respuesta aceptada. Se rechazan, por ejemplo:
  - «Я учусь днем.» (е por ё: la mayoría de los rusos no escribe la ё; afecta a днём, всё, режиссёр, остаётся…).
  - «Я встаю в 7.» / «Я встаю в семь.» (cifras u omisión de часов).
  - «Я пью чай утром.», «Хочу немного риса.», «Ключ на столе.», «Где мы встретимся?», «Можно заплатить картой?».
  - Formas femeninas del pasado cuando la alumna habla de sí misma: «Я не смогла найти ключи.», «Однажды я опоздала…», «Тогда я поняла…», «Я бы согласилась…».
- `minimum_correct` = número de turnos en los 36 diálogos (3/3 en places, social, conversation, problemSolving, register…).
- La tolerancia a erratas no actúa (igual que en coreano: requiere `answer_policy:"spelling_tolerant"`).
- **Corrección:** variantes en `accepted_answers` (incluida la versión con е de toda respuesta con ё), `minimum_correct = n-1` con 3 turnos o más.

---

## 2. IMPORTANTE

### I1. Registro ты/вы sin regla hasta B1, y `b1-1-register` no enseña registro
- *survival* y *a1-1-identity* usan вы (Как вас зовут?) y la nota de `survival-02-5` lo explica bien, pero `vocabulary-04-9` («Как твоё имя?»), `a1-2-social` (Хочешь прийти?, Извини, Пришли мне адрес) y `b1-1-register-02-04` («Какой вариант тебе кажется лучше?») pasan a ты sin aviso.
- `b1-1-register` no tiene ninguna tarjeta sobre ты/вы, Привет/Здравствуйте, Извини/Извините ni el uso del nombre y patronímico; la mitad de sus ítems no son de registro («Если мы позвоним сейчас, они скоро приедут»).
- **Corrección:** tarjeta de registro al inicio de A1 (hecho en `story-bridge` 04) y lección propia en `b1-1-register` (Иван Петрович, Давай на «ты», Не могли бы вы…).

### I2. Distractores y audio de `reading`
- Las escuchas reproducen el **nombre** de la letra («эн», «эр») y preguntan por la letra; está bien para el alfabeto, pero «¿Cómo se pronuncia «Н»?» con audio «эн» enseña [en], no [n]. Mejor: sílaba (на) o palabra (нос).
- Distractores con pistas incrustadas («s; no es c/k», «n; no es h», «o; sin acento se acerca a a») aparecen como opción en preguntas de otras letras y se descartan por contenido.
- Mezclan consonantes y vocales; se aciertan por categoría.

### I3. Tarjetas «regla» duplicadas como si fueran vocabulario
- «А / К / М / О / Т», «В / Н / Р / С / У / Х», «Ь», «Ы», «Ж», «Х», «Щ», «Р» aparecen en `reading-foundations`, `survival-12-3…5`, `essentials-06-4…08-1` y `vocabulary-31-1…8`, siempre con el mismo texto. En `survival` están al final, tras los números.
- **Corrección:** dejarlas solo en `reading-foundations` / `reading`. (Ojo: `tests/rule_context_repairs.test.mjs` protege la tarjeta de `survival`; habría que actualizar ese test a la vez.)

### I4. `questions` duplica `essentials` y `vocabulary` 31–36 duplica survival/essentials
- `questions`: 7 de 9 ítems ya están en `essentials-03/04` (что, кто, где, когда, как, почему, не).
- `vocabulary` 31–36: 91 ítems repetidos (saludos, 0–20, pronombres, verbos en infinitivo y las tarjetas-regla).
- **Corrección:** `questions` con preguntas completas (Что это? Кто это? Где вы живёте? Когда урок? Почему вы здесь?) y respuestas; reemplazar `vocabulary` 31–36 por vocabulario nuevo.

### I5. A2–B1: la mitad de cada unidad es heredada
- Cada unidad de A2-2 a B1-2 comparte 8 de 16 ítems con una anterior (past → experiences → narrative → perspectives; services → problemSolving → register → negotiation; comparison → culture → media/society → nuance/projects…). `a2-2-culture` vuelve a enseñar больше, меньше, лучше, хуже, высокий, быстрый como si fueran nuevos; `b1-1-media` incluye «Этот обычай меня удивил.» de culture.
- **Corrección:** como en coreano C8, convertir los heredados en repaso y añadir 8 ítems nuevos por unidad.

### I6. Gramática usada antes de enseñarse en A1 (sin nota)
| Gramática | Ítem |
|---|---|
| Verbos de posición (лежит) | `a1-1-home-03-13` «Ключ лежит на столе» |
| Reflexivos -ся (просыпаться, учиться, задерживается) | `a1-1-routine-01-01`, `-02-03`, `a1-2-transport-03-14` |
| Perfectivo/imperfectivo (приеду, встретимся, оплатить) | `a1-2-time-03-13`, `a1-2-social-02-12`, `a1-2-shopping-03-13` |
| Dativo (мне нужно, мне лучше) | `a1-2-transport-03-13`, `a1-2-health-04-15` |
| Instrumental (картой) | `a1-2-shopping-03-13` |
| Pasado con género (работал, пришёл) | `a2-1-past-01-09/10` |
| Genitivo partitivo (немного риса) | `a1-1-food-03-14` |
| Género del adjetivo predicativo (Я голоден / голодна) | `a1-1-food-01-09` |
- **Corrección:** `usage_note` de una línea en cada caso y una tarjeta-patrón por unidad.

### I7. Diálogos guiados sin interlocutor
- Los 36 `*-production-dialogue` tienen turnos «Situación N» sin ninguna línea rusa del interlocutor (igual que en coreano I9). En `a1-1-places` la situación 3 es la palabra «izquierda».

### I8. Repasos y pruebas memorizables
- Repasos y pruebas copian opciones y orden de la lección (verificado en A1-1). Sesgo leve a la 1.ª posición (39 %).

---

## 3. MENOR

- `a1-1-routine-03-14`: «Я учусь днём.» = «Estudio por la tarde»; en `vocabulary-28-10` днём = «por el día». Unificar («de día / por la tarde»).
- `a1-1-food-01-09`: «Я голоден» sin la forma femenina «Я голодна».
- `a1-1-identity-02-12`: Пожалуйста = «Por favor» sin «de nada / aquí tiene» (corregido con `usage_note`).
- `a1-2-time-04-15`: «Я опаздываю» = «Llego tarde» → «Voy tarde / Se me hace tarde».
- `a2-1-ability-04-15`: «Можно занять это место?» = «¿Puedo usar este asiento?» → «¿Puedo ocupar este asiento?».
- `b1-2-conditions-02-04`: «Времени было недостаточно, поэтому мы ушли» (ilógico; como en coreano) → «…поэтому мы не всё закончили».
- Léxico peninsular para un alumno mexicano: сок = «zumo» (jugo), джинсы = «vaqueros» (jeans), компьютер = «ordenador» (computadora), машина = «coche» (carro). Añadir la variante americana.
- `vocabulary-28-8`: кошка = «gato» (es «gata»; gato macho = кот).
- `vocabulary-23-3`: «В марте тепло» = «En marzo hace calor» → «hace templado / no hace frío».
- `vocabulary-22-6`: «Среда сегодня спокойная» = «Hoy el miércoles es tranquilo» → «Hoy, miércoles, es un día tranquilo».
- `reading-00-11-b`: «Х = j/kh»; para mexicanos conviene «j suave, como en "jamón" dicho sin fuerza».

---

## 4. Audio

- Antes de las correcciones, todas las claves `audio` y `slow_audio` existían en `audio_manifest.json` (747 entradas) y todos los archivos estaban en `audio/`; no había archivos sobrantes.
- El contenido nuevo usa **101 claves sin grabación** (palabras y frases cortas: «молоко» ya existía; nuevas, p. ej. «Я студент.», «Два часа.», «в среду», «Это Анна.», «Давай на «ты»!», «Где здесь аптека?»). Hasta generarlas, la app usa la voz del dispositivo y `tests/guided_content_audit.test.mjs` falla por `missing_audio_manifest_entry`.
- Sugerencia para la grabación TTS: pasar a la voz el texto con el acento marcado (la pista `sound_hint` lo trae) para que no lea мо́локо.

---

## 5. Unidades huérfanas y referencias

- `course.json` → `levels[].unitIds` y `units[]` coinciden (45/45) y todos los `manifest` existen.
- **6 archivos en `units/` no referenciados** (estructura antigua de 7 lecciones, igual que en coreano): `a1-1-introductions.json`, `a1-2-daily-life.json`, `a2-1-plans-and-time.json`, `a2-2-description-and-comparison.json`, `b1-1-narration-and-reasons.json`, `b1-2-independent-reading.json`. **Corrección:** archivarlos fuera de `units/` (no se tocaron).
- Sin IDs de actividad duplicados ni respuestas fuera de las opciones.

---

## 6. Recomendaciones pedagógicas (Assimil + Rosetta Stone, ~40 min/día)

1. **Acento siempre visible al principio.** Mostrar la tilde de acento en `target` (o al menos en `sound_hint`) en A0–A1, y retirarla gradualmente en A2. Es la mayor fuente de error de comprensión auditiva para un hispanohablante.
2. **Regla 1 / 2–4 / 5+ como eje.** Se reutiliza en horas, edad, precios y cantidades; conviene repasarla en cada unidad de A1-2.
3. **Casos por función, no por tabla.** Presentar cada caso con su pregunta de uso (¿dónde? → preposicional; ¿adónde?/objeto → acusativo; no hay / de / cantidad → genitivo; a quién → dativo) con 3–4 frases modelo, como se hizo en `essentials` 09–11.
4. **Diálogo primero.** Abrir cada unidad A1+ con un `dialogue_model` con audio; los cuatro diálogos nuevos de `story-bridge` son el modelo.
5. **Imágenes.** Sustantivos concretos de `vocabulary` 03–28 (familia, casa, ropa, comida, ciudad, naturaleza) son ideales para «escucha y elige la imagen».

---

## Estado de las correcciones (27 de octubre de 2026)

Aplicadas con `node scripts/repair_russian_audit_2026_10.mjs` (idempotente: la segunda ejecución informa `changed: []`) y protegidas por `tests/russian_audit_repairs.test.mjs`.

| Punto | Estado | Qué se hizo |
|---|---|---|
| C1 | Corregido (parcial) | `reading` 08–09 hacen leer palabras reales con transcripción; la prueba de lectura incluye 6 preguntas nuevas. Las escuchas del alfabeto siguen usando el nombre de la letra (I2). |
| C2 | Corregido | `reading` 08 «Acento y reducción de vocales» y 09 «Consonantes finales, suaves y siempre duras» (ensordecimiento, Ь, жи/ши). Todo el contenido nuevo lleva el acento en `sound_hint`. |
| C3 | Corregido | `essentials` 09 (быть omitido, у меня есть, нет + genitivo), 10 (читать / говорить, 1.ª y 2.ª conjugación) y 11 (в/на + preposicional / acusativo), con 5 actividades de producción y 9 preguntas nuevas en la prueba. иметь se glosa «tener (formal; «tengo» = у меня есть)». |
| C4 | Corregido | `time` reescrita: decenas, la hora (час/часа/часов), días (в понедельник), fechas, precios (рубль/рубля/рублей) y edad (год/года/лет). |
| C5 | Corregido | `reading-bridge` → «Un día de Anna» (30 frases); `story-bridge` → 4 diálogos con ты/вы. Ya no comparten ningún ítem con `survival`. |
| C6 | Corregido | Todas las filas de la tabla C6. |
| C7 | Parcial | Variantes con е por ё en toda la producción, cifras, omisión del pronombre, formas femeninas y sinónimos; `minimum_correct = n-1` en los 6 diálogos de 3 turnos. La tolerancia a erratas sigue limitada a `spelling_tolerant` (código compartido). |
| I1 | Parcial | `story-bridge` 04 enseña ты/вы. Falta la lección de registro de `b1-1-register`. |
| I2–I8 | Pendiente | Distractores de `reading`, tarjetas-regla duplicadas, `questions`, `vocabulary` 31–36, herencia A2–B1, notas de gramática A1, diálogos con interlocutor, repasos barajados. |
| Huérfanos | Pendiente | No se movieron los 6 archivos antiguos. |

**Audio:** 101 claves nuevas sin grabación (TTS pendiente). `tests/guided_stage_walkthrough.test.mjs` cambia su recuento total de actividades evaluables (esperado).
