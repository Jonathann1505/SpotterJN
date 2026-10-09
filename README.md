# SpotterJN

SpotterJN es un proyecto académico de Computación Móvil para apoyar a personas que comienzan a entrenar en el gimnasio. La idea del producto es registrar entrenamientos y ofrecer orientación gradual sobre el peso y las repeticiones. El repositorio contiene actualmente una aplicación web en desarrollo; las funciones de entrenamiento descritas aquí son objetivos del proyecto, no funcionalidades ya implementadas.

## Estado actual

La aplicación está construida con **Ionic React, React, TypeScript, Vite y Capacitor**. El flujo de **Supabase Auth** incluye registro, inicio de sesión, persistencia y cierre de sesión. Las funciones de entrenamiento siguen siendo objetivos académicos y no están implementadas.

## Tecnologías y alcance

| Área | Estado |
| --- | --- |
| Interfaz web | Configurada: Ionic React, React 18, TypeScript y Vite |
| Desarrollo y compilación web | Configurados: `npm run dev`, `npm run build` y `npm run preview` |
| Aplicación Android | Capacitor Android configurado; requiere Android Studio, SDK y emulador instalados para ejecutarse |
| Pruebas automatizadas | Configuradas con Vitest y Testing Library |
| Autenticación | Supabase Auth: registro, inicio, sesión persistente y cierre |
| Datos de perfil, tablas propias, RLS e IA | No implementados |

Los módulos de cuenta, perfil y rutina, registro de sesiones, progresión, explicaciones con IA, modo sin conexión y guía de máquinas son parte de la visión del proyecto y deberán implementarse por separado.

## Estructura actual

```text
SpotterJN/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── context/
│   │   └── SesionContext.tsx
│   ├── pages/
│   │   ├── AuthPages.css
│   │   ├── Consentimientos.tsx
│   │   ├── Hoy.tsx
│   │   ├── Login.tsx
│   │   ├── Login.css
│   │   └── Registro.tsx
│   ├── services/
│   │   ├── auth.ts
│   │   └── supabase.ts
│   ├── types/
│   │   └── consentimientos.ts
│   ├── utils/
│   │   └── validaciones.ts
│   ├── vite-env.d.ts
│   ├── theme/
│   │   └── variables.css
│   ├── test/
│   │   └── setup.ts
│   ├── App.test.tsx
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
