import { useEffect, useState } from 'react';
import { IonSpinner } from '@ionic/react';
import { Redirect, useHistory } from 'react-router-dom';
import ContadorNumerico from '../components/ContadorNumerico';
import { BotonSJ, PantallaSJ } from '../components/PantallaSJ';
import { usePerfil } from '../context/PerfilContext';
import { useSesion } from '../context/SesionContext';
import { rutinaLocal } from '../repositories/local';
import type { DiaRutina, RutinaAsignada } from '../types/perfil';
import {
  AUTOEVALUACIONES,
  ETIQUETAS_AUTOEVALUACION,
  PROGRESO_INICIAL,
  avanzarSerie,
  esPesoCorporal,
  type Autoevaluacion,
  type ProgresoSesion,
} from '../utils/sesion';
import { pesoEnUnidad } from '../utils/unidades';

function SesionEntrenamiento() {
  const [rutina, setRutina] = useState<RutinaAsignada | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progreso, setProgreso] = useState<ProgresoSesion>(PROGRESO_INICIAL);
  const [autoevaluacion, setAutoevaluacion] = useState<Autoevaluacion | null>(null);
  const [repeticiones, setRepeticiones] = useState<number | null>(null);
  const [peso, setPeso] = useState<number | null>(null);
  const { perfil } = usePerfil();
  const { sesion } = useSesion();
  const usuarioId = sesion?.user.id ?? null;
  const history = useHistory();

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
      <PantallaSJ etiqueta="Sesión de entrenamiento" titulo="Preparando tu sesión">
        <div className="sj-cargando">
          <IonSpinner aria-label="Cargando tu rutina" />
        </div>
      </PantallaSJ>
    );
  }

  if (error) {
    return (
      <PantallaSJ etiqueta="Sesión de entrenamiento" titulo="No se pudo cargar">
        <p className="sj-error" role="alert">{error}</p>
        <BotonSJ variante="secundario" onClick={() => history.replace('/hoy')}>Volver a Hoy</BotonSJ>
      </PantallaSJ>
    );
  }

  if (!rutina) {
    return <Redirect to="/cuestionario-rutina" />;
  }

  const dia: DiaRutina | undefined = rutina.dias[0];

  if (!dia) {
    return (
      <PantallaSJ etiqueta="Sesión de entrenamiento" titulo="Rutina incompleta">
        <p className="sj-error" role="alert">Tu rutina todavía no tiene una jornada asignada.</p>
        <BotonSJ variante="secundario" onClick={() => history.replace('/hoy')}>Volver a Hoy</BotonSJ>
      </PantallaSJ>
    );
  }

  const volver = (
    <BotonSJ variante="secundario" onClick={() => history.replace('/hoy')}>Volver</BotonSJ>
  );
  const ejercicio = dia.ejercicios[progreso.indiceEjercicio];

  if (progreso.completada || !ejercicio) {
    return (
      <PantallaSJ etiqueta="Sesión de entrenamiento" titulo="Sesión completada" reglaBajoTitulo>
        <p className="sj-texto" role="status">
          Terminaste todas las series de {dia.nombre}. ¡Buen trabajo!
        </p>
        <BotonSJ onClick={() => history.replace('/hoy')}>Volver a Hoy</BotonSJ>
      </PantallaSJ>
    );
  }

  const pesoCorporal = esPesoCorporal(ejercicio);
  const repeticionesActuales = repeticiones ?? ejercicio.repeticiones;
  const pesoActual = peso ?? pesoEnUnidad(ejercicio.pesoInicialKg, perfil.unidadPeso);

  const guardarSerie = (): void => {
    if (autoevaluacion === null) {
      return;
    }
    const siguiente = avanzarSerie(progreso, dia);
    if (siguiente.indiceEjercicio !== progreso.indiceEjercicio) {
      setRepeticiones(null);
      setPeso(null);
    }
    setProgreso(siguiente);
    setAutoevaluacion(null);
  };

  return (
    <PantallaSJ etiqueta="Sesión de entrenamiento" titulo={dia.nombre} reglaBajoTitulo pie={volver}>
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

      <BotonSJ deshabilitado={autoevaluacion === null} onClick={guardarSerie}>
        Guardar serie
      </BotonSJ>
    </PantallaSJ>
  );
}

export default SesionEntrenamiento;
