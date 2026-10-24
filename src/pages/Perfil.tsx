import { useEffect, useState } from 'react';
import { IonInput } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { BotonSJ, PantallaSJ } from '../components/PantallaSJ';
import CerrarSesion from '../components/CerrarSesion';
import { usePerfil } from '../context/PerfilContext';
import { METAS_PRINCIPALES, type MetaPrincipal, type UnidadPeso } from '../types/perfil';
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
  const history = useHistory();
  const nombreValido = esNombreValido(nombre);

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
      etiqueta="Tu cuenta"
      titulo="Tu perfil"
      reglaBajoTitulo
      pie={
        <>
          <BotonSJ onClick={() => void guardar()}>Guardar cambios</BotonSJ>
          <CerrarSesion />
          <BotonSJ variante="texto" onClick={() => history.goBack()}>Volver</BotonSJ>
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
