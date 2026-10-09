import type { EquipoGimnasio } from '../types/perfil';

export const MOVIMIENTOS = ['empuje', 'tiron', 'piernas'] as const;
export type Movimiento = (typeof MOVIMIENTOS)[number];

export interface EjercicioCatalogo {
  id: string;
  nombre: string;
  movimiento: Movimiento;
  equipo: EquipoGimnasio;
  /** Peso inicial sugerido en kg; 0 para ejercicios de peso corporal. */
  pesoInicialKg: number;
}

export const EJERCICIOS: readonly EjercicioCatalogo[] = [
  { id: 'press-pecho-maquina', nombre: 'Press de pecho en máquina', movimiento: 'empuje', equipo: 'maquinas', pesoInicialKg: 15 },
  { id: 'press-banca', nombre: 'Press de banca con barra', movimiento: 'empuje', equipo: 'barra', pesoInicialKg: 20 },
  { id: 'press-mancuernas', nombre: 'Press con mancuernas', movimiento: 'empuje', equipo: 'mancuernas', pesoInicialKg: 8 },
  { id: 'triceps-polea', nombre: 'Extensión de tríceps en polea', movimiento: 'empuje', equipo: 'poleas', pesoInicialKg: 10 },
  { id: 'flexiones', nombre: 'Flexiones', movimiento: 'empuje', equipo: 'peso-corporal', pesoInicialKg: 0 },
  { id: 'jalon-pecho', nombre: 'Jalón al pecho', movimiento: 'tiron', equipo: 'poleas', pesoInicialKg: 20 },
  { id: 'remo-maquina', nombre: 'Remo en máquina', movimiento: 'tiron', equipo: 'maquinas', pesoInicialKg: 20 },
  { id: 'remo-mancuerna', nombre: 'Remo con mancuerna', movimiento: 'tiron', equipo: 'mancuernas', pesoInicialKg: 8 },
  { id: 'remo-barra', nombre: 'Remo con barra', movimiento: 'tiron', equipo: 'barra', pesoInicialKg: 20 },
  { id: 'remo-invertido', nombre: 'Remo invertido', movimiento: 'tiron', equipo: 'peso-corporal', pesoInicialKg: 0 },
  { id: 'prensa-piernas', nombre: 'Prensa de piernas', movimiento: 'piernas', equipo: 'maquinas', pesoInicialKg: 40 },
  { id: 'sentadilla-goblet', nombre: 'Sentadilla goblet', movimiento: 'piernas', equipo: 'mancuernas', pesoInicialKg: 10 },
  { id: 'peso-muerto-rumano', nombre: 'Peso muerto rumano', movimiento: 'piernas', equipo: 'barra', pesoInicialKg: 20 },
  { id: 'curl-femoral', nombre: 'Curl femoral en máquina', movimiento: 'piernas', equipo: 'maquinas', pesoInicialKg: 15 },
  { id: 'sentadilla-peso-corporal', nombre: 'Sentadilla con peso corporal', movimiento: 'piernas', equipo: 'peso-corporal', pesoInicialKg: 0 },
  { id: 'zancadas', nombre: 'Zancadas', movimiento: 'piernas', equipo: 'peso-corporal', pesoInicialKg: 0 },
];
