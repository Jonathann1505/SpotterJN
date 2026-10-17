import { cleanup, fireEvent, render } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { GLOSARIO } from '../data/glosario';
import Glosario from './Glosario';

function renderizar() {
  return render(
    <IonApp>
      <MemoryRouter initialEntries={['/perfil', '/glosario']} initialIndex={1}>
        <Route path="/glosario" component={Glosario} />
        <Route path="/perfil">
          <p>pantalla perfil</p>
        </Route>
      </MemoryRouter>
    </IonApp>,
  );
}

describe('Glosario', () => {
  afterEach(cleanup);

  it('lista todos los términos con su definición', () => {
    const { getByRole, getByText } = renderizar();

    expect(getByRole('heading', { name: 'Glosario' })).toBeInTheDocument();
    for (const entrada of GLOSARIO) {
      expect(getByText(entrada.termino)).toBeInTheDocument();
      expect(getByText(entrada.definicion)).toBeInTheDocument();
    }
  });

  it('vuelve a la pantalla anterior', async () => {
    const { container, findByText } = renderizar();

    fireEvent.click(container.querySelector('ion-button.sj-boton') as Element);

    expect(await findByText('pantalla perfil')).toBeInTheDocument();
  });
});
