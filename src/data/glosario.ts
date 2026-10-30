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
];

export function buscarTermino(id: string): TerminoGlosario | undefined {
  return GLOSARIO.find((termino) => termino.id === id);
}
