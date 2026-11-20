import type { UnidadPeso } from '../types/perfil';
import { AUTOEVALUACIONES, type Autoevaluacion, type SerieRegistrada } from '../types/series';
import { agruparEnSesiones } from './progresion';
import { kgALb, lbAKg } from './unidades';

/** Resumen de una sesión de un ejercicio para el historial (RF-23). */
export interface SesionHistorial {
  /** Fecha y hora de la primera serie de la sesión, en ISO 8601. */
  fecha: string;
  /** Peso más alto de la sesión en la unidad pedida; null en peso corporal. */
  peso: number | null;
  /** Mayor número de repeticiones logradas en una serie. */
  repeticiones: number;
  seriesCompletadas: number;
  /** La autoevaluación más exigente de la sesión; null si no hubo ninguna. */
  autoevaluacion: Autoevaluacion | null;
  conMolestia: boolean;
}

export interface EjercicioConHistorial {
  id: string;
  nombre: string;
  sesiones: number;
}

export interface PuntoSemanal {
  /** Lunes de la semana, en hora local. */
  inicioSemana: Date;
  /** Peso más alto levantado esa semana. */
  peso: number;
}

function convertirPeso(peso: number, desde: UnidadPeso, hacia: UnidadPeso): number {
  if (desde === hacia) {
    return peso;
  }
  return hacia === 'kg' ? Math.round(lbAKg(peso) * 2) / 2 : Math.round(kgALb(peso));
}

function masExigente(valores: readonly (Autoevaluacion | null)[]): Autoevaluacion | null {
  let mayor = -1;
  for (const valor of valores) {
    if (valor !== null) {
      mayor = Math.max(mayor, AUTOEVALUACIONES.indexOf(valor));
    }
  }
  return mayor === -1 ? null : AUTOEVALUACIONES[mayor];
}

/** Sesiones de un ejercicio, de la más reciente a la más antigua. */
export function sesionesDeEjercicio(
  series: readonly SerieRegistrada[],
  idEjercicio: string,
  unidad: UnidadPeso,
): SesionHistorial[] {
  const sesiones = agruparEnSesiones(series.filter((serie) => serie.idEjercicio === idEjercicio)).map((sesion) => {
    const pesos = sesion.series.flatMap((serie) =>
      serie.peso === null ? [] : [convertirPeso(serie.peso, serie.unidad, unidad)],
    );
    const consideradas = sesion.completadas.length > 0 ? sesion.completadas : sesion.series;

    return {
      fecha: sesion.series[0].registradaEn,
      peso: pesos.length === 0 ? null : Math.max(...pesos),
      repeticiones: Math.max(...consideradas.map((serie) => serie.repeticiones)),
      seriesCompletadas: sesion.completadas.length,
      autoevaluacion: masExigente(sesion.completadas.map((serie) => serie.autoevaluacion)),
      conMolestia: sesion.hayMolestia,
    };
  });

  return sesiones.reverse();
}

/** Ejercicios con alguna serie registrada, primero el entrenado más recientemente. */
export function ejerciciosConHistorial(series: readonly SerieRegistrada[]): EjercicioConHistorial[] {
  const ultimos = new Map<string, SerieRegistrada>();
  for (const serie of series) {
    const previa = ultimos.get(serie.idEjercicio);
    if (!previa || Date.parse(serie.registradaEn) >= Date.parse(previa.registradaEn)) {
      ultimos.set(serie.idEjercicio, serie);
    }
  }

  return [...ultimos.values()]
    .sort((a, b) => Date.parse(b.registradaEn) - Date.parse(a.registradaEn))
    .map((ultima) => ({
      id: ultima.idEjercicio,
      nombre: ultima.nombreEjercicio,
      sesiones: agruparEnSesiones(series.filter((serie) => serie.idEjercicio === ultima.idEjercicio)).length,
    }));
}

function lunesDe(fecha: Date): Date {
  const lunes = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  // getDay(): 0 domingo … 6 sábado; se retrocede hasta el lunes anterior.
  lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7));
  return lunes;
}

/** Peso más alto por semana (empezando en lunes), de la semana más antigua a la más reciente. */
export function pesoPorSemana(sesiones: readonly SesionHistorial[]): PuntoSemanal[] {
  const semanas = new Map<number, PuntoSemanal>();
  for (const sesion of sesiones) {
    if (sesion.peso === null) {
      continue;
    }
    const inicioSemana = lunesDe(new Date(sesion.fecha));
    const clave = inicioSemana.getTime();
    const actual = semanas.get(clave);
    semanas.set(clave, { inicioSemana, peso: Math.max(actual?.peso ?? 0, sesion.peso) });
  }

  return [...semanas.values()].sort((a, b) => a.inicioSemana.getTime() - b.inicioSemana.getTime());
}
