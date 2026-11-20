import { useRef, useState } from 'react';
import { IonAlert, useIonToast } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { BotonSJ } from './PantallaSJ';
import { usePerfil } from '../context/PerfilContext';
import { useSesion } from '../context/SesionContext';
import { borrarDatosLocales } from '../repositories/local';
import { desactivarRecordatorios } from '../services/recordatorios';

/**
 * Borra de este dispositivo el perfil, la salud, la rutina, el historial y los recordatorios de la persona.
 * No elimina la cuenta (RF-04) ni cierra la sesión.
 */
function BorrarDatos() {
  const [alertaAbierta, setAlertaAbierta] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enCurso = useRef(false);
  const { sesion } = useSesion();
  const { reiniciarPerfil } = usePerfil();
  const [mostrarToast] = useIonToast();
  const history = useHistory();

  const confirmar = async (): Promise<void> => {
    if (enCurso.current || !sesion) {
      return;
    }

    enCurso.current = true;
    setBorrando(true);
    setError(null);
    try {
      await borrarDatosLocales(sesion.user.id);
      await desactivarRecordatorios();
      reiniciarPerfil();
      setAlertaAbierta(false);
      await mostrarToast({ message: 'Se borraron tus datos de este dispositivo.', duration: 2500 });
      // Sin respuestas de salud, la app vuelve a empezar por el aviso médico.
      history.replace('/aviso-medico');
    } catch {
      const mensaje = 'No se pudieron borrar tus datos. Inténtalo de nuevo.';
      setError(mensaje);
      await mostrarToast({ message: mensaje, duration: 3000, color: 'danger' });
    } finally {
      enCurso.current = false;
      setBorrando(false);
    }
  };

  return (
    <>
      <BotonSJ
        variante="texto"
        deshabilitado={borrando}
        onClick={() => {
          setError(null);
          setAlertaAbierta(true);
        }}
      >
        Borrar mis datos de este dispositivo
      </BotonSJ>
      {error ? <p className="sj-error" role="alert">{error}</p> : null}
      <IonAlert
        isOpen={alertaAbierta}
        header="Borrar mis datos"
        message="Se borrarán de este dispositivo tu perfil, tus respuestas de salud, tu rutina, tu historial y tus recordatorios. Tu cuenta no se elimina. Esta acción no se puede deshacer."
        backdropDismiss={false}
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
            text: 'Borrar',
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
    </>
  );
}

export default BorrarDatos;
