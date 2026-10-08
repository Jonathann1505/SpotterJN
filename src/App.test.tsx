import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

vi.mock('./services/auth', () => ({
  cerrarSesion: vi.fn(),
  escucharSesion: vi.fn(() => () => undefined),
  iniciarSesion: vi.fn(),
  obtenerSesion: vi.fn().mockResolvedValue(null),
  registrar: vi.fn(),
}));

describe('App', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    cleanup();
    window.history.replaceState({}, '', '/');
  });

  it('muestra el acceso cuando no hay sesión', async () => {
    const { container } = render(<App />);

    expect(container.querySelector('ion-app')).toHaveClass('ion-palette-dark');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /cada repetición te acerca más/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument();
    expect(container.querySelectorAll('ion-input')).toHaveLength(2);
    expect(container.querySelector('ion-input[type="email"]')).toHaveAttribute('autocomplete', 'email');
    expect(container.querySelector('ion-input[type="password"]')).toHaveAttribute(
      'autocomplete',
      'current-password',
    );
  });

  it('redirige /hoy a login cuando no existe sesión', async () => {
    window.history.replaceState({}, '', '/hoy');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument();
    });
  });
});
