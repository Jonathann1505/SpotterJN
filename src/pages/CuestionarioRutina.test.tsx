import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CuestionarioRutina from './CuestionarioRutina';
import { recordatoriosLocal, rutinaLocal } from '../repositories/local';
import { asignarRutina } from '../utils/rutina';

const sincronizarRecordatorios = vi.hoisted(() => vi.fn());

vi.mock('../services/recordatorios', () => ({ sincronizarRecordatorios }));

vi.mock('../context/SesionContext', () => ({
  useSesion: () => ({ sesion: { user: { id: 'usuario-prueba' } } }),
}));

function renderizar() {
  return render(
    <IonApp>
      <MemoryRouter initialEntries={['/cuestionario-rutina']}>
        <Route path="/cuestionario-rutina" component={CuestionarioRutina} />
        <Route path="/rutina">
          <p>rutina asignada</p>
        </Route>
      </MemoryRouter>
    </IonApp>,
  );
}

describe('CuestionarioRutina', () => {
  beforeEach(async () => {
    await Preferences.clear();
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('habilita "Ver mi rutina" solo con experiencia y equipo respondidos', () => {
    const { container, getByRole } = renderizar();
    const boton = container.querySelector('ion-button.sj-boton');

    expect(boton).toHaveAttribute('disabled');
    fireEvent.click(getByRole('radio', { name: 'Ninguna' }));
    expect(boton).toHaveAttribute('disabled');
    fireEvent.click(getByRole('checkbox', { name: 'Mancuernas' }));
    expect(boton).toHaveAttribute('disabled', 'false');
  });

  it('precarga las respuestas anteriores al cambiar de rutina', async () => {
    await rutinaLocal.guardar(
      'usuario-prueba',
      asignarRutina({ experiencia: 'mas-6-meses', diasPorSemana: 5, equipo: ['barra', 'poleas'] }),
    );
    const { findByRole, getByRole } = renderizar();

    await waitFor(() => expect(getByRole('radio', { name: 'Más de 6 meses' })).toHaveAttribute('aria-checked', 'true'));
    expect(getByRole('checkbox', { name: /Barra y discos/ })).toHaveAttribute('aria-checked', 'true');
    expect(getByRole('checkbox', { name: /Poleas/ })).toHaveAttribute('aria-checked', 'true');
    expect(getByRole('checkbox', { name: /Mancuernas/ })).toHaveAttribute('aria-checked', 'false');
    expect(await findByRole('status')).toHaveTextContent('5');
  });

  it('limita los días entre 2 y 6', () => {
    const { container, getByLabelText } = renderizar();
    const valor = container.querySelector('output') as HTMLElement;

    for (let i = 0; i < 5; i += 1) {
      fireEvent.click(getByLabelText('Más días'));
    }
    expect(valor).toHaveTextContent('6');
    expect(getByLabelText('Más días')).toHaveAttribute('disabled');

    for (let i = 0; i < 6; i += 1) {
      fireEvent.click(getByLabelText('Menos días'));
    }
    expect(valor).toHaveTextContent('2');
  });

  it('asigna, guarda la rutina y avanza', async () => {
    const { container, getByRole, findByText } = renderizar();

    fireEvent.click(getByRole('radio', { name: 'Menos de 6 meses' }));
    fireEvent.click(getByRole('checkbox', { name: 'Máquinas guiadas' }));
    fireEvent.click(container.querySelector('ion-button.sj-boton') as Element);

    expect(await findByText('rutina asignada')).toBeInTheDocument();
    await waitFor(async () => {
      const rutina = await rutinaLocal.obtener('usuario-prueba');
      expect(rutina?.cuestionario).toEqual({ experiencia: 'menos-6-meses', diasPorSemana: 3, equipo: ['maquinas'] });
      expect(rutina?.dias).toHaveLength(3);
    });
  });

  it('reprograma los recordatorios activos con los días de la nueva rutina', async () => {
    sincronizarRecordatorios.mockResolvedValue(undefined);
    await recordatoriosLocal.guardar('usuario-prueba', { activo: true, hora: '07:00' });
    const { container, getByRole, findByText } = renderizar();

    fireEvent.click(getByRole('radio', { name: 'Ninguna' }));
    fireEvent.click(getByRole('checkbox', { name: 'Mancuernas' }));
    fireEvent.click(container.querySelector('ion-button.sj-boton') as Element);

    expect(await findByText('rutina asignada')).toBeInTheDocument();
    await waitFor(() => expect(sincronizarRecordatorios).toHaveBeenCalledTimes(1));
    const [ajustes, rutina] = sincronizarRecordatorios.mock.calls[0];
    expect(ajustes).toEqual({ activo: true, hora: '07:00' });
    expect(rutina.cuestionario.diasPorSemana).toBe(3);
  });

  it('forma parte del flujo inicial obligatorio y no tiene botón atrás', async () => {
    const { container } = renderizar();
    expect(container.querySelector('ion-back-button')).toBeNull();
  });
});
