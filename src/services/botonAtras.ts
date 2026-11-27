import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import type { BackButtonEvent } from '@ionic/react';

/**
 * Prioridad del manejo del botón atrás físico de Android. Va por encima del IonRouterOutlet (0),
 * que siempre haría `history.back()`, y por debajo de los diálogos de Ionic y los propios (100),
 * para que primero se cierre el diálogo abierto.
 */
export const PRIORIDAD_NAVEGACION = 1;
export const PRIORIDAD_DIALOGO = 100;

/**
 * Botón atrás en pantalla (EncabezadoSJ) de la página visible. Ionic conserva en el DOM las páginas
 * anteriores con la clase `ion-page-hidden`, así que se descartan y se toma la última visible.
 */
export function botonAtrasVisible(raiz: ParentNode = document): HTMLElement | null {
  const botones = raiz.querySelectorAll<HTMLElement>('.ion-page:not(.ion-page-hidden) ion-back-button');
  return botones.length > 0 ? botones[botones.length - 1] : null;
}

/**
 * El botón físico hace lo mismo que el botón atrás de la pantalla: vuelve a la pantalla anterior
 * (o a su ruta por defecto). En las pantallas sin botón atrás (las raíz y el flujo inicial
 * obligatorio) no hace nada: la app nunca se cierra con el botón atrás.
 */
export function volverComoEnPantalla(raiz: ParentNode = document): boolean {
  const boton = botonAtrasVisible(raiz);
  if (!boton) {
    return false;
  }
  boton.click();
  return true;
}

/** Registra el manejo de navegación en cada pulsación del botón atrás que despacha Ionic. */
export function registrarNavegacionAtras(evento: Event, raiz: ParentNode = document): void {
  (evento as BackButtonEvent).detail.register(PRIORIDAD_NAVEGACION, () => {
    volverComoEnPantalla(raiz);
  });
}

/**
 * Activa el manejo del botón atrás de Android. Sin un listener de `backButton`, Capacitor cierra
 * la app cuando el WebView no tiene historial; con él, Capacitor solo avisa a Ionic y la app decide.
 * En la web no hace nada. Devuelve una función para desactivarlo.
 */
export function activarBotonAtrasAndroid(esNativo: boolean = Capacitor.isNativePlatform()): () => void {
  if (!esNativo) {
    return () => undefined;
  }

  let activo = true;
  let quitarListener: (() => Promise<void>) | null = null;
  void App.addListener('backButton', () => undefined)
    .then((handle) => {
      if (activo) {
        quitarListener = () => handle.remove();
      } else {
        void handle.remove();
      }
    })
    .catch(() => undefined);

  const alPulsar = (evento: Event): void => registrarNavegacionAtras(evento);
  document.addEventListener('ionBackButton', alPulsar);

  return () => {
    activo = false;
    document.removeEventListener('ionBackButton', alPulsar);
    if (quitarListener) {
      void quitarListener().catch(() => undefined);
    }
  };
}
