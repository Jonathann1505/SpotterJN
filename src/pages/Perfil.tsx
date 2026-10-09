import { useEffect, useState } from 'react';
import { IonButton, IonChip, IonContent, IonInput, IonPage, IonToggle } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { usePerfil } from '../context/PerfilContext';
import { METAS_PRINCIPALES, type MetaPrincipal, type UnidadPeso } from '../types/perfil';
import { LONGITUD_MAXIMA_NOMBRE, esNombreValido } from '../utils/validaciones';
import './AuthPages.css';
import './Rutina.css';

const ETIQUETAS_META: Record<MetaPrincipal, string> = {
  fuerza: 'Ganar fuerza',
  'perder-peso': 'Perder peso',
  tonificar: 'Tonificar',
  resistencia: 'Resistencia',
};

function Perfil() {
  const { perfil, guardarPerfil } = usePerfil();
  const [nombre, setNombre] = useState(perfil.nombre);
  const [meta, setMeta] = useState<MetaPrincipal>(perfil.meta);
  const [nombreTocado, setNombreTocado] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const history = useHistory();
  const nombreValido = esNombreValido(nombre);

  useEffect(() => {
    setNombre(perfil.nombre);
    setMeta(perfil.meta);
  }, [perfil.nombre, perfil.meta]);

  const cambiarUnidad = async (unidadPeso: UnidadPeso): Promise<void> => {
    setError(null);
    try {
      await guardarPerfil({ ...perfil, unidadPeso });
    } catch {
      setError('No se pudo cambiar la unidad. Inténtalo de nuevo.');
    }
  };

  const guardar = async (): Promise<void> => {
    setNombreTocado(true);
    if (!nombreValido) {
      return;
    }

    setError(null);
    setMensaje(null);
    try {
      await guardarPerfil({ ...perfil, nombre: nombre.trim(), meta });
      setMensaje('Perfil actualizado.');
    } catch {
      setError('No se pudo guardar el perfil. Inténtalo de nuevo.');
    }
  };

  return (
    <IonPage>
      <IonContent className="auth-page">
        <main className="auth-page-content">
          <section className="auth-page-card" aria-labelledby="perfil-title">
            <h1 id="perfil-title">Tu perfil</h1>

            <IonInput
              label="Nombre"
              labelPlacement="stacked"
              fill="outline"
              maxlength={LONGITUD_MAXIMA_NOMBRE + 10}
              value={nombre}
              onIonInput={(evento) => setNombre(String(evento.detail.value ?? ''))}
              onIonBlur={() => setNombreTocado(true)}
            />
            {nombreTocado && !nombreValido ? (
              <p className="auth-inline-error" role="alert">
                El nombre es obligatorio y admite hasta {LONGITUD_MAXIMA_NOMBRE} caracteres.
              </p>
            ) : null}

            <h2 className="rutina-pregunta" id="pregunta-meta">Meta principal</h2>
            <div className="rutina-chips" role="radiogroup" aria-labelledby="pregunta-meta">
              {METAS_PRINCIPALES.map((opcion) => (
                <IonChip
                  key={opcion}
                  role="radio"
                  aria-checked={meta === opcion}
                  className={meta === opcion ? 'rutina-chip rutina-chip-activo' : 'rutina-chip'}
                  onClick={() => setMeta(opcion)}
                >
                  {ETIQUETAS_META[opcion]}
                </IonChip>
              ))}
            </div>

            <h2 className="rutina-pregunta" id="pregunta-unidad">Unidad de peso</h2>
            <div className="perfil-unidad" role="group" aria-labelledby="pregunta-unidad">
              <span aria-hidden="true">kg</span>
              <IonToggle
                checked={perfil.unidadPeso === 'lb'}
                aria-label="Usar libras en lugar de kilogramos"
                onIonChange={(evento) => void cambiarUnidad(evento.detail.checked ? 'lb' : 'kg')}
              />
              <span aria-hidden="true">lb</span>
            </div>

            {mensaje ? <p className="auth-inline-message" role="status">{mensaje}</p> : null}
            {error ? <p className="auth-inline-error" role="alert">{error}</p> : null}
            <IonButton className="auth-submit" expand="block" onClick={() => void guardar()}>
              Guardar cambios
            </IonButton>
            <IonButton expand="block" fill="clear" onClick={() => history.goBack()}>
              Volver
            </IonButton>
          </section>
        </main>
      </IonContent>
    </IonPage>
  );
}

export default Perfil;
