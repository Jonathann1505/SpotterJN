import { cleanup, fireEvent, render } from '@testing-library/react';
import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactMemoryRouter } from '@ionic/react-router';
import { createMemoryHistory } from 'history';
import { Route } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { GLOSARIO } from '../data/glosario';
import { botonAtras, pulsarAtras } from '../test/navegacion';
import Glosario from './Glosario';

function renderizar() {
  return render(
    <IonApp>
      <IonReactMemoryRouter history={createMemoryHistory({ initialEntries: ['/glosario'] })}>
        <IonRouterOutlet>
          <Route exact path="/glosario" component={Glosario} />
          <Route exact path="/perfil">
            <p>pantalla perfil</p>
          </Route>
        </IonRouterOutlet>
      </IonReactMemoryRouter>
    </IonApp>,
  );
}

function escribirBusqueda(contenedor: HTMLElement, valor: string): void {
  const campo = contenedor.querySelector('ion-input') as Element;
  fireEvent(campo, new CustomEvent('ionInput', { bubbles: true, detail: { value: valor } }));
}

describe('Glosario', () => {
  afterEach(cleanup);

  it('lista todos los términos con su definición', async () => {
    const { findByRole, getByText } = renderizar();

    expect(await findByRole('heading', { name: 'Glosario' })).toBeInTheDocument();
    for (const entrada of GLOSARIO) {
      expect(getByText(entrada.termino)).toBeInTheDocument();
      expect(getByText(entrada.definicion)).toBeInTheDocument();
    }
  });

  it('filtra los términos al escribir en el buscador', async () => {
    const { container, findByRole, getByText, queryByText } = renderizar();
    await findByRole('heading', { name: 'Glosario' });

    escribirBusqueda(container, 'tecnica');

    expect(getByText('Técnica')).toBeInTheDocument();
    expect(queryByText('Fallo')).not.toBeInTheDocument();
  });

  it('avisa cuando no hay coincidencias', async () => {
    const { container, findByRole, findByText } = renderizar();
    await findByRole('heading', { name: 'Glosario' });

    escribirBusqueda(container, 'zzzz');

    expect(await findByText(/No encontramos ese término/)).toBeInTheDocument();
  });

  it('vuelve a Perfil con el botón atrás del encabezado', async () => {
    const { container, findByRole, findByText, queryByText } = renderizar();
    await findByRole('heading', { name: 'Glosario' });

    expect(botonAtras(container)).toHaveAttribute('default-href', '/perfil');
    expect(queryByText('Volver')).not.toBeInTheDocument();
    pulsarAtras(container);

    expect(await findByText('pantalla perfil')).toBeInTheDocument();
  });
});
