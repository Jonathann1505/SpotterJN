import { useEffect, useRef, useState } from 'react';
import { IonAlert } from '@ionic/react';
import { alertCircleOutline } from 'ionicons/icons';
import { Redirect, useHistory, useLocation } from 'react-router-dom';
import { CargandoSJ } from '../components/CargandoSJ';
import ContadorNumerico from '../components/ContadorNumerico';
import { ResumenSesion } from '../components/ResumenSesion';
import TemporizadorDescanso from '../components/TemporizadorDescanso';
import { BotonSJ, PantallaSJ } from '../components/PantallaSJ';
import { usePerfil } from '../context/PerfilContext';
import { useSesion } from '../context/SesionContext';
import { rutinaLocal, seriesLocal } from '../repositories/local';
import type { DiaRutina, RutinaAsignada } from '../types/perfil';
import type { SerieRegistrada } from '../types/series';
import {
  AUTOEVALUACIONES,
  ETIQUETAS_AUTOEVALUACION,
  PROGRESO_INICIAL,
  avanzarSerie,
  crearSerieRegistrada,
  esPesoCorporal,
  esUltimoEjercicio,
  saltarEjercicio,
  type Autoevaluacion,
  type ProgresoSesion,
} from '../utils/sesion';
import { pesoEnUnidad } from '../utils/unidades';

interface EstadoSesion {
  /** Posición en `rutina.dias` de la sesión que se quiere hacer; sin indicarla se usa la primera. */
  indiceDia?: number;
}

function SesionEntrenamiento() {
  const [rutina, setRutina] = useState<RutinaAsignada | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progreso, setProgreso] = useState<ProgresoSesion>(PROGRESO_INICIAL);
  const [autoevaluacion, setAutoevaluacion] = useState<Autoevaluacion | null>(null);
  const [repeticiones, setRepeticiones] = useState<number | null>(null);
  const [peso, setPeso] = useState<number | null>(null);
  const [alertaDolor, setAlertaDolor] = useState(false);
  const [terminadaPorMolestia, setTerminadaPorMolestia] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);
  const [avisoMolestia, setAvisoMolestia] = useState<string | null>(null);
  // Referencia de la serie anterior mientras se descansa antes de la siguiente (RF-11).
  // Series guardadas en esta sesión, para el resumen final (RF-19).
  const [seriesDeLaSesion, setSeriesDeLaSesion] = useState<SerieRegistrada[]>([]);
  const [descanso, setDescanso] = useState<{ repeticiones: number; peso: number | null } | null>(null);
  // Evita guardar dos veces si se toca rápido antes de que React actualice el estado.
  const guardadoEnCurso = useRef(false);
  const { perfil } = usePerfil();
  const { sesion } = useSesion();
  const usuarioId = sesion?.user.id ?? null;
  const history = useHistory();
  const { state: estadoNavegacion } = useLocation<EstadoSesion | undefined>();

  useEffect(() => {
    let activo = true;

    if (usuarioId === null) {
      setRutina(null);
      setCargando(false);
      return () => {
        activo = false;
      };
    }

    setRutina(null);
    setError(null);
    setCargando(true);
    void rutinaLocal
      .obtener(usuarioId)
      .then((guardada) => {
        if (activo) {
          setRutina(guardada);
        }
      })
      .catch(() => {
        if (activo) {
          setError('No se pudo cargar tu rutina. Inténtalo de nuevo.');
        }
      })
      .finally(() => {
        if (activo) {
          setCargando(false);
        }
      });

    return () => {
      activo = false;
    };
  }, [usuarioId]);

  if (cargando) {
    return (
      <PantallaSJ atras="/hoy" etiqueta="Sesión de entrenamiento" titulo="Preparando tu sesión">
        <CargandoSJ etiqueta="Cargando tu rutina" />
      </PantallaSJ>
    );
  }

  if (error) {
    return (
      <PantallaSJ atras="/hoy" etiqueta="Sesión de entrenamiento" titulo="No se pudo cargar">
        <p className="sj-error" role="alert">{error}</p>
        <BotonSJ variante="secundario" onClick={() => history.replace('/hoy')}>Volver a Hoy</BotonSJ>
      </PantallaSJ>
    );
  }

  if (!rutina) {
    return <Redirect to="/cuestionario-rutina" />;
  }

  const indiceDia = Number.isInteger(estadoNavegacion?.indiceDia) ? (estadoNavegacion?.indiceDia ?? 0) : 0;
  const dia: DiaRutina | undefined = rutina.dias[indiceDia] ?? rutina.dias[0];

  if (!dia) {
    return (
      <PantallaSJ atras="/hoy" etiqueta="Sesión de entrenamiento" titulo="Rutina incompleta">
        <p className="sj-error" role="alert">Tu rutina todavía no tiene una jornada asignada.</p>
        <BotonSJ variante="secundario" onClick={() => history.replace('/hoy')}>Volver a Hoy</BotonSJ>
      </PantallaSJ>
    );
  }

  const ejercicio = dia.ejercicios[progreso.indiceEjercicio];

  if ((progreso.completada || !ejercicio) && terminadaPorMolestia) {
    return (
      <PantallaSJ atras="/hoy" etiqueta="Sesión de entrenamiento" titulo="Sesión finalizada" reglaBajoTitulo>
        <p className="sj-texto" role="status">
          Detuviste la sesión por una molestia. Descansa y, si el dolor continúa o es intenso,
          consulta a un profesional de la salud antes de volver a entrenar.
        </p>
        {avisoMolestia ? <p className="sj-error" role="alert">{avisoMolestia}</p> : null}
        <ResumenSesion dia={dia} usuarioId={usuarioId} unidad={perfil.unidadPeso} seriesDeLaSesion={seriesDeLaSesion} />
        <BotonSJ onClick={() => history.replace('/hoy')}>Volver a Hoy</BotonSJ>
      </PantallaSJ>
    );
  }

  if (progreso.completada || !ejercicio) {
    return (
      <PantallaSJ atras="/hoy" etiqueta="Sesión de entrenamiento" titulo="Sesión completada" reglaBajoTitulo>
        <p className="sj-texto" role="status">
          Terminaste todas las series de {dia.nombre}. ¡Buen trabajo!
        </p>
        <ResumenSesion dia={dia} usuarioId={usuarioId} unidad={perfil.unidadPeso} seriesDeLaSesion={seriesDeLaSesion} />
        <BotonSJ onClick={() => history.replace('/hoy')}>Volver a Hoy</BotonSJ>
      </PantallaSJ>
    );
  }

  const pesoCorporal = esPesoCorporal(ejercicio);
  const repeticionesActuales = repeticiones ?? ejercicio.repeticiones;
  const pesoActual = peso ?? pesoEnUnidad(ejercicio.pesoInicialKg, perfil.unidadPeso);

  const ultimoEjercicio = esUltimoEjercicio(progreso, dia);

  const registrarSerie = async (estado: 'completada' | 'interrumpida-por-molestia'): Promise<void> => {
    if (usuarioId === null) {
      throw new Error('Sin sesión activa.');
    }
    const serie = crearSerieRegistrada({
      dia,
      ejercicio,
      numeroSerie: progreso.serie,
      repeticiones: repeticionesActuales,
      peso: pesoActual,
      unidad: perfil.unidadPeso,
      autoevaluacion,
      estado,
    });
    await seriesLocal.guardar(usuarioId, serie);
    setSeriesDeLaSesion((anteriores) => [...anteriores, serie]);
  };

  const continuarTrasDolor = async (): Promise<void> => {
    if (guardadoEnCurso.current) {
      return;
    }
    guardadoEnCurso.current = true;
    setAlertaDolor(false);
    setGuardando(true);
    setErrorGuardado(null);
    setAvisoMolestia(null);
    try {
      // La serie queda marcada como interrumpida y no cuenta como fallida (RF-13).
      await registrarSerie('interrumpida-por-molestia');
    } catch {
      // La prioridad es que la persona se detenga: se avanza igual y se informa.
      setAvisoMolestia('No se pudo guardar el registro de la molestia en este dispositivo.');
    } finally {
      guardadoEnCurso.current = false;
      setGuardando(false);
    }
    const siguiente = saltarEjercicio(progreso, dia);
    setDescanso(null);
    setTerminadaPorMolestia(siguiente.completada);
    setProgreso(siguiente);
    setAutoevaluacion(null);
    setRepeticiones(null);
    setPeso(null);
  };

  const pie = (
    <>
      <BotonSJ
        variante="secundario"
        icono={alertCircleOutline}
        deshabilitado={guardando}
        onClick={() => setAlertaDolor(true)}
      >
        Sentí dolor
      </BotonSJ>
    </>
  );

  const guardarSerie = async (): Promise<void> => {
    if (autoevaluacion === null || guardadoEnCurso.current) {
      return;
    }
    guardadoEnCurso.current = true;
    setGuardando(true);
    setErrorGuardado(null);
    setAvisoMolestia(null);
    try {
      await registrarSerie('completada');
    } catch {
      // Sin avanzar ni perder lo escrito: el usuario puede reintentar.
      setErrorGuardado('No se pudo guardar la serie. Inténtalo de nuevo.');
      return;
    } finally {
      guardadoEnCurso.current = false;
      setGuardando(false);
    }
    const siguiente = avanzarSerie(progreso, dia);
    if (siguiente.indiceEjercicio !== progreso.indiceEjercicio) {
      setRepeticiones(null);
      setPeso(null);
    } else if (!siguiente.completada) {
      // Quedan series de este ejercicio: se descansa antes de la siguiente.
      setDescanso({ repeticiones: repeticionesActuales, peso: pesoCorporal ? null : pesoActual });
    }
    setProgreso(siguiente);
    setAutoevaluacion(null);
  };

  return (
    <PantallaSJ atras="/hoy" etiqueta="Sesión de entrenamiento" titulo={dia.nombre} reglaBajoTitulo pie={pie} pieFijo>
      <section className="sj-tarjeta" aria-labelledby="ejercicio-actual">
        <p className="sj-eyebrow">
          Ejercicio {progreso.indiceEjercicio + 1} de {dia.ejercicios.length}
        </p>
        <h2 className="sj-subtitulo" id="ejercicio-actual">{ejercicio.nombre}</h2>
        <p className="sj-texto" aria-live="polite">
          <strong>Serie {progreso.serie} de {ejercicio.series}</strong>
          <small className="sj-suave sj-bloque">
            Objetivo: {ejercicio.repeticiones} repeticiones
            {pesoCorporal ? ' · Peso corporal' : ''}
          </small>
        </p>
      </section>

      {descanso ? (
        <section aria-labelledby="descanso-titulo">
          <h3 className="sj-subtitulo" id="descanso-titulo">Descanso</h3>
          <p className="sj-texto sj-suave">
            Serie anterior: {descanso.repeticiones} repeticiones ·{' '}
            {descanso.peso === null ? 'peso corporal' : `${descanso.peso} ${perfil.unidadPeso}`}
          </p>
          <TemporizadorDescanso alTerminar={() => setDescanso(null)} />
        </section>
      ) : (
        <>
      <ContadorNumerico
        etiqueta="Repeticiones logradas"
        valor={repeticionesActuales}
        onChange={setRepeticiones}
        minimo={0}
        maximo={50}
        paso={1}
      />
      {pesoCorporal ? null : (
        <ContadorNumerico
          etiqueta="Peso"
          valor={pesoActual}
          onChange={setPeso}
          minimo={0}
          unidad={perfil.unidadPeso}
        />
      )}

      <h3 className="sj-subtitulo" id="autoevaluacion-titulo">¿Cómo se sintió esta serie?</h3>
      <div className="sj-segmentos" role="radiogroup" aria-labelledby="autoevaluacion-titulo">
        {AUTOEVALUACIONES.map((opcion) => (
          <button
            key={opcion}
            type="button"
            role="radio"
            aria-checked={autoevaluacion === opcion}
            className="sj-segmento"
            onClick={() => setAutoevaluacion(opcion)}
          >
            {ETIQUETAS_AUTOEVALUACION[opcion]}
          </button>
        ))}
      </div>

      {avisoMolestia ? <p className="sj-error" role="alert">{avisoMolestia}</p> : null}
      {errorGuardado ? <p className="sj-error" role="alert">{errorGuardado}</p> : null}
      <BotonSJ deshabilitado={autoevaluacion === null || guardando} onClick={() => void guardarSerie()}>
        {guardando ? 'Guardando…' : 'Guardar serie'}
      </BotonSJ>
        </>
      )}

      <IonAlert
        isOpen={alertaDolor}
        header="Detén este ejercicio"
        message="Sentir dolor no es normal durante el entrenamiento. Detén este ejercicio y, si el dolor continúa o es intenso, consulta a un profesional de la salud. Esta serie no cuenta como fallida."
        backdropDismiss={false}
        buttons={[
          {
            text: ultimoEjercicio ? 'Entendido, terminar la sesión' : 'Entendido, continuar con otro ejercicio',
            role: 'confirm',
            handler: () => {
              void continuarTrasDolor();
            },
          },
        ]}
        onDidDismiss={() => setAlertaDolor(false)}
      />
    </PantallaSJ>
  );
}

export default SesionEntrenamiento;
