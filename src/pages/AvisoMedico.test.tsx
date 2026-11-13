import { cleanup, fireEvent, render } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import AvisoMedico from './AvisoMedico';

describe('AvisoMedico', () => {
  afterEach(cleanup);

  it('avanza al cuestionario de salud al pulsar Entendido', async () => {
    const { container, findByText, getByRole } = render(
      <IonApp>
        <MemoryRouter initialEntries={['/aviso-medico']}>
          <Route path="/aviso-medico" component={AvisoMedico} />
          <Route path="/salud">
            <p>cuestionario</p>
          </Route>
        </MemoryRouter>
      </IonApp>,
    );

    expect(getByRole('heading', { name: 'Aviso médico' })).toBeInTheDocument();
    fireEvent.click(container.querySelector('ion-button') as Element);
    expect(await findByText('cuestionario')).toBeInTheDocument();
  });

  it('forma parte del flujo inicial obligatorio y no tiene botón atrás', async () => {
    const { container } = render(
      <IonApp>
        <MemoryRouter initialEntries={['/aviso-medico']}>
          <Route path="/aviso-medico" component={AvisoMedico} />
        </MemoryRouter>
      </IonApp>,
    );
    expect(container.querySelector('ion-back-button')).toBeNull();
  });
});
