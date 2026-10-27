# Auditoría del curso de chino (HanStoryPlayerWeb) — perspectiva de alumno hispanohablante desde cero

Fecha: 2026-10-27 · Alcance: `library/courses/Chinese` (course.json, 45 unidades activas, 424 lecciones, 6.745 actividades antes de las correcciones).

**Método.**
- Recorrí todas las actividades con scripts `python3 -I`. Comprobé estructura, opciones, respuestas, audio, pinyin, solapamiento entre unidades y uso antes de enseñar.
- Leí línea a línea *reading-foundations*, *reading*, *survival*, *essentials*, *questions*, *time*, los dos puentes, todo *vocabulary* (fichas y ejemplos) y todo A1-1 y A1-2, incluida la producción.
- En A2-1 … B1-2 leí todas las fichas nuevas de cada unidad y medí la herencia entre unidades.

**Nota sobre la severidad.** Igual que en coreano, los repasos (`review-*`) y las pruebas (`test-*`) copian los ítems de la lección. Toda corrección de traducción se aplicó en la unidad completa (lección, repaso y prueba).

---

## 0. Resumen en cifras

| Métrica | Antes |
|---|---|
| Unidades en `levels` / archivos en `units/` | 45 / 51 (6 huérfanos) |
| Actividades | 6.745 (1.230 teach_concept, 2.439 select_translation, 2.395 listening_choice) |
| Tarjetas en caracteres con pinyin (A0 + A1) | **38 de ≈ 900** (4 %). Ninguna en `questions`, `story-bridge` ni en las 12 unidades de A1 |
| Unidades que repiten *survival* | `time` 57/57, `reading-bridge` 57/57, `story-bridge` 30/30 ítems idénticos; final de `vocabulary` (lecc. 41–46) también |
| `questions` frente a `essentials` | 7 de 9 ítems repetidos |
| Iniciales de pinyin nunca enseñadas | m, f, n, l, h, z, c, s (solo se enseñan b p d t g k j q x zh ch sh r) |
| Reglas de cambio de tono | ninguna (3.º + 3.º, 不, 一) aunque el primer audio, 你好, ya la aplica |
| Clasificadores | se usan desde `vocabulary` (本, 支, 杯, 把, 只, 张, 双, 条, 件) sin regla; un ejemplo dice «我有二本书» |
| Herencia en A2–B1 | 8 de 16 ítems de cada unidad vienen de una unidad anterior (igual que en coreano) |
| Respuestas fuera de opciones / opciones repetidas / audio sin manifiesto | 0 / 0 / 0 |

---

## 1. CRÍTICO

### C1. Pinyin incompleto: faltan 8 iniciales y las finales que engañan
- `reading` enseña los tonos y b p d t g k j q x zh ch sh r. **m, f, n, l, h, z, c y s no se enseñan nunca**, y las tres últimas son trampas para un hispanohablante: h suena como j suave (hǎo «jao»), z y c suenan «ts».
- Tampoco hay tarjetas para las finales que no se leen como en español: e (gē), la «i» zumbada de zhi/chi/shi/ri y zi/ci/si (四 sì no es «si»), ian = «ien» (钱 qián, 点 diǎn), ui = «uei» (水 shuǐ), u = ü tras j/q/x (去 qù), an/ang, er (二 èr).
- **Corrección:** `reading` 05 (iniciales) y 06 (finales), con tarjeta, pregunta de pronunciación y escucha; 9 preguntas nuevas en la prueba `chinese-reading-test-06`.

### C2. No se enseña ningún cambio de tono
- `survival-01-1` (你好, audio «nǐ hǎo»), `survival-01-4` (请再说一遍, «yí biàn»), `survival-02-1` («yìdiǎn») y `essentials`/`vocabulary` (不是, 一个, 不客气) usan sandhi sin explicarlo. Un alumno que ha aprendido que nǐ es «tercer tono» oye [ní] y no lo reconoce.
- **Corrección:** `reading` 07 «Cambios de tono»: 你好 [ní hǎo], 很好 [hén hǎo], 不是 [bú shì] frente a 不好 [bù hǎo], 一个 [yí ge] frente a 一天 [yì tiān] y 第一 [dì yī], y el tono neutro (谢谢 xièxie, 吗, 的).

### C3. Casi ninguna tarjeta tiene pinyin
- El curso se presenta como «pinyin primero, caracteres después» (`reading-foundations-00-08-b`), pero solo 38 tarjetas de A0–A1 llevan `pinyin`. Todo `vocabulary` (344 fichas), `questions`, `story-bridge` y A1 muestran solo caracteres; el alumno no puede leer 我们, 钥匙 o 尺码 si el audio falla o quiere ver los tonos.
- **Corrección:** `pinyin` en las actividades `teach_concept`/`select_translation` de survival, essentials, vocabulary y las 12 unidades de A1 (de 86 a 1.860 actividades con pinyin en todo el curso) (diccionario revisado a mano en el script). Modo `visible` en las fichas de A0, `hidden` (botón «Mostrar pinyin») en preguntas y en A1.

### C4. Cuatro unidades de A0 repiten *survival* palabra por palabra
- `time` («Números, tiempo y vida diaria»): 57 de 57 ítems = *survival*, en el mismo orden.
- `reading-bridge` («Escucha y lectura guiada»): 57 de 57 ítems = *survival* (saludos, números 0–20, días).
- `story-bridge` («Puente hacia las historias»): 30 de 30 = *survival*.
- `questions`: 7 de 9 = `essentials-03/04`.
- `vocabulary` 41–46 repite otra vez tonos, iniciales, frases de *survival* y números 11–20.
- Son ≈ 800 actividades de repetición presentadas como unidades nuevas; el alumno pasa unos 4 días de 40 min repitiendo los números del 0 al 20.
- **Corrección:**
  - `time` → «Números, horas, fechas y precios»: clasificadores (个, 本, 杯, 张, 件, 双), 两 frente a 二, 这个/那个, números 21–200, la hora (两点, 八点半, 十点十五分), meses y 号, precios (块, 两块五, 十块一斤, 便宜一点吧).
  - `questions` → «Preguntas completas»: la palabra interrogativa no se mueve (你去哪里？ → 我去学校), 呢, 几, la pregunta sí-no-sí (你忙不忙？).
  - `reading-bridge` → «Leer frases completas»: 15 frases nuevas con palabras ya enseñadas y el pinyin oculto.
  - `story-bridge` → «Primer diálogo»: diálogo de 10 líneas Ana–Wang Lei (presentarse, nacionalidad, 哪里哪里).
  - `vocabulary` 41–46: pendiente (ver I4).

### C5. Sin gramática mínima en A0
- Ninguna tarjeta explica que con adjetivos no se usa 是 (我很忙, no «我是忙»), qué hace 的, ni dónde van 也, 都 y 在. A1 los usa desde la primera lección (这是我的家人, 我的房间很小, 我妈妈在这里工作).
- **Corrección:** `essentials` 10 «Frases básicas»: 我是学生 / 他不是老师 / 我很忙 / 我的书 / 我也是学生 / 我在家 / 我们都是朋友, con bloques y escritura.

### C6. Ejemplos agramaticales y traducciones erróneas
| Ubicación | Actual | Corrección |
|---|---|---|
| `vocabulary-10-8` (二) | «我有二本书。» | «我有两本书.» + nota: con clasificador se usa 两 |
| `vocabulary-15-10` (全) | «我要全杯水。» (agramatical) | «全家都来了。 — Vino toda la familia.» |
| `vocabulary-05-1` (牙齿) | «我刷牙齿。» (se dice 刷牙) | «我的牙齿很白。» + nota 刷牙 |
| `vocabulary-15-6` (袋) | «我要一袋米饭» = bolsa de arroz cocido | «我要一袋面包。» |
| `vocabulary-15-3` (块) | «这个三块。 — Esto cuesta tres unidades.» | «这个三块钱。 — Esto cuesta tres yuanes.» |
| `vocabulary-17-2` (谢谢) | «谢谢，你给我水。 — Gracias, me das agua.» | «谢谢你给我水。 — Gracias por darme agua.» |
| `vocabulary-21-10` (月份) | «一年有十二个月份。» | «一年有十二个月。» |
| `vocabulary-29-7`, `-30-1` | 孩子睡了 «El niño durmió»; 我们走吧 «Vamos caminando» | «El niño ya se durmió»; «Vámonos» |
| `survival-09-2/3`, `vocabulary-34-9/10` | 是 = «sí», 不是 = «no» | «ser; sí (así es)», «no ser; no (no es así)» + nota: no hay una palabra única para «sí» |
| `a1-1-identity-04-15` | 我会说一点汉语 = «Hablo un poco de este idioma.» | «Hablo un poco de chino.» |
| `a1-1-routine-01-01` | 起床 = «despertarse» (la frase 03-13 dice «me levanto») | «levantarse» |
| `a1-2-health-03-14` y su producción | 这个药一天吃两次 = «Tome esto dos veces al día» | «Esta medicina se toma dos veces al día.» |
| `a1-2-time-02-11`, `-04-15` | «Quedemos mañana», 我迟到了 = «Llego tarde» | «Nos vemos mañana», «Llegué tarde» |
| `a1-2-social-02-04` | 时间 = «hora» | «tiempo (disponible)» |
| `a2-1-future` | 打算 = «intención» | «planear, tener la intención de» |
| `a2-1-comparison` | 这个房间更便宜 = «La habitación es menos cara» | «Esta habitación es más barata.» |
| `a2-1-ability` | «¿Puedo usar este asiento?», «Aquí se puede tomar fotos», 允许 = «permitido» | «¿Puedo sentarme en este asiento?», «se pueden», «permitir» (también en `a2-2-workStudy`) |

### C7. Producción: una sola respuesta aceptada y diálogos sin margen
- Todas las producciones de A1 aceptan solo el modelo: se rechazan «我是墨西哥人。», «您贵姓？», «我8点到。» (las cifras son lo que devuelve el reconocimiento de voz), «我们在哪儿见？», «能刷卡吗？».
- `a1-1-places` y `a1-2-social` (stage_scenario de 3 turnos) exigen 3/3.
- **Corrección:** `accepted_answers` ampliados en 21 modelos de A1 (typed_translation, open_question, speak_and_transcribe y turnos de diálogo) y `minimum_correct = n − 1` en los diálogos de 3 turnos. El espaciado ya no penaliza en chino (`src/guided_course_answers.js`).

---

## 2. IMPORTANTE

### I1. Clasificadores usados sin regla
- `vocabulary` usa 本, 支, 杯, 把, 只, 张, 双, 条, 件, 座, 朵 en ejemplos; A1 usa 两把椅子, 一件外套, 一张票, 这辆公共汽车 sin explicación. La ficha 个 se glosa solo «clasificador general».
- **Corregido:** lecciones `time` 01–02 y `usage_note` en 个 y 二 (`vocabulary`). Pendiente: nota breve en 把 / 辆 de A1.

### I2. Fichas de pronunciación repetidas fuera de lugar
- `survival-12-3/4/5` (mā, má, mǎ) aparecen tras los días de la semana; `essentials-06-5 … 08-4` y `vocabulary-41-1 … 41-10` repiten tonos e iniciales ya enseñados en `reading` y `reading-foundations`. Inflan el contador de «elementos nuevos».
- **Pendiente:** eliminarlas de *survival* y *vocabulary* (las de `essentials` las protege `tests/rule_context_repairs.test.mjs`).

### I3. Herencia de 8/16 ítems en A2–B1 y B1 sin registro
- Cadenas: past → experiences → narrative → perspectives; services → problemSolving → register → negotiation; conversation → opinions/emotions; comparison → culture/society…
- `b1-1-register` no tiene ninguna ficha sobre 您 frente a 你, 请/麻烦您, ni sobre lengua escrita (将, 予以) frente a oral; `a2-2-culture` enseña otra vez 高 y 快.
- **Pendiente** (misma reescritura que C8/C9 del coreano).

### I4. `vocabulary` 41–46 duplica *survival* y *essentials*
- 41: tonos e iniciales; 42–44: frases de *survival* y números 11–20; 44–46: 是/不是/可能/这/那/什么/谁/哪里/您/能 / 可以/怎么…
- **Pendiente:** convertir en repaso sin `teach_concept` o sustituir por vocabulario nuevo.

### I5. Diálogos guiados vacíos
- Las 12 unidades de A1 (y A2–B1) usan turnos «Situación N» sin una sola línea del interlocutor en chino (igual que I9 del coreano).
- **Pendiente.** Mientras tanto, `story-bridge` ofrece ya un diálogo real de 10 líneas.

### I6. Español peninsular en un curso para mexicanos
- «vosotros / ustedes sois» (`vocabulary-01-6`), ordenador, móvil, deberes, aparcado, salón, plátano/banana mezclados (`vocabulary-16-3` dice «bananas», `13-2` «plátanos»).
- **Pendiente** (menor coste, pero afecta a muchas opciones y repasos).

### I7. Homófonos y pares tonales sin aviso
- 他/她/它 (tā) solo se distinguen por escrito (la nota existe en `vocabulary-01-3/4`, no en `essentials-01-4/5`).
- `essentials-review-06-2-listen` contrasta 那里 (nàlǐ) con 哪里 (nǎlǐ): válido como discriminación tonal, pero la escucha no avisa de que la diferencia es solo el tono.

---

## 3. MENOR

- `vocabulary-02-10`: la pregunta de 父亲 ofrece «papá» como distractor (también correcto en sentido amplio). Las glosas sinónimas sin matiz: 妈妈/母亲, 爸爸/父亲, 吃/吃饭, 睡/睡觉, 走/走路, 橙子/橙色 «naranja», 下午/晚 «tarde», 会/知道 «saber». Añadir «(formal)», «(color)», «(parte del día)».
- `survival-02-2`: 你会说英语吗 = «¿Habla inglés?» usa 你 (tú); traducir «¿Hablas inglés?» o cambiar a 您.
- `a1-1-identity`: «我来自墨西哥» es correcto pero menos frecuente que «我是墨西哥人» (ahora aceptado).
- `a1-1-people-03-13`: 他是谁 = «¿Quién es?»; en `questions` se glosa «¿Quién es él?».
- Producción `complete_without_options` trivial: «我来自墨西＿» → 哥, «我下午学＿» → 习 (rellenar la mitad de una palabra no practica gramática).
- `a1-2-time-04-15`: 我迟到了 ya corregido; `a2-1-ability` «需要/必要» y `b1-1-cause-effect` «时间不够，因此我们离开了» (ilógico, como en coreano).
- Posición de la respuesta: repasos y pruebas son copias de la lección con el mismo orden de opciones.

---

## 4. Audio
- Antes de las correcciones todas las claves `audio`/`slow_audio` existían en `audio_manifest.json`.
- El contenido nuevo usa **86 claves sin grabación** (11 sílabas de pinyin y 75 palabras o frases). Hasta generarlas, la app usa la voz del dispositivo y `tests/guided_content_audit.test.mjs` falla por `missing_audio_manifest_entry`.
- Claves de sílaba: cí, duì, fā, hē, lā, máng, qián, qù, sī, zī, èr.

## 5. Unidades huérfanas
- 6 archivos en `units/` no están en `course.json`: `a1-1-introductions`, `a1-2-daily-life`, `a2-1-plans-and-time`, `a2-2-description-and-comparison`, `b1-1-narration-and-reasons`, `b1-2-independent-reading` (versiones antiguas de 7 lecciones). **Pendiente:** archivarlos.

## 6. Recomendaciones para el perfil Assimil + Rosetta Stone (≈ 40 min/día)
1. **Pinyin como andamio, no como muleta:** ya está en todas las fichas; el siguiente paso es un ajuste «ocultar pinyin a partir de A1-2» en lugar de mostrarlo por ficha.
2. **Diálogo primero:** abrir cada unidad de A1 con un diálogo de 6–10 líneas como el nuevo `story-bridge`.
3. **Imagen antes que traducción:** los sustantivos concretos de `vocabulary` (frutas, ropa, cuerpo, transporte) son ideales para «escucha y elige la imagen».
4. **Escribir caracteres:** no hay ninguna actividad de trazo; al menos copiar 1–2 caracteres por lección de A0.

---

## Estado de las correcciones (27 de octubre de 2026)

Aplicadas con `node scripts/repair_chinese_audit_2026_10.mjs` (idempotente: la segunda ejecución no cambia nada) y protegidas por `tests/chinese_audit_repairs.test.mjs`.

| Punto | Estado | Qué se hizo |
|---|---|---|
| C1 | Corregido | `reading` 05 (m f n l h z c s) y 06 (e, i zumbada, ian, ui, ü tras j/q/x, an/ang, er); 9 preguntas nuevas en la prueba de `reading`. |
| C2 | Corregido | `reading` 07 «Cambios de tono»: 3.º + 3.º, 不, 一 y tono neutro. |
| C3 | Corregido (A0–A1) | Pinyin en todas las fichas y preguntas en caracteres de survival, essentials, questions, time, vocabulary, puentes y A1. A2–B1 sigue sin pinyin. |
| C4 | Corregido (`time`, `questions`, puentes) | `time` reescrita (clasificadores, 两, números grandes, hora, fechas, precios); `questions` con preguntas completas; `reading-bridge` y `story-bridge` con frases y diálogo nuevos. `vocabulary` 41–46 pendiente (I4). |
| C5 | Corregido | `essentials` 10 «Frases básicas» con bloques y escritura. |
| C6 | Corregido | Todos los ejemplos y traducciones de la tabla. |
| C7 | Corregido | Variantes aceptadas en A1 (incluidas cifras) y `minimum_correct = 2` en los diálogos de 3 turnos. |
| I1 | Parcial | Lecciones de clasificadores y notas en 个 y 二; faltan notas en A1. |
| I2–I7 | Pendiente | Ver cada punto. |

**Audio:** 86 claves nuevas pendientes de generar con TTS (lista en la sección 4 y en `node scripts/audit_guided_courses.mjs`).
