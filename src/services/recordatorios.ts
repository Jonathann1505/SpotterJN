import { LocalNotifications, Weekday } from '@capacitor/local-notifications';
import type { RutinaAsignada } from '../types/perfil';
import type { AjustesRecordatorios } from '../types/recordatorios';
import { diasDeEntrenamiento, esHoraValida, separarHora } from '../utils/recordatorios';

const ID_BASE = 7000;
const TODOS_LOS_DIAS: readonly Weekday[] = [
  Weekday.Sunday,
  Weekday.Monday,
  Weekday.Tuesday,
  Weekday.Wednesday,
  Weekday.Thursday,
  Weekday.Friday,
  Weekday.Saturday,
];

export const MENSAJE_PERMISO =
  'Para recibir recordatorios activa las notificaciones de SpotterJN en los ajustes de tu teléfono (Ajustes > Aplicaciones > SpotterJN > Notificaciones) y vuelve a intentarlo.';

export type ResultadoRecordatorios =
  | { ok: true }
  | { ok: false; motivo: 'permiso' | 'hora' | 'error'; mensaje: string };

function idDelDia(dia: Weekday): number {
  return ID_BASE + dia;
}

async function cancelarTodos(): Promise<void> {
  await LocalNotifications.cancel({ notifications: TODOS_LOS_DIAS.map((dia) => ({ id: idDelDia(dia) })) });
}

async function permisoConcedido(): Promise<boolean> {
  const actual = await LocalNotifications.checkPermissions();
  if (actual.display === 'granted') {
    return true;
  }

  if (actual.display === 'denied') {
    return false;
  }

  return (await LocalNotifications.requestPermissions()).display === 'granted';
}

async function programar(diasPorSemana: number, hora: string): Promise<void> {
  const { hour, minute } = separarHora(hora);
  await cancelarTodos();
  await LocalNotifications.schedule({
    notifications: diasDeEntrenamiento(diasPorSemana).map((dia) => ({
      id: idDelDia(dia),
      title: 'Hoy toca entrenar',
      body: 'Tu sesión de SpotterJN te espera.',
      schedule: { on: { weekday: dia, hour, minute }, allowWhileIdle: true },
    })),
  });
}

/** Pide el permiso si hace falta y programa un recordatorio semanal en cada día de entrenamiento. */
export async function activarRecordatorios(diasPorSemana: number, hora: string): Promise<ResultadoRecordatorios> {
  if (!esHoraValida(hora)) {
    return { ok: false, motivo: 'hora', mensaje: 'Elige una hora válida para el recordatorio.' };
  }

  try {
    if (!(await permisoConcedido())) {
      return { ok: false, motivo: 'permiso', mensaje: MENSAJE_PERMISO };
    }

    await programar(diasPorSemana, hora);
    return { ok: true };
  } catch {
    return { ok: false, motivo: 'error', mensaje: 'No se pudieron programar los recordatorios. Inténtalo de nuevo.' };
  }
}

export async function desactivarRecordatorios(): Promise<ResultadoRecordatorios> {
  try {
    await cancelarTodos();
    return { ok: true };
  } catch {
    return { ok: false, motivo: 'error', mensaje: 'No se pudieron cancelar los recordatorios. Inténtalo de nuevo.' };
  }
}

/**
 * Deja los recordatorios programados de acuerdo con los ajustes y la rutina actuales, sin pedir permisos.
 * Se usa cuando cambia la rutina o al abrir los ajustes.
 */
export async function sincronizarRecordatorios(
  ajustes: AjustesRecordatorios,
  rutina: RutinaAsignada | null,
): Promise<void> {
  try {
    if (!ajustes.activo || rutina === null) {
      await cancelarTodos();
      return;
    }

    if ((await LocalNotifications.checkPermissions()).display === 'granted') {
      await programar(rutina.cuestionario.diasPorSemana, ajustes.hora);
    }
  } catch {
    // La sincronización es un intento silencioso: si falla, se reintenta al abrir los ajustes.
  }
}

export async function permisoDeNotificaciones(): Promise<'granted' | 'denied' | 'prompt'> {
  try {
    const { display } = await LocalNotifications.checkPermissions();
    return display === 'granted' || display === 'denied' ? display : 'prompt';
  } catch {
    return 'prompt';
  }
}
