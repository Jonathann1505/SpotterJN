import './Salud.css';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { BotonSJ, PantallaSJ } from '../components/PantallaSJ';
import { saludLocal } from '../repositories/local';
import { CONDICIONES_SALUD, type CondicionSalud } from '../types/perfil';
import { useSesion } from '../context/SesionContext';

const ETIQUETAS: Record<CondicionSalud, string> = {
  'dolor-articular': 'Dolor articular',
  'problema-cardiaco': 'Problema cardíaco',
  embarazo: 'Embarazo',
};

const RUTA_SIGUIENTE = '/cuestionario-rutina';

function CuestionarioSalud() {
  const [condiciones, setCondiciones] = useState<CondicionSalud[]>([]);
  const [ninguna, setNinguna] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const history = useHistory();
  const { sesion } = useSesion();
  const hayCondicion = condiciones.length > 0;
  const respondido = ninguna || hayCondicion;

  const alternarCondicion = (condicion: CondicionSalud): void => {
    setNinguna(false);
    setCondiciones((actuales) =>
      actuales.includes(condicion) ? actuales.filter((c) => c !== condicion) : [...actuales, condicion],
    );
  };

  const alternarNinguna = (): void => {
    const marcada = !ninguna;
    setNinguna(marcada);
    if (marcada) {
      setCondiciones([]);
    }
  };

  const continuar = async (): Promise<void> => {
    if (!respondido || guardando) {
      return;
    }
    if (!sesion) {
      setError('No hay una sesión activa. Inicia sesión e inténtalo de nuevo.');
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      await saludLocal.guardar(sesion.user.id, { condiciones, respondidoEn: new Date().toISOString() });
      history.replace(RUTA_SIGUIENTE);
    } catch {
      setError('No se pudieron guardar tus respuestas. Inténtalo de nuevo.');
      setGuardando(false);
    }
  };

  return (
    <PantallaSJ
      etiqueta="Tu salud primero"
      titulo="Cuestionario de salud"
      reglaBajoTitulo
      pie={
        <BotonSJ deshabilitado={!respondido || guardando} onClick={() => void continuar()}>
          {hayCondicion ? 'Entiendo el riesgo y continúo' : 'Continuar'}
        </BotonSJ>
      }
    >
      <p className="sj-texto">Marca si tienes alguna de estas condiciones.</p>
      <div role="group" aria-label="Condiciones de salud">
        {CONDICIONES_SALUD.map((condicion) => {
          const marcada = condiciones.includes(condicion);
          return (
            <button
              key={condicion}
              type="button"
              role="checkbox"
              aria-checked={marcada}
              className="sj-opcion"
              onClick={() => alternarCondicion(condicion)}
            >
              <span className="sj-opcion-marca" aria-hidden="true">{marcada ? '✓' : ''}</span>
              {ETIQUETAS[condicion]}
            </button>
          );
        })}
        <button type="button" role="checkbox" aria-checked={ninguna} className="sj-opcion" onClick={alternarNinguna}>
          <span className="sj-opcion-marca" aria-hidden="true">{ninguna ? '✓' : ''}</span>
          Ninguna de las anteriores
        </button>
      </div>
      {hayCondicion ? (
        <div className="sj-aviso" role="alert">
          Te recomendamos consultar a un médico antes de empezar a entrenar.
        </div>
      ) : null}
      {error ? <p className="sj-error" role="alert">{error}</p> : null}
    </PantallaSJ>
  );
}

export default CuestionarioSalud;
