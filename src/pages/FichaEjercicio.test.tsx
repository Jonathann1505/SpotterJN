import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fichasVistasLocal, rutinaLocal } from '../repositories/local';
import { asignarRutina } from '../utils/rutina';
import FichaEjercicio from './FichaEjercicio';

function renderizar(ruta: string) {
  return render(
    <IonApp>
      <MemoryRouter initialEntries={['/hoy', ruta]} initialIndex={1}>
        <Route path="/ejercicio/:id" component={FichaEjercicio} />
        <Route path="/hoy">
          <p>pantalla hoy</p>
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
      asignarRutina({ experiencia: 'ninguna', diasPorSemana: 3, equipo: ['barra', 'maquinas'] }),
    );
    const { findByRole, getByText, getByTitle, container } = renderizar('/ejercicio/press-banca');

    expect(await findByRole('heading', { name: 'Press de banca' })).toBeInTheDocument();
    expect(getByText(/Primera vez con esta máquina/)).toBeInTheDocument();
    expect(getByText('1. Cómo ajustar la máquina')).toBeInTheDocument();
    expect(getByText('2. Cómo hacer el movimiento')).toBeInTheDocument();
    expect(getByText(/Zona de peso libre/)).toBeInTheDocument();
    expect(getByTitle(/Animación del ejercicio/)).toBeInTheDocument();
    expect(container.querySelector('.sj-eyebrow')).toHaveTextContent(/^Pecho/);
    expect(container.querySelector('ion-button.sj-boton')).toHaveTextContent('Listo, empezar series');
  });

  it('marca la ficha como vista al continuar', async () => {
    const { container, findByRole } = renderizar('/ejercicio/press-banca');
    await findByRole('heading', { name: 'Press de banca' });

    fireEvent.click(container.querySelector('ion-button.sj-boton') as Element);

    await waitFor(async () => {
      expect(await fichasVistasLocal.obtener()).toEqual(['press-banca']);
    });
  });

  it('no repite el aviso de primera vez cuando ya se vio y permite volver', async () => {
    await fichasVistasLocal.marcarVista('press-banca');
    const { container, findByRole, queryByText, findByText } = renderizar('/ejercicio/press-banca');

    await findByRole('heading', { name: 'Press de banca' });
    expect(queryByText(/Primera vez con esta máquina/)).not.toBeInTheDocument();
    expect(container.querySelector('ion-button.sj-boton')).toHaveTextContent('Entendido');

    fireEvent.click(container.querySelector('ion-button.sj-boton') as Element);
    expect(await findByText('pantalla hoy')).toBeInTheDocument();
  });

  it('usa una guía provisional si el ejercicio no tiene animación', async () => {
    const { findByRole, queryByTitle, getByText } = renderizar('/ejercicio/remo-maquina');

    expect(await findByRole('heading', { name: 'Remo en máquina' })).toBeInTheDocument();
    expect(queryByTitle(/Animación del ejercicio/)).not.toBeInTheDocument();
    expect(getByText(/estará disponible pronto/)).toBeInTheDocument();
  });

  it('redirige a Hoy si el ejercicio no existe', async () => {
    const { findByText } = renderizar('/ejercicio/no-existe');
    expect(await findByText('pantalla hoy')).toBeInTheDocument();
  });
});
