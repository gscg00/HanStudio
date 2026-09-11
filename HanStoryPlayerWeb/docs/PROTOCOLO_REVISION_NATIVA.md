# Protocolo de revisión nativa

La revisión nativa valida tres cosas que una prueba automática no puede certificar: pronunciación, naturalidad y adecuación regional. Se hace sobre una muestra controlada y después se amplía solo donde aparecen problemas.

## Quién revisa

Se asigna al menos un hablante nativo por idioma, con la variedad indicada en el curso. Para portugués se separan Brasil y Portugal; para árabe se declara si se revisa árabe estándar moderno o una variedad concreta. Si el curso mezcla variedades, se necesitan dos revisores o una etiqueta regional visible.

El revisor debe usar audífonos, un entorno silencioso y un navegador actualizado. No debe corregir el texto durante la primera escucha: primero califica lo que realmente oye.

## Muestra inicial

Se revisan hasta 24 elementos por idioma, con un objetivo de 240 en total. Si una unidad no tiene suficientes audios auditables, se conserva la muestra disponible y el JSON de cobertura deja constancia del faltante:

- 8 tarjetas que enseñan contrastes de lectura o pronunciación.
- 6 preguntas de escucha con sus distractores.
- 4 palabras con desglose y TTS por palabra.
- 4 frases completas con audio grabado o respaldo TTS.
- 2 actividades de producción o diálogo con modelo.

La muestra debe cubrir los casos especiales del idioma: vocales y acento, dígrafos, letras falsas amigas, tonos, moras, signos, consonantes finales y variantes regionales. Si un idioma tiene menos casos en una categoría, se sustituye por otra tarjeta del mismo contraste.

Para generar la lista determinista de trabajo desde el repositorio:

```bash
node scripts/export_native_review_samples.mjs
```

El comando crea [native_review_samples.csv](./native_review_samples.csv) y su copia JSON para revisión o importación en una hoja de cálculo.

## Cómo se revisa cada elemento

1. El revisor escucha el audio normal sin mirar la traducción.
2. Comprueba que la grafía visible, la frase y el audio correspondan exactamente.
3. Escucha el audio lento o repetido y califica la pronunciación.
4. Lee el significado y el contexto, vuelve a escuchar y califica naturalidad y registro.
5. Marca el resultado y escribe un comentario breve cuando la puntuación sea menor que 4.

Se usan estas escalas:

- **Pronunciación:** 5 nativa y clara; 4 correcta con detalle menor; 3 entendible pero marcada; 2 difícil de entender; 1 incorrecta.
- **Naturalidad:** 5 frase que usaría un nativo; 4 aceptable; 3 posible pero poco idiomática; 2 extraña; 1 inaceptable.
- **Adecuación regional:** `sí`, `sí con etiqueta`, `no aplica` o `no`.
- **Sincronía:** `exacta`, `texto incompleto`, `audio incompleto` o `desfase`.

## Regla de aceptación

Un elemento pasa cuando pronunciación y naturalidad son 4 o 5, la sincronía es `exacta` y la variedad regional está clara. Un 1 o 2 en pronunciación, cualquier error de texto/audio o una respuesta regional `no` bloquea el elemento. Un 3 se conserva como revisión editorial pendiente y no debe bloquear una prueba técnica.

Cuando haya dos revisores, una diferencia de más de un punto exige una tercera escucha o un tercer revisor. La decisión final conserva ambas notas y explica la resolución.

## Qué hacemos con un fallo

- Error de archivo o duración: reemplazar el recurso y repetir `audit_audio_integrity.mjs`.
- Texto que no coincide: corregir la actividad o el vínculo de audio; repetir `audit_reading_audio_alignment.mjs`.
- Pronunciación incorrecta: solicitar una nueva grabación a un hablante de la variedad elegida.
- Frase poco natural: corregir texto, traducción, contexto o etiqueta regional; no cambiar solo el audio.
- TTS aceptable pero provisional: conservar `tts_fallback` y dejarlo marcado para una grabación propia.

Después de cualquier corrección se repiten la prueba de la lección afectada, el recorrido móvil y la prueba de frontera archivo/TTS. Los resultados se guardan en [native_review_template.csv](./native_review_template.csv) o en un archivo equivalente con la misma estructura.
