import type { FC } from 'react';
import {
  IonContent,
  IonPage,
  IonInput,
  IonButton,
  IonItem,
} from '@ionic/react';
import './Login.css';

const Login: FC = () => {
  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="login-container">
          <h1 className="login-title">SpotterJN</h1>
          <IonItem>
            <IonInput
              label="Correo electrónico"
              type="email"
              placeholder="tucorreo@ejemplo.com"
            />
          </IonItem>
          <IonItem>
            <IonInput
              label="Contraseña"
              type="password"
              placeholder="Mínimo 8 caracteres"
            />
          </IonItem>
          <IonButton expand="block" className="ion-margin-top">
            Iniciar sesión
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;