import { describe, expect, it } from 'vitest';
import { GLOSARIO, buscarTermino, filtrarGlosario } from './glosario';

describe('glosario', () => {
  it('incluye los términos básicos de serie, repetición y fallo', () => {
    const ids = GLOSARIO.map((termino) => termino.id);
    expect(ids).toEqual(expect.arrayContaining(['serie', 'repeticion', 'fallo']));
  });

  it('explica calentamiento, descanso, técnica, progresión y peso corporal', () => {
    const ids = GLOSARIO.map((termino) => termino.id);
    expect(ids).toEqual(
      expect.arrayContaining(['calentamiento', 'descanso', 'tecnica', 'progresion', 'peso-corporal']),
    );
  });

  it('no repite identificadores y todas las definiciones tienen contenido', () => {
    const ids = GLOSARIO.map((termino) => termino.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(GLOSARIO.every((t) => t.termino.trim() !== '' && t.definicion.trim().length > 20)).toBe(true);
  });

  it('busca un término por su identificador', () => {
    expect(buscarTermino('rir')?.termino).toBe('RIR');
    expect(buscarTermino('no-existe')).toBeUndefined();
  });

  it('filtra por término o definición sin distinguir tildes ni mayúsculas', () => {
    expect(filtrarGlosario('repeticion').map((t) => t.id)).toContain('repeticion');
    expect(filtrarGlosario('TECNICA').map((t) => t.id)).toContain('tecnica');
    expect(filtrarGlosario('articulaciones').map((t) => t.id)).toEqual(
      expect.arrayContaining(['calentamiento', 'tecnica']),
    );
  });

  it('devuelve todo con una consulta vacía y nada si no hay coincidencias', () => {
    expect(filtrarGlosario('   ')).toEqual(GLOSARIO);
    expect(filtrarGlosario('zzzz')).toEqual([]);
  });
});
