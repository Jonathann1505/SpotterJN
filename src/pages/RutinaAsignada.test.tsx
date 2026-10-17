import { cleanup, fireEvent, render } from '@testing-library/react';
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
    const { findByRole, getAllByRole, getAllByText, getByText } = renderizar();

    expect(await findByRole('heading', { name: '3 días por semana' })).toBeInTheDocument();
    expect(getAllByRole('button', { name: /Día \d/ })).toHaveLength(3);
    expect(getByText(/Entrenas cuerpo completo/)).toBeInTheDocument();
    expect(getAllByText(/3x12/).length).toBeGreaterThan(0);
  });

  it('abre y cierra un día al tocarlo', async () => {
    await rutinaLocal.guardar(asignarRutina({ experiencia: 'ninguna', diasPorSemana: 3, equipo: ['maquinas'] }));
    const { findAllByRole } = renderizar();

    const dias = await findAllByRole('button', { name: /Día \d/ });
    expect(dias[0]).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(dias[1]);
    expect(dias[0]).toHaveAttribute('aria-expanded', 'false');
    expect(dias[1]).toHaveAttribute('aria-expanded', 'true');
  });

  it('muestra los pesos en la unidad del perfil', async () => {
    await perfilLocal.guardar({ nombre: 'Nayeli', meta: 'fuerza', unidadPeso: 'lb' });
    await rutinaLocal.guardar(asignarRutina({ experiencia: 'ninguna', diasPorSemana: 2, equipo: ['maquinas'] }));
    const { findAllByText } = renderizar();

    expect((await findAllByText(/\d lb/)).length).toBeGreaterThan(0);
  });

  it('explica series y repeticiones con la ayuda del glosario', async () => {
    await rutinaLocal.guardar(asignarRutina({ experiencia: 'ninguna', diasPorSemana: 3, equipo: ['maquinas'] }));
    const { findByRole, getByRole } = renderizar();

    fireEvent.click(await findByRole('button', { name: '¿Qué es serie?' }));

    expect(getByRole('dialog')).toHaveTextContent(/grupo de repeticiones/i);
  });
});
