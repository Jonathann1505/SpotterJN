import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import Consentimientos from './Consentimientos';

describe('Consentimientos', () => {
  afterEach(cleanup);

  it('pone el texto dentro de cada casilla, junto al cuadro, y deja los enlaces fuera', () => {
    const { container } = render(
      <IonApp>
        <MemoryRouter>
          <Consentimientos />
        </MemoryRouter>
      </IonApp>,
    );
    const casillas = Array.from(container.querySelectorAll('ion-checkbox'));

    expect(casillas.map((casilla) => casilla.textContent?.trim())).toEqual([
      'Soy mayor de 18 años',
      'Acepto los términos y la política de privacidad',
      'Autorizo el uso de mis datos de salud (opcional)',
    ]);
    for (const casilla of casillas) {
      expect(casilla).toHaveAttribute('label-placement', 'end');
      expect(casilla).toHaveAttribute('justify', 'start');
      expect(casilla.querySelector('a')).toBeNull();
    }
    expect(screen.getByRole('link', { name: 'términos' })).toHaveAttribute('href', '/terminos');
    expect(screen.getByRole('link', { name: 'política de privacidad' })).toHaveAttribute('href', '/privacidad');
  });

  it('habilita continuar solo al aceptar los dos consentimientos obligatorios', () => {
    const { container } = render(
      <IonApp>
        <MemoryRouter>
          <Consentimientos />
        </MemoryRouter>
      </IonApp>,
    );
    const [mayorEdad, terminos] = container.querySelectorAll('ion-checkbox');
    const continuar = container.querySelector('ion-button.sj-acceso-submit');

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

  it('es una pantalla raíz sin botón atrás', async () => {
    const { container } = render(
      <IonApp>
        <MemoryRouter>
          <Consentimientos />
        </MemoryRouter>
      </IonApp>,
    );
    expect(container.querySelector('ion-back-button')).toBeNull();
  });
});
