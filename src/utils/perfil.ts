import type { SerieRegistrada } from '../types/series';

/** Hasta dos iniciales del nombre para el avatar; vacío si no hay nombre. */
export function inicialesDe(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter((palabra) => palabra !== '');
  const iniciales = palabras.length > 1 ? [palabras[0], palabras[palabras.length - 1]] : palabras;
  return iniciales.map((palabra) => palabra.charAt(0).toLocaleUpperCase('es')).join('');
}

/**
 * Sesiones de entrenamiento realizadas: días distintos (fecha local) en que se completó al menos una serie
 * de un día de la rutina. Dos días distintos de la rutina hechos la misma fecha cuentan como dos sesiones.
 */
export function contarSesiones(series: readonly SerieRegistrada[]): number {
  const sesiones = new Set<string>();
  for (const serie of series) {
    if (serie.estado !== 'completada') {
      continue;
    }
    const fecha = new Date(serie.registradaEn);
    if (Number.isNaN(fecha.getTime())) {
      continue;
    }
    sesiones.add(`${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}|${serie.dia}`);
  }
  return sesiones.size;
}
