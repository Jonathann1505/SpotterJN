import { Weekday } from '@capacitor/local-notifications';
import type { DiaRutina, RutinaAsignada } from '../types/perfil';
import { diasDeEntrenamiento } from './recordatorios';

export interface SesionDelDia {
  /** Posición del día dentro de `rutina.dias`. */
  indice: number;
  dia: DiaRutina;
  /** Verdadero si hoy es un día de entrenamiento; si no, es la próxima sesión de la semana. */
  esHoy: boolean;
  /** Día de la semana en que toca esta sesión. */
  diaSemana: Weekday;
}

function diaDeLaSemana(fecha: Date): Weekday {
  // Date.getDay() va de 0 (domingo) a 6 (sábado); Weekday de 1 (domingo) a 7 (sábado).
  return (fecha.getDay() + 1) as Weekday;
}

/**
 * Qué sesión de la rutina toca en una fecha. Las sesiones se reparten en los mismos días de la semana
 * que usan los recordatorios (por ejemplo lunes, miércoles y viernes): si hoy no se entrena, devuelve
 * la siguiente. No usa historial, solo el calendario.
 */
export function sesionParaFecha(rutina: RutinaAsignada, ahora: Date = new Date()): SesionDelDia | null {
  if (rutina.dias.length === 0) {
    return null;
  }

  const entrenamiento = diasDeEntrenamiento(rutina.dias.length);
  const hoy = diaDeLaSemana(ahora);

  for (let desplazamiento = 0; desplazamiento < 7; desplazamiento += 1) {
    const diaSemana = ((hoy - 1 + desplazamiento) % 7) + 1;
    const posicion = entrenamiento.indexOf(diaSemana as Weekday);
    if (posicion !== -1) {
      const indice = Math.min(posicion, rutina.dias.length - 1);
      return { indice, dia: rutina.dias[indice], esHoy: desplazamiento === 0, diaSemana: diaSemana as Weekday };
    }
  }

  return { indice: 0, dia: rutina.dias[0], esHoy: false, diaSemana: entrenamiento[0] };
}
