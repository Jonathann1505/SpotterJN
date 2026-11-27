import { act, cleanup, render, screen } from '@testing-library/react';
import { IonApp, IonPage, IonRouterOutlet } from '@ionic/react';
import { IonReactMemoryRouter } from '@ionic/react-router';
import { createMemoryHistory, type MemoryHistory } from 'history';
import { Route } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ManejadorBotonAtras, { PRIORIDAD_BOTON_ATRAS } from './ManejadorBotonAtras';

const servicio = vi.hoisted(() => ({
  activarBotonAtras: vi.fn(() => () => undefined),
  salirDeLaApp: vi.fn(async () => undefined),
}));

vi.mock('../services/botonAtras', () => servicio);

function pagina(titulo: string) {
  return (
    <IonPage>
      <h1>{titulo}</h1>
    </IonPage>
  );
}

function renderizar(entradas: string[]): MemoryHistory {
  const historial = createMemoryHistory({ initialEntries: entradas, initialIndex: entradas.length - 1 });
  render(
    <IonApp>
      <IonReactMemoryRouter history={historial}>
        <ManejadorBotonAtras />
        <IonRouterOutlet>
          <Route exact path="/hoy">{pagina('Hoy')}</Route>
          <Route exact path="/perfil">{pagina('Perfil')}</Route>
          <Route exact path="/progreso">{pagina('Progreso')}</Route>
          <Route exact path="/salud">{pagina('Salud')}</Route>
        </IonRouterOutlet>
      </IonReactMemoryRouter>
    </IonApp>,
  );
  return historial;
}

/** Simula el evento de Ionic y ejecuta el manejador de mayor prioridad, como hace Ionic. */
function pulsarAtrasFisico(): { prioridades: number[]; siguiente: ReturnType<typeof vi.fn> } {
  const registros: { prioridad: number; manejador: (siguiente: () => void) => void }[] = [];
  const evento = new CustomEvent('ionBackButton', {
    detail: {
      register: (prioridad: number, manejador: (siguiente: () => void) => void) => {
        registros.push({ prioridad, manejador });
      },
    },
  });
  act(() => {
    document.dispatchEvent(evento);
  });
  const siguiente = vi.fn();
  const mayor = [...registros].sort((a, b) => b.prioridad - a.prioridad)[0];
  act(() => {
    mayor?.manejador(siguiente);
  });
  return { prioridades: registros.map((r) => r.prioridad), siguiente };
}

describe('ManejadorBotonAtras', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    document.querySelectorAll('.sj-dialogo-fondo').forEach((nodo) => nodo.remove());
  });

  it('activa la escucha del botón físico y se registra por encima del router de Ionic', async () => {
    renderizar(['/hoy']);
    await screen.findByRole('heading', { name: 'Hoy' });

    expect(servicio.activarBotonAtras).toHaveBeenCalled();
    const { prioridades } = pulsarAtrasFisico();
    expect(prioridades).toContain(PRIORIDAD_BOTON_ATRAS);
    expect(Math.max(...prioridades)).toBe(PRIORIDAD_BOTON_ATRAS);
  });

  it('en Hoy cierra la app', async () => {
    renderizar(['/hoy']);
    await screen.findByRole('heading', { name: 'Hoy' });

    pulsarAtrasFisico();

    expect(servicio.salirDeLaApp).toHaveBeenCalled();
  });

  it('en una pantalla secundaria sin historial va a su pantalla padre y no se sale', async () => {
    const historial = renderizar(['/progreso']);
    await screen.findByRole('heading', { name: 'Progreso' });

    const { siguiente } = pulsarAtrasFisico();

    await vi.waitFor(() => expect(historial.location.pathname).toBe('/perfil'));
    expect(servicio.salirDeLaApp).not.toHaveBeenCalled();
    expect(siguiente).not.toHaveBeenCalled();
  });

  it('con historial vuelve a la pantalla anterior', async () => {
    const historial = renderizar(['/hoy']);
    await screen.findByRole('heading', { name: 'Hoy' });
    act(() => {
      historial.push('/perfil');
    });
    await screen.findByRole('heading', { name: 'Perfil', hidden: true });
    act(() => {
      historial.push('/progreso');
    });
    await screen.findByRole('heading', { name: 'Progreso', hidden: true });

    pulsarAtrasFisico();

    await vi.waitFor(() => expect(historial.location.pathname).toBe('/perfil'));
    expect(servicio.salirDeLaApp).not.toHaveBeenCalled();
  });

  it('en un paso obligatorio del flujo inicial no hace nada', async () => {
    const historial = renderizar(['/salud']);
    await screen.findByRole('heading', { name: 'Salud' });

    pulsarAtrasFisico();

    expect(historial.location.pathname).toBe('/salud');
    expect(servicio.salirDeLaApp).not.toHaveBeenCalled();
  });

  it('con un diálogo propio abierto lo cierra con Escape y no navega', async () => {
    const historial = renderizar(['/progreso']);
    await screen.findByRole('heading', { name: 'Progreso' });
    const fondo = document.createElement('div');
    fondo.className = 'sj-dialogo-fondo';
    document.body.appendChild(fondo);
    const alPulsarTecla = vi.fn();
    document.addEventListener('keydown', alPulsarTecla);

    pulsarAtrasFisico();

    expect(alPulsarTecla).toHaveBeenCalledWith(expect.objectContaining({ key: 'Escape' }));
    expect(historial.location.pathname).toBe('/progreso');
    document.removeEventListener('keydown', alPulsarTecla);
  });

  it('con una alerta de Ionic abierta no navega por debajo de ella', async () => {
    const historial = renderizar(['/progreso']);
    await screen.findByRole('heading', { name: 'Progreso' });
    const alerta = document.createElement('ion-alert');
    document.body.appendChild(alerta);

    pulsarAtrasFisico();

    expect(historial.location.pathname).toBe('/progreso');
    alerta.remove();
  });
});
