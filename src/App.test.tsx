import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Preferences } from '@capacitor/preferences';
import type { Session } from '@supabase/supabase-js';
import App from './App';
import { escucharSesion, iniciarSesion, registrar } from './services/auth';
import { botonAtras } from './test/navegacion';

vi.mock('./services/auth', () => ({
  cerrarSesion: vi.fn(),
  escucharSesion: vi.fn(() => () => undefined),
  iniciarSesion: vi.fn(),
  obtenerSesion: vi.fn().mockResolvedValue(null),
  registrar: vi.fn(),
}));

/**
 * Ionic conserva las páginas anteriores ocultas en la pila de navegación.
 * Devuelve la única página visible que contiene el encabezado indicado.
 */
async function paginaActiva(titulo: string): Promise<HTMLElement> {
  return waitFor(() => {
    const visibles = screen
      .getAllByRole('heading', { name: titulo })
      .map((encabezado) => encabezado.closest('.ion-page'))
      .filter(
        (pagina): pagina is HTMLElement =>
          pagina instanceof HTMLElement && !pagina.classList.contains('ion-page-hidden'),
      );
    expect(visibles).toHaveLength(1);
    return visibles[0];
  });
}

function pestanas(pagina: HTMLElement) {
  return within(within(pagina).getByRole('navigation', { name: 'Acceso a la cuenta' }));
}

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

    const login = await paginaActiva('Iniciar sesión');
    fireEvent.click(pestanas(login).getByRole('link', { name: 'Crear cuenta' }));

    const consentimientos = await paginaActiva('Antes de crear tu cuenta');
    expect(pestanas(consentimientos).getByRole('link', { name: 'Crear cuenta' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    const [mayorEdad, terminos] = consentimientos.querySelectorAll('ion-checkbox');
    fireEvent(
      mayorEdad,
      new CustomEvent('ionChange', { bubbles: true, detail: { checked: true } }),
    );
    fireEvent(
      terminos,
      new CustomEvent('ionChange', { bubbles: true, detail: { checked: true } }),
    );
    const continuar = consentimientos.querySelector('ion-button.sj-acceso-submit');
    await waitFor(() => {
      expect(continuar).toHaveAttribute('disabled', 'false');
    });
    if (!continuar) {
      throw new Error('No se encontró el botón para continuar al registro.');
    }
    fireEvent.click(continuar);

    const registro = await paginaActiva('Crear cuenta');
    expect(pestanas(registro).getByRole('link', { name: 'Crear cuenta' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    fireEvent.click(pestanas(registro).getByRole('link', { name: 'Iniciar sesión' }));

    const loginDeNuevo = await paginaActiva('Iniciar sesión');
    expect(pestanas(loginDeNuevo).getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('redirige /hoy a login cuando no existe sesión', async () => {
    window.history.replaceState({}, '', '/hoy');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    });
  });
  it.each([
    '/aviso-medico',
    '/salud',
    '/cuestionario-rutina',
    '/rutina',
    '/perfil',
    '/sesion',
    '/ejercicio/press-banca',
    '/glosario',
    '/ajustes',
  ])(
    'redirige %s a login cuando no existe sesión',
    async (ruta) => {
      window.history.replaceState({}, '', ruta);
      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
      });
    },
  );

  it.each(['/terminos', '/privacidad'])('%s vuelve a Consentimientos con el botón atrás', async (ruta) => {
    window.history.replaceState({}, '', ruta);
    const { container } = render(<App />);

    await waitFor(() => {
      expect(botonAtras(container)).toHaveAttribute('default-href', '/consentimientos');
    });
  });

  it('las pantallas de acceso raíz no tienen botón atrás', async () => {
    render(<App />);

    const login = await paginaActiva('Iniciar sesión');
    expect(login.querySelector('ion-back-button')).toBeNull();
    fireEvent.click(pestanas(login).getByRole('link', { name: 'Crear cuenta' }));

    const consentimientos = await paginaActiva('Antes de crear tu cuenta');
    expect(consentimientos.querySelector('ion-back-button')).toBeNull();
  });

  it('recuperar contraseña vuelve al inicio de sesión con el botón atrás', async () => {
    window.history.replaceState({}, '', '/recuperar-contrasena');
    render(<App />);

    const recuperar = await paginaActiva('Olvidé mi contraseña');
    expect(botonAtras(recuperar)).toHaveAttribute('default-href', '/login');
  });

  it('al crear la cuenta llega al aviso médico sin pasar por Hoy', async () => {
    await Preferences.clear();
    // Como Supabase en el celular: avisa la sesión nueva antes de que termine el registro.
    let avisarSesion: (sesion: Session | null) => void = () => undefined;
    vi.mocked(escucharSesion).mockImplementation((alCambiar) => {
      avisarSesion = alCambiar;
      return () => undefined;
    });
    vi.mocked(registrar).mockImplementation(async () => {
      avisarSesion({ user: { id: 'cuenta-nueva' } } as unknown as Session);
      return { ok: true, sesionIniciada: true };
    });
    const rutas: string[] = [];
    const cambiar = window.history.replaceState.bind(window.history);
    const empujar = window.history.pushState.bind(window.history);
    const espiaReemplazo = vi.spyOn(window.history, 'replaceState').mockImplementation((estado, titulo, url) => {
      rutas.push(String(url));
      cambiar(estado, titulo, url);
    });
    const espiaEmpuje = vi.spyOn(window.history, 'pushState').mockImplementation((estado, titulo, url) => {
      rutas.push(String(url));
      empujar(estado, titulo, url);
    });

    try {
      render(<App />);
      const login = await paginaActiva('Iniciar sesión');
      fireEvent.click(pestanas(login).getByRole('link', { name: 'Crear cuenta' }));
      const consentimientos = await paginaActiva('Antes de crear tu cuenta');
      const [mayorEdad, terminos] = consentimientos.querySelectorAll('ion-checkbox');
      fireEvent(mayorEdad, new CustomEvent('ionChange', { bubbles: true, detail: { checked: true } }));
      fireEvent(terminos, new CustomEvent('ionChange', { bubbles: true, detail: { checked: true } }));
      const continuar = consentimientos.querySelector('ion-button.sj-acceso-submit') as HTMLElement;
      await waitFor(() => expect(continuar).toHaveAttribute('disabled', 'false'));
      fireEvent.click(continuar);

      const registro = await paginaActiva('Crear cuenta');
      const [correo, contrasena] = registro.querySelectorAll('ion-input');
      fireEvent(correo, new CustomEvent('ionInput', { bubbles: true, detail: { value: 'nueva@dominio.com' } }));
      fireEvent(contrasena, new CustomEvent('ionInput', { bubbles: true, detail: { value: 'valida123' } }));
      fireEvent.submit(registro.querySelector('form') as HTMLFormElement);

      const aviso = await paginaActiva('Aviso médico');
      // Ionic marca la página como invisible solo durante la transición; debe quedar visible y quedarse ahí.
      await waitFor(() => expect(aviso).not.toHaveClass('ion-page-invisible'), { timeout: 3000 });
      await new Promise((resolver) => setTimeout(resolver, 800));
      expect(aviso).not.toHaveClass('ion-page-invisible');
      expect(aviso).not.toHaveClass('ion-page-hidden');
      expect(window.location.pathname).toBe('/aviso-medico');
      // Una sola navegación tras el registro. Antes eran /hoy tres veces y luego /aviso-medico: en el celular
      // esas transiciones cruzadas dejaban la pantalla en azul.
      expect(rutas.slice(rutas.lastIndexOf('/registro') + 1)).toEqual(['/aviso-medico']);
    } finally {
      espiaReemplazo.mockRestore();
      espiaEmpuje.mockRestore();
      vi.mocked(escucharSesion).mockImplementation(() => () => undefined);
      vi.mocked(registrar).mockReset();
    }
  });

  it('al iniciar sesión con una cuenta sin datos en el dispositivo llega al aviso médico visible', async () => {
    await Preferences.clear();
    let avisarSesion: (sesion: Session | null) => void = () => undefined;
    vi.mocked(escucharSesion).mockImplementation((alCambiar) => {
      avisarSesion = alCambiar;
      return () => undefined;
    });
    vi.mocked(iniciarSesion).mockImplementation(async () => {
      avisarSesion({ user: { id: 'cuenta-sin-datos' } } as unknown as Session);
      return { ok: true };
    });

    try {
      render(<App />);
      const login = await paginaActiva('Iniciar sesión');
      const [correo, contrasena] = login.querySelectorAll('ion-input');
      fireEvent(correo, new CustomEvent('ionInput', { bubbles: true, detail: { value: 'persona@dominio.com' } }));
      fireEvent(contrasena, new CustomEvent('ionInput', { bubbles: true, detail: { value: 'valida123' } }));
      fireEvent.submit(login.querySelector('form') as HTMLFormElement);

      const aviso = await paginaActiva('Aviso médico');
      // Ionic marca la página como invisible solo durante la transición; debe quedar visible y quedarse ahí.
      await waitFor(() => expect(aviso).not.toHaveClass('ion-page-invisible'), { timeout: 3000 });
      await new Promise((resolver) => setTimeout(resolver, 800));
      expect(aviso).not.toHaveClass('ion-page-invisible');
      expect(aviso).not.toHaveClass('ion-page-hidden');
      expect(window.location.pathname).toBe('/aviso-medico');
    } finally {
      vi.mocked(escucharSesion).mockImplementation(() => () => undefined);
      vi.mocked(iniciarSesion).mockReset();
    }
  });
});
