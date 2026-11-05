import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
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
    vi.restoreAllMocks();
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

  describe('video MP4', () => {
    function configurarMedios() {
      const reproducir = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
      const pausar = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
      return { reproducir, pausar };
    }

    it('reproduce el video silenciado y en bucle, sin iframe', () => {
      simularMenosMovimiento(false);
      const { container, getByRole } = render(<AnimacionEjercicio archivo="ejercicios/flexiones.mp4" titulo="Flexiones" />);
      const video = container.querySelector('video') as HTMLVideoElement;

      expect(video.getAttribute('src')).toBe('/ejercicios/flexiones.mp4');
      expect(video.loop).toBe(true);
      expect(video.muted).toBe(true);
      expect(video.hasAttribute('autoplay')).toBe(true);
      expect(container.querySelector('iframe')).toBeNull();
      expect(getByRole('button', { name: /Animación del ejercicio: Flexiones/ })).toHaveAttribute('aria-pressed', 'false');
    });

    it('se pausa y se reanuda al tocarlo o con el teclado', () => {
      simularMenosMovimiento(false);
      const { reproducir, pausar } = configurarMedios();
      const { container, getByRole } = render(<AnimacionEjercicio archivo="ejercicios/flexiones.mp4" titulo="Flexiones" />);
      const video = container.querySelector('video') as HTMLVideoElement;
      const control = getByRole('button', { name: /Flexiones/ });

      Object.defineProperty(video, 'paused', { value: false, configurable: true });
      fireEvent.click(control);
      expect(pausar).toHaveBeenCalledTimes(1);
      fireEvent.pause(video);
      expect(control).toHaveAttribute('aria-pressed', 'true');

      Object.defineProperty(video, 'paused', { value: true, configurable: true });
      fireEvent.keyDown(control, { key: 'Enter' });
      expect(reproducir).toHaveBeenCalledTimes(1);
      fireEvent.play(video);
      expect(control).toHaveAttribute('aria-pressed', 'false');
    });

    it('no arranca solo si el usuario prefiere menos movimiento', () => {
      simularMenosMovimiento(true);
      const { container, getByRole } = render(<AnimacionEjercicio archivo="ejercicios/flexiones.mp4" titulo="Flexiones" />);
      const video = container.querySelector('video') as HTMLVideoElement;

      expect(video.hasAttribute('autoplay')).toBe(false);
      expect(getByRole('button', { name: /Flexiones/ })).toHaveAttribute('aria-pressed', 'true');
      expect(container.querySelector('.sj-animacion-reproducir')).not.toBeNull();
    });

    it('si el navegador bloquea la reproducción, deja el video pausado', async () => {
      simularMenosMovimiento(false);
      vi.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValue(new Error('bloqueado'));
      const { container, getByRole } = render(<AnimacionEjercicio archivo="ejercicios/flexiones.mp4" titulo="Flexiones" />);
      const video = container.querySelector('video') as HTMLVideoElement;
      Object.defineProperty(video, 'paused', { value: true, configurable: true });

      fireEvent.click(getByRole('button', { name: /Flexiones/ }));

      await waitFor(() => expect(getByRole('button', { name: /Flexiones/ })).toHaveAttribute('aria-pressed', 'true'));
    });
  });
});
