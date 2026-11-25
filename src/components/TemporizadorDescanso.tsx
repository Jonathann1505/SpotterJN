import { useEffect, useRef, useState } from 'react';

const DURACION_INICIAL = 90;
const RADIO_CIRCULO = 54;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO_CIRCULO;

function formatearTiempo(segundos: number): string {
  const minutos = Math.floor(segundos / 60).toString().padStart(2, '0');
  const resto = (segundos % 60).toString().padStart(2, '0');
  return `${minutos}:${resto}`;
}

export type MotivoFinDescanso = 'tiempo' | 'saltado';

interface PropiedadesTemporizador {
  /**
   * Se llama al terminar el descanso: `tiempo` si la cuenta llegó sola a cero; `saltado` si la persona
   * lo terminó (Saltar descanso o restar hasta cero).
   */
  alTerminar?: (motivo: MotivoFinDescanso) => void;
  /** Se llama al empezar y cada vez que cambia la hora de fin (ms desde 1970), por ejemplo con ±30 s o al saltar. */
  alCambiarFin?: (finEn: number) => void;
}

function TemporizadorDescanso({ alTerminar, alCambiarFin }: PropiedadesTemporizador = {}) {
  // El tiempo se calcula con la hora real de fin: en segundo plano los intervalos se frenan,
  // pero al volver el temporizador coincide con el aviso del sistema (RF-11).
  const [finEn, setFinEn] = useState(() => Date.now() + DURACION_INICIAL * 1000);
  const [ahora, setAhora] = useState(() => Date.now());
  const [duracionTotal, setDuracionTotal] = useState(DURACION_INICIAL);
  // Se guardan las últimas funciones recibidas para no reiniciar los efectos en cada render.
  const alTerminarActual = useRef(alTerminar);
  alTerminarActual.current = alTerminar;
  const alCambiarFinActual = useRef(alCambiarFin);
  alCambiarFinActual.current = alCambiarFin;
  // Recuerda si el fin lo provocó la persona y no la cuenta.
  const terminadoPorPersona = useRef(false);

  const tiempoRestante = Math.max(0, Math.ceil((finEn - ahora) / 1000));
  const activo = tiempoRestante > 0;

  useEffect(() => {
    if (!activo) {
      return undefined;
    }

    const actualizar = (): void => setAhora(Date.now());
    const intervalo = window.setInterval(actualizar, 1000);
    // Al volver a la app se recalcula enseguida, sin esperar al siguiente intervalo.
    document.addEventListener('visibilitychange', actualizar);

    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener('visibilitychange', actualizar);
    };
  }, [activo]);

  useEffect(() => {
    alCambiarFinActual.current?.(finEn);
  }, [finEn]);

  useEffect(() => {
    if (tiempoRestante === 0) {
      alTerminarActual.current?.(terminadoPorPersona.current ? 'saltado' : 'tiempo');
      terminadoPorPersona.current = false;
    }
  }, [tiempoRestante]);

  const ajustarTiempo = (cambio: 30 | -30): void => {
    const momento = Date.now();
    const nuevoFin = Math.max(momento, Math.max(finEn, momento) + cambio * 1000);
    terminadoPorPersona.current = nuevoFin <= momento;
    setFinEn(nuevoFin);
    setAhora(momento);
    setDuracionTotal((actual) => Math.max(0, actual + cambio));
  };

  const saltarDescanso = (): void => {
    const momento = Date.now();
    terminadoPorPersona.current = true;
    setFinEn(momento);
    setAhora(momento);
  };

  const progreso = duracionTotal > 0 ? tiempoRestante / duracionTotal : 0;
  const desplazamiento = CIRCUNFERENCIA * (1 - progreso);
  const tiempoFormateado = formatearTiempo(tiempoRestante);

  return (
    <section className="sj sj-descanso" role="group" aria-label="Temporizador de descanso">
      <div
        className="sj-descanso-circulo"
        role="timer"
        aria-label={`Tiempo restante ${tiempoFormateado}`}
      >
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle className="sj-descanso-trazo" cx="60" cy="60" r={RADIO_CIRCULO} />
          <circle
            className="sj-descanso-progreso"
            cx="60"
            cy="60"
            r={RADIO_CIRCULO}
            strokeDasharray={CIRCUNFERENCIA}
            strokeDashoffset={desplazamiento}
          />
        </svg>
        <output className="sj-descanso-tiempo">{tiempoFormateado}</output>
      </div>
      {tiempoRestante === 0 ? <p className="sj-ok" role="status">Descanso terminado</p> : null}
      <div className="sj-descanso-controles">
        <button type="button" onClick={() => ajustarTiempo(-30)} aria-label="Restar 30 segundos">
          −30s
        </button>
        <button type="button" onClick={() => ajustarTiempo(30)} aria-label="Sumar 30 segundos">
          +30s
        </button>
        <button type="button" onClick={saltarDescanso}>Saltar descanso</button>
      </div>
    </section>
  );
}

export default TemporizadorDescanso;
