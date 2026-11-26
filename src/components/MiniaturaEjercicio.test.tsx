import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MiniaturaEjercicio } from './MiniaturaEjercicio';

function simularMenosMovimiento(activo: boolean): void {
  vi.stubGlobal('matchMedia', (consulta: string) => ({
    matches: activo && consulta.includes('prefers-reduced-motion'),
    media: consulta,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}

describe('MiniaturaEjercicio', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('muestra el video de flexiones en bucle, sin sonido y oculto para lectores de pantalla', () => {
    simularMenosMovimiento(false);
    const { container } = render(<MiniaturaEjercicio idEjercicio="flexiones" nombre="Flexiones" />);
    const video = container.querySelector('video');

    expect(video?.getAttribute('src')).toContain('ejercicios/flexiones.mp4');
    expect(video?.loop).toBe(true);
    expect(video?.autoplay).toBe(true);
    expect(container.querySelector('.sj-miniatura')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('no arranca solo y muestra un cuadro fijo si se piden menos movimientos', () => {
    simularMenosMovimiento(true);
    const { container } = render(<MiniaturaEjercicio idEjercicio="flexiones" nombre="Flexiones" />);
    const video = container.querySelector('video');

    expect(video?.autoplay).toBe(false);
    expect(video?.getAttribute('src')).toContain('#t=0.1');
  });

  it('muestra una imagen fija cuando la animación no es un video pero la guía tiene miniatura', () => {
    simularMenosMovimiento(false);
    const { container } = render(<MiniaturaEjercicio idEjercicio="press-banca" nombre="Press de banca" />);

    expect(container.querySelector('video')).toBeNull();
    expect(container.querySelector('.sj-miniatura-vacia')).toBeNull();
    const imagen = container.querySelector('img');
    expect(imagen?.getAttribute('src')).toContain('ejercicios/press-banca-miniatura.webp');
    expect(imagen?.getAttribute('alt')).toBe('');
    expect(container.querySelector('.sj-miniatura')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('usa un recuadro con la inicial cuando no hay video ni imagen', () => {
    simularMenosMovimiento(false);
    const { container } = render(<MiniaturaEjercicio idEjercicio="ejercicio-nuevo" nombre="Press militar" />);

    expect(container.querySelector('video')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.sj-miniatura-vacia')?.textContent).toBe('P');
  });
});
