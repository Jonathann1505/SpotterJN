import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnimacionEjercicio } from './AnimacionEjercicio';

function simularMenosMovimiento(activo: boolean): void {
  vi.stubGlobal('matchMedia', (consulta: string) => ({
    matches: activo && consulta.includes('prefers-reduced-motion'),
    media: consulta,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}

describe('AnimacionEjercicio', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('incrusta la animación en un iframe aislado y accesible', () => {
    simularMenosMovimiento(false);
    const { getByTitle } = render(<AnimacionEjercicio archivo="ejercicios/press-banca.html" titulo="Press de banca" />);
    const marco = getByTitle('Animación del ejercicio: Press de banca');

    expect(marco.getAttribute('src')).toBe('/ejercicios/press-banca.html');
    expect(marco.getAttribute('sandbox')).toBe('allow-scripts');
  });

  it('no inicia la animación si el usuario prefiere menos movimiento', () => {
    simularMenosMovimiento(true);
    const { getByTitle } = render(<AnimacionEjercicio archivo="ejercicios/press-banca.html" titulo="Press de banca" />);

    expect(getByTitle(/Press de banca/).getAttribute('src')).toBe('/ejercicios/press-banca.html?autoplay=0');
  });
});
