import { useEffect, useState } from 'react';
import { Weekday } from '@capacitor/local-notifications';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline, checkmark, helpCircleOutline } from 'ionicons/icons';
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
import { partesDeLaSesion } from '../utils/rutina';
import { diasDeLaSemanaActual, estadoDeLaSemana, sesionParaFecha, type EstadoDiaSemana } from '../utils/semana';
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

const ETIQUETAS_ESTADO: Record<EstadoDiaSemana, string> = {
  hecho: 'Hecho',
  hoy: 'Hoy toca',
  falto: 'Te faltó',
  pendiente: '',
};

const INICIALES_DIAS: Readonly<Record<Weekday, string>> = {
  [Weekday.Monday]: 'L',
  [Weekday.Tuesday]: 'M',
  [Weekday.Wednesday]: 'X',
  [Weekday.Thursday]: 'J',
  [Weekday.Friday]: 'V',
  [Weekday.Saturday]: 'S',
  [Weekday.Sunday]: 'D',
};

/** Marca visual del estado de un día en la tira semanal; el texto accesible va en la etiqueta. */
function MarcaEstado({ estado }: { estado: EstadoDiaSemana }) {
  if (estado === 'hecho') {
    return <IonIcon icon={checkmark} />;
  }
  if (estado === 'falto') {
    return <>!</>;
  }
  return <span className="sj-tira-punto" />;
}

function Hoy() {
  const [datos, setDatos] = useState<DatosHoy | null>(null);
  // Día de la rutina elegido a mano; null mientras se usa el que toca por la fecha.
  const [indiceElegido, setIndiceElegido] = useState<number | null>(null);
  const { perfil } = usePerfil();
  const { sesion } = useSesion();
  const usuarioId = sesion?.user.id ?? null;
  const history = useHistory();
  // Ionic conserva Hoy en la pila: al volver (por ejemplo tras una sesión) se recargan los datos.
  const recarga = useRecargaAlVolver('/hoy');

  // Al volver a Hoy (por ejemplo tras una sesión) se vuelve a sugerir el día que toca.
  useEffect(() => {
    setIndiceElegido(null);
  }, [recarga]);

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

  const ahora = new Date();
  const semana = estadoDeLaSemana(datos.rutina, datos.series, ahora);
  const calendario = diasDeLaSemanaActual(ahora);
  const indiceActivo =
    indiceElegido !== null && datos.rutina.dias[indiceElegido] !== undefined ? indiceElegido : sesionDelDia.indice;
  const eligioOtroDia = indiceActivo !== sesionDelDia.indice;
  const proximaSesion = datos.rutina.dias[indiceActivo];
  const nombreDia = describirDias([sesionDelDia.diaSemana]);
  const nombrePerfil = perfil.nombre.trim();
  const faltaron = semana.filter((entrada) => entrada.estado === 'falto');
  const saludo = eligioOtroDia
    ? 'Elegiste esta sesión.'
    : sesionDelDia.esHoy
      ? 'Esta es tu sesión de hoy.'
      : `Hoy descansas. Tu próxima sesión es el ${nombreDia}.`;
  const avisoFaltas =
    faltaron.length === 0
      ? null
      : `${faltaron.length === 1 ? 'Te faltó' : 'Te faltaron'} ${faltaron
          .map((entrada) => `${entrada.dia.nombre} (${describirDias([entrada.diaSemana])})`)
          .join(' y ')}. Puedes hacer${faltaron.length === 1 ? 'la hoy: elígela' : 'las hoy: elígelas'} en tu semana.`;

  return (
    <PantallaSJ
      mostrarLogo
      etiqueta={eligioOtroDia ? 'Sesión elegida' : sesionDelDia.esHoy ? 'Hoy toca' : `Próxima sesión · ${nombreDia}`}
      titulo={proximaSesion.nombre}
      reglaBajoTitulo
      pie={
        <>
          <BotonSJ variante="secundario" onClick={() => history.push('/perfil')}>Perfil</BotonSJ>
          <CerrarSesion />
        </>
      }
    >
      <section className="sj-hoy-semana" aria-labelledby="hoy-semana">
        <h2 className="sj-subtitulo" id="hoy-semana">Tu semana</h2>
        {/* Solo los días de entrenamiento se pueden elegir; los de descanso se ven atenuados. */}
        <div className="sj-tira-semana" role="radiogroup" aria-label="Elegir otro día">
          {calendario.map((celda) => {
            const entrada = semana.find((candidata) => candidata.diaSemana === celda.diaSemana);
            const contenido = (
              <>
                <span className="sj-tira-inicial">{INICIALES_DIAS[celda.diaSemana]}</span>
                <span className="sj-tira-numero">{celda.fecha.getDate()}</span>
                <span className="sj-tira-marca" aria-hidden="true">
                  {entrada === undefined ? null : <MarcaEstado estado={entrada.estado} />}
                </span>
              </>
            );
            const hoy = celda.esHoy ? ' sj-tira-hoy' : '';
            if (entrada === undefined) {
              return (
                <span key={celda.diaSemana} className={`sj-tira-dia sj-tira-descanso${hoy}`} aria-hidden="true">
                  {contenido}
                </span>
              );
            }
            const etiqueta = ETIQUETAS_ESTADO[entrada.estado];
            return (
              <button
                key={celda.diaSemana}
                type="button"
                role="radio"
                aria-checked={indiceActivo === entrada.indice}
                aria-label={`${entrada.dia.nombre} · ${describirDias([entrada.diaSemana])}${etiqueta === '' ? '' : ` — ${etiqueta}`}`}
                className={`sj-tira-dia sj-tira-${entrada.estado}${hoy}`}
                onClick={() => setIndiceElegido(entrada.indice)}
              >
                {contenido}
              </button>
            );
          })}
        </div>
        {avisoFaltas === null ? null : (
          <p className="sj-hoy-aviso" role="status">
            <IonIcon icon={alertCircleOutline} aria-hidden="true" />
            <span>{avisoFaltas}</span>
          </p>
        )}
      </section>
      <section className="sj-tarjeta sj-hoy-tarjeta" aria-label="Tu sesión">
        <p className="sj-texto">{nombrePerfil !== '' ? `Hola, ${nombrePerfil}. ${saludo}` : saludo}</p>
        <ul className="sj-hoy-chips" aria-label="Resumen de la sesión">
          {partesDeLaSesion(proximaSesion).map((parte) => (
            <li key={parte}>{parte}</li>
          ))}
        </ul>
        <BotonSJ onClick={() => history.push('/sesion', { indiceDia: indiceActivo })}>Empezar entrenamiento</BotonSJ>
      </section>
      <h2 className="sj-subtitulo" id="hoy-ejercicios">Ejercicios</h2>
      <ul className="sj-lista sj-lista-hoy" aria-labelledby="hoy-ejercicios">
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
