import { useEffect, useState } from 'react';
import { IonSpinner } from '@ionic/react';
import { Redirect, useHistory } from 'react-router-dom';
import { BotonSJ, PantallaSJ } from '../components/PantallaSJ';
import { usePerfil } from '../context/PerfilContext';
import { useSesion } from '../context/SesionContext';
import { rutinaLocal } from '../repositories/local';
import type { DiaRutina, RutinaAsignada } from '../types/perfil';
import { formatearPeso } from '../utils/unidades';

function SesionEntrenamiento() {
  const [rutina, setRutina] = useState<RutinaAsignada | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { perfil } = usePerfil();
  const { sesion } = useSesion();
  const usuarioId = sesion?.user.id ?? null;
  const history = useHistory();

  useEffect(() => {
    let activo = true;

    if (usuarioId === null) {
      setRutina(null);
      setCargando(false);
      return () => {
        activo = false;
      };
    }

    setRutina(null);
    setError(null);
    setCargando(true);
    void rutinaLocal
      .obtener(usuarioId)
      .then((guardada) => {
        if (activo) {
          setRutina(guardada);
        }
      })
      .catch(() => {
        if (activo) {
          setError('No se pudo cargar tu rutina. Inténtalo de nuevo.');
        }
      })
      .finally(() => {
        if (activo) {
          setCargando(false);
        }
      });

    return () => {
      activo = false;
    };
  }, [usuarioId]);

  if (cargando) {
    return (
      <PantallaSJ etiqueta="Sesión de entrenamiento" titulo="Preparando tu sesión">
        <IonSpinner aria-label="Cargando tu rutina" />
      </PantallaSJ>
    );
  }

  if (error) {
    return (
      <PantallaSJ etiqueta="Sesión de entrenamiento" titulo="No se pudo cargar">
        <p className="sj-error" role="alert">{error}</p>
        <BotonSJ variante="secundario" onClick={() => history.replace('/hoy')}>Volver a Hoy</BotonSJ>
      </PantallaSJ>
    );
  }

  if (!rutina) {
    return <Redirect to="/cuestionario-rutina" />;
  }

  const dia: DiaRutina | undefined = rutina.dias[0];

  if (!dia) {
    return (
      <PantallaSJ etiqueta="Sesión de entrenamiento" titulo="Rutina incompleta">
        <p className="sj-error" role="alert">Tu rutina todavía no tiene una jornada asignada.</p>
        <BotonSJ variante="secundario" onClick={() => history.replace('/hoy')}>Volver a Hoy</BotonSJ>
      </PantallaSJ>
    );
  }

  return (
    <PantallaSJ
      etiqueta="Sesión de entrenamiento"
      titulo={dia.nombre}
      reglaBajoTitulo
      pie={<BotonSJ variante="secundario" onClick={() => history.replace('/hoy')}>Volver</BotonSJ>}
    >
      <p className="sj-texto sj-suave">Ejercicios para esta jornada</p>
      <ul className="sj-lista">
        {dia.ejercicios.map((ejercicio) => (
          <li key={ejercicio.id}>
            <span>
              <strong>{ejercicio.nombre}</strong>
              <small className="sj-suave sj-bloque">
                {ejercicio.series} series · {ejercicio.repeticiones} repeticiones
              </small>
            </span>
            <p className="sj-peso">{formatearPeso(ejercicio.pesoInicialKg, perfil.unidadPeso)}</p>
          </li>
        ))}
      </ul>
    </PantallaSJ>
  );
}

export default SesionEntrenamiento;
