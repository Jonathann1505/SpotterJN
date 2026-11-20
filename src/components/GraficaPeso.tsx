import type { UnidadPeso } from '../types/perfil';
import type { PuntoSemanal } from '../utils/historial';

interface PropiedadesGrafica {
  puntos: readonly PuntoSemanal[];
  unidad: UnidadPeso;
  /** Nombre del ejercicio, para la descripción accesible. */
  ejercicio: string;
}

const ANCHO = 320;
const ALTO = 190;
const MARGEN = { izquierda: 52, derecha: 16, arriba: 16, abajo: 40 };

function formatearPeso(peso: number): string {
  return peso.toLocaleString('es', { maximumFractionDigits: 1 });
}

function formatearSemana(fecha: Date): string {
  return fecha.toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

/** Gráfica de líneas del peso más alto de cada semana, dibujada en SVG sin librerías. */
export function GraficaPeso({ puntos, unidad, ejercicio }: PropiedadesGrafica) {
  if (puntos.length === 0) {
    return null;
  }

  const pesos = puntos.map((punto) => punto.peso);
  const minimo = Math.min(...pesos);
  const maximo = Math.max(...pesos);
  // Con un peso constante se deja un margen para que la línea no quede pegada al borde.
  const piso = minimo === maximo ? minimo - 1 : minimo;
  const techo = minimo === maximo ? maximo + 1 : maximo;
  const tiempos = puntos.map((punto) => punto.inicioSemana.getTime());
  const primero = Math.min(...tiempos);
  const ultimo = Math.max(...tiempos);

  const anchoUtil = ANCHO - MARGEN.izquierda - MARGEN.derecha;
  const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo;
  const x = (tiempo: number): number =>
    MARGEN.izquierda + (ultimo === primero ? anchoUtil / 2 : ((tiempo - primero) / (ultimo - primero)) * anchoUtil);
  const y = (peso: number): number => MARGEN.arriba + altoUtil - ((peso - piso) / (techo - piso)) * altoUtil;

  const coordenadas = puntos.map((punto) => ({ x: x(punto.inicioSemana.getTime()), y: y(punto.peso), punto }));
  const trazo = coordenadas.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const resumen =
    puntos.length === 1
      ? `Peso de ${ejercicio}: ${formatearPeso(pesos[0])} ${unidad} en una semana.`
      : `Peso de ${ejercicio} por semana: de ${formatearPeso(pesos[0])} a ${formatearPeso(pesos[pesos.length - 1])} ${unidad} en ${puntos.length} semanas.`;

  return (
    <figure className="sj-grafica">
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} role="img" aria-label={resumen} preserveAspectRatio="xMidYMid meet">
        <line className="sj-grafica-eje" x1={MARGEN.izquierda} y1={MARGEN.arriba} x2={MARGEN.izquierda} y2={ALTO - MARGEN.abajo} />
        <line
          className="sj-grafica-eje"
          x1={MARGEN.izquierda}
          y1={ALTO - MARGEN.abajo}
          x2={ANCHO - MARGEN.derecha}
          y2={ALTO - MARGEN.abajo}
        />
        <text className="sj-grafica-texto" x={MARGEN.izquierda - 6} y={MARGEN.arriba + 5} textAnchor="end">
          {formatearPeso(techo)}
        </text>
        <text className="sj-grafica-texto" x={MARGEN.izquierda - 6} y={ALTO - MARGEN.abajo} textAnchor="end">
          {formatearPeso(piso)}
        </text>
        {puntos.length > 1 ? <polyline className="sj-grafica-linea" points={trazo} /> : null}
        {coordenadas.map((c) => (
          <circle
            key={c.punto.inicioSemana.getTime()}
            className="sj-grafica-punto"
            cx={c.x}
            cy={c.y}
            r={5}
            data-peso={c.punto.peso}
          />
        ))}
        <text className="sj-grafica-texto" x={coordenadas[0].x} y={ALTO - 10} textAnchor={puntos.length > 1 ? 'start' : 'middle'}>
          {formatearSemana(puntos[0].inicioSemana)}
        </text>
        {puntos.length > 1 ? (
          <text className="sj-grafica-texto" x={coordenadas[coordenadas.length - 1].x} y={ALTO - 10} textAnchor="end">
            {formatearSemana(puntos[puntos.length - 1].inicioSemana)}
          </text>
        ) : null}
      </svg>
      <figcaption className="sj-suave">Peso más alto de cada semana ({unidad})</figcaption>
    </figure>
  );
}
