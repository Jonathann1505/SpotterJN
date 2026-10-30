import {
  CONDICIONES_SALUD,
  EQUIPOS,
  EXPERIENCIAS,
  METAS_PRINCIPALES,
  type PerfilUsuario,
  type RespuestasSalud,
  type RutinaAsignada,
} from '../types/perfil';
import { guardarJson, leerJson } from './almacenLocal';
import type { AjustesRecordatorios } from '../types/recordatorios';
import { HORA_PREDETERMINADA, esHoraValida } from '../utils/recordatorios';
import type {
  FichasVistasRepositorio,
  PerfilRepositorio,
  RecordatoriosRepositorio,
  RutinaRepositorio,
  SaludRepositorio,
} from './repositorios';

type TipoDato = 'perfil' | 'salud' | 'rutina' | 'fichasVistas' | 'recordatorios';

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
  obtener: (usuarioId) => leerJson(crearClave(usuarioId, 'rutina'), esRutina),
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
