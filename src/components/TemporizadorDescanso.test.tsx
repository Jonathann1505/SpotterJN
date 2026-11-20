import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TemporizadorDescanso from './TemporizadorDescanso';

describe('TemporizadorDescanso', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('inicia automáticamente en 90 segundos y cuenta hacia atrás', () => {
    vi.useFakeTimers();
    render(<TemporizadorDescanso />);

    expect(screen.getByRole('timer')).toHaveAttribute('aria-label', 'Tiempo restante 01:30');

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByRole('timer')).toHaveAttribute('aria-label', 'Tiempo restante 01:27');
  });

  it('suma y resta 30 segundos', () => {
    vi.useFakeTimers();
    render(<TemporizadorDescanso />);

    fireEvent.click(screen.getByRole('button', { name: 'Sumar 30 segundos' }));
    expect(screen.getByRole('timer')).toHaveAttribute('aria-label', 'Tiempo restante 02:00');

    fireEvent.click(screen.getByRole('button', { name: 'Restar 30 segundos' }));
    expect(screen.getByRole('timer')).toHaveAttribute('aria-label', 'Tiempo restante 01:30');
  });

  it('saltar termina la cuenta y sumar tiempo la inicia de nuevo', () => {
    vi.useFakeTimers();
    render(<TemporizadorDescanso />);

    fireEvent.click(screen.getByRole('button', { name: 'Saltar descanso' }));
    expect(screen.getByRole('timer')).toHaveAttribute('aria-label', 'Tiempo restante 00:00');
    expect(screen.getByText('Descanso terminado')).toHaveAttribute('role', 'status');

    fireEvent.click(screen.getByRole('button', { name: 'Sumar 30 segundos' }));
    expect(screen.getByRole('timer')).toHaveAttribute('aria-label', 'Tiempo restante 00:30');

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByRole('timer')).toHaveAttribute('aria-label', 'Tiempo restante 00:29');
  });

  it('no permite reducir el tiempo por debajo de cero', () => {
    vi.useFakeTimers();
    render(<TemporizadorDescanso />);

    fireEvent.click(screen.getByRole('button', { name: 'Restar 30 segundos' }));
    fireEvent.click(screen.getByRole('button', { name: 'Restar 30 segundos' }));
    fireEvent.click(screen.getByRole('button', { name: 'Restar 30 segundos' }));
    fireEvent.click(screen.getByRole('button', { name: 'Restar 30 segundos' }));

    expect(screen.getByRole('timer')).toHaveAttribute('aria-label', 'Tiempo restante 00:00');
  });

  it('avisa al terminar cuando se salta el descanso', () => {
    vi.useFakeTimers();
    const alTerminar = vi.fn();
    render(<TemporizadorDescanso alTerminar={alTerminar} />);

    fireEvent.click(screen.getByRole('button', { name: 'Saltar descanso' }));

    expect(alTerminar).toHaveBeenCalledTimes(1);
  });

  it('avisa al terminar cuando el tiempo llega a cero', () => {
    vi.useFakeTimers();
    const alTerminar = vi.fn();
    render(<TemporizadorDescanso alTerminar={alTerminar} />);

    act(() => {
      vi.advanceTimersByTime(89_000);
    });
    expect(alTerminar).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(alTerminar).toHaveBeenCalledTimes(1);
  });
});
