import type { EquipoGimnasio } from '../types/perfil';

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
  'press-pecho-maquina': {
    grupoMuscular: 'Pecho',
    ajusteMaquina:
      'Ajusta el asiento para que las asas queden a la altura de la mitad de tu pecho. Espalda pegada al respaldo y pies firmes en el piso.',
    movimiento:
      'Empuja las asas hacia adelante hasta estirar los brazos sin bloquear los codos, y regresa despacio sin dejar que las pesas choquen.',
    ubicacion: 'Zona de máquinas de fuerza, junto a las demás máquinas de tren superior.',
  },
  'press-mancuernas': {
    grupoMuscular: 'Pecho',
    ajusteMaquina:
      'Siéntate en un banco con una mancuerna en cada mano apoyada en los muslos y acuéstate llevándolas al pecho. Pies firmes en el piso y espalda pegada al banco.',
    movimiento:
      'Empuja las mancuernas hacia arriba hasta estirar los brazos y bájalas despacio hasta la altura del pecho, con los codos ligeramente abiertos.',
    ubicacion: 'Zona de peso libre, junto al rack de mancuernas y los bancos.',
  },
  'triceps-polea': {
    grupoMuscular: 'Tríceps',
    ajusteMaquina:
      'Coloca la polea en la parte alta con una barra o una cuerda. Párate frente a ella con los codos pegados a los costados.',
    movimiento:
      'Empuja hacia abajo hasta estirar los brazos y sube despacio hasta que los antebrazos queden a la altura del pecho. Solo se mueven los antebrazos.',
    ubicacion: 'Zona de poleas, en la torre o el cruce de poleas.',
  },
  flexiones: {
    grupoMuscular: 'Pecho',
    animacion: 'ejercicios/flexiones.mp4',
    ajusteMaquina:
      'Apoya las manos en el piso un poco más abiertas que los hombros, con el cuerpo en línea recta de la cabeza a los talones. Si te resulta muy difícil, apoya las rodillas.',
    movimiento:
      'Baja el pecho hacia el piso con los codos a unos 45 grados del cuerpo y empuja hasta estirar los brazos. No dejes caer la cadera.',
    ubicacion: 'No necesitas equipo: usa un espacio libre en la zona de estiramiento o una colchoneta.',
  },
  'jalon-pecho': {
    grupoMuscular: 'Espalda',
    ajusteMaquina:
      'Ajusta el rodillo para que sujete tus muslos y toma la barra un poco más abierta que los hombros. Siéntate con el pecho arriba.',
    movimiento:
      'Jala la barra hacia la parte alta del pecho llevando los codos hacia abajo y atrás, y sube despacio hasta estirar los brazos. No te balancees.',
    ubicacion: 'Zona de poleas, en la máquina de jalón con asiento.',
  },
  'remo-maquina': {
    grupoMuscular: 'Espalda',
    ajusteMaquina:
      'Ajusta el asiento para que las asas queden a la altura de tu pecho y apoya el pecho en el soporte.',
    movimiento:
      'Jala las asas hacia ti juntando los omóplatos y regresa despacio hasta estirar los brazos, sin soltar el peso de golpe.',
    ubicacion: 'Zona de máquinas de fuerza, junto a las demás máquinas de espalda.',
  },
  'remo-mancuerna': {
    grupoMuscular: 'Espalda',
    ajusteMaquina:
      'Apoya una mano y la rodilla del mismo lado en un banco, con la espalda recta y casi paralela al piso. Toma la mancuerna con la otra mano, con el brazo estirado.',
    movimiento:
      'Sube la mancuerna hacia la cadera llevando el codo hacia atrás y baja despacio. Al terminar la serie, cambia de lado.',
    ubicacion: 'Zona de peso libre, junto al rack de mancuernas y los bancos.',
  },
  'remo-barra': {
    grupoMuscular: 'Espalda',
    ajusteMaquina:
      'Con la barra en el piso o en un rack, ponte con los pies al ancho de la cadera, inclina el torso hacia adelante con la espalda recta y agarra la barra un poco más abierta que los hombros.',
    movimiento:
      'Jala la barra hacia el abdomen llevando los codos hacia atrás y baja despacio. Mantén la espalda recta; si se redondea, usa menos peso.',
    ubicacion: 'Zona de peso libre, junto a los racks y las barras olímpicas.',
  },
  'remo-invertido': {
    grupoMuscular: 'Espalda',
    ajusteMaquina:
      'Coloca una barra baja en un rack, a la altura de tu cadera, y acuéstate debajo agarrándola con las manos al ancho de los hombros. Cuerpo recto y talones en el piso.',
    movimiento:
      'Jala el pecho hacia la barra sin dejar caer la cadera y baja despacio hasta estirar los brazos. Si te cuesta, dobla las rodillas.',
    ubicacion: 'Zona de peso libre, en un rack o en una máquina Smith con la barra baja.',
  },
  'prensa-piernas': {
    grupoMuscular: 'Piernas',
    ajusteMaquina:
      'Ajusta el respaldo para que las rodillas formen unos 90 grados al bajar. Pon los pies en la plataforma al ancho de los hombros, con la espalda y la cadera pegadas al asiento.',
    movimiento:
      'Empuja la plataforma hasta casi estirar las piernas, sin bloquear las rodillas, y baja despacio. No despegues la cadera del asiento.',
    ubicacion: 'Zona de máquinas de piernas.',
  },
  'sentadilla-goblet': {
    grupoMuscular: 'Piernas',
    ajusteMaquina:
      'Sostén una mancuerna en vertical con ambas manos frente al pecho, con los pies un poco más abiertos que los hombros y las puntas ligeramente hacia afuera.',
    movimiento:
      'Baja como si te sentaras entre los talones, con el pecho arriba y los talones en el piso, y sube empujando el piso.',
    ubicacion: 'Zona de peso libre, junto al rack de mancuernas.',
  },
  'peso-muerto-rumano': {
    grupoMuscular: 'Piernas',
    ajusteMaquina:
      'Con la barra a la altura de la cadera, ponte con los pies al ancho de la cadera y agarra la barra un poco más abierta que los hombros. Rodillas ligeramente flexionadas.',
    movimiento:
      'Lleva la cadera hacia atrás deslizando la barra cerca de las piernas hasta sentir estirarse la parte de atrás del muslo, y sube empujando la cadera hacia adelante. Espalda siempre recta.',
    ubicacion: 'Zona de peso libre, junto a los racks y las barras olímpicas.',
  },
  'curl-femoral': {
    grupoMuscular: 'Piernas',
    ajusteMaquina:
      'Ajusta el rodillo para que quede justo sobre los tobillos, con las rodillas alineadas con el eje de la máquina.',
    movimiento:
      'Flexiona las rodillas llevando los talones hacia los glúteos y vuelve despacio, sin dejar caer el peso de golpe.',
    ubicacion: 'Zona de máquinas de piernas.',
  },
  'sentadilla-peso-corporal': {
    grupoMuscular: 'Piernas',
    animacion: 'ejercicios/sentadilla-peso-corporal.mp4',
    ajusteMaquina:
      'Pon los pies al ancho de los hombros o un poco más, con las puntas ligeramente hacia afuera, y los brazos al frente para equilibrarte.',
    movimiento:
      'Baja como si te sentaras en una silla, con el pecho arriba y los talones en el piso, y sube empujando el piso. Las rodillas siguen la dirección de las puntas de los pies.',
    ubicacion: 'No necesitas equipo: usa un espacio libre en la zona de estiramiento.',
  },
  zancadas: {
    grupoMuscular: 'Piernas',
    ajusteMaquina:
      'De pie con los pies juntos, da un paso largo hacia adelante.',
    movimiento:
      'Baja la rodilla de atrás hacia el piso sin tocarlo, con el torso recto, y empuja con la pierna de adelante para volver. Alterna las piernas.',
    ubicacion: 'No necesitas equipo: usa un espacio libre o un pasillo del gimnasio.',
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

export interface TextosFicha {
  tituloAjuste: string;
  avisoPrimeraVez: string;
}

/** Los textos de la ficha dependen del equipo: «máquina» solo tiene sentido en máquinas y poleas. */
export function textosFicha(equipo: EquipoGimnasio): TextosFicha {
  switch (equipo) {
    case 'maquinas':
    case 'poleas':
      return {
        tituloAjuste: '1. Cómo ajustar la máquina',
        avisoPrimeraVez: 'Primera vez con esta máquina. Tranquilo, te explico todo antes de empezar.',
      };
    case 'barra':
    case 'mancuernas':
      return {
        tituloAjuste: '1. Cómo preparar el equipo',
        avisoPrimeraVez: 'Primera vez con este ejercicio. Tranquilo, te explico todo antes de empezar.',
      };
    case 'peso-corporal':
      return {
        tituloAjuste: '1. Cómo prepararte',
        avisoPrimeraVez: 'Primera vez con este ejercicio. Tranquilo, te explico todo antes de empezar.',
      };
  }
}
