import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CuestionarioSalud from './CuestionarioSalud';
import { saludLocal } from '../repositories/local';

vi.mock('../context/SesionContext', () => ({
  useSesion: () => ({ sesion: { user: { id: 'usuario-prueba' } } }),
}));

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
    const { container, getByRole } = renderizar();
    const boton = container.querySelector('ion-button.sj-boton');

    expect(boton).toHaveAttribute('disabled');
    fireEvent.click(getByRole('checkbox', { name: 'Ninguna de las anteriores' }));
    expect(boton).toHaveAttribute('disabled', 'false');
  });

  it('muestra el aviso médico y cambia el botón si se marca una condición', () => {
    const { container, getByRole } = renderizar();

    fireEvent.click(getByRole('checkbox', { name: 'Dolor articular' }));

    expect(getByRole('alert')).toHaveTextContent(/consultar a un médico/i);
    expect(container.querySelector('ion-button.sj-boton')).toHaveTextContent('Entiendo el riesgo y continúo');
  });

  it('"Ninguna" limpia las condiciones y viceversa', () => {
    const { getByRole, queryByRole } = renderizar();

    fireEvent.click(getByRole('checkbox', { name: 'Problema cardíaco' }));
    fireEvent.click(getByRole('checkbox', { name: 'Ninguna de las anteriores' }));
    expect(queryByRole('alert')).not.toBeInTheDocument();
    expect(getByRole('checkbox', { name: 'Problema cardíaco' })).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(getByRole('checkbox', { name: 'Embarazo' }));
    expect(queryByRole('alert')).toBeInTheDocument();
    expect(getByRole('checkbox', { name: 'Ninguna de las anteriores' })).toHaveAttribute('aria-checked', 'false');
  });

  it('guarda las respuestas y avanza al cuestionario de rutina', async () => {
    const { container, getByRole, findByText } = renderizar();

    fireEvent.click(getByRole('checkbox', { name: 'Problema cardíaco' }));
    fireEvent.click(container.querySelector('ion-button.sj-boton') as Element);

    expect(await findByText('siguiente pantalla')).toBeInTheDocument();
    await waitFor(async () => {
      expect((await saludLocal.obtener('usuario-prueba'))?.condiciones).toEqual(['problema-cardiaco']);
    });
  });
});
