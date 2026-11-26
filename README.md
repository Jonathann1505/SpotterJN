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
│   │   ├── BorrarDatos.tsx       # borrado confirmado de los datos locales
│   │   ├── CambiarEjercicio.tsx  # motivos y alternativas para cambiar un ejercicio (RF-14)
│   │   ├── GraficaPeso.tsx       # gráfica SVG del peso por semana (RF-23)
│   │   ├── MiniaturaEjercicio.tsx # miniatura animada en Hoy y Rutina
│   │   ├── AyudaTermino.tsx      # ícono de ayuda con la definición de un término
│   │   ├── CargandoSJ.tsx        # estados de carga con skeletons
│   │   ├── CerrarSesion.tsx
│   │   ├── ContadorNumerico.tsx  # stepper controlado de peso y repeticiones (RF-10)
│   │   ├── PantallaSJ.tsx       # marco de pantalla, botones y acceso compartidos
│   │   ├── PesoAjustable.tsx    # peso de Hoy con diálogo de ajuste manual (RF-17)
│   │   └── TemporizadorDescanso.tsx
│   ├── context/
│   │   ├── PerfilContext.tsx     # perfil y unidad de peso (kg/lb)
│   │   └── SesionContext.tsx
│   ├── data/
│   │   ├── ejercicios.ts         # catálogo de ejercicios de las rutinas
│   │   ├── glosario.ts           # términos básicos, sus definiciones y el filtrado del buscador
│   │   └── guias.ts              # guía de cada ejercicio (ajuste, movimiento, ubicación)
│   ├── pages/
│   │   ├── Ajustes.tsx
│   │   ├── AvisoMedico.tsx
│   │   ├── Consentimientos.tsx
│   │   ├── CuestionarioRutina.tsx
│   │   ├── CuestionarioSalud.tsx
│   │   ├── FichaEjercicio.tsx
│   │   ├── Biblioteca.tsx
│   │   ├── Calentamiento.tsx
│   │   ├── EditarSalud.tsx
│   │   ├── Glosario.tsx
│   │   ├── Hoy.tsx
│   │   ├── Login.tsx
│   │   ├── Perfil.tsx
│   │   ├── Progreso.tsx
│   │   ├── RecuperarContrasena.tsx
│   │   ├── Registro.tsx
│   │   ├── RutinaAsignada.tsx
│   │   ├── SesionEntrenamiento.tsx
│   │   └── Salud.css
│   ├── assets/
│   │   └── logo-spotterjn.webp
│   ├── repositories/
│   │   ├── repositorios.ts       # interfaces de perfil, salud y rutina
│   │   ├── local.ts              # implementación local (Capacitor Preferences)
│   │   ├── recorteSeries.ts      # límite de series guardadas por usuario
│   │   └── almacenLocal.ts
│   ├── services/
│   │   ├── auth.ts
│   │   ├── notificaciones.ts     # aviso de fin de descanso (RF-11)
│   │   ├── recordatorios.ts      # programa los recordatorios locales
│   │   └── supabase.ts
│   ├── types/
│   │   ├── ajustesPeso.ts        # ajuste manual del peso por ejercicio (RF-17)
│   │   ├── consentimientos.ts
│   │   ├── perfil.ts
│   │   └── series.ts             # serie registrada y autoevaluación (RF-10)
│   ├── utils/
│   │   ├── contadorNumerico.ts   # límites, pasos e incrementos numéricos (RF-10)
│   │   ├── alternativas.ts       # alternativas y reemplazo de un ejercicio de la rutina (RF-14)
│   │   ├── biblioteca.ts         # filtros de la biblioteca de ejercicios
│   │   ├── historial.ts          # sesiones y peso semanal de un ejercicio (RF-23)
│   │   ├── calentamiento.ts      # qué calentamiento corresponde a un día de la rutina
│   │   ├── etiquetasRutina.ts    # textos de experiencia y equipo del cuestionario
│   │   ├── progresion.ts         # progresión de peso por reglas (RF-15 a RF-19)
│   │   ├── rutina.ts             # asignación de la rutina y resúmenes de sesión y semana
│   │   ├── semana.ts             # qué sesión toca según el día de la semana
│   │   ├── sesion.ts             # avance de series y ejercicios de la sesión
│   │   ├── unidades.ts           # conversión kg/lb
│   │   └── validaciones.ts
│   ├── vite-env.d.ts
│   ├── theme/
│   │   ├── microinteracciones.css # entradas, respuesta al tocar y skeletons
│   │   ├── spotter-ui.css
│   │   ├── transiciones.ts       # transición de páginas con createAnimation
│   │   └── variables.css
│   ├── test/
│   │   └── setup.ts
│   ├── App.test.tsx
│   ├── components/*.test.tsx
│   └── pages/*.test.tsx
├── AGENTS.md
├── android/                      # Proyecto nativo Capacitor
├── assets/                       # imágenes fuente del ícono Android
├── scripts/
│   ├── android.mjs               # lanzador de Android con JDK y SDK detectados
│   ├── animacion.mjs             # genera la animación de un ejercicio
│   └── validarEntornoSupabase.ts # valida las variables de Supabase al compilar
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

Los campos Ionic usan la clase `sj-campo` y una etiqueta visible; las casillas de acceso reciben el estilo compartido por `.sj-acceso`. `sj-tarjeta` sirve para superficies con borde, los estados usan `sj-error` y `sj-ok`, y las cargas de contenido usan `CargandoSJ` (skeletons con la forma de la pantalla); `sj-cargando` queda solo para la verificación inicial de sesión. Las alertas, cargas, toast y modales de Ionic reciben colores, tipografía y bordes del tema global. No dupliques valores de color, radios, espacios o tamaños en hojas de estilo de páginas; usa los tokens o las clases compartidas. Las pantallas respetan las áreas seguras con `env(safe-area-inset-*)`.

### Navegación hacia atrás

Toda pantalla **secundaria** usa el encabezado con el botón atrás nativo de Ionic indicando su ruta por defecto; las pantallas **raíz** no lo llevan. No se usan botones «Volver» propios.

```tsx
<PantallaSJ atras="/perfil" titulo="Glosario">…</PantallaSJ>
<MarcoAccesoSJ activa="login" atras="/login">…</MarcoAccesoSJ>
```

- `EncabezadoSJ` (`src/components/PantallaSJ.tsx`) usa `IonHeader`, `IonToolbar` e `IonBackButton` en `slot="start"` con `defaultHref` obligatoria. `PantallaSJ` y `MarcoAccesoSJ` lo muestran con la prop `atras`.
- Ionic adapta el estilo a la plataforma: solo flecha en Android (modo `md`) y «‹ Atrás» en iOS. No se fuerza un modo.
- Es transparente, sin borde ni sombra, con la flecha en el color de texto del tema. Tiene la etiqueta «Volver» para lectores de pantalla y una zona táctil mínima de 44×44 px.
- El toolbar reserva el área segura superior; la clase `sj-con-encabezado` reduce el margen del contenido para no duplicarla.
- El botón físico de Android y el gesto de deslizar en iOS los gestiona `IonRouterOutlet`; no hay manejadores propios.
- `defaultHref` solo se usa si no hay historial (por ejemplo, al abrir la app en esa pantalla); si lo hay, se vuelve a la pantalla anterior.

| Pantalla | Ruta | `atras` |
| --- | --- | --- |
| Perfil | `/perfil` | `/hoy` |
| Recordatorios | `/ajustes` | `/perfil` |
| Biblioteca de ejercicios | `/ejercicios` | `/perfil` |
| Historial de progreso | `/progreso` | `/perfil` |
| Mis respuestas de salud | `/editar-salud` | `/perfil` |
| Calentamiento | `/calentamiento` | `/ejercicios` |
| Glosario | `/glosario` | `/perfil` |
| Sesión | `/sesion` | `/hoy` |
| Ficha del ejercicio | `/ejercicio/:id` | `/hoy` |
| Recuperar contraseña | `/recuperar-contrasena` | `/login` |
| Términos / Privacidad | `/terminos`, `/privacidad` | `/consentimientos` |
| Rutina asignada (con rutina guardada) | `/rutina` | `/perfil` |
| Cuestionario de rutina (con rutina guardada) | `/cuestionario-rutina` | `/rutina` |

Sin botón atrás: `/login`, `/consentimientos` y `/registro` (pestañas de acceso), `/hoy` y el flujo inicial obligatorio (`/aviso-medico`, `/salud`, y `/cuestionario-rutina` mientras el usuario no tenga rutina guardada).

**Pantallas del flujo inicial: atrás solo si ya hay rutina.** `/rutina` y `/cuestionario-rutina` leen `rutinaLocal` por id de usuario: sin rutina forman parte del flujo inicial y no muestran atrás; con rutina (al entrar desde Perfil con «Mi rutina» o desde Rutina con «Cambiar mi rutina») muestran atrás hacia `/perfil` y `/rutina`. Mientras se comprueba la rutina se muestra un skeleton sin encabezado, para que el botón no aparezca y desaparezca. Al terminar el flujo inicial, `/rutina` ya muestra atrás porque la rutina queda guardada. Las acciones «Volver a Hoy», «Entendido» e «Ir a Hoy» se mantienen porque no son botones de atrás.

`@ionic/react-router` debe tener **la misma versión** que `@ionic/react`: la primera fija exactamente su versión de `@ionic/react`, y si no coinciden se empaquetan dos copias de Ionic y el router deja de compartir su contexto (el botón atrás recargaría la página en lugar de navegar). Al actualizar Ionic, actualiza ambos paquetes juntos y comprueba con `npm ls @ionic/react` que aparezca `deduped`.

Pendiente de probar en dispositivo: el botón atrás en Android (flecha) y en iOS («‹ Atrás»), el botón físico de Android, el gesto de deslizar en iOS y el área segura con notch.

#### Recarga al volver a una pantalla

Ionic conserva en la pila las pantallas anteriores: al volver a ellas (con el botón atrás o con `history.replace`) no se montan de nuevo y sus efectos de carga no se repiten. `useRecargaAlVolver(ruta)` (`src/hooks/useRecargaAlVolver.ts`) devuelve un número que aumenta cada vez que se vuelve a esa ruta; se usa como dependencia del efecto de carga. Lo usan **Hoy** (tras terminar una sesión, cambiar un ejercicio o borrar los datos) y **Mi rutina** (tras cambiar la rutina). Durante la recarga se mantienen los datos visibles, sin volver al skeleton. Cualquier pantalla nueva que lea datos y pueda quedar debajo en la pila debe usarlo.

### Animaciones y microinteracciones

- **Transición entre páginas:** `src/theme/transiciones.ts` define `transicionPaginaSJ` con `createAnimation` de Ionic y se registra en `setupIonicReact({ navAnimation })`. Al avanzar, la pantalla nueva entra con fundido y 12 px de desplazamiento en 260 ms con `cubic-bezier(0.2, 0, 0, 1)`; al regresar, la actual sale en 200 ms.
- **Entradas y respuesta al tocar:** `src/theme/microinteracciones.css` escalona la entrada del contenido (220 ms, retrasos de hasta 80 ms), reduce botones, opciones y pestañas a escala 0,97 al tocarlos (150 ms) y anima mensajes, paneles de la rutina y el diálogo de ayuda.
- **Rendimiento:** solo se animan `transform`, `opacity` y colores, y las animaciones usan `fill-mode: backwards` para no dejar transformaciones aplicadas.
- **Accesibilidad:** con «Reducir movimiento» activo en el sistema, la transición dura 0 ms y se desactivan entradas y escalas.
- Para nuevas pantallas, usa `PantallaSJ` o `MarcoAccesoSJ` (heredan la entrada) y `CargandoSJ` con `variante="lista"` o `"detalle"` para cargas.

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

El flujo de primera vez, tras iniciar sesión, es: `Hoy` redirige a `/aviso-medico` si no hay respuestas de salud (RF-05), después a `/cuestionario-rutina` si no hay rutina (RF-06), que asigna una rutina predefinida y la muestra en `/rutina`. `/perfil` permite editar nombre (1 a 40 caracteres), meta principal y unidad de peso kg/lb (RF-07); la unidad se aplica de inmediato en `Hoy` y en la rutina. `Hoy` saluda por el nombre del perfil y muestra la próxima sesión con sus ejercicios, series y repeticiones (RF-08), más un resumen con el total de series y los minutos aproximados (unos 2,25 min por serie, redondeados a múltiplos de 5; es una estimación). La rutina muestra el mismo resumen en cada día, y desde `Hoy`, la rutina y la ficha se llega a la ayuda de cada ejercicio; el perfil tiene el acceso «Mi rutina» y un resumen de la rutina actual (días, experiencia y equipo). La rutina incluye un resumen semanal (sesiones, series y tiempo aproximado) y el botón «Cambiar mi rutina», que reabre el cuestionario con las respuestas anteriores ya marcadas.

Desde el perfil se pueden **editar las respuestas de salud** (`/editar-salud`, RF-05), que reutiliza las mismas condiciones del cuestionario inicial y actualiza la fecha de respuesta, y **borrar los datos de este dispositivo** con confirmación: elimina perfil, salud, rutina, fichas vistas, recordatorios e historial de series (`borrarDatosLocales`), cancela los recordatorios programados y reinicia el flujo desde el aviso médico. No elimina la cuenta ni cierra la sesión (RF-04 sigue pendiente).

Limitaciones actuales:

- Los datos de M2 se guardan en el dispositivo con Capacitor Preferences, detrás de las interfaces de `src/repositories/repositorios.ts` y bajo claves asociadas al ID del usuario autenticado. No están cifrados ni se sincronizan con Supabase; RNF-11 (cifrado en reposo y separación en backend) queda pendiente.
- Los datos guardados por versiones anteriores en claves locales sin usuario no se migran automáticamente ni se borran: la app actual no los muestra. Tras actualizar, cada usuario deberá volver a completar el flujo M2 para generar sus datos asociados a su cuenta.
- Los pesos que muestra `Hoy` son los iniciales del catálogo (`src/data/ejercicios.ts`), no cálculos de progresión: dependen de M3 y M4. `Hoy` calcula qué sesión toca con el día de la semana (`src/utils/semana.ts`), sin usar todavía el historial: las sesiones se reparten en los mismos días que los recordatorios (por ejemplo lunes, miércoles y viernes con 3 días). Si hoy se entrena, muestra «Hoy toca»; si no, «Próxima sesión · día» y avisa de que hoy se descansa. «Empezar entrenamiento» abre esa misma sesión: `/sesion` recibe `indiceDia` por el estado de navegación y, sin él, usa la primera. Cuando haya historial de sesiones conviene reemplazar este cálculo por «la siguiente sesión sin hacer».
- `/sesion` muestra los ejercicios de la jornada indicada (por defecto la primera) y permite volver a Hoy. Es un esqueleto visual: todavía no registra series, pesos ni historial (M3).
- El cuestionario de rutina se asigna con plantillas fijas según días y equipo, sin IA.

## Ficha de ejercicio (M5)

Cada ejercicio tiene una ficha en `/ejercicio/:id` con su animación, cómo ajustar la máquina, cómo hacer el movimiento y dónde suele estar. Se abre desde el botón de ayuda de cada ejercicio en `Hoy` y en la rutina asignada. La primera vez muestra un aviso de primera vez (con «esta máquina» o «este ejercicio» según el equipo) y los títulos de preparación se adaptan al equipo (`textosFicha` en `src/data/guias.ts`) y el botón «Listo, empezar series»; al pulsarlo se guarda que la ficha ya se vio (Capacitor Preferences) y no vuelve a mostrarse el aviso, aunque la ficha puede reabrirse con el botón de ayuda.

- Las animaciones están en `public/ejercicios/`: archivos HTML autocontenidos (hoy `press-banca.html`, que se muestra en un `iframe` con `sandbox="allow-scripts"`; el comando `npm run animacion:crear` genera más a partir de 3 imágenes) o videos MP4 comprimidos (hoy `flexiones.mp4`, `sentadilla-peso-corporal.mp4`, `press-pecho-maquina.mp4` y `remo-invertido.mp4`, que se reproducen en bucle y silenciados). Ver `docs/animaciones-ejercicios.md`. Los videos están recortados alrededor del personaje y la ficha respeta su proporción. Se pausan al tocarlas y no se inician si el sistema pide menos movimiento.
- El contenido de cada guía está en `src/data/guias.ts`; los 16 ejercicios del catálogo tienen su texto, pero solo el press de banca, el press de pecho en máquina, las flexiones, el remo invertido y la sentadilla con peso corporal tienen animación. Los demás muestran «Animación próximamente». Las listas de `Hoy` y de la rutina muestran una miniatura animada de cada ejercicio con video (los demás, un recuadro con su inicial). Un ejercicio que no esté en `guias.ts` usa un texto provisional.
- **Calentamiento** (`/calentamiento`, desde la biblioteca): cinco calentamientos de 5 a 8 minutos según el tipo de sesión (cuerpo completo, tren superior, tren inferior, empuje y tirón; `src/data/calentamiento.ts`), todos con una marcha inicial común. La pantalla parte del tipo de la sesión que toca hoy (`sesionParaFecha` y `focoDeSesion` de `src/utils/calentamiento.ts`; sin rutina usa cuerpo completo) y avisa cuál es; unos chips permiten cambiarlo a mano y reinician los pasos marcados. Los pasos se marcan uno a uno, con contador y un mensaje al completarlos. Es contenido fijo y orientativo, sin animaciones.
- Las fichas incluyen **errores comunes** y **respiración** de los 16 ejercicios (campos opcionales `erroresComunes` y `respiracion` de `src/data/guias.ts`); una guía provisional no los muestra.
- El **historial de progreso** (`/progreso`, desde el perfil, RF-23) lee las series guardadas (`seriesLocal`). Un selector por chips elige el ejercicio (primero el entrenado más recientemente) y muestra una gráfica SVG del peso más alto de cada semana (`GraficaPeso`, sin librerías; semanas desde el lunes, con la unidad del perfil) y las últimas 8 sesiones con fecha, peso, repeticiones y la autoevaluación (Fácil, Normal o Difícil, con color y texto). Con menos de 2 sesiones del ejercicio no se dibuja la gráfica y se muestra un mensaje motivador; sin series registradas hay un estado vacío, y en los ejercicios de peso corporal se explica que no hay peso que graficar. La lógica está en `src/utils/historial.ts` y agrupa las sesiones con `agruparEnSesiones` de la progresión.
- La **biblioteca de ejercicios** (`/ejercicios`, desde el perfil) lista los 16 ejercicios con filtros por grupo muscular y equipo (`src/utils/biblioteca.ts`) y abre sus fichas. Un ejercicio que no está en la rutina de la persona se abre solo para consulta: sin aviso de primera vez y con el botón «Entendido».
- «Listo, empezar series» guarda la ficha como vista y lleva a la sesión de entrenamiento (`/sesion`). La ficha permite **cambiar el ejercicio** (RF-14) cuando está en la rutina de la persona: «No puedo hacer este ejercicio» o «No tengo esta máquina / este equipo» (este último no aparece en los de peso corporal). Se ofrecen hasta 3 alternativas del mismo movimiento, primero las del mismo grupo muscular y de equipo más guiado, usando solo el equipo declarado en el cuestionario (el peso corporal siempre está disponible) y sin repetir ejercicios de esos días. Con «No tengo este equipo» no se propone el mismo equipo. Al elegir una, se reemplaza en todos los días de la rutina guardada conservando series y repeticiones, y se abre la ficha del nuevo ejercicio con un aviso. La lógica está en `src/utils/alternativas.ts` y es una regla fija, sin IA ni historial: la adaptación según lo ocurrido en las sesiones depende de M3/M4.

## Sesión de entrenamiento (M3)

La ruta protegida `/sesion`, accesible desde «Empezar entrenamiento» en Hoy, carga la jornada indicada de la rutina del usuario (por defecto la primera) y la recorre ejercicio por ejercicio. Permite volver a Hoy y guarda cada serie en el dispositivo (ver «Guardado de series»). El componente de descanso RF-11 (`TemporizadorDescanso`) ofrece una cuenta regresiva de 90 segundos que comienza automáticamente, círculo de tiempo restante y controles para sumar/restar 30 segundos o saltar; acepta `alTerminar`, que se llama al llegar a cero o al tocar «Saltar descanso», y `alCambiarFin`, que informa la hora de fin al empezar y en cada cambio. El tiempo se calcula con la hora real de fin, así que al volver de segundo plano muestra el tiempo correcto aunque Android haya frenado los intervalos. Se usa entre series (ver «Descanso entre series»).

### Registro de serie y autoevaluación (RF-10)

- Para el ejercicio actual se muestran «Ejercicio N de M» y «Serie X de Y» según la rutina, con el objetivo de repeticiones.
- `ContadorNumerico` de repeticiones (0 a 50, paso 1) y de peso en la unidad del perfil (paso de 0,5 kg o 1 lb). En ejercicios de peso corporal (equipo `peso-corporal` del catálogo o sin carga inicial) no se muestra el contador de peso.
- Autoevaluación de selección única Fácil, Normal o Difícil (`role="radiogroup"` con botones `role="radio"` y la clase `sj-segmento`).
- «Guardar serie» está deshabilitado hasta elegir una autoevaluación. Al guardar avanza a la siguiente serie y reinicia la autoevaluación; tras la última serie pasa al siguiente ejercicio (serie 1), y tras el último ejercicio muestra «Sesión completada» con «Volver a Hoy».
- Las repeticiones y el peso se conservan entre series del mismo ejercicio y vuelven a los valores de la rutina al cambiar de ejercicio.
- La lógica de avance está en funciones puras de `src/utils/sesion.ts` (`avanzarSerie`, `saltarEjercicio`, `esPesoCorporal`).

### Sentí dolor (RF-13)

- Botón secundario «Sentí dolor», con ícono de alerta y borde, en el pie fijo de la sesión (`pieFijo` de `PantallaSJ`), visible aunque se desplace la pantalla.
- Abre un `IonAlert` que recomienda detener el ejercicio y consultar a un profesional de la salud si el dolor continúa, e indica que la serie no cuenta como fallida. No se cierra tocando el fondo.
- «Entendido, continuar con otro ejercicio» pasa al siguiente ejercicio sin contar la serie en curso. En el último ejercicio el botón dice «Entendido, terminar la sesión» y muestra «Sesión finalizada» con la recomendación y «Volver a Hoy».

### Guardado de series (RF-10, RF-13)

- Al tocar «Guardar serie» se guarda la serie y **después** se avanza. Mientras guarda, el botón muestra «Guardando…» y queda deshabilitado (también «Sentí dolor»), y un bloqueo interno evita guardar dos veces con un doble toque.
- Si falla, se muestra «No se pudo guardar la serie. Inténtalo de nuevo.», no se avanza y se conservan la autoevaluación, las repeticiones y el peso.
- «Sentí dolor» guarda la serie en curso con `estado: 'interrumpida-por-molestia'` (no cuenta como fallida) y con la autoevaluación si se eligió, o `null`. Si ese guardado falla, se avanza igual y se informa, porque la prioridad es que la persona se detenga.
- Cada serie (`SerieRegistrada`, `src/types/series.ts`) incluye: `id`, `registradaEn` (ISO 8601), `idEjercicio`, `nombreEjercicio`, `dia` (nombre del día de la rutina), `numeroSerie`, `peso` (en la unidad del perfil; `null` en peso corporal), `unidad` (`kg`/`lb`), `repeticiones`, `autoevaluacion` y `estado` (`completada` o `interrumpida-por-molestia`). La construye `crearSerieRegistrada` en `src/utils/sesion.ts`.
- Repositorio `seriesLocal` (`SeriesRepositorio` en `src/repositories/repositorios.ts`) con `guardar`, `listar` y `listarPorEjercicio`. Usa Capacitor Preferences con la clave `spotter.usuario.<id de usuario codificado>.series`, una lista a la que se añade cada serie. Al leer se descartan las series con forma inválida sin perder las válidas, y un valor que no es lista se trata como vacío.
- **Límite de series:** al guardar, `recortarSeries` (`src/repositories/recorteSeries.ts`, función pura) conserva como máximo `LIMITE_SERIES_POR_USUARIO = 2000` series por usuario y descarta las más antiguas. 2000 series son unas 110-130 sesiones (9-12 meses entrenando 3 veces por semana) y unos 650 KB en una sola clave, para que la lista no crezca sin tope ni haga lenta cada escritura.
  - Nunca se descartan la serie recién guardada ni las series de las **3 sesiones más recientes de cada ejercicio** (`SESIONES_PROTEGIDAS_POR_EJERCICIO`), que son las que necesita la progresión (RF-15, RF-16). Si esas series protegidas superan el límite, se conservan igual.
  - El historial y la gráfica (RF-23) solo pierden las semanas más antiguas.
  - El recorte se calcula en memoria antes de escribir: si el guardado falla, la lista anterior queda intacta. Solo afecta a la clave del usuario que guarda.
- Los datos **siguen solo en el dispositivo y sin cifrar**: no se sincronizan con Supabase y se pierden al borrar los datos de la app.

### Descanso entre series (RF-11)

- Después de guardar una serie que **no** es la última del ejercicio, el registro se reemplaza por el bloque «Descanso»: la referencia de la serie anterior («Serie anterior: N repeticiones · peso» o «peso corporal») y el temporizador de 90 segundos. La tarjeta ya indica la serie siguiente.
- Al llegar a cero o con «Saltar descanso» vuelve el registro de la siguiente serie, con la autoevaluación sin elegir. Las repeticiones y el peso se conservan dentro del mismo ejercicio.
- No hay descanso tras la última serie de un ejercicio (se pasa al siguiente) ni tras la última de la sesión.
- «Sentí dolor» sigue visible durante el descanso; al confirmarlo se cierra el descanso y se pasa al siguiente ejercicio.

#### Aviso de fin de descanso (RF-11)

- Plugin: `@capacitor/local-notifications` **7.0.7** (ya instalado para los recordatorios; compatible con Capacitor 7). Las pantallas no lo llaman directamente: lo envuelve `src/services/notificaciones.ts` (`estadoAvisoDescanso`, `pedirPermisoAvisoDescanso`, `programarAvisoDescanso`, `cancelarAvisoDescanso`), con todo en `try/catch`. En la web (plataforma no nativa) no hace nada.
- **Cuándo se programa:** al empezar cada descanso, con la app abierta o en segundo plano, para la hora exacta de fin y con el texto «Descanso terminado. Vamos con la serie X de Y.». Con la app abierta es el único aviso que suena, porque el temporizador en pantalla no hace sonido. No depende de `visibilitychange`: Capacitor 7 en Android no emite eventos del documento al pausar la app.
- **Cuándo se cancela:** solo por acciones de la persona: «Saltar descanso» o restar con −30 s hasta cero, «Sentí dolor» y salir de la sesión antes de que termine el descanso (también al cerrar sesión, porque se sale de `/sesion`). Con ±30 s se reprograma con la nueva hora. Cuando el tiempo termina solo **no** se cancela, para que la notificación salga; `TemporizadorDescanso` indica el motivo del fin (`tiempo` o `saltado`) en `alTerminar`.
- **Permiso:** no se pide al abrir la app. La primera vez que empieza un descanso aparece «¿Te avisamos con una notificación cuando termine el descanso…?» con «Activar» o «Ahora no». Solo «Activar» pide el permiso del sistema (`POST_NOTIFICATIONS` en Android 13 o superior). Tras responder se guarda en el dispositivo que ya se preguntó (`spotter.dispositivo.avisoDescanso.permisoPreguntado`) y no se vuelve a preguntar; si se niega, el temporizador funciona igual y no se muestra ningún error.
- **Canal de notificación:** el aviso usa su propio canal, `descanso` («Fin del descanso»), con importancia alta, sonido y vibración, que se crea antes de programarlo. El canal por defecto del plugin tiene importancia normal y en Android solo deja un ícono en la barra de estado, sin ventana emergente: así se comprobó en un emulador. Si el canal no se puede crear, el aviso sale por el canal por defecto.
- **Alarmas exactas:** el `AndroidManifest.xml` declara `USE_EXACT_ALARM` (Android 13 o superior, se concede al instalar y está pensado para apps de temporizador) y `SCHEDULE_EXACT_ALARM` con `maxSdkVersion="32"` (Android 12). Con ellos el plugin programa una alarma exacta y el aviso suena a la hora. Si la app se publicara en Google Play, Google revisa el uso de `USE_EXACT_ALARM`.
- **Ícono:** `android/app/src/main/res/drawable/ic_stat_spotterjn.xml` (silueta blanca de una mancuerna), configurado en `capacitor.config.ts` como `smallIcon` con `iconColor` azul, para que no salga un cuadro blanco. También lo usan los recordatorios.
- Pendiente de probar en un celular real: aceptar y negar el permiso, dejar la app en segundo plano durante el descanso, saltar y cambiar el tiempo, y comprobar que no quedan avisos viejos.

### Progresión de peso (RF-15 a RF-19)

`calcularProgresion` (`src/utils/progresion.ts`) es una función pura: recibe las series de un ejercicio, el objetivo de la rutina (series × repeticiones), el peso de partida y la unidad, y devuelve la acción (`sube`, `mantiene` o `baja`), el peso y las repeticiones para la próxima sesión, el motivo y una frase. `recomendarParaEjercicio` la llama desde un ejercicio de la rutina con todas las series del usuario.

- **Sesiones:** las series de un ejercicio se agrupan por fecha local; empieza una sesión nueva si cambia el día o si el número de serie no aumenta. Se evalúa la última sesión con el peso de su última serie completada (convertido si se guardó en otra unidad).
- **Sube (RF-15):** todas las series completadas fueron Fácil o Normal, alcanzaron las repeticiones objetivo y se completaron todas las series. Sube **2,5 kg o 5 lb** y nunca más por sesión (RF-17). Ej.: 40 kg → 42,5 kg.
- **Mantiene (RF-15):** alguna serie fue Difícil o no llegó a las repeticiones. Si faltaron series sin fallos, también mantiene sin contarlo como fallo.
- **Baja (RF-16):** tras 3 sesiones seguidas de fallo con el mismo peso baja un 10 %, redondeado al múltiplo de 2,5 kg o 5 lb más cercano. Ej.: 40 kg → 35 kg; 100 lb → 90 lb.
- **Molestia (RF-13):** las series `interrumpida-por-molestia` no cuentan como éxito ni como fallo; si la última sesión tuvo molestia, se mantiene el peso.
- **Sin series:** se usa el peso inicial del catálogo en la unidad del perfil.
- **Peso corporal:** si todo fue bien, el objetivo sube a las repeticiones máximas logradas + 2; si no, se mantiene el mayor entre el objetivo de la rutina y lo logrado. No baja.
- **Explicación (RF-19):** frases fijas en `explicarProgresion`, por ejemplo «Te sobró fuerza: sube a 42,5 kg.», «Te costó un poco: repite 40 kg para afianzarlo.», «Llevas 3 sesiones difíciles con este peso: baja a 35 kg y vuelve a subir.» o «Sentiste molestia: mantén 40 kg y cuídate.». `calcularProgresion` acepta otro `Explicador` para sustituirlas por IA más adelante.
- **Hoy** muestra el peso (o las repeticiones) recomendado y la frase cuando el ejercicio ya tiene series; si no, el peso inicial.
- **Resumen al terminar:** en «Sesión completada» y «Sesión finalizada», `ResumenSesion` lista cada ejercicio con lo hecho y la recomendación (flecha y texto Sube / Mantén / Baja, carga nueva y frase), junto a «Volver a Hoy».

### Ajuste manual del peso (RF-17)

- En **Hoy**, el peso de cada ejercicio con carga es un botón («Ajustar peso de …»). Abre un diálogo accesible (`role="dialog"`, foco en el campo al abrir y de vuelta al peso al cerrar, Escape para cancelar) con `ContadorNumerico` precargado (pasos de 0,5 kg o 1 lb) y los botones «Guardar» y «Cancelar». Los ejercicios de peso corporal no tienen ajuste.
- Validación: sin negativos ni vacío, con un máximo de **300 kg o 660 lb** (`PESO_MAXIMO_MANUAL`). Si el guardado falla, el diálogo sigue abierto con el error.
- Se guarda un `AjustePeso` por usuario y ejercicio (`idEjercicio`, `peso`, `unidad`, `ajustadoEn`) con `ajustesPesoLocal`, clave `spotter.usuario.<id>.ajustesPeso` (un mapa por ejercicio). Los datos corruptos se descartan y «Borrar datos» también los elimina.
- **Convivencia con la progresión:** `calcularProgresion` usa el ajuste mientras sea **más reciente que la última serie** de ese ejercicio (motivo `ajuste-manual`, frase «Ajustado por ti: empieza con X kg.»). El ajuste manual no tiene el tope de 2,5 kg o 5 lb. Tras la siguiente sesión, las reglas siguen normales desde el peso de esa sesión.
- **Peso de partida en la sesión:** `/sesion` precarga el contador de peso con la recomendación (o el ajuste) de cada ejercicio, calculada una vez al empezar con las series y ajustes anteriores.
- **Cambio de unidad:** el ajuste guarda su unidad; al mostrarlo se convierte a la unidad actual del perfil y se redondea a 0,5 kg o 1 lb (por ejemplo, 50 kg se muestran como 110 lb), así nunca aparece el número de la otra unidad.

Pendientes: recomendaciones con IA real, sincronización con Supabase y cifrado (RNF-11).

### Contador numérico (RF-10)

`ContadorNumerico` (`src/components/ContadorNumerico.tsx`) es un control reutilizable y controlado; recibe la etiqueta, el valor, `onChange` y límites/paso opcionales. Para repeticiones, configura `minimo={0}`, `maximo={50}` y `paso={1}`. Para peso, pasa `unidad="kg"` o `unidad="lb"`: el componente aplica automáticamente incrementos de 0,5 kg o 1 lb y no impone un máximo arbitrario. Ejemplo:

```tsx
<ContadorNumerico
  etiqueta="Repeticiones logradas"
  valor={repeticiones}
  onChange={setRepeticiones}
  minimo={0}
  maximo={50}
  paso={1}
/>

<ContadorNumerico
  etiqueta="Peso"
  valor={pesoEnUnidad(ejercicio.pesoInicialKg, perfil.unidadPeso)}
  onChange={setPeso}
  minimo={0}
  unidad={perfil.unidadPeso}
/>
```

Los valores editados temporalmente vacíos o fuera de rango se corrigen al salir del campo; los valores válidos se notifican mediante `onChange`. Las flechas arriba/abajo ajustan el valor por teclado; la etiqueta está asociada a la entrada y los botones tienen nombres accesibles. Los estilos usan los tokens del tema, con contraste medido de 4,74:1 incluso en los botones deshabilitados. Las operaciones numéricas y el paso por unidad están en `src/utils/contadorNumerico.ts`. El contador se usa en `/sesion` para repeticiones y peso; no guarda series ni modifica el peso recomendado del catálogo.

## Supabase y variables de entorno

1. Crea un proyecto en [Supabase](https://supabase.com/dashboard) y copia su URL y clave **anon/publicable** desde la configuración API del proyecto.
2. En la raíz del repositorio, crea `.env` tomando `.env.example` como referencia:

   ```dotenv
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   ```

   Coloca localmente los valores de tu proyecto en esas variables. No compartas ni confirmes `.env`. La clave `service_role` y las claves `sb_secret_` son secretas y nunca deben incluirse en la app cliente.
3. En Supabase, durante el desarrollo, desactiva **Authentication > Providers > Email > Confirm email** para permitir que el registro cree una sesión inmediatamente. La confirmación y sus enlaces de retorno no forman parte del alcance actual.

El cliente Supabase se centraliza en `src/services/supabase.ts` y falla explícitamente si falta una variable requerida. Además, `npm run build` se detiene con un mensaje claro si falta `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY`, si la URL no es válida o si la clave es secreta (`sb_secret_` o JWT con rol `service_role`); el mensaje nunca muestra los valores. La validación está en `scripts/validarEntornoSupabase.ts` y solo se aplica al compilar, no a `npm run dev` ni a las pruebas.

Si Auth devuelve un error, la interfaz muestra un mensaje localizado y, para códigos desconocidos, el código técnico sin el texto crudo del proveedor. Si indica que no pudo conectar, comprueba localmente la URL del proyecto en `.env`, la conexión a internet y que el proyecto Supabase esté disponible. Un HTTP 404 suele indicar que la URL no corresponde a la **Project URL** actual o que el proyecto ya no está activo. Compara localmente `VITE_SUPABASE_URL` con **Project Settings > API > Project URL**; usa la URL base `https://<project-ref>.supabase.co`, sin añadir `/auth/v1` ni `/rest/v1`. No compartas `.env`, claves ni capturas que las muestren.

Las rutas de acceso y registro usan `/login`, `/consentimientos`, `/registro` y `/recuperar-contrasena`; la ruta protegida `/hoy` requiere una sesión. Consentimientos y registro transmiten la autorización opcional de datos de salud y la fecha ISO de aceptación en los metadatos del usuario de Supabase Auth. La recuperación solicita el enlace a Supabase sin revelar si el correo está registrado.

### Cierre de sesión (RF-01)

El componente reutilizable **Cerrar sesión** está disponible en Hoy y Perfil. Al tocarlo, presenta un modal con **Cancelar** y **Cerrar sesión**. Cancelar no realiza ninguna operación; confirmar muestra el estado de carga, evita confirmaciones duplicadas y llama al servicio de Auth con alcance local. Si falla, informa el error en español y conserva la pantalla; si tiene éxito, reemplaza la ruta por `/login`. Las rutas protegidas siguen requiriendo una sesión.

El cierre local no invalida las sesiones de otros dispositivos. Los datos de perfil, salud y rutina no se eliminan al salir: permanecen asociados al ID de su usuario para que otra cuenta en el mismo dispositivo no los reciba.

#### Duración de la sesión (RF-01)

Verificado en el código (`src/services/supabase.ts`, `src/context/SesionContext.tsx` y `@supabase/auth-js` 2.117.3):

- El cliente se crea con `persistSession: true` y `autoRefreshToken: true`. Sin almacenamiento propio, Supabase guarda la sesión (token de acceso y token de renovación) en `localStorage` del WebView, que en Android se conserva al cerrar y reabrir la app hasta que se borran sus datos.
- Al abrir la app, `SesionContext` llama a `getSession()`: si el token de acceso caducó, Supabase lo renueva con el token de renovación antes de devolver la sesión; si falla, la app muestra el error con «Reintentar».
- Con la app abierta, el token se renueva solo; la renovación se pausa en segundo plano y se reanuda al volver (evento `visibilitychange`).
- Cerrar sesión usa alcance local y borra la sesión de este dispositivo.

**Pendiente de verificar en el panel de Supabase**, porque no depende del código: que la duración de las sesiones no corte antes de 30 días (Authentication → Sessions: límite de duración de la sesión e inactividad; y la caducidad del token de acceso en la configuración de JWT). **No se afirma todavía que se cumplan los 30 días de RF-01.**

### Probar el flujo en web

1. Inicia Vite con `npm run dev` y abre la URL local.
2. Entra a **Crear cuenta**, acepta ser mayor de edad y los términos; la autorización de datos de salud es opcional.
3. Registra un correo nuevo y una contraseña de al menos ocho caracteres con una letra y un número.
4. Cierra sesión desde **Hoy** y confirma el cierre.
5. Inicia sesión con la misma cuenta. Cierra y vuelve a abrir la aplicación para comprobar si Supabase restaura la sesión.
6. Prueba **¿Olvidaste tu contraseña?** con un correo válido y verifica que la pantalla muestre el mensaje genérico sin confirmar si la cuenta existe.
7. En Supabase, verifica el usuario en **Authentication > Users**.

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

La suite automatizada cubre validaciones, el estado habilitado de los botones, errores de login y registro, recuperación de contraseña, consentimientos obligatorios y la redirección de `/hoy` sin sesión. Las pruebas simulan el servicio de autenticación y no llaman al proyecto Supabase real.

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

## Generar la APK

APK de **depuración** para probar la app en emuladores y celulares del equipo. No está firmada para publicación ni se distribuye por tiendas.

### Requisitos

- Node.js y npm, con las dependencias instaladas (`npm ci`).
- Android SDK API 35 y Build-Tools 35.0.0 (ver [Requisitos del equipo](#requisitos-del-equipo)).
- JDK 21. El `java` del sistema puede ser otra versión: Gradle usa el JDK indicado en `JAVA_HOME`.
- `.env` en la raíz con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (clave **anon/publicable**). Estos valores se incrustan en la APK al compilar; si faltan o la clave es secreta, `npm run build` falla con un mensaje claro.

### Comandos

Desde la raíz del repositorio, en PowerShell (ajusta la ruta del JDK si está en otra ubicación):

```powershell
npm run build
npx cap sync android
$env:JAVA_HOME = "$env:LOCALAPPDATA\Programs\SpotterJN\Temurin21\jdk-21.0.12.1+1"
cd android
.\gradlew.bat assembleDebug
cd ..
```

El archivo generado queda en:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Las carpetas `build/`, `dist/` y los archivos `*.apk` están en `.gitignore`: comparte la APK por fuera del repositorio (por ejemplo, Drive) y nunca la confirmes en Git.

### Ícono de la app

El ícono se genera desde `assets/icon-only.png`, `assets/icon-foreground.png` y `assets/icon-background.png`, creados a partir de `src/assets/logo-spotterjn.webp`. Si se cambia el logo, regenera los recursos de Android con:

```bash
npx @capacitor/assets generate --android --iconBackgroundColor "#ffffff" --iconBackgroundColorDark "#ffffff"
```

Revisa después que la herramienta no haya reformateado `AndroidManifest.xml`; ese cambio no es necesario.

### Instalar en un celular

1. Copia `app-debug.apk` al celular o descárgalo desde el enlace compartido.
2. Abre el archivo y permite **Instalar apps desconocidas** para la aplicación con la que lo abriste (Archivos, Drive o el navegador).
3. Si Play Protect advierte que la app es desconocida, elige instalar de todas formas; ocurre porque es una APK de depuración.
4. Si ya existe una versión anterior firmada en otro equipo, desinstálala primero: Android rechaza actualizar una APK de depuración firmada con otra clave.

Con un cable USB y depuración activada también puedes instalarla con `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`.

## Probar el acceso

Requiere conexión a internet y un proyecto Supabase con **Confirm email** desactivado.

1. **Crear cuenta:** en **Crear cuenta**, acepta los dos consentimientos obligatorios, registra un correo nuevo y una contraseña de ocho o más caracteres con una letra y un número. Debe abrirse **Hoy**.
2. **Cerrar sesión:** toca **Cerrar sesión**, comprueba que **Cancelar** no hace nada y que confirmar regresa a **Iniciar sesión**.
3. **Iniciar sesión:** entra con la misma cuenta; una contraseña incorrecta debe mostrar un error en español. El botón queda deshabilitado mientras carga.
4. **Reabrir la app:** cierra la app por completo (o recarga el navegador) y ábrela de nuevo; debe abrir **Hoy** sin pedir credenciales.
5. **Recuperar contraseña:** desde **¿Olvidaste tu contraseña?**, envía un correo válido y verifica el mensaje genérico «Si el correo existe, te enviamos un enlace». El cambio de contraseña desde el enlace aún no está implementado.
6. **Dos cuentas:** crea una segunda cuenta en el mismo dispositivo, completa perfil o rutina y comprueba que al volver a la primera no aparecen los datos de la segunda.
7. En Supabase, confirma los usuarios en **Authentication > Users**.

## Flujo de trabajo

- Al iniciar una tarea o decisión relevante, confirma alcance o preferencia con una pregunta de selección por vez; no repitas decisiones ya aclaradas.
- Avanza en cambios pequeños y revisables; prueba los cambios antes de continuar.
- Mantén actualizado este README y documenta comandos que realmente existan en el proyecto.

La guía en video compartida por el equipo se toma como inspiración general; no se afirma que su contenido se haya verificado ni que coincida con las versiones actuales del proyecto.

## Equipo y uso académico

Proyecto desarrollado por **Jonathan** y **Nayeli**, estudiantes de la **Universidad Santiago de Cali (USC)**, para la asignatura **Computación Móvil**. No tiene fines comerciales. No se concede una licencia de uso o redistribución salvo que el equipo publique una licencia explícita en el repositorio.
