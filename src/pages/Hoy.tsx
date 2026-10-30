import { useEffect, useState } from 'react';
import { IonIcon, IonSpinner } from '@ionic/react';
import { helpCircleOutline } from 'ionicons/icons';
import { Redirect, useHistory } from 'react-router-dom';
import { BotonSJ, PantallaSJ } from '../components/PantallaSJ';
import { usePerfil } from '../context/PerfilContext';
import { rutinaLocal, saludLocal } from '../repositories/local';
import type { RespuestasSalud, RutinaAsignada } from '../types/perfil';
import { pesoEnUnidad } from '../utils/unidades';
import { useSesion } from '../context/SesionContext';
import CerrarSesion from '../components/CerrarSesion';

interface DatosHoy {
  usuarioId: string;
  salud: RespuestasSalud | null;
  rutina: RutinaAsignada | null;
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
    void Promise.all([saludLocal.obtener(usuarioId), rutinaLocal.obtener(usuarioId)])
      .then(([salud, rutina]) => {
        if (activo) {
          setDatos({ usuarioId, salud, rutina });
        }
      })
      .catch(() => {
        if (activo) {
          setDatos({ usuarioId, salud: null, rutina: null });
        }
      });

    return () => {
      activo = false;
    };
  }, [usuarioId]);

  if (datos === null || !sesion || datos.usuarioId !== sesion.user.id) {
    return (
      <PantallaSJ titulo="Hoy">
        <div className="sj-cargando">
          <IonSpinner aria-label="Cargando tu sesión" />
        </div>
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
      <ul className="sj-lista sj-lista-hoy">
        {proximaSesion.ejercicios.map((ejercicio) => (
          <li key={ejercicio.id}>
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
              <small className="sj-suave sj-bloque">{ejercicio.series}x{ejercicio.repeticiones}</small>
            </span>
            {ejercicio.pesoInicialKg > 0 ? (
              <p className="sj-peso">
                {pesoEnUnidad(ejercicio.pesoInicialKg, perfil.unidadPeso).toLocaleString('es')}
                <small> {perfil.unidadPeso}</small>
              </p>
            ) : (
              <p className="sj-peso sj-peso-corporal">Peso corporal</p>
            )}
          </li>
        ))}
      </ul>
    </PantallaSJ>
  );
}

export default Hoy;
