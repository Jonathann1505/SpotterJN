import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

function esNativo(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * Hace que el botón atrás físico de Android llegue a la app. Sin oyentes del evento `backButton`, el plugin
 * App solo retrocede en el historial del WebView; con un oyente, avisa a Ionic, que lo reparte con prioridades
 * (evento `ionBackButton`). Devuelve una función para dejar de escuchar. En la web no hace nada.
 */
export function activarBotonAtras(): () => void {
  if (!esNativo()) {
    return () => undefined;
  }
  let quitar: (() => void) | null = null;
  let cancelado = false;
  void App.addListener('backButton', () => {
    // La decisión la toma ManejadorBotonAtras a través del evento `ionBackButton` de Ionic.
  })
    .then((oyente) => {
      if (cancelado) {
        void oyente.remove();
      } else {
        quitar = () => void oyente.remove();
      }
    })
    .catch(() => undefined);
  return () => {
    cancelado = true;
    quitar?.();
  };
}

/** Cierra la app (botón atrás en una pantalla raíz). En la web no hace nada. */
export async function salirDeLaApp(): Promise<void> {
  if (!esNativo()) {
    return;
  }
  try {
    await App.exitApp();
  } catch {
    // Si no se puede cerrar, la app se queda donde está.
  }
}
