import { describe, expect, it } from 'vitest';
import { buscarEjercicio } from '../data/ejercicios';
import type { CuestionarioRutina, RutinaAsignada } from '../types/perfil';
import { migrarEjerciciosRetirados, reemplazarEjercicio, sugerirAlternativas } from './alternativas';

function rutinaCon(
  ejercicios: string[][],
  equipo: CuestionarioRutina['equipo'] = ['maquinas', 'mancuernas', 'barra', 'poleas'],
): RutinaAsignada {
  return {
    cuestionario: { experiencia: 'ninguna', diasPorSemana: ejercicios.length, equipo },
    dias: ejercicios.map((ids, indice) => ({
      nombre: `Día ${indice + 1} – Cuerpo completo`,
      ejercicios: ids.map((id) => {
        const base = buscarEjercicio(id);
        if (!base) {
          throw new Error(`Ejercicio de prueba desconocido: ${id}`);
        }
        return { id, nombre: base.nombre, series: 3, repeticiones: 12, pesoInicialKg: base.pesoInicialKg };
      }),
    })),
    asignadaEn: '2026-11-20T10:00:00.000Z',
  };
}

describe('sugerirAlternativas', () => {
  it('ofrece ejercicios del mismo movimiento, primero los de equipo guiado', () => {
    const rutina = rutinaCon([['press-banca', 'remo-maquina', 'prensa-piernas']]);

    const ids = sugerirAlternativas(rutina, 'press-banca', 'no-puedo').map((e) => e.id);

    expect(ids).toEqual(['press-pecho-maquina', 'press-mancuernas', 'flexiones']);
  });

  it('deja para el final los ejercicios de otro grupo muscular', () => {
    const rutina = rutinaCon([['press-banca', 'remo-maquina', 'prensa-piernas']]);

    const ids = sugerirAlternativas(rutina, 'press-banca', 'no-puedo', 10).map((e) => e.id);

    expect(ids[ids.length - 1]).toBe('triceps-polea');
  });

  it('no sugiere el mismo ejercicio ni otros que ya están en ese día', () => {
    const rutina = rutinaCon([['press-banca', 'press-pecho-maquina', 'prensa-piernas']]);

    const ids = sugerirAlternativas(rutina, 'press-banca', 'no-puedo').map((e) => e.id);

    expect(ids).not.toContain('press-banca');
    expect(ids).not.toContain('press-pecho-maquina');
  });

  it('solo usa el equipo declarado, y el peso corporal siempre está disponible', () => {
    const rutina = rutinaCon([['press-mancuernas', 'remo-mancuerna', 'sentadilla-goblet']], ['mancuernas']);

    const ids = sugerirAlternativas(rutina, 'press-mancuernas', 'no-puedo').map((e) => e.id);

    expect(ids).toEqual(['flexiones']);
  });

  it('si falta el equipo, evita el mismo equipo del ejercicio actual', () => {
    const rutina = rutinaCon([['press-pecho-maquina', 'remo-maquina', 'prensa-piernas']]);

    const equipos = sugerirAlternativas(rutina, 'press-pecho-maquina', 'sin-equipo').map((e) => e.equipo);

    expect(equipos.length).toBeGreaterThan(0);
    expect(equipos).not.toContain('maquinas');
  });

  it('respeta el máximo y devuelve una lista vacía para un ejercicio desconocido', () => {
    const rutina = rutinaCon([['press-banca', 'remo-maquina', 'prensa-piernas']]);

    expect(sugerirAlternativas(rutina, 'press-banca', 'no-puedo', 1)).toHaveLength(1);
    expect(sugerirAlternativas(rutina, 'no-existe', 'no-puedo')).toEqual([]);
  });

  it('devuelve una lista vacía cuando no queda ninguna opción', () => {
    const rutina = rutinaCon([['flexiones', 'remo-invertido', 'zancadas']], []);

    expect(sugerirAlternativas(rutina, 'flexiones', 'no-puedo')).toEqual([]);
  });
});

describe('reemplazarEjercicio', () => {
  it('cambia el ejercicio en todos los días donde aparece y conserva series y repeticiones', () => {
    const rutina = rutinaCon([
      ['press-banca', 'remo-maquina'],
      ['prensa-piernas', 'press-banca'],
    ]);
    const nuevo = buscarEjercicio('press-pecho-maquina');
    if (!nuevo) {
      throw new Error('Falta el ejercicio de prueba');
    }

    const cambiada = reemplazarEjercicio(rutina, 'press-banca', nuevo);

    expect(cambiada.dias[0].ejercicios[0]).toEqual({
      id: 'press-pecho-maquina',
      nombre: 'Press de pecho en máquina',
      series: 3,
      repeticiones: 12,
      pesoInicialKg: 15,
    });
    expect(cambiada.dias[1].ejercicios[1].id).toBe('press-pecho-maquina');
    expect(cambiada.dias[0].ejercicios[1].id).toBe('remo-maquina');
  });

  it('no modifica la rutina original', () => {
    const rutina = rutinaCon([['press-banca', 'remo-maquina']]);
    const nuevo = buscarEjercicio('flexiones');
    if (!nuevo) {
      throw new Error('Falta el ejercicio de prueba');
    }

    reemplazarEjercicio(rutina, 'press-banca', nuevo);

    expect(rutina.dias[0].ejercicios[0].id).toBe('press-banca');
  });
});

describe('migrarEjerciciosRetirados', () => {
  const ejercicio = (id: string, nombre: string, pesoInicialKg: number) => ({
    id,
    nombre,
    series: 3,
    repeticiones: 12,
    pesoInicialKg,
  });
  const rutinaAntigua = (equipo: CuestionarioRutina['equipo'], ejercicios: ReturnType<typeof ejercicio>[]): RutinaAsignada => ({
    cuestionario: { experiencia: 'ninguna', diasPorSemana: 2, equipo },
    dias: [{ nombre: 'Día 1 – Cuerpo completo', ejercicios }],
    asignadaEn: '2026-11-13T10:00:00.000Z',
  });
  const remoConBarra = ejercicio('remo-barra', 'Remo con barra', 20);

  it('el remo con barra ya no está en el catálogo', () => {
    expect(buscarEjercicio('remo-barra')).toBeUndefined();
  });

  it('lo sustituye por un tirón de su equipo, primero el más guiado, conservando series y repeticiones', () => {
    const rutina = rutinaAntigua(['barra', 'maquinas'], [ejercicio('press-banca', 'Press de banca', 20), remoConBarra]);

    const migrada = migrarEjerciciosRetirados(rutina);

    expect(migrada.dias[0].ejercicios[1]).toEqual({
      id: 'remo-maquina',
      nombre: 'Remo en máquina',
      series: 3,
      repeticiones: 12,
      pesoInicialKg: 20,
    });
    expect(migrada.dias[0].ejercicios[0].id).toBe('press-banca');
  });

  it('con solo barra usa un ejercicio de peso corporal, que siempre está disponible', () => {
    const migrada = migrarEjerciciosRetirados(rutinaAntigua(['barra'], [remoConBarra]));

    expect(migrada.dias[0].ejercicios[0]).toMatchObject({ id: 'remo-invertido', pesoInicialKg: 0 });
  });

  it('no repite un ejercicio que ya está ese día', () => {
    const migrada = migrarEjerciciosRetirados(
      rutinaAntigua(['barra', 'maquinas'], [ejercicio('remo-maquina', 'Remo en máquina', 20), remoConBarra]),
    );

    const ids = migrada.dias[0].ejercicios.map((e) => e.id);
    expect(ids).not.toContain('remo-barra');
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('deja la rutina igual, sin copiarla, si no hay nada que cambiar', () => {
    const rutina = rutinaAntigua(['maquinas'], [ejercicio('press-pecho-maquina', 'Press de pecho en máquina', 15)]);

    expect(migrarEjerciciosRetirados(rutina)).toBe(rutina);
  });

  it('si no hay ningún sustituto posible, conserva el ejercicio original', () => {
    const rutina = rutinaAntigua(['barra'], [ejercicio('remo-invertido', 'Remo invertido', 0), remoConBarra]);

    expect(migrarEjerciciosRetirados(rutina)).toBe(rutina);
  });
});
