/** Pantallas raíz: el botón atrás físico cierra la app, como es habitual en Android. */
export const RUTAS_RAIZ: readonly string[] = ['/hoy', '/login'];

/** Pasos obligatorios del flujo inicial: el botón atrás no hace nada para no salir a mitad del registro. */
export const RUTAS_OBLIGATORIAS: readonly string[] = ['/aviso-medico', '/salud'];

/** Pantalla padre de cada pantalla secundaria: la misma ruta `atras` que usa la flecha del encabezado. */
export const RUTA_PADRE: Readonly<Record<string, string>> = {
  '/perfil': '/hoy',
  '/sesion': '/hoy',
  '/ajustes': '/perfil',
  '/ejercicios': '/perfil',
  '/calentamiento': '/ejercicios',
  '/editar-salud': '/perfil',
  '/glosario': '/perfil',
  '/progreso': '/perfil',
  '/rutina': '/perfil',
  '/cuestionario-rutina': '/rutina',
  '/recuperar-contrasena': '/login',
  '/consentimientos': '/login',
  '/registro': '/consentimientos',
  '/terminos': '/consentimientos',
  '/privacidad': '/consentimientos',
};

/** Prefijos de rutas con parámetros y su pantalla padre. */
const PADRE_POR_PREFIJO: readonly (readonly [string, string])[] = [['/ejercicio/', '/hoy']];

export type DialogoAbierto = 'ninguno' | 'ionic' | 'propio';

export type AccionBotonAtras =
  | { tipo: 'cerrar-dialogo' }
  | { tipo: 'nada' }
  | { tipo: 'salir' }
  | { tipo: 'volver' }
  | { tipo: 'ir'; ruta: string };

export function rutaPadre(ruta: string): string {
  const exacta = RUTA_PADRE[ruta];
  if (exacta !== undefined) {
    return exacta;
  }
  const porPrefijo = PADRE_POR_PREFIJO.find(([prefijo]) => ruta.startsWith(prefijo));
  return porPrefijo ? porPrefijo[1] : '/hoy';
}

/**
 * Qué hace el botón atrás físico de Android (función pura).
 * 1. Con un diálogo propio abierto, lo cierra; con uno de Ionic que no se cierra tocando el fondo, no hace nada.
 * 2. En Hoy y Login cierra la app; en los pasos obligatorios del flujo inicial no hace nada.
 * 3. Si hay historial, vuelve a la pantalla anterior; si no, va a la pantalla padre.
 */
export function decidirBotonAtras(ruta: string, puedeVolver: boolean, dialogo: DialogoAbierto): AccionBotonAtras {
  if (dialogo === 'propio') {
    return { tipo: 'cerrar-dialogo' };
  }
  if (dialogo === 'ionic') {
    return { tipo: 'nada' };
  }
  if (RUTAS_RAIZ.includes(ruta)) {
    return { tipo: 'salir' };
  }
  if (RUTAS_OBLIGATORIAS.includes(ruta)) {
    return { tipo: 'nada' };
  }
  return puedeVolver ? { tipo: 'volver' } : { tipo: 'ir', ruta: rutaPadre(ruta) };
}
