import { describe, expect, it } from 'vitest';
import { GUIA_PENDIENTE, obtenerGuia } from './guias';

describe('obtenerGuia', () => {
  it('devuelve la guía del press de banca con su animación', () => {
    const guia = obtenerGuia('press-banca');
    expect(guia.grupoMuscular).toBe('Pecho');
    expect(guia.animacion).toBe('ejercicios/press-banca.html');
  });

  it('usa una guía provisional para ejercicios sin contenido', () => {
    expect(obtenerGuia('no-existe')).toBe(GUIA_PENDIENTE);
    expect(GUIA_PENDIENTE.animacion).toBeUndefined();
  });
});
