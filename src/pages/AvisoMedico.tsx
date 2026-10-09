import { IonButton, IonContent, IonPage } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import './AuthPages.css';

function AvisoMedico() {
  const history = useHistory();

  return (
    <IonPage>
      <IonContent className="auth-page">
        <main className="auth-page-content">
          <section className="auth-page-card" aria-labelledby="aviso-title">
            <h1 id="aviso-title">Aviso médico</h1>
            <p>
              SpotterJN ofrece orientación general para personas que empiezan a entrenar y no
              reemplaza la valoración de un profesional de la salud.
            </p>
            <p>
              Si sientes dolor, mareo o molestias durante el ejercicio, detente y consulta a un
              médico o a un profesional del entrenamiento.
            </p>
            <IonButton
              className="auth-submit"
              expand="block"
              onClick={() => history.push('/salud')}
            >
              Entendido
            </IonButton>
          </section>
        </main>
      </IonContent>
    </IonPage>
  );
}

export default AvisoMedico;
