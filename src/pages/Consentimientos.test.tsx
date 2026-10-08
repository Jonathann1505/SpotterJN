import { cleanup, fireEvent, render } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import Consentimientos from './Consentimientos';

describe('Consentimientos', () => {
  afterEach(cleanup);

  it('habilita continuar solo al aceptar los dos consentimientos obligatorios', () => {
    const { container } = render(
      <IonApp>
        <MemoryRouter>
          <Consentimientos />
        </MemoryRouter>
      </IonApp>,
    );
    const [mayorEdad, terminos] = container.querySelectorAll('ion-checkbox');
    const continuar = container.querySelector('ion-button.auth-submit');

    expect(continuar).toHaveAttribute('disabled');
    fireEvent(
      mayorEdad,
      new CustomEvent('ionChange', { bubbles: true, detail: { checked: true } }),
    );
    expect(continuar).toHaveAttribute('disabled');
    fireEvent(
      terminos,
      new CustomEvent('ionChange', { bubbles: true, detail: { checked: true } }),
    );
    expect(continuar).toHaveAttribute('disabled', 'false');
  });
});
