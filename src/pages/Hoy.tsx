import { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { helpCircleOutline } from 'ionicons/icons';
import { Redirect, useHistory } from 'react-router-dom';
import { MiniaturaEjercicio } from '../components/MiniaturaEjercicio';
import { CargandoSJ } from '../components/CargandoSJ';
import { BotonSJ, PantallaSJ } from '../components/PantallaSJ';
import { usePerfil } from '../context/PerfilContext';
import { ajustesPesoLocal, rutinaLocal, saludLocal, seriesLocal } from '../repositories/local';
import type { RespuestasSalud, RutinaAsignada } from '../types/perfil';
import type { SerieRegistrada } from '../types/series';
import { recomendarParaEjercicio } from '../utils/progresion';
import { describirDias } from '../utils/recordatorios';
import { describirSesion } from '../utils/rutina';
import { sesionParaFecha } from '../utils/semana';
import { useSesion } from '../context/SesionContext';
import CerrarSesion from '../components/CerrarSesion';
import { PesoAjustable } from '../components/PesoAjustable';
import { useRecargaAlVolver } from '../hooks/useRecargaAlVolver';
import type { AjustePeso, AjustesPeso } from '../types/ajustesPeso';

interface DatosHoy {
  usuarioId: string;
  salud: RespuestasSalud | null;
  rutina: RutinaAsignada | null;
  series: SerieRegistrada[];
  ajustes: AjustesPeso;
}

function Hoy() {
  const [datos, setDatos] = useState<DatosHoy | null>(null);
  const { perfil } = usePerfil();
  const { sesion } = useSesion();
  const usuarioId = sesion?.user.id ?? null;
  const history = useHistory();
  // Ionic conserva Hoy en la pila: al volver (por ejemplo tras una sesión) se recargan los datos.
  const recarga = useRecargaAlVolver('/hoy');

  useEffect(() => {
    let activo = true;
    if (usuarioId === null) {
      setDatos(null);
      return () => {
        activo = false;
      };
    }

    // Al recargar para el mismo usuario se mantienen los datos visibles hasta tener los nuevos.
    setDatos((actuales) => (actuales?.usuarioId === usuarioId ? actuales : null));
    void Promise.all([
      saludLocal.obtener(usuarioId),
      rutinaLocal.obtener(usuarioId),
      // Sin series legibles se muestra el peso inicial: no bloquea la pantalla.
      seriesLocal.listar(usuarioId).catch((): SerieRegistrada[] => []),
      // Sin ajustes legibles se usa la recomendación automática.
      ajustesPesoLocal.obtener(usuarioId).catch((): AjustesPeso => ({})),
    ])
      .then(([salud, rutina, series, ajustes]) => {
        if (activo) {
          setDatos({ usuarioId, salud, rutina, series, ajustes });
        }
      })
      .catch(() => {
        if (activo) {
          setDatos({ usuarioId, salud: null, rutina: null, series: [], ajustes: {} });
        }
      });

    return () => {
      activo = false;
    };
  }, [usuarioId, recarga]);

  if (datos === null || !sesion || datos.usuarioId !== sesion.user.id) {
    return (
      <PantallaSJ titulo="Hoy">
        <CargandoSJ etiqueta="Cargando tu sesión" />
      </PantallaSJ>
    );
  }

  if (datos.salud === null) {
    return <Redirect to="/aviso-medico" />;
  }

  if (datos.rutina === null) {
    return <Redirect to="/cuestionario-rutina" />;
  }

  // Sin historial de sesiones (M3), la sesión que toca se calcula con el día de la semana.
  const sesionDelDia = sesionParaFecha(datos.rutina, new Date());
  if (sesionDelDia === null) {
    return <Redirect to="/cuestionario-rutina" />;
  }

  const proximaSesion = sesionDelDia.dia;
  const nombreDia = describirDias([sesionDelDia.diaSemana]);
  const nombrePerfil = perfil.nombre.trim();
  const saludo = sesionDelDia.esHoy
    ? 'Esta es tu sesión de hoy.'
    : `Hoy descansas. Tu próxima sesión es el ${nombreDia}.`;

  return (
    <PantallaSJ
      mostrarLogo
      etiqueta={sesionDelDia.esHoy ? 'Hoy toca' : `Próxima sesión · ${nombreDia}`}
      titulo={proximaSesion.nombre}
      reglaBajoTitulo
      pie={
        <>
          <BotonSJ onClick={() => history.push('/sesion', { indiceDia: sesionDelDia.indice })}>Empezar entrenamiento</BotonSJ>
          <BotonSJ variante="secundario" onClick={() => history.push('/perfil')}>Perfil</BotonSJ>
          <CerrarSesion />
        </>
      }
    >
      <p className="sj-texto">{nombrePerfil !== '' ? `Hola, ${nombrePerfil}. ${saludo}` : saludo}</p>
      <p className="sj-texto sj-suave">{describirSesion(proximaSesion)}</p>
      <ul className="sj-lista sj-lista-hoy">
        {proximaSesion.ejercicios.map((ejercicio) => {
          // Peso recomendado por la progresión (RF-15 a RF-17); sin series es el peso inicial.
          const recomendacion = recomendarParaEjercicio(
            ejercicio,
            datos.series,
            perfil.unidadPeso,
            undefined,
            datos.ajustes[ejercicio.id] ?? null,
          );
          // RF-17: el peso elegido a mano será el de partida de la próxima sesión.
          const guardarAjuste = async (peso: number): Promise<void> => {
            const ajuste: AjustePeso = {
              idEjercicio: ejercicio.id,
              peso,
              unidad: perfil.unidadPeso,
              ajustadoEn: new Date().toISOString(),
            };
            await ajustesPesoLocal.guardar(datos.usuarioId, ajuste);
            setDatos((actuales) =>
              actuales === null ? actuales : { ...actuales, ajustes: { ...actuales.ajustes, [ejercicio.id]: ajuste } },
            );
          };
          return (
          <li key={ejercicio.id} className="sj-fila-ejercicio">
            <MiniaturaEjercicio idEjercicio={ejercicio.id} nombre={ejercicio.nombre} />
            <span>
              <button
                type="button"
                className="sj-enlace-ejercicio"
                aria-label={`Ver la ficha de ${ejercicio.nombre}`}
                onClick={() => history.push(`/ejercicio/${ejercicio.id}`)}
              >
                <strong>{ejercicio.nombre}</strong>
                <IonIcon icon={helpCircleOutline} aria-hidden="true" />
              </button>
              <small className="sj-suave sj-bloque">{ejercicio.series}x{recomendacion.repeticiones}</small>
              {recomendacion.motivo === 'sin-series' ? null : (
                <small className="sj-suave sj-bloque">{recomendacion.explicacion}</small>
              )}
            </span>
            {recomendacion.peso !== null ? (
              <PesoAjustable
                nombreEjercicio={ejercicio.nombre}
                peso={recomendacion.peso}
                unidad={perfil.unidadPeso}
                alGuardar={guardarAjuste}
              />
            ) : (
              <p className="sj-peso sj-peso-corporal">Peso corporal</p>
            )}
          </li>
          );
        })}
      </ul>
    </PantallaSJ>
  );
}

export default Hoy;
