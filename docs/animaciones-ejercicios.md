# Animaciones de ejercicios

Hay dos formas de dar animación a un ejercicio:

1. **Un video MP4** (recomendado si ya lo tienes): se copia en `public/ejercicios/` y se indica en la guía. Es la opción más fiel y liviana.
2. **Tres imágenes** que el comando `npm run animacion:crear` convierte en una animación HTML con indicaciones sobre la imagen (como el press de banca).

## Opción 1: video MP4

Requisitos del video:

- **Cuadrado**, sin audio, con cámara fija y el mismo fondo azul de las demás animaciones.
- Que el último cuadro sea casi igual al primero, para que el bucle no dé un salto.
- Sin texto ni etiquetas sobre el video: las indicaciones ya están en la guía escrita.

Antes de añadirlo, se comprime (de 1 MB o más pasa a menos de 150 KB sin pérdida visible). Con `ffmpeg` instalado:

```bash
ffmpeg -i original.mp4 -vf "scale=480:480:flags=lanczos" -r 30 -an -c:v libx264 -profile:v main -level 3.1 -crf 27 -preset slow -pix_fmt yuv420p -movflags +faststart public/ejercicios/<id>.mp4
```

Después se añade `animacion: 'ejercicios/<id>.mp4'` a la guía del ejercicio en `src/data/guias.ts`; una prueba comprueba que el archivo exista. En la ficha el video se reproduce en bucle y silenciado, se pausa o reanuda al tocarlo y no arranca solo si el sistema pide menos movimiento.

## Opción 2: tres imágenes

Cada animación se arma con **3 imágenes de la misma escena** y se reproduce como el press de banca: pose inicial, pose intermedia, pose final y de regreso. Este documento dice qué debe mostrar cada imagen y cómo convertirlas en la animación.

## Cómo preparar las imágenes

- Formato cuadrado de **500 × 500 px** (el press de banca usa 496 × 496) y **WebP**, de unos 25 KB cada una. El máximo que acepta el comando es 300 KB.
- Las tres imágenes de un ejercicio deben compartir **el mismo personaje, el mismo encuadre, la misma cámara y el mismo fondo**; solo cambia la posición del cuerpo y del equipo.
- Fondo con el mismo degradado azul de las animaciones existentes, de `#aec8df` arriba a `#bbd3e8` abajo, para que se integre con la ficha.
- Nombres sugeridos: `<id>-arriba.webp`, `<id>-medio.webp` y `<id>-abajo.webp`.

## Cómo crear la animación

```bash
npm run animacion:crear -- --id sentadilla-goblet --titulo "Sentadilla goblet" \
  --arriba sentadilla-goblet-arriba.webp --medio sentadilla-goblet-medio.webp --abajo sentadilla-goblet-abajo.webp \
  --tipo piernas
```

Esto genera `public/ejercicios/<id>.html`. Después hay que añadir `animacion: 'ejercicios/<id>.html'` a la guía del ejercicio en `src/data/guias.ts`; una prueba comprueba que el archivo exista.

`--tipo` elige las cuatro indicaciones que aparecen sobre la animación:

| Tipo | Pose inicial | Fase lenta | Pausa | Fase rápida |
| --- | --- | --- | --- | --- |
| `empuje` | Bloquea arriba | Baja controlado | Pausa abajo | Empuja |
| `tiron` | Brazos estirados | Tira controlado | Aprieta y pausa | Vuelve despacio |
| `piernas` | Firme arriba | Baja controlado | Pausa abajo | Sube con fuerza |

Con `--pistas "a|b|c|d"` se pueden escribir indicaciones propias, que reemplazan a `--tipo`.

## Qué muestra cada imagen

La animación recorre **inicial → intermedia → final → intermedia**. La parte lenta es de la pose inicial a la final.

| Ejercicio (`id`) | Pose inicial (arriba) | Intermedia (medio) | Final (abajo) | Tipo |
| --- | --- | --- | --- | --- |
| Press de banca (`press-banca`) | Hecha | Hecha | Hecha | `empuje` |
| Press de pecho en máquina (`press-pecho-maquina`) | Brazos estirados al frente | Codos a medio camino | Asas cerca del pecho | `empuje` |
| Press con mancuernas (`press-mancuernas`) | Brazos estirados arriba, acostado en el banco | Mancuernas a medio camino | Mancuernas a la altura del pecho | `empuje` |
| Extensión de tríceps en polea (`triceps-polea`) | Antebrazos arriba, codos pegados | Antebrazos a medio camino | Brazos estirados abajo | `--pistas "Codos pegados\|Empuja controlado\|Pausa abajo\|Vuelve despacio"` |
| Flexiones (`flexiones`) | Brazos estirados, cuerpo recto | Codos a medio doblar | Pecho cerca del piso | `empuje` |
| Jalón al pecho (`jalon-pecho`) | Brazos estirados hacia arriba | Barra a la altura de la cara | Barra en la parte alta del pecho | `tiron` |
| Remo en máquina (`remo-maquina`) | Brazos estirados al frente | Asas a medio camino | Asas junto al torso, omóplatos juntos | `tiron` |
| Remo con mancuerna (`remo-mancuerna`) | Brazo estirado hacia abajo | Mancuerna a media altura | Mancuerna junto a la cadera | `tiron` |
| Remo con barra (`remo-barra`) | Torso inclinado, barra colgando a la altura de las rodillas | Barra a media altura | Barra junto al abdomen | `tiron` |
| Remo invertido (`remo-invertido`) | Colgado bajo la barra, brazos estirados | Medio camino hacia la barra | Pecho junto a la barra | `tiron` |
| Prensa de piernas (`prensa-piernas`) | Piernas casi estiradas | Rodillas a medio doblar | Rodillas dobladas a unos 90 grados | `piernas` |
| Sentadilla goblet (`sentadilla-goblet`) | De pie con la mancuerna al pecho | A medio bajar | Sentadilla profunda, talones en el piso | `piernas` |
| Peso muerto rumano (`peso-muerto-rumano`) | De pie con la barra a la altura de la cadera | Torso a medio inclinar | Torso inclinado, barra bajo las rodillas, espalda recta | `piernas` |
| Curl femoral en máquina (`curl-femoral`) | Piernas estiradas | Rodillas a medio doblar | Talones cerca de los glúteos | `tiron` |
| Sentadilla con peso corporal (`sentadilla-peso-corporal`) | De pie, brazos al frente | A medio bajar | Sentadilla profunda, talones en el piso | `piernas` |
| Zancadas (`zancadas`) | De pie con los pies juntos | Paso largo, a medio bajar | Rodilla de atrás casi en el piso | `piernas` |

## Estado

| Ejercicio | Animación |
| --- | --- |
| Press de banca | Hecha (HTML) |
| Flexiones | Hecha (video) |
| Sentadilla con peso corporal | Hecha (video) |
| Los otros 13 | Pendiente: esperan su video o sus 3 imágenes |

Mientras un ejercicio no tenga animación, su ficha muestra «Animación próximamente» y el resto de la guía.
