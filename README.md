# SpotterJN

SpotterJN es un proyecto académico de Computación Móvil para apoyar a personas que comienzan a entrenar en el gimnasio. La idea del producto es registrar entrenamientos y ofrecer orientación gradual sobre el peso y las repeticiones. El repositorio contiene actualmente una aplicación web en desarrollo; las funciones de entrenamiento descritas aquí son objetivos del proyecto, no funcionalidades ya implementadas.

## Estado actual

La aplicación está construida con **Ionic React, React, TypeScript, Vite y Capacitor**. El flujo de **Supabase Auth** incluye registro, inicio de sesión, persistencia y cierre de sesión. Hay una pantalla básica para consultar la primera jornada y un temporizador de descanso reutilizable; el registro de entrenamiento todavía no está implementado.

## Tecnologías y alcance

| Área | Estado |
| --- | --- |
| Interfaz web | Configurada: Ionic React, React 18, TypeScript y Vite |
| Desarrollo y compilación web | Configurados: `npm run dev`, `npm run build` y `npm run preview` |
| Aplicación Android | Capacitor Android configurado; requiere Android Studio, SDK y emulador instalados para ejecutarse |
| Pruebas automatizadas | Configuradas con Vitest y Testing Library |
| Autenticación | Supabase Auth: registro, inicio, sesión persistente y cierre local en este dispositivo |
| Perfil, salud y rutina (M2) | En desarrollo: almacenamiento local por usuario con Capacitor Preferences detrás de interfaces de repositorio, sin cifrado; la migración a Supabase queda pendiente |
| Sesión y descanso (M3/RF-11) | `/sesion` muestra la primera jornada sin registrarla; temporizador de descanso independiente con cuenta regresiva y controles |
| Tablas propias en Supabase, RLS e IA | No implementados |

Los módulos de cuenta, perfil y rutina, registro de sesiones, progresión, explicaciones con IA, modo sin conexión y guía de máquinas son parte de la visión del proyecto y deberán implementarse por separado.

## Estructura actual

```text
SpotterJN/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   │   ├── AnimacionEjercicio.tsx # animación del ejercicio en iframe aislado
│   │   ├── AyudaTermino.tsx      # ícono de ayuda con la definición de un término
│   │   ├── CerrarSesion.tsx
│   │   ├── PantallaSJ.tsx       # marco de pantalla, botones y acceso compartidos
│   │   └── TemporizadorDescanso.tsx
│   ├── context/
│   │   ├── PerfilContext.tsx     # perfil y unidad de peso (kg/lb)
│   │   └── SesionContext.tsx
│   ├── data/
│   │   ├── ejercicios.ts         # catálogo de ejercicios de las rutinas
│   │   ├── glosario.ts           # términos básicos y sus definiciones
│   │   └── guias.ts              # guía de cada ejercicio (ajuste, movimiento, ubicación)
│   ├── pages/
│   │   ├── Ajustes.tsx
│   │   ├── AvisoMedico.tsx
│   │   ├── Consentimientos.tsx
│   │   ├── CuestionarioRutina.tsx
│   │   ├── CuestionarioSalud.tsx
│   │   ├── FichaEjercicio.tsx
│   │   ├── Glosario.tsx
│   │   ├── Hoy.tsx
│   │   ├── Login.tsx
│   │   ├── Perfil.tsx
│   │   ├── Registro.tsx
│   │   ├── RutinaAsignada.tsx
│   │   ├── SesionEntrenamiento.tsx
│   │   └── Salud.css
│   ├── assets/
│   │   └── logo-spotterjn.webp
│   ├── repositories/
│   │   ├── repositorios.ts       # interfaces de perfil, salud y rutina
│   │   ├── local.ts              # implementación local (Capacitor Preferences)
│   │   └── almacenLocal.ts
│   ├── services/
│   │   ├── auth.ts
│   │   ├── recordatorios.ts      # programa los recordatorios locales
│   │   └── supabase.ts
│   ├── types/
│   │   ├── consentimientos.ts
│   │   └── perfil.ts
│   ├── utils/
│   │   ├── rutina.ts             # asignación de la rutina inicial
│   │   ├── unidades.ts           # conversión kg/lb
│   │   └── validaciones.ts
│   ├── vite-env.d.ts
│   ├── theme/
│   │   ├── spotter-ui.css
│   │   └── variables.css
│   ├── test/
│   │   └── setup.ts
│   ├── App.test.tsx
│   ├── components/*.test.tsx
│   └── pages/*.test.tsx
├── AGENTS.md
├── android/                      # Proyecto nativo Capacitor
├── index.html
├── .env.example
├── ionic.config.json
├── capacitor.config.ts
├── package.json
├── package-lock.json
├── tsconfig.json
└── vite.config.ts
```

## Sistema visual

La aplicación usa un tema claro fijo inspirado en la pantalla de acceso compartida. Los tokens visuales se centralizan en `src/theme/spotter-ui.css`; `src/theme/variables.css` asigna esos tokens a las variables de Ionic y ambos estilos globales se cargan desde `src/main.tsx`.

Tokens principales:

| Token | Valor | Uso |
| --- | --- | --- |
| `--sj-color-fondo` | `#e0eaf6` | Fondo azul claro |
| `--sj-color-campo` | `#e7e6e2` | Fondo gris cálido de campos |
| `--sj-color-tinta` | `#1a1a1a` | Texto, bordes y selección activa |
| `--sj-color-primario` | `#0066cc` | Acentos, foco y progreso |
| `--sj-borde` / `--sj-radio` | `2px solid` / `0` | Bordes marcados y esquinas rectas |
| `--sj-espacio-*` | escala rem existente | Separaciones |
| `--sj-fuente-*` | escala rem existente | Tipografía Archivo y tamaños |

Para nuevas pantallas autenticadas o de entrenamiento, usa `PantallaSJ` y `BotonSJ` desde `src/components/PantallaSJ.tsx`. `PantallaSJ` ofrece el encabezado y el marco con áreas seguras; `BotonSJ` expone las variantes `principal`, `secundario` y `texto`. Para acceso, `MarcoAccesoSJ`, `LogoSJ` y `PestanasAccesoSJ` comparten el diseño del logo y las pestañas. Estas navegan por las rutas existentes y mantienen el paso obligatorio de Consentimientos antes del registro.

Los campos Ionic usan la clase `sj-campo` y una etiqueta visible; las casillas de acceso reciben el estilo compartido por `.sj-acceso`. `sj-tarjeta` sirve para superficies con borde, y los estados usan `sj-cargando`, `sj-error` y `sj-ok`. Las alertas, cargas, toast y modales de Ionic reciben colores, tipografía y bordes del tema global. No dupliques valores de color, radios, espacios o tamaños en hojas de estilo de páginas; usa los tokens o las clases compartidas. Las pantallas respetan las áreas seguras con `env(safe-area-inset-*)`.

## Requisitos

- Node.js 22 o superior y npm.
- Para Android: Android Studio, Android SDK API 35, Platform Tools (`adb`) y un emulador o dispositivo con depuración USB.

## Instalar y ejecutar en web

Desde la raíz del repositorio:

```bash
npm install
npm run dev
```

Abre en el navegador la dirección local que muestre Vite en la terminal (normalmente `http://localhost:5173`). El servidor se inicia con `--host 0.0.0.0`, por lo que también puede exponerse en la red local; usa la dirección IP del equipo para acceder desde otro dispositivo.

Para generar y servir una compilación local de producción:

```bash
npm run build
npm run preview
```

La compilación estática se genera en `dist/`.

## Perfil y rutina (M2)

El flujo de primera vez, tras iniciar sesión, es: `Hoy` redirige a `/aviso-medico` si no hay respuestas de salud (RF-05), después a `/cuestionario-rutina` si no hay rutina (RF-06), que asigna una rutina predefinida y la muestra en `/rutina`. `/perfil` permite editar nombre (1 a 40 caracteres), meta principal y unidad de peso kg/lb (RF-07); la unidad se aplica de inmediato en `Hoy` y en la rutina. `Hoy` muestra la próxima sesión con sus ejercicios, series y repeticiones (RF-08).

Limitaciones actuales:

- Los datos de M2 se guardan en el dispositivo con Capacitor Preferences, detrás de las interfaces de `src/repositories/repositorios.ts` y bajo claves asociadas al ID del usuario autenticado. No están cifrados ni se sincronizan con Supabase; RNF-11 (cifrado en reposo y separación en backend) queda pendiente.
- Los datos guardados por versiones anteriores en claves locales sin usuario no se migran automáticamente ni se borran: la app actual no los muestra. Tras actualizar, cada usuario deberá volver a completar el flujo M2 para generar sus datos asociados a su cuenta.
- Los pesos que muestra `Hoy` son los iniciales del catálogo (`src/data/ejercicios.ts`), no cálculos de progresión: dependen de M3 y M4. Hasta que exista el historial de sesiones, la "próxima sesión" es siempre el primer día de la rutina.
- `/sesion` muestra los ejercicios de la primera jornada y permite volver a Hoy. Es un esqueleto visual: todavía no registra series, pesos ni historial (M3).
- El cuestionario de rutina se asigna con plantillas fijas según días y equipo, sin IA.

## Sesión de entrenamiento (M3)

La ruta protegida `/sesion`, accesible desde «Empezar entrenamiento» en Hoy, carga y muestra los ejercicios de la primera jornada de la rutina del usuario. Permite volver a Hoy y no registra ni persiste actividad. El componente de descanso RF-11 es independiente: ofrece una cuenta regresiva inicial de 90 segundos, círculo de tiempo restante y controles para sumar/restar 30 segundos o saltar; no se conecta todavía al flujo de una sesión. La duración inicial es 90 segundos y comienza automáticamente.

## Ficha de ejercicio (M5, RF-21)

Cada ejercicio tiene una ficha en `/ejercicio/:id` con su animación, cómo ajustar la máquina, cómo hacer el movimiento y dónde suele estar. Se abre desde el botón de ayuda de cada ejercicio en `Hoy`. La primera vez muestra el aviso «Primera vez con esta máquina» y el botón «Listo, empezar series»; al pulsarlo se guarda que la ficha ya se vio (Capacitor Preferences) y no vuelve a mostrarse el aviso, aunque la ficha puede reabrirse con el botón de ayuda.

- Las animaciones están en `public/ejercicios/`: archivos HTML autocontenidos (hoy `press-banca.html`, que se muestra en un `iframe` con `sandbox="allow-scripts"`; el comando `npm run animacion:crear` genera más a partir de 3 imágenes) o videos MP4 comprimidos (hoy `flexiones.mp4` y `sentadilla-peso-corporal.mp4`, que se reproducen en bucle y silenciados). Ver `docs/animaciones-ejercicios.md`. Se pausan al tocarlas y no se inician si el sistema pide menos movimiento.
- El contenido de cada guía está en `src/data/guias.ts`; los 16 ejercicios del catálogo tienen su texto, pero solo el press de banca, las flexiones y la sentadilla con peso corporal tienen animación. Los demás muestran «Animación próximamente». Un ejercicio que no esté en `guias.ts` usa un texto provisional.
- «Listo, empezar series» guarda la ficha como vista y lleva a la sesión de entrenamiento (`/sesion`). El botón de cambiar ejercicio (RF-14) no está implementado.

## Glosario (M5, RF-22)

`/glosario` lista los términos básicos (serie, repetición, fallo, RIR y peso de trabajo) con una definición en lenguaje sencillo; se abre desde el botón «Glosario» del perfil. El componente `AyudaTermino` muestra un ícono de ayuda junto a un término y, al tocarlo, un cuadro con su definición (se cierra con «Entendido», con Escape o tocando el fondo). Hoy se usa en la rutina asignada para «series» y «repeticiones»; para añadir un término nuevo basta con agregarlo a `src/data/glosario.ts` y usar `<AyudaTermino termino="id">` donde aparezca.

## Recordatorios (M5, RF-24)

En `/ajustes` (botón «Recordatorios» del perfil) el usuario activa o desactiva los recordatorios y elige la hora con un selector de reloj. Se programa una notificación local semanal, «Hoy toca entrenar», en cada día de entrenamiento de la rutina, con `@capacitor/local-notifications`. Si el sistema no concede el permiso de notificaciones, se explica cómo activarlo en los ajustes del teléfono y los recordatorios no se activan. Al cambiar la rutina, o al abrir los ajustes, los recordatorios activos se reprograman.

- La rutina define cuántos días se entrena, no cuáles; los días se reparten con descanso entre sesiones (por ejemplo, 3 días son lunes, miércoles y viernes, 2 son lunes y jueves). Está en `src/utils/recordatorios.ts`.
- Los ajustes se guardan en el dispositivo con Capacitor Preferences, separados por usuario como el resto de datos de M2 y M5.
- En Android 13 o superior el sistema pide el permiso `POST_NOTIFICATIONS`, que declara el propio plugin. Las alarmas no son exactas, así que el sistema puede retrasar unos minutos la notificación para ahorrar batería.
- No se ha probado en un emulador ni en un dispositivo: las pruebas automáticas simulan el plugin. En el navegador las notificaciones programadas no se disparan con la app cerrada.
- Tras añadir o cambiar plugins de Capacitor hay que ejecutar `npm run android:sync` y confirmar los archivos `android/capacitor.settings.gradle` y `android/app/capacitor.build.gradle`; sin ese paso el plugin no existe en la app nativa.

## Supabase y variables de entorno

1. Crea un proyecto en [Supabase](https://supabase.com/dashboard) y copia su URL y clave **anon/publicable** desde la configuración API del proyecto.
2. En la raíz del repositorio, crea `.env` tomando `.env.example` como referencia:

   ```dotenv
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   ```

   Coloca localmente los valores de tu proyecto en esas variables. No compartas ni confirmes `.env`. La clave `service_role` y las claves `sb_secret_` son secretas y nunca deben incluirse en la app cliente.
3. En Supabase, durante el desarrollo, desactiva **Authentication > Providers > Email > Confirm email** para permitir que el registro cree una sesión inmediatamente. La confirmación y sus enlaces de retorno no forman parte del alcance actual.

El cliente Supabase se centraliza en `src/services/supabase.ts` y falla explícitamente si falta una variable requerida.

Si Auth devuelve un error, la interfaz muestra un mensaje localizado y, para códigos desconocidos, el código técnico sin el texto crudo del proveedor. Si indica que no pudo conectar, comprueba localmente la URL del proyecto en `.env`, la conexión a internet y que el proyecto Supabase esté disponible. Un HTTP 404 suele indicar que la URL no corresponde a la **Project URL** actual o que el proyecto ya no está activo. Compara localmente `VITE_SUPABASE_URL` con **Project Settings > API > Project URL**; usa la URL base `https://<project-ref>.supabase.co`, sin añadir `/auth/v1` ni `/rest/v1`. No compartas `.env`, claves ni capturas que las muestren.

Las rutas de acceso y registro usan `/login`, `/consentimientos` y `/registro`; la ruta protegida `/hoy` requiere una sesión. Consentimientos y registro transmiten la autorización opcional de datos de salud y la fecha ISO de aceptación en los metadatos del usuario de Supabase Auth.

### Cierre de sesión (RF-01)

El componente reutilizable **Cerrar sesión** está disponible en Hoy y Perfil. Al tocarlo, presenta un modal con **Cancelar** y **Cerrar sesión**. Cancelar no realiza ninguna operación; confirmar muestra el estado de carga, evita confirmaciones duplicadas y llama al servicio de Auth con alcance local. Si falla, informa el error en español y conserva la pantalla; si tiene éxito, reemplaza la ruta por `/login`. Las rutas protegidas siguen requiriendo una sesión.

El cierre local no invalida las sesiones de otros dispositivos. Los datos de perfil, salud y rutina no se eliminan al salir: permanecen asociados al ID de su usuario para que otra cuenta en el mismo dispositivo no los reciba.

La sesión persiste mediante los tokens que administra Supabase en el almacenamiento de la aplicación. **No se afirma que cumpla la persistencia de 30 días indicada por RF-01**: la duración efectiva depende de la configuración y renovación de sesiones de Supabase y queda pendiente verificarla en el proyecto.

### Probar el flujo en web

1. Inicia Vite con `npm run dev` y abre la URL local.
2. Entra a **Crear cuenta**, acepta ser mayor de edad y los términos; la autorización de datos de salud es opcional.
3. Registra un correo nuevo y una contraseña de al menos ocho caracteres con una letra y un número.
4. Cierra sesión desde **Hoy** y confirma el cierre.
5. Inicia sesión con la misma cuenta. Cierra y vuelve a abrir la aplicación para comprobar si Supabase restaura la sesión.
6. En Supabase, verifica el usuario en **Authentication > Users**.

### Probar el flujo en Android

Con `.env` configurado y el emulador encendido, sincroniza y ejecuta:

```bash
npx cap sync android
npm run android:run
```

Realiza en el emulador los mismos pasos de registro, cierre, inicio y reapertura que en web. La confirmación por correo y los enlaces profundos de Android no forman parte de esta etapa.

## Pruebas y validación

Ejecuta las pruebas automatizadas con:

```bash
npm test
```

Para ejecutar las pruebas en modo watch mientras desarrollas:

```bash
npm run test:watch
```

La suite automatizada cubre validaciones, el estado habilitado de los botones, errores de login y registro, consentimientos obligatorios y la redirección de `/hoy` sin sesión. Las pruebas simulan el servicio de autenticación y no llaman al proyecto Supabase real.

Valida también tipos y compilación de producción:

```bash
npm run build
```

## Android con Capacitor y Android Studio

### Requisitos del equipo

- VS Code, Node.js y npm para desarrollar.
- Android Studio con Android SDK API 35, Platform Tools (`adb`) y un emulador Android instalado.
- JDK 21 (o JDK 17-23) para Gradle 8.11. El lanzador del proyecto detecta `SPOTTER_ANDROID_JDK`, `JAVA_HOME`, `ANDROID_STUDIO_JDK` o el JDK local en `%LOCALAPPDATA%\Programs\SpotterJN\Temurin21`.
- Android SDK API 35 y Android SDK Build-Tools 35.0.0. Se requieren aunque el emulador utilice una imagen Android más reciente.

### Preparar y ejecutar en el emulador

Capacitor y el proyecto nativo Android ya están configurados y versionados. Desde VS Code, en la raíz del repositorio:

1. Instala las dependencias del proyecto:

   ```bash
   npm install
   ```

2. Desde Android Studio **SDK Manager**, instala Android SDK API 35, Build-Tools 35.0.0 y Android SDK Platform-Tools.
3. Instala JDK 21 si no está instalado. Configura `SPOTTER_ANDROID_JDK` en la terminal de VS Code si el JDK no está en la ubicación local detectada:

   ```powershell
   $env:SPOTTER_ANDROID_JDK = "C:\ruta\al\jdk-21"
   ```

   Para abrir el proyecto en Android Studio, usa **Settings > Build, Execution, Deployment > Build Tools > Gradle > Gradle JDK** y selecciona la misma carpeta de JDK 21. Android Studio puede conservar su propio JDK para ejecutarse: el ajuste afecta solo al proceso de compilación de Gradle.
4. Inicia un emulador desde Android Studio **Device Manager**.
5. Desde VS Code, compila y sincroniza los recursos web con Android:

   ```bash
   npm run android:sync
   ```

   El identificador actual es `com.spotterjn.app` en `capacitor.config.ts`; cámbialo si tu equipo define otro antes de publicar la app.
6. Desde VS Code, ejecuta la app en el emulador:

   ```bash
   npm run android:run
   ```

   El lanzador selecciona automáticamente el emulador Android encendido. Para elegir otro dispositivo, define `SPOTTER_ANDROID_DEVICE` con el serial mostrado por `adb devices`. Como alternativa, abre `android/` desde Android Studio con `npm run android:open`, espera a que Gradle sincronice y pulsa **Run**. `npm run android:sync` reconstruye primero la web en `dist/` y luego sincroniza esos recursos con el proyecto nativo. Ejecuta la sincronización después de cambiar código web o dependencias nativas antes de probar en Android.

### Recarga en vivo en el emulador

Para reflejar los cambios de Vite automáticamente durante el diseño, usa dos terminales en VS Code:

1. Inicia el servidor web:

   ```bash
   npm run dev
   ```

2. En la otra terminal, instala/abre la app nativa con recarga en vivo:

   ```bash
   npm run android:live
   ```

El comando usa `10.0.2.2`, la dirección con la que el emulador Android alcanza el equipo anfitrión. Este comando es para el emulador; para un dispositivo físico conectado, usa la IP local del equipo y asegúrate de que ambos estén en la misma red.

## Flujo de trabajo

- Al iniciar una tarea o decisión relevante, confirma alcance o preferencia con una pregunta de selección por vez; no repitas decisiones ya aclaradas.
- Avanza en cambios pequeños y revisables; prueba los cambios antes de continuar.
- Mantén actualizado este README y documenta comandos que realmente existan en el proyecto.

La guía en video compartida por el equipo se toma como inspiración general; no se afirma que su contenido se haya verificado ni que coincida con las versiones actuales del proyecto.

## Equipo y uso académico

Proyecto desarrollado por **Jonathan** y **Nayeli**, estudiantes de la **Universidad Santiago de Cali (USC)**, para la asignatura **Computación Móvil**. No tiene fines comerciales. No se concede una licencia de uso o redistribución salvo que el equipo publique una licencia explícita en el repositorio.
