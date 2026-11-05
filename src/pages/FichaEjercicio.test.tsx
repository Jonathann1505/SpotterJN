import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fichasVistasLocal, rutinaLocal } from '../repositories/local';
import { asignarRutina } from '../utils/rutina';
import FichaEjercicio from './FichaEjercicio';

vi.mock('../context/SesionContext', () => ({
  useSesion: () => ({ sesion: { user: { id: 'usuario-prueba' } } }),
}));

function renderizar(ruta: string) {
  return render(
    <IonApp>
      <MemoryRouter initialEntries={['/hoy', ruta]} initialIndex={1}>
        <Route path="/ejercicio/:id" component={FichaEjercicio} />
        <Route path="/hoy">
          <p>pantalla hoy</p>
        </Route>
        <Route path="/sesion">
          <p>pantalla de sesión</p>
        </Route>
      </MemoryRouter>
    </IonApp>,
  );
}

describe('FichaEjercicio', () => {
  beforeEach(async () => {
    await Preferences.clear();
  });
  afterEach(cleanup);

  it('muestra la ficha completa la primera vez', async () => {
    await rutinaLocal.guardar(
      'usuario-prueba',
      asignarRutina({ experiencia: 'ninguna', diasPorSemana: 3, equipo: ['barra', 'maquinas'] }),
    );
    const { findByRole, getByText, getByTitle, container } = renderizar('/ejercicio/press-banca');

    expect(await findByRole('heading', { name: 'Press de banca' })).toBeInTheDocument();
    expect(getByText(/Primera vez con este ejercicio/)).toBeInTheDocument();
    expect(getByText('1. Cómo preparar el equipo')).toBeInTheDocument();
    expect(getByText('2. Cómo hacer el movimiento')).toBeInTheDocument();
    expect(getByText(/Zona de peso libre/)).toBeInTheDocument();
    expect(getByTitle(/Animación del ejercicio/)).toBeInTheDocument();
    expect(container.querySelector('.sj-eyebrow')).toHaveTextContent(/^Pecho/);
    expect(container.querySelector('ion-button.sj-boton')).toHaveTextContent('Listo, empezar series');
  });

  it('marca la ficha como vista al continuar y lleva a la sesión', async () => {
    const { container, findByRole, findByText } = renderizar('/ejercicio/press-banca');
    await findByRole('heading', { name: 'Press de banca' });

    fireEvent.click(container.querySelector('ion-button.sj-boton') as Element);

    expect(await findByText('pantalla de sesión')).toBeInTheDocument();
    await waitFor(async () => {
      expect(await fichasVistasLocal.obtener('usuario-prueba')).toEqual(['press-banca']);
    });
  });

  it('no repite el aviso de primera vez cuando ya se vio y permite volver', async () => {
    await fichasVistasLocal.marcarVista('usuario-prueba', 'press-banca');
    const { container, findByRole, queryByText, findByText } = renderizar('/ejercicio/press-banca');

    await findByRole('heading', { name: 'Press de banca' });
    expect(queryByText(/Primera vez con/)).not.toBeInTheDocument();
    expect(container.querySelector('ion-button.sj-boton')).toHaveTextContent('Entendido');

    fireEvent.click(container.querySelector('ion-button.sj-boton') as Element);
    expect(await findByText('pantalla hoy')).toBeInTheDocument();
  });

  it('muestra la guía y un aviso si el ejercicio todavía no tiene animación', async () => {
    const { findByRole, queryByTitle, getByText } = renderizar('/ejercicio/remo-maquina');

    expect(await findByRole('heading', { name: 'Remo en máquina' })).toBeInTheDocument();
    expect(queryByTitle(/Animación del ejercicio/)).not.toBeInTheDocument();
    expect(getByText('Animación próximamente')).toBeInTheDocument();
    expect(getByText(/Ajusta el asiento para que las asas/)).toBeInTheDocument();
  });

  it('muestra el video de un ejercicio con animación en MP4', async () => {
    const { findByRole, container, queryByText } = renderizar('/ejercicio/flexiones');

    expect(await findByRole('heading', { name: 'Flexiones' })).toBeInTheDocument();
    expect(container.querySelector('video')?.getAttribute('src')).toBe('/ejercicios/flexiones.mp4');
    expect(queryByText('Animación próximamente')).not.toBeInTheDocument();
  });

  it('habla de «máquina» solo en ejercicios de máquina o polea', async () => {
    const { findByRole, getByText } = renderizar('/ejercicio/remo-maquina');

    await findByRole('heading', { name: 'Remo en máquina' });
    expect(getByText(/Primera vez con esta máquina/)).toBeInTheDocument();
    expect(getByText('1. Cómo ajustar la máquina')).toBeInTheDocument();
  });

  it('usa «prepararte» y «este ejercicio» en los ejercicios de peso corporal', async () => {
    const { findByRole, getByText, queryByText } = renderizar('/ejercicio/zancadas');

    await findByRole('heading', { name: 'Zancadas' });
    expect(getByText(/Primera vez con este ejercicio/)).toBeInTheDocument();
    expect(getByText('1. Cómo prepararte')).toBeInTheDocument();
    expect(queryByText(/máquina/i, { selector: 'h2' })).not.toBeInTheDocument();
  });

  it('redirige a Hoy si el ejercicio no existe', async () => {
    const { findByText } = renderizar('/ejercicio/no-existe');
    expect(await findByText('pantalla hoy')).toBeInTheDocument();
  });
});
