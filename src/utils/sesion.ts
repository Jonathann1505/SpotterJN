import { buscarEjercicio } from '../data/ejercicios';
import type { DiaRutina, EjercicioRutina, UnidadPeso } from '../types/perfil';
import { AUTOEVALUACIONES, type Autoevaluacion, type EstadoSerie, type SerieRegistrada } from '../types/series';

export { AUTOEVALUACIONES, type Autoevaluacion };

export const ETIQUETAS_AUTOEVALUACION: Readonly<Record<Autoevaluacion, string>> = {
  facil: 'Fácil',
  normal: 'Normal',
  dificil: 'Difícil',
};

/** Posición actual dentro de la jornada. `serie` empieza en 1. */
export interface ProgresoSesion {
  indiceEjercicio: number;
  serie: number;
  completada: boolean;
}

export const PROGRESO_INICIAL: ProgresoSesion = { indiceEjercicio: 0, serie: 1, completada: false };

/** Un ejercicio es de peso corporal si así lo indica el catálogo o si no tiene carga inicial. */
export function esPesoCorporal(ejercicio: EjercicioRutina): boolean {
  return buscarEjercicio(ejercicio.id)?.equipo === 'peso-corporal' || ejercicio.pesoInicialKg <= 0;
}

function pasarAlSiguienteEjercicio(progreso: ProgresoSesion, dia: DiaRutina): ProgresoSesion {
  const siguiente = progreso.indiceEjercicio + 1;
  if (siguiente >= dia.ejercicios.length) {
    return { ...progreso, completada: true };
  }
  return { indiceEjercicio: siguiente, serie: 1, completada: false };
}

export function esUltimoEjercicio(progreso: ProgresoSesion, dia: DiaRutina): boolean {
  return progreso.indiceEjercicio >= dia.ejercicios.length - 1;
}

/**
 * Interrumpe el ejercicio actual (por ejemplo, por molestia) sin contar la serie en curso:
 * pasa al siguiente ejercicio o termina la sesión si era el último.
 */
export function saltarEjercicio(progreso: ProgresoSesion, dia: DiaRutina): ProgresoSesion {
  if (progreso.completada) {
    return progreso;
  }
  return pasarAlSiguienteEjercicio(progreso, dia);
}

/**
 * Registra la serie actual como realizada: avanza a la siguiente serie, al siguiente
 * ejercicio cuando era la última, o marca la sesión como completada.
 */
export function avanzarSerie(progreso: ProgresoSesion, dia: DiaRutina): ProgresoSesion {
  const ejercicio = dia.ejercicios[progreso.indiceEjercicio];
  if (progreso.completada || !ejercicio) {
    return { ...progreso, completada: true };
  }
  if (progreso.serie < ejercicio.series) {
    return { ...progreso, serie: progreso.serie + 1 };
  }
  return pasarAlSiguienteEjercicio(progreso, dia);
}

/** Identificador único para una serie; usa crypto.randomUUID cuando está disponible. */
export function generarIdSerie(): string {
  const cripto = globalThis.crypto;
  if (cripto && typeof cripto.randomUUID === 'function') {
    return cripto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface DatosSerie {
  dia: DiaRutina;
  ejercicio: EjercicioRutina;
  numeroSerie: number;
  repeticiones: number;
  /** Peso mostrado en el contador; se ignora en ejercicios de peso corporal. */
  peso: number;
  unidad: UnidadPeso;
  autoevaluacion: Autoevaluacion | null;
  estado: EstadoSerie;
  ahora?: Date;
  id?: string;
}

/** Construye la serie que se guarda en el dispositivo (RF-10, RF-13). */
export function crearSerieRegistrada(datos: DatosSerie): SerieRegistrada {
  return {
    id: datos.id ?? generarIdSerie(),
    registradaEn: (datos.ahora ?? new Date()).toISOString(),
    idEjercicio: datos.ejercicio.id,
    nombreEjercicio: datos.ejercicio.nombre,
    dia: datos.dia.nombre,
    numeroSerie: datos.numeroSerie,
    peso: esPesoCorporal(datos.ejercicio) ? null : datos.peso,
    unidad: datos.unidad,
    repeticiones: datos.repeticiones,
    autoevaluacion: datos.autoevaluacion,
    estado: datos.estado,
  };
}

function mismoDiaLocal(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * Primer punto pendiente de una jornada según sus series guardadas. Un ejercicio está hecho si tiene todas
 * sus series completadas o si se interrumpió por molestia (RF-13). Devuelve null si no queda nada pendiente.
 */
export function primerPendiente(dia: DiaRutina, series: readonly SerieRegistrada[]): ProgresoSesion | null {
  for (let indice = 0; indice < dia.ejercicios.length; indice += 1) {
    const ejercicio = dia.ejercicios[indice];
    const propias = series.filter((serie) => serie.dia === dia.nombre && serie.idEjercicio === ejercicio.id);
    if (propias.some((serie) => serie.estado === 'interrumpida-por-molestia')) {
      continue;
    }
    const completadas = propias.filter((serie) => serie.estado === 'completada').length;
    if (completadas < ejercicio.series) {
      return { indiceEjercicio: indice, serie: completadas + 1, completada: false };
    }
  }
  return null;
}

/**
 * Una jornada está hecha si no le queda nada pendiente y tiene al menos una serie completada:
 * una sola serie, o una sesión detenida por molestia sin series completadas, no cuentan como hecha.
 */
export function jornadaCompleta(dia: DiaRutina, series: readonly SerieRegistrada[]): boolean {
  const tieneCompletadas = series.some((serie) => serie.dia === dia.nombre && serie.estado === 'completada');
  return tieneCompletadas && primerPendiente(dia, series) === null;
}

export interface SesionRetomada {
  progreso: ProgresoSesion;
  /** Series de esta jornada guardadas hoy, para el resumen final. */
  seriesDeHoy: SerieRegistrada[];
}

/**
 * Si hoy ya se guardaron series de esta jornada y quedó a medias, indica dónde seguir. Devuelve null si hoy
 * no se empezó o si ya se terminó (en ese caso, volver a hacerla es una decisión de la persona).
 */
export function retomarSesion(
  dia: DiaRutina,
  series: readonly SerieRegistrada[],
  ahora: Date = new Date(),
): SesionRetomada | null {
  const seriesDeHoy = series.filter(
    (serie) => serie.dia === dia.nombre && mismoDiaLocal(new Date(serie.registradaEn), ahora),
  );
  if (seriesDeHoy.length === 0) {
    return null;
  }
  const progreso = primerPendiente(dia, seriesDeHoy);
  return progreso === null ? null : { progreso, seriesDeHoy };
}
