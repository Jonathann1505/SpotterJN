import { fireEvent } from '@testing-library/react';

/** Devuelve el botón atrás nativo de Ionic dentro del contenedor o falla si no existe. */
export function botonAtras(contenedor: ParentNode): HTMLElement {
  const boton = contenedor.querySelector('ion-back-button');
  if (!(boton instanceof HTMLElement)) {
    throw new Error('No se encontró el botón atrás del encabezado.');
  }
  return boton;
}

/** Pulsa el botón atrás del encabezado; navega solo si hay un router de Ionic montado. */
export function pulsarAtras(contenedor: ParentNode): void {
  fireEvent.click(botonAtras(contenedor));
}
