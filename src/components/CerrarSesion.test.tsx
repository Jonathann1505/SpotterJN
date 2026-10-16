import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route } from 'react-router-dom';
import type { ResultadoAuth } from '../services/auth';
import CerrarSesion from './CerrarSesion';

const mocks = vi.hoisted(() => ({
  cerrarSesion: vi.fn<() => Promise<ResultadoAuth>>(),
  mostrarToast: vi.fn(),
}));

vi.mock('../services/auth', () => ({ cerrarSesion: mocks.cerrarSesion }));

vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();

  interface BotonAlerta {
    text: string;
    handler?: () => boolean | void;
  }

  return {
    ...actual,
    IonAlert: ({
      isOpen,
      header,
      message,
      buttons,
    }: {
      isOpen: boolean;
      header: string;
      message: string;
      buttons: BotonAlerta[];
    }) =>
      isOpen ? (
        <div role="alertdialog" aria-label={header}>
          <p>{message}</p>
          {buttons.map((boton) => (
            <button key={boton.text} type="button" onClick={() => boton.handler?.()}>
              {boton.text}
            </button>
          ))}
        </div>
      ) : null,
    IonLoading: ({ isOpen, message }: { isOpen: boolean; message: string }) =>
      isOpen ? <p role="status">{message}</p> : null,
    useIonToast: () => [mocks.mostrarToast],
  };
});

function renderizar() {
  return render(
    <IonApp>
      <MemoryRouter initialEntries={['/hoy']}>
        <Route exact path="/hoy">
          <h1>Pantalla privada</h1>
          <CerrarSesion />
        </Route>
        <Route exact path="/login">
          <h1>Inicio de sesión</h1>
        </Route>
      </MemoryRouter>
    </IonApp>,
  );
}

function abrirConfirmacion(contenedor: HTMLElement): void {
  const boton = contenedor.querySelector('ion-button');
  if (!boton) {
    throw new Error('No se encontró el botón Cerrar sesión.');
  }
  fireEvent.click(boton);
}

describe('CerrarSesion', () => {
  beforeEach(() => {
    mocks.cerrarSesion.mockReset();
    mocks.mostrarToast.mockReset();
  });

  afterEach(cleanup);

  it('abre el modal de confirmación', () => {
    const { container } = renderizar();
    abrirConfirmacion(container);

    expect(screen.getByRole('alertdialog', { name: 'Cerrar sesión' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('cancelar cierra el modal sin llamar al servicio', () => {
    const { container } = renderizar();
    abrirConfirmacion(container);

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(mocks.cerrarSesion).not.toHaveBeenCalled();
  });

  it('confirma una sola vez y reemplaza la ruta con el inicio de sesión', async () => {
    mocks.cerrarSesion.mockResolvedValue({ ok: true });
    const { container } = renderizar();
    abrirConfirmacion(container);

    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cerrar sesión' }));

    expect(await screen.findByRole('heading', { name: 'Inicio de sesión' })).toBeInTheDocument();
    expect(mocks.cerrarSesion).toHaveBeenCalledTimes(1);
  });

  it('muestra el error y permanece en la pantalla si el servicio falla', async () => {
    mocks.cerrarSesion.mockResolvedValue({
      ok: false,
      mensaje: 'No se pudo cerrar sesión. Inténtalo de nuevo.',
    });
    const { container } = renderizar();
    abrirConfirmacion(container);

    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cerrar sesión' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cerrar sesión.');
    expect(screen.getByRole('heading', { name: 'Pantalla privada' })).toBeInTheDocument();
    expect(mocks.mostrarToast).toHaveBeenCalledOnce();
  });

  it('impide confirmar dos veces mientras la operación está pendiente', async () => {
    let resolver: ((resultado: ResultadoAuth) => void) | undefined;
    mocks.cerrarSesion.mockImplementation(
      () =>
        new Promise<ResultadoAuth>((resolve) => {
          resolver = resolve;
        }),
    );
    const { container } = renderizar();
    abrirConfirmacion(container);
    const confirmar = within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cerrar sesión' });

    fireEvent.click(confirmar);
    fireEvent.click(confirmar);

    expect(mocks.cerrarSesion).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent('Cerrando sesión');
    resolver?.({ ok: true });
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Inicio de sesión' })).toBeInTheDocument());
  });
});
