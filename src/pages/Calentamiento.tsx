import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { BotonSJ, PantallaSJ } from '../components/PantallaSJ';
import { CALENTAMIENTO } from '../data/calentamiento';

/** Rutina corta de calentamiento que se va marcando paso a paso antes de entrenar. */
function Calentamiento() {
  const [hechos, setHechos] = useState<ReadonlySet<string>>(new Set());
  const history = useHistory();
  const completo = hechos.size === CALENTAMIENTO.length;

  const alternar = (id: string): void => {
    setHechos((actuales) => {
      const siguientes = new Set(actuales);
      if (siguientes.has(id)) {
        siguientes.delete(id);
      } else {
        siguientes.add(id);
      }
      return siguientes;
    });
  };

  return (
    <PantallaSJ
      atras="/ejercicios"
      etiqueta="Antes de entrenar"
      titulo="Calentamiento"
      reglaBajoTitulo
      pie={completo ? <BotonSJ onClick={() => history.replace('/hoy')}>Ir a Hoy</BotonSJ> : undefined}
    >
      <p className="sj-texto">
        Dedica de 5 a 8 minutos a preparar tu cuerpo. Marca cada paso cuando lo termines. Si sientes dolor, detente.
      </p>
      <p className="sj-texto sj-suave" role="status">
        {completo ? '¡Listo! Ya puedes empezar tu entrenamiento.' : `${hechos.size} de ${CALENTAMIENTO.length} pasos hechos`}
      </p>
      <div role="group" aria-label="Pasos del calentamiento">
        {CALENTAMIENTO.map((movimiento) => {
          const hecho = hechos.has(movimiento.id);
          return (
            <button
              key={movimiento.id}
              type="button"
              role="checkbox"
              aria-checked={hecho}
              className="sj-opcion sj-paso-calentamiento"
              onClick={() => alternar(movimiento.id)}
            >
              <span className="sj-opcion-marca" aria-hidden="true">{hecho ? '✓' : ''}</span>
              <span>
                <strong>{movimiento.nombre}</strong>
                <small className="sj-bloque">{movimiento.dosis}</small>
                <small className="sj-bloque">{movimiento.consejo}</small>
              </span>
            </button>
          );
        })}
      </div>
      <p className="sj-texto sj-suave">
        Antes del primer ejercicio con peso, haz una serie ligera con la mitad de la carga para que tus músculos se
        acostumbren.
      </p>
    </PantallaSJ>
  );
}

export default Calentamiento;
