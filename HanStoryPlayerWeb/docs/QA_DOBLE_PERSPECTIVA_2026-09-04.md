# Auditoría de HanStory: profesor + alumno

Este informe conserva el diagnóstico inicial. Para distinguir lo ya reparado de lo pendiente, consultar [Estado de correcciones](QA_REPAIR_STATUS.md).

Fecha inicial: 2026-09-04  
Actualización: 2026-09-06

## Dictamen

HanStory tiene una base valiosa para convertirse en un recurso principal: ruta extensa, repetición espaciada, historias, temas, audio con velocidad y repetición, teclados integrados, modo sin anuncios y posibilidad de estudiar sin cuenta. Sin embargo, en su estado actual **no debe presentarse todavía como recurso único o principal para aprender cualquiera de los diez idiomas**.

Los bloqueadores no son solo detalles visuales. Hay ejercicios sin audio, preguntas que no miden conocimiento, texto contaminado entre idiomas, respuestas correctas rechazadas por coincidencia exacta, consignas que contradicen el control mostrado, feedback que repite la respuesta sin enseñarla, un bloqueo después de usar voz y una separación defectuosa entre el progreso de cuenta e invitado.

## Alcance y método

Se hicieron tres recorridos complementarios:

1. **Como alumno:** navegación real por portada, mapas, unidades, lecciones, resultados, reintentos, historias, temas, audio, teclado, escritura, dictado, diálogo, voz, cuenta y vista móvil.
2. **Como profesor:** revisión de coherencia entre consigna, forma objetivo, traducción, opciones, respuesta, explicación y audio; además de una auditoría estructural de todo el catálogo.
3. **Recorrido funcional exhaustivo:** un navegador aislado abrió los diez mapas y las 452 unidades, cursó las 4,303 lecciones y operó las 63,980 pantallas de actividad que el runtime presenta al alumno. Llegó a 4,302 de 4,303 resultados; una lección japonesa quedó bloqueada por una respuesta imposible de construir. Una segunda pasada a 320×568 abrió los 66 temas, sus 1,344 frases, los siete libros públicos y 5,422 posiciones de sus reproductores.

El tercer recorrido prueba cobertura de rutas, controles y estados. **No prueba por sí solo que 68 mil contenidos sean lingüísticamente correctos.** Para eso se contrastaron manualmente actividades representativas, se buscaron patrones en todo el catálogo y se separaron errores confirmados de candidatos que requieren revisión nativa.

Recorridos manuales destacados:

- Coreano inicial: lección completa, error intencional, resultado insuficiente y reintento de errores.
- Francés, `french-vocabulary-44`: reproducción del audio faltante.
- Chino, `chinese-essentials-09`: lección completa.
- Árabe, `arabic-questions-01`: lección completa.
- Coreano B1, `korean-b1-1-cause-effect-production-checkpoint`: escritura, dictado, bloques, pregunta abierta, voz y diálogo completo.
- Coreano, prueba de puente narrativo: opciones auditivas ambiguas.
- Coreano, producción de comida: rechazo de una frase válida sin pronombre explícito.
- Japonés, `japanese-reading-foundations-production-checkpoint`: consignas contradictorias y una actividad imposible de completar.
- Inglés, `english-b1-1-cause-effect-production-checkpoint`: rechazo manual de dos formulaciones semánticamente válidas y contradicción entre la instrucción y el control de bloques.
- Historias y temas: navegación, modos de reproducción, controles y relación con el curso.
- Responsive: 390×844 y 320×568.

La auditoría global cubrió los diez cursos enlazados por sus manifiestos: **452 unidades, 4,303 lecciones, 68,213 actividades y 124,826 referencias de audio**. El recorrido de navegador cubrió las **63,980 actividades visibles**; la diferencia corresponde principalmente a introducciones que el runtime no presenta como paso independiente.

Esto no equivale a una certificación nativa palabra por palabra de 68 mil actividades. Para prometer corrección total en diez idiomas sigue siendo necesaria una firma de revisión por docentes o hablantes nativos cualificados. Sí ofrece una comprobación integral de estructura y una muestra manual de extremo a extremo de cada interfaz importante.

## Hallazgos críticos

### P0. Audio inexistente en actividades publicadas

El auditor encontró **2,158 referencias sin entrada en el manifiesto**, que corresponden a 1,079 actividades distintas en 50 lecciones:

| Idioma | Referencias | Actividades | Lecciones |
|---|---:|---:|---:|
| Francés | 434 | 217 | 10 |
| Alemán | 536 | 268 | 13 |
| Coreano | 1,188 | 594 | 27 |

Reproducción manual: en `french-vocabulary-44`, la tarjeta de `m’appelle` no muestra audio; en el siguiente ejercicio, el botón informa que el audio está pendiente. Esto reproduce exactamente el problema de “se muestra un ejemplo, pero no hay sonido”.

Riesgo: una ruta que depende de escucha no puede ser autosuficiente si ofrece botones o actividades auditivas sin material.

### P0. El ejercicio de voz puede congelar toda la lección

En `korean-b1-1-cause-effect-production-checkpoint`:

1. Se pulsó **Responder hablando**.
2. El reconocimiento terminó con “No escuché una respuesta”.
3. Se escribió una respuesta; **Comprobar**, **Pista**, **Omitir práctica oral** y **Mapa** dejaron de responder aunque aparecían habilitados.
4. Tras recargar y repetir sin activar voz, la misma lección se completó correctamente.

La causa parece estar en el ciclo asíncrono de `startSpeech()` y el nuevo render, pero debe reproducirse con una prueba automatizada de navegador antes de corregirla.

### P0. Cerrar sesión no aisló el progreso de la cuenta

Durante la prueba se observó que la copia local de **invitado** fue reemplazada por el progreso de la cuenta durante el cambio de sesión. Después de cerrar sesión, la portada seguía mostrando avance procedente de la cuenta.

Las copias locales confirman que una instantánea de invitado inicialmente mínima fue sobrescrita, un segundo después, por una instantánea extensa. El flujo de `SyncService.handleAuth()` no está serializado y puede ejecutarse de nuevo mientras el primer cambio de propietario sigue en curso.

Riesgos:

- privacidad: el avance de la cuenta sigue visible sin sesión;
- mezcla accidental de perfiles;
- una futura sincronización puede partir de una copia de invitado incorrecta.

### P0. Contenido de un idioma mezclado con otro

Casos confirmados:

- Chino: la forma objetivo `没有 conjugación` se enseña, se ofrece como respuesta correcta y se repite en la explicación. El botón visible dice “Escuchar 没有 conjugación”, pero reproduce el audio registrado para `我喝 / 你喝`.
- Ruso: aparece la forma objetivo `negación не` como si fuera ruso.
- Coreano: `도와주세요. Help.` se propagó desde una historia a temas y ejercicios.

No deben corregirse solo en una pantalla: son valores fuente reutilizados en enseñanza, evaluación, audio, repaso y pruebas.

### P0. Preguntas que se contestan sin saber el idioma

En `arabic-questions-01`, cinco preguntas de significado ofrecen una sola opción. La lección completa da diez respuestas calificables, por lo que **la mitad de la puntuación se obtiene sin tomar una decisión**. `portuguese-questions-01` repite el mismo defecto cinco veces.

El auditor detecta diez casos `insufficient_options`, pero el contenido publicado permite cursarlos y conceder XP.

### P0. Una lección japonesa no se puede terminar

En `japanese-reading-foundations-production-checkpoint` se acumulan varios defectos en cuatro pasos:

- el encabezado pide copiar `ぱ`, pero la instrucción exige escribir `か→が · は→ぱ`;
- el paso rotulado **Traduce sin opciones** en realidad pide copiar `きゃ · っ`;
- el texto promete ejemplos de audio separados, pero no presenta esos controles;
- el tercer paso exige reconstruir `ぱ`, aunque solo ofrece los bloques `·`, `か→が` y `は→ぱ`.

El último caso no admite ninguna combinación correcta. El botón de comprobación queda inutilizable, el contador se atasca y no aparece el resultado. Los diez avisos registrados por el recorrido exhaustivo son consecuencias de esta única causa raíz, no diez lecciones distintas.

## Hallazgos de corrección pedagógica

### P1. “Responde con tus palabras” acepta una sola cadena

El patrón es global: las **364 actividades `open_question`** del catálogo tienen una sola respuesta aceptada; la entrada de `accepted_answers` se limita a duplicar `answer`. Lo mismo ocurre en los **789 turnos de alumno** de diálogos y escenarios guiados. Por tanto, ninguna de esas 1,153 oportunidades admite de verdad una respuesta personal o una paráfrasis revisada.

Prueba manual en inglés:

- «Como resultado, el proyecto se retrasó.» rechazó `Consequently, the project was delayed.` y exigió `As a result, the project was delayed.`;
- bajo la etiqueta **Responde con tus palabras**, «¿Tú qué opinas?» rechazó `What's your opinion?` y exigió `What do you think?`.

Ambas respuestas rechazadas son naturales y transmiten la idea solicitada. La pantalla muestra “Revísalo una vez más”, pero no identifica un error lingüístico porque no lo hay: revela la frase memorizada por el autor.

En la producción coreana, la consigna “Responde con tus palabras” para «¿Tú qué opinas?» acepta `어떻게 생각해요?`, pero rechazó `어떻게 생각하세요?`, una formulación también válida y más deferente. El mensaje no explica registro ni matiz: simplemente declara una “respuesta esperada”.

Otro caso: para «Bebo té por la mañana», se rechazó `아침에 차를 마셔요.` y se exigió `저는 아침에 차를 마셔요.`. En coreano el sujeto o tópico recuperable puede omitirse; calificar solo por igualdad textual produce falsos errores. Como respaldo lingüístico, la bibliografía describe el coreano como una lengua de sujeto nulo: [The distribution of subject pronouns and the pro/overt-pronoun distinction in Korean](https://www.sciencedirect.com/science/article/pii/S0024384125000385).

El motor normaliza puntuación y pequeñas variaciones, pero semánticamente sigue dependiendo de `answer` y `accepted_answers`. Cada actividad abierta necesita variantes revisadas o una evaluación lingüística controlada.

### P1. El feedback frecuentemente no explica

En aproximadamente **9,238 actividades `select_translation`**, la explicación es exactamente igual a la respuesta correcta. El alumno vuelve a ver la opción, pero no aprende por qué era correcta, por qué las demás eran incorrectas ni qué regla puede reutilizar.

Incluso al acertar una producción, aparecen mensajes genéricos como “La respuesta comunica correctamente la idea”. Ese feedback no confirma forma, registro, gramática o pronunciación. Para ser recurso principal, cada error debe conducir a una explicación concreta y enlazable.

### P1. Consigna, nombre del ejercicio y control visible no siempre coinciden

Se confirmaron tres patrones:

- existen actividades `typed_translation` cuyo texto pide **copiar**, aunque la interfaz las rotula **Traduce sin opciones**;
- una reconstrucción inglesa con siete botones afirma “Produce la respuesta sin elegir entre opciones”;
- se encontraron **443 tarjetas de regla** donde el nombre conceptual visible y el texto enviado al audio son distintos. Muchas diferencias son legítimas —una regla acompañada de un ejemplo—, pero el botón se anuncia como “Escuchar [regla]” en lugar de “Escuchar ejemplo: [frase]”. Esto hace parecer que el audio no corresponde a la pantalla y es especialmente confuso para lectores de pantalla.

Los 443 casos son una cola de corrección de interfaz y revisión, no 443 errores lingüísticos confirmados.

### P1. Audio indistinguible por puntuación

En `korean-story-bridge-test-08`, una actividad auditiva ofrece:

- `도와주세요?`
- `도와주세요!`
- `네, 밖이에요.`

Las dos primeras opciones tienen los mismos segmentos y solo difieren por puntuación/entonación. Sin una grabación intencionalmente contrastiva y una explicación de entonación, la respuesta es ambigua o evalúa una pista poco fiable.

### P1. Traducción coreana con persona y género inventados

`피곤했지만 일을 끝냈어요.` se presenta como «Aunque estaba cansada, terminó el trabajo». La frase coreana no expresa por sí sola ni género ni una tercera persona obligatoria. El modelo español fija información que el original deja al contexto, y después la reutiliza en dictado, producción y diálogo.

### P1. Contenido evaluado antes de enseñarse

El auditor detectó cuatro casos en fundamentos de hangul:

- vocales verticales;
- vocales horizontales;
- formación de bloques;
- batchim.

Esto rompe la promesa visible de “primero te lo enseñamos” y debe resolverse reordenando o marcando correctamente la introducción del concepto.

### P1. Exceso de reconocimiento frente a producción

El runtime califica toda actividad que no sea de enseñanza: **51,466 actividades**. De ellas:

- 48,874 son selección/reconocimiento o construcción de palabra con opciones;
- 2,592 pertenecen a tipos de producción;
- dentro de esas 2,592, 375 todavía construyen con bloques dados;
- solo 2,217, aproximadamente **4.3 %**, exigen entrada libre, dictado, habla o diálogo.

La producción existe y su interfaz es prometedora, pero aparece demasiado concentrada en checkpoints. Un recurso principal debe exigir recuperación activa desde el principio y dentro de cada lección, no casi exclusivamente reconocimiento.

### P1. El auditor no cubre lo mismo que califica la aplicación

`audit_guided_courses.mjs` reporta 48,874 actividades calificables porque su conjunto `gradableTypes` omite los tipos de producción. El runtime, en cambio, califica toda actividad no docente: 51,466.

Consecuencia: 2,592 ejercicios de escritura, dictado, habla y diálogo pueden contener respuestas ausentes o incoherentes sin pasar por las mismas validaciones automáticas de integridad.

### P1. Catálogo de XP incompleto

Las pruebas de infraestructura encuentran cinco lecciones alemanas publicadas que no están en el catálogo del servidor:

- `german-vocabulary-48`
- `german-vocabulary-review-48`
- `german-vocabulary-49`
- `german-vocabulary-50`
- `german-vocabulary-test-67`

También falta el libro publicado `HF007`. El avance local puede guardarse, pero el XP remoto de esas rutas no tiene garantía de concederse.

## Hallazgos de experiencia del alumno

### P2. Móvil estrecho

A 320×568:

- la navegación del curso mide 298 px visibles frente a 353 px de contenido y recorta **Perfil**;
- aparece desbordamiento horizontal;
- títulos grandes se parten de forma agresiva;
- el teclado del curso y el pie fijo de feedback compiten por el mismo espacio vertical.

A 390×844 el mapa es utilizable, por lo que el problema está concentrado en anchos pequeños y lecciones con teclado.

### P2. Feedback de opción incorrecta poco visual

Al fallar una pregunta se marca la opción elegida y aparece la explicación, pero no se destaca claramente la opción correcta. El alumno debe inferirla del texto. Conviene mostrar “tu respuesta” y “respuesta correcta” de forma accesible y consistente.

### P2. Todos los libros ofrecen un modo Podcast vacío

Los siete libros públicos —tres de inglés, dos de francés, uno de alemán y uno de japonés— muestran **Podcast por lección** en el selector, pero ninguno contiene pistas de ese tipo. Al elegirlo se abre un reproductor sin contenido útil. El modo debe ocultarse o deshabilitarse cuando el manifiesto no tenga pistas `podcast`.

Durante Temas también se solicitó trece veces `library/books/HS-AC01/explanations/track_explanations.json`, que responde 404. La aplicación tolera su ausencia y sigue reproduciendo, pero debería declarar el recurso como opcional antes de pedirlo o publicar el archivo para evitar errores de red repetidos.

### Aspectos que funcionaron bien

- El reintento de errores crea una sesión corta y conserva el resultado.
- El dictado acepta puntuación opcional.
- El teclado coreano compone jamo en sílabas correctamente.
- El diálogo guiado presenta con claridad turnos de guía y alumno.
- Los controles de audio normal, lento y repetición son consistentes cuando existe material.
- En Temas e Historias, los 2,927 archivos de audio únicos comprobados estaban disponibles; el texto y la traducción visibles siguieron el manifiesto durante las 6,766 posiciones recorridas.
- La repetición espaciada tiene intervalos visibles de 1, 3, 7, 14 y 30 días.
- Historias y temas aportan contexto y reutilización del contenido.

## Resultado de pruebas automáticas

### JavaScript

`node --test tests/*.test.mjs`

- 20 pruebas;
- 19 correctas;
- 1 fallo: la auditoría de contenido encuentra errores publicados.

### Recorrido real de navegador

- 10 mapas y 452 unidades abiertas;
- 4,303 lecciones cursadas;
- 63,980 actividades visibles operadas;
- 78,565 controles de audio detectados durante el recorrido;
- 4,302 pantallas de resultado alcanzadas;
- 1,079 actividades afectadas por audio ausente o no reproducible;
- 10 preguntas con una sola opción;
- 1 bloqueo raíz confirmado en la producción japonesa descrita arriba.

El archivo de evidencia es `docs/qa_full_ui_results.json`. Contiene además cuatro alertas antiguas sobre la palabra alemana `null`; son falsos positivos del detector, porque **null** significa correctamente “cero” en alemán y no debe corregirse.

### Recorrido real de Temas e Historias a 320×568

- 66 temas y 1,344 frases abiertas individualmente;
- 1,344 posiciones del reproductor de Temas;
- 7 libros públicos y 230 lecciones visibles;
- 21 ejecuciones de modo y 5,422 posiciones del reproductor de Historias;
- 2,927 archivos de audio únicos comprobados, 0 ausentes;
- 0 diferencias entre texto/traducción visible y el manifiesto después de eliminar del probador la reanudación guardada;
- 7 modos Podcast vacíos, uno por libro;
- 13 solicitudes 404 al mismo archivo opcional de explicaciones de `HS-AC01`.

La evidencia está en `docs/qa_library_ui_results.json`. Esta prueba demuestra integridad de presentación y archivos, no corrección lingüística de las 1,344 traducciones.

### Python

`python3 -m unittest discover -s tests -v`

- 59 pruebas;
- 56 correctas;
- 2 fallos de catálogo: lecciones alemanas y `HF007`;
- 1 error de importación: falta `src.web_library` para `test_web_library.py`.

### Auditoría de contenido

- 2,169 errores;
- 433 advertencias;
- 2,158 referencias de audio ausentes;
- 10 actividades con opciones insuficientes;
- 1 actividad con opciones duplicadas;
- 4 casos evaluados antes de enseñarse;
- 429 traducciones idénticas a la forma objetivo.

Las 429 coincidencias no son 429 errores confirmados: muchas son cognados, nombres o formas compartidas. Deben convertirse en una cola de revisión humana, no corregirse automáticamente en masa.

## Comparación con Jazyk

Jazyk se usó solo como referencia secundaria, no como fuente infalible. Su curso de coreano hace visibles cuatro cosas que HanStory necesita para poder ser un recurso principal:

1. resultado declarado: TOPIK II nivel 4 / B2;
2. autoría docente identificable;
3. canal para dudas con instructora o comunidad;
4. temario explícito con escritura, pronunciación, vocabulario, diálogos, estructura, partículas, verbos, adjetivos, honoríficos, irregularidades y bloques de práctica.

HanStory ofrece mucha más interactividad, pero no muestra quién revisó cada idioma, cómo se valida el nivel final ni qué hacer cuando una explicación resulta insuficiente. Tampoco sustituye aún una corrección docente para producción abierta.

## Qué debe tener para ser el recurso principal

1. **Ruta y promesa medibles.** Nivel CEFR o examen correspondiente por idioma, habilidades cubiertas y pruebas de salida que realmente midan comprensión, producción, escucha y habla.
2. **Pronunciación completa.** Audio para cada elemento que lo promete, contraste de sonidos, transcripción, explicación articulatoria y feedback de pronunciación; no solo transcribir voz.
3. **Escritura propia del idioma.** Orden de trazos y práctica de escritura para hanzi, kana, hangul y árabe cuando corresponda.
4. **Producción desde temprano.** Dictado, traducción, transformación, respuestas personales y diálogo dentro de todas las etapas.
5. **Corrección flexible y explicable.** Aceptar variantes válidas, distinguir registro y explicar por qué una respuesta es incorrecta.
6. **Gramática consultable.** Un índice interno de explicaciones con ejemplos, excepciones y enlaces desde cada error, para no depender de buscar fuera.
7. **Contenido gobernado.** Nombre/rol del revisor, fecha, versión, estado de revisión y botón para reportar un problema en cada actividad.
8. **SRS basado en errores reales.** Mantener la repetición espaciada, pero agrupar variantes y evitar que preguntas triviales inflen dominio y XP.
9. **Historias activas.** Antes, durante y después de cada historia: vocabulario previo, comprensión, resumen, reconstrucción y producción oral/escrita.
10. **Calidad operativa.** Sin rutas silenciosamente rotas, sin mezcla de perfiles, responsive desde 320 px, accesibilidad por teclado/lector y pruebas automáticas que cubran exactamente lo que el runtime califica.

## Orden recomendado de corrección

1. Bloquear publicación si falta audio, hay menos de dos opciones o la respuesta no puede seleccionarse.
2. Corregir la separación cuenta/invitado y el bloqueo del reconocimiento de voz.
3. Reparar la lección japonesa imposible y validar automáticamente que toda respuesta por bloques sea construible.
4. Limpiar valores fuente contaminados y regenerar sus derivados.
5. Alinear tipo, etiqueta, consigna, control y feedback de cada actividad.
6. Extender el auditor a todos los tipos que el runtime califica.
7. Reparar el catálogo de XP y hacer pasar todas las pruebas.
8. Crear un sistema de variantes aceptadas por idioma y registro.
9. Convertir las preguntas realmente abiertas en producción flexible y aumentar producción libre en las lecciones normales.
10. Hacer una revisión lingüística firmada por idioma, empezando por contenido A0–A1.
11. Ocultar los modos de historia vacíos y evitar solicitudes repetidas de recursos opcionales ausentes.
12. Corregir móvil estrecho y feedback de errores.

## Criterio de salida

No declarar un idioma “listo como recurso principal” hasta que:

- la auditoría tenga 0 errores;
- todas las suites pasen;
- 100 % de botones de audio reproduzcan el contenido que nombran;
- no existan ejercicios de una sola opción;
- una muestra estratificada de cada unidad haya sido cursada en escritorio y móvil;
- las actividades abiertas acepten variantes válidas o dejen de anunciarse como abiertas;
- el feedback explique el error en vez de limitarse a revelar la cadena esperada;
- un revisor cualificado haya firmado el contenido y el examen final del nivel.

## Estado del dispositivo al terminar

- El recorrido exhaustivo se ejecutó en un contexto de navegador aislado y sin sesión; no modificó el progreso normal del usuario.
- Se retiraron los eventos XP y las lecciones creadas localmente por la prueba anterior.
- Se restauró el perfil invitado anterior al inicio de sesión.
- El evento remoto de 20 XP no se eliminó; el usuario indicó que no era necesario.
- Los únicos archivos añadidos son el informe, las dos evidencias JSON y los scripts de prueba.
