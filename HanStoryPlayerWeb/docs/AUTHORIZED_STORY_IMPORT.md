# Importación revisada de historias en alemán

`scripts/import_reviewed_story.py` prepara un paquete HanStory a partir de un
JSON que ya tengas derecho a usar. No descarga páginas ni ejecuta OCR: el OCR y
la corrección humana deben llegar en el archivo de entrada.

## Formato mínimo

```json
{
  "code": "HG-CUSTOM-01",
  "title": "Mi libro alemán",
  "subtitle": "A1",
  "description": "Descripción propia",
  "rights": {
    "confirmed": true,
    "holder": "Titular o licencia",
    "basis": "Licencia / obra propia / permiso escrito"
  },
  "chapters": [
    {
      "number": 1,
      "title": "Capítulo 1",
      "summary": "Resumen propio",
      "tracks": [
        {
          "id": "HGC10101",
          "speaker": "Personaje",
          "ocr_text": "Texto devuelto por OCR",
          "reviewed_text": "Texto comprobado manualmente",
          "translation": "Traducción al español",
          "type": "phrase",
          "source_ref": "página/imagen/escena autorizada",
          "manual_reviewed": true
        }
      ]
    }
  ]
}
```

La herramienta rechaza cualquier línea sin `ocr_text`, `reviewed_text`,
`translation`, `source_ref` o `manual_reviewed: true`. Conserva ambos textos y
un diff en `review_report.json`, de modo que las correcciones no se pierdan.
`type` puede ser `phrase` o `word`; si se omite, se usa `phrase`. Esto permite
mantener por capítulo una mezcla de frases de escena y vocabulario contextual.

## Ejecución

```bash
python HanStoryPlayerWeb/scripts/import_reviewed_story.py \
  /ruta/al/material_autorizado.json \
  --output-dir /ruta/de/staging
```

La salida contiene `Audio_Master.csv`, `Audios_Tecnico.txt`, `book.html`,
`project_config.json` con TTS del navegador, un manifiesto provisional y el
informe de revisión. El manifiesto provisional no sustituye la validación del
publicador. Importa el contenido en un libro del Studio, añade audio si lo
deseas y ejecuta la validación habitual antes de publicarlo.
