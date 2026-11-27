import { useEffect, useRef } from 'react';
import type { BackButtonEvent } from '@ionic/react';
import { PRIORIDAD_DIALOGO } from '../services/botonAtras';

/**
 * Mientras un diálogo propio está abierto, el botón atrás de Android lo cierra en lugar de cambiar
 * de pantalla, igual que hacen los diálogos de Ionic.
 */
export function useCerrarConBotonAtras(abierto: boolean, cerrar: () => void): void {
  const cerrarActual = useRef(cerrar);
  cerrarActual.current = cerrar;

  useEffect(() => {
    if (!abierto) {
      return undefined;
    }
    const alPulsar = (evento: Event): void => {
      (evento as BackButtonEvent).detail.register(PRIORIDAD_DIALOGO, () => cerrarActual.current());
    };
    document.addEventListener('ionBackButton', alPulsar);
    return () => document.removeEventListener('ionBackButton', alPulsar);
  }, [abierto]);
}
