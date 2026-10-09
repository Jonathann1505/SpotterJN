import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import CuestionarioRutina from './CuestionarioRutina';
import { rutinaLocal } from '../repositories/local';

function marcar(elemento: Element, checked: boolean): void {
  fireEvent(elemento, new CustomEvent('ionChange', { bubbles: true, detail: { checked } }));
}

function renderizar() {
  return render(
    <IonApp>
      <MemoryRouter initialEntries={['/cuestionario-rutina']}>
        <Route path="/cuestionario-rutina" component={CuestionarioRutina} />
        <Route path="/rutina">
          <p>rutina asignada</p>
        </Route>
      </MemoryRouter>
    </IonApp>,
  );
}

describe('CuestionarioRutina', () => {
  beforeEach(async () => {
    await Preferences.clear();
  });
  afterEach(cleanup);

  it('habilita "Ver mi rutina" solo con experiencia y equipo respondidos', () => {
    const { container, getByRole } = renderizar();
    const boton = container.querySelector('ion-button.auth-submit');

    expect(boton).toHaveAttribute('disabled');
    fireEvent.click(getByRole('radio', { name: 'Ninguna' }));
    expect(boton).toHaveAttribute('disabled');
    marcar(container.querySelectorAll('ion-checkbox')[0], true);
    expect(boton).toHaveAttribute('disabled', 'false');
  });

  it('limita los días entre 2 y 6', () => {
    const { container, getByLabelText } = renderizar();
    const valor = container.querySelector('output') as HTMLElement;

    for (let i = 0; i < 5; i += 1) {
      fireEvent.click(getByLabelText('Más días'));
    }
    expect(valor).toHaveTextContent('6');
    expect(getByLabelText('Más días')).toHaveAttribute('disabled');

    for (let i = 0; i < 6; i += 1) {
      fireEvent.click(getByLabelText('Menos días'));
    }
    expect(valor).toHaveTextContent('2');
  });

  it('asigna, guarda la rutina y avanza', async () => {
    const { container, getByRole, findByText } = renderizar();

    fireEvent.click(getByRole('radio', { name: 'Menos de 6 meses' }));
    marcar(container.querySelectorAll('ion-checkbox')[2], true);
    fireEvent.click(container.querySelector('ion-button.auth-submit') as Element);

    expect(await findByText('rutina asignada')).toBeInTheDocument();
    await waitFor(async () => {
      const rutina = await rutinaLocal.obtener();
      expect(rutina?.cuestionario).toEqual({ experiencia: 'menos-6-meses', diasPorSemana: 3, equipo: ['maquinas'] });
      expect(rutina?.dias).toHaveLength(3);
    });
  });
});
