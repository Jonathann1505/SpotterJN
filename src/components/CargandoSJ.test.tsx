import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CargandoSJ } from './CargandoSJ';

describe('CargandoSJ', () => {
  it('anuncia la carga con un estado accesible y oculta los skeletons decorativos', () => {
    const { container } = render(<CargandoSJ etiqueta="Cargando rutina" />);

    const estado = screen.getByRole('status', { name: 'Cargando rutina' });
    expect(estado).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelector('.sj-skeleton-tarjeta')).toHaveAttribute('aria-hidden', 'true');
  });

  it('imita filas de ejercicios en la variante lista', () => {
    const { container } = render(<CargandoSJ etiqueta="Cargando" filas={4} />);

    expect(container.querySelectorAll('.sj-skeleton-fila')).toHaveLength(4);
  });

  it('imita párrafos en la variante detalle', () => {
    const { container } = render(<CargandoSJ etiqueta="Cargando la ficha" variante="detalle" filas={2} />);

    expect(container.querySelectorAll('.sj-skeleton-fila')).toHaveLength(0);
    expect(container.querySelectorAll(':scope .sj-skeleton > ion-skeleton-text')).toHaveLength(2);
  });
});
