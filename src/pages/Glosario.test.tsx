import { cleanup, render } from '@testing-library/react';
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

  it('vuelve a Perfil con el botón atrás del encabezado', async () => {
    const { container, findByRole, findByText, queryByText } = renderizar();
    await findByRole('heading', { name: 'Glosario' });

    expect(botonAtras(container)).toHaveAttribute('default-href', '/perfil');
    expect(queryByText('Volver')).not.toBeInTheDocument();
    pulsarAtras(container);

    expect(await findByText('pantalla perfil')).toBeInTheDocument();
  });
});
