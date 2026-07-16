# Configurar cuentas y Google en HanStory Web Player

La aplicación sigue funcionando sin cuenta. Estos pasos activan el respaldo online. Nunca coloques en el Web Player una clave administrativa, la contraseña de PostgreSQL ni el secreto de Google.

## A. Crear y preparar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com/dashboard).
2. En **Project Settings → Data API** (o **API**, según la versión del panel), copia:
   - **Project URL** → `SUPABASE_URL`.
   - **Publishable key** → `SUPABASE_PUBLISHABLE_KEY`.
3. Abre **SQL Editor**, pega y ejecuta íntegramente `supabase/migrations/001_initial_progress.sql`.
4. En **Table Editor**, confirma que existen `profiles`, `user_progress` y `sync_events`.
5. En cada tabla, confirma que **RLS** está activado. La migración ya crea políticas privadas para que cada usuario vea únicamente sus filas.
6. Abre **Authentication → URL Configuration**:
   - **Site URL:** `https://gscg00.github.io/HanStudio/`
   - **Redirect URLs:**
     - `https://gscg00.github.io/HanStudio/?auth=callback`
     - `http://localhost:8080/?auth=callback`
7. Abre **Authentication → Providers → Google**. El panel muestra una callback con esta forma:
   - `https://TU_PROJECT_REF.supabase.co/auth/v1/callback`
   Copia la callback exacta que muestre tu proyecto. Es la URL que Google necesita; no es la URL de GitHub Pages.

## B. Configurar Google Auth Platform

1. En [Google Cloud Console](https://console.cloud.google.com/), crea o selecciona un proyecto.
2. Abre **Google Auth Platform → Branding** y configura el nombre y datos básicos de HanStory.
3. En **Audience**, elige la audiencia adecuada. Mientras pruebas, agrega tus cuentas como usuarios de prueba si Google lo solicita.
4. En **Data Access**, usa solo identidad básica: `openid`, `email` y `profile`. No habilites Gmail, Drive, contactos ni Calendar.
5. En **Clients**, crea un cliente **Web application**.
6. En **Authorized JavaScript origins**, escribe exactamente:
   - `https://gscg00.github.io`
   - `http://localhost:8080`
7. En **Authorized redirect URIs**, pega la callback exacta copiada de Supabase:
   - `https://TU_PROJECT_REF.supabase.co/auth/v1/callback`
8. Guarda y copia **Client ID** y **Client Secret**.
9. Pega ambos únicamente en **Supabase → Authentication → Providers → Google** y activa el proveedor.
10. No copies el Client Secret al repositorio, a GitHub Pages ni a `config.local.js`.

## C. Configurar el Web Player

### Desarrollo local

1. Duplica `src/config.example.js` con el nombre `src/config.local.js`.
2. Completa únicamente los dos valores públicos:

```js
export const SUPABASE_URL='https://TU_PROJECT_REF.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY='sb_publishable_TU_VALOR';
```

3. Inicia la web desde la carpeta del Web Player:

```bash
python3 -m http.server 8080
```

4. Abre `http://localhost:8080/`.

`config.local.js` está ignorado por Git. La clave publicable puede estar en el navegador; la protección real la proporcionan las políticas RLS.

### GitHub Pages

En el repositorio `gscg00/HanStudio`, abre **Settings → Secrets and variables → Actions → Variables** y crea estas variables de repositorio:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

El despliegue genera `src/config.local.js` únicamente dentro del artefacto público. No usa secretos ni vuelve a publicar Han Studio o el reproductor local.

## URLs que usa HanStory

| Uso | Producción | Desarrollo |
| --- | --- | --- |
| Origen autorizado en Google | `https://gscg00.github.io` | `http://localhost:8080` |
| Site URL de Supabase | `https://gscg00.github.io/HanStudio/` | — |
| Redirect URL permitida en Supabase | `https://gscg00.github.io/HanStudio/?auth=callback` | `http://localhost:8080/?auth=callback` |
| `redirectTo` calculado por la app | `https://gscg00.github.io/HanStudio/?auth=callback` | `http://localhost:8080/?auth=callback` |
| Redirect URI de Google | La callback exacta `https://TU_PROJECT_REF.supabase.co/auth/v1/callback` que muestra Supabase | la misma |

La función `getAuthRedirectUrl()` usa el origen y la ruta actuales; por eso también funcionará con un dominio personalizado futuro después de agregarlo a las listas permitidas de Supabase y Google.

## Prueba manual recomendada

1. Abre una ventana privada y elige **Continuar sin cuenta**.
2. Completa una lección, recarga y confirma que el avance local continúa.
3. Desconecta Internet, completa otra actividad y confirma el estado “Sin conexión”.
4. Inicia sesión con Google y confirma que regresas a HanStory.
5. En el aviso de importación, compara los resúmenes y elige **Combinar progresos**.
6. Pulsa **Sincronizar ahora** y espera la confirmación real.
7. Abre otro navegador, inicia la misma cuenta y confirma que aparece el progreso.
8. Prueba **Exportar progreso** y después **Importar progreso**.
9. Cierra sesión: el progreso de la cuenta debe quedar respaldado localmente y debe restaurarse el espacio invitado.
10. Inicia otra cuenta y comprueba que no aparece el avance de la primera.
11. Actualiza la PWA y verifica que IndexedDB y la sesión siguen intactos.
12. En Supabase, intenta leer una fila de otro usuario con una sesión normal: RLS debe rechazarla.

El inicio de sesión no puede darse por verificado hasta completar esta configuración externa y publicar las dos variables públicas.
