import { useState, type FormEvent } from 'react';
import { IonButton, IonIcon, IonInput } from '@ionic/react';
import { eye, eyeOff } from 'ionicons/icons';
import { Link, useHistory } from 'react-router-dom';
import { iniciarSesion } from '../services/auth';
import { esCorreoValido } from '../utils/validaciones';
import { MarcoAccesoSJ } from '../components/PantallaSJ';

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
    <MarcoAccesoSJ activa="login">
      <header className="sj-cabecera">
        <h1 id="login-title">Iniciar sesión</h1>
        <p>Ingresa tus datos para continuar.</p>
      </header>
      <form aria-labelledby="login-title" onSubmit={(evento) => void enviarFormulario(evento)}>
        <IonInput
          className="sj-campo"
          label="Correo electrónico"
          labelPlacement="stacked"
          fill="outline"
          type="email"
          placeholder="usuario@dominio.com"
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
          <p id="login-email-error" className="sj-error" role="alert">
            Ingresa un correo electrónico válido.
          </p>
        )}
        <div className="sj-acceso-password">
          <IonInput
            className="sj-campo"
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
            fill="clear"
            type="button"
            aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onClick={() => setMostrarContrasena((visible) => !visible)}
          >
            <IonIcon icon={mostrarContrasena ? eyeOff : eye} />
          </IonButton>
        </div>
        {error && <p className="sj-error" role="alert">{error}</p>}

        <IonButton
          expand="block"
          className="sj-acceso-submit"
          type="submit"
          disabled={!formularioValido || cargando}
        >
          {cargando ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </IonButton>
        <p className="sj-acceso-enlace">
          <Link to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link>
        </p>
      </form>
    </MarcoAccesoSJ>
  );
}

export default Login;