import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import BannerSinConexion from './BannerSinConexion';

function definirConexion(conectado: boolean): void {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value: conectado,
  });
}

describe('BannerSinConexion', () => {
  beforeEach(() => definirConexion(true));
  afterEach(() => {
    cleanup();
    definirConexion(true);
  });

  it('aparece sin conexión y desaparece al recuperar la conexión', () => {
    render(<BannerSinConexion />);
    expect(screen.queryByRole('status')).toBeNull();

    act(() => {
      definirConexion(false);
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByRole('status')).toHaveTextContent(
      'Sin conexión, tus datos se guardarán localmente',
    );

    act(() => {
      definirConexion(true);
      window.dispatchEvent(new Event('online'));
    });

    expect(screen.queryByRole('status')).toBeNull();
  });
});
