import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { Preferences } from '@capacitor/preferences';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route } from 'react-router-dom';
import { ProveedorPerfil } from '../context/PerfilContext';
import { rutinaLocal } from '../repositories/local';
import { asignarRutina } from '../utils/rutina';
import SesionEntrenamiento from './SesionEntrenamiento';

vi.mock('../context/SesionContext', () => ({
  useSesion: () => ({ sesion: { user: { id: 'usuario-prueba' } } }),
}));

function pulsarBotonVolver(contenedor: HTMLElement): void {
  const boton = contenedor.querySelector('ion-button.sj-boton-secundario');
  if (!boton) {
    throw new Error('No se encontró el botón Volver.');
  }
  fireEvent.click(boton);
}

function renderizar() {
  return render(
    <IonApp>
      <ProveedorPerfil>
        <MemoryRouter initialEntries={['/sesion']}>
          <Route exact path="/sesion" component={SesionEntrenamiento} />
          <Route exact path="/hoy">
            <h1>Hoy</h1>
          </Route>
          <Route exact path="/cuestionario-rutina">
            <h1>Cuestionario de rutina</h1>
          </Route>
        </MemoryRouter>
      </ProveedorPerfil>
    </IonApp>,
  );
}

describe('SesionEntrenamiento', () => {
  beforeEach(async () => {
    await Preferences.clear();
  });

  afterEach(cleanup);

  it('muestra los ejercicios de la primera jornada de la rutina', async () => {
    const rutina = asignarRutina({
      experiencia: 'ninguna',
      diasPorSemana: 3,
      equipo: ['maquinas'],
    });
    await rutinaLocal.guardar('usuario-prueba', rutina);

    const { container } = renderizar();

    expect(await screen.findByRole('heading', { name: rutina.dias[0].nombre })).toBeInTheDocument();
    expect(screen.getByText(rutina.dias[0].ejercicios[0].nombre)).toBeInTheDocument();
    expect(screen.getAllByText(/series/)).toHaveLength(rutina.dias[0].ejercicios.length);
    expect(container.querySelector('ion-button.sj-boton-secundario')).toHaveTextContent('Volver');
  });

  it('vuelve a Hoy sin registrar la sesión', async () => {
    const rutina = asignarRutina({
      experiencia: 'ninguna',
      diasPorSemana: 2,
      equipo: ['maquinas'],
    });
    await rutinaLocal.guardar('usuario-prueba', rutina);

    const { container } = render(
      <IonApp>
        <ProveedorPerfil>
          <MemoryRouter initialEntries={['/sesion']}>
            <Route exact path="/sesion" component={SesionEntrenamiento} />
            <Route exact path="/hoy">
              <h1>Hoy</h1>
            </Route>
          </MemoryRouter>
        </ProveedorPerfil>
      </IonApp>,
    );

    await screen.findByRole('heading', { name: rutina.dias[0].nombre });
    pulsarBotonVolver(container);

    expect(await screen.findByRole('heading', { name: 'Hoy' })).toBeInTheDocument();
    expect(await rutinaLocal.obtener('usuario-prueba')).toEqual(rutina);
  });

  it('redirige al cuestionario si no existe rutina', async () => {
    renderizar();

    expect(await screen.findByRole('heading', { name: 'Cuestionario de rutina' })).toBeInTheDocument();
  });
});
