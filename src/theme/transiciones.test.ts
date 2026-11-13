import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DURACION_AVANCE_MS,
  DURACION_REGRESO_MS,
  EASING_ENTRADA,
  EASING_SALIDA,
  transicionPaginaSJ,
} from './transiciones';

function crearPagina(): HTMLElement {
  const pagina = document.createElement('div');
  pagina.className = 'ion-page ion-page-invisible';
  return pagina;
}

function simularMenosMovimiento(activo: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((consulta: string) => ({ matches: activo && consulta.includes('reduce'), media: consulta })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('transicionPaginaSJ', () => {
  it('anima la entrada con duración y curva de desaceleración entre 150 y 300 ms', () => {
    simularMenosMovimiento(false);
    const entrada = crearPagina();
    const animacion = transicionPaginaSJ(document.body, { enteringEl: entrada, direction: 'forward' });

    expect(animacion.getDuration()).toBe(DURACION_AVANCE_MS);
    expect(DURACION_AVANCE_MS).toBeGreaterThanOrEqual(150);
    expect(DURACION_AVANCE_MS).toBeLessThanOrEqual(300);
    expect(animacion.getEasing()).toBe(EASING_ENTRADA);
    expect(animacion.elements).toEqual([entrada]);
  });

  it('al regresar usa una salida más corta y anima también la página que se va', () => {
    simularMenosMovimiento(false);
    const entrada = crearPagina();
    const salida = crearPagina();
    const animacion = transicionPaginaSJ(document.body, {
      enteringEl: entrada,
      leavingEl: salida,
      direction: 'back',
    });

    expect(animacion.getDuration()).toBe(DURACION_REGRESO_MS);
    expect(DURACION_REGRESO_MS).toBeGreaterThanOrEqual(150);
    expect(animacion.getEasing()).toBe(EASING_SALIDA);
    expect(animacion.childAnimations).toHaveLength(1);
    expect(animacion.childAnimations[0].elements).toEqual([salida]);
  });

  it('elimina el movimiento cuando el sistema pide reducirlo', () => {
    simularMenosMovimiento(true);
    const animacion = transicionPaginaSJ(document.body, { enteringEl: crearPagina(), direction: 'forward' });

    // Ionic convierte 0 en 1 ms cuando no hay Web Animations (como en jsdom); en ambos casos no hay movimiento visible.
    expect(animacion.getDuration()).toBeLessThanOrEqual(1);
  });
});
