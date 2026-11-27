import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IonApp, IonPage, IonRouterOutlet } from '@ionic/react';
import { IonReactMemoryRouter } from '@ionic/react-router';
import { Preferences } from '@capacitor/preferences';
import { createMemoryHistory, type MemoryHistory } from 'history';
import { Route, useHistory } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProveedorPerfil } from '../context/PerfilContext';
import { borrarDatosLocales, rutinaLocal, saludLocal, seriesLocal } from '../repositories/local';
import { asignarRutina } from '../utils/rutina';
import { sesionParaFecha } from '../utils/semana';
import Hoy from './Hoy';
import Perfil from './Perfil';
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
            <Route exact path="/perfil" component={Perfil} />
            <Route exact path="/aviso-medico">
              <IonPage>
                <h1>Aviso médico</h1>
              </IonPage>
            </Route>
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
  await vi.waitFor(() => expect(historial.location.pathname).not.toBe('/otra'));
  expect(['/aviso-medico', destino]).toContain(historial.location.pathname);
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

  it('Perfil muestra la rutina nueva en «Tu rutina actual» al volver de cambiarla', async () => {
    const historial = renderizar('/perfil', () =>
      rutinaLocal.guardar(USUARIO, asignarRutina({ experiencia: 'ninguna', diasPorSemana: 4, equipo: ['maquinas'] })),
    );
    expect(await screen.findByText(/^3 días por semana/)).toBeInTheDocument();

    await irYVolver(historial, '/perfil');

    expect(await screen.findByText(/^4 días por semana/, undefined, { timeout: 3000 })).toBeInTheDocument();
  });

  it('Hoy muestra el ejercicio nuevo al volver de cambiar uno de la rutina', async () => {
    const sesionDeHoy = sesionParaFecha(rutina, new Date());
    if (!sesionDeHoy) {
      throw new Error('La rutina de prueba no tiene sesiones.');
    }
    const [original] = sesionDeHoy.dia.ejercicios;
    const reemplazo = { ...original, id: 'reemplazo-de-prueba', nombre: 'Ejercicio de reemplazo' };

    const historial = renderizar('/hoy', () =>
      rutinaLocal.guardar(USUARIO, {
        ...rutina,
        dias: rutina.dias.map((dia, indice) =>
          indice === sesionDeHoy.indice
            ? { ...dia, ejercicios: dia.ejercicios.map((e) => (e.id === original.id ? reemplazo : e)) }
            : dia,
        ),
      }),
    );
    expect(await screen.findByRole('button', { name: `Ver la ficha de ${original.nombre}` })).toBeInTheDocument();

    await irYVolver(historial, '/hoy');

    expect(
      (await screen.findAllByRole('button', { name: 'Ver la ficha de Ejercicio de reemplazo', hidden: true })).length,
    ).toBeGreaterThan(0);
  });

  it('Hoy no muestra datos borrados al volver: lleva de nuevo al aviso médico', async () => {
    const historial = renderizar('/hoy', () => borrarDatosLocales(USUARIO));
    await screen.findByRole('heading', { name: sesionParaFecha(rutina, new Date())?.dia.nombre ?? '' });

    await irYVolver(historial, '/hoy');

    expect(historial.location.pathname).toBe('/aviso-medico');
  });
});
