import { Weekday } from '@capacitor/local-notifications';

export const HORA_PREDETERMINADA = '18:00';

const FORMATO_HORA = /^([01]\d|2[0-3]):([0-5]\d)$/u;

export function esHoraValida(hora: string): boolean {
  return FORMATO_HORA.test(hora);
}

export function separarHora(hora: string): { hour: number; minute: number } {
  const coincidencia = FORMATO_HORA.exec(hora);
  if (!coincidencia) {
    throw new RangeError(`Hora inválida: ${hora}`);
  }

  return { hour: Number(coincidencia[1]), minute: Number(coincidencia[2]) };
}

/**
 * La rutina asigna cuántos días entrenar por semana, pero no qué días exactos; se reparten
 * dejando descanso entre sesiones siempre que es posible.
 */
const DIAS_POR_CANTIDAD: Readonly<Record<number, readonly Weekday[]>> = {
  2: [Weekday.Monday, Weekday.Thursday],
  3: [Weekday.Monday, Weekday.Wednesday, Weekday.Friday],
  4: [Weekday.Monday, Weekday.Tuesday, Weekday.Thursday, Weekday.Friday],
  5: [Weekday.Monday, Weekday.Tuesday, Weekday.Wednesday, Weekday.Thursday, Weekday.Friday],
  6: [Weekday.Monday, Weekday.Tuesday, Weekday.Wednesday, Weekday.Thursday, Weekday.Friday, Weekday.Saturday],
};

export function diasDeEntrenamiento(diasPorSemana: number): readonly Weekday[] {
  const dias = Math.min(Math.max(Math.round(diasPorSemana), 2), 6);
  return DIAS_POR_CANTIDAD[dias];
}
