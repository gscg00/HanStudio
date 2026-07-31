# Frases, ejemplos y explicaciones verificadas

Las actividades del curso guiado pueden añadir información didáctica precisa sin que el reproductor intente deducir traducciones o audios.

```json
{
  "word_breakdown": [
    { "text": "저는", "meaning": "yo (como tema)", "note": "저 + 는" },
    { "text": "학생이에요", "meaning": "soy estudiante" }
  ],
  "usage_note": "저는 presenta el tema; el resto aporta la información sobre él.",
  "context_note": "Se usa en una presentación cortés.",
  "audio_examples": [
    {
      "label": "FRASE COMPLETA",
      "text": "저는 학생이에요.",
      "meaning": "Soy estudiante.",
      "audio": "jp-or-ko-audio-key-exacto",
      "slow_audio": "jp-or-ko-audio-key-exacto-lento"
    }
  ]
}
```

- `word_breakdown` solo debe contener significados revisados por una persona.
- `audio_examples` debe usar una clave que exista realmente en el manifiesto de audios del curso. La app no crea nombres de archivo a partir del texto de una explicación.
- Si una tarjeta compara dos sonidos o presenta varias palabras, declara un ejemplo de audio independiente para cada una. No reutilices el audio de una letra como si fuera el de una palabra completa.
- Si no hay un audio exacto, omite `audio_examples`: la interfaz mostrará únicamente el modelo disponible y no afirmará que reproduce un ejemplo diferente.

El generador conserva estos campos desde los datos de curso hasta el JSON publicado. De este modo se puede mejorar el contenido de cada idioma de forma gradual, sin alterar la navegación ni el progreso del alumno.

## Completar desgloses con OpenAI

Las frases que todavía no tengan un desglose pueden enriquecerse sin guardar la
clave en el proyecto:

```bash
node scripts/enrich_guided_phrase_support.mjs --apply
```

El script lee `OPENAI_API_KEY` desde el entorno o desde el `.env` privado de la
raíz, solicita JSON estructurado y guarda el resultado reutilizable en
`course-authoring/generated_phrase_support.json`. Los metadatos escritos a mano
siempre tienen prioridad sobre los generados.

Opciones útiles:

```bash
node scripts/enrich_guided_phrase_support.mjs --language Korean --limit 20
node scripts/enrich_guided_phrase_support.mjs --apply --language French --batch-size 10
```

El desglose generado:

- conserva literalmente la frase y su traducción;
- explica cada segmento en español;
- no añade romanización;
- evita volver a solicitar una frase ya almacenada;
- no genera ni duplica archivos de audio.

En la PWA, cada segmento del desglose se puede pulsar para oírlo mediante la voz
del navegador configurada para el idioma del curso. Esta función no consume
créditos de OpenAI ni ElevenLabs y permanece separada de los audios editoriales
de frases completas.
