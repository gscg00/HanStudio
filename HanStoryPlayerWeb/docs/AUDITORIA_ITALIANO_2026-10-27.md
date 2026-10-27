# Auditoría del curso de italiano (HanStoryPlayerWeb) — perspectiva de alumno hispanohablante desde cero

Fecha: 2026-10-27 · Alcance: `library/courses/Italian` (course.json, 45 unidades activas, 6.791 actividades antes de las correcciones) · Método idéntico al de `docs/AUDITORIA_COREANO_2026-10-27.md`.

**Método.**
- Recorrí todas las actividades con scripts `python3 -I`: estructura, opciones, respuestas, audio, solapamiento entre unidades, significados distintos para un mismo objetivo, posición de la respuesta, producción y diálogos.
- Leí línea a línea todo *foundations* (reading-foundations, reading, survival, essentials, questions, time, vocabulary, reading-bridge, story-bridge) y todo A1-1 y A1-2.
- Muestreé A2-1 … B1-2 (todas las tarjetas teach y toda la producción de cada unidad).
- Ejecuté `scripts/audit_guided_courses.mjs` (0 errores antes de las correcciones).

**Perfil considerado.** Hispanohablante (México), aprende por repetición e imágenes (Assimil + Rosetta Stone), ~40 min/día. El italiano es muy cercano al español: el riesgo principal no es «no entender», sino **acertar por parecido sin aprender** y **caer en falsos amigos**.

**Nota sobre la severidad.** Como en coreano, los repasos (`review-*`) y pruebas (`test-*`) copian literalmente los ítems de lección (mismas opciones y orden). Toda corrección de un ítem debe propagarse a sus copias; el script de reparación lo hace con reemplazos por unidad.

---

## 0. Resumen en cifras

| Métrica | Valor |
|---|---|
| Unidades en `levels` / archivos en `units/` | 45 / 51 (6 huérfanos) |
| Actividades | 6.791 (2.440 listening_choice, 2.423 select_translation, 1.243 teach_concept, 428 lesson_intro, 257 de producción) |
| Producción en foundations | 4 actividades (todas en `reading-foundations-production-checkpoint`) |
| Unidades duplicadas en A0 | *time* = 57/57 ítems de *survival*; *reading-bridge* = 57/57 de *survival*; *story-bridge* = 30/30 de *survival*; *vocabulary* 32–36 repite otra vez la lista de *survival*; *reading* = 21/21 letras de *reading-foundations*; *questions* = 7/9 de *essentials* |
| A2–B1 | cada unidad hereda 8 de sus 16 ítems de otra unidad (mismo patrón que coreano) |
| Traducciones idénticas al italiano (select_translation) | 101 de 2.279 (4,4 %): persona, carne, casa, farmacia… se aciertan sin aprender |
| Respuestas no seleccionables / opciones duplicadas / audio ausente | 0 / 0 / 0 |
| Posición de la respuesta | 1.ª 38 %, 2.ª 34 %, 3.ª 28 % |
| Diálogos guiados | 36; todos con `minimum_correct` = número de turnos (sin margen) |

---

## 1. CRÍTICO — bloquea el aprendizaje o enseña algo incorrecto

### C1. Cinco unidades de A0 enseñan la misma lista de 57 frases
- `survival` (16 lecciones), `time` (16), `reading-bridge` (16), `story-bridge` (8) y `vocabulary` 32–36 presentan **la misma secuencia**: Ciao!, Non capisco, Può ripetere?, Dov'è il bagno?, Quanto costa?, zero…venti, Che ore sono?, lunedì…domenica, sì, no, forse, questo, quello…
- Son unas 1.000 actividades de repetición presentadas como unidades nuevas («Números, tiempo y vida diaria», «Escucha y lectura guiada», «Puente hacia las historias»). El título de *time* promete horas, fechas y precios que no tiene.
- `reading` (Sonidos y lectura) repite las 21 letras de `reading-foundations`.
- **Corrección:** reescribir *time* con números 21–1000, la hora, meses, fechas y precios; convertir *reading-bridge* y *story-bridge* en lectura real (diálogos breves con audio, al estilo Assimil); eliminar `vocabulary` 31–36 (repite fichas de regla y la lista de survival).

### C2. «Sonidos y lectura» da nombres de letra españoles mientras el audio dice los italianos
- `reading / italian-reading-01…05`: «¿Cómo se pronuncia «F»?» → **efe**, pero el audio de la tarjeta es «effe». Igual con L → ele (audio «elle»), M → eme («emme»), N → ene («enne»), S → ese («esse»), Q → ku («cu»), R → «r vibrante» («erre»), H → «no suena» («acca»), Z → «ts o dz» («zeta»).
- Mezcla nombre y sonido en la misma pregunta: B → «bi» (nombre), C → «chi ante e/i; k ante a/o/u» (sonido).
- G → «yi ante e/i»: un mexicano leerá [yi]; el sonido italiano es [dʒ] («dy»).
- **Corrección:** respuestas con el nombre italiano y, entre paréntesis, el sonido: «effe», «elle», «cu (suena ku)», «erre (r vibrante)», «acca (muda; endurece c/g)», «zeta (ts o dz)», «gi (dy ante e/i, g ante a/o/u)», «ci (ch ante e/i, k ante a/o/u)».

### C3. Faltan las reglas de pronunciación que un hispanohablante necesita
- `reading-foundations` explica C/G, CH/GH, GN, GLI y dobles con preguntas meta («¿Es relativamente regular la ortografía italiana?»), pero ninguna lección con audio y pares contrastivos enseña:
  - **SC** ante a/o/u [sk] frente a e/i [ʃ] (scuola / scena). Solo existe la ficha «sc» de `essentials-08`, tras haber oído «scuola» en survival.
  - **GLI**: la pista es «Cómo suena: lli italiana» (`essentials-07-4`, `survival`, `vocabulary-31`), que no dice nada.
  - **QU** [ku] con u pronunciada (questo, quando): un hispanohablante dice [kesto].
  - **Z** [ts]/[dz]: el alumno mexicano la lee [s].
  - **S sonora** entre vocales (rosa, casa).
  - **Tilde final** (città, perché, lunedì) y la diferencia è (es) / e (y).
  - **Dobles con pares mínimos** que cambian el significado: sette (siete) / sete (sed), palla / pala, anno / ano.
  - **Acento en la antepenúltima** (PAR-la-no), que el español no predice.
- **Corrección:** dos lecciones en `reading` con el patrón tarjeta → «¿cómo se pronuncia?» → escucha.

### C4. A0 no enseña a conjugar ni essere/avere
- `essentials-02/03` presenta essere, avere, andare, venire, volere, potere, fare **solo en infinitivo**. No hay ninguna tarjeta con -o / -i / -a / -iamo ni con sono/sei/è, ho/hai/ha.
- Desde survival el alumno repite formas conjugadas sin regla: capisco, può, vorrei, mi chiamo, sono; en A1, ho fame, ho due fratelli, lavora, studio, viviamo.
- `essentials-09-2` («sujeto opcional») es la única pista y su ejemplo está mal escrito: «Idea clave: **párlo** italiano» (el italiano no lleva tilde ahí).
- **Corrección:** lección «El presente: -are, -ere, -ire» (parlo, parli, parla, parliamo, prendo, dormo, capisco con -isc-), lección «Essere y avere» (sono, sei, è, siamo, ho, hai, ha, abbiamo), con notas sobre homónimos (sei = seis / eres; è / e; ha / a) y una actividad de bloques y una de escritura en cada una.

### C5. Falsos amigos sin advertencia
| Ubicación | Actual | Problema / corrección |
|---|---|---|
| `a1-1-home / italian-a11-home-01-02`, `-03-14`; `vocabulary-07-1` | camera = habitación / dormitorio | Sin nota: el alumno la asocia a «cámara». Añadir nota. |
| `a1-2-weather / -03-05`; `vocabulary-24-3` | caldo = calor | Sin nota: «caldo» es sopa en español (brodo). |
| `vocabulary / italian-vocabulary-25-5` | **banco = banco**, «Il banco è vicino alla finestra. — El banco está cerca de la ventana.» | Error: aquí banco = **pupitre** (el banco-entidad es *banca*, enseñada en `-20-2`). Corregir glosa y traducción. |
| `vocabulary / italian-vocabulary-16-5` | **costo = cuesta**, ejemplo «Quanto costa?» | Error: *costo* es el sustantivo (costo, precio); «cuesta» es *costa*. |
| `a1-2-social / -02-03` | piano = plan | También «piso» y «despacio» (Il maestro parla piano, `vocabulary-24`). |
| `a1-2-shopping / -04-07` | carta = tarjeta | También «papel» y «carta (menú)». |
| — (ausentes) | burro, salire, guardare, aceto, salire | Los falsos amigos más frecuentes no aparecen en el curso. Añadir una lección. |

### C6. Texto italiano agramatical o traducciones erróneas
| Ubicación | Actual | Corrección |
|---|---|---|
| `vocabulary / -13-8` (uva) | «Le uva sono buone.» | «L’uva è buona.» (uva es colectivo singular) |
| `vocabulary / -04-5`, `-04-6` | «Il mio cugino gioca…», «La mia cugina canta…» | «Mio cugino…», «Mia cugina…» (sin artículo con parientes en singular) |
| `vocabulary / -02-3` (età) | «La mia età è dieci anni.» | «Ho dieci anni. — Tengo diez años.» |
| `essentials / -09-2` | «párlo italiano» | «Parlo italiano» = «(Yo) hablo italiano» |
| `a1-1-identity / -04-15` | Parlo un po’ d’italiano = «Hablo un poco de este idioma.» | «Hablo un poco de italiano.» |
| `a1-1-identity / -02-03` | buonasera = «buenas noches» | «buenas tardes / buenas noches» (saludo y despedida desde media tarde); buonanotte solo al irse a dormir |
| `a1-1-food / -03-14` | Vorrei un po’ di riso = «Quiero…» | «Quisiera un poco de arroz.» |
| `a2-1-ability / -02-12` (+ copias) | Deve mostrare il passaporto = «Debes mostrar tu pasaporte.» | «Debe mostrar su pasaporte.» (Deve = Lei) |
| `b1-2-projects / -01-10` | Che cosa viene prima? = «Tenemos que decidir qué es prioritario.» | «¿Qué va primero?» |
| `b1-2-nuance / -02-12` | Nel complesso… = «Hasta cierto punto…» | «En conjunto, el resultado fue positivo.» |
| `b1-2-nuance / -04-16` | Questa informazione è affidabile? = «¿Qué tan segura es esa información?» | «¿Es fiable esta información?» |
| `b1-2-projects / -04-16` | Che cosa cambieremo…? = «¿Qué cambiaríamos…?» | «¿Qué cambiaremos la próxima vez?» |
| `b1-2-projects / -03-14` | nel fine settimana = «al final de la semana» | «el fin de semana» |
| `b1-2-conditions / -03-13` y producción | Se hai bisogno… = «En caso de que necesites…» | «Si necesitas ayuda, llámame.» |
| `b1-2-negotiation / -02-11` | Accetterei se cambiassimo = «…si cambiamos» | «…si cambiáramos la fecha.» |
| `b1-2-projects / -03-13` | Prevediamo i rischi = «Conviene prever…» | «Anticipemos los riesgos antes de empezar.» |
| `b1-2-conversation / -03-13` | Prima vorrei chiarire = «Antes de continuar, quisiera…» | «Primero quisiera aclarar un detalle.» |
| `b1-2-nuance / -02-11`, `-01-10` | traducciones libres que no corresponden | «Buena idea, pero quizá cuesta demasiado.», «Entiendo tu punto, pero no estoy de acuerdo.» |
| `a2-1-ability / -03-13` | «Aquí se puede tomar fotos.» | «Aquí se pueden tomar fotos.» |

### C7. Producción: se rechazan variantes correctas y no hay margen en los diálogos
- Una sola respuesta aceptada por actividad. Se rechazan, por ejemplo:
  - «Come si chiama?» (forma de usted) para «¿Cómo te llamas?».
  - «Sono del Messico.», que el propio curso enseña en survival, para «Soy de México» (solo acepta «Vengo dal Messico.»); «Sono messicano/a».
  - Cifras: «Mi alzo alle 7.», «Arrivo alle 8.», «Ho tempo dopo le 6.».
  - Pronombre explícito: «Io studio nel pomeriggio.», «Io vado a scuola.».
  - Concordancia femenina: «Non sono riuscita…», «Sono allergica…», «Sono libera…».
  - Sinónimos naturales: «Bevo il tè la mattina.», «Mi serve un cappotto.», «Ho mal di testa.», «La mia stanza è piccola.».
- `minimum_correct` = número de turnos en los 36 diálogos (3/3 en las misiones finales).
- `a1-2-health` (dictado, habla, completar y diálogo): el alumno debe producir «Prenda questo due volte al giorno», que es la frase **del médico**.
- **Corrección:** ampliar `accepted_answers` (lista en el anexo A), `minimum_correct = n-1` con 3+ turnos y cambiar la producción de salud a «Mi fa male la testa.».

---

## 2. IMPORTANTE

### I1. Registro tu/Lei mezclado sin regla
- `essentials-01-3` enseña Lei = usted sin decir que el verbo va en 3.ª persona, y el curso nunca enseña lei = ella en essentials (aparece en `vocabulary-01` y en «Lei è mia sorella», `a1-1-people-02-11`).
- «Parli più lentamente.» (survival-02) es imperativo de Lei; el alumno lo confundirá con «parli» = hablas.
- En A1 conviven sin nota: «Vada sempre dritto», «Prenda questo», «Chiami un’ambulanza» (Lei) con «Porta un ombrello», «Mandami l’indirizzo» (tu). «Porta» además se enseñó como «puerta».
- «voi = vosotros» (`vocabulary-01-6`, «Vosotros estáis listos») frente a «vosotros / ustedes» en essentials: para un mexicano es «ustedes».
- **Corrección:** notas en Lei, Vada, Porta, Prenda; glosa de voi = «ustedes (vosotros)».

### I2. Distractores que se aciertan sin aprender
- 101 preguntas de traducción tienen respuesta idéntica al italiano (persona, carne, casa, centro, farmacia, pasta…).
- En A1–B1 las opciones mezclan una palabra suelta con frases completas, y repasos/pruebas copian el orden de la lección (como en coreano I10).
- Las fichas de regla se responden por eliminación entre frases genéricas («¿Qué debes recordar sobre «gli»?»). La escucha de «sujeto opcional» pide elegir un texto en español tras oír «Parlo italiano».
- **Corrección:** sustituir los cognados transparentes por preguntas de imagen o de escucha; usar como distractor el falso amigo (burro → «burro (animal)», salire → «salir»); barajar en repasos.

### I3. Traducciones al español de España con choque en México
- «Cojo el ticket», «Cojo algunas manzanas» (`vocabulary-16-1`, `-17-4`): «coger» es vulgar en México → «Tomo».
- zumo, ordenador, vosotros, coche, aparcar: comprensibles, pero conviene «jugo», «computadora», «ustedes», «carro/auto».

### I4. Gramática usada antes de enseñarse (A1)
| Gramática | Ítem |
|---|---|
| verbos reflexivos (mi alzo, mi sveglio) | `a1-1-routine-01-01` enseña svegliarsi = despertarse, pero la frase es «Mi alzo alle sette» (alzarsi, no enseñado) |
| futuro (pioverà, andrò, studierò) | `a1-2-weather-01-10`, `a2-1-future` |
| passato prossimo con essere/avere y concordancia | `a2-1-past` (Sono arrivato) sin regla |
| ci (ci sono, c’è, ci vediamo) | `a1-1-home-04-15`, `a1-2-social` |
| artículos contractos (sul, alla, nel, dal) | `a1-1-home-03-13`, `a1-1-identity-03-14` |
| piacere (mi piace) | `a2-2-opinions-03-13` |

- **Corrección:** `usage_note` de una línea por estructura y una teach_pattern por unidad.

### I5. Pares que se solapan o glosas inconsistentes
- quello = «eso» (survival, vocabulary, reading-bridge) y «aquello» (essentials). Unificar: «ese / eso (o aquel)», y quello laggiù = «aquello (allá)».
- alla fine = «finalmente» → «al final».
- saper fare = «saber» → «saber (hacer algo)».
- conto = «factura» en `a2-1-services`, «cuenta» en `a1-1-food`.

### I6. Diálogos guiados que no son diálogos
- Igual que en coreano: los turnos del guía dicen «Situación 1/2/3» y no hay intervención del interlocutor en italiano. Para Assimil, cada unidad de A1+ debería abrir con un diálogo modelo con audio.

### I7. A2–B1 heredan la mitad de cada unidad
- Cadenas: past → experiences → narrative → perspectives; conversation → opinions → cause-effect → conditions; comparison → culture → media → nuance; services → problemSolving → register → negotiation; …
- **Corrección:** convertir los 8 ítems heredados en repaso (sin teach_concept) y añadir 8 ítems nuevos por unidad.

### I8. `b1-1-register` apenas trata el registro
- Tiene buenas frases con Lei (Potrebbe aiutarmi?, Le dispiacerebbe…?), pero la mitad de la unidad es heredada de problemSolving y no hay ninguna tarjeta que contraste tu / Lei / voi ni el condicional de cortesía.

---

## 3. MENOR

- Alfabeto: faltan J, K, W, X, Y (letras de préstamos: jeans, kiwi, weekend). Basta una tarjeta.
- `reading-foundations` usa preguntas meta poco útiles («¿Es relativamente regular la ortografía italiana?», «¿Debes eliminar las vocales no acentuadas?»).
- `vocabulary-31` repite las fichas de regla de essentials 06–09 y survival 12.
- Survival 12 mezcla fichas de pronunciación (ce/ci, che/chi, ge/gi) entre «dove» y «quando».
- «Sono del Messico» (survival) frente a «Vengo dal Messico» (A1) sin explicar que ambas valen.
- Apóstrofo tipográfico (’) en A1 y recto (') en vocabulary: el evaluador los trata igual, pero conviene unificar.
- `a2-1-past-03-06` alla fine = «finalmente»; `a2-1-services` «Il conto non è corretto» = «La factura…» (mejor «La cuenta…»).
- «Vedo otto scarpe» (`vocabulary-12-3`): poco natural → «Vedo quattro paia di scarpe».
- Sesgo leve de posición (38 % primera opción).

---

## 4. Audio

- Antes de las correcciones todas las claves `audio`/`slow_audio` existían en el manifiesto y en disco.
- Las respuestas de `reading` (efe, ele…) no coincidían con su propio audio (effe, elle…): ver C2.
- El contenido nuevo introduce **60 claves sin grabación** (≈ 564 caracteres): números (ventuno…mille), meses, horas, fechas, precios, formas verbales (parlo, parli, parla, parliamo, prendo, dormo, sono, siamo, è, ho, hai, ha, abbiamo, parlano), falsos amigos (burro, salire, guardare, aceto), pares de pronunciación (sete) y las frases «Non parlo italiano.» y «Lei è del Messico.». Hasta generarlas, la app usa la voz del dispositivo y `tests/guided_content_audit.test.mjs` falla por `missing_audio_manifest_entry`.

---

## 5. Unidades huérfanas y referencias

- `course.json` → `levels[].unitIds` y `units[]` coinciden (45/45). No faltan archivos referenciados.
- **6 archivos en `units/` sin referencia**, versiones antiguas de 7 lecciones: `a1-1-introductions.json`, `a1-2-daily-life.json`, `a2-1-plans-and-time.json`, `a2-2-description-and-comparison.json`, `b1-1-narration-and-reasons.json`, `b1-2-independent-reading.json`.
- **Corrección:** archivarlos fuera de `units/` o borrarlos si nada los usa.

---

## 6. Recomendaciones pedagógicas para el perfil del alumno

1. **Aprovechar la cercanía con el español, no esconderla.** Con 4–5 ítems nuevos por lección, un hispanohablante avanza muy rápido en reconocimiento; el tiempo debe ir a pronunciación (dobles, SC/GLI/Z), conjugación y falsos amigos.
2. **Diálogo primero (Assimil).** Convertir *reading-bridge* y *story-bridge* en 8–12 diálogos breves con audio en lugar de la lista repetida de survival.
3. **Imagen antes que traducción (Rosetta).** Los 101 cognados transparentes son candidatos ideales a «escucha y elige la imagen».
4. **Producción mínima por lección.** Hoy A0 tiene 4 actividades de producción (más las 4 nuevas de essentials).

---

## Anexo A — accepted_answers añadidos (A1–B1)

- identity: «Come ti chiami?» + «Come si chiama?», «Tu come ti chiami?»; «Vengo dal Messico.» + «Sono del Messico.», «Sono messicano.», «Sono messicana.», «Io vengo dal Messico.»
- people: «Chi è?» + «Chi è questa persona?»; «Quanti anni hai?» + «Quanti anni ha?», «Tu quanti anni hai?»
- home: «La chiave è sul tavolo.» + «…sopra il tavolo.», «…sta sul tavolo.»; «La mia camera è piccola.» + «La mia stanza è piccola.», «La camera è piccola.»
- routine: «Mi alzo alle sette.» + «Io mi alzo alle sette.», «Mi alzo alle 7.», «Mi alzo alle ore sette.»; «Studio nel pomeriggio.» + «Io studio…», «Studio di pomeriggio.», «Studio il pomeriggio.»
- food: «Bevo tè al mattino.» + 5 variantes con/sin artículo y «la mattina»; «Vorrei un po’ di riso.» + «Vorrei del riso.», «Un po’ di riso, per favore.»
- places: «La stazione è a sinistra.» + «…sulla sinistra.», «…si trova a sinistra.»; «Vado a scuola.» + «Io vado a scuola.»
- shopping, time, transport, health, weather, social: cifras (alle 8, dopo le 6), «Posso pagare con carta?», «Sono allergico/a alla penicillina.», «Ho mal di testa.», «Mi serve un cappotto.», «Dove ci incontriamo?», «Sono libero/a dopo le sei.», etc.
- A2–B1: «Non sono riuscita…», «Qui si possono fare foto.», «Mi può dare una ricevuta?», «Dovresti dirle…», «Se ti serve aiuto, chiamami.», «Non vuol dire che sia impossibile.», «Che alternativa ci rimane?», etc. (lista completa en el script).

---

## Estado de las correcciones (27 de octubre de 2026)

Aplicadas con `node scripts/repair_italian_audit_2026_10.mjs` (idempotente: la segunda ejecución informa `changed: []`) y protegidas por `tests/italian_audit_repairs.test.mjs`.

| Punto | Estado | Qué se hizo |
|---|---|---|
| C1 | Parcial | `time` reescrita: 21–1000, la hora (È l’una, e un quarto, meno dieci), meses (giugno/luglio), fechas (il primo maggio) y precios en euros; ya no comparte ningún ítem con `survival`. Siguen pendientes `reading-bridge`, `story-bridge` y `vocabulary` 31–36. |
| C2 | Corregido | Respuestas de `reading` con el nombre italiano y el sonido (effe, elle, emme, enne, esse, cu, erre, acca, zeta, gi, ci, vi/vu). |
| C3 | Corregido | `reading` 06 (SC sk/sh, GLI, GN, QU, Z, S sonora) y 07 (tilde final, è/e, sette/sete, antepenúltima), con 6 preguntas nuevas en la prueba. Pistas «lli italiana», «ye / yi» y «párlo» reescritas. |
| C4 | Corregido | `essentials` 10 (presente -are/-ere/-ire, -isc-) y 11 (essere/avere), con bloques y escritura; la prueba de la unidad incluye 9 preguntas nuevas. Notas en Lei, essere y voi. |
| C5 | Corregido | `essentials` 12 «Falsos amigos» (burro, salire, guardare, caldo, camera, aceto, con el falso amigo como distractor); notas en camera, caldo, piano, carta; banco = pupitre; costo = costo, precio. |
| C6 | Corregido | Todos los textos de la tabla C6. |
| C7 | Corregido | Variantes del anexo A; `minimum_correct = n-1` en los 6 diálogos de 3 turnos; producción de salud con «Mi fa male la testa.». La tolerancia a erratas sigue limitada a `spelling_tolerant` (decisión de `src/`). |
| I1 | Parcial | Notas en Lei, Vada, Porta, Prenda, voi; falta unificar el registro de las traducciones. |
| I3 | Parcial | «Cojo» → «Tomo». zumo/ordenador sin cambiar. |
| I2, I4–I8 | Pendiente | Distractores por imagen, usage_notes de gramática, diálogos reales, reescritura de A2–B1 y de `b1-1-register`. |
| Huérfanos | Pendiente | Los 6 archivos antiguos siguen en `units/`. |

**Audio:** el contenido nuevo usa 60 claves sin grabación (≈ 564 caracteres). Hasta generarlas con TTS, la app usa la voz del dispositivo y `tests/guided_content_audit.test.mjs` falla por `missing_audio_manifest_entry`. `tests/guided_stage_walkthrough.test.mjs` cambia su total de actividades (+53 en italiano).
