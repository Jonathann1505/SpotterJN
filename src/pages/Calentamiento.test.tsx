import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactMemoryRouter } from '@ionic/react-router';
import { Preferences } from '@capacitor/preferences';
import { createMemoryHistory } from 'history';
import { Route } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CALENTAMIENTOS } from '../data/calentamiento';
import { rutinaLocal } from '../repositories/local';
import type { RutinaAsignada } from '../types/perfil';
import { botonAtras, pulsarAtras } from '../test/navegacion';
import Calentamiento from './Calentamiento';

vi.mock('../context/SesionContext', () => ({
  useSesion: () => ({ sesion: { user: { id: 'usuario-prueba' } } }),
}));

// Con 2 días se entrena lunes y jueves. Noviembre de 2026: 16 lunes, 17 martes, 19 jueves.
function simularFecha(dia: number): void {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, dia, 9, 0));
}

const rutinaSuperiorInferior: RutinaAsignada = {
  cuestionario: { experiencia: 'ninguna', diasPorSemana: 2, equipo: ['maquinas'] },
  dias: [
    { nombre: 'Día 1 – Tren superior', ejercicios: [] },
    { nombre: 'Día 2 – Tren inferior', ejercicios: [] },
  ],
  asignadaEn: '2026-11-13T10:00:00.000Z',
};

function renderizar() {
  return render(
    <IonApp>
      <IonReactMemoryRouter history={createMemoryHistory({ initialEntries: ['/calentamiento'] })}>
        <IonRouterOutlet>
          <Route exact path="/calentamiento" component={Calentamiento} />
          <Route exact path="/ejercicios">
            <p>pantalla biblioteca</p>
          </Route>
          <Route exact path="/hoy">
            <p>pantalla hoy</p>
          </Route>
        </IonRouterOutlet>
      </IonReactMemoryRouter>
    </IonApp>,
  );
}

describe('Calentamiento', () => {
  beforeEach(async () => {
    simularFecha(16);
    await Preferences.clear();
  });
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('sin rutina muestra el calentamiento de cuerpo completo', async () => {
    const { findByRole, getAllByRole, getByText } = renderizar();

    expect(await findByRole('heading', { name: 'Calentamiento' })).toBeInTheDocument();
    expect(getAllByRole('checkbox')).toHaveLength(CALENTAMIENTOS.completo.length);
    for (const movimiento of CALENTAMIENTOS.completo) {
      expect(getByText(movimiento.nombre)).toBeInTheDocument();
      expect(getByText(movimiento.consejo)).toBeInTheDocument();
    }
  });

  it('parte del tipo de la sesión que toca hoy', async () => {
    simularFecha(19);
    await rutinaLocal.guardar('usuario-prueba', rutinaSuperiorInferior);
    const { findByText, getAllByRole, getByRole } = renderizar();

    expect(await findByText('Día 2 – Tren inferior')).toBeInTheDocument();
    expect(getByRole('button', { name: 'Tren inferior' })).toHaveAttribute('aria-pressed', 'true');
    expect(getAllByRole('checkbox')).toHaveLength(CALENTAMIENTOS.inferior.length);
    expect(getByRole('checkbox', { name: /Zancadas suaves/ })).toBeInTheDocument();
  });

  it('en un día de descanso usa la próxima sesión y avisa cuándo es', async () => {
    simularFecha(17);
    await rutinaLocal.guardar('usuario-prueba', rutinaSuperiorInferior);
    const { findByText, getByRole } = renderizar();

    expect(await findByText(/Tu próxima sesión es el jueves/)).toBeInTheDocument();
    expect(getByRole('button', { name: 'Tren inferior' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('los chips cambian el calentamiento y reinician los pasos marcados', async () => {
    simularFecha(19);
    await rutinaLocal.guardar('usuario-prueba', rutinaSuperiorInferior);
    const { findByRole, getAllByRole, getByRole, getByText } = renderizar();
    const tipos = within(await findByRole('group', { name: 'Tipo de sesión' }));

    fireEvent.click(getAllByRole('checkbox')[0]);
    expect(getByText(`1 de ${CALENTAMIENTOS.inferior.length} pasos hechos`)).toBeInTheDocument();

    fireEvent.click(tipos.getByRole('button', { name: 'Tirón' }));

    expect(getAllByRole('checkbox')).toHaveLength(CALENTAMIENTOS.tiron.length);
    expect(getByRole('checkbox', { name: /Remo sin peso/ })).toBeInTheDocument();
    expect(getByText(`0 de ${CALENTAMIENTOS.tiron.length} pasos hechos`)).toBeInTheDocument();
  });

  it('marca y desmarca los pasos y cuenta cuántos van', async () => {
    const { findByRole, getByRole, getByText } = renderizar();
    await findByRole('heading', { name: 'Calentamiento' });
    const total = CALENTAMIENTOS.completo.length;

    expect(getByText(`0 de ${total} pasos hechos`)).toBeInTheDocument();
    const primero = getByRole('checkbox', { name: new RegExp(CALENTAMIENTOS.completo[0].nombre) });
    fireEvent.click(primero);
    expect(primero).toHaveAttribute('aria-checked', 'true');
    expect(getByText(`1 de ${total} pasos hechos`)).toBeInTheDocument();

    fireEvent.click(primero);
    expect(primero).toHaveAttribute('aria-checked', 'false');
    expect(getByText(`0 de ${total} pasos hechos`)).toBeInTheDocument();
  });

  it('al completar todos los pasos felicita y ofrece ir a Hoy', async () => {
    const { findByRole, findByText, getAllByRole, queryByText } = renderizar();
    await findByRole('heading', { name: 'Calentamiento' });
    expect(queryByText('Ir a Hoy')).not.toBeInTheDocument();

    for (const paso of getAllByRole('checkbox')) {
      fireEvent.click(paso);
    }

    expect(await findByText(/Ya puedes empezar tu entrenamiento/)).toBeInTheDocument();
    fireEvent.click(await findByText('Ir a Hoy'));
    expect(await findByText('pantalla hoy')).toBeInTheDocument();
  });

  it('vuelve a la biblioteca con el botón atrás del encabezado', async () => {
    const { container, findByRole, findByText } = renderizar();
    await findByRole('heading', { name: 'Calentamiento' });

    expect(botonAtras(container)).toHaveAttribute('default-href', '/ejercicios');
    pulsarAtras(container);

    expect(await findByText('pantalla biblioteca')).toBeInTheDocument();
  });
});
