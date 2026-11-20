import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactMemoryRouter } from '@ionic/react-router';
import { createMemoryHistory } from 'history';
import { Route } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { EJERCICIOS } from '../data/ejercicios';
import { botonAtras, pulsarAtras } from '../test/navegacion';
import Biblioteca from './Biblioteca';

function renderizar() {
  return render(
    <IonApp>
      <IonReactMemoryRouter history={createMemoryHistory({ initialEntries: ['/ejercicios'] })}>
        <IonRouterOutlet>
          <Route exact path="/ejercicios" component={Biblioteca} />
          <Route exact path="/perfil">
            <p>pantalla perfil</p>
          </Route>
          <Route exact path="/calentamiento">
            <p>pantalla calentamiento</p>
          </Route>
          <Route exact path="/ejercicio/:id">
            <p>ficha abierta</p>
          </Route>
        </IonRouterOutlet>
      </IonReactMemoryRouter>
    </IonApp>,
  );
}

describe('Biblioteca', () => {
  afterEach(cleanup);

  it('lista todos los ejercicios del catálogo con su grupo y equipo', async () => {
    const { findByRole, getByText } = renderizar();

    expect(await findByRole('heading', { name: 'Ejercicios' })).toBeInTheDocument();
    expect(getByText(`${EJERCICIOS.length} ejercicios`)).toBeInTheDocument();
    expect(getByText('Press de banca')).toBeInTheDocument();
    expect(getByText('Pecho · Barra y discos')).toBeInTheDocument();
  });

  it('filtra por grupo muscular', async () => {
    const { findByRole, getByRole, queryByText } = renderizar();
    await findByRole('heading', { name: 'Ejercicios' });

    fireEvent.click(within(getByRole('group', { name: 'Grupo muscular' })).getByRole('button', { name: 'Espalda' }));

    expect(queryByText('Remo en máquina')).toBeInTheDocument();
    expect(queryByText('Press de banca')).not.toBeInTheDocument();
  });

  it('combina los filtros de grupo y equipo y avisa si no hay resultados', async () => {
    const { findByRole, getByRole, getByText } = renderizar();
    await findByRole('heading', { name: 'Ejercicios' });

    fireEvent.click(within(getByRole('group', { name: 'Grupo muscular' })).getByRole('button', { name: 'Tríceps' }));
    fireEvent.click(within(getByRole('group', { name: 'Equipo' })).getByRole('button', { name: 'Barra y discos' }));

    expect(getByText('0 ejercicios')).toBeInTheDocument();
    expect(getByText(/No hay ejercicios con esa combinación/)).toBeInTheDocument();
  });

  it('«Todos» quita el filtro', async () => {
    const { findByRole, getByRole, getByText } = renderizar();
    await findByRole('heading', { name: 'Ejercicios' });
    const grupos = within(getByRole('group', { name: 'Grupo muscular' }));

    fireEvent.click(grupos.getByRole('button', { name: 'Piernas' }));
    fireEvent.click(grupos.getByRole('button', { name: 'Todos' }));

    expect(getByText(`${EJERCICIOS.length} ejercicios`)).toBeInTheDocument();
  });

  it('ofrece el calentamiento antes de entrenar', async () => {
    const { findByRole, findByText } = renderizar();
    await findByRole('heading', { name: 'Ejercicios' });

    fireEvent.click(await findByText('Calentamiento antes de entrenar'));

    expect(await findByText('pantalla calentamiento')).toBeInTheDocument();
  });

  it('abre la ficha del ejercicio elegido', async () => {
    const { findByRole, findByText, getByRole } = renderizar();
    await findByRole('heading', { name: 'Ejercicios' });

    fireEvent.click(getByRole('button', { name: 'Zancadas' }));

    expect(await findByText('ficha abierta')).toBeInTheDocument();
  });

  it('vuelve a Perfil con el botón atrás del encabezado', async () => {
    const { container, findByRole, findByText } = renderizar();
    await findByRole('heading', { name: 'Ejercicios' });

    expect(botonAtras(container)).toHaveAttribute('default-href', '/perfil');
    pulsarAtras(container);

    expect(await findByText('pantalla perfil')).toBeInTheDocument();
  });
});
