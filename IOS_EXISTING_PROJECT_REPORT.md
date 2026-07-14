# Informe del proyecto iOS existente

Fecha de revisión: 2026-07-14. Este informe se basa en inspección del código fuente. **La aplicación no fue compilada ni ejecutada porque Xcode no está disponible; no se afirma que funcione.**

## Archivos creados

- `HanStoryPlayer.xcodeproj/project.pbxproj` y esquema compartido.
- `project.yml`, configuración alternativa del proyecto.
- `HanStoryPlayerApp.swift`, punto de entrada SwiftUI.
- `Models.swift`, modelos de libro, lección, pista, progreso y modos de reproducción.
- `ImportService.swift`, acceso mediante bookmark, lectura de CSV/TXT, descubrimiento de audio y orden natural.
- `LibraryStore.swift`, biblioteca persistida en `UserDefaults`.
- `AudioPlayer.swift`, reproducción con AVFoundation.
- `Views.swift`, biblioteca, detalle, reproductor e importación.
- `Info.plist` y `HanStoryPlayer.entitlements`.
- `HanStoryPlayerTests.swift`, pruebas unitarias declaradas.
- `DemoData/`, ejemplo con `Audio_Master.csv`, `Audios_Tecnico.txt` y configuración.
- `README.md`, instrucciones y limitaciones conocidas.

## Funciones implementadas en código

El código contiene importación de carpetas con acceso de seguridad, búsqueda recursiva de MP3/M4A/WAV, lectura de `Audio_Master.csv` y `Podcast_Master.csv`, lectura de archivos técnicos, orden numérico natural, agrupación por lección, cuatro modos de reproducción, repetición, velocidad, favoritos, estados de lección y persistencia de progreso. También contiene vistas SwiftUI para biblioteca, detalle y reproductor.

## Funciones no verificadas

No se verificaron compilación, firma, permisos reales de Files, bookmarks después de reiniciar, reproducción, cambio automático de pista, controles de bloqueo, segundo plano, importación de carpetas grandes, UI en distintos iPhone, comportamiento con archivos dañados ni ejecución de pruebas XCTest. Los manifiestos nuevos `library.json` y `hanstory_manifest.json` no formaban parte de esa primera versión y aún no están conectados al proyecto Swift.

## Formatos reutilizables en la PWA

Son reutilizables los conceptos y campos de `Audio_Master.csv`, `Podcast_Master.csv`, `Audios_Tecnico.txt`, `Podcast_Tecnico.txt`, IDs, número de lección, personaje, texto, traducción, tipo, ruta relativa, progreso, favoritos y orden natural. La PWA agrega `library.json` y `hanstory_manifest.json` como contrato explícito; estos deben ser la fuente prioritaria en una futura actualización iOS.

La prioridad compartida queda documentada como: manifest del libro, orden técnico de podcast, orden técnico de audios, lección y secuencia, ID natural y nombre natural.

## Qué debe conservarse

Debe conservarse completa la carpeta `HanStoryPlayer`, incluidos `.xcodeproj`, esquema, `project.yml`, fuentes Swift, `Info.plist`, entitlements, pruebas, DemoData y README. Para retomarla harán falta una Mac con una versión compatible de Xcode y espacio para sus runtimes; después conviene generar/abrir el proyecto, ajustar equipo de firma y bundle ID, compilar primero las pruebas, probar en simulador y finalmente en un iPhone físico. La adopción de los manifests web debe hacerse como una ampliación, conservando la importación local existente como respaldo.
