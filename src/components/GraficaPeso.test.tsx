import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { PuntoSemanal } from '../utils/historial';
import { GraficaPeso } from './GraficaPeso';

const punto = (dia: number, peso: number): PuntoSemanal => ({ inicioSemana: new Date(2026, 10, dia), peso });

describe('GraficaPeso', () => {
  afterEach(cleanup);

  it('dibuja un punto por semana, une los puntos y la describe para lectores de pantalla', () => {
    const { container, getByRole } = render(
      <GraficaPeso puntos={[punto(16, 20), punto(23, 22.5), punto(30, 25)]} unidad="kg" ejercicio="Press de banca" />,
    );

    expect(container.querySelectorAll('circle')).toHaveLength(3);
    expect(container.querySelector('polyline')).not.toBeNull();
    expect(getByRole('img')).toHaveAccessibleName('Peso de Press de banca por semana: de 20 a 25 kg en 3 semanas.');
  });

  it('muestra los extremos del eje vertical y las fechas inicial y final', () => {
    const { getByText } = render(
      <GraficaPeso puntos={[punto(16, 20), punto(30, 25)]} unidad="kg" ejercicio="Press de banca" />,
    );

    expect(getByText('25')).toBeInTheDocument();
    expect(getByText('20')).toBeInTheDocument();
    expect(getByText(/16 nov/)).toBeInTheDocument();
    expect(getByText(/30 nov/)).toBeInTheDocument();
  });

  it('con un solo punto no traza línea y no divide entre cero', () => {
    const { container, getByRole } = render(
      <GraficaPeso puntos={[punto(16, 20)]} unidad="lb" ejercicio="Press de banca" />,
    );

    expect(container.querySelector('polyline')).toBeNull();
    expect(container.querySelectorAll('circle')).toHaveLength(1);
    expect(getByRole('img')).toHaveAccessibleName('Peso de Press de banca: 20 lb en una semana.');
    expect(container.innerHTML).not.toContain('NaN');
  });

  it('con el mismo peso en todas las semanas deja la línea dentro del área', () => {
    const { container } = render(
      <GraficaPeso puntos={[punto(16, 20), punto(23, 20)]} unidad="kg" ejercicio="Press de banca" />,
    );

    expect(container.innerHTML).not.toContain('NaN');
    expect(container.querySelectorAll('circle')).toHaveLength(2);
  });

  it('no dibuja nada sin puntos', () => {
    const { container } = render(<GraficaPeso puntos={[]} unidad="kg" ejercicio="Flexiones" />);

    expect(container).toBeEmptyDOMElement();
  });
});
