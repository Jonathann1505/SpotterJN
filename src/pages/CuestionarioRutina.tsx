import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { BotonSJ, PantallaSJ } from '../components/PantallaSJ';
import { recordatoriosLocal, rutinaLocal } from '../repositories/local';
import { sincronizarRecordatorios } from '../services/recordatorios';
import { DIAS_MAXIMOS, DIAS_MINIMOS, asignarRutina } from '../utils/rutina';
import { EQUIPOS, EXPERIENCIAS, type EquipoGimnasio, type Experiencia } from '../types/perfil';
import { ETIQUETAS_EQUIPO, ETIQUETAS_EXPERIENCIA } from '../utils/etiquetasRutina';
import { useSesion } from '../context/SesionContext';

const DIAS_PREDETERMINADOS = 3;

function CuestionarioRutina() {
  const [experiencia, setExperiencia] = useState<Experiencia | null>(null);
  const [dias, setDias] = useState(DIAS_PREDETERMINADOS);
  const [equipo, setEquipo] = useState<EquipoGimnasio[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const history = useHistory();
  const { sesion } = useSesion();
  const completo = experiencia !== null && equipo.length > 0;
  const usuarioId = sesion?.user.id ?? null;

  // Al cambiar de rutina se parte de las respuestas anteriores, sin pisar lo que ya se haya tocado.
  useEffect(() => {
    if (usuarioId === null) {
      return undefined;
    }

    let activo = true;
    void rutinaLocal
      .obtener(usuarioId)
      .then((rutina) => {
        if (!activo || rutina === null) {
          return;
        }
        setExperiencia((actual) => actual ?? rutina.cuestionario.experiencia);
        setDias((actual) => (actual === DIAS_PREDETERMINADOS ? rutina.cuestionario.diasPorSemana : actual));
        setEquipo((actual) => (actual.length === 0 ? rutina.cuestionario.equipo : actual));
      })
      .catch(() => undefined);

    return () => {
      activo = false;
    };
  }, [usuarioId]);

  const alternarEquipo = (item: EquipoGimnasio): void => {
    setEquipo((actual) => (actual.includes(item) ? actual.filter((e) => e !== item) : [...actual, item]));
  };

  const verRutina = async (): Promise<void> => {
    if (experiencia === null || equipo.length === 0 || guardando) {
      return;
    }
    if (!sesion) {
      setError('No hay una sesión activa. Inicia sesión e inténtalo de nuevo.');
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      const usuarioId = sesion.user.id;
      const rutina = asignarRutina({ experiencia, diasPorSemana: dias, equipo });
      await rutinaLocal.guardar(usuarioId, rutina);
      // Si ya había recordatorios activos, se ajustan a los días de la nueva rutina.
      void recordatoriosLocal
        .obtener(usuarioId)
        .then((ajustes) => sincronizarRecordatorios(ajustes, rutina))
        .catch(() => undefined);
      history.replace('/rutina');
    } catch {
      setError('No se pudo guardar tu rutina. Inténtalo de nuevo.');
      setGuardando(false);
    }
  };

  return (
    <PantallaSJ
      etiqueta="Tu rutina inicial"
      titulo="Cuéntanos de ti"
      reglaBajoTitulo
      pie={
        <BotonSJ deshabilitado={!completo || guardando} onClick={() => void verRutina()}>
          Ver mi rutina
        </BotonSJ>
      }
    >
      <h2 className="sj-subtitulo" id="pregunta-experiencia">Experiencia previa</h2>
      <div className="sj-segmentos sj-segmentos-columna" role="radiogroup" aria-labelledby="pregunta-experiencia">
        {EXPERIENCIAS.map((opcion) => (
          <button
            key={opcion}
            type="button"
            role="radio"
            aria-checked={experiencia === opcion}
            className="sj-segmento"
            onClick={() => setExperiencia(opcion)}
          >
            {ETIQUETAS_EXPERIENCIA[opcion]}
          </button>
        ))}
      </div>

      <h2 className="sj-subtitulo" id="pregunta-dias">Días disponibles por semana</h2>
      <div className="sj-contador" role="group" aria-labelledby="pregunta-dias">
        <button
          type="button"
          aria-label="Menos días"
          disabled={dias <= DIAS_MINIMOS}
          onClick={() => setDias((actual) => Math.max(DIAS_MINIMOS, actual - 1))}
        >
          −
        </button>
        <output aria-live="polite">{dias}</output>
        <button
          type="button"
          aria-label="Más días"
          disabled={dias >= DIAS_MAXIMOS}
          onClick={() => setDias((actual) => Math.min(DIAS_MAXIMOS, actual + 1))}
        >
          +
        </button>
      </div>

      <h2 className="sj-subtitulo" id="pregunta-equipo">Equipo disponible</h2>
      <div role="group" aria-labelledby="pregunta-equipo">
        {EQUIPOS.map((item) => {
          const marcado = equipo.includes(item);
          return (
            <button
              key={item}
              type="button"
              role="checkbox"
              aria-checked={marcado}
              className="sj-opcion"
              onClick={() => alternarEquipo(item)}
            >
              <span className="sj-opcion-marca" aria-hidden="true">{marcado ? '✓' : ''}</span>
              {ETIQUETAS_EQUIPO[item]}
            </button>
          );
        })}
      </div>
      {error ? <p className="sj-error" role="alert">{error}</p> : null}
    </PantallaSJ>
  );
}

export default CuestionarioRutina;
