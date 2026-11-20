export interface MovimientoCalentamiento {
  id: string;
  nombre: string;
  /** Cuánto hacer: repeticiones o tiempo. */
  dosis: string;
  consejo: string;
}

export const CALENTAMIENTO: readonly MovimientoCalentamiento[] = [
  {
    id: 'marcha',
    nombre: 'Marcha o trote suave en el lugar',
    dosis: '2 minutos',
    consejo: 'Sube el ritmo poco a poco, hasta sentir que el cuerpo entra en calor.',
  },
  {
    id: 'circulos-brazos',
    nombre: 'Círculos de brazos',
    dosis: '10 hacia adelante y 10 hacia atrás',
    consejo: 'Empieza con círculos pequeños y ve haciéndolos más grandes.',
  },
  {
    id: 'rotacion-cadera',
    nombre: 'Rotación de cadera',
    dosis: '10 por cada lado',
    consejo: 'Manos en la cintura y círculos amplios, sin mover los hombros.',
  },
  {
    id: 'sentadillas',
    nombre: 'Sentadillas sin peso',
    dosis: '10 repeticiones',
    consejo: 'Baja despacio, con el pecho arriba y las rodillas alineadas con los pies.',
  },
  {
    id: 'buenos-dias',
    nombre: 'Inclinación de cadera con la espalda recta',
    dosis: '10 repeticiones',
    consejo: 'Lleva la cadera hacia atrás con las rodillas ligeramente flexionadas; la espalda no se redondea.',
  },
  {
    id: 'flexiones-pared',
    nombre: 'Flexiones de brazos en la pared',
    dosis: '10 repeticiones',
    consejo: 'Cuerpo recto y codos cerca del torso. Prepara pecho, hombros y brazos.',
  },
];
