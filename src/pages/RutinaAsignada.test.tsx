import { cleanup, fireEvent, render } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProveedorPerfil } from '../context/PerfilContext';
import { perfilLocal, rutinaLocal } from '../repositories/local';
import { asignarRutina } from '../utils/rutina';
import RutinaAsignada from './RutinaAsignada';

vi.mock('../context/SesionContext', () => ({
  useSesion: () => ({ sesion: { user: { id: 'usuario-prueba' } } }),
}));

function renderizar() {
  return render(
    <IonApp>
      <ProveedorPerfil>
        <MemoryRouter initialEntries={['/rutina']}>
          <Route path="/rutina" component={RutinaAsignada} />
          <Route path="/ejercicio/:id">
            <p>ficha abierta</p>
          </Route>
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
    await rutinaLocal.guardar(
      'usuario-prueba',
      asignarRutina({ experiencia: 'ninguna', diasPorSemana: 3, equipo: ['maquinas'] }),
    );
    const { findByRole, getAllByRole, getAllByText, getByText } = renderizar();

    expect(await findByRole('heading', { name: '3 días por semana' })).toBeInTheDocument();
    expect(getAllByRole('button', { name: /Día \d/ })).toHaveLength(3);
    expect(getByText(/Entrenas cuerpo completo/)).toBeInTheDocument();
    expect(getAllByText(/series · ≈ \d+ min/)).toHaveLength(3);
    expect(getByText(/Cada semana: 3 sesiones/)).toBeInTheDocument();
    expect(getAllByText(/3x12/).length).toBeGreaterThan(0);
  });

  it('abre y cierra un día al tocarlo', async () => {
    await rutinaLocal.guardar(
      'usuario-prueba',
      asignarRutina({ experiencia: 'ninguna', diasPorSemana: 3, equipo: ['maquinas'] }),
    );
    const { findAllByRole } = renderizar();

    const dias = await findAllByRole('button', { name: /Día \d/ });
    expect(dias[0]).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(dias[1]);
    expect(dias[0]).toHaveAttribute('aria-expanded', 'false');
    expect(dias[1]).toHaveAttribute('aria-expanded', 'true');
  });

  it('muestra los pesos en la unidad del perfil', async () => {
    await perfilLocal.guardar('usuario-prueba', { nombre: 'Nayeli', meta: 'fuerza', unidadPeso: 'lb' });
    await rutinaLocal.guardar(
      'usuario-prueba',
      asignarRutina({ experiencia: 'ninguna', diasPorSemana: 2, equipo: ['maquinas'] }),
    );
    const { findAllByText } = renderizar();

    expect((await findAllByText(/\d lb/)).length).toBeGreaterThan(0);
  });

  it('explica series y repeticiones con la ayuda del glosario', async () => {
    await rutinaLocal.guardar('usuario-prueba', asignarRutina({ experiencia: 'ninguna', diasPorSemana: 3, equipo: ['maquinas'] }));
    const { findByRole, getByRole } = renderizar();

    fireEvent.click(await findByRole('button', { name: '¿Qué es serie?' }));

    expect(getByRole('dialog')).toHaveTextContent(/grupo de repeticiones/i);
  });

  it('abre la ficha de un ejercicio desde la rutina', async () => {
    await rutinaLocal.guardar('usuario-prueba', asignarRutina({ experiencia: 'ninguna', diasPorSemana: 3, equipo: ['maquinas'] }));
    const { findAllByRole, findByText } = renderizar();

    const [primeraFicha] = await findAllByRole('button', { name: /^Ver la ficha de / });
    fireEvent.click(primeraFicha);

    expect(await findByText('ficha abierta')).toBeInTheDocument();
  });

  it('forma parte del flujo inicial obligatorio y no tiene botón atrás', async () => {
    await rutinaLocal.guardar(
      'usuario-prueba',
      asignarRutina({ experiencia: 'ninguna', diasPorSemana: 3, equipo: ['maquinas'] }),
    );
    const { container, findByRole } = renderizar();
    await findByRole('heading', { name: '3 días por semana' });
    expect(container.querySelector('ion-back-button')).toBeNull();
  });

  it('permite volver al cuestionario para cambiar la rutina', async () => {
    await rutinaLocal.guardar('usuario-prueba', asignarRutina({ experiencia: 'ninguna', diasPorSemana: 3, equipo: ['maquinas'] }));
    const { findByText } = renderizar();

    fireEvent.click(await findByText('Cambiar mi rutina'));

    expect(await findByText('cuestionario')).toBeInTheDocument();
  });
});
