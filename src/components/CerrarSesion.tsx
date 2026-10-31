import { useRef, useState } from 'react';
import { IonAlert, IonLoading, useIonToast } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { BotonSJ } from './PantallaSJ';
import { cerrarSesion } from '../services/auth';
import { desactivarRecordatorios } from '../services/recordatorios';

function CerrarSesion() {
  const [alertaAbierta, setAlertaAbierta] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enCurso = useRef(false);
  const [mostrarToast] = useIonToast();
  const history = useHistory();

  const confirmar = async (): Promise<void> => {
    if (enCurso.current) {
      return;
    }

    enCurso.current = true;
    setCerrando(true);
    setError(null);

    try {
      const resultado = await cerrarSesion();
      if (!resultado.ok) {
        setError(resultado.mensaje);
        await mostrarToast({ message: resultado.mensaje, duration: 3000, color: 'danger' });
        return;
      }

      // Las notificaciones programadas son del dispositivo, no del usuario: se cancelan al salir.
      await desactivarRecordatorios();
      setAlertaAbierta(false);
      history.replace('/login');
    } catch {
      const mensaje = 'No se pudo cerrar sesión. Inténtalo de nuevo.';
      setError(mensaje);
      await mostrarToast({ message: mensaje, duration: 3000, color: 'danger' });
    } finally {
      enCurso.current = false;
      setCerrando(false);
    }
  };

  return (
    <>
      <BotonSJ
        variante="texto"
        deshabilitado={cerrando}
        onClick={() => {
          setError(null);
          setAlertaAbierta(true);
        }}
      >
        Cerrar sesión
      </BotonSJ>
      {error ? <p className="sj-error" role="alert">{error}</p> : null}
      <IonAlert
        isOpen={alertaAbierta}
        header="Cerrar sesión"
        message="¿Quieres cerrar tu sesión?"
        buttons={[
          {
            text: 'Cancelar',
            role: 'cancel',
            handler: () => {
              if (enCurso.current) {
                return false;
              }
              setAlertaAbierta(false);
              return true;
            },
          },
          {
            text: 'Cerrar sesión',
            role: 'confirm',
            handler: () => {
              void confirmar();
              return false;
            },
          },
        ]}
        onDidDismiss={() => {
          if (!enCurso.current) {
            setAlertaAbierta(false);
          }
        }}
      />
      <IonLoading isOpen={cerrando} message="Cerrando sesión..." backdropDismiss={false} />
    </>
  );
}

export default CerrarSesion;
