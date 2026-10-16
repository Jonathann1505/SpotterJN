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
import type { PerfilRepositorio, RutinaRepositorio, SaludRepositorio } from './repositorios';

function crearClave(usuarioId: string, tipo: 'perfil' | 'salud' | 'rutina'): string {
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
