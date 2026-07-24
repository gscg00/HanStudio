# Activar XP central y Amigos

Esta versión necesita las migraciones del directorio `supabase/migrations` en orden numérico antes de publicar contenido nuevo. En particular:

1. `supabase/migrations/002_xp_and_friends.sql`
2. `supabase/migrations/003_story_lesson_xp.sql`
3. `supabase/migrations/004_guided_course_catalog.sql` a `013_all_languages_b12_complete_catalog.sql`
4. `supabase/migrations/014_korean_hangul_foundations_catalog.sql`
5. `supabase/migrations/015_reading_foundations_all_languages.sql`
6. `supabase/migrations/016_korean_complete_basic_hangul_catalog.sql`

Las migraciones de catálogo son idempotentes: pueden ejecutarse nuevamente sin duplicar XP. Si la cuenta muestra «recompensa pendiente», ejecuta las migraciones de catálogo que todavía falten y pulsa **Sincronizar ahora**. Los eventos pendientes conservan su identificador, por lo que el servidor concederá cada recompensa una sola vez.

## Aplicar la migración

1. Abre el proyecto de HanStory en Supabase.
2. Entra en **SQL Editor** y crea una consulta nueva.
3. Copia todo el contenido de `002_xp_and_friends.sql`.
4. Ejecuta la consulta una sola vez. Es idempotente para los catálogos y objetos nombrados.
5. En **Table Editor**, comprueba que existen `xp_events`, `lesson_catalog`, `friend_code_registry`, `friend_requests` y `friendships`.
6. Comprueba que `profiles` contiene `friend_code` y que las cuentas existentes recibieron un valor con formato `HS-XXXXXX`.
7. Ejecuta después `003_story_lesson_xp.sql`. Esta segunda migración registra las lecciones de los libros publicados para que terminar el último audio conceda 20 XP una sola vez.

## Verificación de seguridad

- RLS debe figurar activo en las cuatro tablas nuevas.
- `anon` no debe tener acceso a estas tablas ni a las funciones RPC.
- `authenticated` solo tiene lectura directa de sus filas participantes; todas las escrituras pasan por RPC.
- `lesson_catalog` no debe ser legible ni editable desde el navegador.
- `friend_code` no debe poder actualizarse. Un trigger rechaza el cambio y el rol `authenticated` no tiene permiso sobre esa columna.
- `friend_code_registry` no tiene políticas de lectura ni permisos para el navegador. Conserva para siempre los códigos reservados para impedir que se reutilicen tras borrar una cuenta.

## Prueba con dos cuentas

1. Inicia sesión como A y copia su código desde **Cuenta**.
2. En otro perfil de navegador inicia sesión como B.
3. En **Amigos**, busca el código de A y envía la solicitud.
4. Vuelve a A, abre **Solicitudes** y acepta.
5. Confirma que ambas cuentas ven nombre, avatar, código y XP agregado, pero no el correo de la otra cuenta.
6. Completa una lección de un curso de entrada y una lección de Historias, sincroniza y comprueba el total y el desglose.
7. Repite una de las lecciones: no debe aumentar nuevamente la recompensa completa.

## Importante para nuevas lecciones

Una lección nueva debe agregarse a `lesson_catalog` mediante una migración posterior. El servidor rechaza una finalización que no aparezca en ese catálogo; así el navegador no puede inventar una cantidad arbitraria de XP. Al publicar un libro nuevo, agrega su código, idioma y rango real de lecciones siguiendo el formato de `003_story_lesson_xp.sql` y ejecútalo en Supabase antes de anunciar el libro.
