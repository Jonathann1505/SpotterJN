import { useState } from 'react';
import { IonButton, IonCheckbox, IonContent, IonItem, IonLabel, IonPage } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { saludLocal } from '../repositories/local';
import { CONDICIONES_SALUD, type CondicionSalud } from '../types/perfil';
import './AuthPages.css';
import './Salud.css';

const ETIQUETAS: Record<CondicionSalud, string> = {
  'dolor-articular': 'Dolor articular',
  'problema-cardiaco': 'Problema cardíaco',
  embarazo: 'Embarazo',
};

const RUTA_SIGUIENTE = '/cuestionario-rutina';

function CuestionarioSalud() {
  const [condiciones, setCondiciones] = useState<CondicionSalud[]>([]);
  const [ninguna, setNinguna] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const history = useHistory();
  const hayCondicion = condiciones.length > 0;
  const respondido = ninguna || hayCondicion;

  const alternarCondicion = (condicion: CondicionSalud, marcada: boolean): void => {
    setNinguna(false);
    setCondiciones((actuales) =>
      marcada
        ? actuales.includes(condicion) ? actuales : [...actuales, condicion]
        : actuales.filter((c) => c !== condicion),
    );
  };

  const alternarNinguna = (marcada: boolean): void => {
    setNinguna(marcada);
    if (marcada) {
      setCondiciones([]);
    }
  };

  const continuar = async (): Promise<void> => {
    if (!respondido || guardando) {
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      await saludLocal.guardar({ condiciones, respondidoEn: new Date().toISOString() });
      history.replace(RUTA_SIGUIENTE);
    } catch {
      setError('No se pudieron guardar tus respuestas. Inténtalo de nuevo.');
      setGuardando(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="auth-page">
        <main className="auth-page-content">
          <section className="auth-page-card" aria-labelledby="salud-title">
            <h1 id="salud-title">Cuestionario de salud</h1>
            <p>Marca si tienes alguna de estas condiciones.</p>
            {CONDICIONES_SALUD.map((condicion) => (
              <IonItem key={condicion} className="auth-check-row salud-check" lines="none">
                <IonCheckbox
                  checked={condiciones.includes(condicion)}
                  onIonChange={(evento) => alternarCondicion(condicion, evento.detail.checked === true)}
                  aria-label={ETIQUETAS[condicion]}
                />
                <IonLabel>{ETIQUETAS[condicion]}</IonLabel>
              </IonItem>
            ))}
            <IonItem className="auth-check-row salud-check" lines="none">
              <IonCheckbox
                checked={ninguna}
                onIonChange={(evento) => alternarNinguna(evento.detail.checked === true)}
                aria-label="Ninguna de las anteriores"
              />
              <IonLabel>Ninguna de las anteriores</IonLabel>
            </IonItem>
            {hayCondicion ? (
              <div className="salud-banner" role="alert">
                Te recomendamos consultar a un médico antes de empezar a entrenar.
              </div>
            ) : null}
            {error ? <p className="auth-inline-error" role="alert">{error}</p> : null}
            <IonButton
              className="auth-submit"
              expand="block"
              disabled={!respondido || guardando}
              onClick={() => void continuar()}
            >
              {hayCondicion ? 'Entiendo el riesgo y continúo' : 'Continuar'}
            </IonButton>
          </section>
        </main>
      </IonContent>
    </IonPage>
  );
}

export default CuestionarioSalud;
