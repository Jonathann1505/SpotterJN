import { useMemo, useState } from 'react';
import type { EjercicioCatalogo } from '../data/ejercicios';
import { rutinaLocal } from '../repositories/local';
import type { RutinaAsignada } from '../types/perfil';
import { reemplazarEjercicio, sugerirAlternativas, type MotivoCambio } from '../utils/alternativas';
import { ETIQUETAS_EQUIPO } from '../utils/etiquetasRutina';

interface PropiedadesCambiar {
  usuarioId: string;
  rutina: RutinaAsignada;
  ejercicio: EjercicioCatalogo;
  /** Se llama cuando la rutina ya quedó guardada con el ejercicio nuevo. */
  onCambiado: (nuevo: EjercicioCatalogo) => void;
}

function textoSinEquipo(equipo: EjercicioCatalogo['equipo']): string {
  return equipo === 'maquinas' || equipo === 'poleas' ? 'No tengo esta máquina' : 'No tengo este equipo';
}

/** Permite reemplazar el ejercicio por una alternativa parecida, sin IA y solo con el equipo declarado. */
export function CambiarEjercicio({ usuarioId, rutina, ejercicio, onCambiado }: PropiedadesCambiar) {
  const [motivo, setMotivo] = useState<MotivoCambio | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const alternativas = useMemo(
    () => (motivo === null ? [] : sugerirAlternativas(rutina, ejercicio.id, motivo)),
    [rutina, ejercicio.id, motivo],
  );
  const puedeFaltarEquipo = ejercicio.equipo !== 'peso-corporal';

  const elegir = async (nuevo: EjercicioCatalogo): Promise<void> => {
    if (guardando) {
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      await rutinaLocal.guardar(usuarioId, reemplazarEjercicio(rutina, ejercicio.id, nuevo));
      onCambiado(nuevo);
    } catch {
      setError('No se pudo cambiar el ejercicio. Inténtalo de nuevo.');
      setGuardando(false);
    }
  };

  return (
    <section className="sj-cambiar" aria-labelledby="titulo-cambiar-ejercicio">
      <hr className="sj-separador" />
      <h2 className="sj-subtitulo sj-subtitulo-ficha" id="titulo-cambiar-ejercicio">¿No puedes hacerlo?</h2>
      <p className="sj-texto sj-suave">Elige el motivo y te sugerimos otro ejercicio parecido para tu rutina.</p>
      <div className="sj-segmentos sj-segmentos-columna">
        <button
          type="button"
          className="sj-segmento"
          aria-pressed={motivo === 'no-puedo'}
          onClick={() => setMotivo('no-puedo')}
        >
          No puedo hacer este ejercicio
        </button>
        {puedeFaltarEquipo ? (
          <button
            type="button"
            className="sj-segmento"
            aria-pressed={motivo === 'sin-equipo'}
            onClick={() => setMotivo('sin-equipo')}
          >
            {textoSinEquipo(ejercicio.equipo)}
          </button>
        ) : null}
      </div>

      {motivo !== null && alternativas.length > 0 ? (
        <div role="group" aria-label="Alternativas sugeridas">
          <p className="sj-texto">Cambiar «{ejercicio.nombre}» por:</p>
          {alternativas.map((alternativa) => (
            <button
              key={alternativa.id}
              type="button"
              className="sj-opcion"
              disabled={guardando}
              onClick={() => void elegir(alternativa)}
            >
              <span>
                {alternativa.nombre}
                <small className="sj-suave sj-bloque">{ETIQUETAS_EQUIPO[alternativa.equipo]}</small>
              </span>
            </button>
          ))}
        </div>
      ) : null}
      {motivo !== null && alternativas.length === 0 ? (
        <p className="sj-texto sj-suave" role="status">
          No encontramos otra opción con tu equipo. Puedes cambiarlo desde «Cambiar mi rutina».
        </p>
      ) : null}
      {error ? <p className="sj-error" role="alert">{error}</p> : null}
    </section>
  );
}
