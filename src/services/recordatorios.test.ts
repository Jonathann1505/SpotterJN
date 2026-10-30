import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RutinaAsignada } from '../types/perfil';
import { asignarRutina } from '../utils/rutina';
import {
  MENSAJE_PERMISO,
  activarRecordatorios,
  desactivarRecordatorios,
  permisoDeNotificaciones,
  sincronizarRecordatorios,
} from './recordatorios';

const notificaciones = vi.hoisted(() => ({
  checkPermissions: vi.fn(),
  requestPermissions: vi.fn(),
  schedule: vi.fn(),
  cancel: vi.fn(),
}));

vi.mock('@capacitor/local-notifications', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('@capacitor/local-notifications')>()),
  LocalNotifications: notificaciones,
}));

const rutina: RutinaAsignada = asignarRutina({ experiencia: 'ninguna', diasPorSemana: 3, equipo: ['maquinas'] });

beforeEach(() => {
  notificaciones.checkPermissions.mockResolvedValue({ display: 'granted' });
  notificaciones.requestPermissions.mockResolvedValue({ display: 'granted' });
  notificaciones.schedule.mockResolvedValue(undefined);
  notificaciones.cancel.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('activarRecordatorios', () => {
  it('programa una notificación semanal en cada día de entrenamiento a la hora elegida', async () => {
    const resultado = await activarRecordatorios(3, '07:30');

    expect(resultado).toEqual({ ok: true });
    expect(notificaciones.cancel).toHaveBeenCalledTimes(1);
    const { notifications } = notificaciones.schedule.mock.calls[0][0] as {
      notifications: { id: number; schedule: { on: { weekday: number; hour: number; minute: number } } }[];
    };
    expect(notifications.map((n) => n.schedule.on.weekday)).toEqual([2, 4, 6]);
    expect(notifications.every((n) => n.schedule.on.hour === 7 && n.schedule.on.minute === 30)).toBe(true);
    expect(new Set(notifications.map((n) => n.id)).size).toBe(3);
  });

  it('pide el permiso cuando todavía no se ha decidido', async () => {
    notificaciones.checkPermissions.mockResolvedValue({ display: 'prompt' });

    expect(await activarRecordatorios(3, '18:00')).toEqual({ ok: true });
    expect(notificaciones.requestPermissions).toHaveBeenCalledTimes(1);
  });

  it('explica cómo activar las notificaciones si el permiso está denegado', async () => {
    notificaciones.checkPermissions.mockResolvedValue({ display: 'denied' });

    expect(await activarRecordatorios(3, '18:00')).toEqual({ ok: false, motivo: 'permiso', mensaje: MENSAJE_PERMISO });
    expect(notificaciones.schedule).not.toHaveBeenCalled();
    expect(notificaciones.requestPermissions).not.toHaveBeenCalled();
  });

  it('informa si el usuario rechaza el permiso al pedirlo', async () => {
    notificaciones.checkPermissions.mockResolvedValue({ display: 'prompt' });
    notificaciones.requestPermissions.mockResolvedValue({ display: 'denied' });

    expect(await activarRecordatorios(3, '18:00')).toMatchObject({ ok: false, motivo: 'permiso' });
    expect(notificaciones.schedule).not.toHaveBeenCalled();
  });

  it('rechaza una hora inválida sin tocar las notificaciones', async () => {
    expect(await activarRecordatorios(3, '25:00')).toMatchObject({ ok: false, motivo: 'hora' });
    expect(notificaciones.checkPermissions).not.toHaveBeenCalled();
  });

  it('informa de un error del plugin sin lanzarlo', async () => {
    notificaciones.schedule.mockRejectedValue(new Error('fallo nativo'));

    expect(await activarRecordatorios(3, '18:00')).toMatchObject({ ok: false, motivo: 'error' });
  });
});

describe('desactivarRecordatorios', () => {
  it('cancela las notificaciones de los siete días', async () => {
    expect(await desactivarRecordatorios()).toEqual({ ok: true });

    const { notifications } = notificaciones.cancel.mock.calls[0][0] as { notifications: { id: number }[] };
    expect(notifications).toHaveLength(7);
  });
});

describe('sincronizarRecordatorios', () => {
  it('cancela todo si los recordatorios están desactivados', async () => {
    await sincronizarRecordatorios({ activo: false, hora: '18:00' }, rutina);

    expect(notificaciones.cancel).toHaveBeenCalledTimes(1);
    expect(notificaciones.schedule).not.toHaveBeenCalled();
  });

  it('cancela todo si no hay rutina asignada', async () => {
    await sincronizarRecordatorios({ activo: true, hora: '18:00' }, null);

    expect(notificaciones.schedule).not.toHaveBeenCalled();
    expect(notificaciones.cancel).toHaveBeenCalledTimes(1);
  });

  it('reprograma según los días de la rutina cuando hay permiso', async () => {
    await sincronizarRecordatorios({ activo: true, hora: '19:45' }, rutina);

    expect(notificaciones.schedule).toHaveBeenCalledTimes(1);
    expect(notificaciones.requestPermissions).not.toHaveBeenCalled();
  });

  it('no programa ni pide permiso si no está concedido', async () => {
    notificaciones.checkPermissions.mockResolvedValue({ display: 'denied' });

    await sincronizarRecordatorios({ activo: true, hora: '19:45' }, rutina);

    expect(notificaciones.schedule).not.toHaveBeenCalled();
    expect(notificaciones.requestPermissions).not.toHaveBeenCalled();
  });

  it('no lanza errores si el plugin falla', async () => {
    notificaciones.checkPermissions.mockRejectedValue(new Error('sin plugin'));

    await expect(sincronizarRecordatorios({ activo: true, hora: '19:45' }, rutina)).resolves.toBeUndefined();
  });
});

describe('permisoDeNotificaciones', () => {
  it('normaliza el estado del permiso', async () => {
    notificaciones.checkPermissions.mockResolvedValue({ display: 'prompt-with-rationale' });
    expect(await permisoDeNotificaciones()).toBe('prompt');

    notificaciones.checkPermissions.mockResolvedValue({ display: 'denied' });
    expect(await permisoDeNotificaciones()).toBe('denied');
  });
});
