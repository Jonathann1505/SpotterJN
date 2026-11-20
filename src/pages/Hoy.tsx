import { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { helpCircleOutline } from 'ionicons/icons';
import { Redirect, useHistory } from 'react-router-dom';
import { MiniaturaEjercicio } from '../components/MiniaturaEjercicio';
import { CargandoSJ } from '../components/CargandoSJ';
import { BotonSJ, PantallaSJ } from '../components/PantallaSJ';
import { usePerfil } from '../context/PerfilContext';
import { rutinaLocal, saludLocal, seriesLocal } from '../repositories/local';
import type { RespuestasSalud, RutinaAsignada } from '../types/perfil';
import type { SerieRegistrada } from '../types/series';
import { recomendarParaEjercicio } from '../utils/progresion';
import { describirSesion } from '../utils/rutina';
import { useSesion } from '../context/SesionContext';
import CerrarSesion from '../components/CerrarSesion';

interface DatosHoy {
  usuarioId: string;
  salud: RespuestasSalud | null;
  rutina: RutinaAsignada | null;
  series: SerieRegistrada[];
}

function Hoy() {
  const [datos, setDatos] = useState<DatosHoy | null>(null);
  const { perfil } = usePerfil();
  const { sesion } = useSesion();
  const usuarioId = sesion?.user.id ?? null;
  const history = useHistory();

  useEffect(() => {
    let activo = true;
    if (usuarioId === null) {
      setDatos(null);
      return () => {
        activo = false;
      };
    }

    setDatos(null);
    void Promise.all([
      saludLocal.obtener(usuarioId),
      rutinaLocal.obtener(usuarioId),
      // Sin series legibles se muestra el peso inicial: no bloquea la pantalla.
      seriesLocal.listar(usuarioId).catch((): SerieRegistrada[] => []),
    ])
      .then(([salud, rutina, series]) => {
        if (activo) {
          setDatos({ usuarioId, salud, rutina, series });
        }
      })
      .catch(() => {
        if (activo) {
          setDatos({ usuarioId, salud: null, rutina: null, series: [] });
        }
      });

    return () => {
      activo = false;
    };
  }, [usuarioId]);

  if (datos === null || !sesion || datos.usuarioId !== sesion.user.id) {
    return (
      <PantallaSJ titulo="Hoy">
        <CargandoSJ etiqueta="Cargando tu sesión" />
      </PantallaSJ>
    );
  }

  if (datos.salud === null) {
    return <Redirect to="/aviso-medico" />;
  }

  if (datos.rutina === null) {
    return <Redirect to="/cuestionario-rutina" />;
  }

  // Hasta que exista el historial de sesiones (M3), la próxima sesión es el primer día de la rutina.
  const proximaSesion = datos.rutina.dias[0];

  return (
    <PantallaSJ
      mostrarLogo
      etiqueta="Próxima sesión"
      titulo={proximaSesion.nombre}
      reglaBajoTitulo
      pie={
        <>
          <BotonSJ onClick={() => history.push('/sesion')}>Empezar entrenamiento</BotonSJ>
          <BotonSJ variante="secundario" onClick={() => history.push('/perfil')}>Perfil</BotonSJ>
          <CerrarSesion />
        </>
      }
    >
      {perfil.nombre.trim() !== '' ? <p className="sj-texto">Hola, {perfil.nombre.trim()}. Esta es tu sesión de hoy.</p> : null}
      <p className="sj-texto sj-suave">{describirSesion(proximaSesion)}</p>
      <ul className="sj-lista sj-lista-hoy">
        {proximaSesion.ejercicios.map((ejercicio) => {
          // Peso recomendado por la progresión (RF-15 a RF-17); sin series es el peso inicial.
          const recomendacion = recomendarParaEjercicio(ejercicio, datos.series, perfil.unidadPeso);
          return (
          <li key={ejercicio.id} className="sj-fila-ejercicio">
            <MiniaturaEjercicio idEjercicio={ejercicio.id} nombre={ejercicio.nombre} />
            <span>
              <button
                type="button"
                className="sj-enlace-ejercicio"
                aria-label={`Ver la ficha de ${ejercicio.nombre}`}
                onClick={() => history.push(`/ejercicio/${ejercicio.id}`)}
              >
                <strong>{ejercicio.nombre}</strong>
                <IonIcon icon={helpCircleOutline} aria-hidden="true" />
              </button>
              <small className="sj-suave sj-bloque">{ejercicio.series}x{recomendacion.repeticiones}</small>
              {recomendacion.motivo === 'sin-series' ? null : (
                <small className="sj-suave sj-bloque">{recomendacion.explicacion}</small>
              )}
            </span>
            {recomendacion.peso !== null ? (
              <p className="sj-peso">
                {recomendacion.peso.toLocaleString('es')}
                <small> {perfil.unidadPeso}</small>
              </p>
            ) : (
              <p className="sj-peso sj-peso-corporal">Peso corporal</p>
            )}
          </li>
          );
        })}
      </ul>
    </PantallaSJ>
  );
}

export default Hoy;
