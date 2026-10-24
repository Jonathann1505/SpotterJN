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
