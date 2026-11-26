import { describe, expect, it } from 'vitest';
import {
  CALENTAMIENTO,
  CALENTAMIENTOS,
  DESCRIPCION_FOCO,
  ETIQUETAS_FOCO,
  FOCOS_CALENTAMIENTO,
} from '../data/calentamiento';
import { focoDeSesion } from './calentamiento';

describe('calentamientos por sesión', () => {
  it('cada tipo de sesión tiene su calentamiento, su etiqueta y su descripción', () => {
    for (const foco of FOCOS_CALENTAMIENTO) {
      expect(CALENTAMIENTOS[foco].length, foco).toBeGreaterThanOrEqual(5);
      expect(ETIQUETAS_FOCO[foco].trim(), foco).not.toBe('');
      expect(DESCRIPCION_FOCO[foco].trim(), foco).not.toBe('');
    }
  });

  it('todos empiezan por la marcha y no repiten pasos dentro de un mismo calentamiento', () => {
    for (const foco of FOCOS_CALENTAMIENTO) {
      const ids = CALENTAMIENTOS[foco].map((paso) => paso.id);
      expect(ids[0], foco).toBe('marcha');
      expect(new Set(ids).size, foco).toBe(ids.length);
    }
  });

  it('cada paso tiene nombre, dosis y consejo con contenido', () => {
    for (const foco of FOCOS_CALENTAMIENTO) {
      for (const paso of CALENTAMIENTOS[foco]) {
        expect(paso.nombre.trim().length, paso.id).toBeGreaterThan(5);
        expect(paso.dosis.trim().length, paso.id).toBeGreaterThan(3);
        expect(paso.consejo.trim().length, paso.id).toBeGreaterThan(15);
      }
    }
  });

  it('los calentamientos se distinguen entre sí', () => {
    const firmas = FOCOS_CALENTAMIENTO.map((foco) => CALENTAMIENTOS[foco].map((p) => p.id).join(','));
    expect(new Set(firmas).size).toBe(FOCOS_CALENTAMIENTO.length);
  });

  it('el calentamiento general es el de cuerpo completo', () => {
    expect(CALENTAMIENTO).toBe(CALENTAMIENTOS.completo);
  });
});

describe('focoDeSesion', () => {
  it('reconoce el tipo de cada día de la rutina', () => {
    expect(focoDeSesion('Día 1 – Cuerpo completo')).toBe('completo');
    expect(focoDeSesion('Día 2 – Tren superior')).toBe('superior');
    expect(focoDeSesion('Día 3 – Tren inferior')).toBe('inferior');
    expect(focoDeSesion('Día 4 – Empuje')).toBe('empuje');
    expect(focoDeSesion('Día 5 – Tirón')).toBe('tiron');
  });

  it('no depende de tildes ni de mayúsculas', () => {
    expect(focoDeSesion('Día 5 – TIRON')).toBe('tiron');
    expect(focoDeSesion('Día 2 – tren SUPERIOR')).toBe('superior');
  });

  it('usa cuerpo completo si el tipo no se reconoce', () => {
    expect(focoDeSesion('Día 1 – Algo nuevo')).toBe('completo');
    expect(focoDeSesion('')).toBe('completo');
  });
});
