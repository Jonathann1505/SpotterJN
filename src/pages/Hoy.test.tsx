import { cleanup, fireEvent, render } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProveedorPerfil } from '../context/PerfilContext';
import { perfilLocal, rutinaLocal, saludLocal } from '../repositories/local';
import { asignarRutina } from '../utils/rutina';
import Hoy from './Hoy';

vi.mock('../services/auth', () => ({ cerrarSesion: vi.fn() }));

vi.mock('../context/SesionContext', () => ({
  useSesion: () => ({ sesion: { user: { id: 'usuario-prueba' } } }),
}));

function renderizar() {
  return render(
    <IonApp>
      <ProveedorPerfil>
        <MemoryRouter initialEntries={['/hoy']}>
          <Route path="/hoy" component={Hoy} />
          <Route path="/aviso-medico">
            <p>aviso médico</p>
          </Route>
          <Route path="/cuestionario-rutina">
            <p>cuestionario de rutina</p>
          </Route>
          <Route path="/sesion">
            <p>pantalla de sesión</p>
          </Route>
          <Route path="/ejercicio/:id">
            <p>ficha de ejercicio</p>
          </Route>
        </MemoryRouter>
      </ProveedorPerfil>
    </IonApp>,
  );
}

const salud = { condiciones: [], respondidoEn: '2026-10-09T10:00:00.000Z' };
const rutina = asignarRutina({ experiencia: 'ninguna', diasPorSemana: 3, equipo: ['maquinas'] });

describe('Hoy', () => {
  beforeEach(async () => {
    await Preferences.clear();
  });
  afterEach(cleanup);

  it('envía al aviso médico si no hay respuestas de salud', async () => {
    const { findByText } = renderizar();
    expect(await findByText('aviso médico')).toBeInTheDocument();
  });

  it('envía al cuestionario de rutina si no hay rutina asignada', async () => {
    await saludLocal.guardar('usuario-prueba', salud);
    const { findByText } = renderizar();
    expect(await findByText('cuestionario de rutina')).toBeInTheDocument();
  });

  it('muestra la próxima sesión con ejercicios, series y pesos', async () => {
    await saludLocal.guardar('usuario-prueba', salud);
    await rutinaLocal.guardar('usuario-prueba', rutina);
    const { findByRole, getAllByText, getByText } = renderizar();

    expect(await findByRole('heading', { name: rutina.dias[0].nombre })).toBeInTheDocument();
    expect(getAllByText('3x12').length).toBeGreaterThan(0);
    expect(getByText('Empezar entrenamiento')).toBeInTheDocument();
  });

  it('muestra los pesos en libras si el perfil usa lb', async () => {
    await saludLocal.guardar('usuario-prueba', salud);
    await rutinaLocal.guardar('usuario-prueba', rutina);
    await perfilLocal.guardar('usuario-prueba', { nombre: 'Nayeli', meta: 'fuerza', unidadPeso: 'lb' });
    const { findAllByText } = renderizar();

    expect((await findAllByText('lb', { exact: false, selector: 'small' })).length).toBeGreaterThan(0);
  });

  it('abre la ficha del ejercicio desde el botón de ayuda', async () => {
    await saludLocal.guardar('usuario-prueba', salud);
    await rutinaLocal.guardar('usuario-prueba', rutina);
    const { findByRole, findByText } = renderizar();

    const primero = rutina.dias[0].ejercicios[0];
    fireEvent.click(await findByRole('button', { name: `Ver la ficha de ${primero.nombre}` }));

    expect(await findByText('ficha de ejercicio')).toBeInTheDocument();
  });

  it('lleva a la sesión de entrenamiento al pulsar «Empezar entrenamiento»', async () => {
    await saludLocal.guardar('usuario-prueba', salud);
    await rutinaLocal.guardar('usuario-prueba', rutina);
    const { findByText } = renderizar();

    fireEvent.click(await findByText('Empezar entrenamiento'));

    expect(await findByText('pantalla de sesión')).toBeInTheDocument();
  });
});
