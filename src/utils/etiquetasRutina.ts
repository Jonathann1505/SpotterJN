import type { EquipoGimnasio, Experiencia, MetaPrincipal } from '../types/perfil';

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

export const ETIQUETAS_META: Record<MetaPrincipal, string> = {
  fuerza: 'Ganar fuerza',
  'perder-peso': 'Perder peso',
  tonificar: 'Tonificar',
  resistencia: 'Resistencia',
};
