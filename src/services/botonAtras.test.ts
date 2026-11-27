import { beforeEach, describe, expect, it, vi } from 'vitest';

const app = vi.hoisted(() => ({
  esNativo: vi.fn(() => true),
  addListener: vi.fn(),
  exitApp: vi.fn(async () => undefined),
  remove: vi.fn(async () => undefined),
}));

vi.mock('@capacitor/core', async (importOriginal) => {
  const real = await importOriginal<typeof import('@capacitor/core')>();
  return { ...real, Capacitor: { isNativePlatform: app.esNativo } };
});

vi.mock('@capacitor/app', () => ({
  App: { addListener: app.addListener, exitApp: app.exitApp },
}));

import { PRIORIDAD_DIALOGO, activarBotonAtras, salirDeLaApp } from './botonAtras';

describe('servicio del botón atrás de Android', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    app.esNativo.mockReturnValue(true);
    app.addListener.mockResolvedValue({ remove: app.remove });
  });

  it('en Android escucha el botón físico para que llegue a Ionic', () => {
    activarBotonAtras();

    expect(app.addListener).toHaveBeenCalledWith('backButton', expect.any(Function));
  });

  it('al desactivarlo deja de escuchar el botón', async () => {
    const desactivar = activarBotonAtras();
    await vi.waitFor(() => expect(app.addListener).toHaveBeenCalled());
    await Promise.resolve();

    desactivar();

    await vi.waitFor(() => expect(app.remove).toHaveBeenCalled());
  });

  it('si se desactiva antes de registrarse, retira el oyente en cuanto llega', async () => {
    let entregar: (valor: { remove: () => Promise<void> }) => void = () => undefined;
    app.addListener.mockReturnValue(new Promise((resolver) => (entregar = resolver)));

    const desactivar = activarBotonAtras();
    desactivar();
    entregar({ remove: app.remove });

    await vi.waitFor(() => expect(app.remove).toHaveBeenCalled());
  });

  it('salirDeLaApp cierra la app en Android y no lanza errores si falla', async () => {
    await salirDeLaApp();
    expect(app.exitApp).toHaveBeenCalledTimes(1);

    app.exitApp.mockRejectedValueOnce(new Error('fallo'));
    await expect(salirDeLaApp()).resolves.toBeUndefined();
  });

  it('en la web no escucha el botón ni cierra nada', async () => {
    app.esNativo.mockReturnValue(false);

    activarBotonAtras()();
    await salirDeLaApp();

    expect(app.addListener).not.toHaveBeenCalled();
    expect(app.exitApp).not.toHaveBeenCalled();
  });

  it('los diálogos propios tienen prioridad sobre la navegación', () => {
    expect(PRIORIDAD_DIALOGO).toBe(100);
  });
});
