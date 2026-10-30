import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { recordatoriosLocal, rutinaLocal } from '../repositories/local';
import { MENSAJE_PERMISO } from '../services/recordatorios';
import { asignarRutina } from '../utils/rutina';
import Ajustes from './Ajustes';

const servicio = vi.hoisted(() => ({
  activarRecordatorios: vi.fn(),
  desactivarRecordatorios: vi.fn(),
  permisoDeNotificaciones: vi.fn(),
  sincronizarRecordatorios: vi.fn(),
}));

vi.mock('../context/SesionContext', () => ({
  useSesion: () => ({ sesion: { user: { id: 'usuario-prueba' } } }),
}));

vi.mock('../services/recordatorios', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../services/recordatorios')>()),
  ...servicio,
}));

function renderizar() {
  return render(
    <IonApp>
      <MemoryRouter initialEntries={['/perfil', '/ajustes']} initialIndex={1}>
        <Route path="/ajustes" component={Ajustes} />
        <Route path="/perfil">
          <p>pantalla perfil</p>
        </Route>
        <Route path="/cuestionario-rutina">
          <p>cuestionario de rutina</p>
        </Route>
      </MemoryRouter>
    </IonApp>,
  );
}

describe('Ajustes de recordatorios', () => {
  beforeEach(async () => {
    await Preferences.clear();
    servicio.activarRecordatorios.mockResolvedValue({ ok: true });
    servicio.desactivarRecordatorios.mockResolvedValue({ ok: true });
    servicio.permisoDeNotificaciones.mockResolvedValue('prompt');
    servicio.sincronizarRecordatorios.mockResolvedValue(undefined);
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  async function conRutina() {
    await rutinaLocal.guardar('usuario-prueba', asignarRutina({ experiencia: 'ninguna', diasPorSemana: 3, equipo: ['maquinas'] }));
  }

  it('pide crear una rutina si todavía no hay una', async () => {
    const { findByText, container } = renderizar();

    expect(await findByText(/primero necesitas una rutina/i)).toBeInTheDocument();
    fireEvent.click(container.querySelector('ion-button.sj-boton') as Element);
    expect(await findByText('cuestionario de rutina')).toBeInTheDocument();
  });

  it('muestra los días de entrenamiento y los recordatorios desactivados por defecto', async () => {
    await conRutina();
    const { findByRole, getByText, getByLabelText } = renderizar();

    const interruptor = await findByRole('switch', { name: /recordarme entrenar/i });
    expect(interruptor).toHaveAttribute('aria-checked', 'false');
    expect(getByText('lunes, miércoles y viernes')).toBeInTheDocument();
    expect(getByLabelText('Hora del recordatorio')).toHaveValue('18:00');
    expect(servicio.sincronizarRecordatorios).toHaveBeenCalledTimes(1);
  });

  it('activa los recordatorios y guarda los ajustes', async () => {
    await conRutina();
    const { findByRole } = renderizar();

    fireEvent.click(await findByRole('switch', { name: /recordarme entrenar/i }));

    await waitFor(() => expect(servicio.activarRecordatorios).toHaveBeenCalledWith(3, '18:00'));
    await waitFor(async () => expect(await recordatoriosLocal.obtener('usuario-prueba')).toEqual({ activo: true, hora: '18:00' }));
    expect(await findByRole('switch', { name: /recordarme entrenar/i })).toHaveAttribute('aria-checked', 'true');
  });

  it('explica cómo activar las notificaciones si no se concede el permiso', async () => {
    await conRutina();
    servicio.activarRecordatorios.mockResolvedValue({ ok: false, motivo: 'permiso', mensaje: MENSAJE_PERMISO });
    const { findByRole } = renderizar();

    fireEvent.click(await findByRole('switch', { name: /recordarme entrenar/i }));

    expect(await findByRole('alert')).toHaveTextContent(/activa las notificaciones/i);
    expect(await findByRole('switch', { name: /recordarme entrenar/i })).toHaveAttribute('aria-checked', 'false');
    expect(await recordatoriosLocal.obtener('usuario-prueba')).toEqual({ activo: false, hora: '18:00' });
  });

  it('muestra el aviso desde el inicio si las notificaciones están bloqueadas en el sistema', async () => {
    await conRutina();
    servicio.permisoDeNotificaciones.mockResolvedValue('denied');
    const { findByRole } = renderizar();

    expect(await findByRole('alert')).toHaveTextContent(/activa las notificaciones/i);
  });

  it('guarda la hora sin programar nada mientras los recordatorios estén desactivados', async () => {
    await conRutina();
    const { findByLabelText } = renderizar();

    fireEvent.change(await findByLabelText('Hora del recordatorio'), { target: { value: '06:45' } });

    await waitFor(async () => expect(await recordatoriosLocal.obtener('usuario-prueba')).toEqual({ activo: false, hora: '06:45' }));
    expect(servicio.activarRecordatorios).not.toHaveBeenCalled();
  });

  it('reprograma con la nueva hora cuando los recordatorios están activos', async () => {
    await conRutina();
    await recordatoriosLocal.guardar('usuario-prueba', { activo: true, hora: '18:00' });
    const { findByLabelText } = renderizar();

    fireEvent.change(await findByLabelText('Hora del recordatorio'), { target: { value: '07:10' } });

    await waitFor(() => expect(servicio.activarRecordatorios).toHaveBeenCalledWith(3, '07:10'));
    await waitFor(async () => expect(await recordatoriosLocal.obtener('usuario-prueba')).toEqual({ activo: true, hora: '07:10' }));
  });

  it('desactiva y cancela las notificaciones', async () => {
    await conRutina();
    await recordatoriosLocal.guardar('usuario-prueba', { activo: true, hora: '18:00' });
    const { findByRole } = renderizar();

    fireEvent.click(await findByRole('switch', { name: /recordarme entrenar/i }));

    await waitFor(() => expect(servicio.desactivarRecordatorios).toHaveBeenCalledTimes(1));
    await waitFor(async () => expect(await recordatoriosLocal.obtener('usuario-prueba')).toEqual({ activo: false, hora: '18:00' }));
  });
});
