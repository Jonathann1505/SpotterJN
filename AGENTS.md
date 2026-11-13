# Normas de desarrollo

- Al iniciar una tarea o decisión relevante de implementación, usa una pregunta de selección para confirmar alcance o preferencia; pregunta una cosa por vez y no repitas decisiones ya aclaradas.
- Avanza paso a paso: inspecciona el cambio, implementa una unidad pequeña y valida antes de continuar.
- Prueba los cambios con los comandos disponibles y comunica cualquier validación que no se haya podido ejecutar.
- Usa TypeScript estricto y no introduzcas `any`; prefiere tipos explícitos y seguros.
- Sigue los patrones existentes de Ionic React y Capacitor; no mezcles Expo ni React Native.
- Mantén README y demás documentación alineados con las dependencias, scripts y configuración reales.
- Limita cada cambio al alcance acordado y conserva los cambios preexistentes de otras personas.

## Convención de commits

- Prefijo en inglés y descripción en español, en presente, con tildes y sin punto final: `fix` (corrección), `feat` (funcionalidad nueva), `docs` (documentación), `style` (cambios solo visuales), `test` (solo pruebas) y `chore` (solo configuración de compilación). Incluye el requisito cuando aplique, por ejemplo `fix: migra la pantalla de recuperación al diseño de acceso actual (RF-03)`.
- Commits atómicos: un cambio lógico por commit. Agrega los archivos uno por uno con `git add ruta/archivo`; nunca `git add .` ni `git add -A`.
- Antes de cada commit revisa `git status` y `git diff --cached --stat`, confirma que `.env` no aparece y que no hay archivos ajenos al cambio. No confirmes código que rompa `npm test` o `npm run build`.
- Haz `git push` después de cada commit. Sin atribuciones de IA, firmas ni coautores.
- No reescribas historial (`--force`, `--force-with-lease`, `--amend`, `rebase`, `reset --hard`) ni trabajes directamente en `main` o `develop`; integra por Pull Request hacia `develop`.

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
- Implementado RF-03 en la parte visual y de solicitud del servicio; fuera de alcance permanecen RF-04 eliminación de cuenta, nueva contraseña, enlaces de regreso y deep links Android.
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

### 2026-10-29 — RF-03 visual y solicitud de recuperación

- Añadido `solicitarRecuperacion(email)` con `resetPasswordForEmail` y traducción de errores mediante el flujo existente.
- Añadida la ruta pública `/recuperar-contrasena`, reutilizando estilos de autenticación, validación de correo, carga y confirmación genérica.
- Añadido desde Login el enlace «¿Olvidaste tu contraseña?» y pruebas unitarias con el servicio autenticado simulado.
- Fuera de alcance: seguimiento del enlace recibido, regreso a la app, nueva contraseña y deep links Android.

### 2026-10-30 — Corrección visual de recuperación tras fusión de ramas

- La aplicación no compilaba porque `RecuperarContrasena.tsx` importaba el eliminado `AuthPages.css` y todavía usaba clases del diseño anterior.
- Se migró la presentación a `MarcoAccesoSJ`, `sj-campo`, `sj-acceso-submit`, `sj-error`, `sj-ok` y `sj-acceso-enlace`, conservando la validación, carga y confirmación genérica existentes; se añadió el regreso a Login.
- Se restauró desde Login el enlace «¿Olvidaste tu contraseña?» y se actualizaron las pruebas para validar el campo, el botón y la navegación con el diseño actual.
- Pendiente: validar manualmente el flujo web y el envío real de correo mediante el proyecto Supabase configurado.

### 2026-11-05 — Login estable y APK de depuración

- Diagnóstico: `develop` ya compilaba y el enlace «¿Olvidaste tu contraseña?» ya existía tras el PR #12; no quedaban imports de CSS ni componentes inexistentes. Registro, inicio y cierre de sesión con modal, sesión persistida, rutas protegidas y prevención de doble envío se revisaron sin encontrar errores.
- Añadida `scripts/validarEntornoSupabase.ts` y un plugin en `vite.config.ts` que hacen fallar `npm run build` si faltan `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY`, si la URL no es válida o si la clave es secreta (`sb_secret_` o JWT `service_role`), sin mostrar valores. Antes, la APK compilaba y quedaba en blanco al abrir.
- Reemplazado el ícono predeterminado de Capacitor por el logo de SpotterJN con `@capacitor/assets` ejecutado fuera del proyecto; las imágenes fuente quedan en `assets/`. No se añadió dependencia a `package.json`.
- `npx cap sync android` solo reescribió los finales de línea de `capacitor.build.gradle` y `capacitor.settings.gradle`, sin cambios de contenido; Preferences y Local Notifications ya estaban registrados, por lo que no se confirmaron.
- APK de depuración generada con JDK 21 y `gradlew assembleDebug` en `android/app/build/outputs/apk/debug/app-debug.apk`; está ignorada por Git.
- Decisiones: la rama `feature/primera-vez-progreso` de Nayeli (RF-21) no se incluyó y se integrará por su propio PR; sin firma de release ni publicación en tiendas.
- Pendientes: probar manualmente en emulador y celular real con el proyecto Supabase, flujo de nueva contraseña y deep links (RF-03), duración de sesión de 30 días (RF-01) y advertencia de Vite por el chunk principal de 2,2 MB.
- Verificación: `npm test` (210 pruebas/35 archivos), `npm run build`, `npx cap sync android` y `gradlew assembleDebug` aprobados.

### 2026-11-13 — Registro de serie, autoevaluación y Sentí dolor

- Rama `feature/sesion-autoevaluacion` creada desde `develop`; no incluye `feature/microinteracciones`, que sigue sin integrarse.
- `/sesion` pasó de listar la jornada a recorrerla ejercicio por ejercicio: «Ejercicio N de M», «Serie X de Y», `ContadorNumerico` de repeticiones (0-50) y de peso según la unidad del perfil (oculto en peso corporal), autoevaluación Fácil/Normal/Difícil como `radiogroup` y «Guardar serie» deshabilitado hasta elegir una opción (RF-10).
- Decisión: al guardar la última serie del último ejercicio se muestra «Sesión completada» con «Volver a Hoy».
- Añadido «Sentí dolor» (RF-13): botón secundario con ícono en un pie fijo (`pieFijo` de `PantallaSJ`; `BotonSJ` acepta `icono`), `IonAlert` sin cierre por fondo que recomienda detenerse y consultar a un profesional; al confirmar pasa al siguiente ejercicio sin contar la serie. «Volver» pasó a variante texto para distinguirlo del botón de seguridad.
- Decisión: en el último ejercicio el botón dice «Entendido, terminar la sesión» y se muestra «Sesión finalizada» con la recomendación.
- Lógica de avance en funciones puras de `src/utils/sesion.ts` con pruebas propias.
- Pendientes: persistir series y autoevaluaciones, registrar «interrumpido por molestia» en un historial, progresión de carga, conectar el descanso RF-11 entre series y revisar la pantalla en navegador y celular (no se verificó visualmente).
- Verificación: `npm test` (241 pruebas/37 archivos) y `npm run build` aprobados.
