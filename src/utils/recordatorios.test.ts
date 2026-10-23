import { Weekday } from '@capacitor/local-notifications';
import { describe, expect, it } from 'vitest';
import { describirDias, diasDeEntrenamiento, esHoraValida, separarHora } from './recordatorios';

describe('hora del recordatorio', () => {
  it.each(['00:00', '06:30', '18:00', '23:59'])('acepta %s', (hora) => {
    expect(esHoraValida(hora)).toBe(true);
  });

  it.each(['', '24:00', '7:30', '12:60', 'ab:cd', '18:00:00'])('rechaza "%s"', (hora) => {
    expect(esHoraValida(hora)).toBe(false);
  });

  it('separa hora y minutos', () => {
    expect(separarHora('06:05')).toEqual({ hour: 6, minute: 5 });
  });

  it('lanza un error si la hora no es válida', () => {
    expect(() => separarHora('99:99')).toThrow(RangeError);
  });
});

describe('diasDeEntrenamiento', () => {
  it.each([2, 3, 4, 5, 6])('devuelve %i días distintos y ordenados', (cantidad) => {
    const dias = diasDeEntrenamiento(cantidad);
    expect(dias).toHaveLength(cantidad);
    expect(new Set(dias).size).toBe(cantidad);
    expect([...dias].sort((a, b) => a - b)).toEqual([...dias]);
  });

  it('reparte tres días con descanso entre sesiones', () => {
    expect(diasDeEntrenamiento(3)).toEqual([Weekday.Monday, Weekday.Wednesday, Weekday.Friday]);
  });

  it('limita la cantidad al rango de 2 a 6', () => {
    expect(diasDeEntrenamiento(9)).toHaveLength(6);
    expect(diasDeEntrenamiento(0)).toHaveLength(2);
  });
});

describe('describirDias', () => {
  it('escribe los días en español con "y" antes del último', () => {
    expect(describirDias(diasDeEntrenamiento(3))).toBe('lunes, miércoles y viernes');
    expect(describirDias(diasDeEntrenamiento(2))).toBe('lunes y jueves');
  });

  it('maneja uno o ningún día', () => {
    expect(describirDias([Weekday.Sunday])).toBe('domingo');
    expect(describirDias([])).toBe('');
  });
});
