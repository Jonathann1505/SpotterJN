import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PRIORIDAD_DIALOGO, PRIORIDAD_NAVEGACION } from '../services/botonAtras';
import { useCerrarConBotonAtras } from './useCerrarConBotonAtras';

interface Registro {
  prioridad: number;
  manejador: () => void;
}

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

describe('useCerrarConBotonAtras', () => {
  afterEach(cleanup);

  it('con el diálogo abierto, el botón atrás lo cierra antes que cambiar de pantalla', () => {
    const cerrar = vi.fn();
    renderHook(() => useCerrarConBotonAtras(true, cerrar));

    const registros = pulsarAtras();
    expect(registros).toHaveLength(1);
    expect(registros[0].prioridad).toBe(PRIORIDAD_DIALOGO);
    expect(PRIORIDAD_DIALOGO).toBeGreaterThan(PRIORIDAD_NAVEGACION);

    act(() => registros[0].manejador());
    expect(cerrar).toHaveBeenCalledTimes(1);
  });

  it('con el diálogo cerrado no registra nada', () => {
    renderHook(() => useCerrarConBotonAtras(false, vi.fn()));

    expect(pulsarAtras()).toEqual([]);
  });

  it('deja de escuchar al cerrarse el diálogo', () => {
    const { rerender } = renderHook(({ abierto }) => useCerrarConBotonAtras(abierto, vi.fn()), {
      initialProps: { abierto: true },
    });

    rerender({ abierto: false });

    expect(pulsarAtras()).toEqual([]);
  });
});
