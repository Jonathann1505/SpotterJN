# SpotterJN

App móvil de fitness para principiantes de gimnasio que calcula automáticamente la progresión de peso en cada ejercicio y explica cada decisión en lenguaje simple con IA.

> Proyecto académico — Computación Móvil, Universidad Santiago de Cali (USC)

## Equipo

- Jonathan Escobar
- Nayeli

## Descripción

Un principiante de gimnasio no sabe cuánto peso usar, cuándo subirlo, ni cómo interpretar su esfuerzo. SpotterJN resuelve esto registrando cada serie del usuario y recomendando automáticamente el peso de la siguiente sesión, con una breve explicación en lenguaje simple generada por IA.

## Características principales

- Registro rápido de series (peso, repeticiones, autoevaluación)
- Cálculo automático de progresión (sube, mantiene o baja el peso)
- Explicaciones en lenguaje natural de cada recomendación
- Modo "primera vez" con guía de máquinas para principiantes
- Modo sin conexión con sincronización posterior

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| App móvil | Ionic + React + Vite |
| Empaquetado nativo | Capacitor |
| Backend / API | Pendiente de definir (Next.js API routes planeado) |
| Base de datos | Pendiente (PostgreSQL + Prisma planeado) |
| IA | API de un modelo de lenguaje (Claude o GPT), pendiente de integrar |

## Estructura del proyecto

SpotterJN/
├── src/
│ ├── pages/ # Pantallas completas de la app (Login.tsx, etc.)
│ ├── components/ # Componentes reutilizables
│ ├── services/ # Lógica de conexión a la API (pendiente)
│ ├── theme/ # Variables de estilo y paleta de colores
│ ├── App.tsx
│ └── main.tsx
├── public/
├── ionic.config.json
├── vite.config.ts
├── package.json
└── README.md

## Instalación y ejecución local

```bash
git clone https://github.com/Jonathann1505/SpotterJN.git
cd SpotterJN
git checkout develop
npm install
npm run dev
```

La app corre en `http://localhost:5173` (o el puerto que indique Vite). Para simular vista móvil, usar el modo responsive del navegador (`Ctrl + Shift + M`).

## Flujo de trabajo en Git

- `main` — código estable
- `develop` — integración de avances antes de pasar a `main`
- `feature/nombre-modulo` — una rama por módulo de trabajo

Commits siguiendo [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/) (`feat:`, `fix:`, `style:`, `build:`, etc.), referenciando el ID del requerimiento cuando aplica:

## Módulos del proyecto

- M1 — Cuenta y acceso
- M2 — Perfil y rutina
- M3 — Sesión de entrenamiento
- M4 — Progresión e IA
- M5 — Modo "primera vez" y progreso