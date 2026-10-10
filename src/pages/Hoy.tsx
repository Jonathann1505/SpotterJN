import { useState } from 'react';
import {
  IonAlert,
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonToast,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { cerrarSesion } from '../services/auth';

function Hoy() {
  const [alertaAbierta, setAlertaAbierta] = useState(false);
  const [mostrarToast] = useIonToast();
  const history = useHistory();

  const confirmarCierreSesion = async (): Promise<void> => {
    const resultado = await cerrarSesion();
    if (!resultado.ok) {
      await mostrarToast({ message: resultado.mensaje, duration: 3000, color: 'danger' });
      return;
    }

    history.replace('/login');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Hoy</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1>Hoy</h1>
        <p>Tu espacio de entrenamiento estará disponible aquí.</p>
        <IonButton expand="block" onClick={() => setAlertaAbierta(true)}>
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
