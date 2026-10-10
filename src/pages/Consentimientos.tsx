import { useEffect, useRef, useState } from 'react';
import {
  IonAlert,
  IonButton,
  IonCheckbox,
  IonContent,
  IonItem,
  IonLabel,
  IonPage,
} from '@ionic/react';
import { Link, useHistory } from 'react-router-dom';
import type { ConsentimientosAceptados } from '../types/consentimientos';
import './AuthPages.css';

function Consentimientos() {
  const [mayorEdad, setMayorEdad] = useState(false);
  const [terminosAceptados, setTerminosAceptados] = useState(false);
  const [datosSaludAutorizados, setDatosSaludAutorizados] = useState(false);
  const [alertaAbierta, setAlertaAbierta] = useState(false);
  const [rutaPendiente, setRutaPendiente] = useState<string | null>(null);
  const history = useHistory();
  const desbloquearRuta = useRef<(() => void) | null>(null);
  const requisitosAceptados = mayorEdad && terminosAceptados;

  useEffect(() => {
    desbloquearRuta.current = history.block((ubicacion) => {
      const esPaginaLegal = ['/terminos', '/privacidad'].includes(ubicacion.pathname);
      if (
        !requisitosAceptados &&
        ubicacion.pathname !== '/consentimientos' &&
        !esPaginaLegal
      ) {
        setRutaPendiente(ubicacion.pathname);
        setAlertaAbierta(true);
        return false;
      }
      return undefined;
    });

    return () => {
      desbloquearRuta.current?.();
      desbloquearRuta.current = null;
    };
  }, [history, requisitosAceptados]);

  const continuar = (): void => {
    if (!requisitosAceptados) {
      return;
    }

    const consentimientos: ConsentimientosAceptados = {
      mayorEdad: true,
      terminosAceptados: true,
      datosSaludAutorizados,
    };
    history.push('/registro', { consentimientos });
  };

  const salirSinAceptar = (): void => {
    const destino = rutaPendiente ?? '/login';
    desbloquearRuta.current?.();
    desbloquearRuta.current = null;
    setAlertaAbierta(false);
    history.push(destino);
  };

  return (
    <IonPage>
      <IonContent className="auth-page">
        <main className="auth-page-content">
          <section className="auth-page-card" aria-labelledby="consent-title">
            <h1 id="consent-title">Antes de crear tu cuenta</h1>
            <p>Revisa y confirma los siguientes puntos para continuar.</p>
            <IonItem className="auth-check-row" lines="none">
              <IonCheckbox
                checked={mayorEdad}
                onIonChange={(evento) => setMayorEdad(evento.detail.checked === true)}
                aria-label="Soy mayor de 18 años"
              />
              <IonLabel>Soy mayor de 18 años</IonLabel>
            </IonItem>
            <IonItem className="auth-check-row" lines="none">
              <IonCheckbox
                checked={terminosAceptados}
                onIonChange={(evento) => setTerminosAceptados(evento.detail.checked === true)}
                aria-label="Acepto los términos y la política de privacidad"
              />
              <IonLabel>
                Acepto los <Link to="/terminos">términos</Link> y la{' '}
                <Link to="/privacidad">política de privacidad</Link>
              </IonLabel>
            </IonItem>
            <IonItem className="auth-check-row" lines="none">
              <IonCheckbox
                checked={datosSaludAutorizados}
                onIonChange={(evento) => setDatosSaludAutorizados(evento.detail.checked === true)}
                aria-label="Autorizo el uso de mis datos de salud"
              />
              <IonLabel>Autorizo el uso de mis datos de salud (opcional)</IonLabel>
            </IonItem>
            <IonButton
              className="auth-submit"
              expand="block"
              disabled={!requisitosAceptados}
              onClick={continuar}
            >
              Continuar
            </IonButton>
            <IonButton expand="block" fill="clear" routerLink="/login">
              Volver al inicio de sesión
            </IonButton>
          </section>
        </main>
        <IonAlert
          isOpen={alertaAbierta}
          header="Consentimientos pendientes"
          message="Para continuar con el registro debes confirmar que eres mayor de edad y aceptar los términos."
          buttons={[
            { text: 'Seguir aquí', role: 'cancel', handler: () => setAlertaAbierta(false) },
            { text: 'Salir', role: 'confirm', handler: salirSinAceptar },
          ]}
          onDidDismiss={() => setAlertaAbierta(false)}
        />
      </IonContent>
    </IonPage>
  );
}

export default Consentimientos;
