import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

    expect(container.querySelector('ion-app')).not.toHaveClass('ion-palette-dark');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    });
    expect(screen.queryByText(/cada repetición/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/registra tu progreso y descubre/i)).not.toBeInTheDocument();
    expect(document.querySelector('.login-brand')).not.toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Logo de SpotterJN: una rata levantando pesas' }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('navigation', { name: 'Acceso a la cuenta' }))
        .getByRole('link', { name: 'Iniciar sesión' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(container.querySelectorAll('ion-input')).toHaveLength(2);
    expect(container.querySelector('ion-input[type="email"]')).toHaveAttribute('autocomplete', 'email');
    expect(container.querySelector('ion-input[type="password"]')).toHaveAttribute(
      'autocomplete',
      'current-password',
    );
  });

  it('cambia las vistas con las pestañas y conserva los consentimientos antes del registro', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    });
    fireEvent.click(
      within(screen.getByRole('navigation', { name: 'Acceso a la cuenta' }))
        .getByRole('link', { name: 'Crear cuenta' }),
    );

    expect(await screen.findByRole('heading', { name: 'Antes de crear tu cuenta' })).toBeInTheDocument();
    expect(
      within(screen.getByRole('navigation', { name: 'Acceso a la cuenta' }))
        .getByRole('link', { name: 'Crear cuenta' }),
    ).toHaveAttribute('aria-current', 'page');
    const [mayorEdad, terminos] = document.querySelectorAll('ion-checkbox');
    fireEvent(
      mayorEdad,
      new CustomEvent('ionChange', { bubbles: true, detail: { checked: true } }),
    );
    fireEvent(
      terminos,
      new CustomEvent('ionChange', { bubbles: true, detail: { checked: true } }),
    );
    const continuar = document.querySelector('ion-button.sj-acceso-submit');
    await waitFor(() => {
      expect(continuar).toHaveAttribute('disabled', 'false');
    });
    if (!continuar) {
      throw new Error('No se encontró el botón para continuar al registro.');
    }
    fireEvent.click(continuar);

    expect(await screen.findByRole('heading', { name: 'Crear cuenta' })).toBeInTheDocument();
    expect(
      within(screen.getByRole('navigation', { name: 'Acceso a la cuenta' }))
        .getByRole('link', { name: 'Crear cuenta' }),
    ).toHaveAttribute('aria-current', 'page');
    fireEvent.click(
      within(screen.getByRole('navigation', { name: 'Acceso a la cuenta' }))
        .getByRole('link', { name: 'Iniciar sesión' }),
    );
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(
      within(screen.getByRole('navigation', { name: 'Acceso a la cuenta' }))
        .getByRole('link', { name: 'Iniciar sesión' }),
    ).toHaveAttribute('aria-current', 'page');
  });

  it('redirige /hoy a login cuando no existe sesión', async () => {
    window.history.replaceState({}, '', '/hoy');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    });
  });
  it.each(['/aviso-medico', '/salud', '/cuestionario-rutina', '/rutina', '/perfil', '/sesion'])(
    'redirige %s a login cuando no existe sesión',
    async (ruta) => {
      window.history.replaceState({}, '', ruta);
      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
      });
    },
  );
});
