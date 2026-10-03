# SpotterJN

Aplicación móvil de fitness para principiantes que registra entrenamientos y recomienda cuándo y cuánto aumentar el peso, explicando cada decisión con ayuda de IA.

> **Estado:** En desarrollo · Proyecto académico de Computación Móvil

## Descripción

Quienes empiezan en el gimnasio a menudo no saben con cuánto peso iniciar un ejercicio ni cuándo es adecuado aumentarlo. SpotterJN busca resolver esa incertidumbre con un registro sencillo de series y un motor de reglas que evalúa el desempeño para proponer una progresión gradual. Una API de IA personaliza la recomendación y la explica en lenguaje simple; la progresión se apoya en los datos del entrenamiento y las reglas definidas por el proyecto.

## Características principales

- **Registro rápido de series:** guarda repeticiones y peso durante el entrenamiento.
- **Progresión automática:** calcula una recomendación de peso para la siguiente sesión.
- **Modo “primera vez”:** ofrece orientación para conocer y usar máquinas del gimnasio.
- **Modo sin conexión:** permite consultar o registrar información esencial sin conexión, con sincronización posterior prevista.
- **Explicaciones con IA:** presenta las recomendaciones en lenguaje natural y fácil de entender.

## Stack tecnológico

| Capa | Tecnología |
| --- | --- |
| Aplicación móvil | React Native, Expo |
| API | Node.js, Next.js API Routes |
| Base de datos | PostgreSQL |
| ORM | Prisma |
| Autenticación | Firebase Authentication o Better Auth (opción por definir) |
| Personalización y explicaciones | API de un modelo de lenguaje, como Claude o GPT |
| Notificaciones | Expo Notifications |

## Estructura del proyecto

Estructura propuesta para organizar la aplicación móvil y la API:

```text
SpotterJN/
├── apps/
│   ├── mobile/
│   │   ├── app/                 # Rutas y pantallas (Expo Router)
│   │   ├── components/          # Componentes reutilizables
│   │   ├── screens/             # Vistas de la aplicación
│   │   ├── services/            # API, autenticación y notificaciones
│   │   ├── hooks/               # Hooks personalizados
│   │   ├── constants/           # Constantes y configuración pública
│   │   └── assets/              # Imágenes, fuentes e iconos
│   └── api/
│       ├── app/api/             # Rutas de API de Next.js
│       ├── services/            # Progresión e integración con IA
│       └── prisma/              # Esquema y migraciones de Prisma
├── .env.example
└── README.md
```

La estructura puede ajustarse a medida que avance la implementación.

## Instalación y ejecución local

### Requisitos previos

- Node.js LTS y npm o Yarn.
- PostgreSQL local o una instancia accesible.
- Expo Go en un dispositivo compatible o un emulador configurado.
- Credenciales del proveedor de autenticación y de la API de IA, cuando estén configurados.

### 1. Clonar el repositorio

```bash
git clone <URL-del-repositorio>
cd SpotterJN
```

### 2. Configurar e instalar dependencias

Crea un archivo `.env` para la API a partir de `.env.example` y configura las variables descritas abajo. Instala las dependencias en cada aplicación:

```bash
cd apps/api
npm install
npx prisma generate
npx prisma migrate dev
```

En otra terminal, instala las dependencias móviles:

```bash
cd apps/mobile
npm install
```

Con Yarn, reemplaza `npm install` por `yarn` y los comandos `npx` por `yarn <comando>` cuando corresponda. Ejecuta los comandos dentro del directorio de la aplicación correspondiente.

### 3. Variables de entorno

Configura las variables de servidor en `apps/api/.env`:

```dotenv
DATABASE_URL="postgresql://usuario:contrasena@localhost:5432/spotterjn"
AI_API_KEY="clave_del_proveedor_de_IA"
```

Configura en `apps/mobile/.env` la URL pública de la API:

```dotenv
EXPO_PUBLIC_API_URL="http://localhost:3000"
```

Si el proveedor de autenticación requiere credenciales adicionales, agrégalas según su configuración. No incluyas claves privadas de IA ni credenciales de base de datos en variables `EXPO_PUBLIC_*`, en el código móvil o en el control de versiones. Para probar desde un dispositivo físico, reemplaza `localhost` por la dirección IP local del equipo que ejecuta la API.

### 4. Iniciar los servicios

Inicia la API:

```bash
cd apps/api
npm run dev
```

En otra terminal, inicia Expo:

```bash
cd apps/mobile
npx expo start
```

Escanea el código QR con Expo Go o selecciona un emulador desde la terminal de Expo. Los comandos anteriores presuponen que cada aplicación define los scripts habituales `dev` en sus respectivos `package.json`.

## Flujo de trabajo en Git

- `main`: versión estable del proyecto.
- `develop`: integración de funcionalidades antes de preparar una versión estable.
- `feature/nombre-modulo`: rama de trabajo para una funcionalidad, por ejemplo `feature/registro-series`.

Usa commits breves y descriptivos, indicando el requerimiento o módulo relacionado. Ejemplo:

```text
RF-10: registro de serie con stepper de peso
```

## Módulos del proyecto

- **Cuenta y acceso:** registro, inicio de sesión y gestión de cuenta.
- **Perfil y rutina:** datos básicos del usuario y planificación de ejercicios.
- **Sesión de entrenamiento:** selección de ejercicios y registro de series.
- **Progresión e IA:** cálculo de recomendaciones y explicación personalizada.
- **Modo primera vez y progreso:** guía de máquinas y consulta del historial de avance.

## Equipo

Proyecto desarrollado por **Jonathan** y **Nayeli**, estudiantes de la **Universidad Santiago de Cali (USC)**. Ambos participan en el desarrollo de la aplicación móvil, la API y sus módulos de entrenamiento y progresión.

## Licencia y uso académico

SpotterJN es un proyecto académico para la asignatura **Computación Móvil** de la Universidad Santiago de Cali. No tiene fines comerciales. No se concede una licencia de uso o redistribución salvo que el equipo publique una licencia explícita en el repositorio.
