import { useState, type FormEvent } from 'react';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonPage,
} from '@ionic/react';
import { eye, eyeOff, barbell, checkmarkCircle, shieldCheckmark } from 'ionicons/icons';
import { Link, useHistory } from 'react-router-dom';
import { iniciarSesion } from '../services/auth';
import { esCorreoValido } from '../utils/validaciones';
import './Login.css';

function Login() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [correoTocado, setCorreoTocado] = useState(false);
  const history = useHistory();
  const correoValido = esCorreoValido(correo);
  const formularioValido = correoValido && contrasena.length > 0;

  const enviarFormulario = async (evento: FormEvent<HTMLFormElement>): Promise<void> => {
    evento.preventDefault();
    if (!formularioValido || cargando) {
      return;
    }

    setCargando(true);
    setError(null);
    try {
      const resultado = await iniciarSesion(correo.trim(), contrasena);
      if (!resultado.ok) {
        setError(resultado.mensaje);
        return;
      }
      history.replace('/hoy');
    } catch {
      setError('No fue posible iniciar sesión. Comprueba tu conexión e inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  };

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

            <form className="login-fields" onSubmit={(evento) => void enviarFormulario(evento)}>
              <IonInput
                className="login-field"
                label="Correo electrónico"
                labelPlacement="stacked"
                fill="outline"
                type="email"
                placeholder="nombre@ejemplo.com"
                autocomplete="email"
                inputmode="email"
                required
                value={correo}
                onIonInput={(evento) => {
                  setCorreo(evento.detail.value ?? '');
                  setError(null);
                }}
                onIonBlur={() => setCorreoTocado(true)}
                aria-invalid={correoTocado && !correoValido}
                aria-describedby={correoTocado && !correoValido ? 'login-email-error' : undefined}
              />
              {correoTocado && !correoValido && (
                <p id="login-email-error" className="auth-field-error" role="alert">
                  Ingresa un correo electrónico válido.
                </p>
              )}
              <div className="login-password-wrapper">
                <IonInput
                  className="login-field"
                  label="Contraseña"
                  labelPlacement="stacked"
                  fill="outline"
                  type={mostrarContrasena ? 'text' : 'password'}
                  placeholder="Ingresa tu contraseña"
                  autocomplete="current-password"
                  required
                  value={contrasena}
                  onIonInput={(evento) => {
                    setContrasena(evento.detail.value ?? '');
                    setError(null);
                  }}
                />
                <IonButton
                  className="password-toggle"
                  fill="clear"
                  type="button"
                  aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setMostrarContrasena((visible) => !visible)}
                >
                  <IonIcon icon={mostrarContrasena ? eyeOff : eye} />
                </IonButton>
              </div>
              {error && <p className="auth-form-error" role="alert">{error}</p>}

              <IonButton
                expand="block"
                className="login-submit"
                type="submit"
                disabled={!formularioValido || cargando}
              >
                {cargando ? 'Iniciando sesión...' : 'Iniciar sesión'}
                {!cargando && <span className="button-arrow" aria-hidden="true">→</span>}
              </IonButton>
            </form>

            <p className="login-disclaimer">
              ¿Aún no tienes cuenta? <Link to="/consentimientos">Crear cuenta</Link>
            </p>
          </section>
        </main>
      </IonContent>
    </IonPage>
  );
}

export default Login;