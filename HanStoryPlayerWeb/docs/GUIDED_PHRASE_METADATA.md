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
