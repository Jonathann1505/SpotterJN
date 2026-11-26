import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { BotonSJ, PantallaSJ } from '../components/PantallaSJ';
import { CargandoSJ } from '../components/CargandoSJ';
import { useSesion } from '../context/SesionContext';
import {
  CALENTAMIENTOS,
  DESCRIPCION_FOCO,
  ETIQUETAS_FOCO,
  FOCOS_CALENTAMIENTO,
  type FocoCalentamiento,
} from '../data/calentamiento';
import { rutinaLocal } from '../repositories/local';
import { focoDeSesion } from '../utils/calentamiento';
import { describirDias } from '../utils/recordatorios';
import { sesionParaFecha } from '../utils/semana';

interface SesionDeHoy {
  foco: FocoCalentamiento;
  nombre: string;
  esHoy: boolean;
  dia: string;
}

/**
 * Calentamiento que se va marcando paso a paso antes de entrenar. Parte del tipo de la sesión que toca
 * y se puede cambiar a mano con los chips.
 */
function Calentamiento() {
  const { sesion } = useSesion();
  const usuarioId = sesion?.user.id ?? null;
  const history = useHistory();
  const [cargando, setCargando] = useState(true);
  const [deHoy, setDeHoy] = useState<SesionDeHoy | null>(null);
  const [elegido, setElegido] = useState<FocoCalentamiento | null>(null);
  const [hechos, setHechos] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    let activo = true;
    if (usuarioId === null) {
      setCargando(false);
      return () => {
        activo = false;
      };
    }

    void rutinaLocal
      .obtener(usuarioId)
      .then((rutina) => {
        const delDia = rutina ? sesionParaFecha(rutina, new Date()) : null;
        if (activo && delDia) {
          setDeHoy({
            foco: focoDeSesion(delDia.dia.nombre),
            nombre: delDia.dia.nombre,
            esHoy: delDia.esHoy,
            dia: describirDias([delDia.diaSemana]),
          });
        }
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
  }, [usuarioId]);

  if (cargando) {
    return (
      <PantallaSJ atras="/ejercicios" etiqueta="Antes de entrenar" titulo="Calentamiento" reglaBajoTitulo>
        <CargandoSJ etiqueta="Preparando tu calentamiento" />
      </PantallaSJ>
    );
  }

  const foco = elegido ?? deHoy?.foco ?? 'completo';
  const pasos = CALENTAMIENTOS[foco];
  const completo = hechos.size === pasos.length;

  const elegirFoco = (nuevo: FocoCalentamiento): void => {
    setElegido(nuevo);
    setHechos(new Set());
  };

  const alternar = (id: string): void => {
    setHechos((actuales) => {
      const siguientes = new Set(actuales);
      if (siguientes.has(id)) {
        siguientes.delete(id);
      } else {
        siguientes.add(id);
      }
      return siguientes;
    });
  };

  return (
    <PantallaSJ
      atras="/ejercicios"
      etiqueta="Antes de entrenar"
      titulo="Calentamiento"
      reglaBajoTitulo
      pie={completo ? <BotonSJ onClick={() => history.replace('/hoy')}>Ir a Hoy</BotonSJ> : undefined}
    >
      {deHoy ? (
        <p className="sj-texto">
          {deHoy.esHoy ? 'Hoy toca' : `Tu próxima sesión es el ${deHoy.dia}`}: <strong>{deHoy.nombre}</strong>.
        </p>
      ) : null}
      <div className="sj-filtro" role="group" aria-label="Tipo de sesión">
        <h2 className="sj-subtitulo">Tipo de sesión</h2>
        <div className="sj-chips">
          {FOCOS_CALENTAMIENTO.map((opcion) => (
            <button
              key={opcion}
              type="button"
              className="sj-chip"
              aria-pressed={opcion === foco}
              onClick={() => elegirFoco(opcion)}
            >
              {ETIQUETAS_FOCO[opcion]}
            </button>
          ))}
        </div>
      </div>
      <p className="sj-texto">{DESCRIPCION_FOCO[foco]}</p>
      <p className="sj-texto sj-suave">
        Dedica de 5 a 8 minutos a preparar tu cuerpo. Marca cada paso cuando lo termines. Si sientes dolor, detente.
      </p>
      <p className="sj-texto sj-suave" role="status">
        {completo ? '¡Listo! Ya puedes empezar tu entrenamiento.' : `${hechos.size} de ${pasos.length} pasos hechos`}
      </p>
      <div role="group" aria-label="Pasos del calentamiento">
        {pasos.map((movimiento) => {
          const hecho = hechos.has(movimiento.id);
          return (
            <button
              key={movimiento.id}
              type="button"
              role="checkbox"
              aria-checked={hecho}
              className="sj-opcion sj-paso-calentamiento"
              onClick={() => alternar(movimiento.id)}
            >
              <span className="sj-opcion-marca" aria-hidden="true">{hecho ? '✓' : ''}</span>
              <span>
                <strong>{movimiento.nombre}</strong>
                <small className="sj-bloque">{movimiento.dosis}</small>
                <small className="sj-bloque">{movimiento.consejo}</small>
              </span>
            </button>
          );
        })}
      </div>
      <p className="sj-texto sj-suave">
        Antes del primer ejercicio con peso, haz una serie ligera con la mitad de la carga para que tus músculos se
        acostumbren.
      </p>
    </PantallaSJ>
  );
}

export default Calentamiento;
