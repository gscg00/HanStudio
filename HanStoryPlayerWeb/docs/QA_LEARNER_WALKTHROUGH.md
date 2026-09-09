# Recorrido pedagógico desde la interfaz

> Este registro está en orden cronológico inverso. Las observaciones de recorridos antiguos se conservan para trazabilidad, pero pueden describir una versión anterior; para el estado vigente prevalecen las entradas superiores y `QA_REPAIR_STATUS.md`.

## Producción y error · inglés/japonés v183–v184

En la producción de lectura inglesa, `TH` se presenta como dos bloques (`T` y `H`) que deben ordenarse; la actividad deja de ser un botón único sin decisión. En japonés, al responder mal qué se aprende primero, la explicación conserva «Hiragana» y las notas de la regla, pero no repite los audios de las cinco vocales. El audio permanece en la tarjeta donde se enseña y en tareas auditivas explícitas.

## Japonés inicial · la práctica no repite las tarjetas v182

En `japanese-reading-00-01`, la tarjeta de hiragana muestra las cinco grafías y sus controles de escucha individuales. Al continuar, la pregunta conceptual sobre qué se aprende primero conserva el conjunto de grafías como referencia visual, pero no repite los quince controles de audio. Esto mantiene el recurso sonoro donde enseña y deja la comprobación posterior breve y concentrada.

## Coreano · vocales horizontales v181

Se recorrieron las tres tarjetas (`ㅗ`, `ㅜ`, `ㅡ`), sus tres escuchas y la pregunta espacial final. Las escuchas ofrecen sílabas que ya aparecieron como tarjetas en este tramo o en el anterior, por lo que `어` funciona como contraste conocido, no como una grafía nueva. La pregunta final muestra `ㅇ + ㅜ = 우`: `ㅇ` ya se explicó como soporte silencioso y no obliga a reconocer una consonante aún no presentada. Así, la tarea pregunta únicamente por la posición de la vocal horizontal.

## Chino inicial · explicación que no repite el acierto v180

En `chinese-reading-00-01` se recorrió la introducción, se seleccionó correctamente «Inicial m, final a y primer tono» y se abrió «Ver explicación». El detalle ya no repite la respuesta aceptada: muestra el análisis de `mā` (inicial, final y tono), el ejemplo audible y la regla de uso de pinyin. La confirmación breve «Respuesta aceptada» queda en el pie, donde indica el resultado sin convertir el detalle de aprendizaje en ruido visual. La misma regla se aplica a los cursos guiados: el modelo se muestra en el detalle cuando se falla o cuando es necesario explicar una variante.

## Coreano inicial · no adelantar una pronunciación v180

La primera actividad de hangeul ahora explica solamente que un bloque tiene posición inicial, vocal y final. No usa `한`, no reproduce audio ni pide identificar letras individuales todavía. Así se conserva la secuencia: estructura primero; grafías y sonidos de vocales/consonantes después; bloques pronunciables y batchim cuando ya se conocen los componentes.

## Biblioteca e historias · recorrido móvil v178

El recorrido en 320×568 y el repetido en 1440×1000 abrieron los diez idiomas, los 66 temas y sus 1.344 frases, y recorrieron los siete libros públicos en sus 230 lecciones y 5.422 pasos de reproductor. Se comprobó que texto y traducción coincidieran con sus manifiestos, que cada frase tuviera controles utilizables y que las 2.927 rutas de audio fueran accesibles. No aparecieron errores de navegador, desbordamiento horizontal ni incidencias de interfaz. La reproducción fue simulada para poder recorrer todo el catálogo: confirma controles y rutas, no certifica la calidad acústica de las voces.

## Japonés inicial · tarjetas de vocales v178

La primera exposición de `あ い う え お` conserva solamente cada grafía y sus controles de escucha. No repite por tarjeta una etiqueta como «vocal en hiragana» ni una explicación que no aporta significado. Cuando todos los ejemplos son así de mínimos, la cuadrícula aplica además el formato compacto. Se incrementó la versión de la caché para que una instalación que retenía la interfaz anterior reciba los archivos nuevos; la prueba automatizada confirma las cinco grafías, la ausencia de etiquetas/pseudo-traducciones y el modo compacto.

## Audio físico · integridad de recursos v177

Se escanearon los 9.140 archivos de `library/courses/*/audio` con ffprobe en paralelo: ninguno devolvió duración nula, lectura fallida ni tamaño menor de 1 KB. El auditor de cursos ya comprueba además que las claves de manifest usadas por las actividades tienen archivo físico. Esto reduce el riesgo de botones que apunten a recursos dañados, pero no equivale a evaluar pronunciación, acento, inteligibilidad, sincronía entre texto y voz o naturalidad de TTS; esas cualidades requieren escucha humana o evaluación acústica específica.

## Auditoría transversal posterior a v177

El auditor estructural de los diez cursos termina con 0 errores y 0 advertencias; las 411 coincidencias de forma/traducción son cognados o formas iguales revisadas individualmente e informativas. La auditoría de correspondencia de audio en producción de lectura termina con 0 señales pendientes y cinco relaciones contextuales documentadas. La auditoría de retroalimentación marca muchas respuestas sin nota adicional, pero el desglose por tipo muestra que casi todas son parejas léxicas de selección/escucha cuya explicación es exactamente la traducción ya visible; no se añadió relleno repetitivo. La búsqueda de marcadores editoriales en datos de curso no encontró TODO/FIXME/placeholder expuesto: «todo» aparece como palabra válida o clave de audio. Estas auditorías no reemplazan revisión lingüística humana o escucha acústica de todas las voces.

## Árabe inicial · sukun y shadda no fingen ser un audio v177

La auditoría de correspondencia de lectura detectó una asociación falsa: la tarjeta «ْ ّ» y su producción pedían escribir esos signos, pero usaban el audio del nombre de la letra ش («شين»); incluso la retroalimentación afirmaba que los signos se habían escuchado. Sukun indica ausencia de vocal y shadda duplicación consonántica: no constituyen por sí solos una pronunciación reproducible. Se retiró el audio de la tarjeta y de las dos actividades de producción, y se cambió la última a completar los signos ortográficos sin prometer escucha. Generador y reparador actualizados; prueba específica, auditor integral y auditor de audio pasan. Quedan cinco señales de correspondencia intencional: nǐ→你, casa→s y nombres de letra rusos→grafía; su enunciado sí declara esa relación.

## Diez cursos · recorrido móvil integral v176

El auditor de interfaz recibió soporte de viewport explícito y recorrió los diez cursos en paralelo a 390×844: 10 mapas, 452 unidades, 4.303 lecciones y 63.990 actividades, incluidas 12.514 tarjetas de enseñanza, 51.476 actividades evaluables, 2.602 de producción, 78.889 activaciones de control de audio y 4.303 pantallas de resultado. El resultado fue 0 incidencias UI y 0 errores de navegador: no detectó desbordamiento horizontal, contadores incongruentes, botones sin nombre, respuestas no seleccionables, controles de audio requeridos ausentes ni pantallas inaccesibles. Es una verificación de flujo y geometría en móvil con audio simulado; no demuestra que el sonido se perciba bien, que los textos sean lingüísticamente correctos o que la experiencia con red lenta sea equivalente.

## Árabe · recorrido integral de interfaz v176

El recorrido automatizado real, en ventana aislada y modo QA, completó el mapa, 45 unidades, 379 lecciones y 5.669 actividades del curso árabe; incluye 1.049 tarjetas de enseñanza, 4.620 actividades evaluables, 257 de producción, 7.147 controles de audio y 379 pantallas de resultado. No detectó actividad que no renderizara, contador atascado, desbordamiento horizontal, control sin nombre, respuesta imposible de seleccionar, audio requerido sin control ni error de navegador. Este resultado verifica flujo e interfaz bajo audio simulado; no verifica la calidad fonética real, naturalidad de TTS ni exactitud lingüística más allá de las reglas ya auditadas.

## Portugués · recorrido integral de interfaz v176

El recorrido automatizado real, en ventana aislada y modo QA, completó el mapa, 45 unidades, 378 lecciones y 5.659 actividades del curso portugués; incluye 1.046 tarjetas de enseñanza, 4.613 actividades evaluables, 257 de producción, 7.135 controles de audio y 378 pantallas de resultado. No detectó actividad que no renderizara, contador atascado, desbordamiento horizontal, control sin nombre, respuesta imposible de seleccionar, audio requerido sin control ni error de navegador. Este resultado verifica flujo e interfaz bajo audio simulado; no verifica la calidad fonética real, naturalidad de TTS ni exactitud lingüística más allá de las reglas ya auditadas.

## Italiano · recorrido integral de interfaz v176

El recorrido automatizado real, en ventana aislada y modo QA, completó el mapa, 45 unidades, 428 lecciones y 6.370 actividades del curso italiano; incluye 1.250 tarjetas de enseñanza, 5.120 actividades evaluables, 257 de producción, 7.840 controles de audio y 428 pantallas de resultado. No detectó actividad que no renderizara, contador atascado, desbordamiento horizontal, control sin nombre, respuesta imposible de seleccionar, audio requerido sin control ni error de navegador. Este resultado verifica flujo e interfaz bajo audio simulado; no verifica la calidad fonética real, naturalidad de TTS ni exactitud lingüística más allá de las reglas ya auditadas.

## Alemán · recorrido integral de interfaz v176

El recorrido automatizado real, en ventana aislada y modo QA, completó el mapa, 45 unidades, 448 lecciones y 6.894 actividades del curso alemán; incluye 1.411 tarjetas de enseñanza, 5.483 actividades evaluables, 257 de producción, 8.370 controles de audio y 448 pantallas de resultado. No detectó actividad que no renderizara, contador atascado, desbordamiento horizontal, control sin nombre, respuesta imposible de seleccionar, audio requerido sin control ni error de navegador. Este resultado verifica flujo e interfaz bajo audio simulado; no verifica la calidad fonética real, naturalidad de TTS ni exactitud lingüística más allá de las reglas ya auditadas.

## Francés · recorrido integral de interfaz v176

El recorrido automatizado real, en ventana aislada y modo QA, completó el mapa, 45 unidades, 450 lecciones y 6.901 actividades del curso francés; incluye 1.413 tarjetas de enseñanza, 5.488 actividades evaluables, 257 de producción, 8.368 controles de audio y 450 pantallas de resultado. No detectó actividad que no renderizara, contador atascado, desbordamiento horizontal, control sin nombre, respuesta imposible de seleccionar, audio requerido sin control ni error de navegador. Este resultado verifica flujo e interfaz bajo audio simulado; no verifica la calidad fonética real, naturalidad de TTS ni exactitud lingüística más allá de las reglas ya auditadas.

## Inglés · recorrido integral de interfaz v176

El recorrido automatizado real, en ventana aislada y modo QA, completó el mapa, 45 unidades, 448 lecciones y 6.870 actividades del curso inglés; incluye 1.403 tarjetas de enseñanza, 5.467 actividades evaluables, 257 de producción, 8.340 controles de audio y 448 pantallas de resultado. No detectó actividad que no renderizara, contador atascado, desbordamiento horizontal, control sin nombre, respuesta imposible de seleccionar, audio requerido sin control ni error de navegador. Este resultado verifica flujo e interfaz bajo audio simulado; no verifica la calidad fonética real, naturalidad de TTS ni exactitud lingüística más allá de las reglas ya auditadas.

## Coreano · recorrido integral de interfaz v176

El recorrido automatizado real, en ventana aislada y modo QA, completó el mapa, 45 unidades, 447 lecciones y 6.847 actividades del curso coreano; incluye 1.400 tarjetas de enseñanza, 5.447 actividades evaluables, 257 de producción, 8.360 controles de audio y 447 pantallas de resultado. No detectó actividad que no renderizara, contador atascado, desbordamiento horizontal, control sin nombre, respuesta imposible de seleccionar, audio requerido sin control ni error de navegador. Este resultado verifica flujo e interfaz bajo audio simulado; no verifica la calidad fonética real, naturalidad de TTS ni exactitud lingüística más allá de las reglas ya auditadas.

## Japonés · recorrido integral de interfaz v176

El recorrido automatizado real, en ventana aislada y modo QA, completó el mapa, 47 unidades, 467 lecciones y 6.010 actividades del curso japonés; incluye 1.035 tarjetas de enseñanza, 4.975 actividades evaluables, 289 de producción, 7.633 controles de audio y 467 pantallas de resultado. No detectó actividad que no renderizara, contador atascado, desbordamiento horizontal, control sin nombre, respuesta imposible de seleccionar, audio requerido sin control ni error de navegador. Este resultado verifica flujo e interfaz bajo audio simulado; no verifica la calidad fonética real, naturalidad de TTS ni exactitud lingüística más allá de las reglas ya auditadas.

## Ruso · recorrido integral de interfaz v176

El recorrido automatizado real, en ventana aislada y modo QA, completó el mapa, 45 unidades, 434 lecciones y 6.442 actividades del curso ruso; incluye 1.270 tarjetas de enseñanza, 5.172 actividades evaluables, 257 de producción, 7.923 controles de audio y 434 pantallas de resultado. No detectó actividad que no renderizara, contador atascado, desbordamiento horizontal, control sin nombre, respuesta imposible de seleccionar, audio requerido sin control ni error de navegador. Este resultado verifica flujo e interfaz bajo audio simulado; no verifica la calidad fonética real, naturalidad de TTS ni exactitud lingüística más allá de las reglas ya auditadas.

## Chino inicial · compara tonos solo después de conocerlos v176

Recorrido real: la primera escucha de tonos seguía a la tarjeta de mā, pero sus respuestas nombraban también el segundo y cuarto tono, que aún no se habían presentado. Se reorganizó únicamente «Los cuatro tonos»: introducción, las cuatro tarjetas mā/má/mǎ/mà y después las cuatro discriminaciones auditivas. Se conservan IDs, audios, alternativas y evaluación. Recorrido visual v176 confirmado: 1/8 mā, 2/8 má, 3/8 mǎ, 4/8 mà y primera pregunta 5/8 con primer/segundo/cuarto ya enseñados; también conserva solo Lento y ×3 bajo el botón central. Transformación incorporada al generador y reparador, con prueba de orden e idempotencia; auditor completo sin errores. Pendiente: evaluación acústica de la diferencia tonal.

## Chino · recorrido integral de interfaz v176

El recorrido automatizado real, en ventana aislada y modo QA, completó el mapa, 45 unidades, 424 lecciones y 6.328 actividades del curso chino; incluye 1.237 tarjetas de enseñanza, 5.091 actividades evaluables, 257 de producción, 7.773 controles de audio y 424 pantallas de resultado. No detectó actividad que no renderizara, contador atascado, desbordamiento horizontal, control sin nombre, respuesta imposible de seleccionar, audio requerido sin control ni error de navegador. Este resultado verifica flujo e interfaz bajo audio simulado; no verifica la calidad fonética real, naturalidad de TTS ni exactitud lingüística más allá de las reglas ya auditadas.

## Comprensión auditiva · un control central por escucha v175

En la primera discriminación tonal china aparecían dos botones que ejecutaban la escucha normal: el botón grande central y «▶ Escuchar» debajo de las respuestas. La interfaz conserva el control grande para la escucha normal y deja abajo solo Lento y ×3, además de Pista. La excepción no cambia actividades que necesitan reproducir la opción seleccionada. Una prueba de componente y el auditor completo pasan; pendiente recorrido visual con la caché v175.

## Japonés inicial · tarjetas de vocales sin ruido visual v173

La captura de la interfaz mostró que cada vocal repetía «VOCAL EN HIRAGANA» y «Signo de una vocal; no es una palabra para traducir.». En una cuadrícula de dos columnas ese texto se comprimía en una columna angosta y competía con los controles. Las cinco tarjetas ahora contienen únicamente la grafía y sus tres controles de audio; la explicación permanece una sola vez en la pantalla didáctica. El componente compartido admite ejemplos mínimos sin inventar una etiqueta genérica y los controles ya caben en una sola fila. Recorrido visual confirmado tras actualizar la caché v173; auditor de los diez cursos sin errores y 110 pruebas JS aprobadas. Pendiente: escuchar los cinco archivos de TTS/grabación.

## Ruso inicial · pares vocálicos sin etiquetas repetidas v174

La misma revisión visual encontró que las tarjetas de А/Я, О/Ё, У/Ю comprimían «VOCAL» y su glosa en una columna angosta. La explicación de pares, deslizamiento y suavización ya está antes de la cuadrícula, por lo que las seis tarjetas quedaron como grafía más audio. Se hizo lo mismo con Э/Е y Ы/И, preservando los dos enunciados didácticos y sus puntos de contraste. Datos y generador se actualizaron juntos; prueba específica y auditor de los diez cursos sin errores. Pendiente: recorrido visual después de activar la caché v174 y escucha acústica de los archivos.

## Japonés · moras y conservación de audio v171

Recorrido real de las cuatro pantallas de «Moras y cinco vocales»: las cinco vocales se enseñan con ejemplos separados; después se explica ひと como dos moras. La pregunta «¿Cuántas moras tiene ひと?» inicialmente no tenía control de escucha aunque la tarjeta previa sí. Se corrigió el componente compartido: si una pregunta conceptual remite a una tarjeta anterior de la misma grafía y aquella declara audio, muestra normal/lento/repetición con esa clave. Verificado visualmente: «▶ Escuchar ひと», Lento y ×3 aparecen en la pregunta. Seis pruebas de soporte de interfaz pasan. No se certificó que la grabación se oiga correctamente ni que la explicación de mora sea suficiente para ん/っ posteriores.

## Japonés inicial · ejemplos de vocales y katakana v170

Se detectaron dos asociaciones engañosas: tarjetas con あ い う え お solo reproducían あ, y «ア · 日» reproducía い. Se corrigieron datos, generador y reparador: las tarjetas de vocales exponen cinco ejemplos explícitos con normal/lento/repetición; la tarjeta mixta solo ofrece como ejemplo audible ア, aclarando su correspondencia con あ. Recorrido visual confirmado tras reiniciar el servidor local y refrescar la caché: los cinco controles aparecen en Hiragana y también desde la primera pregunta; Katakana muestra solo «Escuchar ア». Diez pruebas focalizadas aprobadas, incluida una contra regresiones de asociación grafía/audio. No se certificó la calidad acústica de los archivos ni se atribuyó una lectura única a 日 fuera de contexto.

## Alcance explícito del resultado v169

Los nuevos reintentos se identifican mediante retryOnly tanto en memoria como en el resultado persistido. La pantalla muestra «REINTENTO TERMINADO» y aclara que el porcentaje corresponde a las preguntas repetidas, no a una evaluación completa. El indicador se conserva junto al intento cuyo resultado se guarda como mejor puntuación. No se infiere retroactivamente para resultados antiguos. Prueba de persistencia lógica añadida; pendiente recorrido visual de esta etiqueta. No cambia el desbloqueo ni la política de XP.

## Reintento completo y persistencia v168 · navegador

Recorrido horizontal de siete pantallas, con error deliberado 으 por 우: resultado 3/4, 75 %. Confirmado el nuevo cierre ㅇ + ㅜ = 우. «Repetir errores» presenta tres tarjetas (오, 우, 으) y luego únicamente la pregunta fallada (4/4 pantallas). Al responder 우, resultado 1/1, 100 %, sin contar enseñanza como aciertos. Tras recargar y finalizar la carga, el resultado conserva 1/1 y 100 %: no aparece 3/1. Se otorgaron 20 XP al aprobar; al recargar se muestra +0 XP nuevo. Se verifican recorrido, evaluación y persistencia, no reconocimiento auditivo real (respuestas de prueba conocidas). Queda pendiente distinguir visualmente «reintento» de «lección terminada» y revisar si la política de aprobación tras un subconjunto comunica adecuadamente el dominio alcanzado.

## Puntuación persistida de reintentos v168

Inspección de `completeGuidedLesson`: combinaba el máximo de aciertos históricos con el total del intento reciente, permitiendo guardar 3/1 tras 3/4 y reintento 1/1. Corregido para conservar porcentaje/aciertos/total juntos del intento con mejor porcentaje; empate favorece el reciente. Prueba reproduce ambos pasos y un fallo posterior que no degrada el mejor resultado. También verifica que las tarjetas de enseñanza no cuentan como preguntas. Nueve pruebas focalizadas aprobadas. Pendiente recorrido visual/persistencia tras recargar; no se han migrado resultados históricos inconsistentes ni cambiado la política de aprobar mediante reintentos.

## Reintento con enseñanza v167

En el resultado horizontal, «Repetir errores» abrió directamente una sola pregunta (1/1), sin volver a enseñar. Se añadió `retryWithTeaching`: antepone las referencias didácticas explícitas y anteriores de las preguntas falladas, deduplicadas. No incorpora referencias futuras o parcialmente inválidas ni preguntas acertadas. Dos pruebas específicas aprobadas; módulo incluido en caché offline. Pendiente recorrido del reintento actualizado y verificación de puntuación; no se afirma resuelto el repaso de actividades sin referencias explícitas.

## Horizontal · recorrido completo de interfaz v165

Se recorrieron las siete pantallas hasta resultado: 3/4 correctas, 75 %, sin avance por exigir 85 %. Error deliberado 으 en la escucha de 우; la ayuda conserva la indicación corregida de lengua y labios, con audios separados de 오/우/으. Respuestas elegidas para verificar evaluación, no certificación de discriminación auditiva. La última pregunta aún introducía ㄱ antes de enseñarla: v166 usa el modelo conocido ㅇ + ㅜ = 우; el cierre vertical usa ㅇ + ㅏ = 아. Cambio centralizado en la transformación usada por generador y reparadores. Cuatro pruebas focalizadas aprobadas; pendiente comprobar visualmente estos dos modelos finales. El resultado observado corresponde a v165, no a una recarga de los últimos datos.

## Vocales horizontales y articulación de ㅡ · v165

Recorrido real hasta 4/7: 오, 우 y 으 se presentan antes de la escucha. La primera pregunta ofrece 우/어/오; 어 pertenece a la lección vertical anterior. La tarjeta 으 decía «vocal central», sin explicar la lengua. Se corrigió en datos y generador: elevar la parte posterior de la lengua sin redondear los labios y comparar con 우. Fuente: [Instituto Nacional de la Lengua Coreana, explicación de pronunciación](https://www.korean.go.kr/front/page/pageView.do?page_id=P000098), que describe ㅡ como vocal alta posterior no redondeada. Cuatro pruebas focalizadas aprobadas. Pendiente verificar visualmente el texto corregido, terminar las preguntas horizontales y escuchar críticamente los archivos; no se afirma haber completado esta lección.

## Vocales verticales · recorrido real v163

Verificado en navegador: las tarjetas 아, 어 e 이 aparecen en 1/7, 2/7 y 3/7; la primera escucha llega en 4/7 con esas tres alternativas y sin revelar una vocal en la consigna. Al elegir deliberadamente 어 en lugar de 아, «Ver explicación» recupera las tres tarjetas con sus botones de audio. No se certificó acústicamente la reproducción. La tarjeta 어 aún remitía a 오, enseñada después: v164 corrige datos y generador para comparar con 아 y anticipar 이 dentro de esta misma lección. Cuatro pruebas focalizadas aprobadas; pendiente visualizar ese último texto y recorrer vocales horizontales.

## Secuencia de vocales coreanas v163

Las lecciones de vocales verticales y horizontales presentan sus tres tarjetas antes de las escuchas. Seis preguntas limitan sus alternativas a sílabas presentadas hasta ese punto y ya no revelan la vocal mediante «contiene ㅏ»: piden la sílaba escuchada. IDs y audios conservados; enlaces a las tarjetas del grupo para repasar tras el error. Transformación compartida por generador y reparadores, idempotencia probada. Pasaron las 102 pruebas JS previas y una nueva prueba específica. Pendiente recorrido visual de este orden y verificación acústica; no se da por resuelta la lección introductoria del sistema ni los contrastes posteriores.

## Alfabeto inglés · secuencia v161 y ayuda comparativa

Recorrido real: introducción, tarjetas A, B, C, D, E y primera escucha en 7/11. Las opciones B/A/C aparecen después de enseñar las tres letras. Respuesta deliberadamente B: la ayuda recupera tarjetas y audios de A/B/C. Se detectó repetición íntegra de la explicación de A antes de las referencias; v162 elimina únicamente notas idénticas ya contenidas en referencias. Once pruebas focalizadas aprobadas; pendiente verificar visualmente la deduplicación. El recorrido no certifica pronunciación audible ni las otras seis interfaces.

La reparación de secuencia abarca los grupos de alfabeto de inglés, francés, alemán, italiano, portugués, ruso y árabe: enseñanza del grupo antes de las escuchas y alternativas limitadas a letras presentadas. `alphabet_sequence.mjs` compartido por generador y reparación; siete pruebas comprueban cada opción y la idempotencia. Conserva IDs y audios. Coreano, japonés y chino mantienen pendiente su secuencia específica.

## Verificación transversal tras v160 · 2026-09-08

Suite Python completa: 264 pruebas aprobadas en 47,89 s. La prueba llamada `test_reading_foundations_teach_before_testing_and_require_full_mastery` solo exige dos actividades antes de la primera evaluable y una prueba final al 100 %; no demuestra que cada distractor o sonido se haya enseñado. No usar ese resultado como certificación de secuencia pedagógica.

Inspección conservadora de escuchas en fundamentos, excluyendo repasos, pruebas y producción: preguntas con al menos una opción que no aparece literalmente en target/audio/audio_examples de enseñanza previa / escuchas examinadas: árabe 27/28, inglés 25/26, francés 27/29, alemán 29/30, italiano 20/21, portugués 25/26, ruso 32/33, coreano 15/17. Ejemplos iniciales: B/C tras enseñar A; Б/В tras А; 어/이 tras 아. Es una señal de cobertura, no un contador definitivo de errores: el texto explicativo puede enseñar una forma sin esos campos. Chino devuelve 4/4 porque las opciones son descripciones de tonos, por lo que necesita análisis semántico separado; japonés no tiene listening_choice en ese archivo y el cero no certifica su curso. Próxima revisión: preparación explícita de las alternativas antes de discriminación auditiva, con criterios específicos por sistema de escritura.

## Coreano · recuperación de enseñanza comprobada v160

Recorrido real en vocales verticales: leer «Conoce ㅏ», elegir deliberadamente 어 y abrir «Ver explicación». La ayuda ya recupera ㅇ + ㅏ = 아, el papel silencioso de ㅇ inicial, la posición de la vocal y la aproximación a la a española. Se verificó un único botón «Escuchar 아» dentro de la ayuda, tras eliminar el duplicado. El componente compartido conserva ahora sound_hint, uso y contexto de las referencias didácticas.

Dieciséis escuchas de Hangul están vinculadas explícitamente a sus tarjetas anteriores (misma clave de audio e ID de origen validado); reparador y generador conservan esos enlaces. Las 94 pruebas JS pasan. Esto no reorganiza la introducción del alfabeto: siguen pendientes los distractores aún no enseñados y la diferencia entre reconocimiento visual y discriminación auditiva. No se certificó acústicamente el archivo.

## Controles conceptuales y datos de ejemplos · 2026-09-08

Recorrido real v157: la pregunta GN muestra bagno con sus controles explícitos en lugar de botones sin clave. Medición DOM: tarjetas y filas no presentan desbordamiento horizontal en el tamaño de ventana probado (tarjeta de unos 555 px); no equivale a verificar todos los tamaños móviles. Se respondió correctamente y se avanzó: la explicación GLI/SC actualizada aparece íntegra. Reproducción audible no certificada.

La batería general detectó cuatro ejemplos sin significado: bagno, famiglia, scena y casa. Se completaron en datos, reparadores y generador; tras aplicar las reparaciones pasan las 94 pruebas JS. Caché v158 para distribuir los datos corregidos. Pendiente comprobar estas traducciones añadidas en pantalla y seguir revisando la secuencia y discriminación auditiva, sin tomar la integridad estructural como certificación lingüística global.

## Ajustes posteriores v156

La etiqueta común de `select_translation` pasa a «Elige la respuesta»: el tipo también incluye preguntas conceptuales, por lo que no debe prometer siempre una traducción. En italiano se sustituyó «SCI ante e/i» por SC delante de e/i y se vinculó explícitamente scena con e; se retiró el término «palatal» sin explicar y se delimitó la instrucción de GLI al ejemplo famiglia. Datos y generador corregidos. Referencia consultada: [Treccani, Grafemi](https://www.treccani.it/enciclopedia/grafemi_%28Enciclopedia-dell%27Italiano%29/), correspondencias SC + e/i y GL + i. Siete pruebas de checkpoints aprobadas; pendiente revalidación visual v156 y evaluación auditiva más allá de recordar una regla.

## Italiano GN / GLI · ayuda verificada en navegador 2026-09-08

Con la implementación v155, recorrido real de las cuatro pantallas de `italian-reading-00-09`: explicación GN, respuesta deliberadamente incorrecta «Como g + n separadas», apertura de «Ver explicación», explicación GLI/SCI y lectura de su pregunta. La ayuda de GN ahora muestra una sola tarjeta bagno con controles normal, lento y repetición; conserva los puntos de enseñanza. Esto resuelve la omisión visual registrada abajo, pero no certifica la pronunciación ni la reproducción audible.

Pendientes pedagógicos observados, no aprobados por el mero funcionamiento del ejercicio: «palatal» no se explica al principiante; el encabezado GLI/SCI y la frase «SCI ante e/i» no distinguen claramente SC + E del ejemplo scena; la pregunta final solo comprueba si GLI se separa y no demuestra reconocimiento de los dos sonidos. Ambas preguntas conceptuales llevan la etiqueta «Elige el significado», aunque preguntan por lectura, no traducción. Revisar estas diferencias al mejorar enseñanza y evaluación, sin confundir respuesta acertada con competencia adquirida.

## Italiano GN · verificación 2026-09-08

Tras recargar v154, la tarjeta GN muestra bagno con botones de escucha normal, lenta y repetición. Se respondió deliberadamente «Como g + n separadas»: el feedback recupera los puntos de enseñanza y la indicación de leer el grupo unido. Sin embargo, no incluye el botón de bagno que existe en la tarjeta. Pendiente extender la ayuda a los `audio_examples` de la fuente didáctica. Verificación visual realizada; pronunciación del archivo todavía no certificada.

Reparación posterior de GN: la tarjeta `italian-reading-00-09-a-teach` conecta ahora el archivo existente de bagno mediante un ejemplo explícito, con reproducción normal, lenta y repetida. Fuente generadora corregida y reparación idempotente `repair_italian_gn_audio.mjs`. Archivo local comprobado; 13 pruebas focalizadas de ayuda y correspondencia aprobadas. Pendiente verificación visual de esta tarjeta actualizada y escucha del archivo. Las preguntas conceptuales asociadas no tenían clave de audio propia y conservan ese estado.

## Enlaces entre cursos y ejemplos italianos

Corregido el cambio de idioma mediante hash en `src/app.js`: antes solo el curso activo escuchaba esa navegación y usaba su mapa como alternativa al no reconocer la ruta del otro idioma. Ahora la aplicación selecciona el idioma del enlace antes de abrir el curso. Verificado en navegador: desde el checkpoint portugués, el enlace a `italian-reading-00-09` abre «GN» con breadcrumb Italiano. Tras responder la pregunta de GN, GLI/SCI presenta dos ejemplos separados: famiglia y scena, cada uno con reproducción normal, lenta y repetida. Esto verifica presentación y navegación, no calidad acústica.

Pendiente confirmado durante ese recorrido: GN todavía muestra «gn: bagno» con audio declarado enne; la reparación de GLI/SCI no cubre esa tarjeta.

## Verificación de la reparación portuguesa

Recorridas las cuatro actividades de `portuguese-reading-foundations-production-checkpoint` tras la actualización v152. El dictado presenta «Escribe la palabra completa que escuches» y acepta casa; la tarea final muestra ca＿a, pide únicamente la letra ausente y acepta s. La explicación confirma una sola S y el botón de ayuda identifica casa. No se certificó la pronunciación del archivo. Las tareas intermedias de copia y bloques siguen siendo práctica mecánica pendiente de mejora.

Al intentar navegar mediante URL desde este checkpoint a `italian-reading-00-09`, la interfaz terminó en el mapa portugués. Hay que reproducir y diagnosticar el cambio de idioma por enlaces directos antes de atribuirlo a un fallo concreto; la tarjeta italiana sigue pendiente de verificación visual.

Verificación posterior del orden: con el servidor local activo, la pregunta A de inglés mostró B/A/C y aceptó A en segunda posición. Antes de levantar el servidor, una pestaña nueva seguía mostrando A/B/C desde la copia sin conexión; por tanto, abrir una pestaña nueva no bastaba para certificar los archivos actuales. El servidor HTTP se reinició en 127.0.0.1:8080 y la recarga permitió verificar la corrección real.

## Inglés · Alfabeto 1 A–E · 2026-09-07

Recorrido completo de las 11 pantallas desde Inicio → Inglés → Curso guiado → Mundo 0 → primera lección. Sin consultar claves de archivos. Modo QA: no se evalúan bloqueos normales del mapa. No se escucharon los audios en este recorrido: se probó expresamente cuánto puede resolverse visualmente.

- La presentación distingue explícitamente nombre de letra y sonidos dentro de palabras. Es una mejora real frente a exigir lectura sin esa distinción.
- Cada pregunta llega inmediatamente después de enseñar la letra que es su respuesta. Se acertaron B–E usando únicamente la tarjeta anterior, sin audio.
- Las cinco preguntas tienen la respuesta correcta en la primera posición: A/B/C, B/C/D, C/D/E, D/E/F, E/F/G. Eso ofrece una estrategia de aprobación ajena a la escucha. F y G ni siquiera se presentan en esta lección.
- Se respondió B deliberadamente en la pregunta de A. La ayuda sí recupera los puntos y explicaciones de la tarjeta A, con botón para su nombre. No ofrece comparación directa A/B. No se afirma que ese contraste sea obligatorio para toda pregunta individual, pero esta lección por sí sola no demuestra discriminación entre nombres.
- Las grafías auxiliares `ay`, `bee`, `see`, `dee`, `ee` aparecen como «Nombre en Inglés», sin aclarar cómo debe interpretar esas grafías alguien hispanohablante que aún no lee inglés. Revisar su utilidad pedagógica junto con audio, sin tratarlas como transcripción española.
- Resultado observado: 80 %, 4/5, no avanza por umbral 85 %. No existe una comprobación mezclada final dentro de esta lección. El resultado no equivale a dominio auditivo.

Corregido después del recorrido: el patrón fijo no era exclusivo de inglés. Se reordenaron de forma determinista 786 preguntas de los fundamentos de los diez cursos; las primeras lecciones ya utilizan más de una posición y cada curso usa las tres posiciones a lo largo de su unidad. El orden v3 se conserva en los generadores de lectura y hangeul y `rotate_foundation_quiz_options.mjs` permite reparar datos existentes de forma idempotente. Esto elimina la pista posicional; no resuelve todavía la práctica inmediatamente posterior ni demuestra discriminación auditiva.

Pendiente: presentar un conjunto pequeño antes de contrastarlo; añadir recuperación mezclada sin la pista de la tarjeta inmediatamente anterior; conservar ayuda útil y verificar audios por separado. Estas son observaciones de esta lección, no prueba de que todas las unidades tengan el mismo defecto.

## Chino · producción y ensayo guiado · 2026-09-09

Recorrido real de la producción de Identidad desde la primera respuesta escrita hasta el ensayo conversacional final.

- Las situaciones del ensayo muestran el significado en español antes de cada campo: «¿Cómo te llamas?» y «Soy de México.»; la consigna vuelve a decir qué expresar y en qué idioma.
- Las respuestas enseñadas `你叫什么名字？` y `我来自墨西哥。` se aceptan en sus campos correspondientes. El resultado informa «2 de 2 turnos coinciden con los modelos».
- La explicación desplegable separa «Tu turno 1» y «Tu turno 2», muestra la frase, su significado y el botón de audio de esa frase. No aparecen ejemplos heredados de una tarjeta anterior.
- La práctica oral opcional ofrece «Omitir práctica oral», informa que puede repetirse desde Repaso y permite continuar; no convierte la falta de micrófono en un bloqueo.

Esto verifica claridad, correspondencia entre consigna y respuesta y funcionamiento del feedback. No certifica por sí solo la pronunciación acústica.

## Coreano · vocales verticales · 2026-09-07

Método: navegación real en localhost, sin consultar la clave de respuestas del archivo durante el recorrido. Se retomó la actividad 2/7 ya respondida por el usuario; no se cuenta como recorrido completo desde cero. No se certificó la calidad acústica.

### Observaciones verificadas

- 3/7, «Conoce ㅓ»: explica vocal abierta/posterior, advierte no convertirla en o española y propone distinguir 어 de 아 y 오. Solo ofrece reproducción de 어, no comparación directa con los otros dos ejemplos citados.
- 4/7: se eligió deliberadamente 오 en lugar de 어. «Ver explicación» mostró únicamente el modelo 어, «어 contiene la vocal ㅓ» y reproducción de 어. No recuperó la explicación articulatoria de la tarjeta anterior ni ofreció el contraste seleccionado.
- 5/7, «Conoce ㅣ»: explica su semejanza con i y su posición a la derecha de ㅇ. Esa explicación basta para responder visualmente la pregunta siguiente.
- 6/7: la consigna revela ㅣ y las opciones son 이, 아, 우. Se acertó mirando, sin usar audio. Por tanto, ese acierto no prueba comprensión auditiva pese a la etiqueta.
- 7/7: la pregunta de posición se puede resolver con la regla previamente enseñada. El ejemplo usa ㄱ, pero la tarea no exige conocer su sonido; no confundir presencia de letra nueva con prerrequisito necesariamente incumplido.
- Resultado: 75 %, 3 de 4; exige 85 % para avanzar y lista 어 para repasar. Con cuatro preguntas igualmente ponderadas, ese umbral exige en la práctica cuatro aciertos.
- «Repetir errores» abre inmediatamente la misma pregunta fallada, 1/1, sin reenseñanza previa. No demuestra reparación de la confusión; facilita recordar la opción.

### Acciones pendientes de diseño pedagógico

1. Separar reconocimiento visual de discriminación auditiva y formular cada consigna conforme a su objetivo.
2. Proporcionar acceso al contraste mencionado en enseñanza, con audio inequívoco para cada ejemplo y sin adelantar sonidos no enseñados sin presentación.
3. Recuperar la enseñanza pertinente al fallar; acompañar el reintento con explicación útil, no solo la respuesta.
4. Comprobar transferencia con un ejemplo enseñado equivalente, evitando que el repaso sea únicamente recordar la posición de la opción.

No se modificó la secuencia coreana: el usuario reservó su reorganización para una mejora posterior. Resto de cursos: recorrido pedagógico equivalente pendiente; no extrapolar estos hallazgos a todos.
