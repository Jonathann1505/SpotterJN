import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactMemoryRouter } from '@ionic/react-router';
import { Preferences } from '@capacitor/preferences';
import { createMemoryHistory } from 'history';
import { Route } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { saludLocal } from '../repositories/local';
import { botonAtras, pulsarAtras } from '../test/navegacion';
import EditarSalud from './EditarSalud';

vi.mock('../context/SesionContext', () => ({
  useSesion: () => ({ sesion: { user: { id: 'usuario-prueba' } } }),
}));

function renderizar() {
  return render(
    <IonApp>
      <IonReactMemoryRouter history={createMemoryHistory({ initialEntries: ['/editar-salud'] })}>
        <IonRouterOutlet>
          <Route exact path="/editar-salud" component={EditarSalud} />
          <Route exact path="/perfil">
            <p>pantalla perfil</p>
          </Route>
          <Route exact path="/aviso-medico">
            <p>aviso médico</p>
          </Route>
        </IonRouterOutlet>
      </IonReactMemoryRouter>
    </IonApp>,
  );
}

describe('EditarSalud', () => {
  beforeEach(async () => {
    await Preferences.clear();
  });
  afterEach(cleanup);

  it('muestra marcadas las condiciones ya guardadas', async () => {
    await saludLocal.guardar('usuario-prueba', { condiciones: ['dolor-articular'], respondidoEn: '2026-11-01T10:00:00.000Z' });
    const { findByRole, getByRole } = renderizar();

    expect(await findByRole('checkbox', { name: 'Dolor articular' })).toHaveAttribute('aria-checked', 'true');
    expect(getByRole('checkbox', { name: 'Embarazo' })).toHaveAttribute('aria-checked', 'false');
  });

  it('guarda los cambios y los confirma', async () => {
    await saludLocal.guardar('usuario-prueba', { condiciones: [], respondidoEn: '2026-11-01T10:00:00.000Z' });
    const { findByRole, findByText, getByText } = renderizar();

    fireEvent.click(await findByRole('checkbox', { name: 'Problema cardíaco' }));
    fireEvent.click(getByText('Guardar cambios'));

    expect(await findByText('Respuestas actualizadas.')).toBeInTheDocument();
    const guardadas = await saludLocal.obtener('usuario-prueba');
    expect(guardadas?.condiciones).toEqual(['problema-cardiaco']);
    expect(guardadas?.respondidoEn).not.toBe('2026-11-01T10:00:00.000Z');
  });

  it('recomienda consultar a un médico mientras haya una condición marcada', async () => {
    await saludLocal.guardar('usuario-prueba', { condiciones: [], respondidoEn: '2026-11-01T10:00:00.000Z' });
    const { findByRole, queryByRole } = renderizar();

    fireEvent.click(await findByRole('checkbox', { name: 'Embarazo' }));
    expect(await findByRole('alert')).toHaveTextContent(/consultar a un médico/);

    fireEvent.click(await findByRole('checkbox', { name: 'Embarazo' }));
    await waitFor(() => expect(queryByRole('alert')).not.toBeInTheDocument());
  });

  it('envía al aviso médico si nunca respondió el cuestionario', async () => {
    const { findByText } = renderizar();

    expect(await findByText('aviso médico')).toBeInTheDocument();
  });

  it('vuelve a Perfil con el botón atrás del encabezado', async () => {
    await saludLocal.guardar('usuario-prueba', { condiciones: [], respondidoEn: '2026-11-01T10:00:00.000Z' });
    const { container, findByRole, findByText } = renderizar();
    await findByRole('checkbox', { name: 'Embarazo' });

    expect(botonAtras(container)).toHaveAttribute('default-href', '/perfil');
    pulsarAtras(container);

    expect(await findByText('pantalla perfil')).toBeInTheDocument();
  });
});
