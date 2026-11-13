import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProveedorPerfil } from '../context/PerfilContext';
import { perfilLocal } from '../repositories/local';
import Perfil from './Perfil';
import { botonAtras } from '../test/navegacion';

vi.mock('../services/auth', () => ({ cerrarSesion: vi.fn() }));

vi.mock('../context/SesionContext', () => ({
  useSesion: () => ({ sesion: { user: { id: 'usuario-prueba' } } }),
}));

function escribirNombre(contenedor: HTMLElement, valor: string): void {
  const campo = contenedor.querySelector('ion-input') as Element;
  fireEvent(campo, new CustomEvent('ionInput', { bubbles: true, detail: { value: valor } }));
}

function renderizar() {
  return render(
    <IonApp>
      <ProveedorPerfil>
        <MemoryRouter initialEntries={['/perfil']}>
          <Route path="/perfil" component={Perfil} />
          <Route path="/rutina">
            <p>pantalla rutina</p>
          </Route>
        </MemoryRouter>
      </ProveedorPerfil>
    </IonApp>,
  );
}

describe('Perfil', () => {
  beforeEach(async () => {
    await Preferences.clear();
  });
  afterEach(cleanup);

  it('no guarda un nombre vacío y muestra el error', async () => {
    const { container, findByRole } = renderizar();

    fireEvent.click(container.querySelector('ion-button.sj-boton') as Element);

    expect(await findByRole('alert')).toHaveTextContent(/nombre es obligatorio/i);
    expect(await perfilLocal.obtener('usuario-prueba')).toBeNull();
  });

  it('no guarda un nombre de más de 40 caracteres', async () => {
    const { container, findByRole } = renderizar();

    escribirNombre(container, 'a'.repeat(41));
    fireEvent.click(container.querySelector('ion-button.sj-boton') as Element);

    expect(await findByRole('alert')).toBeInTheDocument();
    expect(await perfilLocal.obtener('usuario-prueba')).toBeNull();
  });

  it('guarda nombre y meta', async () => {
    const { container, getByRole, findByRole } = renderizar();

    escribirNombre(container, '  Nayeli  ');
    fireEvent.click(getByRole('radio', { name: 'Tonificar' }));
    fireEvent.click(container.querySelector('ion-button.sj-boton') as Element);

    expect(await findByRole('status')).toHaveTextContent('Perfil actualizado.');
    expect(await perfilLocal.obtener('usuario-prueba')).toEqual({
      nombre: 'Nayeli',
      meta: 'tonificar',
      unidadPeso: 'kg',
    });
  });

  it('cambia la unidad de peso de inmediato', async () => {
    const { getByRole } = renderizar();

    await act(async () => {
      fireEvent.click(getByRole('radio', { name: 'lb' }));
    });

    await waitFor(async () => {
      expect((await perfilLocal.obtener('usuario-prueba'))?.unidadPeso).toBe('lb');
    });
  });

  it('abre la rutina asignada desde el botón «Mi rutina»', async () => {
    const { findByText } = renderizar();

    fireEvent.click(await findByText('Mi rutina'));

    expect(await findByText('pantalla rutina')).toBeInTheDocument();
  });

  it('usa el encabezado con atrás hacia Hoy en lugar del botón Volver', async () => {
    const { container, queryByText } = renderizar();
    expect(botonAtras(container)).toHaveAttribute('default-href', '/hoy');
    expect(queryByText('Volver')).not.toBeInTheDocument();
  });
});
