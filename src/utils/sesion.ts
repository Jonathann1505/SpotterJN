import { buscarEjercicio } from '../data/ejercicios';
import type { DiaRutina, EjercicioRutina } from '../types/perfil';

export const AUTOEVALUACIONES = ['facil', 'normal', 'dificil'] as const;
export type Autoevaluacion = (typeof AUTOEVALUACIONES)[number];

export const ETIQUETAS_AUTOEVALUACION: Readonly<Record<Autoevaluacion, string>> = {
  facil: 'Fácil',
  normal: 'Normal',
  dificil: 'Difícil',
};

/** Posición actual dentro de la jornada. `serie` empieza en 1. */
export interface ProgresoSesion {
  indiceEjercicio: number;
  serie: number;
  completada: boolean;
}

export const PROGRESO_INICIAL: ProgresoSesion = { indiceEjercicio: 0, serie: 1, completada: false };

/** Un ejercicio es de peso corporal si así lo indica el catálogo o si no tiene carga inicial. */
export function esPesoCorporal(ejercicio: EjercicioRutina): boolean {
  return buscarEjercicio(ejercicio.id)?.equipo === 'peso-corporal' || ejercicio.pesoInicialKg <= 0;
}

function pasarAlSiguienteEjercicio(progreso: ProgresoSesion, dia: DiaRutina): ProgresoSesion {
  const siguiente = progreso.indiceEjercicio + 1;
  if (siguiente >= dia.ejercicios.length) {
    return { ...progreso, completada: true };
  }
  return { indiceEjercicio: siguiente, serie: 1, completada: false };
}

/**
 * Registra la serie actual como realizada: avanza a la siguiente serie, al siguiente
 * ejercicio cuando era la última, o marca la sesión como completada.
 */
export function avanzarSerie(progreso: ProgresoSesion, dia: DiaRutina): ProgresoSesion {
  const ejercicio = dia.ejercicios[progreso.indiceEjercicio];
  if (progreso.completada || !ejercicio) {
    return { ...progreso, completada: true };
  }
  if (progreso.serie < ejercicio.series) {
    return { ...progreso, serie: progreso.serie + 1 };
  }
  return pasarAlSiguienteEjercicio(progreso, dia);
}
