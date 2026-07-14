# HanStory Player

Aplicación privada y local para iPhone (iOS 17+) que reproduce proyectos de HanStory Studio en el orden correcto.

## Abrir en Xcode

1. Abre `HanStoryPlayer.xcodeproj` con Xcode 16 o posterior.
2. Selecciona el proyecto **HanStoryPlayer** y el target del mismo nombre.
3. En **Signing & Capabilities**, elige tu Apple ID en **Team**. Cambia el Bundle Identifier si Xcode indica que ya está ocupado.
4. Conecta y desbloquea el iPhone, acepta **Confiar en este ordenador** y selecciónalo como destino.
5. Pulsa **Run** (▶). Con una cuenta gratuita quizá debas autorizar al desarrollador en Ajustes del iPhone y reinstalar periódicamente.

## Capacidades

El proyecto ya declara el modo de fondo necesario. Verifica en **Signing & Capabilities**:

- **Background Modes** → activar **Audio, AirPlay, and Picture in Picture**.
- **iCloud Documents** no es obligatorio: el selector del sistema entrega acceso mediante security-scoped bookmarks, incluso para ubicaciones compatibles como iCloud Drive y En mi iPhone.
- No actives red, analítica, cuentas ni servicios de nube para esta app.

## Uso

Pulsa **Seleccionar carpeta HanStory** y elige la raíz de un libro. La app busca MP3, M4A y WAV recursivamente, lee los manifiestos y CSV disponibles, y nunca depende del orden del sistema de archivos. Eliminar un libro de la biblioteca sólo quita su referencia; no borra archivos.

La carpeta `DemoData` contiene metadatos libres. Añade tres audios propios siguiendo su `README.txt`, selecciona esa carpeta y podrás comprobar el flujo.

## Pruebas

En Xcode usa **Product → Test** (⌘U). Se prueban orden natural, manifiestos/nombres, restauración de progreso, falta de audios y agrupación por lección.

## Privacidad

Todo se procesa en el dispositivo. No hay cuenta, anuncios, analítica ni servidores.
