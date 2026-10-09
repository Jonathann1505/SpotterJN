import { useEffect, useState } from 'react';
import {
  IonAlert,
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
  useIonToast,
} from '@ionic/react';
import { Redirect, useHistory } from 'react-router-dom';
import { usePerfil } from '../context/PerfilContext';
import { rutinaLocal, saludLocal } from '../repositories/local';
import { cerrarSesion } from '../services/auth';
import type { RespuestasSalud, RutinaAsignada } from '../types/perfil';
import { pesoEnUnidad } from '../utils/unidades';
import './Hoy.css';

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
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner aria-label="Cargando tu sesión" />
        </IonContent>
      </IonPage>
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
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Hoy</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <section className="hoy-sesion" aria-labelledby="hoy-sesion-nombre">
          <p className="hoy-etiqueta">Próxima sesión</p>
          <h1 id="hoy-sesion-nombre">{sesion.nombre}</h1>
          <ul className="hoy-ejercicios">
            {sesion.ejercicios.map((ejercicio) => (
              <li key={ejercicio.id}>
                <div>
                  <strong>{ejercicio.nombre}</strong>
                  <span>{ejercicio.series}x{ejercicio.repeticiones}</span>
                </div>
                {ejercicio.pesoInicialKg > 0 ? (
                  <p className="hoy-peso">
                    {pesoEnUnidad(ejercicio.pesoInicialKg, perfil.unidadPeso).toLocaleString('es')}
                    <small> {perfil.unidadPeso}</small>
                  </p>
                ) : (
                  <p className="hoy-peso hoy-peso-corporal">Peso corporal</p>
                )}
              </li>
            ))}
          </ul>
        </section>
        <IonButton expand="block" onClick={() => history.push('/sesion')}>
          Empezar entrenamiento
        </IonButton>
        <IonButton expand="block" fill="outline" routerLink="/perfil">
          Perfil
        </IonButton>
        <IonButton expand="block" fill="clear" onClick={() => setAlertaAbierta(true)}>
          Cerrar sesión
        </IonButton>
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
      </IonContent>
    </IonPage>
  );
}

export default Hoy;
