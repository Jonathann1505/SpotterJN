export interface MovimientoCalentamiento {
  id: string;
  nombre: string;
  /** Cuánto hacer: repeticiones o tiempo. */
  dosis: string;
  consejo: string;
}

/** Tipos de sesión para los que hay un calentamiento propio. */
export const FOCOS_CALENTAMIENTO = ['completo', 'superior', 'inferior', 'empuje', 'tiron'] as const;
export type FocoCalentamiento = (typeof FOCOS_CALENTAMIENTO)[number];

export const ETIQUETAS_FOCO: Readonly<Record<FocoCalentamiento, string>> = {
  completo: 'Cuerpo completo',
  superior: 'Tren superior',
  inferior: 'Tren inferior',
  empuje: 'Empuje',
  tiron: 'Tirón',
};

/** Qué prepara cada calentamiento, en una frase. */
export const DESCRIPCION_FOCO: Readonly<Record<FocoCalentamiento, string>> = {
  completo: 'Prepara todo el cuerpo: piernas, espalda, hombros y brazos.',
  superior: 'Prepara hombros, pecho, espalda y brazos para el tren superior.',
  inferior: 'Prepara cadera, piernas y tobillos para el tren inferior.',
  empuje: 'Prepara pecho, hombros y brazos para los ejercicios de empuje.',
  tiron: 'Prepara espalda, hombros y cadera para los ejercicios de tirón.',
};

const MARCHA: MovimientoCalentamiento = {
  id: 'marcha',
  nombre: 'Marcha o trote suave en el lugar',
  dosis: '2 minutos',
  consejo: 'Sube el ritmo poco a poco, hasta sentir que el cuerpo entra en calor.',
};

const CIRCULOS_BRAZOS: MovimientoCalentamiento = {
  id: 'circulos-brazos',
  nombre: 'Círculos de brazos',
  dosis: '10 hacia adelante y 10 hacia atrás',
  consejo: 'Empieza con círculos pequeños y ve haciéndolos más grandes.',
};

const ROTACION_HOMBROS: MovimientoCalentamiento = {
  id: 'rotacion-hombros',
  nombre: 'Rotación de hombros',
  dosis: '10 hacia atrás',
  consejo: 'Sube los hombros hacia las orejas y llévalos atrás y abajo, despacio.',
};

const APERTURA_BRAZOS: MovimientoCalentamiento = {
  id: 'apertura-brazos',
  nombre: 'Apertura y cierre de brazos',
  dosis: '10 repeticiones',
  consejo: 'Abre los brazos en cruz y ciérralos cruzándolos delante del pecho.',
};

const FLEXIONES_PARED: MovimientoCalentamiento = {
  id: 'flexiones-pared',
  nombre: 'Flexiones de brazos en la pared',
  dosis: '10 repeticiones',
  consejo: 'Cuerpo recto y codos cerca del torso. Prepara pecho, hombros y brazos.',
};

const ROTACION_TORSO: MovimientoCalentamiento = {
  id: 'rotacion-torso',
  nombre: 'Rotación de torso',
  dosis: '10 por cada lado',
  consejo: 'Pies firmes y brazos cruzados sobre el pecho; gira sin mover las caderas.',
};

const CIRCULOS_MUNECAS: MovimientoCalentamiento = {
  id: 'circulos-munecas',
  nombre: 'Círculos de muñecas',
  dosis: '10 por cada lado',
  consejo: 'Con los antebrazos al frente. Ayuda antes de agarrar barras o mancuernas.',
};

const ROTACION_CADERA: MovimientoCalentamiento = {
  id: 'rotacion-cadera',
  nombre: 'Rotación de cadera',
  dosis: '10 por cada lado',
  consejo: 'Manos en la cintura y círculos amplios, sin mover los hombros.',
};

const SENTADILLAS: MovimientoCalentamiento = {
  id: 'sentadillas',
  nombre: 'Sentadillas sin peso',
  dosis: '10 repeticiones',
  consejo: 'Baja despacio, con el pecho arriba y las rodillas alineadas con los pies.',
};

const ZANCADAS_SUAVES: MovimientoCalentamiento = {
  id: 'zancadas-suaves',
  nombre: 'Zancadas suaves',
  dosis: '6 por cada pierna',
  consejo: 'Paso corto y con control; no hace falta bajar la rodilla hasta el suelo.',
};

const PUENTE_GLUTEOS: MovimientoCalentamiento = {
  id: 'puente-gluteos',
  nombre: 'Puente de glúteos',
  dosis: '10 repeticiones',
  consejo: 'Boca arriba con las rodillas dobladas: sube la cadera apretando los glúteos y baja despacio.',
};

const ELEVACION_TALONES: MovimientoCalentamiento = {
  id: 'elevacion-talones',
  nombre: 'Elevación de talones',
  dosis: '15 repeticiones',
  consejo: 'Sube sobre las puntas de los pies y baja despacio. Prepara tobillos y pantorrillas.',
};

const INCLINACION_CADERA: MovimientoCalentamiento = {
  id: 'buenos-dias',
  nombre: 'Inclinación de cadera con la espalda recta',
  dosis: '10 repeticiones',
  consejo: 'Lleva la cadera hacia atrás con las rodillas ligeramente flexionadas; la espalda no se redondea.',
};

const JUNTAR_OMOPLATOS: MovimientoCalentamiento = {
  id: 'juntar-omoplatos',
  nombre: 'Juntar los omóplatos',
  dosis: '10 repeticiones',
  consejo: 'Con los brazos al frente, llévalos atrás juntando las paletillas, sin arquear la espalda.',
};

const REMO_SIN_PESO: MovimientoCalentamiento = {
  id: 'remo-sin-peso',
  nombre: 'Remo sin peso',
  dosis: '10 repeticiones',
  consejo: 'Inclina un poco el torso y lleva los codos atrás como si jalaras una barra.',
};

export const CALENTAMIENTOS: Readonly<Record<FocoCalentamiento, readonly MovimientoCalentamiento[]>> = {
  completo: [MARCHA, CIRCULOS_BRAZOS, ROTACION_CADERA, SENTADILLAS, INCLINACION_CADERA, FLEXIONES_PARED],
  superior: [
    MARCHA,
    CIRCULOS_BRAZOS,
    ROTACION_HOMBROS,
    APERTURA_BRAZOS,
    FLEXIONES_PARED,
    JUNTAR_OMOPLATOS,
    ROTACION_TORSO,
  ],
  inferior: [
    MARCHA,
    ROTACION_CADERA,
    ELEVACION_TALONES,
    SENTADILLAS,
    ZANCADAS_SUAVES,
    PUENTE_GLUTEOS,
    INCLINACION_CADERA,
  ],
  empuje: [MARCHA, CIRCULOS_BRAZOS, ROTACION_HOMBROS, APERTURA_BRAZOS, FLEXIONES_PARED, CIRCULOS_MUNECAS],
  tiron: [MARCHA, CIRCULOS_BRAZOS, JUNTAR_OMOPLATOS, REMO_SIN_PESO, INCLINACION_CADERA, ROTACION_TORSO],
};

/** Calentamiento general, el de una sesión de cuerpo completo. */
export const CALENTAMIENTO: readonly MovimientoCalentamiento[] = CALENTAMIENTOS.completo;
