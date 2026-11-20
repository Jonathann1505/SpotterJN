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
import { describirDias } from '../utils/recordatorios';
import { describirSesion } from '../utils/rutina';
import { sesionParaFecha } from '../utils/semana';
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

  // Sin historial de sesiones (M3), la sesión que toca se calcula con el día de la semana.
  const sesionDelDia = sesionParaFecha(datos.rutina, new Date());
  if (sesionDelDia === null) {
    return <Redirect to="/cuestionario-rutina" />;
  }

  const proximaSesion = sesionDelDia.dia;
  const nombreDia = describirDias([sesionDelDia.diaSemana]);
  const nombrePerfil = perfil.nombre.trim();
  const saludo = sesionDelDia.esHoy
    ? 'Esta es tu sesión de hoy.'
    : `Hoy descansas. Tu próxima sesión es el ${nombreDia}.`;

  return (
    <PantallaSJ
      mostrarLogo
      etiqueta={sesionDelDia.esHoy ? 'Hoy toca' : `Próxima sesión · ${nombreDia}`}
      titulo={proximaSesion.nombre}
      reglaBajoTitulo
      pie={
        <>
          <BotonSJ onClick={() => history.push('/sesion', { indiceDia: sesionDelDia.indice })}>Empezar entrenamiento</BotonSJ>
          <BotonSJ variante="secundario" onClick={() => history.push('/perfil')}>Perfil</BotonSJ>
          <CerrarSesion />
        </>
      }
    >
      <p className="sj-texto">{nombrePerfil !== '' ? `Hola, ${nombrePerfil}. ${saludo}` : saludo}</p>
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
