import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { IonApp, IonPage, IonRouterOutlet } from '@ionic/react';
import { IonReactMemoryRouter } from '@ionic/react-router';
import { Preferences } from '@capacitor/preferences';
import { createMemoryHistory, type MemoryHistory } from 'history';
import { Route } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProveedorPerfil } from '../context/PerfilContext';
import { rutinaLocal } from '../repositories/local';
import { botonAtras, paginaVisible, pulsarAtras } from '../test/navegacion';
import { asignarRutina } from '../utils/rutina';
import CuestionarioRutina from './CuestionarioRutina';
import RutinaAsignada from './RutinaAsignada';

vi.mock('../context/SesionContext', () => ({
  useSesion: () => ({ sesion: { user: { id: 'usuario-prueba' } } }),
}));

vi.mock('../services/recordatorios', () => ({ sincronizarRecordatorios: vi.fn() }));

const TITULO_RUTINA = '3 días por semana';
const TITULO_CUESTIONARIO = 'Cuéntanos de ti';

function guardarRutina(): Promise<void> {
  return rutinaLocal.guardar(
    'usuario-prueba',
    asignarRutina({ experiencia: 'ninguna', diasPorSemana: 3, equipo: ['maquinas'] }),
  );
}

function renderizar(rutaInicial: string): { historial: MemoryHistory; container: HTMLElement } {
  const historial = createMemoryHistory({ initialEntries: [rutaInicial] });
  const { container } = render(
    <IonApp>
      <ProveedorPerfil>
        <IonReactMemoryRouter history={historial}>
          <IonRouterOutlet>
            <Route exact path="/rutina" component={RutinaAsignada} />
            <Route exact path="/cuestionario-rutina" component={CuestionarioRutina} />
            <Route exact path="/perfil">
              <IonPage>
                <h1>Perfil</h1>
              </IonPage>
            </Route>
          </IonRouterOutlet>
        </IonReactMemoryRouter>
      </ProveedorPerfil>
    </IonApp>,
  );
  return { historial, container };
}

describe('Botón atrás en la rutina y su cuestionario', () => {
  beforeEach(async () => {
    await Preferences.clear();
  });
  afterEach(cleanup);

  describe('flujo inicial, sin rutina guardada', () => {
    it('el cuestionario no muestra el botón atrás ni durante la carga ni después', async () => {
      const { container } = renderizar('/cuestionario-rutina');
      expect(container.querySelector('ion-back-button')).toBeNull();

      const cuestionario = await paginaVisible(TITULO_CUESTIONARIO);
      await within(cuestionario).findByRole('radiogroup', { name: 'Experiencia previa' });

      expect(cuestionario.querySelector('ion-back-button')).toBeNull();
    });
  });

  describe('con rutina guardada', () => {
    beforeEach(guardarRutina);

    it('la rutina no muestra el botón mientras carga y luego vuelve a Perfil', async () => {
      const { container, historial } = renderizar('/rutina');
      expect(screen.getByRole('status', { name: 'Cargando rutina' })).toBeInTheDocument();
      expect(container.querySelector('ion-back-button')).toBeNull();

      const rutina = await paginaVisible(TITULO_RUTINA);
      expect(botonAtras(rutina)).toHaveAttribute('default-href', '/perfil');
      pulsarAtras(rutina);

      expect(await paginaVisible('Perfil')).toBeInTheDocument();
      expect(historial.location.pathname).toBe('/perfil');
    });

    it('el cuestionario no muestra el botón mientras carga y luego vuelve a la rutina', async () => {
      const { container, historial } = renderizar('/cuestionario-rutina');
      expect(screen.getByRole('status', { name: 'Cargando tus respuestas' })).toBeInTheDocument();
      expect(container.querySelector('ion-back-button')).toBeNull();

      const cuestionario = await paginaVisible(TITULO_CUESTIONARIO);
      expect(botonAtras(cuestionario)).toHaveAttribute('default-href', '/rutina');
      pulsarAtras(cuestionario);

      expect(await paginaVisible(TITULO_RUTINA)).toBeInTheDocument();
      expect(historial.location.pathname).toBe('/rutina');
    });

    it('Cambiar mi rutina abre el cuestionario con atrás y regresa a la rutina', async () => {
      const { historial } = renderizar('/rutina');
      const rutina = await paginaVisible(TITULO_RUTINA);

      const cambiar = within(rutina).getByText('Cambiar mi rutina').closest('ion-button');
      if (!cambiar) {
        throw new Error('No se encontró el botón Cambiar mi rutina.');
      }
      fireEvent.click(cambiar);

      const cuestionario = await paginaVisible(TITULO_CUESTIONARIO);
      expect(botonAtras(cuestionario)).toHaveAttribute('default-href', '/rutina');
      pulsarAtras(cuestionario);

      const rutinaDeNuevo = await paginaVisible(TITULO_RUTINA);
      expect(botonAtras(rutinaDeNuevo)).toHaveAttribute('default-href', '/perfil');
      expect(historial.location.pathname).toBe('/rutina');
    });
  });
});
