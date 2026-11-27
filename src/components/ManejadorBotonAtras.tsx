import { useEffect, useRef } from 'react';
import { useIonRouter } from '@ionic/react';
import type { BackButtonEvent } from '@ionic/core';
import { useLocation } from 'react-router-dom';
import { activarBotonAtras, salirDeLaApp } from '../services/botonAtras';
import { decidirBotonAtras, type DialogoAbierto } from '../utils/botonAtras';

/** Prioridad por debajo de los diálogos de Ionic (100) y por encima del router de Ionic (0). */
export const PRIORIDAD_BOTON_ATRAS = 10;

function dialogoAbierto(): DialogoAbierto {
  if (document.querySelector('.sj-dialogo-fondo')) {
    return 'propio';
  }
  const ionic = document.querySelector(
    'ion-alert:not(.overlay-hidden), ion-modal:not(.overlay-hidden), ion-loading:not(.overlay-hidden), ion-action-sheet:not(.overlay-hidden)',
  );
  return ionic ? 'ionic' : 'ninguno';
}

/**
 * Gestiona el botón atrás físico de Android: retrocede como la flecha del encabezado, no se sale de la app
 * desde pantallas secundarias y la cierra solo en Hoy y Login. Debe ir dentro del router de Ionic.
 */
function ManejadorBotonAtras() {
  const router = useIonRouter();
  const { pathname } = useLocation();
  const actual = useRef({ router, pathname });
  actual.current = { router, pathname };

  useEffect(() => activarBotonAtras(), []);

  useEffect(() => {
    const alPulsar = (evento: Event): void => {
      (evento as BackButtonEvent).detail.register(PRIORIDAD_BOTON_ATRAS, () => {
        const { router: enrutador, pathname: ruta } = actual.current;
        const accion = decidirBotonAtras(ruta, enrutador.canGoBack(), dialogoAbierto());
        switch (accion.tipo) {
          case 'cerrar-dialogo':
            // Los diálogos propios (glosario, ajuste de peso) se cierran con Escape.
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            break;
          case 'salir':
            void salirDeLaApp();
            break;
          case 'volver':
            enrutador.goBack();
            break;
          case 'ir':
            enrutador.push(accion.ruta, 'back', 'replace');
            break;
          case 'nada':
            break;
        }
      });
    };
    document.addEventListener('ionBackButton', alPulsar);
    return () => document.removeEventListener('ionBackButton', alPulsar);
  }, []);

  return null;
}

export default ManejadorBotonAtras;
