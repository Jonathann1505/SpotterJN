import { useEffect, useRef, useState } from 'react';
import {
  IonAlert,
  IonButton,
  IonCheckbox,
  IonItem,
} from '@ionic/react';
import { Link, useHistory } from 'react-router-dom';
import { MarcoAccesoSJ } from '../components/PantallaSJ';
import type { ConsentimientosAceptados } from '../types/consentimientos';

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
    <MarcoAccesoSJ activa="registro">
      <header className="sj-cabecera">
        <h1 id="consent-title">Antes de crear tu cuenta</h1>
        <p>Revisa y confirma los siguientes puntos para continuar.</p>
      </header>
      <div className="sj-acceso-checks">
        <IonItem className="sj-check-row" lines="none">
          <IonCheckbox
            labelPlacement="end"
            justify="start"
            alignment="start"
            checked={mayorEdad}
            onIonChange={(evento) => setMayorEdad(evento.detail.checked === true)}
            aria-label="Soy mayor de 18 años"
          >
            Soy mayor de 18 años
          </IonCheckbox>
        </IonItem>
        <div className="sj-check-grupo">
          <IonItem className="sj-check-row" lines="none">
            <IonCheckbox
              labelPlacement="end"
              justify="start"
              alignment="start"
              checked={terminosAceptados}
              onIonChange={(evento) => setTerminosAceptados(evento.detail.checked === true)}
              aria-label="Acepto los términos y la política de privacidad"
            >
              Acepto los términos y la política de privacidad
            </IonCheckbox>
          </IonItem>
          {/* Los enlaces van fuera de la casilla: si estuvieran dentro, tocarlos también la marcaría. */}
          <p className="sj-check-enlaces">
            Leer los <Link to="/terminos">términos</Link> y la{' '}
            <Link to="/privacidad">política de privacidad</Link>
          </p>
        </div>
        <IonItem className="sj-check-row" lines="none">
          <IonCheckbox
            labelPlacement="end"
            justify="start"
            alignment="start"
            checked={datosSaludAutorizados}
            onIonChange={(evento) => setDatosSaludAutorizados(evento.detail.checked === true)}
            aria-label="Autorizo el uso de mis datos de salud"
          >
            Autorizo el uso de mis datos de salud (opcional)
          </IonCheckbox>
        </IonItem>
      </div>
      <IonButton
        className="sj-acceso-submit"
        expand="block"
        disabled={!requisitosAceptados}
        onClick={continuar}
      >
        Continuar
      </IonButton>
      <IonAlert
        cssClass="sj-alerta"
        isOpen={alertaAbierta}
        header="Consentimientos pendientes"
        message="Para continuar con el registro debes confirmar que eres mayor de edad y aceptar los términos."
        buttons={[
          { text: 'Seguir aquí', role: 'cancel', handler: () => setAlertaAbierta(false) },
          { text: 'Salir', role: 'confirm', handler: salirSinAceptar },
        ]}
        onDidDismiss={() => setAlertaAbierta(false)}
      />
    </MarcoAccesoSJ>
  );
}

export default Consentimientos;
