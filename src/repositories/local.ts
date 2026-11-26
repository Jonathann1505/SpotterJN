import {
  CONDICIONES_SALUD,
  EQUIPOS,
  EXPERIENCIAS,
  METAS_PRINCIPALES,
  type PerfilUsuario,
  type RespuestasSalud,
  type RutinaAsignada,
} from '../types/perfil';
import { borrarClave, guardarJson, leerJson } from './almacenLocal';
import { recortarSeries } from './recorteSeries';
import type { AjustesRecordatorios } from '../types/recordatorios';
import { AUTOEVALUACIONES, ESTADOS_SERIE, type Autoevaluacion, type SerieRegistrada } from '../types/series';
import type { AjustePeso, AjustesPeso } from '../types/ajustesPeso';
import { migrarEjerciciosRetirados } from '../utils/alternativas';
import { HORA_PREDETERMINADA, esHoraValida } from '../utils/recordatorios';
import type {
  FichasVistasRepositorio,
  PerfilRepositorio,
  RecordatoriosRepositorio,
  RutinaRepositorio,
  SaludRepositorio,
  SeriesRepositorio,
  AjustesPesoRepositorio,
} from './repositorios';

const TIPOS_DE_DATO = ['perfil', 'salud', 'rutina', 'fichasVistas', 'recordatorios', 'series', 'ajustesPeso'] as const;

type TipoDato = (typeof TIPOS_DE_DATO)[number];

function crearClave(usuarioId: string, tipo: TipoDato): string {
  if (!usuarioId) {
    throw new Error('Se requiere una sesión para acceder a los datos locales.');
  }

  return `spotter.usuario.${encodeURIComponent(usuarioId)}.${tipo}`;
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function esListaDe<T extends string>(valor: unknown, permitidos: readonly T[]): valor is T[] {
  return Array.isArray(valor) && valor.every((v) => permitidos.includes(v as T));
}

function esPerfil(valor: unknown): valor is PerfilUsuario {
  return (
    esObjeto(valor) &&
    typeof valor.nombre === 'string' &&
    METAS_PRINCIPALES.includes(valor.meta as PerfilUsuario['meta']) &&
    (valor.unidadPeso === 'kg' || valor.unidadPeso === 'lb')
  );
}

function esSalud(valor: unknown): valor is RespuestasSalud {
  return (
    esObjeto(valor) &&
    esListaDe(valor.condiciones, CONDICIONES_SALUD) &&
    typeof valor.respondidoEn === 'string'
  );
}

function esRutina(valor: unknown): valor is RutinaAsignada {
  if (!esObjeto(valor) || !esObjeto(valor.cuestionario) || !Array.isArray(valor.dias)) {
    return false;
  }

  const c = valor.cuestionario;
  return (
    EXPERIENCIAS.includes(c.experiencia as RutinaAsignada['cuestionario']['experiencia']) &&
    typeof c.diasPorSemana === 'number' &&
    esListaDe(c.equipo, EQUIPOS) &&
    typeof valor.asignadaEn === 'string'
  );
}

export const perfilLocal: PerfilRepositorio = {
  obtener: (usuarioId) => leerJson(crearClave(usuarioId, 'perfil'), esPerfil),
  guardar: (usuarioId, perfil) => guardarJson(crearClave(usuarioId, 'perfil'), perfil),
};

export const saludLocal: SaludRepositorio = {
  obtener: (usuarioId) => leerJson(crearClave(usuarioId, 'salud'), esSalud),
  guardar: (usuarioId, respuestas) => guardarJson(crearClave(usuarioId, 'salud'), respuestas),
};

export const rutinaLocal: RutinaRepositorio = {
  obtener: async (usuarioId) => {
    const rutina = await leerJson(crearClave(usuarioId, 'rutina'), esRutina);
    // Las rutinas guardadas con un ejercicio que salió del catálogo se actualizan al leerlas.
    return rutina === null ? null : migrarEjerciciosRetirados(rutina);
  },
  guardar: (usuarioId, rutina) => guardarJson(crearClave(usuarioId, 'rutina'), rutina),
};

function esListaDeTextos(valor: unknown): valor is string[] {
  return Array.isArray(valor) && valor.every((elemento) => typeof elemento === 'string');
}

export const fichasVistasLocal: FichasVistasRepositorio = {
  obtener: async (usuarioId) => (await leerJson(crearClave(usuarioId, 'fichasVistas'), esListaDeTextos)) ?? [],
  marcarVista: async (usuarioId, idEjercicio) => {
    const clave = crearClave(usuarioId, 'fichasVistas');
    const vistas = (await leerJson(clave, esListaDeTextos)) ?? [];
    if (!vistas.includes(idEjercicio)) {
      await guardarJson(clave, [...vistas, idEjercicio]);
    }
  },
};

const AJUSTES_RECORDATORIOS_INICIALES: AjustesRecordatorios = { activo: false, hora: HORA_PREDETERMINADA };

function esAjustesRecordatorios(valor: unknown): valor is AjustesRecordatorios {
  return esObjeto(valor) && typeof valor.activo === 'boolean' && typeof valor.hora === 'string' && esHoraValida(valor.hora);
}

export const recordatoriosLocal: RecordatoriosRepositorio = {
  obtener: async (usuarioId) =>
    (await leerJson(crearClave(usuarioId, 'recordatorios'), esAjustesRecordatorios)) ?? AJUSTES_RECORDATORIOS_INICIALES,
  guardar: async (usuarioId, ajustes) => guardarJson(crearClave(usuarioId, 'recordatorios'), ajustes),
};

function esNumeroNoNegativo(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isFinite(valor) && valor >= 0;
}

function esSerie(valor: unknown): valor is SerieRegistrada {
  return (
    esObjeto(valor) &&
    typeof valor.id === 'string' &&
    typeof valor.registradaEn === 'string' &&
    !Number.isNaN(Date.parse(valor.registradaEn)) &&
    typeof valor.idEjercicio === 'string' &&
    typeof valor.nombreEjercicio === 'string' &&
    typeof valor.dia === 'string' &&
    Number.isInteger(valor.numeroSerie) &&
    (valor.numeroSerie as number) >= 1 &&
    (valor.peso === null || esNumeroNoNegativo(valor.peso)) &&
    (valor.unidad === 'kg' || valor.unidad === 'lb') &&
    Number.isInteger(valor.repeticiones) &&
    esNumeroNoNegativo(valor.repeticiones) &&
    (valor.autoevaluacion === null ||
      AUTOEVALUACIONES.includes(valor.autoevaluacion as Autoevaluacion)) &&
    ESTADOS_SERIE.includes(valor.estado as SerieRegistrada['estado'])
  );
}

function esLista(valor: unknown): valor is unknown[] {
  return Array.isArray(valor);
}

/** Lee las series válidas; descarta las corruptas sin perder las demás. */
async function leerSeries(usuarioId: string): Promise<SerieRegistrada[]> {
  const guardadas = (await leerJson(crearClave(usuarioId, 'series'), esLista)) ?? [];
  return guardadas.filter(esSerie);
}

export const seriesLocal: SeriesRepositorio = {
  guardar: async (usuarioId, serie) => {
    const series = await leerSeries(usuarioId);
    // El recorte se calcula en memoria: si la escritura falla, la lista anterior queda intacta.
    await guardarJson(crearClave(usuarioId, 'series'), recortarSeries([...series, serie], serie.id));
  },
  listar: (usuarioId) => leerSeries(usuarioId),
  listarPorEjercicio: async (usuarioId, idEjercicio) =>
    (await leerSeries(usuarioId)).filter((serie) => serie.idEjercicio === idEjercicio),
};

/** Borra de este dispositivo todo lo guardado de una persona (perfil, salud, rutina, fichas vistas, recordatorios y series). */
export async function borrarDatosLocales(usuarioId: string): Promise<void> {
  await Promise.all(TIPOS_DE_DATO.map((tipo) => borrarClave(crearClave(usuarioId, tipo))));
}

function esAjustePeso(valor: unknown): valor is AjustePeso {
  return (
    esObjeto(valor) &&
    typeof valor.idEjercicio === 'string' &&
    typeof valor.peso === 'number' &&
    Number.isFinite(valor.peso) &&
    valor.peso >= 0 &&
    (valor.unidad === 'kg' || valor.unidad === 'lb') &&
    typeof valor.ajustadoEn === 'string' &&
    !Number.isNaN(Date.parse(valor.ajustadoEn))
  );
}

/** Lee los ajustes válidos; descarta los corruptos o guardados bajo otro id de ejercicio. */
async function leerAjustesPeso(usuarioId: string): Promise<Record<string, AjustePeso>> {
  const guardados = (await leerJson(crearClave(usuarioId, 'ajustesPeso'), esObjeto)) ?? {};
  const validos: Record<string, AjustePeso> = {};
  for (const [idEjercicio, ajuste] of Object.entries(guardados)) {
    if (esAjustePeso(ajuste) && ajuste.idEjercicio === idEjercicio) {
      validos[idEjercicio] = ajuste;
    }
  }
  return validos;
}

export const ajustesPesoLocal: AjustesPesoRepositorio = {
  obtener: async (usuarioId): Promise<AjustesPeso> => leerAjustesPeso(usuarioId),
  guardar: async (usuarioId, ajuste) => {
    const ajustes = await leerAjustesPeso(usuarioId);
    await guardarJson(crearClave(usuarioId, 'ajustesPeso'), { ...ajustes, [ajuste.idEjercicio]: ajuste });
  },
};
