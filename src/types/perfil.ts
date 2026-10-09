export type UnidadPeso = 'kg' | 'lb';

export const METAS_PRINCIPALES = ['fuerza', 'perder-peso', 'tonificar', 'resistencia'] as const;
export type MetaPrincipal = (typeof METAS_PRINCIPALES)[number];

export interface PerfilUsuario {
  nombre: string;
  meta: MetaPrincipal;
  unidadPeso: UnidadPeso;
}

export const CONDICIONES_SALUD = ['dolor-articular', 'problema-cardiaco', 'embarazo'] as const;
export type CondicionSalud = (typeof CONDICIONES_SALUD)[number];

export interface RespuestasSalud {
  condiciones: CondicionSalud[];
  respondidoEn: string;
}

export const EXPERIENCIAS = ['ninguna', 'menos-6-meses', 'mas-6-meses'] as const;
export type Experiencia = (typeof EXPERIENCIAS)[number];

export const EQUIPOS = ['mancuernas', 'barra', 'maquinas', 'poleas', 'peso-corporal'] as const;
export type EquipoGimnasio = (typeof EQUIPOS)[number];

export interface CuestionarioRutina {
  experiencia: Experiencia;
  diasPorSemana: number;
  equipo: EquipoGimnasio[];
}

export interface EjercicioRutina {
  id: string;
  nombre: string;
  series: number;
  repeticiones: number;
}

export interface DiaRutina {
  nombre: string;
  ejercicios: EjercicioRutina[];
}

export interface RutinaAsignada {
  cuestionario: CuestionarioRutina;
  dias: DiaRutina[];
  asignadaEn: string;
}
