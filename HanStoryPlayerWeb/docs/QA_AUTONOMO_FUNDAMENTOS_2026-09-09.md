# QA autónomo de interfaz y pedagogía — 2026-09-09

Se probó el recorrido inicial de fundamentos de los diez idiomas en `?qa`, con una pasada móvil de 320×568 y otra de escritorio de 1440×1000. Se revisaron mapa, desbloqueo, tarjetas de enseñanza, preguntas, respuesta incorrecta, explicación enlazada, audio y resultado.

La cobertura de fundamentos fue de 10 mapas, 10 unidades, 140 lecciones, 1,183 actividades, 357 tarjetas de enseñanza, 826 actividades evaluables y 40 actividades de producción. Las dos pasadas terminaron con 0 incidencias de interfaz y 0 errores de navegador:

- [Reporte móvil de fundamentos](./qa_foundations_mobile_v199_final.json)
- [Reporte de escritorio de fundamentos](./qa_foundations_desktop_v199_final.json)

También se recorrieron las 4,303 lecciones disponibles de los diez cursos: 0 incidencias y 0 errores de navegador en la pasada completa ([reporte completo](./qa_full_ui_autonomous_2026-09-09.json)). El auditor estructural terminó con 0 errores y 0 advertencias.

## Correcciones pedagógicas aplicadas

- Inglés: la vocal breve /æ/ ahora se modela con `bag`; la tarjeta separa el nombre de la letra /eɪ/ de su sonido dentro de una palabra.
- Alemán, italiano, portugués y ruso: los contrastes usan palabras o nombres de letras que corresponden al modelo escuchado; `ß` se explica como una s sorda, sin convertirlo en una “b”.
- Árabe: las vocales cortas se practican con `بَ بِ بُ`; los signos `sukūn` y `shadda` quedan como reglas visuales y no como audios aislados.
- Japonés: `きゃ` se explica como una mora y `きって` como tres pulsos (`き・っ・て`), con el pequeño `っ` contado explícitamente.
- Coreano: se enseña `ㅎ + ㅏ = 하` antes de presentar `한`; la oposición de `ㅇ` se muestra con `가` y `강`, distinguiendo posición inicial y final.
- Las tarjetas con desglose de palabras muestran TTS por palabra y, cuando existe, un control separado para escuchar la frase completa. Si falta el archivo de la frase, se verifica el respaldo TTS.

## Evidencia técnica

- `node --test tests/*.test.mjs`: **138 passed**.
- `pytest tests -q`: **152 passed**.
- Integridad de audio con `ffprobe`: **9,140 archivos revisados; 0 ilegibles, 0 duraciones cero y 0 archivos demasiado pequeños** ([reporte](./qa_audio_integrity.json)).
- Enlaces de enseñanza, feedback y accesibilidad guiada pasaron para los diez idiomas ([accesibilidad](./qa_guided_accessibility.json), [feedback](./qa_learning_feedback_ui.json), [alineación de audio](./qa_reading_audio_alignment.json)).
- Frases con archivo: los diez idiomas usaron el archivo; al retirar deliberadamente el archivo, los diez usaron el respaldo TTS ([archivo](./qa_word_tts_boundary.json), [respaldo](./qa_phrase_tts_fallback.json)).

La reproducción se verificó mediante invocación real de los controles del navegador. La integridad técnica confirma que los archivos se pueden leer; no certifica acento, naturalidad, calidad fonética ni adecuación regional. La pasada estructural tampoco sustituye una revisión de hablantes nativos. La cobertura de feedback detallado sigue siendo desigual en actividades antiguas, por lo que conviene una revisión editorial posterior de las tarjetas que solo tienen una explicación breve.

## Decisión de alcance

La aplicación es privada y de uso personal. Por decisión del propietario, se acepta esta limitación y no se requiere una ronda adicional con hablantes nativos antes de usarla. El protocolo y la muestra quedan disponibles como mejora opcional si más adelante se publica o se comparte el curso.

Los criterios lingüísticos revisados para japonés y alemán se contrastaron con [Marugoto Plus](https://a1.marugotoweb.jp/en/introduction.php) y las reglas de [Duden sobre ss/ß](https://www.duden.de/sprachwissen/rechtschreibregeln/doppel-s-und-scharfes-s).
