import { fireEvent, screen, waitFor } from '@testing-library/react';
import { expect } from 'vitest';

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

/**
 * Ionic conserva las páginas anteriores ocultas en la pila de navegación.
 * Espera y devuelve la única página visible que contiene el encabezado indicado.
 */
export async function paginaVisible(titulo: string): Promise<HTMLElement> {
  return waitFor(() => {
    const visibles = screen
      .getAllByRole('heading', { name: titulo })
      .map((encabezado) => encabezado.closest('.ion-page'))
      .filter(
        (pagina): pagina is HTMLElement =>
          pagina instanceof HTMLElement && !pagina.classList.contains('ion-page-hidden'),
      );
    expect(visibles).toHaveLength(1);
    return visibles[0];
  });
}
