# Auditoría del curso de árabe (HanStoryPlayerWeb): perspectiva de alumno hispanohablante desde cero

Fecha: 2026-10-27 · Alcance: `library/courses/Arabic` (course.json, 45 unidades activas, 379 lecciones y 6.041 actividades antes de corregir).

**Método.**
- Recorrí todas las actividades con scripts `python3 -I`. Comprobé respuestas fuera de opciones, opciones duplicadas, distractores también correctos, claves de audio, dialectalismos, mezcla de escritura latina y árabe, y la primera aparición de cada grafía especial (ة ى آ ؤ ئ, tanwin, لا, ال).
- Leí completos *reading-foundations*, *reading*, *survival*, *essentials*, *questions*, *time*, *reading-bridge*, *story-bridge* y las 12 unidades de A1.
- En *vocabulary* (44 lecciones) leí todas las tarjetas y sus ejemplos.
- En A2-1 … B1-2 leí todas las tarjetas (`teach_concept`) y muestreé la producción.

**Nota sobre la severidad.** Como en coreano, los repasos y las pruebas copian literalmente los ítems de la lección, con las mismas opciones. Cualquier corrección de texto hay que aplicarla a toda la unidad, no solo a la tarjeta.

**Nota sobre la fuente.** Las unidades A1–B1 se generaron desde `course-authoring/a11_content.mjs … b12_content.mjs`. Esos archivos son compartidos por los diez idiomas y no se tocaron, así que las correcciones de este informe se aplicaron directamente en `units/`. Si se regeneran las unidades, hay que reaplicar `scripts/repair_arabic_audit_2026_10.mjs`.

---

## 0. Resumen en cifras

| Métrica | Valor (antes) |
|---|---|
| Unidades en `levels` / archivos en `units/` | 45 / 51 (6 huérfanos) |
| Actividades | 6.041 (2.198 listening_choice, 2.165 select_translation, 1.042 teach_concept) |
| Respuestas fuera de opciones / opciones duplicadas / claves de audio ausentes | 0 / 0 / 0 |
| Dialectalismos (شو, بدي, عايز, كتير…) | 0: todo el curso está en árabe estándar (MSA), lo cual es coherente |
| Unidades de A0 que son copias exactas | **4** (*survival*, *time*, *reading-bridge* y *story-bridge* repiten los mismos 10 ítems de `essentials-01/02`) |
| Grafías usadas sin enseñarse | ة, ى, آ, ؤ, ئ, لا, tanwin (ًا ٌ ٍ) y el artículo ال con letras solares |
| Producción en foundations | 4 actividades, todas de copiar signos sueltos |
| Diálogos A1 | 12, todos con turnos «Situación N»; 2 de 3 turnos con `minimum_correct` = 3 |

---

## 1. CRÍTICO

### C1. La lectura se queda en nombres de letras: faltan vocales con sonido, tanwin, ة, ى, ال y las formas conectadas
- *reading-foundations* enseña los 28 nombres de letra y presenta َ ِ ُ ْ ّ como signos sueltos, sin sílabas que se oigan. Solo muestra las formas conectadas de ع (`arabic-reading-00-09-a`).
- *reading* enseña un sonido por letra (01–06) y no tiene ni una sílaba vocalizada.
- Primeras apariciones sin enseñanza previa:
  - ة: `reading-foundations / arabic-reading-00-08-a-teach` (العربية). En A1 aparece en لغة, غرفة, صيدلية…
  - Artículo ال con letra solar: `arabic-reading-00-08-a` (العربية [al-ʿarabiyya]), y luego السوق, الشمس…, sin regla.
  - ى: `essentials / arabic-essentials-01-1-listen` (en opciones) y `-03-1-teach` (أتى), متى, مستشفى, حمى.
  - آ: `essentials / arabic-essentials-06-2-teach` (الآن).
  - Tanwin ًا: `essentials-06-4-teach` (غدًا), y شكرًا, مرحبًا, عفوًا…
  - ٍ: `a1-2-shopping` (غالٍ). ؤ: `a1-2-health` (يؤلمني). ئ: `vocabulary-01` (en opciones).
- **Corrección:** cinco lecciones nuevas en *reading*, antes de su prueba:
  1. Vocales cortas y largas con letra real (بَ بِ بُ با بي بو).
  2. Sukun, shadda y tanwin (مِنْ, أُمّ, شُكْرًا, كِتابٌ, بَيْتٍ).
  3. ة / ة→ت, ى, آ y لا (غُرْفَة/غُرْفَتي, مَتى, الآن, لا).
  4. ال con letras lunares y solares, y hamzat al-wasl (القَمَر, الشَّمْس, السّوق, في البَيْت).
  5. Formas conectadas de ب ه ع ك ي.
  - Además, 10 preguntas nuevas en `arabic-reading-test-08`.

### C2. Cuatro unidades de A0 son la misma lista de 10 pronombres
- `survival` («Saludos, cortesía…»), `time` («Números, días, horas…»), `reading-bridge` y `story-bridge` contienen exactamente أنا, أنتَ / أنتِ, هو, هي, نحن, أنتم, هم, كان, عندي, ذهب, con las mismas opciones. Son a su vez una copia de `essentials-01/02`.
- `questions` repite las palabras interrogativas de `essentials-03…05`.
- En todo A0 no hay ningún saludo (السلام عليكم no aparecía en ninguna parte del curso), ni números, días u hora antes de *vocabulary*.
- **Corrección:**
  - `survival`: saludos, cortesía, «¿cómo estás?», disculpas y despedidas.
  - `time`: números 1–10, cifras árabes (٣ ٥ ٧ ٨ ١٠, con la nota de que se leen de izquierda a derecha), días de la semana y la hora con ordinales femeninos.
  - `questions`: oración nominal sin verbo «ser», preguntas con هل y negación con لست.
  - `reading-bridge`: género (أنتَ/أنتِ, ة) y concordancia del adjetivo.
  - `story-bridge`: frases cortas de diálogo con su forma femenina en nota.

### C3. Glosas de verbos falsas y ninguna regla de conjugación ni de oración nominal
| Ubicación | Actual | Corrección |
|---|---|---|
| `essentials-02-3`, `vocabulary-31` | كان = «ser / estar» | «era / estaba (pasado)». Nota: en presente no hay verbo «ser»: أنا طالب. |
| `essentials-02-4` | عندي = «tener» | «tengo» (عندك = tienes) |
| `essentials-02-5` | ذهب = «ir» | «fue (él) · verbo «ir»», con el presente أذهب / يذهب |
| `essentials-03-1` | أتى = «venir» | «vino (él) · verbo «venir»» |
| `essentials-03-4` | أفعل = «hacer» | «hago» |
| `vocabulary-06` (سمع, رأى, تكلم, نام, أكل, شرب…) | Pasado glosado como infinitivo, con ejemplos en presente (أنا أسمع) | `usage_note` con pasado y presente de cada uno |

- No hay ninguna tarjeta sobre los prefijos del presente (أـ تـ يـ نـ) ni sobre la oración sin verbo.
- **Corrección:** lección `arabic-essentials-07` «El presente: أـ تـ يـ نـ» (أكتب, تكتب, تكتبين, يكتب, نكتب, لا أكتب), con bloques y escritura. La oración nominal se cubre en `questions` (C2).

### C4. El género gramatical no se explica en ningún lugar de A0–A1
- `أنتَ / أنتِ` se enseña como un único ítem = «tú», sin decir cuál es cuál. Su clave de audio contiene la barra.
- En A1, ما اسمك؟, كم عمرك؟, تشرّفت بلقائك., هل تريد أن تأتي؟, خذ مظلة. y اذهب مستقيمًا. solo sirven para hablar con un hombre, y nada lo indica. Lo mismo pasa con طالب/طالبة y con los adjetivos femeninos de *vocabulary* (خضراء, صفراء, بنية…).
- **Corrección:**
  - Unidad `reading-bridge` nueva (C2).
  - `usage_note` en `essentials-01-2` y en las tarjetas A1 citadas, con la forma femenina.

### C5. Traducciones erróneas o engañosas
| Ubicación | Actual | Corrección |
|---|---|---|
| `a1-2-health` (tarjeta, prueba, dictado, «habla» y diálogo) | يؤخذ هذا مرتين في اليوم. = «Tome esto dos veces al día.» Es voz pasiva, y además es una frase del médico. | «Esto se toma dos veces al día.» Para producción convendría una frase del paciente (pendiente). |
| `a1-1-identity` | مساء الخير = «buenas noches» | «buenas tardes / buenas noches (saludo)». Para despedirse por la noche: تصبح على خير. |
| `a1-1-identity` | أتكلم العربية قليلًا. = «Hablo un poco de este idioma.» | «Hablo un poco de árabe.» |
| `a1-1-routine` | أستيقظ = «Me levanto…» | «Me despierto…» |
| `a1-2-time` | سأتأخر. = «Llego tarde.» | «Voy a llegar tarde.» |
| `a1-2-social` | وقت = «hora» | «tiempo (libre)»; la hora es ساعة |
| `a1-1-places` | اذهب مستقيمًا. = «Siga recto.» | «Sigue recto.» (el árabe no tiene usted), con nota del femenino |
| `vocabulary-26` | «أرسل رسالة قصيرة. — Envía…» | «Envío un mensaje corto.» |
| `vocabulary-05` | صحي = «sano»; «هو صحي.» = «Él está sano.» (no se dice de una persona) | «saludable»; ejemplo «هذا طعام صحي.» |
| `b1-1-cause-effect-01-10`, `b1-2-conditions` | «لأنني فاتني الحافلة، وصلت متأخرًا.» (agramatical: لأنني exige sujeto «yo») | «لأن الحافلة فاتتني، وصلت متأخرًا.» |
| `a2-1-ability` | «Aquí se puede tomar fotos.» | «Aquí se pueden tomar fotos.» |

### C6. Producción: rechaza variantes correctas y el teclado sin hamza
- La normalización (`src/guided_course_answers.js`) quita harakat y tatwil, pero no unifica أ إ آ → ا. Así se rechaza «انا من المكسيك» o «هل استطيع…», que es como escribe la mayoría de los árabes en el móvil.
- Hay una sola respuesta aceptada por actividad. Se rechazan, por ejemplo:
  - «ما هو اسمك؟»
  - «أنا مكسيكي.»
  - «عندي نقد فقط.» (sinónimo de لدي, enseñado en A0)
  - «هل أستطيع الدفع بالبطاقة؟»
  - «أحتاج معطفًا.»
  - «أستيقظ في السابعة.»
- Diálogos de 3 turnos sin margen (`a1-1-places`, `a1-2-social`: `minimum_correct` 3/3).
- **Corrección:**
  - Variantes por frase.
  - Variante sin hamza para cada respuesta libre y cada turno de diálogo.
  - `minimum_correct = n-1`.

---

## 2. IMPORTANTE

- **I1. Descripciones de sonido engañosas** (`reading-01…06`):
  - ج «y fuerte o j según la región»: un hispanohablante leerá la j española [x]. Corregir a «dj, como la «ll» argentina; nunca la j española».
  - ه «h suave»: en español la h es muda. Corregir a «h aspirada (como en inglés)».
  - ع «sonido profundo de garganta»: no distingue de ح. Corregir a «ʿayn: se aprieta la garganta».
- **I2. Producción de foundations sin valor** (`reading-foundations / production-checkpoint`):
  - Pide copiar «َ ِ ُ» y «ْ ّ». Como el normalizador elimina esos signos, la respuesta esperada queda vacía. Cualquier combinación de signos, e incluso una respuesta vacía, se da por buena (ver §6).
  - Los bloques «بَ بِ بُ» se aceptarían en cualquier orden.
  - **Corrección propuesta:** pedir palabras con letras (مِنْ, أُمّ).
  - No se tocó: `scripts/foundation_pedagogy.mjs` y `tests/arabic_sukun_shadda_audio.test.mjs` fijan esa unidad.
- **I3. Diálogos A1 que no son diálogos:** los 12 diálogos guiados tienen turnos «Situación N», sin interlocutor en árabe (igual que en coreano, I9). Pendiente.
- **I4. Distractor también correcto:** `vocabulary-02-4` (طفل = «niño pequeño», con el distractor «niño»).
- **I5. A2–B1 hereda la mitad de cada unidad**, igual que en coreano (C8):
  - a2-2-opinions = conectores de a2-1-conversation.
  - b1-1-register = a2-2-problemSolving.
  - b1-1-society = palabras sueltas de a2-1-comparison.
  - Además, `b1-1-register` no enseña registro: no menciona MSA frente a dialecto, حضرتك ni fórmulas de cortesía como لو سمحت. Pendiente.
- **I6. Gramática usada sin nota en A1:**
  - سـ (futuro: سآخذه, ستمطر, سأتأخر).
  - لنـ (لنلتقِ).
  - أن + subjuntivo (هل تريد أن تأتي؟).
  - Pasiva (يؤخذ, يُسمح).
  - Dual (أخوان, كرسيان, مرتين).
  - لدي frente a عندي.
  - Pendiente: una `usage_note` de una línea por estructura.
- **I7. Ítems duplicados en *vocabulary* 31–33:** son las tarjetas de `essentials`, sin ejemplos. Se corrigieron las glosas, pero las lecciones siguen ahí. Conviene eliminarlas o convertirlas en repaso.
- **I8. Clave de audio con barra:** «أنتَ / أنتِ» y «ماذا / ما» (37 actividades). El TTS lee la barra o une las dos formas. Ahora existen tarjetas separadas en `reading-bridge`. Lo ideal es dividir las de `essentials` (pendiente, porque cambia sus pruebas).

---

## 3. MENOR

- `غالي` en `vocabulary-15`: en MSA es غالٍ (A1 ya lo escribe bien).
- «لو كان لدي وقت…» = «Si tuviera **más** tiempo» (b1-2-conditions): sobra «más».
- `vocabulary-23`: درجة = «grado», pero el ejemplo se traduce «La temperatura es alta».
- «أطفال يلعبون…» (`vocabulary-29`): mejor «الأطفال يلعبون…».
- Glosas inconsistentes en *vocabulary*: يأكل = «come», pero يذهب = «ir».
- `reading-test-08` usa como intro «Primero aprenderás cada elemento…» en una prueba.
- Sesgo de posición: no detectado. Las opciones de A1 rotan.

## 4. Audio

- Antes de corregir no faltaba ninguna clave en `audio_manifest.json`.
- El contenido nuevo usa **72 claves sin grabación**, que hay que generar con TTS:
  - Lectura (17): بَ بِ بُ با بي بو مِنْ أُمّ شُكْرًا كِتابٌ بَيْتٍ غُرْفَتي القَمَر الكِتاب الشَّمْس السّوق «في البَيْت».
  - Survival (9): السلام عليكم · وعليكم السلام · أهلًا وسهلًا · عفوًا · نعم · كيف حالك؟ · «أنا بخير، الحمد لله.» · آسف · مع السلامة.
  - Essentials (6): أكتب · تكتب · تكتبين · نكتب · لا أكتب · «نحن نكتب.»
  - Questions (10): «أنا طالب.» · «أنا طالبة.» · «البيت كبير.» · بيت كبير · «هذا كتاب.» · هل أنت طالب؟ · «نعم، أنا طالب.» · «لا، لست طالبًا.» · ما هذا؟ · أين الحمّام؟
  - Time (9): الأحد · الثلاثاء · الأربعاء · الخميس · الجمعة · السبت · «الساعة الواحدة.» · «الساعة الثالثة.» · «الساعة الخامسة والربع.»
  - Reading-bridge (10): أنتَ · أنتِ · طالب · طالبة · كبيرة · «الغرفة كبيرة.» · «هو مكسيكي.» · «هي مكسيكية.» · «هذا ولد.» · «هذه بنت.»
  - Story-bridge (10): ماذا تريد؟ · «لا أعرف.» · «تعال هنا!» · «انتظر!» · من هناك؟ · «أنا هنا.» · «هيا بنا!» · «ساعدني!» · «لا تخف.» · «حسنًا.»
  - B1 (1): «لأن الحافلة فاتتني، وصلت متأخرًا.»
- Donde la palabra ya tenía grabación sin vocales, se reutilizó en lugar de crear una clave nueva: غرفة, متى, الآن, لا, los números, los nombres de letra, مرحبًا, صباح الخير, «شكرًا.», «من فضلك.», «لا أفهم.», اليوم, غدًا, كم الساعة؟, الاثنين y «الساعة الثالثة والنصف.».
- Conviene que el TTS respete las harakat de las sílabas (بَ ≠ بِ ≠ بُ). Si la voz las ignora, hay que grabarlas.

## 5. Unidades huérfanas

- `units/` contiene 6 archivos que `course.json` no referencia: `a1-1-introductions`, `a1-2-daily-life`, `a2-1-plans-and-time`, `a2-2-description-and-comparison`, `b1-1-narration-and-reasons` y `b1-2-independent-reading`.
- Son versiones antiguas, como en coreano. Hay que archivarlos fuera de `units/`.

## 6. Código compartido (no modificado)

- `src/guided_course_answers.js` → `normalizeGuidedAnswer` borra `ARABIC_MARKS`. Esto tiene dos efectos:
  1. Las respuestas formadas solo por signos (`arabic-reading-foundations-production-*`) se normalizan a «», y una respuesta vacía o cualquier signo cuenta como correcta.
  2. No se puede evaluar si el alumno escribió bien las harakat.
- Además no unifica أ/إ/آ → ا ni ى/ي. Se resolvió en datos con `accepted_answers`; sería más limpio hacerlo en el normalizador.

## 7. Recomendaciones para el perfil del alumno (Assimil + Rosetta, ~40 min/día)

1. Mantener el texto vocalizado en A0 y A1, y quitar las vocales de forma progresiva a partir de A2. Hoy A1 ya va sin harakat, salvo el tanwin.
2. Abrir cada unidad A1 con un diálogo modelo real, que tenga voz masculina y femenina para practicar el género.
3. Añadir imágenes a los sustantivos concretos de *vocabulary* (familia, casa, comida, ropa y colores).
4. Indicar desde la primera unidad que el curso enseña árabe estándar (MSA). En la calle se oirán dialectos (شو, إيش, عايز). Una tarjeta opcional con «¿Cómo estás?» en 3 dialectos ayudaría a gestionar las expectativas.

---

## Estado de las correcciones (27 de octubre de 2026)

Aplicadas con `node scripts/repair_arabic_audit_2026_10.mjs` (idempotente: la segunda ejecución devuelve `changed: []`) y protegidas por `tests/arabic_audit_repairs.test.mjs`.

| Punto | Estado | Qué se hizo |
|---|---|---|
| C1 | Corregido | `reading` 07–11: vocales con letra, sukun/shadda/tanwin, ة ى آ لا, ال lunar y solar con hamzat al-wasl, y formas conectadas. La prueba de lectura tiene 10 preguntas nuevas. |
| C2 | Corregido | `survival`, `time`, `questions`, `reading-bridge` y `story-bridge` reescritas con contenido nuevo, repasos y prueba final. Se actualizaron títulos y descripciones en `course.json`. |
| C3 | Corregido | Glosas de كان, عندي, ذهب, أتى y أفعل; notas pasado/presente en `vocabulary-06`; lección `essentials-07` (presente con prefijos, negación con لا, bloques y escritura). |
| C4 | Corregido | Unidad de género y concordancia; notas del femenino en `essentials` y en 7 tarjetas A1. |
| C5 | Corregido | Todas las traducciones de la tabla, incluida la frase agramatical de B1 (con nueva clave de audio). La frase del médico en producción sigue pendiente. |
| C6 | Corregido | Variantes naturales y sin hamza en A1 (respuestas libres y turnos); `minimum_correct = n-1` en los diálogos de 3 turnos. |
| I1 | Corregido | Sonidos de ج, ه y ع. |
| I2 | Pendiente | Necesita cambiar el normalizador o `foundation_pedagogy.mjs` (fuera del alcance). |
| I3, I5, I6 | Pendiente | Diálogos reales, reescritura de A2–B1 y notas gramaticales A1. |
| I4 | Corregido | El distractor «niño» de طفل se sustituyó por «niña». |
| I7, I8 | Parcial | Glosas corregidas; las lecciones duplicadas y las claves con barra siguen igual. |
| Huérfanas | Pendiente | 6 archivos antiguos en `units/`. |

**Audio:** 72 claves nuevas sin grabación. Hasta generarlas, la app usa la voz del dispositivo, y `tests/guided_content_audit.test.mjs` falla por `missing_audio_manifest_entry`. `tests/guided_stage_walkthrough.test.mjs` falla porque el total de actividades cambia (el árabe pasa de 6.041 a 6.228).
