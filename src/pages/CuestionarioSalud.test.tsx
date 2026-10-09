import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import CuestionarioSalud from './CuestionarioSalud';
import { saludLocal } from '../repositories/local';

function marcar(elemento: Element, checked: boolean): void {
  fireEvent(elemento, new CustomEvent('ionChange', { bubbles: true, detail: { checked } }));
}

function renderizar() {
  return render(
    <IonApp>
      <MemoryRouter initialEntries={['/salud']}>
        <Route path="/salud" component={CuestionarioSalud} />
        <Route path="/cuestionario-rutina">
          <p>siguiente pantalla</p>
        </Route>
      </MemoryRouter>
    </IonApp>,
  );
}

describe('CuestionarioSalud', () => {
  beforeEach(async () => {
    await Preferences.clear();
  });
  afterEach(cleanup);

  it('mantiene el botón deshabilitado hasta responder', () => {
    const { container } = renderizar();
    const boton = container.querySelector('ion-button.auth-submit');

    expect(boton).toHaveAttribute('disabled');
    marcar(container.querySelectorAll('ion-checkbox')[3], true);
    expect(boton).toHaveAttribute('disabled', 'false');
  });

  it('muestra el aviso médico y cambia el botón si se marca una condición', () => {
    const { container, getByRole } = renderizar();

    marcar(container.querySelectorAll('ion-checkbox')[0], true);

    expect(getByRole('alert')).toHaveTextContent(/consultar a un médico/i);
    expect(container.querySelector('ion-button.auth-submit')).toHaveTextContent(
      'Entiendo el riesgo y continúo',
    );
  });

  it('"Ninguna" limpia las condiciones y viceversa', () => {
    const { container, queryByRole } = renderizar();
    const casillas = container.querySelectorAll('ion-checkbox');

    marcar(casillas[1], true);
    marcar(casillas[3], true);
    expect(queryByRole('alert')).not.toBeInTheDocument();

    marcar(casillas[2], true);
    expect(queryByRole('alert')).toBeInTheDocument();
  });

  it('guarda las respuestas y avanza al cuestionario de rutina', async () => {
    const { container, findByText } = renderizar();

    marcar(container.querySelectorAll('ion-checkbox')[1], true);
    fireEvent.click(container.querySelector('ion-button.auth-submit') as Element);

    expect(await findByText('siguiente pantalla')).toBeInTheDocument();
    await waitFor(async () => {
      expect((await saludLocal.obtener())?.condiciones).toEqual(['problema-cardiaco']);
    });
  });
});
