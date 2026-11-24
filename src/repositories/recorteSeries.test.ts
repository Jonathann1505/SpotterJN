import { describe, expect, it } from 'vitest';
import type { SerieRegistrada } from '../types/series';
import { LIMITE_SERIES_POR_USUARIO, SESIONES_PROTEGIDAS_POR_EJERCICIO, recortarSeries } from './recorteSeries';

/** Serie en el día indicado (1 = 1 de enero de 2026). Cada día distinto es una sesión distinta. */
function serie(id: string, dia: number, cambios: Partial<SerieRegistrada> = {}): SerieRegistrada {
  return {
    id,
    registradaEn: new Date(Date.UTC(2026, 0, dia, 18)).toISOString(),
    idEjercicio: 'press-banca',
    nombreEjercicio: 'Press de banca',
    dia: 'Día 1 – Empuje',
    numeroSerie: 1,
    peso: 40,
    unidad: 'kg',
    repeticiones: 12,
    autoevaluacion: 'normal',
    estado: 'completada',
    ...cambios,
  };
}

const ids = (series: readonly SerieRegistrada[]): string[] => series.map((s) => s.id);

describe('recortarSeries', () => {
  it('usa un límite de 2000 series y protege las 3 sesiones que mira la progresión', () => {
    expect(LIMITE_SERIES_POR_USUARIO).toBe(2000);
    expect(SESIONES_PROTEGIDAS_POR_EJERCICIO).toBe(3);
  });

  it('no borra nada por debajo o justo en el límite', () => {
    const series = [serie('a', 1), serie('b', 2), serie('c', 3)];

    expect(recortarSeries(series, 'c', 3)).toEqual(series);
    expect(recortarSeries(series, 'c', 5)).toEqual(series);
  });

  it('con más series que el límite conserva las más recientes y descarta las más antiguas', () => {
    const series = Array.from({ length: 10 }, (_, i) => serie(`s${i + 1}`, i + 1));

    expect(ids(recortarSeries(series, 's10', 5))).toEqual(['s6', 's7', 's8', 's9', 's10']);
  });

  it('siempre conserva la serie recién guardada, aunque su fecha sea la más antigua', () => {
    const series = [serie('b', 5), serie('c', 6), serie('d', 7), serie('e', 8), serie('nueva', 1)];

    // Protegidas: la nueva y las 3 últimas sesiones (c, d, e). Superan el límite de 3 y se conservan igual.
    expect(ids(recortarSeries(series, 'nueva', 3))).toEqual(['c', 'd', 'e', 'nueva']);
  });

  it('protege las 3 últimas sesiones de cada ejercicio aunque sean antiguas', () => {
    const remo = [
      serie('rem-0', 1, { idEjercicio: 'remo' }),
      serie('rem-1', 2, { idEjercicio: 'remo' }),
      serie('rem-2', 3, { idEjercicio: 'remo' }),
      serie('rem-3', 4, { idEjercicio: 'remo' }),
    ];
    const press = Array.from({ length: 6 }, (_, i) => serie(`b${i + 1}`, 20 + i));

    const resultado = ids(recortarSeries([...remo, ...press], 'b6', 7));

    // Remo conserva sus 3 últimas sesiones y pierde la más antigua; press conserva b4, b5 y b6 y, con el
    // cupo restante (7 − 6 protegidas = 1), la más reciente de las demás: b3.
    expect(resultado).toEqual(['rem-1', 'rem-2', 'rem-3', 'b3', 'b4', 'b5', 'b6']);
  });

  it('conserva completas las series de una sesión protegida', () => {
    const viejas = Array.from({ length: 6 }, (_, i) => serie(`v${i + 1}`, i + 1));
    const sesionReciente = [1, 2, 3].map((n) => serie(`r${n}`, 30, { numeroSerie: n }));

    const resultado = ids(recortarSeries([...viejas, ...sesionReciente], 'r3', 5));

    // Protegidas: r1-r3 (última sesión) y v5, v6 (las dos sesiones anteriores).
    expect(resultado).toEqual(['v5', 'v6', 'r1', 'r2', 'r3']);
  });

  it('mantiene el orden original de las series conservadas', () => {
    const series = [serie('x1', 1), serie('x2', 3), serie('x3', 2), serie('x4', 4), serie('x5', 5)];

    // Las 3 sesiones más recientes son x2 (día 3), x4 y x5; se devuelven en su orden de la lista.
    expect(ids(recortarSeries(series, 'x5', 3))).toEqual(['x2', 'x4', 'x5']);
  });
});
