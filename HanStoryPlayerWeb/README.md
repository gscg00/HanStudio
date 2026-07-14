# HanStory Player Web

PWA estática para escuchar libros publicados por HanStory Studio. No usa cuentas, anuncios, analítica, backend ni base de datos remota. Metadatos, favoritos, descargas y progreso permanecen en el navegador.

## Probar en la Mac y en Safari

Desde la carpeta principal de HanStory Studio ejecuta:

```bash
python3 -m http.server 8080 --directory HanStoryPlayerWeb
```

Abre `http://localhost:8080`. Para probar desde el iPhone, ambos dispositivos deben estar en la misma red; abre `http://DIRECCION-DE-TU-MAC:8080` en Safari. Algunas funciones PWA (service worker, instalación y almacenamiento estable) requieren HTTPS salvo en `localhost`, por lo que la prueba completa se recomienda en GitHub Pages.

## Publicar un libro desde Studio

1. Abre HanStory Studio y selecciona el libro en **Biblioteca**.
2. En **Biblioteca web**, elige **Validar paquete web**.
3. Revisa título, código, versión, cantidad, tamaño, audios, exclusiones y destino.
4. Selecciona **Publicar / actualizar** y confirma la advertencia pública.
5. Studio crea `library/books/CODIGO/hanstory_manifest.json`, copia únicamente archivos permitidos y actualiza `library/library.json`.

También puedes validar con `python3 HanStoryPlayerWeb/scripts/publish_book.py HS-B03 --validate` y publicar con `python3 HanStoryPlayerWeb/scripts/publish_book.py HS-B03 --bump patch`. `--git-status` muestra los cambios; `--commit "mensaje"` prepara y confirma; `--push` siempre exige escribir una confirmación explícita.

Para actualizar, publica el mismo código y aumenta `patch`, `minor` o `major`. Los IDs de pista estables permiten conservar el progreso. Para retirar un título usa el botón **Retirar** o `--remove`; el proyecto original y el progreso del navegador no se borran.

### Explicaciones didácticas

Si el libro tiene OpenAI configurado en el Motor creativo, **Biblioteca web** permite generar explicaciones al publicar. Antes de confirmar muestra frases existentes, reutilizadas, faltantes, desactualizadas, tokens aproximados y el modelo. Por defecto se reutiliza la caché de `project_cache/explanations` mediante un hash del ID, texto, traducción e idiomas; cambiar únicamente el MP3 no vuelve a consumir créditos. Se puede limitar la regeneración a una lección o a IDs separados por comas.

La generación ocurre exclusivamente en la Mac y requiere confirmar que las frases se enviarán al proveedor externo. La PWA nunca contiene la API key ni llama a OpenAI: solo descarga `explanations/track_explanations.json`. Una respuesta que incumple las validaciones queda marcada para revisión sin detener las demás frases.

## GitHub Pages

1. Crea un repositorio en GitHub y guarda este proyecto allí.
2. En **Settings → Pages → Build and deployment**, selecciona **GitHub Actions**.
3. El flujo incluido publica `HanStoryPlayerWeb` cuando cambia `main`; también se puede ejecutar manualmente.
4. La aplicación usa rutas relativas y funciona tanto en la raíz como bajo una subruta, por ejemplo `/hanstory-player/`. No requiere cambiar el código para configurar la URL base.
5. Alternativa manual: publica el contenido de `HanStoryPlayerWeb` en una rama `gh-pages`, conservando `.nojekyll`.

Nunca subas `.env`, claves API, PDFs/EPUB/MOBI fuente, escaneos, OCR, carpetas `sources`, temporales ni proyectos originales completos. El publicador los excluye y busca patrones comunes de secretos, pero el reporte debe revisarse antes de confirmar.

## Usar en iPhone

Abre la URL HTTPS en Safari, toca **Compartir → Añadir a pantalla de inicio**. Abre un libro para reproducirlo en orden. **Descargar libro** guarda manifiesto, portada y audios en Cache Storage; **Eliminar descarga local** libera esa copia sin retirar el libro online. **Buscar actualizaciones** vuelve a consultar el índice. La biblioteca no descarga automáticamente todos los audios.

Safari puede suspender audio, JavaScript o descargas según batería, memoria, red, bloqueo de pantalla y versión de iOS. Media Session ofrece controles del sistema cuando está disponible, pero la reproducción continua en segundo plano o con pantalla bloqueada no está garantizada por iOS.

## Cambiar el nombre y los textos de marca

Edita únicamente `src/branding.js`. Ahí puedes cambiar `appName`, `eyebrow`, `heroTitle` y `heroSubtitle` sin tocar la estructura de `index.html`. No abras `index.html` con TextEdit en modo texto enriquecido: macOS puede convertirlo en un documento Cocoa y eliminar los enlaces de la aplicación.

Después de un cambio puedes comprobar todas las rutas con:

```bash
python3 HanStoryPlayerWeb/scripts/check_web_assets.py
```

La pestaña **Biblioteca local** conserva el acceso de respaldo para ZIP, varios audios y carpetas cuando Safari lo permita. Los archivos seleccionados no se suben a ningún servidor.

## Formato compartido

`library.json` anuncia código, título, idiomas, versión, portada y ruta del manifest. Cada `hanstory_manifest.json` contiene lecciones y pistas ya ordenadas. Prioridad común para compatibilidad futura: manifest, `Podcast_Tecnico.txt`, `Audios_Tecnico.txt`, lección/secuencia, ID natural y nombre natural.
