# Estado de las correcciones

> Las secciones están en orden cronológico inverso. Los apartados históricos pueden contener «pendiente» que fue resuelto en una entrada posterior; el estado vigente y las limitaciones que siguen abiertas están siempre en las primeras secciones.

## Límites vigentes que no se deben presentar como resueltos

- Para esta instancia privada, el propietario acepta estos límites; la revisión nativa queda como mejora opcional y no bloquea el uso.
- Las rutas y los archivos de audio se han validado técnicamente; falta una escucha lingüística independiente que valore pronunciación, naturalidad y sincronía texto-voz de cada grabación/TTS.
- Las comprobaciones automatizadas cubren secuencia, evaluación y renderizado, pero no pueden demostrar por sí solas que una persona aprenda el idioma ni sustituir una revisión nativa integral de las 68.223 actividades.
- El desglose palabra por palabra existe para los casos editoriales enriquecidos, pero no para cada frase de los diez catálogos.
- La migración `019_qa_guided_and_story_catalog.sql` continúa local y no se ha aplicado a Supabase; requiere autorización/conexión al entorno remoto.

## Producción y feedback de errores · v183–v184

- La producción de lectura inglesa ya no presenta `TH` como un único bloque seleccionable: la reconstrucción ofrece `T` y `H`, por lo que el alumno debe ordenar realmente los dos grafemas. El generador aplica la misma regla a grupos alfabéticos sin vocales y la prueba evita actividades de bloques triviales cuando la respuesta tiene varias piezas.
- En una pregunta conceptual fallida, «Ver explicación y modelo» conserva el modelo y las notas de la regla, pero no vuelve a mostrar una serie completa de audios heredados de la tarjeta de enseñanza. Los audios siguen disponibles en la tarjeta original y en actividades de escucha/dictado donde forman parte de la tarea.
- Verificación directa: producción inglesa muestra los botones `H` y `T`; error japonés sobre hiragana muestra modelo y explicación sin los quince controles de audio repetidos. Caché de aplicación: `hanstory-shell-v184`.

## Japonés · controles de audio pertinentes · v182

- Una pregunta conceptual ya no hereda y vuelve a renderizar una serie completa de tarjetas de audio de la enseñanza anterior. La tarjeta mantiene sus ejemplos; la pregunta conserva controles sólo si su propio registro editorial declara un ejemplo o si la enseñanza anterior aporta un único modelo útil.
- Verificación directa en `japanese-reading-00-01`: la tarjeta de hiragana conserva los cinco audios individuales; la pregunta «¿Qué aprenderás primero para leer japonés?» muestra grafía y opciones, sin duplicar los quince botones de reproducción. Se protege con prueba de interfaz lógica para series heredadas y prueba de regresión para un ejemplo único heredado.
- Caché de aplicación: `hanstory-shell-v182`.

## Coreano · vocales sin símbolos adicionales · v181

- Las preguntas de posición de las vocales verticales y horizontales usan ahora `ㅇ + ㅏ = 아` y `ㅇ + ㅜ = 우`. `ㅇ` ya se presentó como soporte silencioso en las tarjetas; se retiró `ㄱ` de esos dos ejemplos porque todavía no se había enseñado y desviaba el foco de la relación espacial de la vocal.
- Recorrido directo de la lección de vocales horizontales: las tres tarjetas preceden a las tres escuchas; las opciones reutilizan sílabas aprendidas en esa lección o en la inmediatamente anterior; la actividad final muestra el modelo `ㅇ + ㅜ = 우` y pregunta sólo dónde va la vocal. Se recorrieron y comprobaron los tres ejercicios auditivos y la pantalla final.
- El regenerador de fundamentos conserva la lección de producción creada en la segunda fase y la deja antes de la prueba final. Esto evita que una regeneración de contenido pedagógico borre una práctica existente. La prueba de producción vuelve a usar una consigna de reconstrucción que pide sólo el resultado final.
- Caché de aplicación: `hanstory-shell-v181`.

## Explicación posterior a una respuesta correcta · v180

- El detalle que se abre con «Ver explicación» ya no duplica la respuesta aceptada cuando el alumno acertó. Conserva solamente lo que enseña algo: desglose, regla, contraste, ejemplo audible y vínculo con la tarjeta previa. Si se falla, sí muestra el modelo para poder corregirse. Cuando una actividad no tiene ninguna explicación adicional, no añade un desplegable vacío.
- Verificación directa en navegador: en `chinese-reading-00-01`, tras elegir correctamente «Inicial m, final a y primer tono», el detalle muestra inicial, final, tono, ejemplo y regla de pinyin, sin volver a mostrar esa respuesta como «Respuesta aceptada». La franja breve de confirmación permanece fuera del detalle.
- La primera lección coreana ya no pide pronunciar `한` antes de haber enseñado `ㅎ`, `ㅏ` y `ㄴ`: presenta la estructura abstracta «inicial + vocal + final = bloque». Los bloques pronunciables siguen apareciendo después, cuando sus componentes han sido enseñados.
- Pruebas focalizadas, auditoría de secuencia de los diez cursos y 23 pruebas de datos de producción aprobadas. Caché de aplicación: `hanstory-shell-v180`.

## Tarjetas de sonido mínimas · v178

- Las cinco vocales japonesas iniciales se presentan como grafía + audio, sin texto repetido dentro de cada tarjeta. La caché de aplicación pasa a `hanstory-shell-v178` para que este cambio llegue a quien aún tenía recursos anteriores.

## Verificación de interfaz y recursos · v177

- El recorrido QA de escritorio y el de 390×844 de v176 completaron los diez cursos: 452 unidades, 4.303 lecciones y 63.990 actividades renderizadas en esa versión, sin incidencias de renderizado, desbordamiento horizontal, botones sin nombre, respuestas imposibles ni errores de navegador. La auditoría estructural actual registra 68.223 actividades y 51.476 calificables; los informes por curso y el consolidado móvil históricos están en `docs/qa_full_ui_*_v176.json` y `docs/qa_full_ui_mobile_v176.json`.
- Los recorridos móvil y de escritorio de biblioteca e historias (`docs/qa_library_ui_mobile_v178.json`, `docs/qa_library_ui_desktop_v178.json`) cubrieron 66 temas, 1.344 frases, 7 libros, 230 lecciones y 5.422 posiciones de reproducción sin incidencias, errores de navegador, desbordamiento ni rutas de audio inaccesibles.
- `scripts/audit_audio_integrity.mjs` revisa todos los recursos físicos con ffprobe y escribe `docs/qa_audio_integrity.json`. En v177 comprobó 9.140 archivos: 0 ilegibles, 0 de duración nula y 0 menores de 1 KB. Esto detecta recursos técnicos dañados, no certifica pronunciación, naturalidad ni sincronía texto-audio.
- Se corrigió la asociación falsa de `شين` a los signos sukun/shadda: son signos ortográficos sin pronunciación aislada. La tarjeta y las actividades de producción ya no muestran un botón de audio engañoso. `audit_reading_audio_alignment.mjs` conserva como información las cinco relaciones contextuales revisadas y termina sin alertas pendientes.

Actualizado: 2026-09-09. Cambios locales; no se ha desplegado ni aplicado SQL al servidor.

## Ayuda de los cursos guiados: desglose y respaldo (revisión actual)

- Reparación de correspondencia audio/respuesta en 14 ejercicios finales de lectura de inglés, alemán, ruso, chino, francés, italiano y portugués. Fuente editorial: `reading_audio_checkpoints.json`, aplicada también por el generador de producción. Inglés usa ship/chair; alemán ich/Bach; ruso nombres de Ж/Ш; chino diferencia carácter y pinyin; francés pide explícitamente la grafía PH para la sílaba practicada. Italiano usa famiglia/scena y portugués casa, con ejemplos conectados también en la enseñanza previa. Las tareas que piden una palabra completa se presentan como dictados; portugués conserva una tarea de completar ca＿a con s y audio de la palabra como ayuda explícita. Siete pruebas de datos/evaluación aprobadas. Verificación UI directa de inglés: ship y chair aceptados y explicación de chair coherente. Pendiente recorrido actualizado de los otros seis y verificación acústica. Árabe sigue pendiente; los ejercicios restantes de copia y bloques también requieren revisión pedagógica.
- Los dictados permiten una instrucción editorial revisada (`dictation_instruction`), necesaria para distinguir grafía, carácter y pinyin. Se mantiene el texto genérico para instrucciones antiguas que podrían revelar la respuesta.
- Ampliación de tipografía CJK: `qa_cjk_line_breaks.mjs` pasó 16 combinaciones (dos tarjetas japonesas y dos chinas, a 320/390/768/962 px). Comprueba geometría de cada línea, ausencia de puntuación de cierre al inicio, ausencia de desbordamiento horizontal y pulsación efectiva de continuar. Evidencia: `docs/qa_cjk_line_breaks_ui.json`. Cubre estos ejemplos, no todas las tarjetas del catálogo.
- Tipografía CJK: observado un punto japonés aislado en una línea en `jp-book1-bridge-06`. Las tarjetas japonesas/chinas usan ahora salto normal entre caracteres y puntuación estricta, en lugar del corte de emergencia de una cadena indivisible. Comprobación de geometría en navegador a 962×998: los dos caracteres finales de esa frase permanecen en la misma línea. Falta ampliar esta comprobación a más anchos y frases chinas; no es una certificación visual global.
- Regresión actual: 264 pruebas Python aprobadas (44.35 s) y 79 pruebas JavaScript aprobadas. La normalización del desglose ya no convierte una palabra sin traducción en la glosa literal «false»; descarta ese elemento incompleto y conserva las lecturas TTS declaradas. Es una protección reproducida con datos de prueba, no un recuento de errores observados en el catálogo. Caché actual v148 para servir las correcciones recientes.
- A2.1 comparación: aclarado «alto (altura física)» en enseñanza, opciones españolas y producción de los diez idiomas, sin cambiar objetivos extranjeros ni claves de audio. Fuente y distinción de sentidos: [Cambridge, alto](https://dictionary.cambridge.org/es/diccionario/espanol-ingles/alto). `clarify_height_sense.mjs` es idempotente y la fuente A2.1 conserva la aclaración. Prueba de datos aprobada en los diez cursos; `qa_height_sense.mjs` recorrió hasta la producción abierta en los diez idiomas, verificó consigna visible, aceptación y ancho móvil a 320×568, sin errores de navegador. Evidencia: `docs/qa_height_sense_ui.json`. No certifica escucha ni adquisición del idioma.
- Las lecciones iniciales de casa explican el referente masculino/femenino de siete expresiones en francés, italiano, ruso y árabe. `qa_home_gender.mjs` recorre las cuatro lecciones a 320×568: comprueba siete notas de enseñanza y catorce apariciones en la ayuda, incluyendo respuestas de significado deliberadamente incorrectas. No hubo errores de navegador ni desbordamiento horizontal; evidencia en `docs/qa_home_gender_ui.json`. Esto verifica presentación y recuperación de las notas, no pronunciación ni aprendizaje efectivo.
- Prioridad confirmada por el usuario: cursos guiados; historias en segundo plano.
- El panel «Entender mi respuesta» recupera la tarjeta con desglose aunque esa tarjeta no tenga campo `meaning`, únicamente cuando las equivalencias registradas para la forma son inequívocas. Se mantiene la protección para formas polisémicas.
- Las palabras del panel ahora tienen el mismo TTS que las tarjetas de enseñanza, incluidas lecturas contextuales declaradas. El recorrido de japonés verifica que は se envía como わ después de responder y abrir la explicación.
- Los ejemplos y audios de repaso declarados ya no desaparecen porque falte el archivo: quedan disponibles para el respaldo TTS de la frase completa.
- `qa_word_tts_boundary.mjs` pasó de nuevo en los diez cursos; diez pruebas focalizadas de ayuda/audio también pasan. La prueba simula reproducción y no certifica pronunciación. Caché actual: v147.
- Pendiente editorial: la cobertura de desgloses sigue siendo parcial en los diez cursos. Esta reparación recupera datos existentes; no constituye revisión lingüística completa del catálogo.

## Corrección de audio y tarjetas largas (2026-09-07)

- Política confirmada por el usuario: desglose palabra por palabra con TTS; frases completas con la grabación disponible y respaldo TTS si falta o falla. Los archivos de ElevenLabs son sintetizados; no se consideran prueba de grabación humana.
- Restaurado el TTS del desglose. El reproductor cancela la reproducción anterior al cambiar de audio o continuar, y evita iniciar el respaldo después de cancelar. El respaldo conserva la frase completa, velocidad lenta y repetición.
- Cuatro frases japonesas iniciales incorporan desglose editorial. La normalización conserva la lectura contextual indicada para は, を y 何. Fuente: [Japan Foundation, Irodori, notas gramaticales](https://www.irodori.jpf.go.jp/assets/data/Grammar_all.pdf). La cobertura japonesa restante sigue pendiente.
- Corregido el centrado de tarjetas largas, que podía dejar el botón superior fuera del área desplazable. `qa_word_tts_boundary.mjs` pasó en los diez cursos a 390×844, tocando desglose y después frase completa; verifica llamadas de reproducción simuladas, no la calidad acústica.
- 71 pruebas JS aprobadas, incluidas prioridad del archivo, respaldo de frase completa y cancelación; después se aprobaron tres pruebas de concordancia contextual. Caché de aplicación v145.
- `docs/qa_phrase_tts_fallback.json`: los diez cursos pasaron el recorrido con la clave de audio retirada del manifiesto de prueba; el botón envía la frase completa al TTS. `docs/qa_full_ui_french_german_latest.json`: repetición completa de francés y alemán, 898 lecciones y 13,795 actividades visibles, sin incidencias ni errores de navegador.
- Aclaradas 364 consignas abiertas y 789 turnos con el significado que deben expresar; corregidas 300 concordancias de «Lo recomiendo», 140 usos ambiguos de «mañana» y 61 coincidencias de Ana/Anna. Portugal/Brasil quedan identificados en la presentación y en 16 tarjetas con vocabulario regional.
- Corregidas 180 apariciones de la traducción de trabajo desde casa: ahora incluye «dos días por semana», frecuencia explícita en los diez idiomas objetivo.
- Las tres preguntas abiertas de género neutro en español aceptan también la forma femenina; `qa_gender_context_ui.json` verifica aceptación, explicación y ancho móvil en francés, italiano y ruso. Los dictados conservan el modelo escuchado.
- Corregidas 222 cadenas de las unidades iniciales de familia en japonés, coreano y chino para enseñar «hermano/hermana menor» donde las formas objetivo especifican menor edad. El ajuste se conserva en los generadores mediante `meaning_overrides.mjs`; `repair_family_meanings.mjs` permite reaplicarlo. Fuentes de contraste: [NIKL, 남동생](https://krdict.korean.go.kr/eng/dicSearch/SearchView?ParaWordNo=26820), [Ministerio de Educación de Taiwán, 弟弟](https://dict.revised.moe.edu.tw/dictView.jsp?ID=45429&la=1&powerMode=0), [Japan Foundation, vocabulario de Irodori](https://www.irodori-online.jpf.go.jp/a2-1/references/vocabulary/assets/pdf/reference-vocabulary-list-en.pdf).
- Añadidas notas de género en 33 apariciones de la pregunta sobre haber estado allí (francés, italiano y ruso). Explican el modelo masculino y la forma femenina; no modifican el texto de los dictados. Fuentes: [Portail linguistique du Canada, participio con être](https://nos-langues.canada.ca/fr/cles-de-la-redaction/participe-passe-avec-etre), [Accademia della Crusca, concordancia del participio](https://accademiadellacrusca.it/it/consulenza/accordo-del-participio-passato/23), [Gramota, género del verbo en pasado](https://gramota.ru/spravka/vopros/240260). Fuente editorial y reaplicación: `qa_gender_notes.json` y `apply_gender_notes.mjs`.

## Implementado y comprobado

- Restauradas 331 grabaciones sintetizadas en francés, alemán y coreano, reutilizadas por las 1,079 actividades antes afectadas. Los 331 archivos se decodifican y tienen duración válida. La escucha lingüística de cada grabación sigue pendiente; el manifiesto registra su voz, origen y estado de revisión.
- Reparadas las diez preguntas con una sola opción y el contraste coreano que solo variaba por puntuación.
- Reparada la producción japonesa: copia coherente, bloques disponibles y dictado cuyo texto esperado coincide con su audio.
- Consignas de copia coherentes en los diez cursos; las actividades por bloques describen sus controles.
- Las actividades de reproducción de una frase aprendida se presentan como «Recuerda la expresión». Esto aclara el alcance actual, pero no sustituye una evaluación abierta.
- Incorporadas equivalencias específicas para preguntar opiniones en los diez idiomas y para los ejemplos de inglés/coreano rechazados durante QA. Es una lista inicial, no cobertura de todas las paráfrasis.
- La tolerancia general a erratas ya no permite cambios de significado por distancia textual. Solo se activa si el autor declara una actividad de tolerancia ortográfica.
- La respuesta correcta de selección se resalta y se muestra en el feedback. Producción muestra la respuesta aceptada y la explicación disponible.
- Los botones de reglas nombran el ejemplo que reproducen.
- Limpiados los tres valores mezclados en las unidades de los cursos y las fuentes de reglas chinas/rusas. L01/1092 y sus derivados se corrigieron; queda la revisión auditiva descrita abajo.
- Grabación cancelable, limpieza del reconocedor al finalizar y protección contra respuestas asíncronas de otra actividad.
- Navegación visible a 320 px y contenedores que pueden ajustarse al ancho.
- Cambios de propietario serializados y protección contra copiar una cuenta a otra. Probados con IndexedDB real y cuentas simuladas, sin conectar al servicio remoto.
- Oculto Podcast cuando no tiene pistas; guardia para modos vacíos.
- Declarado que HS-AC01 aún no tiene explicaciones, evitando solicitar el archivo inexistente. Explicaciones existentes compartidas en memoria.
- Auditor extendido a los 51,476 ejercicios calificables, incluidos producción, diálogos y construcción por bloques.
- Preparada migración 019 con cinco lecciones alemanas y HF007. Pendiente de aplicar a Supabase.
- Caché de aplicación v145 e inclusión de los módulos nuevos para uso sin conexión.

## Coincidencias de traducción y ortografía (2026-09-07)

- Árabe: ya no se funden automáticamente ا/أ/إ/آ ni ى/ي. Se permite omitir vocalización opcional; no se borran letras distintas. Prueba específica y regresiones de producción aprobadas.
- Clasificadas las 429 alertas concretas: 415 formas compartidas con al menos el sentido presentado y 14 preguntas de nombres/deletreo. El registro editorial `course-authoring/qa_identity_review.json` conserva objetivo, respuesta y consigna exactos; un cambio invalida la clasificación. No constituye una certificación externa ni implica que las palabras compartan todos sus usos/pronunciación.
- Las preguntas sobre nombres propios ahora piden identificar lo que representan; el deletreo de Berger se identifica como tal, no como una traducción idéntica. Notas de nombres conservan la enseñanza de pronunciación.
- Aclarados `venir de` (origen frente a pasado reciente ante infinitivo) y `cura` (tratamiento/cuidado en el ejemplo, no el sacerdote español). Referencias: [Larousse, venir](https://www.larousse.fr/dictionnaires/francais-espagnol/venir/80453), [Treccani, cura](https://www.treccani.it/vocabolario/cura/).
- El evaluador conserva diacríticos latinos en lugar de borrar diferencias como où/ou, schön/schon, è/e y avó/avô. Acepta codificaciones Unicode equivalentes y las variantes declaradas por el autor. Un fallo solo de diacríticos muestra una explicación específica. Referencias de contraste: [OQLF, où/ou](https://vitrinelinguistique.oqlf.gouv.qc.ca/21461/la-grammaire/les-pronoms/pronoms-relatifs/ou-employe-comme-pronom-relatif-ou-adverbe), [Treccani, è/e](https://www.treccani.it/enciclopedia/e-o-e_%28La-grammatica-italiana%29/).
- Suite JS: 60 pruebas aprobadas. `qa_result_variants.mjs` conserva aceptación/rechazo en los diez idiomas y añade comprobaciones de acentos en los cuatro ejemplos latinos aplicables. `qa_identity_content.mjs` recorre cuatro lecciones afectadas. Estos recorridos no demuestran aprendizaje ni exactitud acústica.
- Reaplicar `node scripts/review_identity_content.mjs` tras regenerar los cursos. Auditor actual: 0 errores, 0 advertencias, 415 coincidencias revisadas informativas. Cero advertencias no sustituye la revisión lingüística del contenido restante.

## Vínculos entre reglas y preguntas (2026-09-07)

- Revisadas las cuatro alertas `tested_before_taught`: las reglas de posición vocálica y consonante final sí estaban enseñadas antes en Hangul, pero el detector no relacionaba preguntas con ejemplos diferentes. No se añadieron explicaciones duplicadas ni se desactivó la comprobación.
- Campo `teaching_refs` vincula cuatro preguntas con nueve tarjetas anteriores. Es compatible con cualquier curso; estos cuatro casos confirmados estaban en coreano. El auditor rechaza referencias inexistentes, futuras o a otras preguntas y exige enseñanza anterior en la misma lección.
- El feedback recupera las reglas vinculadas y ofrece un botón por ejemplo, nombrando el bloque que reproduce. La ayuda aparece después de comprobar, no revela las notas antes de responder.
- Reaplicar `node scripts/link_hangul_teaching.mjs` tras regenerar Hangul. No modifica respuestas, grabaciones ni progreso de cuentas.
- Auditor global de diez cursos: 0 errores y 0 alertas de enseñanza previa detectadas; las coincidencias concretas se clasificaron como se describe arriba. El detector no certifica por sí solo la progresión pedagógica.
- Pruebas: `tests/guided_teaching_links.test.mjs` valida referencias y recuperación. `scripts/qa_teaching_links.mjs` recorre las siete lecciones de fundamentos con errores deliberados y comprueba que los nueve ejemplos con archivo disparan el reproductor (la salida headless se instrumenta con un stub de `play()`); no evalúa acústicamente la pronunciación. Evidencia: `docs/qa_teaching_links_ui.json`.

## Registro: pedir ayuda en contexto (2026-09-07)

- Añadida una petición contextual por idioma en la primera lección de `b1-1-register`, justo después de enseñar y reconocer la petición correspondiente. Diez actividades nuevas; no se añaden unidades ni se cambia el progreso guardado.
- La situación identifica al interlocutor y exige el tratamiento respetuoso practicado. Se aceptan alternativas explícitas de esa actividad, sin ampliar dictados ni establecer un clasificador general de formalidad.
- Notas específicas sobre tono, formas verbales y tratamiento. Las formas directas usadas como controles no se califican como universalmente incorrectas: simplemente no son los modelos solicitados para esta práctica. Se conserva el aviso sobre respuestas válidas no registradas.
- El audio sigue siendo el del modelo original, identificado en la interfaz. No se generaron grabaciones para las alternativas ni se afirma que ese audio las reproduzca.
- Fuente editorial: `course-authoring/qa_register_requests.json`. Reaplicar `node scripts/apply_register_requests.mjs` después de regenerar cursos; ejecución idempotente y conservación de notas previas.
- `tests/register_requests.test.mjs`: secuencia de enseñanza, alternativas, rechazo de controles directos, ausencia de respuesta, política y clave de audio. Suite JS actual: 51 pruebas aprobadas; Python de producción: 23.
- `scripts/qa_register_requests.mjs` recorre las diez lecciones afectadas en navegador, incluyendo enseñanza, selección, escucha y la nueva petición. Evidencia en `docs/qa_register_requests_ui.json`; el recorrido usa respuestas conocidas para comprobar el funcionamiento, no demuestra adquisición del idioma.
- Referencias de contraste: [British Council, peticiones con could/would](https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/requests-offers-invitations), [OQLF, conditionnel de politesse](https://vitrinelinguistique.oqlf.gouv.qc.ca/24148/la-grammaire/le-verbe/temps-grammaticaux/conditionnel/valeur-modale-du-conditionnel), [OQLF, vous/tu y variación regional](https://vitrinelinguistique.oqlf.gouv.qc.ca/25140/la-redaction-et-la-communication/protocole-et-activites-publiques/contextes-demploi-du-vouvoiement-et-du-tutoiement), [Lingolia, Konjunktiv II](https://deutsch.lingolia.com/de/grammatik/verben/konjunktiv), [MOE, 您](https://dict.revised.moe.edu.tw/dictView.jsp?ID=3112&la=1&powerMode=0), [Bunpro, ていただけませんか](https://bunpro.jp/ja/grammar_points/134). Estas referencias apoyan puntos concretos, no certifican todas las notas ni todos los cursos.

## Respuestas alternativas: consecuencia (2026-09-07)

- Diez alternativas nuevas, una por idioma, para expresar el resultado del proyecto retrasado. Son frases completas, no reglas de sustitución. Referencias y alcance en `QA_RESULT_VARIANTS.md`.
- Admitidas en traducción de significado y preguntas abiertas, incluidos turnos de diálogo. No amplían dictados, copias, transcripciones, transformaciones ni bloques; una política explícita distinta de `meaning` prevalece sobre equivalencias compartidas.
- El feedback distingue una alternativa aceptada del modelo original de la explicación y del audio disponible. Sin grabaciones nuevas.
- `scripts/qa_result_variants.mjs` y `docs/qa_result_variants_ui.json`: veinte comprobaciones de navegador (aceptación/rechazo por idioma) a 320×568. Las negaciones que cambian la idea no se aceptan.
- `tests/guided_result_variants.test.mjs`: diez pruebas parametrizadas con controles de negación, copia, dictado, políticas y diálogo. No certifican todas las paráfrasis ni su pronunciación.

## Siguiente mejora: aprender del feedback (2026-09-07)

- Panel «Entender mi respuesta» dentro del ejercicio, accesible desde «Ver explicación». Conserva la respuesta escrita, muestra el modelo, recupera notas/desgloses de la misma unidad y permite repetir el audio explícitamente vinculado. No genera traducciones ni audios por inferencia.
- Contraste de distractores de significado y escucha únicamente cuando existe una equivalencia inequívoca en la unidad. Las formas polisémicas no recuperan una explicación arbitraria. La producción abierta conserva el aviso de que una formulación no registrada puede ser válida.
- Veinte notas específicas sobre consecuencia/concesión (dos por cada uno de los diez idiomas), aplicadas a 300 actividades o turnos. No representan una revisión completa del catálogo.
- Contexto de persona explícito antes de responder en los ejemplos japonés y coreano de cansancio/trabajo. Es contexto añadido al ejercicio, no una afirmación de que la frase original tenga sujeto o género explícitos.
- Los desgloses y notas de los ejercicios calificables pasan al feedback posterior, evitando revelar el texto de un dictado antes de responder. Las pantallas de enseñanza conservan la explicación previa.
- Sin grabaciones nuevas en esta tanda. El usuario aclaró que se refería a TTS. Las grabaciones locales anteriores siguen pendientes de revisión auditiva.
- Fuente de contraste para la nota francesa: [Académie française: bien que introduce una concesión](https://www.academie-francaise.fr/laurence-d-france). Esto no certifica las demás frases ni todo el contenido.
- Reaplicar `node scripts/apply_learning_notes.mjs` después de regenerar los cursos; el parche editorial es idempotente y conserva textos/audio originales. Fuente mantenible: `course-authoring/qa_cause_effect_notes.json`.
- `docs/qa_learning_feedback_coverage.json` inventaría presencia de notas/desgloses y una muestra de faltantes por idioma. Presencia no equivale a exactitud, y ausencia no implica por sí sola que un ejercicio sencillo sea incorrecto.

## Evidencia

- `docs/qa_family_meanings_ui.json`: tres lecciones completas, doce tarjetas de enseñanza y veinticuatro respuestas comprobadas, con resultados finales y sin errores de navegador. En la revisión visual adicional se detectó y corrigió el tamaño del carácter aislado: `font:inherit` en el botón anulaba el tamaño tipográfico de enseñanza. Captura posterior del navegador confirma que 妹 vuelve a mostrarse grande y legible.
- `scripts/qa_learning_feedback.mjs` y `docs/qa_learning_feedback_ui.json`: 40 actividades focalizadas en los diez cursos (producción, dictado, significado y escucha), contraste de distractores, nota antes/después de responder, contexto y diseño a 320×568; sin errores de navegador. Comprueba la clave del audio, no su pronunciación.
- `tests/guided_learning_feedback.test.mjs`: recuperación de notas, contraste en ambos sentidos, distractores desconocidos y polisemia. Suite JS: 31 pruebas aprobadas; producción y teclado virtual también aprobados. Suite Python de producción: 23 pruebas aprobadas.
- `qa_full_ui_after_repairs.json`: 10 cursos, 452 unidades, 4,303 lecciones, 63,980 actividades visibles y 4,303 resultados; 0 incidencias UI y 0 errores de navegador. Audio simulado durante el recorrido; integridad física comprobada aparte. Este recorrido se ejecutó tras los arreglos estructurales, antes de las últimas equivalencias y ajustes de feedback, que tienen pruebas focalizadas adicionales.
- `scripts/qa_repair_smoke.mjs`: variantes inglesas aceptadas; cancelar voz, error sin voz y continuar escribiendo; navegación a 320×568 y ausencia de Podcast vacío.
- `scripts/qa_owner_isolation.mjs`: cambios de sesión repetidos, regreso a invitado y segunda cuenta vacía sin contaminación.
- `tests/qa_regressions.test.mjs`: bloques con distractores/repeticiones, etiquetas, variantes semánticas excluidas del dictado, erratas, cola de propietarios y finalización/cancelación de voz.
- Último auditor estructural: 0 errores, 415 coincidencias revisadas informativas y 0 advertencias detectadas de contenido evaluado antes de enseñanza.

## Pendiente: calidad de aprendizaje

Nueva evidencia de correspondencia audio/evaluación: `qa_reading_audio_alignment.json` registra 15 señales en 22 actividades de producción etiquetadas como lectura en los diez cursos. Incluye explicaciones que dicen «Escuchaste» sin audio y respuestas que no corresponden al texto declarado del audio (inglés: audio `see`, respuesta `SH · CH`). Son señales para revisión, no 15 errores acústicos certificados. Las comprobaciones estructurales verdes anteriores no cubrían esta condición. Priorizar reparación editorial de estos ejercicios conservando el objetivo pedagógico; no sustituir una prueba auditiva por copia y considerarla resuelta.

Prioridad señalada por el usuario: secuencia inicial de sonidos y lectura. Caso coreano documentado con identificadores y criterios en `QA_BEGINNER_SEQUENCE.md`; reorganización reservada para la mejora posterior solicitada. Las pruebas previas de referencias didácticas no certifican que los prerrequisitos estén suficientemente enseñados.

1. Ampliar la revisión de explicaciones repetitivas: primer lote de veinte notas completado y mecanismo de consulta implementado. Queda el resto del contenido; no sustituirlo masivamente por otro mensaje genérico.
2. Ampliar variantes por intención y registro en todas las unidades. Lote de consecuencia ampliado por igual en los diez idiomas; las 364 preguntas y 789 turnos todavía requieren revisión sistemática de sus respuestas.
3. Continuar con ambigüedades de persona/género: contextualizado el ejemplo de cansancio/trabajo en coreano y japonés; faltan los demás casos.
4. Resueltas las cuatro advertencias de secuencia y clasificadas las coincidencias concretas. Continuar la revisión real de progresión y de usos/contextos de las formas compartidas.
5. Revisar cada audio nuevo y contrastar pronunciación/texto en el catálogo restante.
6. L01/1092: texto, traducción, explicación, fuentes y dos temas corregidos con `repair_l01_help.mjs`. Se reutiliza un MP3 existente del curso, con procedencia y checksum; el original se conserva. Pendiente revisión auditiva y de continuidad de la voz del personaje, declarada en `audio_provenance`. `tests/l01_help_repair.test.mjs` verifica coherencia de referencias y hash de explicación.
7. Revisar aprendizaje A0–A1 en los diez idiomas con el mismo criterio; continuar después con A2–B1. No hay certificación lingüística completa todavía.
8. Aumentar producción contextual, gramática consultable, ayuda desde errores y práctica de pronunciación.
9. Revisión visual adicional del espacio de teclado, feedback largo y navegación por teclado/lector de pantalla.
10. Aplicar migración SQL y comprobar sincronización real en el entorno de publicación.

## Infraestructura de pruebas

La suite Python del Web Player vuelve a ejecutarse desde su propia carpeta: se añadió un módulo de compatibilidad local para las funciones puras que comprueba `test_web_library.py`; el publicador completo sigue viviendo en el proyecto padre y no se incorpora al artefacto público. Resultado actual: 58 pruebas Python aprobadas. La migración local de catálogo sigue pendiente de aplicación remota.

## Producción guiada y ensayo conversacional (2026-09-09)

- Recorrida en navegador la producción china de Identidad hasta el ensayo guiado final. Las dos situaciones muestran explícitamente el significado en español, aceptan las respuestas enseñadas y el resultado indica cuántos turnos coinciden con el modelo.
- «Ver explicación» del ensayo recupera cada turno por separado, su respuesta, significado y audio de esa frase; no mezcla respuestas aceptadas irrelevantes ni hereda una serie de ejemplos de otra actividad.
- La práctica oral opcional se puede omitir sin bloquear el flujo y deja claro que puede repetirse desde Repaso. Esto comprueba la ruta de aprendizaje; no certifica la calidad acústica de las grabaciones.
- Auditoría global posterior: 0 errores y 0 advertencias estructurales en 10 cursos; 789 turnos guiados con consigna de significado explícita, respuesta y modelo.
- Validación de esa tanda: 120 pruebas JavaScript y 58 pruebas Python aprobadas.

## Etiqueta coherente en práctica oral (2026-09-09)

- La pantalla `speak_and_transcribe` ahora explica las dos vías disponibles: decir la frase en voz alta o escribirla y pulsar «Comprobar». Antes el encabezado ofrecía voz, pero la instrucción auxiliar solo mencionaba escritura.
- Se incrementó la caché a `hanstory-shell-v185` y se añadió una regresión de presentación.

## Auditoría de audio de lectura (2026-09-09)

- El detector de correspondencia audio/respuesta ya separa palabras completas; antes podía marcar «oye» dentro de «proyecto» como si fuera una instrucción auditiva.
- Tras corregir ese falso positivo, las 22 actividades de lectura de los diez idiomas quedan sin advertencias nuevas. Se conservan únicamente cinco asociaciones contextuales revisadas (pinyin/nombre de letra frente a grafía), marcadas como informativas y no como equivalencias acústicas.

## Contexto regional en saludos A1 (2026-09-09)

- Las tarjetas de «bon matin», «Chamo-me Ana.» y «좋은 아침이에요» ahora incluyen una nota breve de uso y registro. No se cambiaron respuestas ni audios; se evita presentar una variante regional o una fórmula menos general como si fuera universal.
- Se aplicó de forma idempotente con `scripts/apply_identity_usage_notes.mjs` a 21 actividades y se añadió una prueba por idioma. Caché actualizada a `hanstory-shell-v186`.
- Referencias de contraste: [OQLF sobre «bon matin»](https://vitrinelinguistique.oqlf.gouv.qc.ca/22656/les-emprunts-a-langlais/emprunts-morphologiques/emploi-de-bon-matin), [Infopédia sobre «chamar-se»](https://www.infopedia.pt/dicionarios/portugues-estrangeiros/chame), [KBS World sobre «좋은 아침이에요»](https://world.kbs.co.kr/service/contents_view.htm?board_seq=362066&id=&lang=e&menu_cate=learnkorean&page=1).

La suite posterior a estas notas queda en 131 pruebas JavaScript y 58 pruebas Python aprobadas; la auditoría guiada continúa en 0 errores y 0 advertencias.

## Prerrequisitos de producción A1.1/A1.2 (2026-09-09)

- Se auditó cada traducción, dictado, construcción, completado, pregunta abierta, práctica oral y turno de diálogo de los diez cursos. Las respuestas completas ya aparecen en actividades anteriores; los huecos de una frase reutilizan vocabulario que ya fue presentado.
- Se añadió `tests/production_prerequisites.test.mjs` para impedir que un checkpoint futuro introduzca un modelo o palabra sin enseñanza previa. Resultado al añadirla: 130 pruebas JavaScript aprobadas; la suite actual suma 131 con la regresión de audio por ejemplo.

## Secuencia inicial y texto duplicado en enseñanza (2026-09-09)

- El recorrido inicial coreano ya no pide leer una sílaba cuyos componentes todavía no se han enseñado: el bloque inicial presenta la estructura abstracta y las vocales/consonantes se enseñan antes de sus escuchas.
- Las escuchas de vocales coreanas ya no revelan la respuesta en la consigna; usan sílabas enseñadas y la pantalla separa enseñanza visual de discriminación auditiva.
- En las introducciones, la nota genérica «Primero te lo enseñamos…» solo aparece cuando la actividad no tiene ya una explicación propia. Esto elimina la duplicación visible detectada en la primera tarjeta del hangeul sin ocultar información.
- La caché subió a `hanstory-shell-v191`. Verificación manual en navegador: la introducción muestra una sola explicación y la lección de vocales comienza enseñando ㅏ con su ejemplo 아. La siguiente tanda de audio por ejemplo actualiza la caché a `v192`.
- Barrido de las diez unidades de fundamentos de lectura: ninguna actividad `listening_choice` contiene la respuesta o la grafía objetivo como token visible dentro de la consigna. Las coincidencias aparentes de la letra `Q` dentro de «Qué» se descartaron con límites de palabra Unicode.
- `tests/foundations_sequence.test.mjs` convierte ese criterio en una regresión transversal: cada escucha debe tener un modelo enseñado antes, incluso en repasos, y no puede revelar la respuesta en su texto.

## Registro formal en identidad A1.1 (2026-09-09)

- Se corrigió la mezcla entre tratamiento formal y traducción informal en alemán y portugués. `Wie heißen Sie?` y `Como se chama?` ahora se presentan como «¿Cómo se llama?» en enseñanza, traducción, producción y diálogo guiado.
- Las actividades afectadas incluyen una nota de uso: en alemán se aclara `Sie` frente a `du`; en portugués se indica que la forma es formal o neutral y se contextualizan alternativas brasileñas frecuentes. No se alteraron respuestas objetivo ni audios.
- Aplicación idempotente: `scripts/apply_identity_register_repairs.mjs`; regresión: `tests/identity_register_repairs.test.mjs`. Caché actualizada a `hanstory-shell-v187`.
- Verificación manual en navegador: los checkpoints alemán y portugués muestran la consigna «¿Cómo se llama?» al cargar, sin arrastrar la formulación informal anterior.
- La misma revisión reveló el mismo patrón en francés (`Comment vous appelez-vous ?`) y ruso (`Как вас зовут?`); ambos quedan alineados con «¿Cómo se llama?» y llevan una nota sobre `vous`/`вас` como tratamiento formal o plural. También se actualizaron las opciones de selección para que la respuesta visible siga siendo elegible.
- Verificación manual adicional: los checkpoints francés y ruso muestran la consigna formal al cargar. Caché actualizada a `hanstory-shell-v190`; la auditoría global volvió a 0 errores y 0 advertencias.
- La reparación de francés y ruso se extendió a las unidades posteriores que reutilizaban esas frases (67 actividades cambiadas en total en esta pasada), incluidos repasos, preguntas y puentes de lectura; se conservaron las formas informales cuando el objetivo era realmente informal (`Wie heißt du?`, `Comment tu t’appelles ?`, etc.).

## Audio por ejemplo en tarjetas de lectura inicial (2026-09-09)

- La revisión transversal detectó tarjetas que mostraban varias grafías pero reproducían un único sonido, a veces el nombre de una letra distinta del ejemplo (`a · e · i · o · u` con solo `a`, o `ã · õ` con `eme`). Eso no permitía saber qué botón correspondía a cada elemento.
- Se añadieron botones explícitos por ejemplo en las tarjetas agrupadas de fundamentos de inglés, alemán, italiano, portugués, ruso y árabe. Las palabras, sílabas, vocales y nombres de letras quedan separados; cuando no hay archivo local, el reproductor puede usar el respaldo TTS según la política existente.
- La interfaz ya no convierte también el símbolo agrupado en un botón ambiguo si la tarjeta declara ejemplos de audio individuales. El mensaje «Cada botón indica exactamente lo que oirás» ahora es verdadero y verificable.
- `tests/foundations_sequence.test.mjs` añade una regresión: una tarjeta de fundamentos con varias grafías y audio debe declarar al menos dos ejemplos identificables. Caché actualizada a `hanstory-shell-v192`.
- Verificación manual: la lección italiana muestra cinco botones para las sílabas `ca/co/cu/ce/ci`; al pulsar `ca`, la interfaz anuncia claramente que usa voz sintetizada porque no hay grabación local.
- Validación de la tanda: 131 pruebas JavaScript y 58 pruebas Python aprobadas; auditoría estructural y auditoría de correspondencia de audio sin errores ni advertencias nuevas.

## Recorrido móvil y límites de audio (2026-09-09)

- El recorrido completo a 320×568 cubrió los diez cursos: 4.303 lecciones y 63.990 actividades, sin incidencias de interfaz, desbordamientos horizontales ni errores del navegador.
- La prueba específica de feedback en 320×568 cubre producción, dictado, significado y escucha en los diez idiomas. Distingue correctamente «Ver explicación» para aciertos de «Ver explicación y modelo» para errores, conserva la respuesta escrita y mantiene el modelo fuera del dictado antes de responder.
- La accesibilidad básica de la primera lección de cada curso queda verificada: navegación etiquetada, progreso como `progressbar`, selección con `aria-pressed` y feedback anunciado como `status` en una región `aria-live`.
- La frontera de audio queda verificada en los diez cursos: cada palabra del desglose usa TTS; las frases completas usan su archivo local cuando existe y cambian a TTS cuando se simula que falta el archivo. No se mezclan ambos canales.
- La prueba de feedback se ajustó para aceptar las dos etiquetas intencionales del botón de explicación; antes fallaba por exigir literalmente la variante de acierto aun cuando el ejercicio era incorrecto. No fue un fallo de la interfaz.

## Auditorías focalizadas de contexto y enlaces (2026-09-09)

- Las lecciones de identidad, hogar y familia revisadas conservan sus notas de uso, género y significado en enseñanza y en feedback; los recorridos móviles no encontraron errores de navegador ni desbordamientos.
- Las variantes equivalentes se aceptan en los diez idiomas, mientras las negaciones y cambios de significado se rechazan; la explicación muestra la respuesta del alumno y el contexto sin duplicar el modelo cuando ya acertó.
- Los enlaces de enseñanza de Hangul recuperan exactamente las reglas declaradas. Las fuentes que no tienen audio no muestran un botón vacío; las nueve fuentes con archivo sí disparan el reproductor instrumentado.
- Se corrigieron cuatro auditores que todavía exigían etiquetas o secuencias anteriores a la reducción de ruido visual: ahora validan la experiencia actual («.jp-review-given», «Ver explicación y modelo» en errores e introducción solo cuando se presenta).

## Audio identificable en formas agrupadas (2026-09-09)

- La auditoría transversal encontró 255 actividades en 28 unidades donde una tarjeta de enseñanza o una pregunta evaluable mostraba varias formas separadas por `/` pero ofrecía un único audio agrupado. Eso hacía imposible saber qué forma correspondía al sonido reproducido; el segundo lote cubre también secuencias de letras separadas por espacios como `А К М О Т`.
- Una pasada editorial adicional añadió 174 declaraciones de ejemplo en 14 unidades para patrones que tienen un único ejemplo completo (`an / en → enfant`, partículas coreanas en una frase) o varios ejemplos dentro del audio (`pala / palla`). Los primeros quedan etiquetados como patrón y ejemplo, sin fingir que existe una grabación aislada de cada variante.
- Cada forma ahora tiene su propia tarjeta y controles de audio. Se reutiliza la grabación local cuando existe; si falta, la tarjeta declara el respaldo TTS en lugar de fingir que hay una grabación equivalente. La misma regla se aplica a las preguntas de significado y escucha, no solo a las pantallas de enseñanza.
- La generación futura queda protegida en `scripts/build_guided_courses.mjs`; la migración aplicada a los JSON existentes es idempotente mediante `scripts/add_grouped_audio_examples.mjs`.
- Verificación manual: en inglés, la tarjeta `V / B` muestra `very` y `berry` con botones separados; al avanzar a la pregunta de significado se conservan los dos ejemplos, seis controles de audio y ninguna reproducción agrupada ambigua. En ruso, `А / К / М / О / Т` muestra cinco botones de letra y usa TTS individual cuando no hay grabación local.
- Regresión añadida: `tests/grouped_audio_examples.test.mjs`; `scripts/label_single_grouped_audio_examples.mjs` mantiene la pasada editorial idempotente. Suite actual: 132 pruebas JavaScript y 58 Python aprobadas; auditoría estructural: 0 errores y 0 advertencias. Caché actualizada a `hanstory-shell-v195`.

## Variantes de partículas coreanas (2026-09-09)

- Las primeras reglas de estructura ya no solo dicen para qué sirve cada partícula: explican cuándo elegir cada variante (`은/는`, `이/가`, `을/를`, `이에요/예요`) según termine la palabra en consonante o vocal.
- `있어요/없어요` ahora distingue explícitamente afirmar y negar existencia o posesión. La nota aparece tanto al aprender como en las preguntas de significado y escucha.
- Fuente mantenible: `src/data/zero_courses.js`; aplicación idempotente a los cursos publicados: `scripts/apply_korean_particle_notes.mjs`; regresión: `tests/korean_particle_notes.test.mjs`.
- Verificación: la prueba nueva y la suite completa comprueban las cinco parejas; 133 pruebas JavaScript y 58 Python pasan; caché actualizada a `hanstory-shell-v196`.

## Contexto de reglas y ejemplos en A0 (2026-09-09)

- Se amplió el mismo criterio a las reglas iniciales de inglés, japonés, chino, alemán, ruso, italiano y francés. Las explicaciones ahora dicen qué cambia entre variantes: vocal corta/larga, partículas japonesas は/へ/を, aspiración del pinyin, artículos alemanes/italianos/franceses y sonidos de letras cirílicas parecidas al alfabeto latino.
- Las tarjetas de artículos italianos y franceses incorporan los ejemplos que faltaban (`lo zaino`, `uno studente`, `les livres`) y cada ejemplo tiene su botón de audio/TTS; ya no se enseña una lista de variantes con solo dos ejemplos.
- Fuente mantenible: `src/data/zero_courses.js`; aplicación idempotente a los JSON existentes: `scripts/apply_rule_context_repairs.mjs`; regresión transversal: `tests/rule_context_repairs.test.mjs`.
- Durante la comprobación apareció y se corrigió un desajuste de opciones al cambiar una explicación. La suite completa queda en 134 pruebas JavaScript y 58 Python; caché actualizada a `hanstory-shell-v197`.

## Contrastes japoneses con ejemplos separados (2026-09-09)

- La regla `に / で` ya no reproduce una cadena ambigua: muestra por separado `学校に行きます。` (destino) y `学校で勉強します。` (lugar de la acción).
- El mismo tratamiento se extendió a `は / へ / を`, `あります / います`, los contadores y `何`: cada contraste queda visible como ejemplo independiente.
- Cada situación tiene sus propios botones de escuchar y lento; se reutilizan las grabaciones japonesas existentes, y cuando falta una grabación el botón usa TTS del navegador en vez de quedar inutilizado.
- Fuente y render: `src/data/zero_courses.js`, `src/app.js`, `assets/navigation.css`; regresión añadida a `tests/rule_context_repairs.test.mjs`.
- Verificación: suite completa 134 pruebas JavaScript y 58 Python, auditoría estructural sin errores ni advertencias; caché actualizada a `hanstory-shell-v198`.
