import { useEffect, useId, useState, type KeyboardEvent } from 'react';
import type { UnidadPeso } from '../types/perfil';
import {
  decrementarValor,
  incrementarValor,
  limitarValor,
  obtenerPasoPeso,
} from '../utils/contadorNumerico';

interface PropiedadesContadorNumerico {
  etiqueta: string;
  valor: number;
  onChange: (valor: number) => void;
  minimo?: number;
  maximo?: number;
  paso?: number;
  unidad?: UnidadPeso;
}

function formatearValor(valor: number): string {
  return String(valor);
}

function ContadorNumerico({
  etiqueta,
  valor,
  onChange,
  minimo = 0,
  maximo,
  paso,
  unidad,
}: PropiedadesContadorNumerico) {
  const idGenerado = useId();
  const idCampo = `contador-${idGenerado.replace(/[^a-zA-Z0-9_-]/gu, '')}`;
  const pasoActivo = paso ?? (unidad ? obtenerPasoPeso(unidad) : 1);
  const nombreAccion = unidad
    ? 'peso'
    : etiqueta.toLocaleLowerCase('es').includes('repeticion')
      ? 'repeticiones'
      : etiqueta.toLocaleLowerCase('es');
  const [borrador, setBorrador] = useState(() => formatearValor(valor));

  useEffect(() => {
    setBorrador(formatearValor(valor));
  }, [valor]);

  const numeroBorrador = borrador.trim() === '' ? Number.NaN : Number(borrador);
  const borradorDentroDeRango =
    Number.isFinite(numeroBorrador) &&
    numeroBorrador >= minimo &&
    (maximo === undefined || numeroBorrador <= maximo);
  const valorLimites = borradorDentroDeRango
    ? numeroBorrador
    : limitarValor(valor, minimo, maximo);

  const cambiarBorrador = (nuevoBorrador: string): void => {
    setBorrador(nuevoBorrador);
    if (nuevoBorrador.trim() === '') {
      return;
    }

    const nuevoValor = Number(nuevoBorrador);
    if (
      Number.isFinite(nuevoValor) &&
      nuevoValor >= minimo &&
      (maximo === undefined || nuevoValor <= maximo)
    ) {
      onChange(limitarValor(nuevoValor, minimo, maximo));
    }
  };

  const corregirBorrador = (): void => {
    const valorCorregido = limitarValor(numeroBorrador, minimo, maximo);
    setBorrador(formatearValor(valorCorregido));
    if (!Number.isFinite(numeroBorrador) || numeroBorrador !== valorCorregido) {
      onChange(valorCorregido);
    }
  };

  const manejarTeclado = (evento: KeyboardEvent<HTMLInputElement>): void => {
    if (evento.key !== 'ArrowUp' && evento.key !== 'ArrowDown') {
      return;
    }

    evento.preventDefault();
    const valorActual = borradorDentroDeRango ? numeroBorrador : limitarValor(valor, minimo, maximo);
    const nuevoValor =
      evento.key === 'ArrowUp'
        ? incrementarValor(valorActual, pasoActivo, minimo, maximo)
        : decrementarValor(valorActual, pasoActivo, minimo, maximo);
    setBorrador(formatearValor(nuevoValor));
    onChange(nuevoValor);
  };

  return (
    <section className="sj-contador-numerico">
      <label className="sj-contador-etiqueta" htmlFor={idCampo}>{etiqueta}</label>
      <div className="sj-contador-control">
        <button
          className="sj-contador-boton"
          type="button"
          aria-label={`Disminuir ${nombreAccion}`}
          disabled={valorLimites <= minimo}
          onClick={() => onChange(decrementarValor(valor, pasoActivo, minimo, maximo))}
        >
          −
        </button>
        <div className="sj-contador-entrada">
          <input
            id={idCampo}
            className="sj-contador-valor"
            type="number"
            inputMode={unidad || pasoActivo % 1 !== 0 ? 'decimal' : 'numeric'}
            min={minimo}
            max={maximo}
            step={pasoActivo}
            value={borrador}
            aria-label={unidad ? `${etiqueta} en ${unidad}` : etiqueta}
            aria-invalid={!borradorDentroDeRango}
            onChange={(evento) => cambiarBorrador(evento.currentTarget.value)}
            onBlur={corregirBorrador}
            onKeyDown={manejarTeclado}
          />
          {unidad ? <span className="sj-contador-unidad">{unidad}</span> : null}
        </div>
        <button
          className="sj-contador-boton"
          type="button"
          aria-label={`Aumentar ${nombreAccion}`}
          disabled={maximo !== undefined && valorLimites >= maximo}
          onClick={() => onChange(incrementarValor(valor, pasoActivo, minimo, maximo))}
        >
          +
        </button>
      </div>
    </section>
  );
}

export default ContadorNumerico;
