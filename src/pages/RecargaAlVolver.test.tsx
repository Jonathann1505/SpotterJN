import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IonApp, IonPage, IonRouterOutlet } from '@ionic/react';
import { IonReactMemoryRouter } from '@ionic/react-router';
import { Preferences } from '@capacitor/preferences';
import { createMemoryHistory, type MemoryHistory } from 'history';
import { Route, useHistory } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProveedorPerfil } from '../context/PerfilContext';
import { rutinaLocal, saludLocal, seriesLocal } from '../repositories/local';
import { asignarRutina } from '../utils/rutina';
import { sesionParaFecha } from '../utils/semana';
import Hoy from './Hoy';
import RutinaAsignada from './RutinaAsignada';

vi.mock('../services/auth', () => ({ cerrarSesion: vi.fn() }));

vi.mock('../context/SesionContext', () => ({
  useSesion: () => ({ sesion: { user: { id: 'usuario-prueba' } } }),
}));

const USUARIO = 'usuario-prueba';
const salud = { condiciones: [], respondidoEn: '2026-10-09T10:00:00.000Z' };
const rutina = asignarRutina({ experiencia: 'ninguna', diasPorSemana: 3, equipo: ['maquinas'] });

/**
 * Pantalla intermedia que cambia los datos guardados y vuelve con history.replace, como hacen
 * «Volver a Hoy» al terminar la sesión o «Ver mi rutina» al cambiar la rutina.
 */
function CambiarDatosYVolver({ cambiar, destino }: { cambiar: () => Promise<void>; destino: string }) {
  const history = useHistory();
  return (
    <IonPage>
      <button
        type="button"
        onClick={() => {
          void cambiar().then(() => history.replace(destino));
        }}
      >
        Guardar y volver
      </button>
    </IonPage>
  );
}

function renderizar(inicial: string, cambiar: () => Promise<void>): MemoryHistory {
  const historial = createMemoryHistory({ initialEntries: [inicial] });
  render(
    <IonApp>
      <ProveedorPerfil>
        <IonReactMemoryRouter history={historial}>
          <IonRouterOutlet>
            <Route exact path="/hoy" component={Hoy} />
            <Route exact path="/rutina" component={RutinaAsignada} />
            <Route exact path="/otra">
              <CambiarDatosYVolver cambiar={cambiar} destino={inicial} />
            </Route>
          </IonRouterOutlet>
        </IonReactMemoryRouter>
      </ProveedorPerfil>
    </IonApp>,
  );
  return historial;
}

async function irYVolver(historial: MemoryHistory, destino: string): Promise<void> {
  act(() => {
    historial.push('/otra');
  });
  fireEvent.click(await screen.findByText('Guardar y volver'));
  await vi.waitFor(() => expect(historial.location.pathname).toBe(destino));
}

describe('las pantallas recargan sus datos al volver a mostrarse', () => {
  beforeEach(async () => {
    await Preferences.clear();
    await saludLocal.guardar(USUARIO, salud);
    await rutinaLocal.guardar(USUARIO, rutina);
  });

  afterEach(cleanup);

  it('Hoy muestra el peso recomendado nuevo al volver de terminar una sesión', async () => {
    const sesionDeHoy = sesionParaFecha(rutina, new Date());
    if (!sesionDeHoy) {
      throw new Error('La rutina de prueba no tiene sesiones.');
    }
    const ejercicio = sesionDeHoy.dia.ejercicios.find((e) => e.pesoInicialKg > 0);
    if (!ejercicio) {
      throw new Error('La sesión de prueba no tiene ejercicios con peso.');
    }
    const ajustar = (peso: number): RegExp => new RegExp(`^Ajustar peso de ${ejercicio.nombre}: ${peso.toLocaleString('es')} kg$`);

    const historial = renderizar('/hoy', async () => {
      for (let numero = 1; numero <= ejercicio.series; numero += 1) {
        await seriesLocal.guardar(USUARIO, {
          id: `serie-${numero}`,
          registradaEn: new Date(Date.now() - 60_000 + numero * 1000).toISOString(),
          idEjercicio: ejercicio.id,
          nombreEjercicio: ejercicio.nombre,
          dia: sesionDeHoy.dia.nombre,
          numeroSerie: numero,
          peso: ejercicio.pesoInicialKg,
          unidad: 'kg',
          repeticiones: ejercicio.repeticiones,
          autoevaluacion: 'facil',
          estado: 'completada',
        });
      }
    });
    expect(await screen.findByRole('button', { name: ajustar(ejercicio.pesoInicialKg) })).toBeInTheDocument();

    await irYVolver(historial, '/hoy');

    // En jsdom la transición de Ionic no termina y la página vuelta queda marcada como oculta: se incluye.
    expect(
      await screen.findByRole('button', { name: ajustar(ejercicio.pesoInicialKg + 2.5), hidden: true }),
    ).toBeInTheDocument();
  });

  it('Mi rutina muestra la rutina nueva al volver de cambiarla', async () => {
    const historial = renderizar('/rutina', () =>
      rutinaLocal.guardar(USUARIO, asignarRutina({ experiencia: 'ninguna', diasPorSemana: 4, equipo: ['maquinas'] })),
    );
    expect(await screen.findByRole('heading', { name: '3 días por semana' })).toBeInTheDocument();

    await irYVolver(historial, '/rutina');

    expect(await screen.findByRole('heading', { name: '4 días por semana', hidden: true })).toBeInTheDocument();
  });
});
