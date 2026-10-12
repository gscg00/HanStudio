# Decisiones de producto y arquitectura

- **Formato:** Swift Package ejecutable para que compile con las Command Line Tools presentes; se abre y ejecuta desde Xcode como paquete macOS 14+.
- **Persistencia:** SwiftData guarda los registros de aprendizaje; el algoritmo SM-2, pequeño y explicable, está aislado para poder sustituirse por FSRS sin cambiar la UI.
- **Contenido:** 120 conceptos compartidos repartidos de forma equilibrada entre seis temas A1–A2 y 30 frases por idioma. Cada realización incluye texto, transcripción, nivel y nota pedagógica.
- **Inmersión:** español es apoyo configurable y no la pista principal de los ejercicios.
- **Ilustración:** SVG originales generados determinísticamente con una guía inspirada por la referencia: contorno oscuro, expresividad simple y colores pastel. No se copian personajes ni composición de la imagen de referencia.
- **Audio:** AVSpeechSynthesizer es offline y sustituible; se muestra la ruta para instalar voces de sistema cuando falta una voz.
- **Reconocimiento:** la pantalla expone un fallback funcional de escucha/repetición. El adaptador Speech queda como extensión posterior porque exige autorización de usuario y no debe bloquear una lección offline.
- **Alcance:** se priorizó una aplicación compilable con recorrido completo de lección sobre funciones de sincronización, cuentas o contenido C1.
