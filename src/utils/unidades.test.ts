import { describe, expect, it } from 'vitest';
import { formatearPeso, kgALb, lbAKg, pesoEnUnidad } from './unidades';

describe('unidades de peso', () => {
  it('convierte entre kg y lb', () => {
    expect(kgALb(100)).toBeCloseTo(220.462, 3);
    expect(lbAKg(220.462)).toBeCloseTo(100, 3);
  });

  it('redondea a 0,5 kg o a 1 lb', () => {
    expect(pesoEnUnidad(17.3, 'kg')).toBe(17.5);
    expect(pesoEnUnidad(20, 'lb')).toBe(44);
  });

  it('formatea el peso con su unidad', () => {
    expect(formatearPeso(40, 'kg')).toBe('40 kg');
    expect(formatearPeso(17.5, 'kg')).toBe('17,5 kg');
    expect(formatearPeso(40, 'lb')).toBe('88 lb');
  });

  it('muestra "Peso corporal" cuando no hay carga', () => {
    expect(formatearPeso(0, 'kg')).toBe('Peso corporal');
  });
});
