import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const app = vi.hoisted(() => ({
  addListener: vi.fn(),
  exitApp: vi.fn(),
  minimizeApp: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: app.addListener,
    exitApp: app.exitApp,
    minimizeApp: app.minimizeApp,
  },
}));

import {
  PRIORIDAD_NAVEGACION,
  activarBotonAtrasAndroid,
  botonAtrasVisible,
  volverComoEnPantalla,
} from './botonAtras';

interface Registro {
  prioridad: number;
  manejador: () => void;
}

/** Simula la pulsación del botón atrás tal como la despacha Ionic y devuelve lo registrado. */
function pulsarAtras(): Registro[] {
  const registros: Registro[] = [];
  document.dispatchEvent(
    new CustomEvent('ionBackButton', {
      detail: {
        register: (prioridad: number, manejador: () => void) => registros.push({ prioridad, manejador }),
      },
    }),
  );
  return registros;
}

/** Ejecuta el manejador de mayor prioridad, como hace Ionic. */
function ejecutarElPrioritario(registros: Registro[]): void {
  const [primero] = [...registros].sort((a, b) => b.prioridad - a.prioridad);
  primero?.manejador();
}

function pagina(clase: string, conBotonAtras: boolean): { pagina: HTMLElement; boton: HTMLElement | null } {
  const elemento = document.createElement('div');
  elemento.className = clase;
  let boton: HTMLElement | null = null;
  if (conBotonAtras) {
    boton = document.createElement('ion-back-button');
    elemento.appendChild(boton);
  }
  document.body.appendChild(elemento);
  return { pagina: elemento, boton };
}

describe('botón atrás de Android', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    app.addListener.mockReset().mockResolvedValue({ remove: app.remove });
    app.remove.mockReset().mockResolvedValue(undefined);
    app.exitApp.mockReset();
    app.minimizeApp.mockReset();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('toma el botón atrás de la página visible e ignora las ocultas por Ionic', () => {
    const oculta = pagina('ion-page ion-page-hidden', true);
    const visible = pagina('ion-page', true);

    expect(botonAtrasVisible()).toBe(visible.boton);
    expect(botonAtrasVisible()).not.toBe(oculta.boton);
  });

  it('vuelve pulsando el botón atrás de la pantalla', () => {
    const { boton } = pagina('ion-page', true);
    const clic = vi.fn();
    boton?.addEventListener('click', clic);

    expect(volverComoEnPantalla()).toBe(true);
    expect(clic).toHaveBeenCalledTimes(1);
  });

  it('en una pantalla sin botón atrás no hace nada', () => {
    pagina('ion-page', false);

    expect(volverComoEnPantalla()).toBe(false);
  });

  it('en Android escucha el botón y vuelve como en pantalla, por encima del router', async () => {
    const desactivar = activarBotonAtrasAndroid(true);
    const { boton } = pagina('ion-page', true);
    const clic = vi.fn();
    boton?.addEventListener('click', clic);

    expect(app.addListener).toHaveBeenCalledWith('backButton', expect.any(Function));
    const registros = pulsarAtras();
    expect(registros.map((r) => r.prioridad)).toEqual([PRIORIDAD_NAVEGACION]);
    // Ionic React registra el router con prioridad 0: este manejo debe ganarle.
    expect(PRIORIDAD_NAVEGACION).toBeGreaterThan(0);

    ejecutarElPrioritario(registros);
    expect(clic).toHaveBeenCalledTimes(1);

    desactivar();
    await vi.waitFor(() => expect(app.remove).toHaveBeenCalled());
  });

  it('en una pantalla raíz nunca cierra ni minimiza la app', () => {
    const desactivar = activarBotonAtrasAndroid(true);
    pagina('ion-page', false);

    ejecutarElPrioritario(pulsarAtras());

    expect(app.exitApp).not.toHaveBeenCalled();
    expect(app.minimizeApp).not.toHaveBeenCalled();
    desactivar();
  });

  it('al desactivarlo deja de manejar el botón', () => {
    const desactivar = activarBotonAtrasAndroid(true);
    desactivar();

    expect(pulsarAtras()).toEqual([]);
  });

  it('en la web no registra nada', () => {
    const desactivar = activarBotonAtrasAndroid(false);

    expect(app.addListener).not.toHaveBeenCalled();
    expect(pulsarAtras()).toEqual([]);
    desactivar();
  });
});
