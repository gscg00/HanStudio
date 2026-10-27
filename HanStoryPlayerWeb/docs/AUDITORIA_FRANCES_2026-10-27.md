# Auditoría del curso de francés (HanStoryPlayerWeb) — perspectiva de alumno hispanohablante desde cero

Fecha: 2026-10-27 · Alcance: `library/courses/French` (course.json, 45 unidades activas, 450 lecciones, 7.344 actividades antes de las correcciones).

**Método.**
- Recorrí todas las actividades con scripts `python3 -I`: estructura, opciones, respuestas, homófonos en escuchas, solapamiento entre unidades, registro tú/usted, producción y diálogos.
- Leí línea a línea todo *foundations* (A0: reading-foundations, reading, survival, essentials, questions, time, vocabulary, reading-bridge, story-bridge) y todo A1-1 y A1-2.
- Muestreé A2-1 … B1-2: todas las tarjetas de enseñanza y toda la producción de cada unidad.

**Nota sobre la severidad.** Como en coreano, los repasos (`review-*`) y las pruebas (`test-*`) copian literalmente los ítems de la lección. Toda corrección de texto se aplicó a la unidad completa (lección, repaso y prueba).

---

## 0. Resumen en cifras

| Métrica | Valor |
|---|---|
| Unidades en `levels` / archivos en `units/` | 45 / 51 (6 huérfanos) |
| Actividades | 7.344 (1.406 teach_concept, 2.603 select_translation, 2.628 listening_choice) |
| Producción en foundations | **4 actividades** (todas en `reading-foundations-production-checkpoint`; dos de ellas son el mismo dictado «phi») |
| Ítems nuevos por lección | foundations 5 (10 en *vocabulary*); A1–B1 exactamente 4 (plantilla fija) |
| Ítems enseñados que no reaparecen en ninguna unidad posterior | 746 de 1.034 (72 %) |
| Unidades duplicadas | *time* = 57/57 ítems de *survival*; *questions* = 7/9 de *essentials*; en A2–B1 cada unidad hereda 8/16 ítems de otra |
| Escuchas imposibles (homófonos) | 1 (`essentials-test-12-5-listen`: où / ou) |
| Posición de la respuesta (3 opciones) | 1.ª 39 %, 2.ª 33 %, 3.ª 28 % |
| Conjugación enseñada en A0 | ninguna (solo infinitivos: être, avoir, aller…) |

---

## 1. CRÍTICO — bloquea el aprendizaje o enseña algo incorrecto

### C1. No se enseñan las reglas de lectura que un hispanohablante necesita
- `reading-foundations` cubre el alfabeto, é/è, u/ou, ca/ce/ga/ge, ch/ph/gn y an/on/un. Faltan por completo: **oi** [ua], **eau/au** [o], **ai/ei** [è], **eu** [ö], **e final muda**, **in/ain**, la regla de **vocal + n + vocal ya no es nasal** (bon/bonne), **consonantes finales mudas** (petit, grand, trop), **-ent mudo** de los verbos (ils parlent), **-er/-ez = é**, **h muda**, **s entre vocales = z**, **ç**, **ille**, **qu**, **liaison**, **elisión** y **encadenamiento**.
- El alumno lee «moi» como [moi], «ils parlent» como [ils parlent] y «les amis» palabra por palabra, y luego no reconoce el audio.
- La unidad `reading` (01–06) solo repite los nombres de las letras que ya enseñó `reading-foundations` 00-01 … 00-06.
- Las pocas reglas existentes aparecen tarde y fuera de lugar: tarjetas de nasales tras los números (`survival-12-3/4/5`, duplicadas en `essentials-06-5`, `-07-1/2`) y liaison/letras mudas en `essentials-08`.
- **Corrección:** cinco lecciones en `reading` antes de la prueba, con palabra + transcripción aproximada + audio: vocales de varias letras, nasales, letras mudas, consonantes que engañan y palabras que se unen.

### C2. «J» y «G» descritas como «ye» / «yi»: pronunciación errónea para un mexicano
- `reading-02-2` «G: ye», `reading-02-5` «J: yi francesa»; `essentials-08-5` «Idea clave: ye parl fransé»; `essentials-09-1` «ye ne se pa».
- Para un hispanohablante de México «ye» es [ʝ]; el francés es [ʒ] («zh», la «ll» rioplatense). Se fija una mala pronunciación desde la primera palabra (je).
- **Corrección:** «zhe (como la «ll» rioplatense, nunca «ye»)» y tarjeta específica en la lección de consonantes.

### C3. Foundations no enseña a conjugar
- `essentials` enseña los pronombres y luego los verbos en infinitivo (être, avoir, aller, venir, vouloir, pouvoir, faire). No hay ni una forma conjugada enseñada: je suis, j’ai, je parle aparecen en ejemplos de *vocabulary* sin regla.
- En *vocabulary-44…50* aparecen sueltos «suis», «es», «as», «a», «parle», «apprends» como palabras independientes, sin paradigma.
- **Corrección:** cuatro lecciones en `essentials`: être, avoir, verbos en -er (con la nota de que je parle / tu parles / il parle / ils parlent suenan igual), y ne… pas + pas de + un/une/des, con producción (bloques y escritura).

### C4. La unidad *time* duplica *survival*; *questions* duplica *essentials*
- `time` (16 lecciones, 231 actividades) enseña los mismos 57 ítems que `survival`, en el mismo orden. El título «Números, tiempo y vida diaria» promete contenido que no tiene.
- `questions` comparte 7 de 9 ítems con `essentials-03/04/05`.
- Faltan por completo en A0 los números 21–100 (el gran escollo del francés: soixante-dix, quatre-vingts, quatre-vingt-dix), la hora con quart/demie/moins le quart, las fechas (le premier mai) y los precios.
- **Corrección:** reescribir `time` con esos cinco bloques.

### C5. Francés agramatical o traducciones que enseñan lo contrario
| Ubicación | Actual | Corrección |
|---|---|---|
| `a1-1-people-01-10`, `-02-11` (+ repasos y prueba) | «Il est mon ami.», «Elle est ma sœur.» | «C’est mon ami.», «C’est ma sœur.» + nota C’est / Il est |
| `reading-bridge-08-1` | «Oui, je veux bien parler français.» = «Sí, quiero hablar bien francés.» | «Sí, con gusto hablo francés.» (je veux bien = con gusto). Contradice `vocabulary-50` |
| `vocabulary-04` (tête), `-05` (dos) | «Ma tête fait mal.», «Mon dos fait mal.» | «J’ai mal à la tête.», «J’ai mal au dos.» |
| `a2-2-opinions`, `b1-1-cause-effect` | «Je n’aime pas, même si c’est utile.» (falta complemento) | «Je n’aime pas ça, même si c’est utile.» |
| `b1-2-negotiation` | «On peut céder sur le prix, pas la qualité.» | «…, mais pas sur la qualité.» |
| `b1-2-nuance` | «Dans l’ensemble…» = «Hasta cierto punto…» | «En general, el resultado fue positivo.» |
| `a1-1-identity-04-15` | «Hablo un poco de este idioma.» | «Hablo un poco de francés.» |
| `vocabulary-14` | «Je prends un ticket. — Cojo un billete.» («coger» es vulgar en México) | «Tomo un boleto.» |

### C6. Escucha imposible: homófonos
- `essentials-test-12-5-listen`: audio «où» con opciones «où», «ou», «maintenant». «où» y «ou» suenan igual.
- **Corrección:** sustituir «ou» por otra opción enseñada («quand»).

### C7. Producción: casi imposible acertar con variantes correctas
- Todas las respuestas libres tienen **una sola** respuesta aceptada.
- `src/guided_course_answers.js` no normaliza los **guiones**: «Comment vous appelez vous ?» (sin guion, lo más habitual al teclear en el móvil) se rechaza.
- Rechazos típicos: «Vous vous appelez comment ?», «Quel est votre nom ?», «C’est qui ?», «Je me lève à 7h.», «Est-ce que je peux payer par carte ?», «Je dois changer ?», «Où est-ce qu’on se retrouve ?».
- `minimum_correct` = número de turnos en todos los diálogos (2/2 y 3/3).
- **Corrección:** ampliar `accepted_answers` (anexo A), añadir automáticamente la variante sin guiones y poner `minimum_correct = n-1` en diálogos de 3 turnos.

### C8. A2–B1: la mitad de cada unidad es contenido heredado
- Igual que en coreano: 8 de los 16 ítems de cada unidad de A2-2 a B1-2 son copias de otra unidad, presentadas otra vez con teach_concept. Cadenas: past → experiences → narrative → perspectives; services → technology / problemSolving → register → negotiation; comparison → culture → society → projects; conversation → opinions → emotions → b1-2-conversation; ability → workStudy; cause-effect → conditions; media → nuance.
- `b1-1-society` y `b1-1-emotions` enseñan como B1 palabras sueltas de A2-1 (plus, moins, pareil, vraiment, alors…).
- **Corrección:** convertir los 8 ítems heredados en repaso y añadir 8 nuevos por unidad.

---

## 2. IMPORTANTE

### I1. Registro tú/usted incoherente en las glosas
| Ubicación | Actual | Corrección |
|---|---|---|
| `a1-1-people-03-14` (+ producción) | «Quel âge avez-vous ?» = «¿Cuántos años tienes?» | «¿Cuántos años tiene usted?» (reading-bridge ya dice «¿Qué edad tiene?») |
| `a1-2-weather-02-12` | «Prenez un parapluie.» = «Lleva un paraguas.» | «Lleve un paraguas.» |
| `a2-1-ability` | «Vous devez montrer votre passeport.» = «Debes mostrar tu pasaporte.» | «Debe mostrar su pasaporte.» |
| `vocabulary-01` | vous = «vosotros / usted» (essentials dice «usted / ustedes») | «usted / ustedes» |

### I2. Glosas españolas que no corresponden a la frase francesa (B1-2)
La frase francesa se acortó al generarla, pero la glosa española se quedó larga o cambió de sentido:
- `b1-2-conditions`: «Si nous partons maintenant, nous arriverons tôt.» = «…antes de que oscurezca» → «…llegaremos temprano»; «Si j’avais le temps» = «Si tuviera más tiempo» → «Si tuviera tiempo»; «Si tu as besoin d’aide» = «En caso de que necesites ayuda» → «Si necesitas ayuda».
- `b1-2-nuance`: «Bonne idée, mais peut-être trop chère.» = «La idea parece buena; sin embargo, puede ser costosa.»; «Cela ne veut pas dire…» = «No necesariamente significa…»; «Cela devrait marcher si tous participent.» = «Probablemente funcione, siempre que…»; «Ces expressions diffèrent légèrement.»; «Cette information est-elle fiable ?» = «¿Qué tan segura…?»; «Je comprends ton avis, mais je ne suis pas d’accord.» = «…aunque lo veo de otra manera».
- `b1-2-negotiation`: «Essayons d’abord…» = «Propongo que probemos…»; «Aceptaría si cambiamos» (español agramatical) → «si cambiáramos»; «…no me convence del todo»; «…¿quedamos de acuerdo en este plan?».
- `b1-2-projects`: «Quelle est la priorité ?» = «Tenemos que decidir qué es prioritario.»; «Prévoyons les risques» = «Conviene prever…»; «Nous ferons le point ce week-end.» = «Revisaremos los avances al final de la semana» (fin de semana ≠ final de la semana).
- `b1-2-perspectives`, `b1-2-conversation`: cuatro y tres glosas del mismo tipo.
- `b1-1-media` / `b1-2-nuance`: «Le personnage principal…» = «La protagonista…».
- `a2-1-ability`: «Aquí se puede tomar fotos» → «se pueden».

### I3. Glosas de vocabulario engañosas
- `beau` = «buen tiempo» (beau es «bonito»; «il fait beau» = hace buen tiempo).
- `pour` = «por» (sobre todo «para»).
- `vers` = «aproximadamente» (es «hacia»; con horas, «a eso de»). Además `environ` tiene la misma glosa.
- `le nom` = «el apellido / nombre» con una nota que dice lo contrario.
- `personne` = «persona» sin advertir que «ne… personne» = «nadie» (survival-10-3, vocabulary-02, a1-1-identity-04-08).
- `a1-1-food-03-14`: «Je voudrais du riz.» = «Quiero un poco de arroz.» → «Quisiera arroz.»
- `a1-1-home-02-12`: «Ce n’est pas ici.» = «No está aquí.» → «No es aquí.»
- `a1-2-social-04-15`: «Je peux venir avec un ami ?» = «¿Puedo traer a un amigo?» → «¿Puedo ir con un amigo?»
- Españolismos que chocan con el resto del curso (que usa «jugo», «tomar»): zumo, coger, ordenador, jersey, deberes, coche.

### I4. Gramática usada antes de enseñarse
Sin nota de uso: pronombres reflexivos (`a1-1-routine` «Je me lève»), partitivo du/de la (`a1-1-food`), futuro próximo «Il va pleuvoir» (`a1-2-weather`), futuro simple «fera-t-il» (`a1-2-weather-04-16`), inversión «Dois-je», «va-t-il» (`a1-2-transport`), passé composé con être/avoir (`a2-1-past`), «ne… que» (`a1-2-shopping-03-14`), «on» = nosotros (`a1-2-social`, `a1-2-time`). Proponer una `usage_note` de una línea en cada caso (anexo B).

### I5. Tarjetas duplicadas o fragmentadas
- `a1-1-identity-01-01` y `-01-02`: «bonjour» enseñado dos veces con glosas distintas (hola / buenos días).
- `vocabulary-44…50`: fragmentos sin sentido propio («J’», «La», «Mon», «Quel âge», «m’appelle», «es», «a») presentados como palabras; muchas fichas de L31–50 no tienen ejemplo.
- Los diálogos guiados de A1–B1 solo dicen «Situación N» (no hay intervención del interlocutor en francés), igual que en coreano.

### I6. Producción poco realista
- `a1-2-health`: el alumno debe decir «Prenez ceci deux fois par jour», frase del médico; mejor «J’ai mal à la gorge.»

---

## 3. MENOR
- `reading-foundations` checkpoint: dos dictados idénticos de «phi»; `00-08` usa «ê» como distractor sin enseñarlo.
- `essentials-09-2` (le / la / les): la tarjeta y su escucha no tienen `audio` propio (solo `audio_examples` por TTS).
- `survival-10-2` «ça là-bas» = «aquello»: poco natural; mejor «celui-là» o «là-bas».
- `ceci` / `cela` como «esto / eso»: en la lengua hablada se usa «ça»; añadir nota.
- `le soir` = «por la noche» (más bien «la tarde-noche»); `chaud` = «caluroso».
- Distractores de otra categoría (frase frente a palabra) y repasos con las mismas opciones en el mismo orden: se adivinan por forma.
- Sesgo de posición: la respuesta es la 1.ª opción el 39 % de las veces.

---

## 4. Audio
- Antes de las correcciones todas las claves `audio`/`slow_audio` existían en `audio_manifest.json`.
- Las correcciones añaden **64 claves nuevas** (≈ 860 caracteres) sin grabación: palabras de las lecciones de lectura (été, bon, vin, bonne, avec, ils mangent, parlez, chat, les enfants, deux heures, Il est ici.), las conjugaciones de être/avoir/parler, la negación y los artículos, todo el nuevo contenido de `time`, y las frases corregidas «C’est mon ami.», «C’est ma sœur.», «Je n’aime pas ça, même si c’est utile.», «On peut céder sur le prix, mais pas sur la qualité.».
- Hasta generarlas, la app usa la voz del dispositivo y `tests/guided_content_audit.test.mjs` falla con `missing_audio_manifest_entry`.

---

## 5. Unidades huérfanas y referencias
- `course.json` → `levels[].unitIds` y `units[]` coinciden (45/45) y todos los `manifest` existen.
- Seis archivos en `units/` no los referencia `course.json` (versiones antiguas de 7 lecciones): `a1-1-introductions`, `a1-2-daily-life`, `a2-1-plans-and-time`, `a2-2-description-and-comparison`, `b1-1-narration-and-reasons`, `b1-2-independent-reading`. **Corrección:** archivarlos fuera de `units/`. No se tocaron.

---

## 6. Recomendaciones pedagógicas (Assimil + Rosetta Stone, ~40 min/día)
1. **Leer antes de memorizar.** Para un hispanohablante el francés escrito engaña más que el oral: las lecciones de lectura nuevas deben repasarse con frecuencia (repaso espaciado de 2–3 tarjetas por lección de A1).
2. **Diálogo primero.** Abrir cada unidad de A1 con un diálogo modelo con audio y sustituir los «Situación N» por turnos reales del interlocutor.
3. **Conjugación en espiral.** Tras être/avoir/-er, introducir aller, faire, vouloir y pouvoir conjugados en A1-1 (hoy solo aparecen en infinitivo).
4. **Imágenes.** Los sustantivos concretos de *vocabulary* (ropa, comida, casa, cuerpo) son ideales para «escucha y elige la imagen».
5. **Densidad.** *vocabulary* tiene 67 lecciones seguidas en A0; conviene partirlo y alternarlo con *survival*/*essentials*.

---

## Anexo A — accepted_answers añadidos (A1)
- «Comment vous appelez-vous ?» + «Vous vous appelez comment ?», «Quel est votre nom ?»
- «Je viens du Mexique.» + «Je suis du Mexique.», «Je suis mexicain.», «Je suis mexicaine.»
- «Qui est-ce ?» + «C’est qui ?», «Qui c’est ?»
- «Quel âge avez-vous ?» + «Vous avez quel âge ?»
- «Je me lève à sept heures.» + «… à 7 heures.», «… à 7h.», «… à 7 h.»
- «Je bois du thé le matin.» + «Le matin, je bois du thé.», «Je bois du thé tous les matins.»
- «Je voudrais du riz.» + «Je veux du riz.», «Je voudrais un peu de riz.»
- «Je peux payer par carte ?» + «Est-ce que je peux payer par carte ?», «Puis-je payer par carte ?», «Je peux payer avec une/la carte ?»
- «Je n’ai que des espèces.» + «J’ai seulement des espèces.», «Je n’ai que du liquide.»
- «J’arrive à huit heures.» + «… à 8 heures.», «… à 8h.», «… à 8 h.»
- «Dois-je changer ?» + «Je dois changer ?», «Est-ce que je dois changer ?», «Il faut changer ?»
- «Le train est en retard.» + «Le train a du retard.»
- «Je suis allergique à la pénicilline.» + «J’ai une allergie à la pénicilline.»
- «J’ai besoin d’un manteau.» + «Il me faut un manteau.»
- «Le temps change vite.» + «Le temps change rapidement.», «La météo change vite.»
- «On se retrouve où ?» + «Où est-ce qu’on se retrouve ?», «Où on se retrouve ?», «On se voit où ?»
- «Je suis libre après six heures.» + «… après 6 heures.», «… après 18 heures.», «… après 18h.»
- En A1–B1, toda respuesta libre con guiones acepta también la versión sin guiones.

## Anexo B — usage_note propuestas
| Estructura | Nota |
|---|---|
| C’est / Il est | «C’est + mon/un… (C’est mon ami); Il est + adjetivo o profesión (Il est médecin).» |
| Reflexivos | «se lever → je me lève, tu te lèves: el pronombre va antes del verbo.» |
| Partitivo | «du / de la / de l’ = algo de: du pain, de la viande, de l’eau; tras negación, de: pas de pain.» |
| Futuro próximo | «aller + infinitivo: Il va pleuvoir = Va a llover.» |
| Passé composé | «avoir/être + participio: J’ai mangé, Je suis allé(e).» |
| ne… que | «solamente: Je n’ai que des espèces = Solo tengo efectivo.» |
| on | «on = nosotros en la lengua hablada (verbo en 3.ª persona): On se retrouve où ?» |
| Inversión | «Dois-je… ? = Je dois… ? = Est-ce que je dois… ? (más formal → más coloquial).» |

---

## Estado de las correcciones (27 de octubre de 2026)

Aplicadas con `node scripts/repair_french_audit_2026_10.mjs` (idempotente: la segunda ejecución no cambia nada) y protegidas por `tests/french_audit_repairs.test.mjs`.

| Punto | Estado | Qué se hizo |
|---|---|---|
| C1 | Corregido | `reading` 07–11: vocales de varias letras (oi, eau, ai, eu, ou, u, é, e muda), nasales (an/en, on, in, bon/bonne), letras mudas (finales, -ent, -er/-ez, h), consonantes (j, g, ch, s=z, ç, ille, qu, r) y liaison/elisión/encadenamiento. La prueba de `reading` incluye 10 preguntas nuevas. |
| C2 | Corregido | «ye»/«yi francesa» → «zhe»/«zhi» con referencia a la «ll» rioplatense; pistas de essentials corregidas. |
| C3 | Corregido | `essentials` 10–13: être, avoir, verbos en -er, ne… pas / pas de y un/une/des, con bloques y escritura; 8 preguntas nuevas en la prueba. |
| C4 | Corregido (`time`) | `time` reescrita: 21–60, 70–100, la hora, fechas y precios; título y descripción actualizados en course.json. `questions` sigue duplicando parte de `essentials`. |
| C5 | Corregido | C’est mon ami / C’est ma sœur (+ nota), je veux bien, J’ai mal à…, Je n’aime pas ça, mais pas sur la qualité, Dans l’ensemble, «este idioma», «Cojo». |
| C6 | Corregido | La escucha où/ou usa «quand» como distractor. |
| C7 | Parcial | Variantes del anexo A, variante sin guiones en toda respuesta libre de A1–B1 y `minimum_correct = n-1` en los 6 diálogos de 3 turnos. Sigue pendiente en `src/` normalizar los guiones y la tolerancia a erratas (ver abajo). |
| C8 | Pendiente | Reescritura de A2–B1. |
| I1 | Corregido | Registro usted en a1-1-people, a1-2-weather y a2-1-ability; vous = «usted / ustedes». |
| I2 | Corregido | 25 glosas de B1-2 (y a2-1-ability, b1-1-media) alineadas con la frase francesa. |
| I3 | Corregido (parcial) | beau, pour, vers, le nom, personne (nota «nadie»), Je voudrais du riz, Ce n’est pas ici, Je peux venir avec un ami, zumo → jugo. Quedan españolismos menores (ordenador, jersey, deberes). |
| I4–I6 | Pendiente | Notas gramaticales, tarjetas fragmentadas de vocabulary 44–50, diálogos «Situación N», frase del médico en health. |

**Código compartido (no modificado):** `src/guided_course_answers.js` no trata el guion como separador, de modo que «appelez vous» ≠ «appelez-vous»; se compensó en los datos. La tolerancia a erratas sigue limitada a `answer_policy:"spelling_tolerant"`.

**Fuentes de autoría:** los textos corregidos de A1–B1 proceden de `course-authoring/*_content.mjs`; si se regeneran los cursos desde esas fuentes, hay que volver a ejecutar el script de reparación.

**Audio:** 64 claves nuevas sin grabación (lista en el apartado 4). Hasta generarlas, la app usa la voz del dispositivo.
