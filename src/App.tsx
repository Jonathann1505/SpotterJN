import {
  IonApp,
  IonContent,
  IonPage,
  IonRouterOutlet,
  IonSpinner,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import type { PropsWithChildren } from 'react';
import { Redirect, Route } from 'react-router-dom';
import BannerSinConexion from './components/BannerSinConexion';
import { BotonSJ, PantallaSJ } from './components/PantallaSJ';
import Ajustes from './pages/Ajustes';
import AvisoMedico from './pages/AvisoMedico';
import Consentimientos from './pages/Consentimientos';
import CuestionarioRutina from './pages/CuestionarioRutina';
import CuestionarioSalud from './pages/CuestionarioSalud';
import FichaEjercicio from './pages/FichaEjercicio';
import Glosario from './pages/Glosario';
import Hoy from './pages/Hoy';
import Login from './pages/Login';
import Perfil from './pages/Perfil';
import RecuperarContrasena from './pages/RecuperarContrasena';
import Registro from './pages/Registro';
import RutinaAsignada from './pages/RutinaAsignada';
import SesionEntrenamiento from './pages/SesionEntrenamiento';
import { ProveedorPerfil } from './context/PerfilContext';
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
        <IonContent className="sj">
          <div className="sj-layout">
            <main className="sj-main">
              <div className="sj-cargando">
                <IonSpinner aria-label="Cargando sesión" />
              </div>
            </main>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (error) {
    return (
      <IonPage>
        <IonContent className="sj">
          <div className="sj-layout">
            <main className="sj-main">
              <p className="sj-error" role="alert">{error}</p>
              <BotonSJ onClick={() => void recargarSesion()}>Reintentar</BotonSJ>
            </main>
          </div>
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
        <Route exact path="/recuperar-contrasena">
          <RutaInvitado>
            <RecuperarContrasena />
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
        <Route exact path="/cuestionario-rutina">
          {sesion ? <CuestionarioRutina /> : <Redirect to="/login" />}
        </Route>
        <Route exact path="/rutina">
          {sesion ? <RutinaAsignada /> : <Redirect to="/login" />}
        </Route>
        <Route exact path="/ejercicio/:id">
          {sesion ? <FichaEjercicio /> : <Redirect to="/login" />}
        </Route>
        <Route exact path="/glosario">
          {sesion ? <Glosario /> : <Redirect to="/login" />}
        </Route>
        <Route exact path="/ajustes">
          {sesion ? <Ajustes /> : <Redirect to="/login" />}
        </Route>
        <Route exact path="/perfil">
          {sesion ? <Perfil /> : <Redirect to="/login" />}
        </Route>
        <Route exact path="/sesion">
          {sesion ? <SesionEntrenamiento /> : <Redirect to="/login" />}
        </Route>
        <Route exact path="/terminos">
          <PantallaSJ titulo="Términos">{null}</PantallaSJ>
        </Route>
        <Route exact path="/privacidad">
          <PantallaSJ titulo="Privacidad">{null}</PantallaSJ>
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
    <IonApp>
      <BannerSinConexion />
      <ProveedorSesion>
        <ProveedorPerfil>
          <RutasAplicacion />
        </ProveedorPerfil>
       </ProveedorSesion>
    </IonApp>
  );
}

export default App;
