import {
  IonApp,
  IonButton,
  IonContent,
  IonPage,
  IonRouterOutlet,
  IonSpinner,
  IonText,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import type { PropsWithChildren } from 'react';
import { Redirect, Route } from 'react-router-dom';
import AvisoMedico from './pages/AvisoMedico';
import Consentimientos from './pages/Consentimientos';
import CuestionarioSalud from './pages/CuestionarioSalud';
import Hoy from './pages/Hoy';
import Login from './pages/Login';
import Registro from './pages/Registro';
import { ProveedorSesion, useSesion } from './context/SesionContext';

function RutaInvitado({ children }: PropsWithChildren) {
  const { sesion } = useSesion();
  return sesion ? <Redirect to="/hoy" /> : children;
}

function EstadoInicialSesion() {
  const { cargando, error, recargarSesion } = useSesion();

  if (cargando) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner aria-label="Cargando sesión" />
        </IonContent>
      </IonPage>
    );
  }

  if (error) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonText color="danger">
            <p>{error}</p>
          </IonText>
          <IonButton onClick={() => void recargarSesion()}>Reintentar</IonButton>
        </IonContent>
      </IonPage>
    );
  }

  return null;
}

function RutasAplicacion() {
  const { sesion, cargando, error } = useSesion();

  if (cargando || error) {
    return <EstadoInicialSesion />;
  }

  return (
    <IonReactRouter>
      <IonRouterOutlet>
        <Route exact path="/">
          <Redirect to={sesion ? '/hoy' : '/login'} />
        </Route>
        <Route exact path="/login">
          <RutaInvitado>
            <Login />
          </RutaInvitado>
        </Route>
        <Route exact path="/consentimientos" component={Consentimientos} />
        <Route exact path="/registro">
          <RutaInvitado>
            <Registro />
          </RutaInvitado>
        </Route>
        <Route exact path="/hoy">
          {sesion ? <Hoy /> : <Redirect to="/login" />}
        </Route>
        <Route exact path="/aviso-medico">
          {sesion ? <AvisoMedico /> : <Redirect to="/login" />}
        </Route>
        <Route exact path="/salud">
          {sesion ? <CuestionarioSalud /> : <Redirect to="/login" />}
        </Route>
        <Route exact path="/terminos">
          <IonPage>
            <IonContent className="ion-padding"><h1>Términos</h1></IonContent>
          </IonPage>
        </Route>
        <Route exact path="/privacidad">
          <IonPage>
            <IonContent className="ion-padding"><h1>Privacidad</h1></IonContent>
          </IonPage>
        </Route>
        <Route>
          <Redirect to={sesion ? '/hoy' : '/login'} />
        </Route>
      </IonRouterOutlet>
    </IonReactRouter>
  );
}

function App() {
  return (
    <IonApp className="ion-palette-dark">
      <ProveedorSesion>
        <RutasAplicacion />
      </ProveedorSesion>
    </IonApp>
  );
}

export default App;
