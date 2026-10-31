import { useEffect, useId, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IonIcon } from '@ionic/react';
import { helpCircleOutline } from 'ionicons/icons';
import { buscarTermino } from '../data/glosario';
import { BotonSJ } from './PantallaSJ';
import '../theme/spotter-ui.css';

interface PropiedadesAyuda {
  /** Identificador del término en el glosario. */
  termino: string;
  /** Texto visible junto al ícono; si no se indica, solo se muestra el ícono. */
  children?: ReactNode;
}

export function AyudaTermino({ termino, children }: PropiedadesAyuda) {
  const [abierto, setAbierto] = useState(false);
  const idTitulo = useId();
  const entrada = buscarTermino(termino);

  useEffect(() => {
    if (!abierto) {
      return undefined;
    }

    const alPulsar = (evento: KeyboardEvent): void => {
      if (evento.key === 'Escape') {
        setAbierto(false);
      }
    };
    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, [abierto]);

  if (!entrada) {
    return children ? <>{children}</> : null;
  }

  return (
    <>
      <button
        type="button"
        className="sj-termino"
        aria-label={`¿Qué es ${entrada.termino.toLowerCase()}?`}
        aria-haspopup="dialog"
        onClick={() => setAbierto(true)}
      >
        {children ? <span className="sj-termino-texto">{children}</span> : null}
        <IonIcon icon={helpCircleOutline} aria-hidden="true" />
      </button>
      {abierto
        ? createPortal(
            <div className="sj sj-dialogo-fondo" onClick={() => setAbierto(false)}>
              <div
                className="sj-dialogo"
                role="dialog"
                aria-modal="true"
                aria-labelledby={idTitulo}
                onClick={(evento) => evento.stopPropagation()}
              >
                <p className="sj-eyebrow">Glosario</p>
                <h2 className="sj-dialogo-titulo" id={idTitulo}>{entrada.termino}</h2>
                <p className="sj-texto">{entrada.definicion}</p>
                <BotonSJ onClick={() => setAbierto(false)}>Entendido</BotonSJ>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
