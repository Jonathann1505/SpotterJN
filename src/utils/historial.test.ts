import { describe, expect, it } from 'vitest';
import type { SerieRegistrada } from '../types/series';
import { ejerciciosConHistorial, pesoPorSemana, sesionesDeEjercicio } from './historial';

let contador = 0;

function serie(parcial: Partial<SerieRegistrada> & Pick<SerieRegistrada, 'registradaEn'>): SerieRegistrada {
  contador += 1;
  return {
    id: `serie-${contador}`,
    idEjercicio: 'press-banca',
    nombreEjercicio: 'Press de banca',
    dia: 'Día 1 – Cuerpo completo',
    numeroSerie: 1,
    peso: 20,
    unidad: 'kg',
    repeticiones: 12,
    autoevaluacion: 'normal',
    estado: 'completada',
    ...parcial,
  };
}

// Noviembre de 2026: 16 lunes, 18 miércoles, 23 lunes.
const hora = (dia: number, h = 9) => new Date(2026, 10, dia, h, 0).toISOString();

describe('sesionesDeEjercicio', () => {
  it('agrupa las series de un día en una sesión y ordena de la más reciente a la más antigua', () => {
    const series = [
      serie({ registradaEn: hora(16), numeroSerie: 1, peso: 20, repeticiones: 12 }),
      serie({ registradaEn: hora(16, 10), numeroSerie: 2, peso: 20, repeticiones: 10, autoevaluacion: 'dificil' }),
      serie({ registradaEn: hora(18), numeroSerie: 1, peso: 22.5, repeticiones: 12, autoevaluacion: 'facil' }),
    ];

    const sesiones = sesionesDeEjercicio(series, 'press-banca', 'kg');

    expect(sesiones).toHaveLength(2);
    expect(sesiones[0]).toMatchObject({ peso: 22.5, repeticiones: 12, seriesCompletadas: 1, autoevaluacion: 'facil' });
    expect(sesiones[1]).toMatchObject({ peso: 20, repeticiones: 12, seriesCompletadas: 2, autoevaluacion: 'dificil' });
  });

  it('ignora las series de otros ejercicios', () => {
    const series = [
      serie({ registradaEn: hora(16) }),
      serie({ registradaEn: hora(16), idEjercicio: 'flexiones', nombreEjercicio: 'Flexiones', peso: null }),
    ];

    expect(sesionesDeEjercicio(series, 'flexiones', 'kg')).toHaveLength(1);
  });

  it('convierte el peso a la unidad pedida y deja null el de peso corporal', () => {
    const series = [
      serie({ registradaEn: hora(16), peso: 100, unidad: 'lb' }),
      serie({ registradaEn: hora(18), idEjercicio: 'flexiones', peso: null }),
    ];

    expect(sesionesDeEjercicio(series, 'press-banca', 'kg')[0].peso).toBe(45.5);
    expect(sesionesDeEjercicio(series, 'flexiones', 'kg')[0].peso).toBeNull();
  });

  it('marca las sesiones con molestia y no cuenta como completadas las series interrumpidas', () => {
    const series = [
      serie({ registradaEn: hora(16), numeroSerie: 1 }),
      serie({ registradaEn: hora(16, 10), numeroSerie: 2, estado: 'interrumpida-por-molestia', autoevaluacion: null }),
    ];

    const [sesion] = sesionesDeEjercicio(series, 'press-banca', 'kg');

    expect(sesion.conMolestia).toBe(true);
    expect(sesion.seriesCompletadas).toBe(1);
  });

  it('devuelve una lista vacía sin series', () => {
    expect(sesionesDeEjercicio([], 'press-banca', 'kg')).toEqual([]);
  });
});

describe('ejerciciosConHistorial', () => {
  it('lista cada ejercicio una vez, primero el más reciente, con su número de sesiones', () => {
    const series = [
      serie({ registradaEn: hora(16) }),
      serie({ registradaEn: hora(18) }),
      serie({ registradaEn: hora(18, 12), idEjercicio: 'flexiones', nombreEjercicio: 'Flexiones', peso: null }),
    ];

    expect(ejerciciosConHistorial(series)).toEqual([
      { id: 'flexiones', nombre: 'Flexiones', sesiones: 1 },
      { id: 'press-banca', nombre: 'Press de banca', sesiones: 2 },
    ]);
  });

  it('devuelve una lista vacía sin series', () => {
    expect(ejerciciosConHistorial([])).toEqual([]);
  });
});

describe('pesoPorSemana', () => {
  it('toma el peso más alto de cada semana, empezando en lunes, de la más antigua a la más reciente', () => {
    const series = [
      serie({ registradaEn: hora(16), peso: 20 }),
      serie({ registradaEn: hora(18), peso: 22.5 }),
      serie({ registradaEn: hora(23), peso: 25 }),
    ];
    const sesiones = sesionesDeEjercicio(series, 'press-banca', 'kg');

    const puntos = pesoPorSemana(sesiones);

    expect(puntos.map((p) => p.peso)).toEqual([22.5, 25]);
    expect(puntos[0].inicioSemana).toEqual(new Date(2026, 10, 16));
    expect(puntos[1].inicioSemana).toEqual(new Date(2026, 10, 23));
  });

  it('el domingo cuenta para la semana que empezó el lunes anterior', () => {
    const sesiones = sesionesDeEjercicio([serie({ registradaEn: hora(22) })], 'press-banca', 'kg');

    expect(pesoPorSemana(sesiones)[0].inicioSemana).toEqual(new Date(2026, 10, 16));
  });

  it('omite las sesiones sin peso (peso corporal)', () => {
    const sesiones = sesionesDeEjercicio([serie({ registradaEn: hora(16), peso: null })], 'press-banca', 'kg');

    expect(pesoPorSemana(sesiones)).toEqual([]);
  });
});
