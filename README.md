# SpotterJN

SpotterJN es un proyecto académico de Computación Móvil para apoyar a personas que comienzan a entrenar en el gimnasio. La idea del producto es registrar entrenamientos y ofrecer orientación gradual sobre el peso y las repeticiones. El repositorio contiene actualmente una aplicación web en desarrollo; las funciones de entrenamiento descritas aquí son objetivos del proyecto, no funcionalidades ya implementadas.

## Estado actual

La aplicación está construida con **Ionic React, React, TypeScript y Vite**. En este momento muestra una pantalla básica de inicio de sesión. No hay una API, base de datos, autenticación funcional, recomendaciones con IA ni modo sin conexión configurados en este repositorio.

Capacitor todavía no está listo para generar o ejecutar la aplicación nativa: `ionic.config.json` identifica el proyecto como `react-vite` y contiene una sección `integrations.capacitor` vacía, pero `@capacitor/core`, `@capacitor/cli` y `@capacitor/android` no están declarados en `package.json`; tampoco existen `capacitor.config.*` ni el proyecto nativo `android/`.

## Tecnologías y alcance

| Área | Estado |
| --- | --- |
| Interfaz web | Configurada: Ionic React, React 18, TypeScript y Vite |
| Desarrollo y compilación web | Configurados: `npm run dev`, `npm run build` y `npm run preview` |
| Aplicación Android | Capacitor Android configurado; requiere Android Studio, SDK y emulador instalados para ejecutarse |
| Pruebas automatizadas | Configuradas con Vitest y Testing Library |
| API, base de datos, autenticación e IA | No incluidas/configuradas en este repositorio |

Los módulos de cuenta, perfil y rutina, registro de sesiones, progresión, explicaciones con IA, modo sin conexión y guía de máquinas son parte de la visión del proyecto y deberán implementarse por separado.

## Estructura actual

```text
SpotterJN/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── theme/
│   │   └── variables.css
│   ├── test/
│   │   └── setup.ts
│   ├── App.test.tsx
│   └── pages/
│       ├── Login.tsx
│       └── Login.css
├── AGENTS.md
├── android/                      # Proyecto nativo Capacitor
├── index.html
├── ionic.config.json
├── capacitor.config.ts
├── package.json
├── package-lock.json
├── tsconfig.json
└── vite.config.ts
```

## Requisitos

- Node.js 20 o superior y npm.
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

## Pruebas y validación

Ejecuta las pruebas automatizadas con:

```bash
npm test
```

Para ejecutar las pruebas en modo watch mientras desarrollas:

```bash
npm run test:watch
```

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
