import { createAnimation, type Animation, type AnimationBuilder } from '@ionic/react';

/** Curva de desaceleración natural para elementos que entran. */
export const EASING_ENTRADA = 'cubic-bezier(0.2, 0, 0, 1)';
/** Curva de aceleración suave para elementos que salen. */
export const EASING_SALIDA = 'cubic-bezier(0.3, 0, 1, 1)';
export const DURACION_AVANCE_MS = 260;
export const DURACION_REGRESO_MS = 200;
const DESPLAZAMIENTO = 'translateY(12px)';

interface OpcionesTransicion {
  enteringEl: HTMLElement;
  leavingEl?: HTMLElement;
  direction?: string;
  duration?: number;
}

function elementoPagina(elemento: HTMLElement): HTMLElement {
  if (elemento.classList.contains('ion-page')) {
    return elemento;
  }
  return elemento.querySelector<HTMLElement>(':scope > .ion-page') ?? elemento;
}

function prefiereMenosMovimiento(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Transición de páginas: la nueva pantalla aparece con un fundido y un desplazamiento corto;
 * al regresar, la pantalla actual se desvanece hacia abajo. Solo anima transform y opacity.
 */
export const transicionPaginaSJ: AnimationBuilder = (_base: unknown, opciones: unknown): Animation => {
  const { enteringEl, leavingEl, direction, duration } = opciones as OpcionesTransicion;
  const regreso = direction === 'back';
  const sinMovimiento = prefiereMenosMovimiento();
  const duracionBase = regreso ? DURACION_REGRESO_MS : DURACION_AVANCE_MS;

  const animacion = createAnimation()
    .addElement(elementoPagina(enteringEl))
    .fill('both')
    .beforeRemoveClass('ion-page-invisible')
    .duration(sinMovimiento ? 0 : duration || duracionBase)
    .easing(regreso ? EASING_SALIDA : EASING_ENTRADA);

  if (!regreso) {
    animacion.fromTo('transform', DESPLAZAMIENTO, 'translateY(0)').fromTo('opacity', 0.01, 1);
    return animacion;
  }

  if (leavingEl) {
    const salida = createAnimation()
      .addElement(elementoPagina(leavingEl))
      .fromTo('transform', 'translateY(0)', DESPLAZAMIENTO)
      .fromTo('opacity', 1, 0)
      .onFinish((paso) => {
        const pagina = salida.elements[0];
        if (paso === 1 && pagina) {
          pagina.style.setProperty('display', 'none');
        }
      });
    animacion.addAnimation(salida);
  }

  return animacion;
};
