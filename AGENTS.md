# Normas de desarrollo

- Al iniciar una tarea o decisión relevante de implementación, usa una pregunta de selección para confirmar alcance o preferencia; pregunta una cosa por vez y no repitas decisiones ya aclaradas.
- Avanza paso a paso: inspecciona el cambio, implementa una unidad pequeña y valida antes de continuar.
- Prueba los cambios con los comandos disponibles y comunica cualquier validación que no se haya podido ejecutar.
- Usa TypeScript estricto y no introduzcas `any`; prefiere tipos explícitos y seguros.
- Sigue los patrones existentes de Ionic React y Capacitor; no mezcles Expo ni React Native.
- Mantén README y demás documentación alineados con las dependencias, scripts y configuración reales.
- Limita cada cambio al alcance acordado y conserva los cambios preexistentes de otras personas.
- Navegación: toda pantalla secundaria usa `atras` en `PantallaSJ` o `MarcoAccesoSJ`; las raíz no. Pantallas del flujo inicial: atrás solo si ya hay rutina (`/rutina` → `/perfil`, `/cuestionario-rutina` → `/rutina`); `/aviso-medico` y `/salud` nunca lo llevan.

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

### 2026-11-05 — Microinteracciones y transiciones

- Integrado `develop` con el PR #13 (login y APK) y el PR #14 de Nayeli (RF-21); `npm test` y `npm run build` aprobados antes de empezar.
- Añadida `transicionPaginaSJ` (`src/theme/transiciones.ts`) con `createAnimation` de Ionic: 260 ms al avanzar y 200 ms al regresar, solo con transform y opacity; registrada como `navAnimation`.
- Añadido `src/theme/microinteracciones.css`: entrada escalonada del contenido, escala 0,97 al tocar botones, opciones y pestañas, y animación de mensajes, paneles y diálogo; todo entre 150 y 300 ms y desactivado con «Reducir movimiento».
- Añadido `CargandoSJ` con `IonSkeletonText` en Hoy, Rutina, Sesión, Ajustes y Ficha. Se conserva el spinner de la verificación inicial de sesión porque aún no se conoce la pantalla destino.
- Decisión: Angular Animations no aplica porque el proyecto es React; se usan las animaciones nativas de Ionic y CSS.
- APK de depuración regenerada con JDK 21 en `android/app/build/outputs/apk/debug/app-debug.apk`.
- Pendiente: revisar las animaciones en un emulador o celular real; no había dispositivo conectado durante la implementación.
- Verificación: `npm test` (229 pruebas/38 archivos), `npm run build`, `npx cap sync android` y `gradlew assembleDebug` aprobados.

### 2026-11-13 — Registro de serie, autoevaluación y Sentí dolor

- Rama `feature/sesion-autoevaluacion` creada desde `develop`; no incluye `feature/microinteracciones`, que sigue sin integrarse.
- `/sesion` pasó de listar la jornada a recorrerla ejercicio por ejercicio: «Ejercicio N de M», «Serie X de Y», `ContadorNumerico` de repeticiones (0-50) y de peso según la unidad del perfil (oculto en peso corporal), autoevaluación Fácil/Normal/Difícil como `radiogroup` y «Guardar serie» deshabilitado hasta elegir una opción (RF-10).
- Decisión: al guardar la última serie del último ejercicio se muestra «Sesión completada» con «Volver a Hoy».
- Añadido «Sentí dolor» (RF-13): botón secundario con ícono en un pie fijo (`pieFijo` de `PantallaSJ`; `BotonSJ` acepta `icono`), `IonAlert` sin cierre por fondo que recomienda detenerse y consultar a un profesional; al confirmar pasa al siguiente ejercicio sin contar la serie. «Volver» pasó a variante texto para distinguirlo del botón de seguridad.
- Decisión: en el último ejercicio el botón dice «Entendido, terminar la sesión» y se muestra «Sesión finalizada» con la recomendación.
- Lógica de avance en funciones puras de `src/utils/sesion.ts` con pruebas propias.
- Pendientes: persistir series y autoevaluaciones, registrar «interrumpido por molestia» en un historial, progresión de carga, conectar el descanso RF-11 entre series y revisar la pantalla en navegador y celular (no se verificó visualmente).
- Verificación: `npm test` (241 pruebas/37 archivos) y `npm run build` aprobados.

### 2026-11-13 — Navegación hacia atrás nativa

- Rama `feature/navegacion-atras` desde `develop` (ya con microinteracciones y sesión).
- Añadido `EncabezadoSJ` en `src/components/PantallaSJ.tsx` (`IonHeader`, `IonToolbar`, `IonBackButton` con `defaultHref` obligatoria, texto «Atrás» visible solo en iOS, etiqueta «Volver», 44×44 px, transparente). `PantallaSJ` y `MarcoAccesoSJ` lo muestran con la prop `atras`.
- Regla: toda pantalla secundaria usa `atras` con su ruta por defecto; las raíz no. Reemplazados los «Volver» de Perfil, Recordatorios, Glosario, Sesión y Recuperar contraseña; añadido el encabezado a Ficha, Términos y Privacidad. Rutas por defecto en el README.
- Decisión: el flujo inicial obligatorio (`/aviso-medico`, `/salud`, `/cuestionario-rutina`, `/rutina`) queda sin botón atrás; se mantienen las acciones «Volver a Hoy», «Entendido» e «Ir a Hoy».
- Hallazgo y corrección: `@ionic/react-router@8.8.8` fijaba `@ionic/react@8.8.8` y el proyecto usaba 8.8.19, lo que empaquetaba dos copias de Ionic y dejaba al router sin contexto compartido (el botón atrás recargaba la página). Se alineó `@ionic/react-router` a 8.8.19; el chunk principal bajó de 2,2 MB a 1,47 MB. Con la pila de Ionic activa, las páginas anteriores quedan ocultas en el DOM y las pruebas consultan solo la página visible.
- No hay manejadores propios del botón físico de Android ni del gesto de iOS: los gestiona `IonRouterOutlet`.
- Pendiente: probar en navegador (vista Android e iPhone), emulador con botón físico y, si es posible, iPhone con gesto de deslizar y notch; revisar que las transiciones de página se vean bien ahora que la pila de Ionic funciona.
- Verificación: `npm test` (270 pruebas/40 archivos) y `npm run build` aprobados.

### 2026-11-20 — Botón atrás en la rutina con rutina guardada

- Rama `fix/atras-rutina` desde `develop` (incluye los PR #17 y #18 de Nayeli: resumen de rutina, «Mi rutina», «Cambiar mi rutina» y buscador del glosario).
- Problema: `/rutina` y `/cuestionario-rutina` quedaron sin botón atrás por ser flujo inicial, pero ahora también se abren desde Perfil («Mi rutina») y desde Rutina («Cambiar mi rutina»).
- `RutinaAsignada` muestra `atras="/perfil"` en su vista de contenido, que solo existe con rutina guardada; durante la carga no hay encabezado.
- `CuestionarioRutina` añade `tieneRutina` (null mientras se comprueba) en la misma lectura que la precarga de respuestas: muestra `CargandoSJ` sin encabezado mientras es null y `atras="/rutina"` solo si hay rutina. La precarga de Nayeli no cambia.
- Decisión: sin caso especial para «Crear mi rutina» en Recordatorios sin rutina; no es alcanzable por la interfaz porque Hoy redirige antes al cuestionario. Por URL directa queda sin botón atrás, como el flujo inicial.
- Pruebas: `NavegacionRutina.test.tsx` usa `IonReactMemoryRouter` y `paginaVisible` (nuevo en `src/test/navegacion.tsx`) para navegar de verdad; las pruebas del cuestionario esperan a que termine la comprobación de rutina.
- Pendiente: probar a mano con una cuenta nueva y con Perfil → Mi rutina → Cambiar mi rutina, con el botón en pantalla, el físico de Android y el gesto de iOS.
- Verificación: `npm test` (292 pruebas/41 archivos) y `npm run build` aprobados.

### 2026-11-20 — Guardado de series en el dispositivo (RF-10, RF-13)

- Rama `feature/guardar-series` desde `develop` (con el PR #19).
- Añadidos `src/types/series.ts` (`SerieRegistrada`, `AUTOEVALUACIONES`, `ESTADOS_SERIE`; `src/utils/sesion.ts` reexporta la autoevaluación) y `seriesLocal` en `src/repositories/local.ts` con `guardar`, `listar` y `listarPorEjercicio`. Clave: `spotter.usuario.<id>.series` (lista); se descartan las series corruptas una a una.
- `/sesion` guarda antes de avanzar, con «Guardando…», bloqueo de doble toque por `useRef` y error en español sin avanzar ni perder datos. Peso `null` en peso corporal; el peso se guarda en la unidad del perfil junto con `unidad`.
- Decisión: «Sentí dolor» guarda la serie con `estado: 'interrumpida-por-molestia'` y la autoevaluación si existe; si falla, avanza igual y lo informa.
- Datos solo en el dispositivo y sin cifrar.
- Pendientes: historial, gráfica, progresión, IA, Supabase, cifrado (RNF-11), límite de crecimiento de la lista y descanso RF-11 entre series.
- Verificación: `npm test` (309 pruebas/41 archivos) y `npm run build` aprobados. El push falló varias veces por falta de red (`Could not resolve host: github.com`); los commits quedaron locales hasta recuperar la conexión.

### 2026-11-20 — Descanso entre series y publicación del guardado (RF-10, RF-11, RF-13)

- Continuación en `feature/guardar-series`: los 4 commits que no se habían podido subir por falta de red (pruebas del repositorio, guardado en `/sesion`, pruebas y documentación) se publicaron. El guardado de series y la interrupción por «Sentí dolor» con `estado: 'interrumpida-por-molestia'` ya estaban implementados; `SerieRegistrada` no cambió de forma porque Nayeli la usa para el historial.
- `TemporizadorDescanso` acepta `alTerminar` (al llegar a cero o al saltar); sin la prop se comporta igual que antes.
- `/sesion` muestra el descanso solo tras guardar una serie que no es la última del ejercicio, con la serie anterior como referencia; al terminar o saltar vuelve el registro. «Sentí dolor» cierra el descanso.
- Cambios en `SesionEntrenamiento.tsx` localizados en el guardado y el render del registro; no se tocó cómo se elige el día ni `Hoy.tsx`. Puede haber un conflicto pequeño con `feature/calendario-biblioteca` de Nayeli, que no estaba publicada en GitHub al revisar.
- Datos solo en el dispositivo y sin cifrar. Pendientes: historial (Nayeli), gráfica, progresión, IA, Supabase, cifrado y notificaciones al terminar el descanso.
- Verificación: `npm test` (315 pruebas/41 archivos) y `npm run build` aprobados.

### 2026-11-20 — Progresión de peso por reglas (RF-15 a RF-19)

- Rama `feature/progresion` desde `develop` (con el PR #20 de guardado de series).
- Añadido `src/utils/progresion.ts`: `calcularProgresion` (pura), `agruparEnSesiones`, `explicarProgresion` y `recomendarParaEjercicio`. Sin cambios en `SerieRegistrada`.
- Decisiones: sesión = mismo día local y número de serie creciente; éxito exige todas las series objetivo, sin Difícil y con las repeticiones; sesión incompleta sin fallos mantiene sin contar como fallo; incremento 2,5 kg / 5 lb y bajada del 10 % redondeada a ese múltiplo; peso corporal sube 2 repeticiones sobre lo logrado y no baja; molestia en la última sesión mantiene.
- Hoy carga también `seriesLocal.listar` (si falla, usa []) y muestra la recomendación; cambios localizados en la carga y en la fila de cada ejercicio. `/sesion` acumula las series guardadas en la sesión y muestra `ResumenSesion` al terminar; no se tocó cómo se elige el día.
- Pendientes: ajuste manual del peso, IA real, historial, gráfica y Supabase.
- Verificación: `npm test` (342 pruebas/42 archivos) y `npm run build` aprobados. La interfaz del resumen no se revisó visualmente en un dispositivo.

### 2026-11-24 — Límite de series guardadas

- Rama `fix/limite-series` desde `develop` (con el PR #25 de calendario semanal).
- Problema: la lista `spotter.usuario.<id>.series` crecía sin tope.
- Añadido `src/repositories/recorteSeries.ts`: `recortarSeries` (pura), `LIMITE_SERIES_POR_USUARIO = 2000` y `SESIONES_PROTEGIDAS_POR_EJERCICIO = 3` (reutiliza `SESIONES_FALLIDAS_PARA_BAJAR` de la progresión). `seriesLocal.guardar` aplica el recorte antes de escribir.
- Decisión: además del límite, se protegen siempre la serie recién guardada y las series de las 3 últimas sesiones de cada ejercicio, aunque la lista quede algo por encima de 2000; así la progresión nunca vuelve al peso del catálogo por el recorte.
- Pruebas: `recorteSeries.test.ts` (función pura) y casos de repositorio en `local.test.ts` con el límite real; el fallo de escritura se simula con `vi.mock('./almacenLocal')` porque `Preferences` no se puede espiar.
- Verificación: `npm test` (439 pruebas/53 archivos) y `npm run build` aprobados.

### 2026-11-24 — Revisión de la sesión de 30 días (RF-01)

- Revisión sin cambios de código ni de configuración: no se encontró ningún error real.
- `createClient` usa `persistSession: true` y `autoRefreshToken: true`; la sesión vive en `localStorage` del WebView. `getSession()` renueva el token caducado al abrir la app y la renovación automática se pausa y reanuda con `visibilitychange` (comprobado en `@supabase/auth-js` 2.117.3).
- Pendiente (panel de Supabase): confirmar en Authentication → Sessions que no hay límite de duración ni de inactividad menor a 30 días, y revisar la caducidad del JWT. Hasta entonces no se afirma el cumplimiento de RF-01.

### 2026-11-24 — Ajuste manual del peso (RF-17)

- Rama `feature/ajuste-manual-peso` desde `develop` (con el PR #26 del límite de series). No se tocaron el servicio de autenticación ni Perfil (Nayeli trabaja en eliminar cuenta).
- Añadidos `src/types/ajustesPeso.ts`, `ajustesPesoLocal` (clave `spotter.usuario.<id>.ajustesPeso`, incluida en `borrarDatosLocales`) y en `progresion.ts` `PESO_MAXIMO_MANUAL` (300 kg / 660 lb), `esPesoManualValido`, el motivo `ajuste-manual` y el parámetro opcional `ajuste` (`recomendarParaEjercicio` lo recibe como quinto argumento, sin cambiar las llamadas existentes).
- Decisiones: el ajuste manda mientras sea más reciente que la última serie del ejercicio y no tiene tope de subida; al cambiar de unidad se convierte y redondea; el diálogo reutiliza el patrón `sj-dialogo` de `AyudaTermino` en lugar de `IonModal`.
- `/sesion` ahora parte del peso recomendado o ajustado en vez del peso del catálogo (antes la recomendación solo se veía en Hoy); cambio localizado en la carga inicial y en `pesoActual`, sin tocar la elección del día.
- Pendientes: IA real, Supabase y revisar el diálogo en un celular (no se verificó visualmente).
- Verificación: `npm test` (464 pruebas/53 archivos) y `npm run build` aprobados.

### 2026-11-24 — Aviso de fin de descanso (RF-11)

- Rama `feature/aviso-descanso` desde `develop` (con los PR #26 y #27).
- `@capacitor/local-notifications` 7.0.7 ya estaba instalado y registrado en Gradle; `git diff --ignore-cr-at-eol` no mostró cambios reales en `capacitor.build.gradle` ni `capacitor.settings.gradle`, así que siguen sin subirse.
- Añadidos el ícono `ic_stat_spotterjn` y la configuración `LocalNotifications` en `capacitor.config.ts`; el servicio `src/services/notificaciones.ts`; `TemporizadorDescanso` calcula con la hora real de fin y emite `alCambiarFin`; `/sesion` programa el aviso solo en segundo plano y lo cancela en todos los demás casos.
- Decisiones: sin `SCHEDULE_EXACT_ALARM` (el aviso puede retrasarse unos segundos); aviso solo en segundo plano para evitar dobles avisos; permiso pedido en el primer descanso con explicación y sin insistir; al cerrarse el descanso se cancela solo si la app está visible o la hora de fin aún no llegó, para no borrar un aviso recién mostrado.
- Pendiente: probar en un celular real (permiso, segundo plano, saltar, ±30 s y avisos viejos).
- Verificación: `npm test` (484 pruebas/54 archivos), `npm run build`, `npx cap sync android` y `gradlew assembleDebug` aprobados.

### 2026-11-24 — Revisión de errores antes de la entrega

- Rama `fix/revision-errores` desde `develop` (con el PR #28 del aviso del descanso). Comprobaciones: `npm test`, `npm run build` y `tsc --noEmit` sin errores ni avisos de consola; sin linter; `npm audit` con 7 avisos solo en dependencias de desarrollo (sin cambios).
- Error corregido (Alta): Ionic reutiliza las páginas que quedan en la pila, así que Hoy y Mi rutina no recargaban al volver. Hoy mostraba el peso anterior tras una sesión, el ejercicio viejo tras cambiarlo y los datos borrados tras «Borrar datos»; Mi rutina mostraba la rutina anterior tras cambiarla. Se añadió `useRecargaAlVolver` (basado en la ubicación del router, porque `useIonViewWillEnter` no se dispara al volver en jsdom) y se usa en `Hoy.tsx` y `RutinaAsignada.tsx`. Pruebas en `RecargaAlVolver.test.tsx`, verificadas fallando sin el arreglo.
- Pendientes no corregidos por decisión: Perfil («Tu rutina actual» desactualizado tras cambiar la rutina; `Perfil.tsx` es de Nayeli), contadores que guardan el último valor válido si el campo queda vacío o fuera de rango (sospecha), pesos en kg durante un instante antes de cargar un perfil en lb, y «Reintentar» en Mi progreso.
- Sospechas a verificar en el celular: teclado tapando campos (no hay `windowSoftInputMode`) y el disparo de `visibilitychange` al pasar a segundo plano para el aviso del descanso.
- Verificación: `npm test` (488 pruebas/55 archivos), `npm run build` y `tsc --noEmit` aprobados.

### 2026-11-24 — Corrección del aviso de fin de descanso (RF-11)

- Reportado en un celular real: al terminar el descanso no salía ninguna notificación.
- Causas: (1) con la app abierta no se programaba el aviso por diseño; (2) en segundo plano dependía de `visibilitychange`, que Capacitor 7 en Android no emite al pausar la app; (3) sin alarmas exactas el aviso llegaba tarde y el temporizador, que sigue corriendo, lo cancelaba al llegar a cero.
- Arreglo: el aviso se programa al empezar el descanso y se reprograma con ±30 s; solo se cancela al saltar (o restar hasta cero), con «Sentí dolor» o al salir de la sesión antes de tiempo; al terminar el tiempo no se cancela. `TemporizadorDescanso` pasa el motivo del fin (`tiempo` | `saltado`) a `alTerminar`. Al conceder el permiso en el primer descanso se programa el aviso en curso.
- Decisión del usuario: se declaran `USE_EXACT_ALARM` y `SCHEDULE_EXACT_ALARM` (`maxSdkVersion="32"`) para que el aviso sea puntual.
- Pruebas: las del aviso en `SesionEntrenamiento.test.tsx` se reescribieron para el comportamiento nuevo y se verificó que fallan con el código anterior.
- Pendiente: confirmar en el celular que la notificación suena con la app abierta y en segundo plano.
- Verificación: `npm test` (490 pruebas/55 archivos), `npm run build`, `tsc --noEmit` y `gradlew assembleDebug` aprobados; la APK incluye los permisos de alarma exacta.

- Seguimiento (mismo día): en Android 14 seguía sin «saltar». En un emulador, con depuración remota del WebView, se comprobó que la notificación sí se publicaba a la hora exacta, pero por el canal `default` del plugin (importancia 3): solo un ícono en la barra de estado. Con un canal propio `descanso` de importancia 5 Android muestra la ventana emergente. `programarAvisoDescanso` crea ese canal y envía el aviso por él (commit `d1ec259`).

### 2026-11-26 — Errores finales y botón atrás de Android

- Rama `fix/errores-finales` desde `develop` (`bbfa552`, PR #33).
- #5 (Media) corregido: Perfil recarga «Tu rutina actual» al volver de cambiar la rutina con `useRecargaAlVolver('/perfil')`. Prueba en `RecargaAlVolver.test.tsx`, verificada fallando sin el arreglo.
- #6 (Media) confirmado y corregido: al vaciar el peso o las repeticiones y salir del campo, `ContadorNumerico` ponía el mínimo (0) y la serie se guardaba con 0. Ahora un campo vacío recupera el último valor válido; fuera de rango se sigue ajustando al límite. Prueba en `SesionEntrenamiento.test.tsx`, verificada fallando sin el arreglo; se actualizó la prueba del contador que esperaba 0.
- Botón atrás físico de Android: sin `@capacitor/app`, Capacitor cerraba la app cuando el WebView no tenía historial. Se añadió `@capacitor/app` 7.1.2 (cambian de verdad `capacitor.build.gradle` y `capacitor.settings.gradle`, solo con las líneas del plugin) y `src/services/botonAtras.ts`: el botón físico pulsa el botón atrás de la pantalla visible y, en pantallas sin él, no hace nada (nunca cierra ni minimiza). Los diálogos propios se cierran con `useCerrarConBotonAtras`.
- Teclado: no se cambió nada sin probarlo en un dispositivo. Con `targetSdkVersion` 35, Android 15 obliga el modo de borde a borde y el ajuste automático del teclado puede no reducir la vista; si en el celular el teclado tapa campos, la opción a evaluar es `android.adjustMarginsForEdgeToEdge` en `capacitor.config.ts`.
- Pendientes sin cambios: #7 (kg un instante con perfil en lb) y #8 («Reintentar» en Mi progreso).
- Verificación: `npm test` (544 pruebas/57 archivos), `npm run build` y `tsc --noEmit` aprobados. Pendiente: APK y prueba en un celular real del botón atrás y del teclado.

### 2026-11-27 — Rediseño del perfil

- Rama `style/rediseno-perfil` desde `develop` (con el PR #34). Pedido del usuario: un perfil más atractivo, al estilo de las apps de referencia, sin cambiar colores ni la forma de los botones.
- Opción elegida: «Tarjeta + secciones». Cabecera con avatar de iniciales, meta y cifras (días por semana, sesiones, unidad); «Editar perfil» plegable; secciones Tu entrenamiento, Preferencias y Ayuda con filas ícono + título + detalle + flecha; Borrar datos y Cerrar sesión al final.
- Añadido `src/utils/perfil.ts` (`inicialesDe`, `contarSesiones`) y estilos `sj-perfil-*`, `sj-menu` y `sj-fila-menu` en `spotter-ui.css`. Se conservaron los textos que comprueban las pruebas existentes (todas siguen pasando sin cambios).
- Corregido durante el trabajo: el bloque de edición decidía si abrirse antes de cargar el perfil; ahora lo decide al terminar de cargar.
- Nota: el PR #35 (`fix/boton-atras-android`) quedó con las dos versiones del botón atrás tras fusionar `develop` en él desde GitHub; en una copia temporal no compilaba (8 errores de `tsc`, 24 pruebas fallando). No se fusiona sin revisarlo.
- Pendiente: revisar el perfil en el celular.
- Verificación: `npm test` (553 pruebas), `npm run build` y `tsc --noEmit` aprobados.
- Ajustes tras revisarlo en el celular: barra «Esta semana: X de Y sesiones» en la cabecera (reutiliza `estadoDeLaSemana`), experiencia en lenguaje natural, equipo resumido («Equipo: N tipos») y «Aún no registras sesiones» con cero (`describirExperiencia`, `resumirEquipo`, `describirSesiones` en `src/utils/perfil.ts`).

### 2026-11-27 — Rediseño de Hoy (tira semanal y tarjeta)

- Opción elegida por el usuario: «Tira semanal + tarjeta». La columna «Elegir otro día» pasa a ser una tira de siete días (L a D con la fecha, `diasDeLaSemanaActual` en `utils/semana.ts`); solo los días de entrenamiento son `radio`, los de descanso van con `aria-hidden`.
- El grupo conserva el nombre accesible «Elegir otro día» y cada día la etiqueta «Día · lunes — Hoy toca», así que las pruebas de elegir día de Nayeli siguen sin cambios.
- La tarjeta «Tu sesión» lleva el saludo, chips (`partesDeLaSesion` en `utils/rutina.ts`; `describirSesion` las une con « · ») y «Empezar entrenamiento». El pie queda con Perfil y Cerrar sesión.
- No se cambiaron colores ni la forma de los botones; el CSS está junto a las reglas de Hoy en `spotter-ui.css`.
- Ojo en pruebas: `CargandoSJ` también tiene `role="status"`; el aviso de faltas se busca por su texto.
