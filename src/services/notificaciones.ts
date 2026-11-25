import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';

/** Identificador fijo del aviso de fin de descanso: solo existe uno a la vez (RF-11). */
export const ID_AVISO_DESCANSO = 9100;
/** Marca en el dispositivo de que ya se preguntó por el permiso, para no insistir en cada serie. */
/**
 * Canal propio de importancia alta: el canal por defecto del plugin tiene importancia normal y en
 * Android solo deja un ícono en la barra de estado, sin ventana emergente ni vibración.
 */
export const CANAL_AVISO_DESCANSO = 'descanso';
export const CLAVE_PERMISO_PREGUNTADO = 'spotter.dispositivo.avisoDescanso.permisoPreguntado';

/**
 * - `preguntar`: se puede explicar y pedir el permiso.
 * - `concedido`: se pueden programar avisos.
 * - `no-disponible`: web, permiso denegado o ya se preguntó: no se pide ni se programa nada.
 */
export type EstadoAvisoDescanso = 'preguntar' | 'concedido' | 'no-disponible';

function esNativo(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

async function yaSePregunto(): Promise<boolean> {
  const { value } = await Preferences.get({ key: CLAVE_PERMISO_PREGUNTADO });
  return value === 'si';
}

/** Indica si el aviso del descanso puede usarse o si hace falta preguntar. Nunca lanza errores. */
export async function estadoAvisoDescanso(): Promise<EstadoAvisoDescanso> {
  if (!esNativo()) {
    return 'no-disponible';
  }
  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display === 'granted') {
      return 'concedido';
    }
    if (display === 'denied' || (await yaSePregunto())) {
      return 'no-disponible';
    }
    return 'preguntar';
  } catch {
    return 'no-disponible';
  }
}

/**
 * Registra que ya se preguntó y, si la persona acepta, pide el permiso del sistema.
 * Devuelve si quedó concedido. Nunca lanza errores.
 */
export async function pedirPermisoAvisoDescanso(acepta: boolean): Promise<boolean> {
  if (!esNativo()) {
    return false;
  }
  try {
    await Preferences.set({ key: CLAVE_PERMISO_PREGUNTADO, value: 'si' });
    if (!acepta) {
      return false;
    }
    const { display } = await LocalNotifications.requestPermissions();
    return display === 'granted';
  } catch {
    return false;
  }
}

/** Crea (o actualiza) el canal del aviso. Devuelve si quedó disponible. */
async function prepararCanal(): Promise<boolean> {
  try {
    await LocalNotifications.createChannel({
      id: CANAL_AVISO_DESCANSO,
      name: 'Fin del descanso',
      description: 'Avisa cuando termina el descanso entre series.',
      importance: 5,
      visibility: 1,
      vibration: true,
    });
    return true;
  } catch {
    return false;
  }
}

/** Programa (o reprograma) el aviso de fin de descanso. Sin permiso o en la web no hace nada. */
export async function programarAvisoDescanso(finEn: Date, mensaje: string): Promise<void> {
  if (!esNativo() || finEn.getTime() <= Date.now()) {
    return;
  }
  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display !== 'granted') {
      return;
    }
    const canalListo = await prepararCanal();
    await LocalNotifications.cancel({ notifications: [{ id: ID_AVISO_DESCANSO }] });
    await LocalNotifications.schedule({
      notifications: [
        {
          id: ID_AVISO_DESCANSO,
          title: 'SpotterJN',
          body: mensaje,
          // Si el canal no se pudo crear, se usa el canal por defecto para no perder el aviso.
          ...(canalListo ? { channelId: CANAL_AVISO_DESCANSO } : {}),
          schedule: { at: finEn, allowWhileIdle: true },
        },
      ],
    });
  } catch {
    // El temporizador en pantalla sigue funcionando aunque el aviso falle.
  }
}

/** Cancela el aviso pendiente y retira el ya mostrado, para que no queden avisos viejos. */
export async function cancelarAvisoDescanso(): Promise<void> {
  if (!esNativo()) {
    return;
  }
  try {
    await LocalNotifications.cancel({ notifications: [{ id: ID_AVISO_DESCANSO }] });
    await LocalNotifications.removeDeliveredNotifications({
      notifications: [{ id: ID_AVISO_DESCANSO, title: '', body: '' }],
    });
  } catch {
    // Sin efecto visible para la persona.
  }
}
