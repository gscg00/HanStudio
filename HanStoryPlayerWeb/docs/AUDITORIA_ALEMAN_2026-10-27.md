# Auditoría del curso de alemán (HanStoryPlayerWeb) — perspectiva de alumno hispanohablante desde cero

Fecha: 2026-10-27 · Alcance: `library/courses/German` (course.json, 45 unidades activas, 448 lecciones, 7.335 actividades antes de las correcciones).

**Método.**
- Recorrí todas las actividades con scripts `python3 -I`. Comprobé estructura, opciones, respuestas, audio, solapamiento entre unidades, glosas compartidas, registro du/Sie y posición de la respuesta.
- Leí línea a línea todo *foundations* (reading-foundations, reading, survival, essentials, questions, time, las 500 fichas de vocabulary y los dos puentes) y todo A1-1 y A1-2.
- Muestreé A2-1 … B1-2: leí las 16 fichas de cada unidad, su producción y sus diálogos, y escaneé el resto.

**Nota sobre la severidad.** Igual que en coreano, los repasos (`review-*`) y las pruebas (`test-*`) copian literalmente los ítems de la lección. Las correcciones de texto se aplicaron a todas las copias.

---

## 0. Resumen en cifras

| Métrica | Valor |
|---|---|
| Unidades en `levels` / archivos en `units/` | 45 / 51 (6 huérfanos) |
| Actividades | 7.335 (1.404 teach_concept, 2.595 select_translation, 2.631 listening_choice) |
| Producción en foundations | 4 actividades (todas en `reading-foundations-production-checkpoint`) |
| Ítems nuevos por lección | foundations 5 (10 en *vocabulary*); A1–B1 exactamente 4 |
| Unidades duplicadas | *time* = 57/57 ítems de *survival*; *questions* = 9/9 ya vistos (7 en *essentials*); en A2-2–B1-2 cada unidad hereda 8/16 ítems de otra |
| Conjugación enseñada en A0 | ninguna: los verbos solo aparecen en infinitivo (sein, haben, gehen…) |
| Sonidos del alemán enseñados en A0 | solo como nombre de letra; faltaban z = ts, w = v, v = f, s sonora, ei/ie/eu, h muda, vocal larga/corta, -er final, ich/ach |
| Claves de audio ausentes del manifiesto | 0 antes; 40 nuevas tras las correcciones |
| Posición de la respuesta (3 opciones) | 1.ª 38 %, 2.ª 33 %, 3.ª 29 % |
| Duración estimada | unas 27–35 h; muy por debajo de un B1 real |

---

## 1. CRÍTICO — bloquea el aprendizaje o enseña algo incorrecto

### C1. «Sonidos y lectura» enseña nombres de letras como si fueran sonidos
- `reading / german-reading-01 … 06`: cada ficha pregunta «¿Cómo se pronuncia «B»?» y la respuesta es el **nombre** de la letra: «be», «de», «gue», «ka», «te», «ve», «tset», «iks», «üpsilon». Contradice la regla de `reading-foundations-00-07` («el nombre de una letra no es su sonido»).
- Datos engañosos:
  - `german-reading-06-5` «ß: s larga». `reading-foundations-00-06-e` dice lo contrario («No significa que debas alargar la consonante»). También en `survival-12`/`essentials-07-2` («Cómo suena: s larga»).
  - W = «ve»: para un hispanohablante «ve» es /b/; la W alemana es una v labiodental.
  - Z = «tset»: el sonido es «ts» (Zug, zehn, zwei), nunca la z española.
- Faltan por completo los sonidos que un hispanohablante lee mal: z = ts, w = v, v = f, j = y, s + vocal sonora, st/sp = sht/shp, ei = ai, ie = i larga, eu/äu = oi, h muda tras vocal, vocal larga (Tee, Sohn) frente a corta (Mutter), -er final ≈ «a», ensordecimiento final (Kind [kint]), ch suave (ich) y fuerte (Bach), -ig.
- **Corrección:** sustituir las respuestas por el sonido real y dejar el nombre como dato («B: b (al final suena p). Su nombre al deletrear es «beh»»), y añadir 4 lecciones de palabras reales: consonantes que engañan, vocales dobles y umlauts, vocal larga/corta y finales, los dos sonidos de CH.

### C2. Foundations no enseña a conjugar ni el orden de la oración
- `essentials-02/03` enseña sein, haben, gehen, kommen, wollen, können, machen **solo en infinitivo**. No hay ninguna ficha con ich bin / du bist / er ist, ni con las terminaciones -e/-st/-t/-en.
- Los puentes y A1 usan desde el principio bin, bist, hast, wohnst, kommst, möchtet; separables (stehe … auf); kein; verbo en 2.º lugar tras Dann/Heute/Zuerst.
- `essentials-08-4` «verbo en posición 2» es una sola ficha sin práctica. Los pronombres sie (ella/ellos) y es no se enseñan en *essentials* (aparecen después, en vocabulary-01).
- **Corrección:** tres lecciones en *essentials*: sein; haben y presente regular (wohnen); nicht/kein, preguntas y V2, con bloques y escritura.

### C3. La unidad *time* duplica *survival*, y *questions* duplica *essentials*
- `time` (16 lecciones, 231 actividades) enseña los mismos 57 ítems que `survival`, en el mismo orden. Su título promete «tiempo y vida diaria».
- `questions` repite was/wer/wo/wann/wie/warum/nicht (ya en *essentials*) y Wie heißt du? / Wie spät ist es? (ya en *survival*).
- **Corrección:** reescribir *time*: números 21–100 con el orden «uno y veinte» y dreißig; la hora coloquial (halb vier = 3:30, Viertel nach/vor); am Montag, morgens, heute Abend; im Januar y fechas con ordinales; precios en euros.

### C4. Ejemplos agramaticales o poco naturales en *vocabulary*
| Ubicación | Actual | Corrección |
|---|---|---|
| `german-vocabulary-06-4-*` (weh) | «Mein Kopf ist weh.» y glosa «dolorido» | «Mein Kopf tut weh.»; glosa «que duele (en «tut weh»)» |
| `german-vocabulary-02-4-*` (Alter) | «Mein Alter ist 20 Jahre.» | «Ich bin zwanzig Jahre alt.» + nota |
| `german-vocabulary-01-10` (sein = su) | Homónimo del verbo sein sin aviso | Nota: sein = ser/estar; posesivo de él; «de ella» = ihr |
| `german-vocabulary-42-6` | «der Stadtbibliothek» presentado como lema | Nota: forma tras «in»; lema die Stadtbibliothek |

### C5. Registro du/Sie traducido al revés
| Ubicación | Actual | Corrección |
|---|---|---|
| `a1-1-people-03-14` (+ producción, dictado y diálogo) | «Wie alt sind Sie?» = «¿Cuántos años tienes?» | «¿Cuántos años tiene usted?» |
| `a1-2-weather-02-12` | «Nehmen Sie einen Regenschirm mit.» = «Lleva un paraguas.» | «Lleve un paraguas.» |
| `a2-1-ability-02-12` | «Sie müssen Ihren Pass zeigen.» = «Debes mostrar tu pasaporte.» | «Debe mostrar su pasaporte.» |

Un alumno que escribe «Wie alt bist du?» ante «¿Cuántos años tienes?» era rechazado.

### C6. Traducciones que no corresponden a la frase alemana
| Ubicación | Actual | Corrección |
|---|---|---|
| `a1-1-identity-04-15` | «Ich spreche ein wenig Deutsch.» = «Hablo un poco de este idioma.» | «Hablo un poco de alemán.» |
| `a1-1-routine-04-16` | «Ich arbeite sonntags nicht.» = «No trabajo el domingo.» | «No trabajo los domingos.» |
| `a2-1-future-03-13` (+ producción) | «Ich möchte ein Zimmer reservieren.» = «Pienso reservar…» | «Quisiera reservar una habitación.» |
| `a2-1-ability-01-02` | «wissen, wie» = «saber» (para «sé cocinar» se usa können) | «saber cómo (se hace algo)» + nota |
| `a2-1-ability-02-04` | müssen = «deber» | «tener que» + nota (nicht müssen ≠ nicht dürfen) |
| `a2-1-ability-03-13` | «Aquí se puede tomar fotos.» | «Aquí se pueden tomar fotos.» |
| `b1-2-nuance-02-12` | «Insgesamt…» = «Hasta cierto punto…» | «En conjunto, el resultado fue positivo.» |
| `b1-2-projects-01-10` | «Was hat Vorrang?» = «Tenemos que decidir qué es prioritario.» | «¿Qué tiene prioridad?» |
| `b1-2-projects-03-14` | «Am Wochenende…» = «…al final de la semana» | «El fin de semana revisamos los avances.» |
| `b1-2-projects-03-13` (+ producción) | «Prüfen wir die Risiken…» = «Conviene prever los riesgos…» | «Revisemos los riesgos antes de empezar.» |
| `b1-2-perspectives-04-15` | «Beide Sichtweisen erklären das Problem.» = «Comparar ambas perspectivas ayuda…» | «Ambos puntos de vista explican el problema.» |
| `b1-2-conversation-03-13` (+ producción) | «Zuerst möchte ich etwas klären.» = «Antes de continuar, quisiera aclarar un detalle.» | «Primero quisiera aclarar algo.» |

### C7. Producción: se rechazan respuestas correctas y los diálogos no dejan margen
- Igual que en coreano: `allow_minor_typos:true` no tiene efecto sin `answer_policy:"spelling_tolerant"` (`src/guided_course_answers.js`), y cada actividad acepta una sola forma.
- Se rechazaban, por ejemplo:
  - «Um 7 Uhr stehe ich auf.» (V2 con el complemento delante, cifras)
  - «Der Schlüssel ist auf dem Tisch.», «Ich gehe in die Schule.», «Kann ich mit Karte bezahlen?»
  - «der Arzt», «die Sprache» (el sustantivo con su artículo, que es justo lo que se debe aprender)
  - «groß» para «alto», «deswegen» para «por eso», «nötig» para «necesario»
  - «Wie heissen Sie?» (ortografía suiza con ss)
- `a1-1-places` y `a1-2-social` (`stage_scenario`) exigen 3 de 3.
- `a1-2-health`: el alumno debe decir «Nehmen Sie das zweimal täglich.», que es una frase del médico.
- **Corrección:** variantes en `accepted_answers` (anexo A), artículo y ss aceptados, `minimum_correct = n-1` con 3 turnos o más, y la frase del paciente «Ich habe Kopfschmerzen.».

### C8. A2-2–B1-2: la mitad de cada unidad es contenido heredado
- Cada unidad de A2-2 a B1-2 tiene 16 ítems, de los cuales 8 son idénticos a los de otra unidad y se vuelven a enseñar con teach_concept:
  - a2-1-past → a2-2-experiences → b1-1-narrative → b1-2-perspectives
  - a2-1-services → a2-2-technology / a2-2-problemSolving → b1-1-register → b1-2-negotiation
  - a2-1-comparison → a2-2-culture → b1-1-media → b1-2-nuance; b1-1-society → b1-2-projects
  - a2-1-conversation → a2-2-opinions → b1-1-cause-effect → b1-2-conditions; b1-1-emotions → b1-2-conversation
- **Corrección:** convertir los 8 heredados en repaso y añadir 8 ítems nuevos por unidad (pendiente: es reescritura de contenido).

---

## 2. IMPORTANTE

### I1. La trampa de «halb vier» no se explica
- `a1-2-time-01-10` «Es ist halb vier.» = «Son las tres y media.» es correcto, pero nada advierte que *halb vier* significa «media hacia las cuatro». Es el error más frecuente de los hispanohablantes.
- **Corrección:** nota en la ficha y lección de la hora en *time* con «Son las cuatro y media» como distractor.

### I2. Sustantivos sin artículo
- `survival-10/11` (Person, Freund, Familie, Haus, Schule, Bahnhof) y todas las fichas de A1 (Name, Land, Sprache, Tisch, Stuhl, Arzt…) enseñan el sustantivo sin der/die/das. *vocabulary* sí lo hace (das Haus, die Wohnung).
- **Corrección:** nota «Apréndelo con su artículo: die Person (femenino)…». A medio plazo, cambiar el objetivo a «die Person» (requiere audio nuevo).

### I3. Gramática usada antes de enseñarse (A1)
| Gramática | Ítem |
|---|---|
| kein | `a1-1-food-04-16`, `reading-bridge-11-4`, `-12-5` |
| verbos separables | `a1-1-routine-03-13` (stehe … auf), `a1-2-time-03-13` (komme … an), `a1-2-transport-04-15`, `a1-2-weather-02-12`, `story-bridge-02-1/04-1` |
| dativo tras preposición | `a1-1-home-03-13` (auf dem Tisch), `a1-1-places` (zur, zum, in der Nähe), `a1-1-routine-02-11/12` |
| verbo modal + infinitivo final | `a1-2-shopping-03-13`, `a1-2-transport-03-13`, `story-bridge-01-3` |
| möchte | `a1-1-food-02-11`, `-03-14` |
| Es gibt + acusativo | `a1-1-home-04-15` |
- **Corrección:** `usage_note` de una línea (aplicado) y, a medio plazo, una teach_pattern por unidad de A1.

### I4. Fichas de regla con etiquetas equivocadas
- `survival-12-3/4/5` y `essentials-06-4/5`, `07-1/2`: memory_hint «Cómo se forma: Bär» (es un ejemplo, no una formación); «Cómo suena: s larga» para ß.
- Las fichas de umlauts están además fuera de lugar en *survival*, tras los días de la semana.
- **Corrección:** «Ejemplo: Bär», «s sorda, como la s española». Moverlas a *reading* (pendiente).

### I5. Vocabulario 42–50: fragmentos del libro presentados como palabras
- `vocabulary-42 … 50` trocea las frases del puente de lectura: «, Lina?», «in der», «Ist», «Bist du», «Wohnst», «Gut.», letras sueltas B, E, R, G como «vocabulario».
- Las respuestas van con mayúscula de inicio de frase y se adivinan.
- **Corrección:** sacar este bloque de *vocabulary* y dejarlo solo en los puentes (pendiente).

### I6. Glosas que se solapan sin matiz
- der Laden / das Geschäft «la tienda»; der Job / die Arbeit «el trabajo»; der Unterricht / die Klasse «la clase»; das Treffen / die Besprechung «la reunión»; die Kasse / die Kiste «la caja»; frisch / kühl «fresco»; der Becher «el vaso» frente a ein Glas «un vaso».
- No producen respuestas dobles (cada pregunta tiene un solo objetivo), pero el alumno no sabe cuál usar. Añadir «(coloquial)», «(de trabajo)», «(de madera)», etc.

### I7. Distractores triviales
- En *vocabulary* la respuesta es la única opción con artículo («la tienda» frente a «niña», «niño, niña») o la única frase frente a números. En *survival*, frases frente a números.
- Repasos y pruebas copian las opciones de la lección.
- **Corrección:** distractores de la misma categoría y lección; barajar en repasos.

### I8. Los diálogos guiados no son diálogos
- Los 36 `*-production-dialogue` tienen turnos «model» con el texto «Situación N»; no hay ninguna intervención del interlocutor en alemán.
- **Corrección:** turnos reales (p. ej. *shopping*: «Was kostet die Jacke?» → «Neunundvierzig Euro.» → alumno «Kann ich mit Karte zahlen?» → «Ja, natürlich.»). Pendiente.

---

## 3. MENOR

- **Mezcla de variantes del español:** ordenador / computadora, móvil / celular, zumo, piso, «Bienvenida», «lentes»; ihr = «vosotros» en *essentials*, pero «¿Quieren…?» en `reading-bridge-10-4`, `-11-2`. Elegir una variante (el perfil es mexicano).
- **Frases poco naturales:**
  - `survival-02-1` «Sprechen Sie langsam.» → «Sprechen Sie bitte langsamer.»
  - `survival-01-3` «Bitte wiederholen.» → «Wiederholen Sie das bitte.»
  - `a1-2-transport-02-12` «Was ist die nächste Haltestelle?» → «Wie heißt die nächste Haltestelle?»
  - `a2-1-ability-04-15` «Darf ich diesen Platz benutzen?» → «Ist dieser Platz frei?»
  - `b1-2-conversation-02-12` «Zurück zum Thema bleibt eine Frage.» → «Zurück zum Thema: Eine Frage bleibt offen.»
  - Todos estos cambios requieren audio nuevo.
- **Pronombres arcaicos:** `survival-09-5`/`essentials-05-1` dies = «esto» y `survival-10-2` jenes = «aquello» casi no se usan hablando. Añadir «das hier / das da».
- **Glosas mejorables:**
  - es = «ello» (mejor «él/ella/ello (neutro); impersonal: Es regnet»).
  - Medizin = «medicina» (para el medicamento: das Medikament).
  - «Ich kann erst um sieben kommen.» = «Solo puedo venir a las siete.» → «No puedo venir hasta las siete.»
  - hungrig: «Ich habe Hunger» es lo habitual.
- **Pistas de pronunciación:** `essentials-08-4/5` transcriben ich como «ij»; la ch de ich no es la jota española (ver la nueva lección `reading-10`).
- **`reading-foundations-00-09-a`:** el ejemplo de IE es la grafía «ie» sola, sin palabra (usar sie o Bier).
- **`reading-foundations-00-12-b`:** «ARbeiten» con mayúsculas internas confunde con la regla de los sustantivos.
- **`reading-foundations` ítem de ß (`00-06-e-question`, `00-test-30`):** escucha con `audio` vacío; depende de que la app reproduzca el ejemplo «Straße». Verificar en la app o usar la clave «eszett».
- **Sesgo de posición:** 38 % en la primera opción.

---

## 4. Audio

- Antes de las correcciones todas las claves `audio`/`slow_audio` existían en `audio_manifest.json` (1.052 entradas).
- Las lecciones nuevas reutilizan grabaciones existentes siempre que fue posible (las 23 palabras de las lecciones de sonido ya tenían audio).
- **Quedan 40 claves nuevas sin grabación (≈ 543 caracteres):** formas verbales (ich bin, du bist, er ist, wir sind, Sie sind, ich habe, du hast, er hat, ich wohne, du wohnst, er wohnt, wir wohnen), las frases de *essentials-11* y todo *time* (einundzwanzig, dreißig, fünfundvierzig, siebzig, neunundneunzig, hundert, Um wie viel Uhr?, Es ist Viertel nach drei., …, Ich zahle bar.).
- Hasta generarlas con TTS de macOS, `tests/guided_content_audit.test.mjs` falla por `missing_audio_manifest_entry`.

---

## 5. Unidades huérfanas y referencias

- `course.json` → `levels[].unitIds` y `units[]` coinciden (45/45) y todos los `manifest` existen.
- **Hay 6 archivos en `units/` que no referencia `course.json`** (versiones antiguas de 7 lecciones): `a1-1-introductions`, `a1-2-daily-life`, `a2-1-plans-and-time`, `a2-2-description-and-comparison`, `b1-1-narration-and-reasons`, `b1-2-independent-reading`.
- **Corrección:** archivarlos fuera de `units/`. No se tocaron.
- No hay IDs de lección o actividad duplicados ni respuestas fuera de las opciones.

---

## 6. Recomendaciones pedagógicas (Assimil + Rosetta Stone, ~40 min/día)

1. **Artículo siempre pegado al sustantivo** (der Tisch, die Tür, das Haus), con color por género en la tarjeta. Es la mayor carga de memoria del alemán y el curso la deja para *vocabulary*.
2. **Diálogo primero (Assimil):** abrir cada unidad de A1 con un diálogo de 6–8 líneas grabado y cerrarla con el diálogo guiado real (I8).
3. **Imagen antes que traducción (Rosetta):** los sustantivos concretos de *vocabulary* (ropa, comida, casa, cuerpo) se prestan a «escucha y elige la imagen».
4. **Producción mínima por lección:** un dictado y un bloque de orden de palabras, sobre todo para V2 y verbos separables, que solo se aprenden produciendo.
5. **Sesión diaria:** una lección de A1 dura 5–8 min; a 40 min/día se hacen 5–6 lecciones y A1 se termina en ~3 semanas. Conviene intercalar *vocabulary* (67 lecciones seguidas) con las unidades temáticas.

---

## Anexo A — accepted_answers añadidos

| Respuesta modelo | Variantes aceptadas |
|---|---|
| Ich stehe um sieben Uhr auf. | Ich stehe um 7 Uhr auf. · Um sieben/7 Uhr stehe ich auf. · Ich stehe um sieben auf. |
| Ich lerne am Nachmittag. | Am Nachmittag lerne ich. · Ich lerne nachmittags. · Nachmittags lerne ich. |
| Ich trinke morgens Tee. | Morgens trinke ich Tee. · Ich trinke am Morgen Tee. · Am Morgen trinke ich Tee. |
| Ich möchte etwas Reis. | Ich möchte ein bisschen Reis. · Ich hätte gern(e) etwas Reis. |
| Der Schlüssel liegt auf dem Tisch. | Der Schlüssel ist auf dem Tisch. |
| Der Bahnhof ist links. | Der Bahnhof ist auf der linken Seite. · Der Bahnhof liegt links. |
| Ich gehe zur Schule. | Ich gehe in die Schule. |
| Ich komme aus Mexiko. | Ich bin aus Mexiko. |
| Kann ich mit Karte zahlen? | … bezahlen? · mit der Karte … · mit Kreditkarte … |
| Ich komme um acht Uhr an. | um 8 Uhr · Um acht Uhr komme ich an. · Ich komme um acht an. |
| Ich bin allergisch gegen Penicillin. | Ich bin gegen Penicillin allergisch. · Ich habe eine (Penicillin)allergie (gegen Penicillin). |
| Ich habe nach sechs Uhr Zeit. | nach 6 Uhr · Nach sechs Uhr habe ich Zeit. · ab sechs Uhr |
| Sustantivos sueltos (Arzt, Sprache, Frau, Tür, Fleisch, Mantel, Karte…) | con su artículo: der Arzt, die Sprache… |
| hoch · notwendig · kaputt · deshalb · ist passiert | groß · nötig/erforderlich · defekt · deswegen/darum/daher · passierte/geschah/ist geschehen |
| Cualquier respuesta con ß | la misma con ss (ortografía suiza) |
| A2 (selección) | Ich habe meine Schlüssel nicht gefunden. · Diese Option ist für mich besser. · Hier kann man fotografieren. · Ich muss mein Handy laden. · Das löst das Problem nicht. |

---

## Estado de las correcciones (27 de octubre de 2026)

Aplicadas con `node scripts/repair_german_audit_2026_10.mjs` (idempotente: la segunda ejecución no cambia nada) y protegidas por `tests/german_audit_repairs.test.mjs`.

| Punto | Estado | Qué se hizo |
|---|---|---|
| C1 | Corregido | `reading` 01–06 da el sonido real y el nombre como dato (sin cambiar las claves de audio). Nuevas `reading` 07–10: consonantes que engañan (Zug, Wasser, Vater, ja, Sonne, Straße, Schule), vocales dobles y umlauts, vocal larga/corta y finales, ich/Bach/sechs/-ig. La prueba de la unidad suma 10 preguntas. |
| C2 | Corregido | `essentials` 09–11: sein, haben, presente regular (wohnen), nicht/kein, preguntas y V2, con bloques y escritura; 8 preguntas nuevas en la prueba. Falta producción en cada lección de A0. |
| C3 | Corregido (`time`) | `time` reescrita: 21–100, la hora coloquial (halb, Viertel, nach, vor), días, meses y fechas con ordinales, precios. Título actualizado en `course.json`. `questions` sigue repitiendo *essentials*. |
| C4 | Corregido | weh → «tut weh», edad con «… Jahre alt», notas en sein (homónimo) y der Stadtbibliothek. |
| C5 | Corregido | Tres frases con Sie traducidas ahora con usted. |
| C6 | Corregido | Doce glosas corregidas, también en repasos, pruebas, unidades que heredan el ítem y enunciados de producción. |
| C7 | Parcial | Variantes del anexo A; artículo y ss aceptados; `stage_scenario` 2 de 3; *health* usa la frase del paciente. La tolerancia a erratas sigue limitada a `spelling_tolerant` (decisión compartida con coreano). |
| C8 | Pendiente | Reescritura de A2-2–B1-2. |
| I1 | Corregido | Nota en `a1-2-time` y lección de la hora. |
| I2 | Corregido (nota) | `usage_note` con artículo y género en *survival* y A1; el objetivo sigue sin artículo. |
| I3 | Corregido (nota) | Notas de kein, separables, dativo, modales, möchte y Es gibt. |
| I4 | Corregido | Etiquetas «Ejemplo:» y «s sorda». Las fichas siguen en *survival*. |
| I5–I8 | Pendiente | Bloque 42–50 de *vocabulary*, glosas solapadas, distractores y diálogos reales. |

**Audio:** 40 claves nuevas sin grabación (≈ 543 caracteres). Hasta generarlas, la app usa la voz del dispositivo y `tests/guided_content_audit.test.mjs` falla por `missing_audio_manifest_entry`.
