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
