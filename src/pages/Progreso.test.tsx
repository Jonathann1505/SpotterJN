import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactMemoryRouter } from '@ionic/react-router';
import { Preferences } from '@capacitor/preferences';
import { createMemoryHistory } from 'history';
import { Route } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProveedorPerfil } from '../context/PerfilContext';
import { perfilLocal, seriesLocal } from '../repositories/local';
import type { SerieRegistrada } from '../types/series';
import { botonAtras, pulsarAtras } from '../test/navegacion';
import Progreso from './Progreso';

vi.mock('../context/SesionContext', () => ({
  useSesion: () => ({ sesion: { user: { id: 'usuario-prueba' } } }),
}));

let contador = 0;

function serie(parcial: Partial<SerieRegistrada> & Pick<SerieRegistrada, 'registradaEn'>): SerieRegistrada {
  contador += 1;
  return {
    id: `serie-${contador}`,
    idEjercicio: 'press-banca',
    nombreEjercicio: 'Press de banca',
    dia: 'Día 1 – Cuerpo completo',
    numeroSerie: 1,
    peso: 20,
    unidad: 'kg',
    repeticiones: 12,
    autoevaluacion: 'normal',
    estado: 'completada',
    ...parcial,
  };
}

const hora = (dia: number) => new Date(2026, 10, dia, 9, 0).toISOString();

async function guardar(...series: SerieRegistrada[]): Promise<void> {
  for (const s of series) {
    await seriesLocal.guardar('usuario-prueba', s);
  }
}

function renderizar() {
  return render(
    <IonApp>
      <ProveedorPerfil>
        <IonReactMemoryRouter history={createMemoryHistory({ initialEntries: ['/progreso'] })}>
          <IonRouterOutlet>
            <Route exact path="/progreso" component={Progreso} />
            <Route exact path="/perfil">
              <p>pantalla perfil</p>
            </Route>
            <Route exact path="/hoy">
              <p>pantalla hoy</p>
            </Route>
          </IonRouterOutlet>
        </IonReactMemoryRouter>
      </ProveedorPerfil>
    </IonApp>,
  );
}

describe('Progreso', () => {
  beforeEach(async () => {
    await Preferences.clear();
  });
  afterEach(cleanup);

  it('sin sesiones registradas muestra un estado vacío y lleva a Hoy', async () => {
    const { findByText } = renderizar();

    expect(await findByText(/Todavía no tienes sesiones registradas/)).toBeInTheDocument();
    fireEvent.click(await findByText('Ir a Hoy'));
    expect(await findByText('pantalla hoy')).toBeInTheDocument();
  });

  it('lista las sesiones recientes con peso, repeticiones y autoevaluación', async () => {
    await guardar(
      serie({ registradaEn: hora(16), peso: 20, repeticiones: 12, autoevaluacion: 'facil' }),
      serie({ registradaEn: hora(18), peso: 22.5, repeticiones: 10, autoevaluacion: 'dificil' }),
    );
    const { findByText, getByText } = renderizar();

    expect(await findByText('22,5 kg × 10 repeticiones')).toBeInTheDocument();
    expect(getByText('20 kg × 12 repeticiones')).toBeInTheDocument();
    expect(getByText('Difícil')).toHaveClass('sj-evaluacion-dificil');
    expect(getByText('Fácil')).toHaveClass('sj-evaluacion-facil');
  });

  it('con una sola sesión del ejercicio muestra un mensaje motivador', async () => {
    await guardar(serie({ registradaEn: hora(16) }));
    const { findByText } = renderizar();

    expect(await findByText(/Con una sesión más de Press de banca/)).toBeInTheDocument();
  });

  it('con dos o más sesiones ya no muestra el mensaje motivador', async () => {
    await guardar(serie({ registradaEn: hora(16) }), serie({ registradaEn: hora(18) }));
    const { findByText, queryByText } = renderizar();

    await findByText('Últimas sesiones');
    expect(queryByText(/Con una sesión más/)).not.toBeInTheDocument();
  });

  it('con dos o más sesiones dibuja la gráfica de peso por semana', async () => {
    await guardar(
      serie({ registradaEn: hora(16), peso: 20 }),
      serie({ registradaEn: hora(23), peso: 22.5 }),
      serie({ registradaEn: hora(30), peso: 25 }),
    );
    const { findByRole, getByText } = renderizar();

    expect(await findByRole('img', { name: /Peso de Press de banca por semana: de 20 a 25 kg en 3 semanas/ })).toBeInTheDocument();
    expect(getByText('Peso por semana')).toBeInTheDocument();
  });

  it('con una sola sesión no dibuja la gráfica', async () => {
    await guardar(serie({ registradaEn: hora(16) }));
    const { findByText, queryByRole } = renderizar();

    await findByText(/Con una sesión más/);
    expect(queryByRole('img')).not.toBeInTheDocument();
  });

  it('en un ejercicio de peso corporal explica que no hay peso que graficar', async () => {
    await guardar(
      serie({ registradaEn: hora(16), idEjercicio: 'flexiones', nombreEjercicio: 'Flexiones', peso: null }),
      serie({ registradaEn: hora(18), idEjercicio: 'flexiones', nombreEjercicio: 'Flexiones', peso: null }),
    );
    const { findByText, queryByRole } = renderizar();

    expect(await findByText(/no hay peso que graficar/)).toBeInTheDocument();
    expect(queryByRole('img')).not.toBeInTheDocument();
  });

  it('cambia de ejercicio con los chips', async () => {
    await guardar(
      serie({ registradaEn: hora(16), peso: 20 }),
      serie({ registradaEn: hora(18), idEjercicio: 'flexiones', nombreEjercicio: 'Flexiones', peso: null, repeticiones: 15 }),
    );
    const { findByRole, findByText, queryByText } = renderizar();

    // El ejercicio entrenado más recientemente se elige primero.
    expect(await findByText('Peso corporal × 15 repeticiones')).toBeInTheDocument();
    fireEvent.click(within(await findByRole('group', { name: 'Ejercicio' })).getByRole('button', { name: 'Press de banca' }));

    expect(await findByText('20 kg × 12 repeticiones')).toBeInTheDocument();
    expect(queryByText('Peso corporal × 15 repeticiones')).not.toBeInTheDocument();
  });

  it('muestra los pesos en libras si el perfil usa lb', async () => {
    await perfilLocal.guardar('usuario-prueba', { nombre: 'Nayeli', meta: 'fuerza', unidadPeso: 'lb' });
    await guardar(serie({ registradaEn: hora(16), peso: 100, unidad: 'lb' }));
    const { findByText } = renderizar();

    expect(await findByText('100 lb × 12 repeticiones')).toBeInTheDocument();
  });

  it('marca las sesiones con molestia', async () => {
    await guardar(
      serie({ registradaEn: hora(16), numeroSerie: 1 }),
      serie({ registradaEn: hora(16), numeroSerie: 2, estado: 'interrumpida-por-molestia', autoevaluacion: null }),
    );
    const { findByText } = renderizar();

    expect(await findByText('Con molestia')).toBeInTheDocument();
  });

  it('vuelve a Perfil con el botón atrás del encabezado', async () => {
    const { container, findByText } = renderizar();
    await findByText(/Todavía no tienes sesiones registradas/);

    expect(botonAtras(container)).toHaveAttribute('default-href', '/perfil');
    pulsarAtras(container);

    expect(await findByText('pantalla perfil')).toBeInTheDocument();
  });
});
