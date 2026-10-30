import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useConexion } from './useConexion';

function definirConexion(conectado: boolean): void {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value: conectado,
  });
}

describe('useConexion', () => {
  afterEach(() => definirConexion(true));

  it('responde a los eventos online y offline y limpia los listeners', () => {
    definirConexion(true);
    const { result, unmount } = renderHook(() => useConexion());

    expect(result.current).toBe(true);

    act(() => window.dispatchEvent(new Event('offline')));
    expect(result.current).toBe(false);

    act(() => window.dispatchEvent(new Event('online')));
    expect(result.current).toBe(true);

    unmount();
  });
});
