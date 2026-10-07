import { IonButton, IonContent, IonIcon, IonInput, IonPage } from '@ionic/react';
import { barbell, checkmarkCircle, shieldCheckmark } from 'ionicons/icons';
import './Login.css';

function Login() {
  return (
    <IonPage>
      <IonContent className="login-content">
        <main className="login-layout">
          <section className="login-intro" aria-labelledby="login-title">
            <div className="login-brand">
              <span className="brand-mark" aria-hidden="true">
                <IonIcon icon={barbell} />
              </span>
              <span className="brand-name">SPOTTER<span>JN</span></span>
            </div>

            <div className="intro-copy">
              <p className="eyebrow">
                <span className="eyebrow-dot" aria-hidden="true" />
                TU ENTRENAMIENTO, CON PROPÓSITO
              </p>
              <h1 id="login-title" className="login-title">
                Cada repetición{' '}
                <br />
                <span>te acerca más.</span>
              </h1>
              <p className="login-description">
                Registra tu progreso y descubre de lo que eres capaz, un
                entrenamiento a la vez.
              </p>
            </div>

            <div className="progress-art" aria-hidden="true">
              <div className="progress-orbit progress-orbit-outer" />
              <div className="progress-orbit progress-orbit-inner" />
              <div className="progress-emblem">
                <IonIcon icon={barbell} />
              </div>
              <div className="progress-tag">
                <IonIcon icon={checkmarkCircle} />
                <span>EL PROGRESO EMPIEZA HOY</span>
              </div>
            </div>

            <p className="intro-footnote">
              <IonIcon icon={shieldCheckmark} aria-hidden="true" />
              Tu ritmo. Tu progreso. Tu camino.
            </p>
          </section>

          <section className="login-panel" aria-labelledby="form-title">
            <div className="panel-heading">
              <p className="panel-eyebrow">QUÉ BUENO TENERTE DE VUELTA</p>
              <h2 id="form-title">Inicia sesión</h2>
              <p>Ingresa tus datos para continuar.</p>
            </div>

            <div className="login-fields">
              <IonInput
                className="login-field"
                label="Correo electrónico"
                labelPlacement="stacked"
                fill="outline"
                type="email"
                placeholder="nombre@ejemplo.com"
                autocomplete="email"
                required
              />
              <IonInput
                className="login-field"
                label="Contraseña"
                labelPlacement="stacked"
                fill="outline"
                type="password"
                placeholder="Ingresa tu contraseña"
                autocomplete="current-password"
                required
              />
            </div>

            <IonButton expand="block" className="login-submit" type="button">
              Entrar a mi cuenta
              <span className="button-arrow" aria-hidden="true">→</span>
            </IonButton>

            <p className="login-disclaimer">
              Inicia sesión para continuar con tu entrenamiento.
            </p>
          </section>
        </main>
      </IonContent>
    </IonPage>
  );
}

export default Login;