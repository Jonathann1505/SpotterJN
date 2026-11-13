import { useEffect, useState } from 'react';
import { IonInput } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { BotonSJ, PantallaSJ } from '../components/PantallaSJ';
import CerrarSesion from '../components/CerrarSesion';
import { usePerfil } from '../context/PerfilContext';
import { useSesion } from '../context/SesionContext';
import { rutinaLocal } from '../repositories/local';
import { METAS_PRINCIPALES, type MetaPrincipal, type RutinaAsignada, type UnidadPeso } from '../types/perfil';
import { ETIQUETAS_EQUIPO, ETIQUETAS_EXPERIENCIA } from '../utils/etiquetasRutina';
import { LONGITUD_MAXIMA_NOMBRE, esNombreValido } from '../utils/validaciones';

const ETIQUETAS_META: Record<MetaPrincipal, string> = {
  fuerza: 'Ganar fuerza',
  'perder-peso': 'Perder peso',
  tonificar: 'Tonificar',
  resistencia: 'Resistencia',
};

const UNIDADES: readonly UnidadPeso[] = ['kg', 'lb'];

function Perfil() {
  const { perfil, guardarPerfil } = usePerfil();
  const [nombre, setNombre] = useState(perfil.nombre);
  const [meta, setMeta] = useState<MetaPrincipal>(perfil.meta);
  const [nombreTocado, setNombreTocado] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rutina, setRutina] = useState<RutinaAsignada | null>(null);
  const history = useHistory();
  const { sesion } = useSesion();
  const usuarioId = sesion?.user.id ?? null;
  const nombreValido = esNombreValido(nombre);

  useEffect(() => {
    if (usuarioId === null) {
      return undefined;
    }

    let activo = true;
    void rutinaLocal
      .obtener(usuarioId)
      .then((guardada) => {
        if (activo) {
          setRutina(guardada);
        }
      })
      .catch(() => undefined);

    return () => {
      activo = false;
    };
  }, [usuarioId]);

  useEffect(() => {
    setNombre(perfil.nombre);
    setMeta(perfil.meta);
  }, [perfil.nombre, perfil.meta]);

  const cambiarUnidad = async (unidadPeso: UnidadPeso): Promise<void> => {
    setError(null);
    try {
      await guardarPerfil({ ...perfil, unidadPeso });
    } catch {
      setError('No se pudo cambiar la unidad. Inténtalo de nuevo.');
    }
  };

  const guardar = async (): Promise<void> => {
    setNombreTocado(true);
    if (!nombreValido) {
      return;
    }

    setError(null);
    setMensaje(null);
    try {
      await guardarPerfil({ ...perfil, nombre: nombre.trim(), meta });
      setMensaje('Perfil actualizado.');
    } catch {
      setError('No se pudo guardar el perfil. Inténtalo de nuevo.');
    }
  };

  return (
    <PantallaSJ
      atras="/hoy"
      etiqueta="Tu cuenta"
      titulo="Tu perfil"
      reglaBajoTitulo
      pie={
        <>
          <BotonSJ onClick={() => void guardar()}>Guardar cambios</BotonSJ>
          <BotonSJ variante="secundario" onClick={() => history.push('/rutina')}>Mi rutina</BotonSJ>
          <BotonSJ variante="secundario" onClick={() => history.push('/ajustes')}>Recordatorios</BotonSJ>
          <BotonSJ variante="secundario" onClick={() => history.push('/glosario')}>Glosario</BotonSJ>
          <CerrarSesion />
        </>
      }
    >
      <IonInput
        className="sj-campo"
        label="Nombre"
        labelPlacement="stacked"
        fill="outline"
        maxlength={LONGITUD_MAXIMA_NOMBRE + 10}
        value={nombre}
        onIonInput={(evento) => setNombre(String(evento.detail.value ?? ''))}
        onIonBlur={() => setNombreTocado(true)}
      />
      {nombreTocado && !nombreValido ? (
        <p className="sj-error" role="alert">
          El nombre es obligatorio y admite hasta {LONGITUD_MAXIMA_NOMBRE} caracteres.
        </p>
      ) : null}

      {rutina ? (
        <section className="sj-resumen-rutina" aria-labelledby="resumen-rutina">
          <h2 className="sj-subtitulo" id="resumen-rutina">Tu rutina actual</h2>
          <p className="sj-texto">
            {rutina.dias.length} días por semana · Experiencia: {ETIQUETAS_EXPERIENCIA[rutina.cuestionario.experiencia].toLowerCase()}
          </p>
          <p className="sj-texto sj-suave">
            Equipo: {rutina.cuestionario.equipo.map((item) => ETIQUETAS_EQUIPO[item].toLowerCase()).join(', ')}
          </p>
        </section>
      ) : null}

      <h2 className="sj-subtitulo" id="pregunta-meta">Meta principal</h2>
      <div className="sj-segmentos sj-segmentos-columna" role="radiogroup" aria-labelledby="pregunta-meta">
        {METAS_PRINCIPALES.map((opcion) => (
          <button
            key={opcion}
            type="button"
            role="radio"
            aria-checked={meta === opcion}
            className="sj-segmento"
            onClick={() => setMeta(opcion)}
          >
            {ETIQUETAS_META[opcion]}
          </button>
        ))}
      </div>

      <h2 className="sj-subtitulo" id="pregunta-unidad">Unidad de peso</h2>
      <div className="sj-segmentos" role="radiogroup" aria-labelledby="pregunta-unidad">
        {UNIDADES.map((unidad) => (
          <button
            key={unidad}
            type="button"
            role="radio"
            aria-checked={perfil.unidadPeso === unidad}
            className="sj-segmento"
            onClick={() => void cambiarUnidad(unidad)}
          >
            {unidad}
          </button>
        ))}
      </div>

      {mensaje ? <p className="sj-ok" role="status">{mensaje}</p> : null}
      {error ? <p className="sj-error" role="alert">{error}</p> : null}
    </PantallaSJ>
  );
}

export default Perfil;
