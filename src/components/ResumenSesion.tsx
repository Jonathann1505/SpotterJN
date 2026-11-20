import { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { arrowDownOutline, arrowUpOutline, removeOutline } from 'ionicons/icons';
import { seriesLocal } from '../repositories/local';
import type { DiaRutina, UnidadPeso } from '../types/perfil';
import type { SerieRegistrada } from '../types/series';
import { recomendarParaEjercicio, type AccionProgresion } from '../utils/progresion';
import { CargandoSJ } from './CargandoSJ';

interface PropiedadesResumen {
  dia: DiaRutina;
  usuarioId: string | null;
  unidad: UnidadPeso;
  /** Series guardadas durante esta sesión. */
  seriesDeLaSesion: readonly SerieRegistrada[];
}

const ICONO_ACCION: Readonly<Record<AccionProgresion, string>> = {
  sube: arrowUpOutline,
  mantiene: removeOutline,
  baja: arrowDownOutline,
};

const TEXTO_ACCION: Readonly<Record<AccionProgresion, string>> = {
  sube: 'Sube',
  mantiene: 'Mantén',
  baja: 'Baja',
};

function describirLoHecho(series: readonly SerieRegistrada[]): string {
  const completadas = series.filter((serie) => serie.estado === 'completada');
  const molestia = series.some((serie) => serie.estado === 'interrumpida-por-molestia');
  if (completadas.length === 0) {
    return molestia ? 'Interrumpido por molestia.' : 'Sin series registradas.';
  }
  const repeticiones = completadas.map((serie) => serie.repeticiones).join(', ');
  const ultima = completadas[completadas.length - 1];
  const carga = ultima.peso === null ? 'peso corporal' : `${ultima.peso.toLocaleString('es')} ${ultima.unidad}`;
  const texto = `${completadas.length} ${completadas.length === 1 ? 'serie' : 'series'} · ${repeticiones} repeticiones · ${carga}`;
  return molestia ? `${texto} · interrumpido por molestia.` : `${texto}.`;
}

/** Resumen al terminar la sesión: lo que se hizo y la recomendación para la próxima vez (RF-19). */
export function ResumenSesion({ dia, usuarioId, unidad, seriesDeLaSesion }: PropiedadesResumen) {
  const [historial, setHistorial] = useState<SerieRegistrada[] | null>(null);

  useEffect(() => {
    let activo = true;
    if (usuarioId === null) {
      setHistorial([...seriesDeLaSesion]);
      return () => {
        activo = false;
      };
    }
    // La progresión necesita las sesiones anteriores (por ejemplo, para bajar tras 3 fallos).
    void seriesLocal
      .listar(usuarioId)
      .then((series) => {
        if (activo) {
          setHistorial(series);
        }
      })
      .catch(() => {
        if (activo) {
          setHistorial([...seriesDeLaSesion]);
        }
      });
    return () => {
      activo = false;
    };
  }, [usuarioId, seriesDeLaSesion]);

  if (historial === null) {
    return <CargandoSJ etiqueta="Preparando tu resumen" filas={dia.ejercicios.length} />;
  }

  return (
    <section aria-labelledby="resumen-titulo">
      <h2 className="sj-subtitulo" id="resumen-titulo">Resumen y próxima vez</h2>
      <ul className="sj-lista sj-resumen-sesion">
        {dia.ejercicios.map((ejercicio) => {
          const hechas = seriesDeLaSesion.filter((serie) => serie.idEjercicio === ejercicio.id);
          const recomendacion = recomendarParaEjercicio(ejercicio, historial, unidad);
          const carga =
            recomendacion.peso === null
              ? `${recomendacion.repeticiones} repeticiones`
              : `${recomendacion.peso.toLocaleString('es')} ${unidad}`;
          return (
            <li key={ejercicio.id} aria-label={`Resumen de ${ejercicio.nombre}`}>
              <span>
                <strong>{ejercicio.nombre}</strong>
                <small className="sj-suave sj-bloque">{describirLoHecho(hechas)}</small>
                <small className="sj-bloque">{recomendacion.explicacion}</small>
              </span>
              <p className="sj-texto">
                <IonIcon icon={ICONO_ACCION[recomendacion.accion]} aria-hidden="true" />{' '}
                <strong>
                  {TEXTO_ACCION[recomendacion.accion]} {carga}
                </strong>
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
