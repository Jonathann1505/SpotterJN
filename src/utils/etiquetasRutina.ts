import type { EquipoGimnasio, Experiencia } from '../types/perfil';

export const ETIQUETAS_EXPERIENCIA: Record<Experiencia, string> = {
  ninguna: 'Ninguna',
  'menos-6-meses': 'Menos de 6 meses',
  'mas-6-meses': 'Más de 6 meses',
};

export const ETIQUETAS_EQUIPO: Record<EquipoGimnasio, string> = {
  mancuernas: 'Mancuernas',
  barra: 'Barra y discos',
  maquinas: 'Máquinas guiadas',
  poleas: 'Poleas',
  'peso-corporal': 'Solo peso corporal',
};
