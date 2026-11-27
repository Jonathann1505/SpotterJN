import { useEffect, useRef, useState, type ReactNode } from 'react';
import { IonIcon, IonInput } from '@ionic/react';
import {
  barbellOutline,
  chevronDown,
  chevronForward,
  chevronUp,
  createOutline,
  heartOutline,
  helpCircleOutline,
  libraryOutline,
  notificationsOutline,
  scaleOutline,
  statsChartOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { BotonSJ, PantallaSJ } from '../components/PantallaSJ';
import BorrarDatos from '../components/BorrarDatos';
import CerrarSesion from '../components/CerrarSesion';
import { usePerfil } from '../context/PerfilContext';
import { useSesion } from '../context/SesionContext';
import { useRecargaAlVolver } from '../hooks/useRecargaAlVolver';
import { rutinaLocal, seriesLocal } from '../repositories/local';
import { METAS_PRINCIPALES, type MetaPrincipal, type RutinaAsignada, type UnidadPeso } from '../types/perfil';
import { ETIQUETAS_META } from '../utils/etiquetasRutina';
import { LONGITUD_MAXIMA_NOMBRE, esNombreValido } from '../utils/validaciones';
import { contarSesiones, describirExperiencia, describirSesiones, inicialesDe, resumirEquipo } from '../utils/perfil';
import { estadoDeLaSemana } from '../utils/semana';
import type { SerieRegistrada } from '../types/series';

const UNIDADES: readonly UnidadPeso[] = ['kg', 'lb'];

interface PropiedadesFilaMenu {
  icono: string;
  titulo: string;
  detalle?: ReactNode;
  onClick: () => void;
}

/** Fila de navegación del perfil: ícono, título, detalle y flecha (estilo lista de ajustes). */
function FilaMenu({ icono, titulo, detalle, onClick }: PropiedadesFilaMenu) {
  return (
    <li>
      <button type="button" className="sj-fila-menu" onClick={onClick}>
        <span className="sj-fila-menu-icono" aria-hidden="true">
          <IonIcon icon={icono} />
        </span>
        <span className="sj-fila-menu-texto">
          <strong>{titulo}</strong>
          {detalle ? <small className="sj-suave sj-bloque">{detalle}</small> : null}
        </span>
        <IonIcon className="sj-fila-menu-flecha" icon={chevronForward} aria-hidden="true" />
      </button>
    </li>
  );
}

function Perfil() {
  const { perfil, cargando: cargandoPerfil, guardarPerfil } = usePerfil();
  const [nombre, setNombre] = useState(perfil.nombre);
  const [meta, setMeta] = useState<MetaPrincipal>(perfil.meta);
  const [nombreTocado, setNombreTocado] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rutina, setRutina] = useState<RutinaAsignada | null>(null);
  const [series, setSeries] = useState<SerieRegistrada[] | null>(null);
  // El bloque de edición empieza abierto si aún no hay nombre, para invitar a completarlo.
  const [editando, setEditando] = useState(perfil.nombre.trim() === '');
  // Si la pantalla se monta antes de que cargue el perfil, se decide al terminar de cargarlo (una sola vez).
  const editandoDecidido = useRef(!cargandoPerfil);
  useEffect(() => {
    if (!cargandoPerfil && !editandoDecidido.current) {
      editandoDecidido.current = true;
      setEditando(perfil.nombre.trim() === '');
    }
  }, [cargandoPerfil, perfil.nombre]);
  const history = useHistory();
  const { sesion } = useSesion();
  const usuarioId = sesion?.user.id ?? null;
  const nombreValido = esNombreValido(nombre);
  // Al volver de cambiar la rutina, Perfil sigue montado en la pila de Ionic: recarga «Tu rutina actual».
  const recarga = useRecargaAlVolver('/perfil');

  useEffect(() => {
    if (usuarioId === null) {
      return undefined;
    }

    let activo = true;
    void rutinaLocal
      .obtener(usuarioId)
      .then((guardada) => {
        if (activo) {
          setRutina(guardada);
        }
      })
      .catch(() => undefined);
    void seriesLocal
      .listar(usuarioId)
      .then((guardadas) => {
        if (activo) {
          setSeries(guardadas);
        }
      })
      .catch(() => undefined);

    return () => {
      activo = false;
    };
  }, [usuarioId, recarga]);

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

  const nombreVisible = perfil.nombre.trim();
  const iniciales = inicialesDe(nombreVisible);
  const sesionesHechas = series === null ? null : contarSesiones(series);
  const textoSesiones = sesionesHechas === null ? null : describirSesiones(sesionesHechas);
  // Avance de la semana actual (lunes a domingo): días de la rutina ya hechos.
  const semana = rutina && series ? estadoDeLaSemana(rutina, series, new Date()) : null;
  const hechasSemana = semana ? semana.filter((dia) => dia.estado === 'hecho').length : 0;
  const totalSemana = semana ? semana.length : 0;

  return (
    <PantallaSJ
      atras="/hoy"
      etiqueta="Tu cuenta"
      titulo="Tu perfil"
      reglaBajoTitulo
      pie={
        <>
          <BorrarDatos />
          <CerrarSesion />
        </>
      }
    >
      <section className="sj-tarjeta sj-perfil-cabecera" aria-label="Resumen de tu cuenta">
        <div className="sj-perfil-identidad">
          <span className="sj-perfil-avatar" aria-hidden="true">
            {iniciales === '' ? <IonIcon icon={barbellOutline} /> : iniciales}
          </span>
          <span>
            <strong className="sj-perfil-nombre">{nombreVisible === '' ? 'Completa tu perfil' : nombreVisible}</strong>
            <small className="sj-suave sj-bloque">{ETIQUETAS_META[perfil.meta]}</small>
          </span>
        </div>
        <dl className="sj-perfil-cifras">
          <div>
            <dt>Días por semana</dt>
            <dd>{rutina ? rutina.dias.length : '—'}</dd>
          </div>
          <div>
            <dt>Sesiones</dt>
            <dd>{sesionesHechas ?? '—'}</dd>
          </div>
          <div>
            <dt>Unidad</dt>
            <dd>{perfil.unidadPeso}</dd>
          </div>
        </dl>
        {semana && totalSemana > 0 ? (
          <div className="sj-perfil-semana">
            <p className="sj-texto" id="perfil-semana">
              Esta semana:{' '}
              <strong>
                {hechasSemana} de {totalSemana} sesiones
              </strong>
            </p>
            <div
              className="sj-perfil-barra"
              role="progressbar"
              aria-labelledby="perfil-semana"
              aria-valuemin={0}
              aria-valuemax={totalSemana}
              aria-valuenow={hechasSemana}
            >
              <span style={{ width: `${Math.round((hechasSemana / totalSemana) * 100)}%` }} />
            </div>
          </div>
        ) : null}
      </section>

      <section className="sj-perfil-bloque">
        <button
          type="button"
          className="sj-fila-menu"
          aria-expanded={editando}
          aria-controls="perfil-editar"
          onClick={() => setEditando((actual) => !actual)}
        >
          <span className="sj-fila-menu-icono" aria-hidden="true">
            <IonIcon icon={createOutline} />
          </span>
          <span className="sj-fila-menu-texto">
            <strong>Editar perfil</strong>
            <small className="sj-suave sj-bloque">Nombre y meta principal</small>
          </span>
          <IonIcon className="sj-fila-menu-flecha" icon={editando ? chevronUp : chevronDown} aria-hidden="true" />
        </button>
        {editando ? (
          <div className="sj-perfil-editar" id="perfil-editar">
            <IonInput
              className="sj-campo"
              label="Nombre"
              labelPlacement="stacked"
              fill="outline"
              maxlength={LONGITUD_MAXIMA_NOMBRE + 10}
              value={nombre}
              onIonInput={(evento) => setNombre(String(evento.detail.value ?? ''))}
              onIonBlur={() => setNombreTocado(true)}
            />
            {nombreTocado && !nombreValido ? (
              <p className="sj-error" role="alert">
                El nombre es obligatorio y admite hasta {LONGITUD_MAXIMA_NOMBRE} caracteres.
              </p>
            ) : null}

            <h3 className="sj-subtitulo" id="pregunta-meta">Meta principal</h3>
            <div className="sj-segmentos sj-segmentos-columna" role="radiogroup" aria-labelledby="pregunta-meta">
              {METAS_PRINCIPALES.map((opcion) => (
                <button
                  key={opcion}
                  type="button"
                  role="radio"
                  aria-checked={meta === opcion}
                  className="sj-segmento"
                  onClick={() => setMeta(opcion)}
                >
                  {ETIQUETAS_META[opcion]}
                </button>
              ))}
            </div>
            <BotonSJ onClick={() => void guardar()}>Guardar cambios</BotonSJ>
          </div>
        ) : null}
        {mensaje ? <p className="sj-ok" role="status">{mensaje}</p> : null}
        {error ? <p className="sj-error" role="alert">{error}</p> : null}
      </section>

      <h2 className="sj-eyebrow sj-perfil-seccion" id="seccion-entrenamiento">Tu entrenamiento</h2>
      <ul className="sj-menu" aria-labelledby="seccion-entrenamiento">
        <FilaMenu
          icono={barbellOutline}
          titulo="Mi rutina"
          detalle={
            rutina ? (
              <>
                {rutina.dias.length} días por semana · {describirExperiencia(rutina.cuestionario.experiencia)}
                <span className="sj-bloque">{resumirEquipo(rutina.cuestionario.equipo)}</span>
              </>
            ) : (
              'Todavía no tienes una rutina'
            )
          }
          onClick={() => history.push('/rutina')}
        />
        <FilaMenu
          icono={statsChartOutline}
          titulo="Mi progreso"
          detalle={textoSesiones ?? 'Tu historial y la gráfica de peso'}
          onClick={() => history.push('/progreso')}
        />
        <FilaMenu
          icono={libraryOutline}
          titulo="Biblioteca de ejercicios"
          detalle="Fichas de cada ejercicio y calentamiento"
          onClick={() => history.push('/ejercicios')}
        />
      </ul>

      <h2 className="sj-eyebrow sj-perfil-seccion" id="seccion-preferencias">Preferencias</h2>
      <ul className="sj-menu" aria-labelledby="seccion-preferencias">
        <li className="sj-fila-menu sj-fila-menu-fija">
          <span className="sj-fila-menu-icono" aria-hidden="true">
            <IonIcon icon={scaleOutline} />
          </span>
          <span className="sj-fila-menu-texto">
            <strong id="pregunta-unidad">Unidad de peso</strong>
          </span>
          <span className="sj-segmentos sj-perfil-unidad" role="radiogroup" aria-labelledby="pregunta-unidad">
            {UNIDADES.map((unidad) => (
              <button
                key={unidad}
                type="button"
                role="radio"
                aria-checked={perfil.unidadPeso === unidad}
                className="sj-segmento"
                onClick={() => void cambiarUnidad(unidad)}
              >
                {unidad}
              </button>
            ))}
          </span>
        </li>
        <FilaMenu
          icono={notificationsOutline}
          titulo="Recordatorios"
          detalle="Avisos en tus días de entrenamiento"
          onClick={() => history.push('/ajustes')}
        />
        <FilaMenu
          icono={heartOutline}
          titulo="Mis respuestas de salud"
          detalle="Revisa o actualiza tu cuestionario"
          onClick={() => history.push('/editar-salud')}
        />
      </ul>

      <h2 className="sj-eyebrow sj-perfil-seccion" id="seccion-ayuda">Ayuda</h2>
      <ul className="sj-menu" aria-labelledby="seccion-ayuda">
        <FilaMenu
          icono={helpCircleOutline}
          titulo="Glosario"
          detalle="Los términos del entrenamiento, explicados"
          onClick={() => history.push('/glosario')}
        />
      </ul>
    </PantallaSJ>
  );
}

export default Perfil;
