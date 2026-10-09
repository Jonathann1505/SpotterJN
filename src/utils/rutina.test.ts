import { describe, expect, it } from 'vitest';
import { EJERCICIOS } from '../data/ejercicios';
import type { CuestionarioRutina } from '../types/perfil';
import { asignarRutina } from './rutina';

const base: CuestionarioRutina = { experiencia: 'ninguna', diasPorSemana: 3, equipo: ['maquinas', 'mancuernas'] };

describe('asignarRutina', () => {
  it.each([2, 3, 4, 5, 6])('genera %i días de entrenamiento', (dias) => {
    const rutina = asignarRutina({ ...base, diasPorSemana: dias });
    expect(rutina.dias).toHaveLength(dias);
    expect(rutina.dias.every((dia) => dia.ejercicios.length >= 3)).toBe(true);
  });

  it('solo usa equipo disponible o peso corporal', () => {
    const rutina = asignarRutina({ ...base, equipo: ['mancuernas'] });
    const permitidos = new Set(
      EJERCICIOS.filter((e) => e.equipo === 'mancuernas' || e.equipo === 'peso-corporal').map((e) => e.id),
    );
    expect(rutina.dias.flatMap((dia) => dia.ejercicios).every((e) => permitidos.has(e.id))).toBe(true);
  });

  it('sin equipo marcado usa solo ejercicios de peso corporal', () => {
    const rutina = asignarRutina({ ...base, equipo: [] });
    expect(rutina.dias.flatMap((dia) => dia.ejercicios).every((e) => e.pesoInicialKg === 0)).toBe(true);
  });

  it('no repite ejercicios dentro de un mismo día cuando hay alternativas', () => {
    const rutina = asignarRutina({ ...base, diasPorSemana: 4, equipo: ['maquinas', 'poleas', 'barra', 'mancuernas'] });
    for (const dia of rutina.dias) {
      const ids = dia.ejercicios.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('ajusta series y repeticiones según la experiencia', () => {
    const principiante = asignarRutina({ ...base, experiencia: 'ninguna' }).dias[0].ejercicios[0];
    const avanzado = asignarRutina({ ...base, experiencia: 'mas-6-meses' }).dias[0].ejercicios[0];
    expect([principiante.series, principiante.repeticiones]).toEqual([3, 12]);
    expect([avanzado.series, avanzado.repeticiones]).toEqual([4, 8]);
  });

  it('limita los días al rango de 2 a 6 y registra la fecha', () => {
    const rutina = asignarRutina({ ...base, diasPorSemana: 9 }, new Date('2026-10-09T10:00:00.000Z'));
    expect(rutina.dias).toHaveLength(6);
    expect(rutina.asignadaEn).toBe('2026-10-09T10:00:00.000Z');
  });
});
