import type { EquipoGimnasio, Experiencia } from '../types/perfil';
import type { SerieRegistrada } from '../types/series';
import { ETIQUETAS_EQUIPO } from './etiquetasRutina';

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

const TEXTO_EXPERIENCIA: Readonly<Record<Experiencia, string>> = {
  ninguna: 'Sin experiencia previa',
  'menos-6-meses': 'Menos de 6 meses de experiencia',
  'mas-6-meses': 'Más de 6 meses de experiencia',
};

/** Experiencia en lenguaje natural para el resumen del perfil. */
export function describirExperiencia(experiencia: Experiencia): string {
  return TEXTO_EXPERIENCIA[experiencia];
}

/** Equipo resumido: con un solo tipo lo nombra; con varios, solo cuántos son. */
export function resumirEquipo(equipo: readonly EquipoGimnasio[]): string {
  if (equipo.length === 1) {
    return `Equipo: ${ETIQUETAS_EQUIPO[equipo[0]].toLowerCase()}`;
  }
  return `Equipo: ${equipo.length} tipos`;
}

/** Texto de las sesiones registradas, con un mensaje propio cuando aún no hay ninguna. */
export function describirSesiones(cantidad: number): string {
  if (cantidad === 0) {
    return 'Aún no registras sesiones';
  }
  return cantidad === 1 ? '1 sesión registrada' : `${cantidad} sesiones registradas`;
}
