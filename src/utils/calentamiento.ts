import type { FocoCalentamiento } from '../data/calentamiento';
import { tipoDeSesion } from './rutina';

function sinTildes(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

/**
 * Qué calentamiento corresponde a un día de la rutina, según su tipo («Día 2 – Tren inferior»).
 * Un tipo desconocido usa el de cuerpo completo.
 */
export function focoDeSesion(nombreDia: string): FocoCalentamiento {
  switch (sinTildes(tipoDeSesion(nombreDia)).toLowerCase().trim()) {
    case 'tren superior':
      return 'superior';
    case 'tren inferior':
      return 'inferior';
    case 'empuje':
      return 'empuje';
    case 'tiron':
      return 'tiron';
    default:
      return 'completo';
  }
}
