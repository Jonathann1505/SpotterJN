export interface GuiaEjercicio {
  grupoMuscular: string;
  /** Animación dentro de public/, si el ejercicio ya cuenta con una. */
  animacion?: string;
  ajusteMaquina: string;
  movimiento: string;
  ubicacion: string;
}

export const GUIAS: Readonly<Record<string, GuiaEjercicio>> = {
  'press-banca': {
    grupoMuscular: 'Pecho',
    animacion: 'ejercicios/press-banca.html',
    ajusteMaquina:
      'Acuéstate con los ojos justo debajo de la barra. Los soportes deben quedar a la altura de tus brazos casi estirados.',
    movimiento:
      'Baja la barra despacio hasta rozar el pecho y empújala hacia arriba. Pies firmes en el piso y espalda pegada al banco.',
    ubicacion: 'Zona de peso libre, junto a los racks y las barras olímpicas.',
  },
};

export const GUIA_PENDIENTE: GuiaEjercicio = {
  grupoMuscular: 'Ejercicio',
  ajusteMaquina: 'La guía de ajuste de este ejercicio estará disponible pronto. Pide ayuda al personal del gimnasio si lo necesitas.',
  movimiento: 'Haz el movimiento despacio y con control. Si sientes dolor, detente.',
  ubicacion: 'Pregunta en el gimnasio dónde se encuentra este equipo.',
};

export function obtenerGuia(idEjercicio: string): GuiaEjercicio {
  return GUIAS[idEjercicio] ?? GUIA_PENDIENTE;
}
