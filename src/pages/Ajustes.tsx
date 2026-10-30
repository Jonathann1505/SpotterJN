import { useEffect, useState } from 'react';
import { IonSpinner } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { BotonSJ, PantallaSJ } from '../components/PantallaSJ';
import { useSesion } from '../context/SesionContext';
import { recordatoriosLocal, rutinaLocal } from '../repositories/local';
import {
  MENSAJE_PERMISO,
  activarRecordatorios,
  desactivarRecordatorios,
  permisoDeNotificaciones,
  sincronizarRecordatorios,
} from '../services/recordatorios';
import type { RutinaAsignada } from '../types/perfil';
import type { AjustesRecordatorios } from '../types/recordatorios';
import { describirDias, diasDeEntrenamiento } from '../utils/recordatorios';

function Ajustes() {
  const history = useHistory();
  const { sesion } = useSesion();
  const usuarioId = sesion?.user.id ?? null;
  const [cargando, setCargando] = useState(true);
  const [ajustes, setAjustes] = useState<AjustesRecordatorios | null>(null);
  const [rutina, setRutina] = useState<RutinaAsignada | null>(null);
  const [permisoBloqueado, setPermisoBloqueado] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    let activo = true;
    if (usuarioId === null) {
      return () => {
        activo = false;
      };
    }

    void Promise.all([recordatoriosLocal.obtener(usuarioId), rutinaLocal.obtener(usuarioId), permisoDeNotificaciones()])
      .then(async ([guardados, rutinaGuardada, permiso]) => {
        await sincronizarRecordatorios(guardados, rutinaGuardada);
        if (activo) {
          setAjustes(guardados);
          setRutina(rutinaGuardada);
          setPermisoBloqueado(permiso === 'denied');
        }
      })
      .catch(() => {
        if (activo) {
          setMensaje('No se pudieron cargar tus ajustes. Inténtalo de nuevo.');
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
      <PantallaSJ titulo="Recordatorios">
        <IonSpinner aria-label="Cargando ajustes" />
      </PantallaSJ>
    );
  }

  const pie = <BotonSJ variante="texto" onClick={() => history.goBack()}>Volver</BotonSJ>;

  if (ajustes === null || rutina === null) {
    return (
      <PantallaSJ etiqueta="Ajustes" titulo="Recordatorios" reglaBajoTitulo pie={pie}>
        <p className="sj-texto">
          {ajustes === null
            ? mensaje
            : 'Para programar recordatorios primero necesitas una rutina con tus días de entrenamiento.'}
        </p>
        {ajustes !== null ? (
          <BotonSJ onClick={() => history.push('/cuestionario-rutina')}>Crear mi rutina</BotonSJ>
        ) : null}
      </PantallaSJ>
    );
  }

  const dias = diasDeEntrenamiento(rutina.cuestionario.diasPorSemana);

  const guardarYAplicar = async (siguiente: AjustesRecordatorios): Promise<void> => {
    if (usuarioId === null) {
      return;
    }

    setOcupado(true);
    setMensaje(null);
    try {
      const resultado = siguiente.activo
        ? await activarRecordatorios(rutina.cuestionario.diasPorSemana, siguiente.hora)
        : await desactivarRecordatorios();

      if (!resultado.ok) {
        setPermisoBloqueado(resultado.motivo === 'permiso');
        setMensaje(resultado.mensaje);
        return;
      }

      setPermisoBloqueado(false);
      await recordatoriosLocal.guardar(usuarioId, siguiente);
      setAjustes(siguiente);
    } catch {
      setMensaje('No se pudieron guardar tus ajustes. Inténtalo de nuevo.');
    } finally {
      setOcupado(false);
    }
  };

  const cambiarHora = (hora: string): void => {
    if (hora === '' || usuarioId === null) {
      return;
    }

    if (ajustes.activo) {
      void guardarYAplicar({ activo: true, hora });
      return;
    }

    setAjustes({ ...ajustes, hora });
    void recordatoriosLocal.guardar(usuarioId, { ...ajustes, hora }).catch(() => undefined);
  };

  return (
    <PantallaSJ etiqueta="Ajustes" titulo="Recordatorios" reglaBajoTitulo pie={pie}>
      <p className="sj-texto">
        Te avisamos en tus días de entrenamiento: <strong>{describirDias(dias)}</strong>.
      </p>

      <button
        type="button"
        role="switch"
        aria-checked={ajustes.activo}
        className="sj-opcion"
        disabled={ocupado}
        onClick={() => void guardarYAplicar({ ...ajustes, activo: !ajustes.activo })}
      >
        <span className="sj-opcion-marca" aria-hidden="true">{ajustes.activo ? '✓' : ''}</span>
        Recordarme entrenar
      </button>

      <label className="sj-campo-etiqueta" htmlFor="hora-recordatorio">Hora del recordatorio</label>
      <input
        id="hora-recordatorio"
        className="sj-hora"
        type="time"
        value={ajustes.hora}
        disabled={ocupado}
        onChange={(evento) => cambiarHora(evento.target.value)}
      />

      {permisoBloqueado ? <div className="sj-aviso" role="alert">{MENSAJE_PERMISO}</div> : null}
      {mensaje !== null && !permisoBloqueado ? <p className="sj-error" role="alert">{mensaje}</p> : null}
    </PantallaSJ>
  );
}

export default Ajustes;
