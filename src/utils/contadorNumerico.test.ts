import { describe, expect, it } from 'vitest';
import {
  decrementarValor,
  incrementarValor,
  limitarValor,
  obtenerPasoPeso,
} from './contadorNumerico';

describe('operaciones del contador numérico', () => {
  it('limita el valor al intervalo configurado y trata NaN como el mínimo', () => {
    expect(limitarValor(-3, 0, 50)).toBe(0);
    expect(limitarValor(60, 0, 50)).toBe(50);
    expect(limitarValor(Number.NaN, 0, 50)).toBe(0);
  });

  it('incrementa y decrementa respetando los límites', () => {
    expect(incrementarValor(49, 1, 0, 50)).toBe(50);
    expect(incrementarValor(50, 1, 0, 50)).toBe(50);
    expect(decrementarValor(0, 1, 0, 50)).toBe(0);
    expect(decrementarValor(1, 1, 0, 50)).toBe(0);
  });

  it('evita errores de precisión al sumar pasos decimales', () => {
    expect(incrementarValor(0.1, 0.2, 0)).toBe(0.3);
    expect(decrementarValor(0.3, 0.1, 0)).toBe(0.2);
    expect(incrementarValor(10, 0.5, 0)).toBe(10.5);
  });

  it('selecciona el paso de carga según la unidad', () => {
    expect(obtenerPasoPeso('kg')).toBe(0.5);
    expect(obtenerPasoPeso('lb')).toBe(1);
  });

  it('rechaza rangos y pasos inválidos', () => {
    expect(() => limitarValor(1, 2, 1)).toThrow(RangeError);
    expect(() => incrementarValor(1, 0, 0)).toThrow(RangeError);
  });
});
