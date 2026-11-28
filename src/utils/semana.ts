import { Weekday } from '@capacitor/local-notifications';
import type { DiaRutina, RutinaAsignada } from '../types/perfil';
import type { SerieRegistrada } from '../types/series';
import { diasDeEntrenamiento } from './recordatorios';
import { jornadaCompleta } from './sesion';

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

export type EstadoDiaSemana = 'hecho' | 'hoy' | 'falto' | 'pendiente';

export interface DiaDeLaSemana {
  /** Posición del día dentro de `rutina.dias`. */
  indice: number;
  dia: DiaRutina;
  /** Día de la semana en que toca esta sesión. */
  diaSemana: Weekday;
  estado: EstadoDiaSemana;
}

/** Lunes a las 00:00 de la semana de `ahora` (la semana va de lunes a domingo). */
function inicioDeSemana(ahora: Date): Date {
  const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  inicio.setDate(inicio.getDate() - ((ahora.getDay() + 6) % 7));
  return inicio;
}

/**
 * Estado de cada sesión de la rutina en la semana actual (de lunes a domingo): «hecho» si ya hay series
 * completadas de ese día, «hoy» si toca hoy y no se hizo, «falto» si su día ya pasó sin hacerse y
 * «pendiente» si aún no llega. Se apoya en el nombre del día guardado en cada serie.
 */
export function estadoDeLaSemana(
  rutina: RutinaAsignada,
  series: readonly SerieRegistrada[],
  ahora: Date = new Date(),
): DiaDeLaSemana[] {
  const entrenamiento = diasDeEntrenamiento(rutina.dias.length);
  const inicio = inicioDeSemana(ahora).getTime();
  const fin = inicio + 7 * 24 * 60 * 60 * 1000;
  const deLaSemana = series.filter((serie) => {
    const momento = Date.parse(serie.registradaEn);
    return momento >= inicio && momento < fin;
  });
  const desdeLunesHoy = (ahora.getDay() + 6) % 7;

  return rutina.dias.map((dia, indice) => {
    const diaSemana = entrenamiento[Math.min(indice, entrenamiento.length - 1)];
    const desdeLunes = (diaSemana + 5) % 7;
    let estado: EstadoDiaSemana = 'pendiente';
    if (jornadaCompleta(dia, deLaSemana)) {
      estado = 'hecho';
    } else if (desdeLunes === desdeLunesHoy) {
      estado = 'hoy';
    } else if (desdeLunes < desdeLunesHoy) {
      estado = 'falto';
    }
    return { indice, dia, diaSemana, estado };
  });
}

export interface DiaDelCalendario {
  fecha: Date;
  diaSemana: Weekday;
  esHoy: boolean;
}

/** Los siete días de la semana de `ahora`, de lunes a domingo, para la tira semanal de Hoy. */
export function diasDeLaSemanaActual(ahora: Date = new Date()): DiaDelCalendario[] {
  const inicio = inicioDeSemana(ahora);
  const posicionHoy = (ahora.getDay() + 6) % 7;

  return Array.from({ length: 7 }, (_, posicion) => {
    const fecha = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + posicion);
    return { fecha, diaSemana: diaDeLaSemana(fecha), esHoy: posicion === posicionHoy };
  });
}
