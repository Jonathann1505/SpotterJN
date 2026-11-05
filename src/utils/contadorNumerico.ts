import type { UnidadPeso } from '../types/perfil';

function cantidadDecimales(valor: number): number {
  const [mantisa, exponenteTexto = '0'] = valor.toString().toLowerCase().split('e');
  const decimalesMantisa = mantisa.split('.')[1]?.length ?? 0;
  return Math.max(0, decimalesMantisa - Number(exponenteTexto));
}

function validarRango(minimo: number, maximo?: number): void {
  if (!Number.isFinite(minimo) || (maximo !== undefined && !Number.isFinite(maximo))) {
    throw new RangeError('Los límites del contador deben ser números finitos.');
  }
  if (maximo !== undefined && minimo > maximo) {
    throw new RangeError('El valor mínimo no puede superar el máximo.');
  }
}

export function limitarValor(valor: number, minimo: number, maximo?: number): number {
  validarRango(minimo, maximo);
  if (!Number.isFinite(valor)) {
    return minimo;
  }
  return Math.min(maximo ?? Number.POSITIVE_INFINITY, Math.max(minimo, valor));
}

function ajustarContador(
  valor: number,
  paso: number,
  minimo: number,
  maximo: number | undefined,
  direccion: 1 | -1,
): number {
  validarRango(minimo, maximo);
  if (!Number.isFinite(paso) || paso <= 0) {
    throw new RangeError('El paso del contador debe ser un número positivo y finito.');
  }

  const actual = limitarValor(valor, minimo, maximo);
  const decimales = Math.min(
    15,
    Math.max(cantidadDecimales(actual), cantidadDecimales(paso), cantidadDecimales(minimo)),
  );
  const escala = 10 ** decimales;
  const actualEscalado = Math.round(actual * escala);
  const pasoEscalado = Math.round(paso * escala);

  const resultado =
    Number.isSafeInteger(actualEscalado) && Number.isSafeInteger(pasoEscalado)
      ? (actualEscalado + direccion * pasoEscalado) / escala
      : Number((actual + direccion * paso).toPrecision(15));

  return limitarValor(resultado, minimo, maximo);
}

export function incrementarValor(
  valor: number,
  paso: number,
  minimo: number,
  maximo?: number,
): number {
  return ajustarContador(valor, paso, minimo, maximo, 1);
}

export function decrementarValor(
  valor: number,
  paso: number,
  minimo: number,
  maximo?: number,
): number {
  return ajustarContador(valor, paso, minimo, maximo, -1);
}

export function obtenerPasoPeso(unidad: UnidadPeso): number {
  return unidad === 'kg' ? 0.5 : 1;
}
