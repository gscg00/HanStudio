# Auditoría del curso de japonés (HanStoryPlayerWeb): perspectiva de alumno hispanohablante desde cero

Fecha: 2026-10-27 · Alcance: `library/courses/Japanese` (course.json, 47 unidades activas, 467 lecciones y 6.470 actividades antes de corregir).

**Método.**
- Recorrí todas las actividades con scripts `python3 -I`. Comprobé:
  - Opciones y respuestas, duplicados y distractores de relleno.
  - Kana y combinaciones usados antes de su `teach_kana`.
  - Kanji usados antes de `starter-kanji`.
  - Registro (です/ます frente a la forma simple).
  - Solapamiento entre unidades y producción.
- Leí completos *reading-foundations*, *hiragana-01*, *katakana*, *rhythm*, *first-words*, *first-sentences*, *basic-verbs*, *adjectives*, *functional-a1*, *starter-kanji* y *story-bridge*, además de A1-1 y A1-2.
- Muestreé A2-1 … B1-2: todas las tarjetas nuevas de cada unidad, más la producción y los diálogos.

**Estructura.** El japonés no tiene las unidades *survival/time/essentials/questions*. Por eso no existe el duplicado *time* = *survival* ni *questions* = *essentials* del coreano. El arranque es:

reading-foundations → hiragana → katakana → ritmo → primeras palabras → oraciones → verbos → adjetivos → funcional → kanji → puente

Este arranque es más sólido que el del coreano. Aun así, tiene huecos graves (ver C1–C4).

---

## 0. Resumen en cifras

| Métrica | Valor |
|---|---|
| Unidades en `levels` / archivos en `units/` | 47 / 53 (6 huérfanos) |
| Actividades | 6.470: 1.684 listening_choice, 1.661 select_translation, 582 word_to_translation, 350 kana_to_audio, 258 audio_to_kana… |
| `kana_to_audio` cuya respuesta contiene el propio kana | **109 de 350** |
| Repasos y pruebas de fundamentos con frases de explicación como respuesta u opción | **≈ 250 ítems** (first-words, basic-verbs, adjectives, functional-a1) |
| Distractor de relleno «No corresponde a esta oración.» | 34 + 2 («No corresponde.») |
| Kanji distintos usados en A1–B1 sin enseñarse ni mostrar lectura | 376 (solo se enseñan 74 en *starter-kanji*) |
| Producción que solo acepta la grafía con kanji | 100 % de A1 (6 actividades + 2–3 turnos por unidad) |
| Diálogos «Situación N» sin interlocutor | 40 |
| Unidades A2–B1 que heredan 7–8 de sus 16 ítems de otra unidad | 18 de 24 |

---

## 1. CRÍTICO — bloquea el aprendizaje o enseña algo incorrecto

### C1. «¿Cómo suena este kana?» se responde sin escuchar
- Desde la fila N, la pista de sonido de *hiragana-01* y *katakana* es genérica: «Escucha el sonido de な y repítelo sin añadir una vocal extra».
- En las 109 preguntas `kana_to_audio` (p. ej. `jp-hira-family-5-sound-1`, `jp-kata-review-13-see-2`) la respuesta correcta **contiene el kana** que se pregunta.
- Los distractores son siempre «a de casa» / «i de vino».
- El alumno acierta buscando el carácter y no aprende nunca cómo suenan は, ふ, ら o を.
- Además, hay pistas engañosas para un hispanohablante:
  - じ/ぢ = «ji»: se leerá como jota.
  - ざ/ず = «za/zu»: se leerá con la s seseante.
  - Falta advertir que ら es r simple y que ふ no es una f española.
- **Corrección:**
  - Una pista real por kana: «は: "ja" muy suave; como partícula "wa"», «じ: "yi" firme, como la j inglesa de "jeep"; nunca la jota», «ら: r suave de "pero"», «にゃ: "ña"».
  - Distractores de la misma fila o vocal ya enseñados (な ↔ た, さ), sin ofrecer nunca homófonos (じ/ぢ, ず/づ, お/を).

### C2. Kana usados sin enseñarse
| Grafía | Primera aparición | Situación |
|---|---|---|
| ダ ヂ ヅ デ ド (katakana) | `first-words / jp-book1-words-03-teach-5` (カード), ドア, ページ… | `katakana-11` enseña ガ ザ バ パ, pero **no la fila D** |
| ッ pequeña (katakana) | `a1-2-social-01-01` (メッセージ), インターネット | nunca se enseña |
| ジャ ジュ ジョ | préstamos de A2 (ジュース, etc.) | `katakana-12` solo tiene キャ シャ チャ |
| ひゃ, りょ | `jp-book1-words-08-teach-3/-4` (ひゃくえん, むりょう) | `hiragana-13` solo enseña き/し/ち + ゃゅょ |
| にゃ, みゃ, ぎゃ, じゃ, びょ, ぴょ | 病院 (びょういん), 牛乳, じゃ… en A1 | sin tarjeta |
| おう / えい = vocal larga | がっこう, せんせい, とけい, ありがとう desde *first-words* | `hiragana-14` enseña ああ/いい/うう…, pero nunca que こう se lee «koo» ni que せい se lee «see» |

**Corrección:**
- `hiragana` 16–18:
  - にゃ にゅ にょ ひゃ ひょ みゃ りゃ りゅ りょ.
  - ぎゃ ぎゅ ぎょ じゃ じゅ じょ びょ ぴょ.
  - Vocal larga escrita con う/い, con がっこう, せんせい, とけい y きのう.
  - Un repaso, y 4 preguntas nuevas en la prueba.
- `katakana` 15: ダ ヂ ヅ デ ド, ッ y ジャ ジュ ジョ, con un repaso y 3 preguntas en la prueba.

### C3. Los repasos obligatorios tienen como respuesta frases de explicación
- Ubicación: `first-words / jp-book1-words-review-01…05` y `-checkpoint`, `basic-verbs / jp-book1-verbs-review-01…06` y `-checkpoint`, `adjectives / …-review-01…03` y `-checkpoint`, `functional-a1 / …-review-01…04` y `-checkpoint`.
- Ejemplos:
  - «Recuerda: ¿qué expresa おきます?» → respuesta «La palabra completa es おきます. Escúchala seguida.».
  - «¿qué expresa ページ?» → «ページ significa «página».».
  - «¿qué expresa はじめまして。?» → «Escuchaste はじめまして。: Mucho gusto..», junto a la opción «Mucho gusto.» (**dos respuestas correctas**).
- Además, las lecciones de patrón (`first-sentences`, `basic-verbs`, `adjectives`) usan el distractor «No corresponde a esta oración.». En *story-bridge* usan «No corresponde.», y su escucha ofrece una frase en español entre las opciones japonesas.
- **Corrección:** respuesta = traducción de la tarjeta enseñada. Distractores = traducciones de otras tarjetas de la misma unidad y del mismo tipo (palabra o frase), conservando la posición de la respuesta.

### C4. Gramática esencial sin explicar: partículas, forma de diccionario y forma て
- Las tarjetas `teach_pattern` de *first-sentences* solo tienen un título:
  - «A は B です» → «Identificar y presentarse».
  - «が・を» → «Sujeto y objeto».
  - «に・で・へ・と» → «Destino, lugar de acción y compañía».
- No dicen que は se lee «wa» y marca el tema, que を se lee «o», la diferencia de に/で/へ, ni こ/そ/あ.
- `jp-book1-sentence-07` y `-11` titulan con kanji aún no enseñados (上・中・近く・前, 何・誰).
- *basic-verbs* usa ～ています, ～てください, ～ないでください y ～てあります **sin enseñar nunca a formar la forma て ni la forma ない** (まって, よんで, いって, あけない…).
- A1 (`a1-1-routine-01-01`…) enseña los verbos en **forma de diccionario** (起きる, 働く, 飲む, 寝る), mientras que todo lo anterior estaba en ます. No hay ninguna nota sobre la relación entre ambas.
- **Corrección:**
  - `teaching_points` y `memory_hint` en las 11 tarjetas de patrón de *first-sentences* y en las de *basic-verbs* y *adjectives* (formación de ない, たい, ましょう; excepción いい → よくありません).
  - Títulos en kana.
  - Dos lecciones nuevas en *basic-verbs*:
    - `jp-book1-verb-form-00` «Forma de diccionario y forma ます», con いく, みる, かう, する y くる.
    - `jp-book1-verb-form-te` «Cómo se forma la forma て»: う・つ・る → って, む・ぶ・ぬ → んで, く → いて (いく → いって), ぐ → いで, す → して, ru-verbs → て, します/きます → して/きて.
  - `usage_note` en los seis verbos de diccionario de A1.

### C5. Kanji sin lectura en A1 y glosas de kanji erróneas
- A partir de A1, todas las tarjetas usan kanji no enseñados (母, 部屋, 台所, 午後に勉強します…), sin furigana.
- `src/japanese_course_app.js` solo muestra ayuda de lectura (`pinyinHTML`) para chino. El alumno de Assimil oye el audio, pero no puede asociarlo con la escritura.
- En *starter-kanji*, el kanji se glosa con el significado de la palabra completa:
  - 図 = «biblioteca» (es «dibujo, plano»).
  - 書 = «libro».
  - 時 = «reloj» (es «hora»).
  - 昨 = «ayer».
  - 明 = «mañana».
  - 未 = «futuro».
  - 無 = «gratis».
  - 緒 = «juntos».
  - 前 = «nombre/delante».
  - 来 se lee «くる / みらい» (en 未来 es らい).
- **Corrección:**
  - `sound_hint: "Lectura: …"` (kana) en las 159 tarjetas de A1 con kanji, porque es el campo que la app sí muestra.
  - Glosas por carácter, con la palabra como contexto: «dibujo, plano · en 図書館 (としょかん, biblioteca)».
  - A medio plazo: soporte de furigana en la app (ver §6).

### C6. Traducciones erróneas
| Ubicación | Actual | Corrección |
|---|---|---|
| `a1-1-identity-04-07` (+ repasos, prueba, `production-open`) | 言葉 = «idioma» | «palabra; lenguaje» (idioma = 言語 / ～語) |
| `a1-1-identity-04-15` | 日本語を少し話します = «Hablo un poco de este idioma.» | «Hablo un poco de japonés.» |
| `a1-1-routine-01-01` | 起きる = «despertarse» | «levantarse; despertarse» (la frase 03-13 dice «me levanto») |
| `a1-1-food-03-14` | ご飯を少しください = «Quiero un poco de arroz.» | «Deme un poco de arroz, por favor.» |
| `a1-2-time-04-15` | 遅れます = «Llego tarde.» | «Voy a llegar tarde.» |
| `a1-2-social-02-04` | 時間 = «hora» | «tiempo (libre); horas» (la hora del reloj es 時) |
| `a1-2-social-04-16` | «Envíame la dirección.» | «Envíeme la dirección, por favor.» (registro ください) |
| `a1-2-weather-02-12`, `-04-15` | «Lleva un paraguas.», «Hay diez grados.» | «Lleve un paraguas, por favor.», «Hace diez grados.» |
| `a1-2-health-03-14` | この薬を… = «Tome esto…» | «Tome esta medicina dos veces al día.» |
| `a2-1-ability-02-05` (+ `a2-2-workStudy`) | 許可 = «permitido»; 必要 = «necesitar»; やり方を知っている = «saber» | «permiso»; «necesidad»; «saber hacerlo» |
| `a2-1-ability-04-13` | «Aquí se puede tomar fotos.» | «Aquí se pueden tomar fotos.» |
| `a2-1-conversation-04-08` (+ opinions, emotions) | 分かりました = «entiendo» | «entendido; de acuerdo» |
| `a2-1-future-02-03` | 約束 = «promesa» | «promesa; cita» |
| `b1-1-cause-effect-04-14` (+ `b1-2-conditions`) | 疲れていましたが、仕事を終えました = «Aunque estaba cansada, terminó el trabajo.» | «Aunque estaba cansado, terminé el trabajo.» |
| `b1-2-conversation-04-16` | 例を使って結論を説明していただけますか = «¿Puedes explicarlo con un ejemplo?» | «¿Podría explicar la conclusión con un ejemplo?» |
| `story-bridge` (6 modelos) | Las «traducciones» son resúmenes («Pregunta por una llave y recibe una indicación.») | Traducción real: «¿Dónde está la llave? Mire dentro de la caja, por favor.» |

### C7. Producción: se rechazan respuestas correctas
- Todas las producciones de A1 aceptan una sola grafía, con kanji que el alumno no ha estudiado. Se rechaza, por ejemplo:
  - «おなまえはなんですか。»
  - «7時に起きます。»
  - «ごごにべんきょうします» en un **dictado**, aunque el audio no puede indicar qué kanji usar.
- En fundamentos, «いそぎます» no admite 急ぎます, ni «いち» admite 一 o 1.
- `japanese-first-words-production-complete` muestra solo «＿» (respuesta に): no se puede resolver.
- `a1-2-health`: el alumno debe **decir** la frase del médico «この薬を一日二回飲んでください。» (speak y diálogo).
- `minimum_correct` = número de turnos en los 7 diálogos de 3 turnos (`a1-1-places`, `a1-2-social`, `story-bridge`, `a2-1-conversation`, `a2-2-problemSolving`, `b1-1-register`, `b1-2-conversation`).
- **Corrección:**
  - `accepted_answers` con la lectura completa en kana, cifras (7時, 8時, 6時) y variantes naturales (おいくつですか, 誰ですか/どなたですか, メキシコ人です, 名前は何ですか).
  - Kanji en las respuestas de fundamentos.
  - Completar la serie «いち、＿、さん».
  - En salud, el alumno dice «頭が痛いです。».
  - `minimum_correct = n-1`.

---

## 2. IMPORTANTE

- **I1. Diálogos «Situación N».** Los 40 `guided_dialogue`/`stage_scenario` no tienen interlocutor en japonés: el «modelo» solo dice «Situación 1». Es el mismo defecto que el I9 del coreano. Hay que escribir turnos reales (p. ej. en compras: «いらっしゃいませ。» → alumno «これはいくらですか。» → «千円です。» → alumno «カードで払えますか。»).
- **I2. A2–B1 reciclan media unidad.** 18 de las 24 unidades presentan como nuevos 7–8 ítems ya enseñados. Las cadenas son:
  - past → experiences → narrative → perspectives
  - services → technology/problemSolving → register → negotiation
  - comparison → culture/society → projects
  - conversation → opinions/emotions → b1-2-conversation
  - **Corrección:** convertir esos ítems en repaso y añadir 8 nuevos por unidad (como el C8 del coreano).
- **I3. `b1-1-register` no enseña registro.**
  - Contenido actual: keigo en frases sueltas (いただけますか, いたします). No hay ninguna tarjeta sobre forma simple (だ/る), です/ます y 敬語, y la forma simple no se practica en ninguna parte del curso.
  - Problema: al leer historias o manga, el alumno no reconocerá 行く, 食べた ni 行かない.
  - **Corrección:** tarjeta de registro y pares 行きます / 行く / いらっしゃいます.
- **I4. Gramática de A1 usada sin nota.** Aparecen sin explicación:
  - Potencial: 払えますか, 行けません.
  - ～すぎます.
  - ～てもいいですか.
  - ～ませんか.
  - ～しか…ません.
  - ～以降.
  - ～になりました (よくなりました).
  - **Corrección:** `usage_note` de una línea en cada caso.
- **I5. Homónimos y pares sin nota.** Los casos son:
  - 高い = «caro» (A1-2) y «alto» (A2-1).
  - 明日 = あした/あす.
  - 今日 = きょう; 日 = ひ/にち/び.
  - 彼 = «él» y también «novio».
  - Las palabras en kana de fundamentos reaparecen con kanji en A1 sin conexión (なまえ ↔ 名前, かぎ ↔ 鍵, みせ ↔ 店…). Conviene decirlo en la tarjeta de A1: «Ya conoces なまえ: así se escribe con kanji».
- **I6. Repasos y pruebas de A1–B1 memorizables.** Igual que en coreano, son copias de la lección con las mismas opciones y el mismo orden.
- **I7. Tú/usted alternados.** Se mezclan «¿Cómo te llamas?» (お名前は何ですか, que es cortés), «Mira dentro de la caja, por favor.» (てください) y «Lleve…». Conviene unificar en usted para です/ます con desconocidos.

- **I8. *functional-a1* y *first-sentences* enseñan casi sin tarjetas.**
  - *functional-a1* (7 lecciones) no tiene ninguna actividad `teach_*`. Cada frase se presenta solo como `dialogue_model` (frase + traducción en `explanation`), sin `meaning`, `teaching_points` ni `usage_note`. Por ejemplo, はじめまして。, よろしくおねがいします。 y すみません no explican cuándo se usan ni su nivel de cortesía.
  - *first-sentences* tiene una sola `teach_pattern` por lección, seguida de 2–3 `dialogue_model`. La regla ya está explicada (C4), pero el alumno ve un único patrón y lo practica con 2–3 frases.
  - **Corrección:**
    - En *functional-a1*, añadir `usage_note` a cada `dialogue_model` (p. ej. «すみません: perdón / disculpe para llamar la atención; también "gracias" cuando alguien se molesta por ti»).
    - En *first-sentences*, añadir 2–3 frases más por patrón, con verbos o sustantivos distintos.
    - Si se generan historias desde estas unidades, tomar como «enseñado» el `target` de los `dialogue_model`, porque no hay tarjetas `teach_*`.

---

## 3. MENOR

- `jp-hira-family-1-hear-2` y `jp-kata-family-1-hear-2` ofrecen う/ウ como distractor una actividad antes de su tarjeta.
- Bloques triviales de 2 piezas:
  - `japanese-rhythm-production-blocks` (ほ/ん).
  - `japanese-first-words-production-blocks` (い/ち).
- `jp-book1-words-10-teach-4…6`: «un ejemplar encuadernado» → «un libro (contador 冊)».
- こんばんは = «buenas noches»: válido en México como saludo, pero conviene añadir «al llegar; para despedirse: おやすみなさい».
- `a2-1-comparison`: もっといい / もっと悪い como lemas de «mejor / peor» son poco naturales (より良い / もっと悪い en contexto). «その部屋のほうが安いです» = «Esa habitación es más barata».
- `a1-2-transport-02-12`: 停留所 se lee ていりゅうじょ; en la conversación es más común バス停.
- *story-bridge*: la consigna «Escucha la diferencia:» no tenía sentido (no hay contraste) → «Escucha y comprende:».

---

## 4. Audio

- Antes de la reparación, todas las claves `audio`/`slow_audio` existían en el manifiesto (997 entradas).
- El contenido nuevo usa **32 claves sin grabación**:
  - Combinaciones de kana: にゃ にゅ にょ ひゃ ひょ みゃ りゃ りゅ りょ ぎゃ ぎゅ ぎょ じゃ じゅ じょ びょ ぴょ, ダ ヂ ヅ デ ド, ジャ ジュ ジョ.
  - Verbos: する, まって, よんで, かいて, いそいで, いって, みて.
- ッ usa メッセージ, y las palabras de vocal larga usan claves ya grabadas (がっこう, せんせい, とけい, きのう, こう, せい).
- Hasta generarlas, `tests/guided_content_audit.test.mjs` falla con `missing_audio_manifest_entry`.

## 5. Unidades huérfanas

- Hay 6 archivos en `units/` que no referencia `course.json`. Son las mismas plantillas antiguas que en coreano:
  - `a1-1-introductions`
  - `a1-2-daily-life`
  - `a2-1-plans-and-time`
  - `a2-2-description-and-comparison`
  - `b1-1-narration-and-reasons`
  - `b1-2-independent-reading`
- Conviene archivarlos fuera de `units/`.
- No faltan manifiestos referenciados y no hay ids duplicados.

## 6. Código compartido (no modificado)

- `src/japanese_course_app.js` → `pinyinHTML()` devuelve `''` si el idioma no es chino. El japonés no tiene ningún mecanismo de furigana ni de lectura en las preguntas (solo el `sound_hint` de las tarjetas). Se recomienda reutilizar ese bloque con un campo `reading` para japonés.
- `src/guided_course_answers.js` no trata como equivalentes el kanji y su lectura en kana. Se compensó con `accepted_answers`, pero una normalización por lectura (o al menos aceptar la respuesta en kana cuando el ítem tiene `reading`) evitaría tener que mantener listas.

---

## Estado de las correcciones (27 de octubre de 2026)

Aplicadas con `node scripts/repair_japanese_audit_2026_10.mjs` (idempotente: la segunda ejecución informa `changed: []`) y protegidas por `tests/japanese_audit_repairs.test.mjs`.

| Punto | Estado | Qué se hizo |
|---|---|---|
| C1 | Corregido | Pista de sonido real para todos los kana de hiragana y katakana. Los 350+ `kana_to_audio` se regeneraron con distractores de la misma fila o vocal ya enseñados, sin homófonos; la respuesta nunca contiene el kana. |
| C2 | Corregido | `hiragana` 16–18 (yōon restantes, おう/えい con palabras reales) + repaso 18 + 4 preguntas en la prueba. `katakana` 15 (fila D, ッ, ジャ ジュ ジョ) + repaso 15 + 3 preguntas en la prueba. |
| C3 | Corregido | Todos los «Recuerda…» y las preguntas de patrón de first-words, first-sentences, basic-verbs, adjectives, functional-a1 y story-bridge piden la traducción real. Desaparecen los distractores de relleno y la frase en español de las escuchas del puente. |
| C4 | Corregido | Explicación de partículas y patrones (`teaching_points`, `memory_hint`). Títulos en kana. Lecciones `jp-book1-verb-form-00` (diccionario ↔ ます) y `jp-book1-verb-form-te` (forma て). Notas de forma ない, たい y ましょう. `usage_note` en los verbos de diccionario de A1. |
| C5 | Parcial | Lectura en kana en las 159 tarjetas A1 con kanji y 13 glosas de *starter-kanji* corregidas. Falta furigana en preguntas y en A2–B1 (requiere cambio en `src/`). |
| C6 | Corregido | Todas las traducciones de la tabla, también en repasos y pruebas. |
| C7 | Corregido | Variantes en kana, cifras y formas naturales en la producción de fundamentos y A1. Serie «いち、＿、さん». El paciente dice «頭が痛いです。». `minimum_correct = n-1` en los 7 diálogos de 3 turnos. |
| I1 | Pendiente | Diálogos con interlocutor real. |
| I2 | Pendiente | Reescritura de A2–B1. |
| I3 | Pendiente | Lección de registro (forma simple / です・ます / keigo). |
| I4–I7 | Pendiente | Notas de uso, homónimos, barajado de repasos, tú/usted. |
| I8 | Pendiente | Notas de uso en los `dialogue_model` de *functional-a1* y más ejemplos por patrón en *first-sentences*. |

**Audio:** 32 claves nuevas sin grabación (lista en §4). Se generarán con TTS de macOS; hasta entonces la app usa la voz del dispositivo.
