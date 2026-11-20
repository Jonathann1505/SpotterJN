import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { BotonSJ, PantallaSJ } from '../components/PantallaSJ';
import { CargandoSJ } from '../components/CargandoSJ';
import { usePerfil } from '../context/PerfilContext';
import { useSesion } from '../context/SesionContext';
import { seriesLocal } from '../repositories/local';
import type { UnidadPeso } from '../types/perfil';
import type { SerieRegistrada } from '../types/series';
import { GraficaPeso } from '../components/GraficaPeso';
import { ejerciciosConHistorial, pesoPorSemana, sesionesDeEjercicio, type SesionHistorial } from '../utils/historial';
import { ETIQUETAS_AUTOEVALUACION } from '../utils/sesion';

const SESIONES_RECIENTES = 8;

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });
}

function describirCarga(sesion: SesionHistorial, unidad: UnidadPeso): string {
  const carga = sesion.peso === null ? 'Peso corporal' : `${sesion.peso.toLocaleString('es')} ${unidad}`;
  return `${carga} × ${sesion.repeticiones} repeticiones`;
}

/** Historial de progreso (RF-23): sesiones recientes de cada ejercicio con su autoevaluación. */
function Progreso() {
  const { perfil } = usePerfil();
  const { sesion } = useSesion();
  const usuarioId = sesion?.user.id ?? null;
  const history = useHistory();
  const [series, setSeries] = useState<SerieRegistrada[] | null>(null);
  const [error, setError] = useState(false);
  const [elegido, setElegido] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    if (usuarioId === null) {
      return () => {
        activo = false;
      };
    }

    setSeries(null);
    setError(false);
    void seriesLocal
      .listar(usuarioId)
      .then((guardadas) => {
        if (activo) {
          setSeries(guardadas);
        }
      })
      .catch(() => {
        if (activo) {
          setError(true);
        }
      });

    return () => {
      activo = false;
    };
  }, [usuarioId]);

  if (error) {
    return (
      <PantallaSJ atras="/perfil" etiqueta="Tu avance" titulo="Mi progreso" reglaBajoTitulo>
        <p className="sj-error" role="alert">No se pudo cargar tu historial. Inténtalo de nuevo más tarde.</p>
      </PantallaSJ>
    );
  }

  if (series === null) {
    return (
      <PantallaSJ atras="/perfil" etiqueta="Tu avance" titulo="Mi progreso" reglaBajoTitulo>
        <CargandoSJ etiqueta="Cargando tu historial" />
      </PantallaSJ>
    );
  }

  const ejercicios = ejerciciosConHistorial(series);
  if (ejercicios.length === 0) {
    return (
      <PantallaSJ
        atras="/perfil"
        etiqueta="Tu avance"
        titulo="Mi progreso"
        reglaBajoTitulo
        pie={<BotonSJ onClick={() => history.replace('/hoy')}>Ir a Hoy</BotonSJ>}
      >
        <p className="sj-texto" role="status">
          Todavía no tienes sesiones registradas. Cuando entrenes y guardes tus series, aquí verás cómo avanzas.
        </p>
      </PantallaSJ>
    );
  }

  const ejercicioActual = ejercicios.find((e) => e.id === elegido) ?? ejercicios[0];
  const sesiones = sesionesDeEjercicio(series, ejercicioActual.id, perfil.unidadPeso);
  const puntosSemanales = pesoPorSemana(sesiones);

  return (
    <PantallaSJ atras="/perfil" etiqueta="Tu avance" titulo="Mi progreso" reglaBajoTitulo>
      <div className="sj-filtro" role="group" aria-label="Ejercicio">
        <h2 className="sj-subtitulo">Ejercicio</h2>
        <div className="sj-chips">
          {ejercicios.map((ejercicio) => (
            <button
              key={ejercicio.id}
              type="button"
              className="sj-chip"
              aria-pressed={ejercicio.id === ejercicioActual.id}
              onClick={() => setElegido(ejercicio.id)}
            >
              {ejercicio.nombre}
            </button>
          ))}
        </div>
      </div>

      {sesiones.length < 2 ? (
        <p className="sj-vacio" role="status">
          Con una sesión más de {ejercicioActual.nombre} podremos mostrarte tu progreso. ¡Vas por buen camino!
        </p>
      ) : puntosSemanales.length > 0 ? (
        <>
          <h2 className="sj-subtitulo">Peso por semana</h2>
          <GraficaPeso puntos={puntosSemanales} unidad={perfil.unidadPeso} ejercicio={ejercicioActual.nombre} />
        </>
      ) : (
        <p className="sj-texto sj-suave">Este ejercicio se hace con tu peso corporal, así que no hay peso que graficar.</p>
      )}

      <h2 className="sj-subtitulo">Últimas sesiones</h2>
      <ul className="sj-lista">
        {sesiones.slice(0, SESIONES_RECIENTES).map((fila) => (
          <li key={fila.fecha} className="sj-fila-historial">
            <span>
              <strong>{formatearFecha(fila.fecha)}</strong>
              <small className="sj-suave sj-bloque">{describirCarga(fila, perfil.unidadPeso)}</small>
              {fila.conMolestia ? <small className="sj-suave sj-bloque">Con molestia</small> : null}
            </span>
            {fila.autoevaluacion ? (
              <span className={`sj-evaluacion sj-evaluacion-${fila.autoevaluacion}`}>
                {ETIQUETAS_AUTOEVALUACION[fila.autoevaluacion]}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </PantallaSJ>
  );
}

export default Progreso;
