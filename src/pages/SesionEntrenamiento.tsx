import { useEffect, useRef, useState } from 'react';
import { IonAlert } from '@ionic/react';
import { alertCircleOutline } from 'ionicons/icons';
import { Redirect, useHistory, useLocation } from 'react-router-dom';
import { CargandoSJ } from '../components/CargandoSJ';
import ContadorNumerico from '../components/ContadorNumerico';
import { MiniaturaEjercicio } from '../components/MiniaturaEjercicio';
import { ResumenSesion } from '../components/ResumenSesion';
import TemporizadorDescanso from '../components/TemporizadorDescanso';
import { BotonSJ, PantallaSJ } from '../components/PantallaSJ';
import { usePerfil } from '../context/PerfilContext';
import { useSesion } from '../context/SesionContext';
import { ajustesPesoLocal, rutinaLocal, seriesLocal } from '../repositories/local';
import type { AjustesPeso } from '../types/ajustesPeso';
import { PESO_MAXIMO_MANUAL, recomendarParaEjercicio } from '../utils/progresion';
import {
  cancelarAvisoDescanso,
  estadoAvisoDescanso,
  pedirPermisoAvisoDescanso,
  programarAvisoDescanso,
} from '../services/notificaciones';
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
  retomarSesion,
  saltarEjercicio,
  type Autoevaluacion,
  type ProgresoSesion,
} from '../utils/sesion';
import { pesoEnUnidad } from '../utils/unidades';

interface EstadoSesion {
  /** Posición en `rutina.dias` de la sesión que se quiere hacer; sin indicarla se usa la primera. */
  indiceDia?: number;
}

function elegirDia(rutina: RutinaAsignada, estado: EstadoSesion | undefined): DiaRutina | undefined {
  const indiceDia = Number.isInteger(estado?.indiceDia) ? (estado?.indiceDia ?? 0) : 0;
  return rutina.dias[indiceDia] ?? rutina.dias[0];
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
  // Verdadero si al entrar se siguió una sesión que hoy quedó a medias.
  const [retomada, setRetomada] = useState(false);
  // Referencia de la serie anterior mientras se descansa antes de la siguiente (RF-11).
  // Series guardadas en esta sesión, para el resumen final (RF-19).
  const [seriesDeLaSesion, setSeriesDeLaSesion] = useState<SerieRegistrada[]>([]);
  // Series y ajustes anteriores a esta sesión: dan el peso de partida de cada ejercicio (RF-15, RF-17).
  const [previas, setPrevias] = useState<{ series: SerieRegistrada[]; ajustes: AjustesPeso }>({ series: [], ajustes: {} });
  // `proximoEjercicio` solo se llena cuando el descanso es entre dos ejercicios.
  const [descanso, setDescanso] = useState<{
    repeticiones: number;
    peso: number | null;
    aviso: string;
    proximoEjercicio: string | null;
  } | null>(null);
  // Hora real de fin del descanso en curso, para el aviso en segundo plano (RF-11).
  const [finDescanso, setFinDescanso] = useState<number | null>(null);
  const [preguntarAviso, setPreguntarAviso] = useState(false);
  const avisoRevisado = useRef(false);
  // Aumenta al conceder el permiso, para programar el aviso del descanso que ya está en curso.
  const [permisoConcedido, setPermisoConcedido] = useState(0);
  // Fin del descanso con aviso pendiente: si se sale de la sesión antes, se cancela.
  const finConAvisoPendiente = useRef<number | null>(null);
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
    void Promise.all([
      rutinaLocal.obtener(usuarioId),
      // Si no se pueden leer, se parte del peso inicial del catálogo.
      seriesLocal.listar(usuarioId).catch((): SerieRegistrada[] => []),
      ajustesPesoLocal.obtener(usuarioId).catch((): AjustesPeso => ({})),
    ])
      .then(([guardada, series, ajustes]) => {
        if (!activo) {
          return;
        }
        setRutina(guardada);
        const diaCargado = guardada === null ? undefined : elegirDia(guardada, estadoNavegacion);
        const enCurso = diaCargado === undefined ? null : retomarSesion(diaCargado, series);
        if (diaCargado === undefined || enCurso === null) {
          setPrevias({ series, ajustes });
          return;
        }
        // Si hoy se salió a mitad de esta sesión, se sigue donde quedó en vez de empezar de cero
        // (y repetir series). Las series de hoy no cambian el peso de partida, pero sí el resumen.
        const deHoy = new Set(enCurso.seriesDeHoy.map((serie) => serie.id));
        setPrevias({ series: series.filter((serie) => !deHoy.has(serie.id)), ajustes });
        setSeriesDeLaSesion(enCurso.seriesDeHoy);
        setProgreso(enCurso.progreso);
        setRetomada(true);
        // En un ejercicio a medias se mantienen las repeticiones y el peso de la última serie.
        const actual = diaCargado.ejercicios[enCurso.progreso.indiceEjercicio];
        const ultima = [...enCurso.seriesDeHoy]
          .reverse()
          .find((serie) => serie.idEjercicio === actual?.id && serie.estado === 'completada');
        if (ultima) {
          setRepeticiones(ultima.repeticiones);
          if (ultima.peso !== null && ultima.unidad === perfil.unidadPeso) {
            setPeso(ultima.peso);
          }
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

  // La primera vez que empieza un descanso se explica y se ofrece el aviso; si se rechaza, no se insiste.
  useEffect(() => {
    if (descanso === null || avisoRevisado.current) {
      return;
    }
    avisoRevisado.current = true;
    void estadoAvisoDescanso().then((estado) => {
      if (estado === 'preguntar') {
        setPreguntarAviso(true);
      }
    });
  }, [descanso]);

  // El aviso se programa al empezar el descanso (con la app abierta o en segundo plano) y se reprograma
  // con ±30 s. Al terminar el tiempo NO se cancela, para que la notificación salga; solo se cancela al
  // saltar el descanso, con «Sentí dolor» o al salir de la sesión antes de tiempo.
  const textoAviso = descanso?.aviso ?? null;
  useEffect(() => {
    finConAvisoPendiente.current = finDescanso;
    if (finDescanso === null || textoAviso === null) {
      return;
    }
    void programarAvisoDescanso(new Date(finDescanso), textoAviso);
  }, [finDescanso, textoAviso, permisoConcedido]);

  useEffect(
    () => () => {
      const fin = finConAvisoPendiente.current;
      if (fin !== null && Date.now() < fin) {
        void cancelarAvisoDescanso();
      }
    },
    [],
  );

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

  const dia = elegirDia(rutina, estadoNavegacion);

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
  const pesoDePartida =
    recomendarParaEjercicio(ejercicio, previas.series, perfil.unidadPeso, undefined, previas.ajustes[ejercicio.id] ?? null)
      .peso ?? pesoEnUnidad(ejercicio.pesoInicialKg, perfil.unidadPeso);
  const pesoActual = peso ?? pesoDePartida;

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
    if (finDescanso !== null) {
      void cancelarAvisoDescanso();
    }
    setDescanso(null);
    setFinDescanso(null);
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
    setRetomada(false);
    const siguiente = avanzarSerie(progreso, dia);
    const proximo = dia.ejercicios[siguiente.indiceEjercicio];
    const cambiaDeEjercicio = siguiente.indiceEjercicio !== progreso.indiceEjercicio;
    if (cambiaDeEjercicio) {
      setRepeticiones(null);
      setPeso(null);
    }
    if (!siguiente.completada && proximo) {
      // Se descansa antes de cada serie, también al cambiar de ejercicio (para preparar la máquina);
      // tras la última serie de la sesión no hay descanso.
      setDescanso({
        repeticiones: repeticionesActuales,
        peso: pesoCorporal ? null : pesoActual,
        aviso: cambiaDeEjercicio
          ? `Descanso terminado. Sigue ${proximo.nombre}.`
          : `Descanso terminado. Vamos con la serie ${siguiente.serie} de ${ejercicio.series}.`,
        proximoEjercicio: cambiaDeEjercicio ? proximo.nombre : null,
      });
    }
    setProgreso(siguiente);
    setAutoevaluacion(null);
  };

  // Avance de toda la sesión, contado en series: las de ejercicios anteriores más las ya hechas de este.
  const totalSeries = Math.max(
    1,
    dia.ejercicios.reduce((total, actual) => total + actual.series, 0),
  );
  const seriesHechas =
    dia.ejercicios.slice(0, progreso.indiceEjercicio).reduce((total, actual) => total + actual.series, 0) +
    progreso.serie -
    1;

  return (
    <PantallaSJ atras="/hoy" etiqueta="Sesión de entrenamiento" titulo={dia.nombre} reglaBajoTitulo pie={pie} pieFijo>
      {retomada ? (
        <p className="sj-texto sj-suave" role="status">
          Seguimos donde la dejaste hoy.
        </p>
      ) : null}
      {/* En el descanso el temporizador va arriba para que sus botones no queden bajo «Sentí dolor». */}
      {descanso ? (
        <section className="sj-descanso-bloque" aria-labelledby="descanso-titulo">
          <h2 className="sj-subtitulo" id="descanso-titulo">Descanso</h2>
          <TemporizadorDescanso
            alTerminar={(motivo) => {
              if (motivo === 'saltado') {
                void cancelarAvisoDescanso();
              }
              setDescanso(null);
              setFinDescanso(null);
            }}
            alCambiarFin={setFinDescanso}
          />
          <p className="sj-texto sj-suave">
            Serie anterior: {descanso.repeticiones} repeticiones ·{' '}
            {descanso.peso === null ? 'peso corporal' : `${descanso.peso} ${perfil.unidadPeso}`}
          </p>
          {descanso.proximoEjercicio === null ? null : (
            <p className="sj-texto">
              Prepárate para <strong>{descanso.proximoEjercicio}</strong>
            </p>
          )}
        </section>
      ) : null}
      <section className="sj-tarjeta sj-ejercicio-actual" aria-labelledby="ejercicio-actual">
        <div
          className="sj-ejercicio-avance"
          role="progressbar"
          aria-label="Avance de la sesión"
          aria-valuemin={0}
          aria-valuemax={totalSeries}
          aria-valuenow={seriesHechas}
          aria-valuetext={`${seriesHechas} de ${totalSeries} series hechas`}
        >
          <span style={{ width: `${Math.round((seriesHechas / totalSeries) * 100)}%` }} />
        </div>
        <div className="sj-ejercicio-cabeza">
          <MiniaturaEjercicio idEjercicio={ejercicio.id} nombre={ejercicio.nombre} />
          <div>
            <p className="sj-eyebrow">
              Ejercicio {progreso.indiceEjercicio + 1} de {dia.ejercicios.length}
            </p>
            <h2 className="sj-ejercicio-nombre" id="ejercicio-actual">{ejercicio.nombre}</h2>
          </div>
        </div>
        <div className="sj-ejercicio-series" aria-live="polite">
          <strong>Serie {progreso.serie} de {ejercicio.series}</strong>
          {/* Un cuadro por serie: hechas en negro, la actual en azul y las que faltan vacías. */}
          <span className="sj-series-puntos" aria-hidden="true">
            {Array.from({ length: ejercicio.series }, (_, posicion) => (
              <span
                key={posicion}
                className={
                  posicion + 1 < progreso.serie ? 'sj-punto-hecho' : posicion + 1 === progreso.serie ? 'sj-punto-actual' : ''
                }
              />
            ))}
          </span>
          <span className="sj-ejercicio-objetivo">
            Objetivo {ejercicio.repeticiones} reps{pesoCorporal ? ' · Peso corporal' : ''}
          </span>
        </div>
      </section>

      {descanso ? null : (
        <>
      <ContadorNumerico
        etiqueta="Repeticiones logradas"
        valor={repeticionesActuales}
        onChange={setRepeticiones}
        // Una serie completada tiene al menos una repetición; si no se pudo, existe «Sentí dolor».
        minimo={1}
        maximo={50}
        paso={1}
      />
      {pesoCorporal ? null : (
        <ContadorNumerico
          etiqueta="Peso"
          valor={pesoActual}
          onChange={setPeso}
          minimo={0}
          maximo={PESO_MAXIMO_MANUAL[perfil.unidadPeso]}
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

      <IonAlert
        isOpen={preguntarAviso}
        header="Aviso de fin de descanso"
        backdropDismiss={false}
        message="¿Te avisamos con una notificación cuando termine el descanso, aunque tengas la app en segundo plano?"
        buttons={[
          {
            text: 'Ahora no',
            role: 'cancel',
            handler: () => {
              void pedirPermisoAvisoDescanso(false);
            },
          },
          {
            text: 'Activar',
            role: 'confirm',
            handler: () => {
              void pedirPermisoAvisoDescanso(true).then((concedido) => {
                if (concedido) {
                  setPermisoConcedido((actual) => actual + 1);
                }
              });
            },
          },
        ]}
        onDidDismiss={() => setPreguntarAviso(false)}
      />
    </PantallaSJ>
  );
}

export default SesionEntrenamiento;
