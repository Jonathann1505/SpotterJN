import { Weekday } from '@capacitor/local-notifications';
import { describe, expect, it } from 'vitest';
import type { RutinaAsignada } from '../types/perfil';
import { sesionParaFecha } from './semana';

function rutinaDe(dias: number): RutinaAsignada {
  return {
    cuestionario: { experiencia: 'ninguna', diasPorSemana: dias, equipo: ['maquinas'] },
    dias: Array.from({ length: dias }, (_, i) => ({ nombre: `Día ${i + 1} – Cuerpo completo`, ejercicios: [] })),
    asignadaEn: '2026-11-16T10:00:00.000Z',
  };
}

// Noviembre de 2026: 16 lunes, 17 martes, 18 miércoles, 19 jueves, 20 viernes, 21 sábado, 22 domingo.
const fecha = (dia: number) => new Date(2026, 10, dia, 9, 0);

describe('sesionParaFecha', () => {
  it('con 3 días, entrena lunes, miércoles y viernes con las sesiones 1, 2 y 3', () => {
    const rutina = rutinaDe(3);

    expect(sesionParaFecha(rutina, fecha(16))).toMatchObject({ indice: 0, esHoy: true, diaSemana: Weekday.Monday });
    expect(sesionParaFecha(rutina, fecha(18))).toMatchObject({ indice: 1, esHoy: true, diaSemana: Weekday.Wednesday });
    expect(sesionParaFecha(rutina, fecha(20))).toMatchObject({ indice: 2, esHoy: true, diaSemana: Weekday.Friday });
  });

  it('en un día de descanso devuelve la próxima sesión', () => {
    const rutina = rutinaDe(3);

    expect(sesionParaFecha(rutina, fecha(17))).toMatchObject({ indice: 1, esHoy: false, diaSemana: Weekday.Wednesday });
    expect(sesionParaFecha(rutina, fecha(19))).toMatchObject({ indice: 2, esHoy: false, diaSemana: Weekday.Friday });
  });

  it('el fin de semana pasa a la sesión del lunes', () => {
    const rutina = rutinaDe(3);

    expect(sesionParaFecha(rutina, fecha(21))).toMatchObject({ indice: 0, esHoy: false, diaSemana: Weekday.Monday });
    expect(sesionParaFecha(rutina, fecha(22))).toMatchObject({ indice: 0, esHoy: false, diaSemana: Weekday.Monday });
  });

  it('con 2 días entrena lunes y jueves', () => {
    const rutina = rutinaDe(2);

    expect(sesionParaFecha(rutina, fecha(19))).toMatchObject({ indice: 1, esHoy: true, diaSemana: Weekday.Thursday });
    expect(sesionParaFecha(rutina, fecha(17))).toMatchObject({ indice: 1, esHoy: false, diaSemana: Weekday.Thursday });
  });

  it('con 6 días el sábado también se entrena', () => {
    expect(sesionParaFecha(rutinaDe(6), fecha(21))).toMatchObject({ indice: 5, esHoy: true });
  });

  it('devuelve la sesión que corresponde y no la primera de la rutina', () => {
    const rutina = rutinaDe(3);

    expect(sesionParaFecha(rutina, fecha(18))?.dia.nombre).toBe('Día 2 – Cuerpo completo');
  });

  it('devuelve null si la rutina no tiene días', () => {
    expect(sesionParaFecha({ ...rutinaDe(3), dias: [] }, fecha(16))).toBeNull();
  });
});
