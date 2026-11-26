import { EJERCICIOS, buscarEjercicio, type EjercicioCatalogo, type Movimiento } from '../data/ejercicios';
import { obtenerGuia } from '../data/guias';
import type { EquipoGimnasio, RutinaAsignada } from '../types/perfil';

/** Por qué la persona quiere cambiar el ejercicio. */
export type MotivoCambio = 'no-puedo' | 'sin-equipo';

export const MAXIMO_ALTERNATIVAS = 3;

/** Del equipo más guiado al más exigente: es lo primero que se ofrece a quien no puede hacer un ejercicio. */
const ORDEN_DE_EQUIPO: readonly EquipoGimnasio[] = ['maquinas', 'poleas', 'mancuernas', 'peso-corporal', 'barra'];

function posicionEquipo(equipo: EquipoGimnasio): number {
  return ORDEN_DE_EQUIPO.indexOf(equipo);
}

/**
 * Ejercicios del mismo movimiento con los que se puede reemplazar uno de la rutina; primero los del
 * mismo grupo muscular y, dentro de cada grupo, los de equipo más guiado.
 * Solo usa el equipo que la persona declaró (el peso corporal siempre está disponible), no repite
 * ningún ejercicio de los días donde ya aparece el actual y, si falta el equipo, evita el mismo equipo.
 */
export function sugerirAlternativas(
  rutina: RutinaAsignada,
  idEjercicio: string,
  motivo: MotivoCambio,
  maximo: number = MAXIMO_ALTERNATIVAS,
): EjercicioCatalogo[] {
  const actual = buscarEjercicio(idEjercicio);
  if (!actual) {
    return [];
  }

  const grupo = obtenerGuia(idEjercicio).grupoMuscular;
  const diasConElActual = rutina.dias.filter((dia) => dia.ejercicios.some((e) => e.id === idEjercicio));
  const yaEnUso = new Set(diasConElActual.flatMap((dia) => dia.ejercicios.map((e) => e.id)));

  return EJERCICIOS.filter(
    (candidato) =>
      candidato.movimiento === actual.movimiento &&
      !yaEnUso.has(candidato.id) &&
      (candidato.equipo === 'peso-corporal' || rutina.cuestionario.equipo.includes(candidato.equipo)) &&
      (motivo === 'no-puedo' || candidato.equipo !== actual.equipo),
  )
    .sort(
      (a, b) =>
        Number(obtenerGuia(a.id).grupoMuscular !== grupo) - Number(obtenerGuia(b.id).grupoMuscular !== grupo) ||
        posicionEquipo(a.equipo) - posicionEquipo(b.equipo),
    )
    .slice(0, Math.max(0, maximo));
}

/** Cambia el ejercicio en todos los días donde aparece, conservando series y repeticiones. */
export function reemplazarEjercicio(
  rutina: RutinaAsignada,
  idEjercicio: string,
  nuevo: EjercicioCatalogo,
): RutinaAsignada {
  return {
    ...rutina,
    dias: rutina.dias.map((dia) => ({
      ...dia,
      ejercicios: dia.ejercicios.map((ejercicio) =>
        ejercicio.id === idEjercicio
          ? { ...ejercicio, id: nuevo.id, nombre: nuevo.nombre, pesoInicialKg: nuevo.pesoInicialKg }
          : ejercicio,
      ),
    })),
  };
}

/** Ejercicios que salieron del catálogo y el movimiento por el que se sustituyen en las rutinas ya guardadas. */
const EJERCICIOS_RETIRADOS: Readonly<Record<string, Movimiento>> = {
  'remo-barra': 'tiron',
};

/**
 * Sustituye en una rutina guardada los ejercicios que ya no existen en el catálogo por uno del mismo movimiento
 * que la persona pueda hacer con su equipo y que no repita otro del mismo día. Si no hay ninguno, lo deja igual.
 */
export function migrarEjerciciosRetirados(rutina: RutinaAsignada): RutinaAsignada {
  let cambiada = false;
  const dias = rutina.dias.map((dia) => {
    const enUso = new Set(dia.ejercicios.map((e) => e.id));
    const ejercicios = dia.ejercicios.map((ejercicio) => {
      const movimiento = EJERCICIOS_RETIRADOS[ejercicio.id];
      if (movimiento === undefined || buscarEjercicio(ejercicio.id) !== undefined) {
        return ejercicio;
      }

      const reemplazo = EJERCICIOS.filter(
        (candidato) =>
          candidato.movimiento === movimiento &&
          !enUso.has(candidato.id) &&
          (candidato.equipo === 'peso-corporal' || rutina.cuestionario.equipo.includes(candidato.equipo)),
      ).sort((a, b) => posicionEquipo(a.equipo) - posicionEquipo(b.equipo))[0];
      if (!reemplazo) {
        return ejercicio;
      }

      cambiada = true;
      enUso.add(reemplazo.id);
      return { ...ejercicio, id: reemplazo.id, nombre: reemplazo.nombre, pesoInicialKg: reemplazo.pesoInicialKg };
    });

    return { ...dia, ejercicios };
  });

  return cambiada ? { ...rutina, dias } : rutina;
}
