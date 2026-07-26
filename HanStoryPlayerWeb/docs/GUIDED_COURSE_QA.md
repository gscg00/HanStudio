# Control de calidad de los cursos guiados

## Alcance actual

El auditor revisa los diez cursos publicados: árabe, chino, inglés, francés,
alemán, italiano, japonés, coreano, portugués y ruso.

La revisión automática recorre cada unidad, lección y actividad referenciada
por `course.json`. Comprueba:

- IDs ausentes o duplicados;
- lecciones vacías;
- respuestas que no aparecen entre las opciones;
- opciones duplicadas o insuficientes;
- conceptos sin significado en español;
- instrucciones usadas por error como traducciones;
- texto del idioma objetivo repetido como supuesta traducción;
- actividades de reconocimiento presentadas antes de su tarjeta didáctica;
- claves de audio inexistentes;
- archivos físicos de audio inexistentes;
- ejemplos de pronunciación incompletos.

Ejecutar desde la raíz del proyecto:

```bash
node HanStoryPlayerWeb/scripts/audit_guided_courses.mjs
node --test HanStoryPlayerWeb/tests/*.test.mjs
```

## Criterio de publicación

Un curso no debe publicarse si el auditor informa al menos un `error`.
Las advertencias de traducción idéntica deben revisarse como cognados
legítimos (por ejemplo, `hotel`, `taxi` o `no`) antes de descartarlas.

## Qué demuestra y qué no demuestra

Una auditoría sin errores demuestra integridad del contenido y del flujo:
la actividad se puede completar, el audio existe, la respuesta es válida y
los conceptos semánticos tienen apoyo en español.

No certifica por sí sola dominio conversacional ni un nivel CEFR. Para poder
afirmar que una persona alcanza producción oral B1 todavía hacen falta
evaluaciones de habla, producción escrita y revisión lingüística humana por
idioma. El curso actual sí ofrece una base extensa de lectura, comprensión,
vocabulario y gramática guiada para la beta.
