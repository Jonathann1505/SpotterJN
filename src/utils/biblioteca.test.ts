import { describe, expect, it } from 'vitest';
import { EJERCICIOS } from '../data/ejercicios';
import { SIN_FILTROS, equiposDisponibles, filtrarBiblioteca, grupoDe, gruposDisponibles } from './biblioteca';

describe('biblioteca de ejercicios', () => {
  it('lista los grupos musculares sin repetirlos', () => {
    expect(gruposDisponibles()).toEqual(['Pecho', 'Tríceps', 'Espalda', 'Piernas']);
  });

  it('lista los equipos del catálogo sin repetirlos', () => {
    expect(equiposDisponibles()).toEqual(['maquinas', 'barra', 'mancuernas', 'poleas', 'peso-corporal']);
  });

  it('sin filtros devuelve todo el catálogo', () => {
    expect(filtrarBiblioteca(SIN_FILTROS)).toHaveLength(EJERCICIOS.length);
  });

  it('filtra por grupo muscular', () => {
    const ejercicios = filtrarBiblioteca({ grupo: 'Espalda', equipo: null });

    expect(ejercicios.length).toBeGreaterThan(0);
    expect(ejercicios.every((e) => grupoDe(e) === 'Espalda')).toBe(true);
  });

  it('filtra por equipo y combina ambos filtros', () => {
    expect(filtrarBiblioteca({ grupo: null, equipo: 'barra' }).every((e) => e.equipo === 'barra')).toBe(true);
    expect(filtrarBiblioteca({ grupo: 'Piernas', equipo: 'peso-corporal' }).map((e) => e.id)).toEqual([
      'sentadilla-peso-corporal',
      'zancadas',
    ]);
  });

  it('devuelve una lista vacía si la combinación no existe', () => {
    expect(filtrarBiblioteca({ grupo: 'Tríceps', equipo: 'barra' })).toEqual([]);
  });
});
