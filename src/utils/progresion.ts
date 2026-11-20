import type { UnidadPeso } from '../types/perfil';
import type { SerieRegistrada } from '../types/series';
import { kgALb, lbAKg } from './unidades';

/** Subida máxima y paso de redondeo de la progresión automática (RF-17). */
export const INCREMENTO_PESO: Readonly<Record<UnidadPeso, number>> = { kg: 2.5, lb: 5 };
/** Repeticiones que se suman al objetivo en ejercicios de peso corporal cuando todo fue bien. */
export const INCREMENTO_REPETICIONES = 2;
/** Bajada tras varias sesiones de fallo con el mismo peso (RF-16). */
export const FACTOR_BAJADA = 0.9;
export const SESIONES_FALLIDAS_PARA_BAJAR = 3;

export type AccionProgresion = 'sube' | 'mantiene' | 'baja';
export type MotivoProgresion = 'sin-series' | 'todo-bien' | 'dificil' | 'incompleta' | 'molestia' | 'tres-fallos';

export interface ObjetivoEjercicio {
  series: number;
  repeticiones: number;
}

export interface EntradaProgresion {
  /** Series registradas de este ejercicio (en cualquier orden). */
  series: readonly SerieRegistrada[];
  objetivo: ObjetivoEjercicio;
  /** Peso de partida en la unidad del perfil; null en ejercicios de peso corporal. */
  pesoActual: number | null;
  unidad: UnidadPeso;
}

export interface ResultadoProgresion {
  accion: AccionProgresion;
  motivo: MotivoProgresion;
  /** Peso recomendado para la próxima sesión; null en peso corporal. */
  peso: number | null;
  /** Repeticiones objetivo para la próxima sesión. */
  repeticiones: number;
  unidad: UnidadPeso;
  /** Frase corta en español que explica la recomendación (RF-19). */
  explicacion: string;
}

/** Genera la frase de la recomendación. Hoy son frases fijas; más adelante puede sustituirse por IA. */
export type Explicador = (resultado: Omit<ResultadoProgresion, 'explicacion'>) => string;

type ResultadoSesion = 'exito' | 'fallo' | 'incompleta';

interface SesionEjercicio {
  series: SerieRegistrada[];
  hayMolestia: boolean;
  completadas: SerieRegistrada[];
}

function fechaLocal(iso: string): string {
  const fecha = new Date(iso);
  return `${fecha.getFullYear()}-${fecha.getMonth() + 1}-${fecha.getDate()}`;
}

/** Agrupa en sesiones: empieza una nueva al cambiar la fecha local o cuando el número de serie no aumenta. */
export function agruparEnSesiones(series: readonly SerieRegistrada[]): SesionEjercicio[] {
  const ordenadas = [...series].sort((a, b) => Date.parse(a.registradaEn) - Date.parse(b.registradaEn));
  const grupos: SerieRegistrada[][] = [];
  for (const serie of ordenadas) {
    const actual = grupos[grupos.length - 1];
    const anterior = actual?.[actual.length - 1];
    if (!actual || !anterior || fechaLocal(anterior.registradaEn) !== fechaLocal(serie.registradaEn) || serie.numeroSerie <= anterior.numeroSerie) {
      grupos.push([serie]);
    } else {
      actual.push(serie);
    }
  }
  return grupos.map((grupo) => ({
    series: grupo,
    hayMolestia: grupo.some((serie) => serie.estado === 'interrumpida-por-molestia'),
    completadas: grupo.filter((serie) => serie.estado === 'completada'),
  }));
}

function evaluarSesion(sesion: SesionEjercicio, objetivo: ObjetivoEjercicio): ResultadoSesion {
  const huboFallo = sesion.completadas.some(
    (serie) => serie.autoevaluacion === 'dificil' || serie.repeticiones < objetivo.repeticiones,
  );
  if (huboFallo) {
    return 'fallo';
  }
  return sesion.completadas.length >= objetivo.series ? 'exito' : 'incompleta';
}

function convertirPeso(peso: number, desde: UnidadPeso, hacia: UnidadPeso): number {
  if (desde === hacia) {
    return peso;
  }
  return hacia === 'kg' ? Math.round(lbAKg(peso) * 2) / 2 : Math.round(kgALb(peso));
}

/** Peso de la sesión: el de la última serie completada (o la última registrada) en la unidad pedida. */
function pesoDeSesion(sesion: SesionEjercicio, unidad: UnidadPeso): number | null {
  const referencia = sesion.completadas[sesion.completadas.length - 1] ?? sesion.series[sesion.series.length - 1];
  if (!referencia || referencia.peso === null) {
    return null;
  }
  return convertirPeso(referencia.peso, referencia.unidad, unidad);
}

function redondearAlIncremento(peso: number, unidad: UnidadPeso): number {
  const incremento = INCREMENTO_PESO[unidad];
  return Math.round(peso / incremento) * incremento;
}

function maximoRepeticiones(sesion: SesionEjercicio): number {
  return sesion.series.reduce((maximo, serie) => Math.max(maximo, serie.repeticiones), 0);
}

function formatearNumero(valor: number): string {
  return valor.toLocaleString('es', { maximumFractionDigits: 1 });
}

/** Frases fijas, en lenguaje cercano, para cada caso de la progresión (RF-19). */
export const explicarProgresion: Explicador = ({ motivo, peso, repeticiones, unidad }) => {
  const carga = peso === null ? `${repeticiones} repeticiones` : `${formatearNumero(peso)} ${unidad}`;
  switch (motivo) {
    case 'sin-series':
      return `Empieza con ${carga}: es el punto de partida recomendado.`;
    case 'todo-bien':
      return `Te sobró fuerza: sube a ${carga}.`;
    case 'dificil':
      return `Te costó un poco: repite ${carga} para afianzarlo.`;
    case 'incompleta':
      return `No completaste todas las series: repite ${carga} la próxima vez.`;
    case 'molestia':
      return `Sentiste molestia: mantén ${carga} y cuídate.`;
    case 'tres-fallos':
      return `Llevas 3 sesiones difíciles con este peso: baja a ${carga} y vuelve a subir.`;
  }
};

/**
 * Recomienda la carga de la próxima sesión de un ejercicio según su última sesión registrada
 * (RF-15, RF-16, RF-17, RF-13). Función pura: no accede a repositorios ni a la interfaz.
 */
export function calcularProgresion(
  entrada: EntradaProgresion,
  explicar: Explicador = explicarProgresion,
): ResultadoProgresion {
  const { objetivo, unidad } = entrada;
  const pesoCorporal = entrada.pesoActual === null;
  const sesiones = agruparEnSesiones(entrada.series);
  const ultima = sesiones[sesiones.length - 1];

  const terminar = (resultado: Omit<ResultadoProgresion, 'explicacion' | 'unidad'>): ResultadoProgresion => {
    const sinFrase = { ...resultado, unidad };
    return { ...sinFrase, explicacion: explicar(sinFrase) };
  };

  if (!ultima) {
    return terminar({ accion: 'mantiene', motivo: 'sin-series', peso: entrada.pesoActual, repeticiones: objetivo.repeticiones });
  }

  const pesoBase = pesoCorporal ? null : pesoDeSesion(ultima, unidad) ?? entrada.pesoActual;
  const repeticionesBase = Math.max(objetivo.repeticiones, maximoRepeticiones(ultima));

  // RF-13: la molestia no es éxito ni fallo; se propone mantener la carga.
  if (ultima.hayMolestia) {
    return terminar({ accion: 'mantiene', motivo: 'molestia', peso: pesoBase, repeticiones: repeticionesBase });
  }

  const resultado = evaluarSesion(ultima, objetivo);

  if (resultado === 'exito') {
    if (pesoBase === null) {
      return terminar({
        accion: 'sube',
        motivo: 'todo-bien',
        peso: null,
        repeticiones: maximoRepeticiones(ultima) + INCREMENTO_REPETICIONES,
      });
    }
    // RF-17: la subida nunca supera 2,5 kg o 5 lb por sesión.
    return terminar({
      accion: 'sube',
      motivo: 'todo-bien',
      peso: pesoBase + INCREMENTO_PESO[unidad],
      repeticiones: objetivo.repeticiones,
    });
  }

  if (resultado === 'incompleta') {
    return terminar({ accion: 'mantiene', motivo: 'incompleta', peso: pesoBase, repeticiones: repeticionesBase });
  }

  // RF-16: tras 3 sesiones seguidas de fallo con el mismo peso, baja un 10 %.
  if (pesoBase !== null) {
    const evaluables = sesiones.filter((sesion) => !sesion.hayMolestia && sesion.completadas.length > 0);
    const recientes = evaluables.slice(-SESIONES_FALLIDAS_PARA_BAJAR);
    const tresFallosMismoPeso =
      recientes.length === SESIONES_FALLIDAS_PARA_BAJAR &&
      recientes.every((sesion) => evaluarSesion(sesion, objetivo) === 'fallo' && pesoDeSesion(sesion, unidad) === pesoBase);
    if (tresFallosMismoPeso) {
      const redondeado = redondearAlIncremento(pesoBase * FACTOR_BAJADA, unidad);
      const pesoBajado = redondeado < pesoBase ? redondeado : Math.max(0, pesoBase - INCREMENTO_PESO[unidad]);
      return terminar({ accion: 'baja', motivo: 'tres-fallos', peso: pesoBajado, repeticiones: objetivo.repeticiones });
    }
  }

  return terminar({
    accion: 'mantiene',
    motivo: 'dificil',
    peso: pesoBase,
    repeticiones: pesoBase === null ? repeticionesBase : objetivo.repeticiones,
  });
}
