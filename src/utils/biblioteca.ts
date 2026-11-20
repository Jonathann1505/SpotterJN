import { EJERCICIOS, type EjercicioCatalogo } from '../data/ejercicios';
import { obtenerGuia } from '../data/guias';
import type { EquipoGimnasio } from '../types/perfil';

export interface FiltrosBiblioteca {
  /** Grupo muscular de la guía («Pecho», «Espalda»…) o `null` para todos. */
  grupo: string | null;
  /** Equipo necesario o `null` para todos. */
  equipo: EquipoGimnasio | null;
}

export const SIN_FILTROS: FiltrosBiblioteca = { grupo: null, equipo: null };

export function grupoDe(ejercicio: EjercicioCatalogo): string {
  return obtenerGuia(ejercicio.id).grupoMuscular;
}

/** Grupos musculares del catálogo, en el orden en que aparecen. */
export function gruposDisponibles(): string[] {
  return [...new Set(EJERCICIOS.map(grupoDe))];
}

/** Equipos usados por el catálogo, en el orden en que aparecen. */
export function equiposDisponibles(): EquipoGimnasio[] {
  return [...new Set(EJERCICIOS.map((ejercicio) => ejercicio.equipo))];
}

export function filtrarBiblioteca(filtros: FiltrosBiblioteca): EjercicioCatalogo[] {
  return EJERCICIOS.filter(
    (ejercicio) =>
      (filtros.grupo === null || grupoDe(ejercicio) === filtros.grupo) &&
      (filtros.equipo === null || ejercicio.equipo === filtros.equipo),
  );
}
