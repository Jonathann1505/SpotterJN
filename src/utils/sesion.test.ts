import { describe, expect, it } from 'vitest';
import type { DiaRutina } from '../types/perfil';
import { PROGRESO_INICIAL, avanzarSerie, esPesoCorporal } from './sesion';

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
