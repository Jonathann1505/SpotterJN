import { describe, expect, it } from 'vitest';
import type { SerieRegistrada } from '../types/series';
import { contarSesiones, describirExperiencia, describirSesiones, inicialesDe, resumirEquipo } from './perfil';

function serie(registradaEn: string, cambios: Partial<SerieRegistrada> = {}): SerieRegistrada {
  return {
    id: registradaEn,
    registradaEn,
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

describe('inicialesDe', () => {
  it('toma la primera letra del primer y del último nombre, en mayúscula', () => {
    expect(inicialesDe('jonathan escobar')).toBe('JE');
    expect(inicialesDe('  Nayeli   de la Cruz ')).toBe('NC');
  });

  it('con un solo nombre usa una letra y sin nombre devuelve vacío', () => {
    expect(inicialesDe('Ñandú')).toBe('Ñ');
    expect(inicialesDe('   ')).toBe('');
  });
});

describe('contarSesiones', () => {
  it('cuenta una sesión por día de la rutina hecho en cada fecha', () => {
    const series = [
      serie('2026-11-20T18:00:00'),
      serie('2026-11-20T18:05:00', { idEjercicio: 'remo', numeroSerie: 2 }),
      serie('2026-11-22T18:00:00'),
      serie('2026-11-22T19:00:00', { dia: 'Día 2 – Piernas' }),
    ];

    expect(contarSesiones(series)).toBe(3);
  });

  it('no cuenta los días con solo series interrumpidas por molestia', () => {
    expect(contarSesiones([serie('2026-11-20T18:00:00', { estado: 'interrumpida-por-molestia' })])).toBe(0);
  });

  it('sin series devuelve cero', () => {
    expect(contarSesiones([])).toBe(0);
  });
});

describe('textos del resumen del perfil', () => {
  it('describe la experiencia en lenguaje natural', () => {
    expect(describirExperiencia('ninguna')).toBe('Sin experiencia previa');
    expect(describirExperiencia('menos-6-meses')).toBe('Menos de 6 meses de experiencia');
    expect(describirExperiencia('mas-6-meses')).toBe('Más de 6 meses de experiencia');
  });

  it('nombra el equipo si es uno solo y cuenta los tipos si son varios', () => {
    expect(resumirEquipo(['maquinas'])).toBe('Equipo: máquinas guiadas');
    expect(resumirEquipo(['mancuernas', 'barra', 'maquinas', 'poleas'])).toBe('Equipo: 4 tipos');
  });

  it('usa un mensaje propio cuando aún no hay sesiones', () => {
    expect(describirSesiones(0)).toBe('Aún no registras sesiones');
    expect(describirSesiones(1)).toBe('1 sesión registrada');
    expect(describirSesiones(7)).toBe('7 sesiones registradas');
  });
});
