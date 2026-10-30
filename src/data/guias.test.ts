import { describe, expect, it } from 'vitest';
import { EJERCICIOS } from './ejercicios';
import { GUIAS, GUIA_PENDIENTE, obtenerGuia } from './guias';

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

  it('cada ejercicio del catálogo tiene su guía completa', () => {
    for (const ejercicio of EJERCICIOS) {
      const guia = GUIAS[ejercicio.id];
      expect(guia, `falta la guía de ${ejercicio.id}`).toBeDefined();
      expect(guia.grupoMuscular.trim().length).toBeGreaterThan(2);
      for (const texto of [guia.ajusteMaquina, guia.movimiento, guia.ubicacion]) {
        expect(texto.trim().length).toBeGreaterThan(20);
      }
    }
  });

  it('no hay guías de ejercicios que no existen en el catálogo', () => {
    const ids = new Set(EJERCICIOS.map((ejercicio) => ejercicio.id));
    expect(Object.keys(GUIAS).filter((id) => !ids.has(id))).toEqual([]);
  });

  it('las animaciones indicadas existen en la carpeta public', () => {
    const archivos = Object.keys(import.meta.glob('../../public/ejercicios/*.{html,mp4}'));
    for (const [id, guia] of Object.entries(GUIAS)) {
      if (guia.animacion) {
        expect(archivos, `falta la animación de ${id}`).toContain(`../../public/${guia.animacion}`);
      }
    }
  });
});
