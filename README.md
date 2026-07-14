# HanStory Studio

HanStory Studio es una aplicación local para administrar una colección de libros
de coreano y una sola biblioteca de audios reutilizables. No está limitada a
Libro 1.

## Idea principal

Hay dos niveles claramente separados:

1. `library/master_audio/` contiene cada MP3 una sola vez.
2. `library/books/` contiene los archivos, carpetas organizadas y reportes propios
   de cada libro.

SQLite (`data/hanstory.db`) funciona como catálogo: registra qué significa cada
ID y en qué libros y lecciones aparece. Los MP3 siguen siendo archivos normales;
no se guardan dentro de la base de datos.

## Regla de IDs globales

Un mismo ID puede aparecer en muchos libros y reutilizará el mismo MP3. Por
ejemplo, `P001` puede estar en Libro 1 y Libro 4.

El mismo ID **no puede representar textos diferentes**. Si Libro 2 intenta usar
`P001` para otro texto, tipo o personaje, la validación muestra una colisión y
detiene la generación. Esto evita reutilizar silenciosamente un audio equivocado.

Por eso conviene definir desde el principio una convención global de IDs. Una
opción segura es incluir el código del libro en los audios exclusivos, por ejemplo
`L01-1001`, y reservar IDs comunes como `VOC-P001` para vocabulario compartido.

## Instalación en macOS

Solo se hace una vez:

1. Instala Python 3.10 o posterior desde
   [python.org](https://www.python.org/downloads/macos/).
2. Abre **Terminal**.
3. Escribe `cd `, con un espacio al final.
4. Arrastra la carpeta `hanstory_studio` a Terminal y presiona Enter.
5. Copia y pega estos comandos, uno por uno:

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
```

## Ejecutar la app

Cada vez que quieras abrirla, entra a la carpeta en Terminal y ejecuta:

```bash
source .venv/bin/activate
python3 app.py
```

## Primer uso

1. Abre la pestaña **Voces y ajustes**.
2. Pega tu API key. A su derecha aparecerá **Pendiente de guardar**.
3. Crea un perfil para cada personaje y pega su Voice ID.
4. Configura siempre el perfil `default`.
5. Presiona **Guardar cambios**, en la esquina superior derecha. El estado de la
   API key cambiará a **Guardada localmente**. La app la guarda en `.env`, nunca
   en el código ni en SQLite.
6. Abre **Biblioteca** y presiona **Crear libro**.
7. Para Libro 1 puedes usar, por ejemplo:
   - Título: `El Despertar`
   - Código: `L01`
   - Nivel: `Principiante`
8. Selecciona el libro e importa su CSV y su archivo técnico.
9. Ve a **Libro actual** y presiona **Validar libro**.
10. Ve a **Audios → Personajes y voces**. La app detectará automáticamente los
    personajes de las filas `phrase`. Asigna una voz guardada a cualquiera que
    aparezca como **Falta voz**.
11. Regresa a **Audios → Generación**, presiona **Cargar modelos desde
    ElevenLabs** y elige el modelo por su nombre. Deja activado **Dry run** en la
    primera prueba.

El dry run no llama a ElevenLabs ni consume créditos. Indica cuántos audios son
nuevos, cuántos se reutilizan y qué debe corregirse.

## Modelo, voces y Acting Mode por libro

Cada libro tiene su propio `project_config.json`. Allí se recuerdan el modelo de
ElevenLabs, el modo Acting, la autorización de voz por defecto y las asignaciones
de personajes. Cambiar estas opciones en un libro no afecta a los demás.

En **Audios → Generación** puedes elegir:

- **Cargar modelos desde ElevenLabs**: consulta los modelos disponibles para tu
  cuenta y muestra el nombre junto con su `model_id` real. Por ejemplo,
  `Eleven v3 (eleven_v3)` si está habilitado en tu cuenta.
- **Custom model_id**: permite escribir el identificador manualmente si alguna
  vez hace falta.

La selección guarda tanto `elevenlabs_model_name` como `elevenlabs_model_id` en
el `project_config.json` del libro. Si la consulta falla, se selecciona
`eleven_multilingual_v2` como respaldo. La app nunca genera con un ID vacío. Si
ElevenLabs rechaza un modelo, muestra el error y conserva todos los MP3 que ya
existían.

**Permitir voz por defecto** está desactivado inicialmente. Mientras falte una
voz para algún personaje, la generación se detiene y abre la sección
**Personajes y voces**. Esto evita producir accidentalmente varios personajes
con la misma voz.

Los libros clásicos creados antes de esta actualización conservan su antiguo uso
de la voz `default` para no romper HS-B01, HS-B02, HS-B03 ni HS-B04. Al guardar
sus ajustes por primera vez, esa decisión queda registrada en el proyecto y se
puede desactivar manualmente.

## Columna opcional text_tts

Los CSV anteriores siguen funcionando sin ningún cambio. También se acepta una
sexta columna opcional:

```text
id,type,speaker_or_blank,text,translation_or_blank,text_tts
```

`text` continúa siendo el texto limpio visible en el libro, los nombres de
archivo y los reportes. `text_tts` es únicamente el texto enviado a ElevenLabs.
Si está vacío, se utiliza `text`.

Con **Acting / Variety Mode** activado, `text_tts` puede conservar indicaciones
como `[laughing]`, `[whispering]`, `[angry]` o `[dramatic pause]`. Si Acting Mode
está desactivado, la app retira las marcas entre corchetes antes de enviar el
texto. Las marcas no se agregan al texto visible.

## Podcast / Lección en escucha

La pestaña **Podcast** crea audios de estudio a partir de un proyecto existente:
audiolibro, podcast explicado, shadowing o repaso rápido. Está pensada para
escuchar una lección cuando no puedes leer el Kindle, el HTML o las tarjetas.

El flujo recomendado es:

1. Selecciona un libro en **Biblioteca**.
2. Abre **Podcast**.
3. Elige el modo:
   - **Audiolibro**: escena/historia con narrador y personajes.
   - **Podcast explicado**: profesor en español, escena, frases clave y
     explicación.
   - **Shadowing**: instrucciones de “repite después de mí” y repeticiones.
   - **Repaso rápido**: frases importantes y mini explicación.
4. Ajusta lección inicial/final si no quieres todo el libro.
5. Revisa el prefijo de IDs, por ejemplo `PODB01`.
6. Si quieres práctica con pausas, activa **Escucha activa** en
   **Pausas y repeticiones**.
7. En **Salida de audio**, elige si quieres audios separados, un audio por
   lección o un audio completo del libro.
8. Si elegiste **Podcast explicado**, primero usa **Generar explicación con
   OpenAI** en la sección **Explicación didáctica con OpenAI**.
9. Revisa el JSON del borrador, corrige lo necesario y pulsa
   **Marcar revisado/listo**.
10. Presiona **Aplicar explicación al guion de podcast** o **Generar guion
   editable**.
11. Revisa y edita el guion en la pantalla. Arriba está el CSV editable; abajo
   aparece una vista legible con líneas como `[Pausa 2.0s]`.
12. Presiona **Guardar guion editado**.
13. Haz primero una prueba con **Dry run** y luego presiona
   **Generar audios de podcast**.

Al generar el guion se crean estos archivos dentro del proyecto:

```text
Podcast_Master.csv
Podcast_Tecnico.txt
Podcast_Guion.txt
Podcast_Report.txt
```

`Podcast_Master.csv` usa estas columnas:

```text
id,type,speaker_or_blank,text,translation_or_blank,text_tts,lesson,section,pause_after_ms,repeat_count,repeat_style,is_key_phrase,playback_speed_hint
```

Las últimas columnas son opcionales. Por eso los `Podcast_Master.csv` antiguos
siguen funcionando.

Sirven para controlar escucha activa:

- `pause_after_ms`: pausa después de esa línea, en milisegundos.
- `repeat_count`: cuántas veces debe repetirse una línea si un ensamblador lo
  usa como instrucción.
- `repeat_style`: `normal`, `slow`, `natural`, `whisper`, `dramatic` o
  `question`.
- `is_key_phrase`: `true` si es una frase/palabra importante.
- `playback_speed_hint`: `slow`, `normal` o `fast`.

Los IDs de podcast tienen su propio prefijo y no chocan con `Audio_Master.csv`.
Por ejemplo, si el audio normal se llama `1001`, una línea de podcast puede
llamarse `PODB010001`.

Los MP3 de podcast se guardan aparte:

```text
output/Podcast/podcast_lines/
```

No se guardan en `library/master_audio/`, porque no son audios maestros
reutilizables: son audios largos o explicados para estudiar.

### Salida de audio unificada

En **Salida de audio** puedes elegir:

- **Audios separados por línea**
- **Un audio por lección**
- **Un audio por capítulo**
- **Un audio completo del proyecto/libro**
- **Generar separados + generar unidos**

La app crea esta estructura:

```text
output/Podcast/
├── podcast_lines/
├── podcast_by_lesson/
│   ├── 001_Leccion_01.mp3
│   └── 002_Leccion_02.mp3
├── podcast_full/
│   └── 999_Libro_Completo.mp3
├── playlists/
│   └── HanStory_Podcast.m3u
├── drafts/
│   └── lesson_01.json
└── Silences/
```

Los nombres empiezan con números (`001`, `002`, `999`) para evitar que el
celular reproduzca las lecciones en orden raro.

Para unir MP3 con pausas reales, HanStory Studio usa `ffmpeg` si está instalado.
En macOS puedes instalarlo con Homebrew:

```bash
brew install ffmpeg
```

Si `ffmpeg` no está instalado, la app hace una unión básica en orden y escribe
una advertencia en `Podcast_Report.txt`. Las pausas siguen quedando guardadas en
`Podcast_Tecnico.txt` y en `output/Podcast/Silences/`.

### Voces especiales

Podcast puede usar estas voces:

- `Narrador`
- `Profesor`
- personajes del libro, como `Aru`, `Saul`, `Hana`, etc.

Si falta una voz, la app lo indica en `Podcast_Report.txt` y también aparecerá en
**Audios → Personajes y voces** cuando exista `Podcast_Master.csv`.

### ElevenLabs v3 y text_tts

El texto limpio se guarda en `text`. Las marcas de actuación para ElevenLabs v3
van en `text_tts`, por ejemplo:

```text
[teacherly] Ahora escucha la escena completa.
[calm narrator] 사울은 눈을 떴습니다.
[slowly] 스킵할 수 없습니다.
```

La app manda `text_tts` a ElevenLabs cuando **Acting / Variety Mode** está
activado. El guion visible y reportes usan `text` limpio.

### Diálogo multi-speaker ElevenLabs v3

La opción **Usar diálogo multi-speaker ElevenLabs v3 cuando sea posible** prepara
bloques de diálogo conservando `speaker_or_blank` y `text_tts`.

Ejemplo interno:

```text
Speaker: Saul
[surprised] 잠깐만요.

Speaker: Profesor
[teacherly] Aquí 잠깐만요 significa “espera un momento”.
```

También puedes configurar **Máx. caracteres por bloque**. El valor por defecto
es `4500`. La app nunca corta una línea a la mitad; divide por lección o sección.

Si la API/modelo/cuenta no permite multi-speaker, la app vuelve
automáticamente a generación línea por línea y luego concatena localmente. El
fallback queda escrito en `Podcast_Report.txt`.

### Podcast explicado como clase real

El modo **Podcast explicado** ahora requiere un borrador didáctico del
**Motor creativo/OpenAI** antes de crear `Podcast_Guion.txt` o cualquier audio.
Si no tienes `OPENAI_API_KEY` configurada, la app no inventa explicaciones con
plantillas internas: mostrará un bloqueo para usar modo manual o Audiolibro.

Flujo:

1. Selecciona la lección en **Explicación didáctica con OpenAI**.
2. Pulsa **Generar explicación con OpenAI**.
3. Revisa el JSON en el editor.
4. Si todo está bien, pulsa **Marcar revisado/listo**.
5. Pulsa **Aplicar explicación al guion de podcast**.

El validador rechaza frases genéricas como:

- `palabra importante según el contexto`
- `bloque importante de la frase`
- `revisa su sentido dentro del contexto`
- `se usa para expresar esta idea de forma natural`

También bloquea casos peligrosos, por ejemplo explicar `-지만` como `만 = solo`.

Para cada frase clave, el Profesor debe tener una explicación en español con:

- significado natural;
- cuándo se usa;
- tono;
- estructura gramatical básica;
- palabras importantes;
- partículas importantes si existen;
- versión literal cuando ayuda;
- repetición lenta y natural.

Además usa secciones más específicas en `Podcast_Master.csv`:

```text
intro, scene, explanation, breakdown, word_repeat, phrase_repeat, grammar, review, outro
```

OpenAI debe decidir el desglose útil, evitando separaciones mecánicas. Por
ejemplo, `멀지만` debe explicarse como `멀다 + -지만`, no como `만 = solo`.

Ejemplo:

```text
[explanation] Profesor: La frase importante es 저기 사람이 있어요. Significa “allá hay una persona”.
[breakdown] Profesor: Primero vamos palabra por palabra.
[word_repeat] Narrador: 저기.
[explanation] Profesor: 저기 significa “allá, ahí lejos”.
[word_repeat] Narrador: 사람.
[explanation] Profesor: 사람 significa “persona”.
[word_repeat] Narrador: 이.
[explanation] Profesor: 이 es una partícula de sujeto.
[word_repeat] Narrador: 있어요.
[explanation] Profesor: 있어요 significa “hay”, “existe” o “está”.
[phrase_repeat] Narrador: [slowly] 저기 사람이 있어요.
[phrase_repeat] Narrador: [natural] 저기 사람이 있어요.
```

### Escucha activa

La sección **Pausas y repeticiones** permite que el podcast haga práctica real,
no solo explicación continua.

Opciones disponibles:

- **Activar escucha activa**
- **Pausa después de frase**: `0.5s`, `1s`, `2s` o `3s`
- **Pausa para repetir**: `1s`, `2s`, `3s` o `4s`
- **Repeticiones por frase clave**: `1`, `2`, `3` o `5`
- **Incluir versión lenta**
- **Incluir versión natural**
- **Traducción breve antes de repetir**
- **Instrucción “repite después de mí”**
- **Desglose palabra por palabra para frases largas**

Presets:

- **Escucha normal**: frase una vez y pausa corta.
- **Repite conmigo**: profesor guía, frase lenta, pausas para repetir y frase
  natural.
- **Dictado suave**: significado, frase en idioma objetivo y pausas más largas.
- **Frases clave intensivo**: varias repeticiones lentas y naturales.

Ejemplo de salida:

```text
Profesor: La frase importante es 스킵할 수 없습니다. Significa “no se puede saltar”.
Sistema: [slowly] 스킵할 수 없습니다.
[Pausa 2.0s]
Sistema: [slowly] 스킵할 수 없습니다.
[Pausa 2.0s]
Sistema: [natural] 스킵할 수 없습니다.
```

Las pausas no dependen de escribir `[pause]` dentro del texto. HanStory Studio
las guarda como `pause_after_ms` y también en `Podcast_Tecnico.txt`:

```text
### Lección 01
PODRPG0001
PAUSE 800
PODRPG0002
PAUSE 2000
PODRPG0003
PAUSE 2000
```

### Pausas y salida final

Puedes elegir pausas generales de 0, 1, 2 o 3 segundos, y pausas más precisas
por línea usando `pause_after_ms`.

Cuando hay pausas, la app crea silencios WAV reutilizables en:

```text
output/Podcast/Silences/
```

Por ejemplo:

```text
silence_2000ms.wav
```

Si eliges salida unida, la app ensambla los MP3 respetando el orden y los
`PAUSE` de `Podcast_Tecnico.txt`. También genera la playlist
`playlists/HanStory_Podcast.m3u`.

### Modo sin traducción completa

Si el proyecto tiene activado **No mostrar traducción completa** desde Fuentes,
el **Podcast explicado** no lee una traducción completa línea por línea. Sí puede
explicar el contexto en español, traducir frases clave, explicar vocabulario y
hacer preguntas de comprensión.

## Generar y organizar

Cuando la validación esté limpia:

1. Desactiva **Dry run**.
2. Mantén **Regenerar existentes** desactivado.
3. Presiona **Generar audios nuevos**.
4. Después presiona **Organizar audios**, o activa la opción para organizar al
   terminar.

La opción **Renombrar audios por orden de lección** está activada por defecto en
**Voces y ajustes**. Al organizar, las copias reciben un prefijo que conserva el
orden exacto de `Audios_Tecnico.txt`, aunque reutilicen un ID antiguo:

```text
L11-01 - 1088 - Aru - 조심하세요.mp3
L11-02 - 1089 - Saul - 아, 네.mp3
L11-03 - 1010 - Saul - 네.mp3
L11-04 - 1090 - Niño - 도와주세요.mp3
```

Para palabras, el personaje se sustituye por `WORD`. Por ejemplo:
`L11-05 - P001 - WORD - 깨다.mp3`.

La numeración solo se aplica a las copias dentro de `output/Lecciones`. Los MP3
originales de `library/master_audio` nunca se renombran ni se modifican. Cada vez
que vuelves a organizar, la app reemplaza las copias anteriores de las lecciones
para que no queden archivos duplicados con nombres viejos.

Los originales se guardan en:

```text
library/master_audio/id.mp3
```

Las copias del libro quedan en:

```text
library/books/CODIGO_Titulo/output/
├── Por_Personaje/
├── Lecciones/
└── Reports/
```

## Exportar a Anki

1. Selecciona el libro en **Biblioteca**.
2. Abre la pestaña **Anki**.
3. Conserva activadas **Incluir audios**, **Usar solo frases** y **Crear también
   TSV**.
4. Elige si las tarjetas seguirán el orden de `Audios_Tecnico.txt` o del CSV.
5. Presiona **Generar mazo Anki**.

La salida principal es un `.apkg` listo para importar en Anki. La app también
puede crear un TSV y una carpeta `media_for_anki` para importación manual. Todo
queda en:

```text
library/exports/CODIGO_Titulo/Anki/
├── CODIGO_Titulo_Anki.apkg
├── CODIGO_Titulo_Anki.tsv
├── media_for_anki/
└── Anki_Export_Report.txt
```

El mazo usa solo filas `phrase` de forma predeterminada. El frente contiene el
audio, el coreano limpio de `text` y el personaje; el reverso contiene la
traducción. `text_tts` nunca aparece en las tarjetas, aunque el MP3 sí puede
haber sido generado con marcas de actuación.

Los audios se localizan por ID, no por el texto completo. Las copias reciben
nombres seguros como `V5008_Bora.mp3`; el reporte conserva la correspondencia
con el nombre original. Si falta algún MP3, la app pide confirmación y puede
crear esas tarjetas sin audio.

## Importar fuentes y crear lecciones multilingües

La pestaña **Fuentes** permite trabajar con TXT, HTML, EPUB, PDF, MOBI cuando
Calibre está disponible, imágenes y carpetas de imágenes.

Flujo recomendado:

1. Selecciona o crea un proyecto en **Biblioteca**.
2. En **Fuentes**, configura idioma fuente, idioma objetivo, idioma de las
   explicaciones, sistema de escritura y romanización.
3. Importa el archivo o la carpeta de imágenes.
4. Revisa el estado de extracción y corrige el texto manualmente.
5. Si aparece **OCR recomendado**, ejecuta OCR sobre las páginas necesarias.
6. Abre **Segmentos**, elige capítulo/página, bloques de palabras, escenas o
   diálogos y guarda cada unidad revisada.
7. Si el idioma fuente y el objetivo son diferentes, escribe o pega el texto
   objetivo revisado. Esta versión no inventa traducciones automáticamente.
8. En **Generar lecciones**, revisa caracteres, audios estimados y advertencias.
9. Genera el paquete. Quedará bajo `generated_from_sources/` sin alterar el
   libro actual.
10. Cuando estés conforme, usa **Usar paquete en este proyecto**. La app crea un
    respaldo y aplica el HTML, CSV y archivo técnico para continuar con Audios y
    Anki normalmente.

Los proyectos guardan estas propiedades en `project_config.json`:

```text
source_language
target_language
explanation_language
romanization_enabled
script_type
```

Los PDF intentan primero extraer texto seleccionable. Si casi no contienen
texto, se marcan como escaneados y recomiendan OCR. El OCR es opcional y siempre
requiere revisión manual. Para habilitarlo en macOS instala Tesseract una vez:

```bash
brew install tesseract tesseract-lang
```

MOBI necesita la herramienta opcional `ebook-convert` de Calibre. Si no está
disponible, la app recomienda convertir el archivo a EPUB/PDF o usar imágenes.

Los modos Assimil, RPG/Isekai, Variety y Manga/Comic configuran el borrador y su
presentación, pero la adaptación creativa o traducción entre idiomas requiere
texto objetivo revisado manualmente hasta que se configure un motor de IA. La
app nunca presenta una traducción automática inexistente como si fuera válida.

### Motor creativo y revisión obligatoria

Después de segmentar, abre **Fuentes → Motor creativo**. El proveedor inicial
es **Manual / Placeholder**: no llama ninguna API ni envía texto fuera de tu
Mac. Los botones de traducción, adaptación y lección crean una estructura de
borrador con texto objetivo, explicación, frases clave, vocabulario, práctica y
notas para que la completes.

Cada segmento avanza explícitamente por estos estados:

```text
Fuente extraída → OCR revisado → Borrador generado → Revisado por usuario
→ Listo para aplicar → Aplicado al proyecto
```

El paquete final rechaza segmentos no revisados. La excepción **Permitir usar
borradores no revisados** está desactivada inicialmente y debe activarse de
forma consciente. Un proveedor futuro se conecta implementando la interfaz
`CreativeEngine`; nombre, modelo, temperatura y límite de tokens se guardan por
proyecto, mientras que su API key opcional se protege en `.env`.

Antes de cualquier llamada externa la interfaz y el motor interno exigen
confirmación de que tienes derecho a procesar el texto. Cada generación produce
`Creative_Generation_Report.txt` con idiomas, modo, estados, advertencias y
errores.

### Proveedor OpenAI

En **Fuentes → Motor creativo** puedes seleccionar **OpenAI**, elegir o escribir
el modelo y configurar temperatura y límite máximo de salida. Pega
`OPENAI_API_KEY` en el campo protegido y pulsa **Guardar motor**. La clave se
guarda únicamente en `.env`; nunca se escribe en `project_config.json`, los
segmentos ni los reportes.

El botón **Probar conexión OpenAI** verifica la clave y la disponibilidad del
modelo sin generar una traducción. Después puedes usar:

- **Generar borrador de traducción**.
- **Generar borrador de adaptación**.
- **Generar explicación gramatical**.
- **Generar vocabulario**.
- **Generar lección desde segmento**.

Antes de enviar el segmento aparece este aviso y debes confirmarlo:

> Este texto se enviará al proveedor configurado. Asegúrate de tener derecho a procesarlo.

OpenAI se conecta mediante la Responses API. Su resultado siempre se guarda con
estado **Borrador generado** y aparece en los editores de texto objetivo,
explicación, frases clave, vocabulario, práctica y notas. No puede aplicarse como
lección final hasta marcarlo como revisado, salvo que actives expresamente la
excepción para borradores no revisados.

Advertencia: usa esta función solo con material propio, de dominio público o que
tengas derecho a transformar para uso personal. Para materiales comerciales,
trabaja con fragmentos o escenas y no recrees libros completos.

## Reportes

Cada libro tiene reportes independientes:

- `audios_generados.txt`
- `audios_existentes.txt`
- `audios_faltantes.txt`
- `errores.txt`
- `resumen_libro.txt`
- `distribucion_por_leccion.txt`
- `reporte_generacion.txt` (modelo, modo Acting, uso de `text_tts`, personajes y
  resultado final)
- `Anki_Export_Report.txt`

Puedes leerlos desde la pestaña **Reportes** o abrir su carpeta en Finder.

## Estructura técnica

```text
hanstory_studio/
├── app.py
├── data/                 configuración, voces y catálogo SQLite
├── library/
│   ├── master_audio/     fuente única de MP3
│   ├── books/            proyectos aislados por libro
│   └── exports/          ZIP, HTML y exportaciones futuras
└── src/
    ├── database.py       catálogo y relaciones entre libros/audios/lecciones
    ├── book_manager.py   ciclo de vida e importación de libros
    ├── validators.py     comprobaciones previas y colisiones globales
    ├── audio_generator.py
    ├── audio_organizer.py
    ├── anki_exporter.py  creación de APKG, TSV y medios para Anki
    ├── podcast_generator.py guiones y audios de Podcast/escucha
    ├── source_manager.py importación, extracción, OCR y segmentación
    ├── source_lesson_generator.py generación segura de paquetes HanStory
    ├── export_tools.py   ZIP/HTML y puntos de extensión EPUB/PDF/Anki
    └── ui/               paneles independientes de la interfaz
```

La interfaz, la lógica de libros, ElevenLabs, la organización y la base de datos
están separadas. Añadir EPUB, PDF, Anki o un buscador más completo no requiere
reescribir el generador de audio.

## Copias de seguridad

Para respaldar toda la colección, copia juntos `data/` y `library/`. No copies
únicamente la base de datos: el catálogo y los MP3 forman una unidad.
