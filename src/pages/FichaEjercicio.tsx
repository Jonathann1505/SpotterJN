import { useEffect, useState } from 'react';
import { IonIcon, IonSpinner } from '@ionic/react';
import { locationOutline } from 'ionicons/icons';
import { Redirect, useHistory, useParams } from 'react-router-dom';
import { AnimacionEjercicio } from '../components/AnimacionEjercicio';
import { BotonSJ, LogoSJ, PantallaSJ } from '../components/PantallaSJ';
import { useSesion } from '../context/SesionContext';
import { buscarEjercicio } from '../data/ejercicios';
import { obtenerGuia, textosFicha } from '../data/guias';
import { fichasVistasLocal, rutinaLocal } from '../repositories/local';
import type { EjercicioRutina } from '../types/perfil';

const RUTA_SESION = '/sesion';

function FichaEjercicio() {
  const { id } = useParams<{ id: string }>();
  const { sesion } = useSesion();
  const usuarioId = sesion?.user.id ?? null;
  const history = useHistory();
  const [cargando, setCargando] = useState(true);
  const [yaVista, setYaVista] = useState(false);
  const [enRutina, setEnRutina] = useState<EjercicioRutina | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ejercicio = buscarEjercicio(id);

  useEffect(() => {
    let activo = true;
    if (usuarioId === null) {
      return () => {
        activo = false;
      };
    }

    void Promise.all([fichasVistasLocal.obtener(usuarioId), rutinaLocal.obtener(usuarioId)])
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
  }, [id, usuarioId]);

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
  const textos = textosFicha(ejercicio.equipo);
  const etiqueta = enRutina
    ? `${guia.grupoMuscular} · ${enRutina.series}x${enRutina.repeticiones}`
    : guia.grupoMuscular;

  const continuar = async (): Promise<void> => {
    if (yaVista) {
      history.goBack();
      return;
    }

    if (usuarioId === null) {
      return;
    }

    try {
      await fichasVistasLocal.marcarVista(usuarioId, id);
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
            <LogoSJ />
            <p className="sj-burbuja">{textos.avisoPrimeraVez}</p>
          </div>
        )
      }
      pie={
        <BotonSJ onClick={() => void continuar()}>{yaVista ? 'Entendido' : 'Listo, empezar series'}</BotonSJ>
      }
    >
      {guia.animacion ? (
        <AnimacionEjercicio archivo={guia.animacion} titulo={ejercicio.nombre} />
      ) : (
        <div className="sj-sin-animacion">Animación próximamente</div>
      )}

      <h2 className="sj-subtitulo sj-subtitulo-ficha">{textos.tituloAjuste}</h2>
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
