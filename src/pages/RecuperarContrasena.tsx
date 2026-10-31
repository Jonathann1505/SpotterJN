import { useState, type FormEvent } from 'react';
import { IonButton, IonInput } from '@ionic/react';
import { Link } from 'react-router-dom';
import { solicitarRecuperacion } from '../services/auth';
import { esCorreoValido } from '../utils/validaciones';
import { MarcoAccesoSJ } from '../components/PantallaSJ';

function RecuperarContrasena() {
  const [correo, setCorreo] = useState('');
  const [correoTocado, setCorreoTocado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmacion, setConfirmacion] = useState<string | null>(null);
  const correoValido = esCorreoValido(correo);

  const enviarFormulario = async (evento: FormEvent<HTMLFormElement>): Promise<void> => {
    evento.preventDefault();
    if (!correoValido || cargando) {
      return;
    }

    setCargando(true);
    setError(null);
    setConfirmacion(null);
    try {
      const resultado = await solicitarRecuperacion(correo.trim());
      if (!resultado.ok) {
        setError(resultado.mensaje);
        return;
      }
      setConfirmacion('Si el correo existe, te enviamos un enlace');
    } catch {
      setError('No fue posible solicitar la recuperación. Comprueba tu conexión e inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <MarcoAccesoSJ activa="login">
      <header className="sj-cabecera">
        <h1 id="recuperar-title">Olvidé mi contraseña</h1>
        <p>Ingresa tu correo para solicitar un enlace de recuperación.</p>
      </header>
      <form
        aria-labelledby="recuperar-title"
        onSubmit={(evento) => void enviarFormulario(evento)}
        noValidate
      >
        <IonInput
          className="sj-campo"
          label="Correo electrónico"
          labelPlacement="stacked"
          fill="outline"
          type="email"
          autocomplete="email"
          inputmode="email"
          required
          value={correo}
          onIonInput={(evento) => {
            setCorreo(evento.detail.value ?? '');
            setError(null);
            setConfirmacion(null);
          }}
          onIonBlur={() => setCorreoTocado(true)}
          aria-invalid={correoTocado && !correoValido}
          aria-describedby={correoTocado && !correoValido ? 'recuperar-correo-error' : undefined}
        />
        {correoTocado && !correoValido && (
          <p id="recuperar-correo-error" className="sj-error" role="alert">
            Ingresa un correo electrónico válido.
          </p>
        )}
        {error && <p className="sj-error" role="alert">{error}</p>}
        {confirmacion && <p className="sj-ok" role="status">{confirmacion}</p>}
        <IonButton
          className="sj-acceso-submit"
          expand="block"
          type="submit"
          disabled={!correoValido || cargando}
        >
          {cargando ? 'Enviando...' : 'Enviar enlace'}
        </IonButton>
        <p className="sj-acceso-enlace">
          <Link to="/login">Volver a iniciar sesión</Link>
        </p>
      </form>
    </MarcoAccesoSJ>
  );
}

export default RecuperarContrasena;
