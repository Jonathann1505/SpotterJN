import { describe, expect, it } from 'vitest';
import { GLOSARIO, buscarTermino } from './glosario';

describe('glosario', () => {
  it('incluye los términos básicos de serie, repetición y fallo', () => {
    const ids = GLOSARIO.map((termino) => termino.id);
    expect(ids).toEqual(expect.arrayContaining(['serie', 'repeticion', 'fallo']));
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
});
