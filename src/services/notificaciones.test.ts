import { Preferences } from '@capacitor/preferences';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CANAL_AVISO_DESCANSO,
  CLAVE_PERMISO_PREGUNTADO,
  ID_AVISO_DESCANSO,
  cancelarAvisoDescanso,
  estadoAvisoDescanso,
  pedirPermisoAvisoDescanso,
  programarAvisoDescanso,
} from './notificaciones';

const mocks = vi.hoisted(() => ({
  esNativo: vi.fn(() => true),
  checkPermissions: vi.fn(async () => ({ display: 'granted' })),
  requestPermissions: vi.fn(async () => ({ display: 'granted' })),
  schedule: vi.fn(async () => ({ notifications: [] })),
  cancel: vi.fn(async () => undefined),
  removeDeliveredNotifications: vi.fn(async () => undefined),
  createChannel: vi.fn(async () => undefined),
}));

vi.mock('@capacitor/core', async (importOriginal) => {
  const real = await importOriginal<typeof import('@capacitor/core')>();
  return { ...real, Capacitor: { isNativePlatform: mocks.esNativo } };
});

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    checkPermissions: mocks.checkPermissions,
    requestPermissions: mocks.requestPermissions,
    schedule: mocks.schedule,
    cancel: mocks.cancel,
    removeDeliveredNotifications: mocks.removeDeliveredNotifications,
    createChannel: mocks.createChannel,
  },
}));

const enUnMinuto = (): Date => new Date(Date.now() + 60_000);

describe('servicio del aviso de fin de descanso (RF-11)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mocks.esNativo.mockReturnValue(true);
    mocks.checkPermissions.mockResolvedValue({ display: 'granted' });
    mocks.cancel.mockResolvedValue(undefined);
    mocks.schedule.mockResolvedValue({ notifications: [] });
    mocks.createChannel.mockResolvedValue(undefined);
    await Preferences.clear();
  });

  describe('en la web', () => {
    beforeEach(() => {
      mocks.esNativo.mockReturnValue(false);
    });

    it('no llama al plugin para nada', async () => {
      expect(await estadoAvisoDescanso()).toBe('no-disponible');
      expect(await pedirPermisoAvisoDescanso(true)).toBe(false);
      await programarAvisoDescanso(enUnMinuto(), 'Descanso terminado.');
      await cancelarAvisoDescanso();

      for (const funcion of Object.values(mocks).filter((f) => f !== mocks.esNativo)) {
        expect(funcion).not.toHaveBeenCalled();
      }
    });
  });

  it('programa el aviso para la hora exacta de fin, reemplazando el anterior', async () => {
    const fin = enUnMinuto();
    await programarAvisoDescanso(fin, 'Descanso terminado. Vamos con la serie 2 de 3.');

    expect(mocks.cancel).toHaveBeenCalledWith({ notifications: [{ id: ID_AVISO_DESCANSO }] });
    expect(mocks.schedule).toHaveBeenCalledWith({
      notifications: [
        expect.objectContaining({
          id: ID_AVISO_DESCANSO,
          body: 'Descanso terminado. Vamos con la serie 2 de 3.',
          schedule: { at: fin, allowWhileIdle: true },
        }),
      ],
    });
  });

  it('envía el aviso por un canal de importancia alta para que salte en pantalla', async () => {
    await programarAvisoDescanso(enUnMinuto(), 'Descanso terminado.');

    expect(mocks.createChannel).toHaveBeenCalledWith(
      expect.objectContaining({ id: CANAL_AVISO_DESCANSO, importance: 5, vibration: true }),
    );
    expect(mocks.schedule).toHaveBeenCalledWith({
      notifications: [expect.objectContaining({ channelId: CANAL_AVISO_DESCANSO })],
    });
  });

  it('si no se puede crear el canal, programa el aviso igual por el canal por defecto', async () => {
    mocks.createChannel.mockRejectedValueOnce(new Error('fallo'));
    await programarAvisoDescanso(enUnMinuto(), 'Descanso terminado.');

    expect(mocks.schedule).toHaveBeenCalledWith({
      notifications: [expect.not.objectContaining({ channelId: expect.anything() })],
    });
  });

  it('no programa nada sin permiso ni para una hora que ya pasó', async () => {
    mocks.checkPermissions.mockResolvedValue({ display: 'denied' });
    await programarAvisoDescanso(enUnMinuto(), 'x');

    mocks.checkPermissions.mockResolvedValue({ display: 'granted' });
    await programarAvisoDescanso(new Date(Date.now() - 1000), 'x');

    expect(mocks.schedule).not.toHaveBeenCalled();
  });

  it('si el plugin falla no lanza errores', async () => {
    mocks.schedule.mockRejectedValueOnce(new Error('fallo'));
    await expect(programarAvisoDescanso(enUnMinuto(), 'x')).resolves.toBeUndefined();

    mocks.cancel.mockRejectedValueOnce(new Error('fallo'));
    await expect(cancelarAvisoDescanso()).resolves.toBeUndefined();

    mocks.checkPermissions.mockRejectedValueOnce(new Error('fallo'));
    await expect(estadoAvisoDescanso()).resolves.toBe('no-disponible');

    mocks.requestPermissions.mockRejectedValueOnce(new Error('fallo'));
    await expect(pedirPermisoAvisoDescanso(true)).resolves.toBe(false);
  });

  describe('aviso anterior que sigue en la barra de notificaciones', () => {
    it('lo retira antes de programar el nuevo para que el nuevo suene', async () => {
      await programarAvisoDescanso(enUnMinuto(), 'Descanso terminado.');

      expect(mocks.removeDeliveredNotifications).toHaveBeenCalledWith({
        notifications: [expect.objectContaining({ id: ID_AVISO_DESCANSO })],
      });
      const retirado = mocks.removeDeliveredNotifications.mock.invocationCallOrder[0];
      const programado = mocks.schedule.mock.invocationCallOrder[0];
      expect(retirado).toBeLessThan(programado);
    });

    it('programa el aviso aunque no se pueda retirar el anterior', async () => {
      mocks.removeDeliveredNotifications.mockRejectedValueOnce(new Error('fallo'));

      await programarAvisoDescanso(enUnMinuto(), 'Descanso terminado.');

      expect(mocks.schedule).toHaveBeenCalledTimes(1);
    });

    it('no toca la barra de notificaciones si no hay permiso o no es un móvil', async () => {
      mocks.checkPermissions.mockResolvedValue({ display: 'denied' });
      await programarAvisoDescanso(enUnMinuto(), 'Descanso terminado.');
      mocks.checkPermissions.mockResolvedValue({ display: 'granted' });
      mocks.esNativo.mockReturnValue(false);
      await programarAvisoDescanso(enUnMinuto(), 'Descanso terminado.');

      expect(mocks.removeDeliveredNotifications).not.toHaveBeenCalled();
    });
  });

  it('cancela el aviso pendiente y retira el ya mostrado', async () => {
    await cancelarAvisoDescanso();

    expect(mocks.cancel).toHaveBeenCalledWith({ notifications: [{ id: ID_AVISO_DESCANSO }] });
    expect(mocks.removeDeliveredNotifications).toHaveBeenCalledWith({
      notifications: [expect.objectContaining({ id: ID_AVISO_DESCANSO })],
    });
  });

  describe('permiso', () => {
    it('ofrece preguntar si el sistema aún no decidió y nunca se preguntó', async () => {
      mocks.checkPermissions.mockResolvedValue({ display: 'prompt' });

      expect(await estadoAvisoDescanso()).toBe('preguntar');
    });

    it('si la persona dice «Ahora no» no pide el permiso del sistema ni vuelve a preguntar', async () => {
      mocks.checkPermissions.mockResolvedValue({ display: 'prompt' });

      expect(await pedirPermisoAvisoDescanso(false)).toBe(false);

      expect(mocks.requestPermissions).not.toHaveBeenCalled();
      expect((await Preferences.get({ key: CLAVE_PERMISO_PREGUNTADO })).value).toBe('si');
      expect(await estadoAvisoDescanso()).toBe('no-disponible');
    });

    it('si acepta pide el permiso del sistema y queda concedido', async () => {
      expect(await pedirPermisoAvisoDescanso(true)).toBe(true);
      expect(mocks.requestPermissions).toHaveBeenCalledTimes(1);
    });

    it('con el permiso denegado no vuelve a preguntar', async () => {
      mocks.checkPermissions.mockResolvedValue({ display: 'denied' });

      expect(await estadoAvisoDescanso()).toBe('no-disponible');
    });
  });
});
