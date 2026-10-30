# Normas de desarrollo

- Al iniciar una tarea o decisión relevante de implementación, usa una pregunta de selección para confirmar alcance o preferencia; pregunta una cosa por vez y no repitas decisiones ya aclaradas.
- Avanza paso a paso: inspecciona el cambio, implementa una unidad pequeña y valida antes de continuar.
- Prueba los cambios con los comandos disponibles y comunica cualquier validación que no se haya podido ejecutar.
- Usa TypeScript estricto y no introduzcas `any`; prefiere tipos explícitos y seguros.
- Sigue los patrones existentes de Ionic React y Capacitor; no mezcles Expo ni React Native.
- Mantén README y demás documentación alineados con las dependencias, scripts y configuración reales.
- Limita cada cambio al alcance acordado y conserva los cambios preexistentes de otras personas.

## Avances de implementación

### 2026-10-08 — Paso 1: configuración base de Supabase

- Confirmada la rama `feature/auth-supabase`; se conserva la dependencia `@supabase/supabase-js` que ya estaba añadida en el árbol de trabajo.
- Verificado que `.env` está ignorado por Git y no está seguido; su contenido no debe leerse ni compartirse.
- Añadidos `.env.example`, tipos para las variables Vite y el cliente Supabase con validación explícita de configuración y persistencia de sesión.
- Documentada la configuración local de Supabase; nunca usar claves `service_role` ni `sb_secret_`.
- Pendiente: implementar servicios Auth, validaciones, sesión, rutas, pantallas de acceso y consentimientos, pruebas completas y sincronización Android.
- Cómo validar este paso: `npm run build` y comprobar con `git check-ignore .env` y `git ls-files --error-unmatch .env` que `.env` sigue ignorado y no está en Git.

### 2026-10-08 — Paso 2: servicio de autenticación

- Añadido `src/services/auth.ts` con registro, inicio y cierre de sesión, lectura y escucha de sesión.
- Los errores reconocidos se traducen a mensajes en español sin exponer texto de Supabase; el registro conserva la autorización de datos de salud y fecha ISO en los metadatos.
- Si el registro no devuelve sesión, el servicio informa que se revise el correo; no se implementa confirmación ni su navegación.
- Continuación registrada en los pasos 3 y 8: se añadieron validaciones y pruebas del servicio sin llamadas a Supabase real.

### 2026-10-08 — Paso 3: validaciones reutilizables

- Añadidas funciones puras para validar formato de correo y contraseña de ocho o más caracteres con al menos una letra y un número.
- Añadidas pruebas unitarias para correos válidos e inválidos y contraseñas corta, sin número, sin letra y válida.
- Verificación: ejecutar `npm test -- src/utils/validaciones.test.ts`.
- Continuación registrada en el paso 4: contexto de sesión y rutas completas.

### 2026-10-08 — Paso 4: sesión y enrutamiento

- Instalado React Router 5 con `@ionic/react-router` compatible con Ionic React 8.
- Añadido un contexto que carga la sesión persistida, escucha cambios de Supabase, cancela la suscripción al desmontarse y muestra errores de carga con opción para reintentar.
- Configuradas rutas inicial, públicas, protegida `/hoy` y placeholders legales; añadida la página Hoy con confirmación de cierre de sesión.
- Consentimientos y Registro se completaron en el paso 6; Hoy incluye el diálogo de confirmación para cerrar sesión.

### 2026-10-08 — Paso 5: inicio de sesión

- Conectado Login con `iniciarSesion`, validación del correo, estado de envío, prevención de doble envío y mensajes de error no sensibles.
- Añadido control accesible para mostrar u ocultar la contraseña y navegación a Consentimientos.
- Ajustados los textos auxiliares del formulario para respetar un tamaño legible mínimo de 14 px.
- Verificación: `npm run build` completado; continúa la advertencia preexistente de Vite sobre el tamaño del bundle.
- Consentimientos y Registro se completaron en el paso 6.

### 2026-10-08 — Paso 6: consentimientos y registro

- Implementada pantalla con dos consentimientos obligatorios, autorización opcional de salud, enlaces legales y advertencia al intentar salir sin completar los obligatorios.
- Implementado registro con consentimiento transmitido por navegación, validación de correo y contraseña, estados de carga, mensajes de error y respuesta informativa cuando Supabase no entrega sesión.
- La página Registro redirige a Consentimientos si no recibe el estado requerido.
- Verificación: `npm run build` y `npm test` completados; las pruebas actualizadas cubren formularios, registro, autorización, validaciones y redirección sin sesión.

### 2026-10-08 — Paso 7: cierre de sesión y preparación Android

- En Hoy, el cierre de sesión se confirma con un diálogo Cancelar/Cerrar sesión; se informa el error de cierre sin filtrar mensajes del proveedor.
- Actualizado README con configuración de Supabase, ejecución web y Android, pruebas, estructura de carpetas y estado de persistencia.
- Pendiente fuera de alcance: RF-03 recuperación de contraseña, RF-04 eliminación de cuenta, `profiles` y políticas RLS, confirmación de correo y deep links Android.
- La persistencia de sesión opera con los tokens administrados por Supabase; el requisito de 30 días de RF-01 queda pendiente de verificar en la configuración del proyecto Supabase.
- Cómo probar: ejecutar `npm test`, `npm run build`, configurar `.env` localmente usando `.env.example`, correr `npm run dev`; para Android ejecutar `npx cap sync android` y `npm run android:run`. Crear una cuenta, cerrar sesión, iniciar sesión, reabrir la app y confirmar el usuario en Supabase Authentication > Users.

### 2026-10-08 — Paso 8: pruebas y verificación incremental

- Añadidas pruebas del servicio que comprueban metadatos de consentimiento y traducción de errores mediante mocks; ningún test llama a Supabase real.
- Suite completa: 19 pruebas en 6 archivos aprobadas.
- Verificación final: `npm test` aprobado (19 pruebas/6 archivos), `npm run build` aprobado y `npx cap sync android` aprobado.
- Vite informa que el chunk principal supera 500 kB minificados; es una advertencia de optimización, no bloquea el build.
- La sincronización Android finalizó correctamente; no se inició un emulador ni se realizó una prueba manual contra el proyecto Supabase.
- `.env` permanece ignorado y sin seguimiento en Git; verificarlo de nuevo inmediatamente antes de cada `git add`.

### 2026-10-08 — Diagnóstico de errores de autenticación

- Reportado fallo genérico al registrarse e iniciar sesión tanto en Android como en web.
- Mejorada la traducción para códigos de configuración comunes, códigos desconocidos y errores sin respuesta HTTP, sin exponer mensajes crudos del proveedor.
- Pruebas posteriores identificaron HTTP 404; añadido un mensaje dirigido a verificar Project URL y disponibilidad del proyecto.
- Añadidas pruebas para clave pública inválida, HTTP 404, HTTP sin código, error de red y código desconocido.
- Revisar en el dashboard que `VITE_SUPABASE_URL` local coincida con Project Settings > API > Project URL y que el proyecto esté activo; no solicitar ni inspeccionar `.env`.

### 2026-10-08 — Simplificación visual de inicio de sesión

- Retiradas de Login las frases promocionales solicitadas y sus elementos decorativos asociados; se conservan el encabezado, el formulario y el enlace de registro.
- Eliminados los estilos que quedaron sin uso para el arte decorativo.
- Añadidas aserciones para verificar que los textos y elementos retirados no reaparezcan.
- Verificación: `npm test` y `npm run build` completados.

### 2026-10-15 — Cierre de sesión RF-01 y separación local por usuario

- Confirmada la rama de trabajo `feature/cerrar-sesion`, basada en el mismo commit que `feature/perfil-rutina`; el flujo M2 y el servicio de autenticación están presentes.
- El servicio cierra sesión con alcance local (`signOut({ scope: 'local' })`); las sesiones de otros dispositivos no se invalidan.
- Añadido el componente reutilizable de cierre en Hoy y Perfil: modal Cancelar/Cerrar sesión, estado de carga, bloqueo de doble confirmación, error localizado y reemplazo de la ruta por `/login` al completar.
- Las interfaces y repositorios de perfil, salud y rutina reciben el ID del usuario y guardan en claves locales separadas. No se borran al cerrar sesión.
- Los registros anteriores sin ID no se migran ni se eliminan; la versión actual no los lee. No atribuirlos automáticamente a un usuario.
- La separación por usuario en Preferences no cifra los datos ni sustituye el almacenamiento backend/RLS, pendiente junto con la sincronización a Supabase.
- Validación final: suite completa de Vitest aprobada (83 pruebas en 17 archivos) y `npm run build` aprobado. Vite mantiene la advertencia existente por el bundle principal superior a 500 kB minificados.

### 2026-10-16 — Esqueleto de sesión y temporizador de descanso (M3/RF-11)

- Creada la rama `feature/sesion-entrenamiento` desde `feature/cerrar-sesion`, que conserva los cambios de acceso y M2. Los cambios locales de Gradle continúan en el stash previo; no reaplicarlos automáticamente.
- Añadida la ruta protegida `/sesion`: muestra los ejercicios de la primera jornada de la rutina del usuario, sugiere volver a Hoy y no registra ni persiste entrenamiento (M3 sigue incompleto).
- Añadido el componente independiente de descanso RF-11: inicia en 90 segundos, presenta el progreso circular mm:ss y permite sumar/restar 30 segundos y saltar. No se integra con `/sesion`.
- Pendiente: persistir sesiones y series (resto de M3/RF-10), conectar el temporizador con el entrenamiento y cualquier recuperación de contraseña (RF-03).
- La duración predeterminada del temporizador es 90 segundos y comienza automáticamente.
- Verificación final: 91 pruebas en 19 archivos aprobadas; `npm run build` aprobado con la advertencia de Vite por el bundle principal superior a 500 kB minificados.

### 2026-10-22 — Sistema visual claro y acceso armonizado

- Confirmada y conservada la rama activa `feature/rediseño-visual`; no se cambió de rama.
- Aprobado el tema claro fijo, usando los colores existentes y el fondo/campo muestreados de la referencia compartida.
- Centralizados colores, bordes, radios, espacios y tamaños tipográficos en `src/theme/spotter-ui.css`; `src/theme/variables.css` los asigna a Ionic.
- Reutilizado `src/assets/logo-spotterjn.webp` mediante `LogoSJ`; Login, Consentimientos y Registro comparten el marco y la navegación por pestañas. El registro conserva el paso obligatorio de consentimientos y las rutas existentes.
- Login, Registro, Consentimientos, pantallas `PantallaSJ`, alertas, cargas y estados de error usan el tema común. Eliminadas las hojas `Login.css` y `AuthPages.css`, que ya no se usan.
- No se cambiaron servicios, repositorios, datos ni la lógica de autenticación y formularios. README actualizado con el sistema visual.
- Verificación: `npm test` aprobó 93 pruebas en 19 archivos y `npm run build` finalizó correctamente. Vite mantiene la advertencia del bundle principal superior a 500 kB minificados.
- Revisadas en navegador a 390 × 844 px las vistas Login, Consentimientos y Registro, incluido el paso entre pestañas; falta el recorrido visual de las pantallas protegidas y la revisión en emulador Android.
