import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import ContadorNumerico from './ContadorNumerico';

interface PropiedadesPrueba {
  etiqueta?: string;
  valorInicial?: number;
  minimo?: number;
  maximo?: number;
  omitirMaximo?: boolean;
  paso?: number;
  unidad?: 'kg' | 'lb';
}

function renderizarContador({
  etiqueta = 'Repeticiones logradas',
  valorInicial = 0,
  minimo = 0,
  maximo = 50,
  omitirMaximo = false,
  paso,
  unidad,
}: PropiedadesPrueba = {}) {
  function ContadorControlado() {
    const [valor, setValor] = useState(valorInicial);

    return (
      <>
        <ContadorNumerico
          etiqueta={etiqueta}
          valor={valor}
          onChange={setValor}
          minimo={minimo}
          maximo={omitirMaximo ? undefined : maximo}
          paso={paso}
          unidad={unidad}
        />
        <output aria-label="Valor actual">{valor}</output>
      </>
    );
  }

  return render(<ContadorControlado />);
}

describe('ContadorNumerico', () => {
  afterEach(cleanup);

  it('presenta una etiqueta asociada y controles accesibles', () => {
    renderizarContador();

    expect(screen.getByLabelText('Repeticiones logradas')).toHaveAttribute('type', 'number');
    expect(screen.getByRole('button', { name: 'Disminuir repeticiones' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Aumentar repeticiones' })).toBeEnabled();
  });

  it('incrementa y decrementa con los botones', () => {
    renderizarContador({ valorInicial: 12 });
    const entrada = screen.getByRole('spinbutton', { name: 'Repeticiones logradas' });

    fireEvent.click(screen.getByRole('button', { name: 'Aumentar repeticiones' }));
    expect(entrada).toHaveValue(13);
    fireEvent.click(screen.getByRole('button', { name: 'Disminuir repeticiones' }));
    expect(entrada).toHaveValue(12);
  });

  it('deshabilita los botones en los límites', () => {
    renderizarContador({ valorInicial: 50 });

    expect(screen.getByRole('button', { name: 'Aumentar repeticiones' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Disminuir repeticiones' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Disminuir repeticiones' }));
    expect(screen.getByRole('spinbutton', { name: 'Repeticiones logradas' })).toHaveValue(49);
  });

  it('acepta la escritura numérica dentro del rango', () => {
    renderizarContador({ valorInicial: 5 });
    const entrada = screen.getByRole('spinbutton', { name: 'Repeticiones logradas' });

    fireEvent.change(entrada, { target: { value: '18' } });

    expect(entrada).toHaveValue(18);
    expect(screen.getByLabelText('Valor actual')).toHaveTextContent('18');
  });

  it('incrementa y decrementa con las flechas del teclado', () => {
    renderizarContador({ valorInicial: 12 });
    const entrada = screen.getByRole('spinbutton', { name: 'Repeticiones logradas' });

    fireEvent.keyDown(entrada, { key: 'ArrowUp' });
    expect(entrada).toHaveValue(13);
    fireEvent.keyDown(entrada, { key: 'ArrowDown' });
    expect(entrada).toHaveValue(12);
  });

  it('ajusta un valor superior al máximo al salir del campo', () => {
    renderizarContador({ valorInicial: 10 });
    const entrada = screen.getByRole('spinbutton', { name: 'Repeticiones logradas' });

    fireEvent.change(entrada, { target: { value: '51' } });
    expect(entrada).toHaveValue(51);
    expect(entrada).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Valor actual')).toHaveTextContent('10');

    fireEvent.blur(entrada);

    expect(entrada).toHaveValue(50);
    expect(screen.getByLabelText('Valor actual')).toHaveTextContent('50');
  });

  it('ajusta el valor vacío al mínimo al salir del campo', () => {
    renderizarContador({ valorInicial: 10 });
    const entrada = screen.getByRole('spinbutton', { name: 'Repeticiones logradas' });

    fireEvent.change(entrada, { target: { value: '' } });
    expect(entrada).toHaveValue(null);
    expect(entrada).toHaveAttribute('aria-invalid', 'true');

    fireEvent.blur(entrada);

    expect(entrada).toHaveValue(0);
    expect(screen.getByLabelText('Valor actual')).toHaveTextContent('0');
  });

  it('ajusta un valor negativo al mínimo al salir del campo', () => {
    renderizarContador({ valorInicial: 4 });
    const entrada = screen.getByRole('spinbutton', { name: 'Repeticiones logradas' });

    fireEvent.change(entrada, { target: { value: '-2' } });
    expect(screen.getByLabelText('Valor actual')).toHaveTextContent('4');

    fireEvent.blur(entrada);

    expect(entrada).toHaveValue(0);
    expect(screen.getByLabelText('Valor actual')).toHaveTextContent('0');
  });

  it.each([
    ['kg', 0.5],
    ['lb', 1],
  ] as const)('usa el paso correcto para el peso en %s', (unidad, pasoEsperado) => {
    renderizarContador({
      etiqueta: 'Peso',
      valorInicial: 10,
      omitirMaximo: true,
      unidad,
    });
    const entrada = screen.getByRole('spinbutton', { name: `Peso en ${unidad}` });

    expect(entrada).toHaveAttribute('step', String(pasoEsperado));
    expect(entrada).not.toHaveAttribute('max');
    expect(screen.getByRole('button', { name: 'Disminuir peso' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar peso' }));

    expect(entrada).toHaveValue(unidad === 'kg' ? 10.5 : 11);
  });
});
