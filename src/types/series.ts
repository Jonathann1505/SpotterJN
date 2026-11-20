import type { UnidadPeso } from './perfil';

export const AUTOEVALUACIONES = ['facil', 'normal', 'dificil'] as const;
export type Autoevaluacion = (typeof AUTOEVALUACIONES)[number];

export const ESTADOS_SERIE = ['completada', 'interrumpida-por-molestia'] as const;
export type EstadoSerie = (typeof ESTADOS_SERIE)[number];

/** Serie registrada durante una sesión de entrenamiento (RF-10, RF-13). */
export interface SerieRegistrada {
  id: string;
  /** Fecha y hora del registro en ISO 8601. */
  registradaEn: string;
  idEjercicio: string;
  nombreEjercicio: string;
  /** Nombre del día de la rutina, por ejemplo «Día 1 – Empuje». */
  dia: string;
  /** Número de la serie dentro del ejercicio, desde 1. */
  numeroSerie: number;
  /** Peso en la unidad indicada; null en ejercicios de peso corporal. */
  peso: number | null;
  unidad: UnidadPeso;
  repeticiones: number;
  /** null solo si la serie se interrumpió antes de elegir la autoevaluación. */
  autoevaluacion: Autoevaluacion | null;
  estado: EstadoSerie;
}
