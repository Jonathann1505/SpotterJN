import type { UnidadPeso } from '../types/perfil';

const LIBRAS_POR_KILO = 2.20462;

export function kgALb(kg: number): number {
  return kg * LIBRAS_POR_KILO;
}

export function lbAKg(lb: number): number {
  return lb / LIBRAS_POR_KILO;
}

/** Redondea al incremento de carga de cada unidad: 0,5 kg o 1 lb (RF-10). */
export function pesoEnUnidad(kg: number, unidad: UnidadPeso): number {
  return unidad === 'kg' ? Math.round(kg * 2) / 2 : Math.round(kgALb(kg));
}

export function formatearPeso(kg: number, unidad: UnidadPeso): string {
  if (kg <= 0) {
    return 'Peso corporal';
  }

  return `${pesoEnUnidad(kg, unidad).toLocaleString('es', { maximumFractionDigits: 1 })} ${unidad}`;
}
