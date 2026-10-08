import { useState, type FormEvent } from 'react';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonPage,
} from '@ionic/react';
import { eye, eyeOff } from 'ionicons/icons';
import { Link, Redirect, useHistory, useLocation } from 'react-router-dom';
import { registrar } from '../services/auth';
import type { ConsentimientosAceptados } from '../types/consentimientos';
import { esContrasenaValida, esCorreoValido } from '../utils/validaciones';
import './AuthPages.css';

interface EstadoNavegacionRegistro {
  consentimientos: ConsentimientosAceptados;
}

function obtenerConsentimientos(estado: unknown): ConsentimientosAceptados | null {
  if (typeof estado !== 'object' || estado === null || !('consentimientos' in estado)) {
    return null;
  }

  const consentimientos = estado.consentimientos;
  if (
    typeof consentimientos !== 'object' ||
    consentimientos === null ||
    !('mayorEdad' in consentimientos) ||
    consentimientos.mayorEdad !== true ||
    !('terminosAceptados' in consentimientos) ||
    consentimientos.terminosAceptados !== true ||
    !('datosSaludAutorizados' in consentimientos) ||
    typeof consentimientos.datosSaludAutorizados !== 'boolean'
  ) {
    return null;
  }

  return {
    mayorEdad: true,
    terminosAceptados: true,
    datosSaludAutorizados: consentimientos.datosSaludAutorizados,
  };
}

function Registro() {
  const location = useLocation<EstadoNavegacionRegistro | undefined>();
  const consentimientos = obtenerConsentimientos(location.state);
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [correoTocado, setCorreoTocado] = useState(false);
  const [contrasenaTocada, setContrasenaTocada] = useState(false);
  const history = useHistory();
  const correoValido = esCorreoValido(correo);
  const contrasenaValida = esContrasenaValida(contrasena);
  const formularioValido = correoValido && contrasenaValida;

  if (!consentimientos) {
    return <Redirect to="/consentimientos" />;
  }

  const enviarFormulario = async (evento: FormEvent<HTMLFormElement>): Promise<void> => {
    evento.preventDefault();
    if (!formularioValido || cargando) {
      return;
    }

    setCargando(true);
    setError(null);
    setMensaje(null);
    try {
      const resultado = await registrar({
        correo: correo.trim(),
        contrasena,
        datosSaludAutorizados: consentimientos.datosSaludAutorizados,
      });
      if (!resultado.ok) {
        setError(resultado.mensaje);
        return;
      }
      if (resultado.sesionIniciada) {
        history.replace('/hoy');
        return;
      }
      setMensaje(resultado.mensaje ?? 'Revisa tu correo para continuar.');
    } catch {
      setError('No fue posible crear la cuenta. Comprueba tu conexión e inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="auth-page">
        <main className="auth-page-content">
          <section className="auth-page-card" aria-labelledby="registro-title">
            <h1 id="registro-title">Crear cuenta</h1>
            <p>Registra tus datos para comenzar a entrenar.</p>
            <form onSubmit={(evento) => void enviarFormulario(evento)} noValidate>
              <IonItem>
                <IonInput
                  label="Correo electrónico"
                  labelPlacement="stacked"
                  type="email"
                  autocomplete="email"
                  inputmode="email"
                  required
                  value={correo}
                  onIonInput={(evento) => setCorreo(evento.detail.value ?? '')}
                  onIonBlur={() => setCorreoTocado(true)}
                  aria-invalid={correoTocado && !correoValido}
                  aria-describedby={correoTocado && !correoValido ? 'registro-correo-error' : undefined}
                />
              </IonItem>
              {correoTocado && !correoValido && (
                <p id="registro-correo-error" className="auth-inline-error" role="alert">
                  Ingresa un correo electrónico válido.
                </p>
              )}
              <div className="auth-password-control">
                <IonItem>
                  <IonInput
                    label="Contraseña"
                    labelPlacement="stacked"
                    type={mostrarContrasena ? 'text' : 'password'}
                    autocomplete="new-password"
                    required
                    value={contrasena}
                    onIonInput={(evento) => setContrasena(evento.detail.value ?? '')}
                    onIonBlur={() => setContrasenaTocada(true)}
                    aria-invalid={contrasenaTocada && !contrasenaValida}
                    aria-describedby={
                      contrasenaTocada && !contrasenaValida ? 'registro-contrasena-error' : undefined
                    }
                  />
                </IonItem>
                <IonButton
                  fill="clear"
                  type="button"
                  aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setMostrarContrasena((visible) => !visible)}
                >
                  <IonIcon icon={mostrarContrasena ? eyeOff : eye} />
                </IonButton>
              </div>
              {contrasenaTocada && !contrasenaValida && (
                <p id="registro-contrasena-error" className="auth-inline-error" role="alert">
                  Usa al menos 8 caracteres, una letra y un número.
                </p>
              )}
              {error && <p className="auth-inline-error" role="alert">{error}</p>}
              {mensaje && <p className="auth-inline-message" role="status">{mensaje}</p>}
              <IonButton
                className="auth-submit"
                expand="block"
                type="submit"
                disabled={!formularioValido || cargando}
              >
                {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
              </IonButton>
            </form>
            <p>
              ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
            </p>
          </section>
        </main>
      </IonContent>
    </IonPage>
  );
}

export default Registro;
