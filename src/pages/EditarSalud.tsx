import './Salud.css';
import { useEffect, useState } from 'react';
import { Redirect } from 'react-router-dom';
import { BotonSJ, PantallaSJ } from '../components/PantallaSJ';
import { CargandoSJ } from '../components/CargandoSJ';
import { useSesion } from '../context/SesionContext';
import { saludLocal } from '../repositories/local';
import { CONDICIONES_SALUD, type CondicionSalud } from '../types/perfil';
import { ETIQUETAS_CONDICION } from '../utils/etiquetasSalud';

type Estado = 'cargando' | 'sin-respuestas' | 'listo';

/** Permite corregir las respuestas del cuestionario de salud sin volver a pasar por el flujo inicial (RF-05). */
function EditarSalud() {
  const { sesion } = useSesion();
  const usuarioId = sesion?.user.id ?? null;
  const [estado, setEstado] = useState<Estado>('cargando');
  const [condiciones, setCondiciones] = useState<CondicionSalud[]>([]);
  const [respondidoEn, setRespondidoEn] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    if (usuarioId === null) {
      return () => {
        activo = false;
      };
    }

    void saludLocal
      .obtener(usuarioId)
      .then((guardadas) => {
        if (!activo) {
          return;
        }
        if (guardadas === null) {
          setEstado('sin-respuestas');
          return;
        }
        setCondiciones(guardadas.condiciones);
        setRespondidoEn(guardadas.respondidoEn);
        setEstado('listo');
      })
      .catch(() => {
        if (activo) {
          setEstado('sin-respuestas');
        }
      });

    return () => {
      activo = false;
    };
  }, [usuarioId]);

  if (estado === 'cargando') {
    return (
      <PantallaSJ atras="/perfil" etiqueta="Tu salud primero" titulo="Mis respuestas de salud" reglaBajoTitulo>
        <CargandoSJ etiqueta="Cargando tus respuestas" />
      </PantallaSJ>
    );
  }

  if (estado === 'sin-respuestas') {
    return <Redirect to="/aviso-medico" />;
  }

  const ninguna = condiciones.length === 0;

  const alternar = (condicion: CondicionSalud): void => {
    setMensaje(null);
    setCondiciones((actuales) =>
      actuales.includes(condicion) ? actuales.filter((c) => c !== condicion) : [...actuales, condicion],
    );
  };

  const guardar = async (): Promise<void> => {
    if (usuarioId === null || guardando) {
      return;
    }

    setGuardando(true);
    setError(null);
    setMensaje(null);
    try {
      const ahora = new Date().toISOString();
      await saludLocal.guardar(usuarioId, { condiciones, respondidoEn: ahora });
      setRespondidoEn(ahora);
      setMensaje('Respuestas actualizadas.');
    } catch {
      setError('No se pudieron guardar tus respuestas. Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <PantallaSJ
      atras="/perfil"
      etiqueta="Tu salud primero"
      titulo="Mis respuestas de salud"
      reglaBajoTitulo
      pie={
        <BotonSJ deshabilitado={guardando} onClick={() => void guardar()}>
          Guardar cambios
        </BotonSJ>
      }
    >
      <p className="sj-texto">Marca las condiciones que tengas ahora. Si no tienes ninguna, déjalas todas sin marcar.</p>
      {respondidoEn ? (
        <p className="sj-texto sj-suave">
          Última actualización: {new Date(respondidoEn).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      ) : null}
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
              onClick={() => alternar(condicion)}
            >
              <span className="sj-opcion-marca" aria-hidden="true">{marcada ? '✓' : ''}</span>
              {ETIQUETAS_CONDICION[condicion]}
            </button>
          );
        })}
      </div>
      {ninguna ? (
        <p className="sj-texto sj-suave">Sin condiciones marcadas: «Ninguna de las anteriores».</p>
      ) : (
        <div className="sj-aviso" role="alert">
          Te recomendamos consultar a un médico antes de empezar a entrenar.
        </div>
      )}
      {mensaje ? <p className="sj-ok" role="status">{mensaje}</p> : null}
      {error ? <p className="sj-error" role="alert">{error}</p> : null}
    </PantallaSJ>
  );
}

export default EditarSalud;
