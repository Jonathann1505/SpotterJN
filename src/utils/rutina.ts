import { EJERCICIOS, type EjercicioCatalogo, type Movimiento } from '../data/ejercicios';
import type {
  CuestionarioRutina,
  DiaRutina,
  EjercicioRutina,
  Experiencia,
  RutinaAsignada,
} from '../types/perfil';

interface PlantillaDia {
  nombre: string;
  movimientos: Movimiento[];
}

const CUERPO_COMPLETO: PlantillaDia = {
  nombre: 'Cuerpo completo',
  movimientos: ['piernas', 'empuje', 'tiron'],
};
const SUPERIOR: PlantillaDia = { nombre: 'Tren superior', movimientos: ['empuje', 'tiron', 'empuje', 'tiron'] };
const INFERIOR: PlantillaDia = { nombre: 'Tren inferior', movimientos: ['piernas', 'piernas', 'piernas'] };
const EMPUJE: PlantillaDia = { nombre: 'Empuje', movimientos: ['empuje', 'empuje', 'empuje'] };
const TIRON: PlantillaDia = { nombre: 'Tirón', movimientos: ['tiron', 'tiron', 'tiron'] };

const PLANTILLAS_POR_DIAS: Record<number, PlantillaDia[]> = {
  2: [CUERPO_COMPLETO, CUERPO_COMPLETO],
  3: [CUERPO_COMPLETO, CUERPO_COMPLETO, CUERPO_COMPLETO],
  4: [SUPERIOR, INFERIOR, SUPERIOR, INFERIOR],
  5: [EMPUJE, TIRON, INFERIOR, SUPERIOR, INFERIOR],
  6: [EMPUJE, TIRON, INFERIOR, EMPUJE, TIRON, INFERIOR],
};

const SERIES_REPETICIONES: Record<Experiencia, { series: number; repeticiones: number }> = {
  ninguna: { series: 3, repeticiones: 12 },
  'menos-6-meses': { series: 3, repeticiones: 10 },
  'mas-6-meses': { series: 4, repeticiones: 8 },
};

export const DIAS_MINIMOS = 2;
export const DIAS_MAXIMOS = 6;

function elegirEjercicio(
  candidatos: readonly EjercicioCatalogo[],
  usados: ReadonlySet<string>,
  desplazamiento: number,
): EjercicioCatalogo {
  for (let intento = 0; intento < candidatos.length; intento += 1) {
    const candidato = candidatos[(desplazamiento + intento) % candidatos.length];
    if (!usados.has(candidato.id)) {
      return candidato;
    }
  }

  return candidatos[desplazamiento % candidatos.length];
}

export function asignarRutina(cuestionario: CuestionarioRutina, ahora: Date = new Date()): RutinaAsignada {
  const dias = Math.min(Math.max(Math.round(cuestionario.diasPorSemana), DIAS_MINIMOS), DIAS_MAXIMOS);
  const { series, repeticiones } = SERIES_REPETICIONES[cuestionario.experiencia];
  const disponibles = EJERCICIOS.filter(
    (ejercicio) => ejercicio.equipo === 'peso-corporal' || cuestionario.equipo.includes(ejercicio.equipo),
  );

  const diasRutina: DiaRutina[] = PLANTILLAS_POR_DIAS[dias].map((plantilla, indiceDia) => {
    const usados = new Set<string>();
    const ejercicios: EjercicioRutina[] = plantilla.movimientos.map((movimiento, posicion) => {
      const candidatos = disponibles.filter((ejercicio) => ejercicio.movimiento === movimiento);
      const elegido = elegirEjercicio(candidatos, usados, indiceDia + posicion);
      usados.add(elegido.id);
      return {
        id: elegido.id,
        nombre: elegido.nombre,
        series,
        repeticiones,
        pesoInicialKg: elegido.pesoInicialKg,
      };
    });

    return { nombre: `Día ${indiceDia + 1} – ${plantilla.nombre}`, ejercicios };
  });

  return { cuestionario, dias: diasRutina, asignadaEn: ahora.toISOString() };
}

/** Nombre del tipo de sesión sin el prefijo "Día N – ". */
export function tipoDeSesion(nombreDia: string): string {
  return nombreDia.replace(/^Día \d+\s*[–-]\s*/u, '');
}

export function describirRutina(rutina: RutinaAsignada): string {
  const tipos = [...new Set(rutina.dias.map((dia) => tipoDeSesion(dia.nombre).toLowerCase()))];
  const lista =
    tipos.length === 1 ? tipos[0] : `${tipos.slice(0, -1).join(', ')} y ${tipos[tipos.length - 1]}`;

  return tipos.length === 1 ? `Entrenas ${lista} en cada sesión.` : `Alternamos sesiones de ${lista}.`;
}

export interface ResumenSesion {
  ejercicios: number;
  series: number;
  minutos: number;
}

/** Minutos aproximados por serie: unos 45 s de trabajo más el descanso de 90 s del temporizador. */
const MINUTOS_POR_SERIE = 2.25;

/** Resume un día de la rutina; los minutos son una estimación redondeada a múltiplos de 5. */
export function resumirSesion(dia: DiaRutina): ResumenSesion {
  const series = dia.ejercicios.reduce((total, ejercicio) => total + ejercicio.series, 0);
  const minutos = Math.max(5, Math.round((series * MINUTOS_POR_SERIE) / 5) * 5);

  return { ejercicios: dia.ejercicios.length, series, minutos };
}

export function describirSesion(dia: DiaRutina): string {
  const { ejercicios, series, minutos } = resumirSesion(dia);

  const nombreEjercicios = ejercicios === 1 ? 'ejercicio' : 'ejercicios';
  const nombreSeries = series === 1 ? 'serie' : 'series';

  return `${ejercicios} ${nombreEjercicios} · ${series} ${nombreSeries} · ≈ ${minutos} min`;
}

export interface ResumenSemana {
  sesiones: number;
  series: number;
  minutos: number;
}

/** Suma las sesiones de la rutina: un día de la rutina equivale a una sesión semanal. */
export function resumirSemana(rutina: RutinaAsignada): ResumenSemana {
  return rutina.dias.reduce<ResumenSemana>(
    (total, dia) => {
      const resumen = resumirSesion(dia);
      return {
        sesiones: total.sesiones + 1,
        series: total.series + resumen.series,
        minutos: total.minutos + resumen.minutos,
      };
    },
    { sesiones: 0, series: 0, minutos: 0 },
  );
}

export function describirSemana(rutina: RutinaAsignada): string {
  const { sesiones, series, minutos } = resumirSemana(rutina);
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  const tiempo = horas > 0 ? `${horas} h${resto > 0 ? ` ${resto} min` : ''}` : `${minutos} min`;

  return `Cada semana: ${sesiones} sesiones · ${series} series · ≈ ${tiempo} en total`;
}
