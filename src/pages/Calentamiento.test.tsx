import { cleanup, fireEvent, render } from '@testing-library/react';
import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactMemoryRouter } from '@ionic/react-router';
import { createMemoryHistory } from 'history';
import { Route } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { CALENTAMIENTO } from '../data/calentamiento';
import { botonAtras, pulsarAtras } from '../test/navegacion';
import Calentamiento from './Calentamiento';

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
  afterEach(cleanup);

  it('lista todos los pasos con su dosis y consejo', async () => {
    const { findByRole, getAllByRole, getByText } = renderizar();

    expect(await findByRole('heading', { name: 'Calentamiento' })).toBeInTheDocument();
    expect(getAllByRole('checkbox')).toHaveLength(CALENTAMIENTO.length);
    for (const movimiento of CALENTAMIENTO) {
      expect(getByText(movimiento.nombre)).toBeInTheDocument();
      expect(getByText(movimiento.consejo)).toBeInTheDocument();
    }
  });

  it('marca y desmarca los pasos y cuenta cuántos van', async () => {
    const { findByRole, getByRole, getByText } = renderizar();
    await findByRole('heading', { name: 'Calentamiento' });

    expect(getByText(`0 de ${CALENTAMIENTO.length} pasos hechos`)).toBeInTheDocument();
    const primero = getByRole('checkbox', { name: new RegExp(CALENTAMIENTO[0].nombre) });
    fireEvent.click(primero);
    expect(primero).toHaveAttribute('aria-checked', 'true');
    expect(getByText(`1 de ${CALENTAMIENTO.length} pasos hechos`)).toBeInTheDocument();

    fireEvent.click(primero);
    expect(primero).toHaveAttribute('aria-checked', 'false');
    expect(getByText(`0 de ${CALENTAMIENTO.length} pasos hechos`)).toBeInTheDocument();
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
