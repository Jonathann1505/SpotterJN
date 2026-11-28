import { describe, expect, it } from 'vitest';
import type { DiaRutina } from '../types/perfil';
import type { SerieRegistrada } from '../types/series';
import {
  PROGRESO_INICIAL,
  avanzarSerie,
  crearSerieRegistrada,
  esPesoCorporal,
  esUltimoEjercicio,
  generarIdSerie,
  jornadaCompleta,
  retomarSesion,
  saltarEjercicio,
} from './sesion';

const dia: DiaRutina = {
  nombre: 'Día 1 – Prueba',
  ejercicios: [
    { id: 'press-pecho-maquina', nombre: 'Press de pecho en máquina', series: 2, repeticiones: 12, pesoInicialKg: 15 },
    { id: 'flexiones', nombre: 'Flexiones', series: 1, repeticiones: 10, pesoInicialKg: 0 },
  ],
};

describe('avanzarSerie', () => {
  it('avanza a la siguiente serie del mismo ejercicio', () => {
    expect(avanzarSerie(PROGRESO_INICIAL, dia)).toEqual({ indiceEjercicio: 0, serie: 2, completada: false });
  });

  it('pasa al siguiente ejercicio en la serie 1 al terminar la última serie', () => {
    expect(avanzarSerie({ indiceEjercicio: 0, serie: 2, completada: false }, dia)).toEqual({
      indiceEjercicio: 1,
      serie: 1,
      completada: false,
    });
  });

  it('marca la sesión como completada tras la última serie del último ejercicio', () => {
    expect(avanzarSerie({ indiceEjercicio: 1, serie: 1, completada: false }, dia).completada).toBe(true);
  });

  it('mantiene completada una sesión ya terminada', () => {
    const terminada = { indiceEjercicio: 1, serie: 1, completada: true };
    expect(avanzarSerie(terminada, dia)).toEqual(terminada);
  });
});

describe('esPesoCorporal', () => {
  it('reconoce ejercicios de peso corporal por el catálogo', () => {
    expect(esPesoCorporal(dia.ejercicios[1])).toBe(true);
  });

  it('no trata como peso corporal un ejercicio con carga', () => {
    expect(esPesoCorporal(dia.ejercicios[0])).toBe(false);
  });

  it('trata como peso corporal un ejercicio desconocido sin carga inicial', () => {
    expect(esPesoCorporal({ id: 'desconocido', nombre: 'X', series: 1, repeticiones: 1, pesoInicialKg: 0 })).toBe(true);
  });
});

describe('saltarEjercicio', () => {
  it('pasa al siguiente ejercicio sin contar la serie en curso', () => {
    expect(saltarEjercicio({ indiceEjercicio: 0, serie: 2, completada: false }, dia)).toEqual({
      indiceEjercicio: 1,
      serie: 1,
      completada: false,
    });
  });

  it('termina la sesión si se interrumpe el último ejercicio', () => {
    expect(saltarEjercicio({ indiceEjercicio: 1, serie: 1, completada: false }, dia).completada).toBe(true);
  });

  it('no modifica una sesión ya terminada', () => {
    const terminada = { indiceEjercicio: 1, serie: 1, completada: true };
    expect(saltarEjercicio(terminada, dia)).toBe(terminada);
  });
});

describe('esUltimoEjercicio', () => {
  it('distingue el último ejercicio de la jornada', () => {
    expect(esUltimoEjercicio(PROGRESO_INICIAL, dia)).toBe(false);
    expect(esUltimoEjercicio({ indiceEjercicio: 1, serie: 1, completada: false }, dia)).toBe(true);
  });
});

describe('crearSerieRegistrada', () => {
  const ahora = new Date('2026-11-20T18:30:00.000Z');

  it('construye la serie con la fecha en ISO, el día y la unidad del perfil', () => {
    expect(
      crearSerieRegistrada({
        dia,
        ejercicio: dia.ejercicios[0],
        numeroSerie: 2,
        repeticiones: 11,
        peso: 33,
        unidad: 'lb',
        autoevaluacion: 'normal',
        estado: 'completada',
        ahora,
        id: 'serie-fija',
      }),
    ).toEqual({
      id: 'serie-fija',
      registradaEn: '2026-11-20T18:30:00.000Z',
      idEjercicio: 'press-pecho-maquina',
      nombreEjercicio: 'Press de pecho en máquina',
      dia: 'Día 1 – Prueba',
      numeroSerie: 2,
      peso: 33,
      unidad: 'lb',
      repeticiones: 11,
      autoevaluacion: 'normal',
      estado: 'completada',
    });
  });

  it('guarda peso null en los ejercicios de peso corporal', () => {
    const serie = crearSerieRegistrada({
      dia,
      ejercicio: dia.ejercicios[1],
      numeroSerie: 1,
      repeticiones: 10,
      peso: 0,
      unidad: 'kg',
      autoevaluacion: null,
      estado: 'interrumpida-por-molestia',
      ahora,
    });
    expect(serie.peso).toBeNull();
    expect(serie.estado).toBe('interrumpida-por-molestia');
  });

  it('genera identificadores distintos', () => {
    expect(generarIdSerie()).not.toBe(generarIdSerie());
  });
});

describe('retomarSesion', () => {
  const hoy = new Date(2026, 10, 18, 19, 0);
  const serie = (idEjercicio: string, numeroSerie: number, cambios: Partial<SerieRegistrada> = {}): SerieRegistrada => ({
    id: `${idEjercicio}-${numeroSerie}-${cambios.registradaEn ?? ''}`,
    registradaEn: new Date(2026, 10, 18, 18, numeroSerie).toISOString(),
    idEjercicio,
    nombreEjercicio: idEjercicio,
    dia: dia.nombre,
    numeroSerie,
    peso: 15,
    unidad: 'kg',
    repeticiones: 12,
    autoevaluacion: 'normal',
    estado: 'completada',
    ...cambios,
  });

  it('sin series de hoy empieza desde el principio', () => {
    expect(retomarSesion(dia, [], hoy)).toBeNull();
  });

  it('sigue en la serie que falta del mismo ejercicio', () => {
    const guardadas = [serie('press-pecho-maquina', 1)];

    expect(retomarSesion(dia, guardadas, hoy)).toEqual({
      progreso: { indiceEjercicio: 0, serie: 2, completada: false },
      seriesDeHoy: guardadas,
    });
  });

  it('pasa al siguiente ejercicio si el anterior está terminado o se detuvo por molestia', () => {
    expect(retomarSesion(dia, [serie('press-pecho-maquina', 1), serie('press-pecho-maquina', 2)], hoy)?.progreso).toEqual({
      indiceEjercicio: 1,
      serie: 1,
      completada: false,
    });
    expect(
      retomarSesion(dia, [serie('press-pecho-maquina', 1, { estado: 'interrumpida-por-molestia' })], hoy)?.progreso,
    ).toEqual({ indiceEjercicio: 1, serie: 1, completada: false });
  });

  it('ignora las series de otros días y de otras jornadas', () => {
    const ayer = serie('press-pecho-maquina', 1, { registradaEn: new Date(2026, 10, 17, 18, 0).toISOString() });
    const otraJornada = serie('press-pecho-maquina', 1, { dia: 'Día 2 – Otra' });

    expect(retomarSesion(dia, [ayer, otraJornada], hoy)).toBeNull();
  });

  it('si la jornada de hoy ya está completa, no la retoma', () => {
    const completa = [serie('press-pecho-maquina', 1), serie('press-pecho-maquina', 2), serie('flexiones', 1)];

    expect(retomarSesion(dia, completa, hoy)).toBeNull();
    expect(jornadaCompleta(dia, completa)).toBe(true);
  });

  it('una jornada detenida por molestia sin series completadas no cuenta como hecha', () => {
    const detenida = [
      serie('press-pecho-maquina', 1, { estado: 'interrumpida-por-molestia' }),
      serie('flexiones', 1, { estado: 'interrumpida-por-molestia' }),
    ];

    expect(retomarSesion(dia, detenida, hoy)).toBeNull();
    expect(jornadaCompleta(dia, detenida)).toBe(false);
  });
});
