import { useEffect, useState } from 'react';
import { IonIcon, IonSpinner } from '@ionic/react';
import { locationOutline } from 'ionicons/icons';
import { Redirect, useHistory, useParams } from 'react-router-dom';
import { AnimacionEjercicio } from '../components/AnimacionEjercicio';
import { BotonSJ, PantallaSJ } from '../components/PantallaSJ';
import { buscarEjercicio } from '../data/ejercicios';
import { obtenerGuia } from '../data/guias';
import { fichasVistasLocal, rutinaLocal } from '../repositories/local';
import type { EjercicioRutina } from '../types/perfil';
import logo from '../assets/logo-spotterjn.webp';

const RUTA_SESION = '/sesion';

function FichaEjercicio() {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [cargando, setCargando] = useState(true);
  const [yaVista, setYaVista] = useState(false);
  const [enRutina, setEnRutina] = useState<EjercicioRutina | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ejercicio = buscarEjercicio(id);

  useEffect(() => {
    let activo = true;
    void Promise.all([fichasVistasLocal.obtener(), rutinaLocal.obtener()])
      .then(([vistas, rutina]) => {
        if (!activo) {
          return;
        }
        setYaVista(vistas.includes(id));
        setEnRutina(rutina?.dias.flatMap((dia) => dia.ejercicios).find((e) => e.id === id) ?? null);
      })
      .catch(() => undefined)
      .finally(() => {
        if (activo) {
          setCargando(false);
        }
      });

    return () => {
      activo = false;
    };
  }, [id]);

  if (!ejercicio) {
    return <Redirect to="/hoy" />;
  }

  if (cargando) {
    return (
      <PantallaSJ titulo={ejercicio.nombre}>
        <IonSpinner aria-label="Cargando la ficha" />
      </PantallaSJ>
    );
  }

  const guia = obtenerGuia(id);
  const etiqueta = enRutina
    ? `${guia.grupoMuscular} · ${enRutina.series}x${enRutina.repeticiones}`
    : guia.grupoMuscular;

  const continuar = async (): Promise<void> => {
    if (yaVista) {
      history.goBack();
      return;
    }

    try {
      await fichasVistasLocal.marcarVista(id);
      history.push(RUTA_SESION);
    } catch {
      setError('No se pudo guardar que viste la ficha. Inténtalo de nuevo.');
    }
  };

  return (
    <PantallaSJ
      etiqueta={etiqueta}
      titulo={ejercicio.nombre}
      cabecera={
        yaVista ? null : (
          <div className="sj-mascota">
            <img className="sj-logo" src={logo} alt="SpotterJN" />
            <p className="sj-burbuja">Primera vez con esta máquina. Tranquilo, te explico todo antes de empezar.</p>
          </div>
        )
      }
      pie={
        <BotonSJ onClick={() => void continuar()}>{yaVista ? 'Entendido' : 'Listo, empezar series'}</BotonSJ>
      }
    >
      {guia.animacion ? <AnimacionEjercicio archivo={guia.animacion} titulo={ejercicio.nombre} /> : null}

      <h2 className="sj-subtitulo sj-subtitulo-ficha">1. Cómo ajustar la máquina</h2>
      <p className="sj-texto">{guia.ajusteMaquina}</p>
      <hr className="sj-separador" />
      <h2 className="sj-subtitulo sj-subtitulo-ficha">2. Cómo hacer el movimiento</h2>
      <p className="sj-texto">{guia.movimiento}</p>
      <hr className="sj-separador" />
      <p className="sj-ubicacion">
        <IonIcon icon={locationOutline} aria-hidden="true" />
        <span>
          <strong>Dónde suele estar:</strong> {guia.ubicacion}
        </span>
      </p>
      {error ? <p className="sj-error" role="alert">{error}</p> : null}
    </PantallaSJ>
  );
}

export default FichaEjercicio;
