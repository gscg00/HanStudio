# Práctica productiva en los cursos guiados

Los diez cursos guiados incluyen un checkpoint de producción por unidad. El
checkpoint se genera únicamente a partir de contenido y audio ya publicados:
no llama a ElevenLabs, no crea archivos de audio y no consume créditos.

## Actividades

- Escritura de una traducción sin opciones.
- Dictado con audio normal y lento.
- Construcción con bloques en el orden correcto.
- Completar una forma sin opciones visibles.
- Respuesta abierta.
- Práctica oral opcional mediante el reconocimiento de voz del navegador.
- Ensayo guiado al final de cada unidad.
- Misión de tres situaciones al final de cada etapa.

Las unidades dedicadas a alfabetos, sistemas de escritura y pronunciación no
obligan a traducir explicaciones. En ellas se copian, reconstruyen y dictan
letras, sílabas o grupos que el alumno acaba de aprender.

## Micrófono y privacidad

El micrófono es siempre opcional. El alumno puede escribir la misma respuesta
o elegir **Omitir práctica oral**. La transcripción usa la API de reconocimiento
del navegador con el idioma correcto (`en-US`, `fr-FR`, `ko-KR`, `ja-JP`,
`zh-CN`, etc.). El navegador solicita permiso directamente y HanStudio no
guarda grabaciones.

Si el navegador no ofrece reconocimiento de voz o se pierde la conexión, el
campo escrito sigue disponible y la lección no queda bloqueada.

## Progreso

Las actividades omitidas no penalizan la puntuación. Las respuestas erróneas
sí entran al repaso. La recompensa de XP de una lección es idempotente: recargar
la pantalla de resultado no vuelve a otorgarla.

## Regenerar los checkpoints

```bash
python3 course-authoring/add_guided_course_production.py
```

El script es idempotente: reemplaza solo el checkpoint marcado con
`generatedProduction` y conserva las lecciones originales.

## Pruebas

```bash
python3 -m unittest tests.test_guided_production_data
node tests/guided_production_logic.mjs
node --check src/japanese_course_app.js
node --check src/guided_course_answers.js
node --check src/guided_speech_recognition.js
```

Las pruebas comprueban los diez idiomas, los archivos físicos de audio, la
integridad de respuestas, las misiones de etapa, los fundamentos de lectura,
los códigos de idioma del micrófono y el cálculo de resultados.
