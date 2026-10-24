import { useEffect, useState } from 'react';
import { IonAlert, IonIcon, IonSpinner, useIonToast } from '@ionic/react';
import { helpCircleOutline } from 'ionicons/icons';
import { Redirect, useHistory } from 'react-router-dom';
import { BotonSJ, PantallaSJ } from '../components/PantallaSJ';
import { usePerfil } from '../context/PerfilContext';
import { rutinaLocal, saludLocal } from '../repositories/local';
import { cerrarSesion } from '../services/auth';
import type { RespuestasSalud, RutinaAsignada } from '../types/perfil';
import { pesoEnUnidad } from '../utils/unidades';

interface DatosHoy {
  salud: RespuestasSalud | null;
  rutina: RutinaAsignada | null;
}

function Hoy() {
  const [alertaAbierta, setAlertaAbierta] = useState(false);
  const [datos, setDatos] = useState<DatosHoy | null>(null);
  const [mostrarToast] = useIonToast();
  const { perfil } = usePerfil();
  const history = useHistory();

  useEffect(() => {
    let activo = true;
    void Promise.all([saludLocal.obtener(), rutinaLocal.obtener()])
      .then(([salud, rutina]) => {
        if (activo) {
          setDatos({ salud, rutina });
        }
      })
      .catch(() => {
        if (activo) {
          setDatos({ salud: null, rutina: null });
        }
      });

    return () => {
      activo = false;
    };
  }, []);

  // La pantalla de sesión (M3) todavía no existe en esta rama; ir a '/sesion' deja la app en blanco.
  const avisarSesionPendiente = async (): Promise<void> => {
    await mostrarToast({
      message: 'La sesión de entrenamiento estará disponible pronto.',
      duration: 3000,
    });
  };

  const confirmarCierreSesion = async (): Promise<void> => {
    const resultado = await cerrarSesion();
    if (!resultado.ok) {
      await mostrarToast({ message: resultado.mensaje, duration: 3000, color: 'danger' });
      return;
    }

    history.replace('/login');
  };

  if (datos === null) {
    return (
      <PantallaSJ titulo="Hoy">
        <IonSpinner aria-label="Cargando tu sesión" />
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
  const sesion = datos.rutina.dias[0];

  return (
    <PantallaSJ
      mostrarLogo
      etiqueta="Próxima sesión"
      titulo={sesion.nombre}
      reglaBajoTitulo
      pie={
        <>
          <BotonSJ onClick={() => void avisarSesionPendiente()}>Empezar entrenamiento</BotonSJ>
          <BotonSJ variante="secundario" onClick={() => history.push('/perfil')}>Perfil</BotonSJ>
          <BotonSJ variante="texto" onClick={() => setAlertaAbierta(true)}>Cerrar sesión</BotonSJ>
        </>
      }
    >
      <ul className="sj-lista sj-lista-hoy">
        {sesion.ejercicios.map((ejercicio) => (
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
      <IonAlert
        isOpen={alertaAbierta}
        header="Cerrar sesión"
        message="¿Quieres cerrar tu sesión?"
        buttons={[
          { text: 'Cancelar', role: 'cancel', handler: () => setAlertaAbierta(false) },
          {
            text: 'Cerrar sesión',
            role: 'confirm',
            handler: () => void confirmarCierreSesion(),
          },
        ]}
        onDidDismiss={() => setAlertaAbierta(false)}
      />
    </PantallaSJ>
  );
}

export default Hoy;
