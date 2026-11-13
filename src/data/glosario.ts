export interface TerminoGlosario {
  id: string;
  termino: string;
  definicion: string;
}

export const GLOSARIO: readonly TerminoGlosario[] = [
  {
    id: 'serie',
    termino: 'Serie',
    definicion:
      'Un grupo de repeticiones seguidas de un mismo ejercicio. Por ejemplo, 3 series de 10 significa hacer 10 repeticiones, descansar, y repetir eso 3 veces.',
  },
  {
    id: 'repeticion',
    termino: 'Repetición',
    definicion: 'Una vez completa del movimiento: bajar y subir la barra, por ejemplo, cuenta como una repetición.',
  },
  {
    id: 'fallo',
    termino: 'Fallo',
    definicion:
      'El punto en que ya no puedes completar otra repetición con buena forma. No tienes que llegar al fallo: en SpotterJN buscamos que termines cada serie con control.',
  },
  {
    id: 'rir',
    termino: 'RIR',
    definicion:
      'Repeticiones en reserva: cuántas repeticiones más podrías hacer antes de llegar al fallo. Si terminas una serie y te habrían sobrado 2, tu RIR es 2.',
  },
  {
    id: 'peso-de-trabajo',
    termino: 'Peso de trabajo',
    definicion:
      'El peso con el que haces tus series normales: lo bastante pesado para que cueste, pero que te deja terminar todas las repeticiones con buena técnica.',
  },
  {
    id: 'calentamiento',
    termino: 'Calentamiento',
    definicion:
      'Unos minutos de movimiento suave antes de empezar, como caminar o hacer el ejercicio con muy poco peso, para preparar músculos y articulaciones.',
  },
  {
    id: 'descanso',
    termino: 'Descanso entre series',
    definicion:
      'El tiempo que esperas entre una serie y la siguiente para recuperar el aliento y las fuerzas. En SpotterJN el temporizador empieza en 90 segundos.',
  },
  {
    id: 'tecnica',
    termino: 'Técnica',
    definicion:
      'La forma correcta de hacer un ejercicio: postura, recorrido y velocidad. Con buena técnica entrenas el músculo que quieres y cuidas tus articulaciones.',
  },
  {
    id: 'progresion',
    termino: 'Progresión',
    definicion:
      'Aumentar poco a poco el peso o las repeticiones cuando el ejercicio ya te resulta controlable. Avanzar despacio es lo que te hace más fuerte sin lesionarte.',
  },
  {
    id: 'peso-corporal',
    termino: 'Peso corporal',
    definicion:
      'Ejercicios que haces sin pesas ni máquinas, usando solo tu propio cuerpo como resistencia, como las flexiones o las zancadas.',
  },
];

export function buscarTermino(id: string): TerminoGlosario | undefined {
  return GLOSARIO.find((termino) => termino.id === id);
}
