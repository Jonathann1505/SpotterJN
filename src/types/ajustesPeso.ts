import type { UnidadPeso } from './perfil';

/** Peso de partida elegido a mano para un ejercicio (RF-17). */
export interface AjustePeso {
  idEjercicio: string;
  /** Peso en la unidad indicada. */
  peso: number;
  unidad: UnidadPeso;
  /** Fecha y hora del ajuste en ISO 8601. */
  ajustadoEn: string;
}

/** Ajustes de un usuario indexados por id de ejercicio. */
export type AjustesPeso = Readonly<Record<string, AjustePeso>>;
