import { cleanup, render } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ProveedorPerfil } from '../context/PerfilContext';
import { perfilLocal, rutinaLocal } from '../repositories/local';
import { asignarRutina } from '../utils/rutina';
import RutinaAsignada from './RutinaAsignada';

function renderizar() {
  return render(
    <IonApp>
      <ProveedorPerfil>
        <MemoryRouter initialEntries={['/rutina']}>
          <Route path="/rutina" component={RutinaAsignada} />
          <Route path="/cuestionario-rutina">
            <p>cuestionario</p>
          </Route>
        </MemoryRouter>
      </ProveedorPerfil>
    </IonApp>,
  );
}

describe('RutinaAsignada', () => {
  beforeEach(async () => {
    await Preferences.clear();
  });
  afterEach(cleanup);

  it('redirige al cuestionario cuando no hay rutina', async () => {
    const { findByText } = renderizar();
    expect(await findByText('cuestionario')).toBeInTheDocument();
  });

  it('muestra un acordeón por día con sus ejercicios', async () => {
    await rutinaLocal.guardar(asignarRutina({ experiencia: 'ninguna', diasPorSemana: 3, equipo: ['maquinas'] }));
    const { container, findByRole, getAllByText } = renderizar();

    expect(await findByRole('heading', { name: 'Tu rutina' })).toBeInTheDocument();
    expect(container.querySelectorAll('ion-accordion')).toHaveLength(3);
    expect(getAllByText(/3x12/).length).toBeGreaterThan(0);
  });

  it('muestra los pesos en la unidad del perfil', async () => {
    await perfilLocal.guardar({ nombre: 'Nayeli', meta: 'fuerza', unidadPeso: 'lb' });
    await rutinaLocal.guardar(asignarRutina({ experiencia: 'ninguna', diasPorSemana: 2, equipo: ['maquinas'] }));
    const { findAllByText } = renderizar();

    expect((await findAllByText(/\d lb/)).length).toBeGreaterThan(0);
  });
});
