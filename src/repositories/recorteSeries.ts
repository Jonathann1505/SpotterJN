import type { SerieRegistrada } from '../types/series';
import { SESIONES_FALLIDAS_PARA_BAJAR, agruparEnSesiones } from '../utils/progresion';

/**
 * Máximo de series guardadas por usuario en el dispositivo. Unas 110-130 sesiones
 * (9-12 meses entrenando 3 veces por semana) y alrededor de 650 KB en una sola clave.
 */
export const LIMITE_SERIES_POR_USUARIO = 2000;

/** Sesiones recientes de cada ejercicio que nunca se descartan: las que mira la progresión (RF-15, RF-16). */
export const SESIONES_PROTEGIDAS_POR_EJERCICIO = SESIONES_FALLIDAS_PARA_BAJAR;

function marcaDeTiempo(serie: SerieRegistrada): number {
  const valor = Date.parse(serie.registradaEn);
  return Number.isNaN(valor) ? Number.NEGATIVE_INFINITY : valor;
}

/**
 * Recorta la lista de series de un usuario al límite, descartando las más antiguas.
 * Nunca descarta la serie recién guardada ni las de las últimas sesiones de cada ejercicio,
 * aunque eso deje la lista un poco por encima del límite. Conserva el orden original.
 * Función pura: no lee ni escribe almacenamiento.
 */
export function recortarSeries(
  series: readonly SerieRegistrada[],
  idRecienGuardada: string,
  limite: number = LIMITE_SERIES_POR_USUARIO,
): SerieRegistrada[] {
  if (series.length <= limite) {
    return [...series];
  }

  const protegidas = new Set<SerieRegistrada>(series.filter((serie) => serie.id === idRecienGuardada));

  const porEjercicio = new Map<string, SerieRegistrada[]>();
  for (const serie of series) {
    const grupo = porEjercicio.get(serie.idEjercicio);
    if (grupo) {
      grupo.push(serie);
    } else {
      porEjercicio.set(serie.idEjercicio, [serie]);
    }
  }
  for (const grupo of porEjercicio.values()) {
    for (const sesion of agruparEnSesiones(grupo).slice(-SESIONES_PROTEGIDAS_POR_EJERCICIO)) {
      sesion.series.forEach((serie) => protegidas.add(serie));
    }
  }

  const cupoRestante = Math.max(0, limite - protegidas.size);
  const recientesNoProtegidas = series
    .map((serie, indice) => ({ serie, indice }))
    .filter(({ serie }) => !protegidas.has(serie))
    // De la más reciente a la más antigua; a igual fecha, la guardada después.
    .sort((a, b) => marcaDeTiempo(b.serie) - marcaDeTiempo(a.serie) || b.indice - a.indice)
    .slice(0, cupoRestante)
    .map(({ serie }) => serie);

  const conservadas = new Set<SerieRegistrada>([...protegidas, ...recientesNoProtegidas]);
  return series.filter((serie) => conservadas.has(serie));
}
