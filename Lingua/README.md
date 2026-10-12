# Lingua

Aplicación macOS offline para aprender coreano, japonés, alemán y francés con asociaciones visuales y audio del sistema. Interfaz en español, contenido A1–A2, repaso espaciado SM-2, SwiftData y ocho formatos de ejercicio.

## Ejecutar y comprobar

Requiere macOS 14 o posterior y Swift 6/Xcode. Abre `Package.swift` en Xcode y ejecuta el esquema **Lingua**, o en Terminal:

```sh
cd Lingua
swift run Lingua
swift test
swift run lingua-validate
```

## Contenido y extensión

`Sources/LinguaCore/Content/ContentStore.swift` es la fuente de conceptos. Para añadir un idioma, incorpora un caso a `Language` y una realización para cada concepto: el motor y las vistas consumen el catálogo genérico. Para añadir temas, incorpora el caso de `Topic` y semillas de contenido. El validador comprueba cobertura lingüística, cantidad y referencias de ilustración.

## Ilustraciones

```sh
python3 Tools/generate_illustrations.py
```

Produce 120 SVG originales y `Illustrations.manifest.json`. Para conectar una API de imágenes, configura `LINGUA_IMAGE_API_URL`, `LINGUA_IMAGE_API_KEY` y `LINGUA_IMAGE_MODEL` fuera del repositorio y completa el adaptador de red indicado en el script; no se requiere ninguna clave para el modo actual.

## Límites conocidos y roadmap

- Las ilustraciones se renderizan con `Canvas` para animación accesible; los SVG generados también quedan disponibles como assets editables.
- La práctica de pronunciación proporciona fallback de escuchar/repetir; queda pendiente integrar el permiso y las hipótesis de `Speech` para feedback fonético.
- Exportar/importar JSON y notificaciones están expuestos en Ajustes como el siguiente punto de persistencia UI; el núcleo, lecciones, audio TTS, contenido y SRS están operativos.
- El contenido C1, grabaciones humanas y analítica profunda se preparan como extensiones de datos/servicios.
