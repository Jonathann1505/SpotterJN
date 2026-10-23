import { useEffect, useState } from 'react';

const DURACION_INICIAL = 90;
const RADIO_CIRCULO = 54;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO_CIRCULO;

function formatearTiempo(segundos: number): string {
  const minutos = Math.floor(segundos / 60).toString().padStart(2, '0');
  const resto = (segundos % 60).toString().padStart(2, '0');
  return `${minutos}:${resto}`;
}

function TemporizadorDescanso() {
  const [tiempoRestante, setTiempoRestante] = useState(DURACION_INICIAL);
  const [duracionTotal, setDuracionTotal] = useState(DURACION_INICIAL);
  const [activo, setActivo] = useState(true);

  useEffect(() => {
    if (!activo) {
      return undefined;
    }

    const intervalo = window.setInterval(() => {
      setTiempoRestante((actual) => Math.max(0, actual - 1));
    }, 1000);

    return () => window.clearInterval(intervalo);
  }, [activo]);

  useEffect(() => {
    if (tiempoRestante === 0) {
      setActivo(false);
    }
  }, [tiempoRestante]);

  const ajustarTiempo = (cambio: 30 | -30): void => {
    setTiempoRestante((actual) => Math.max(0, actual + cambio));
    setDuracionTotal((actual) => Math.max(0, actual + cambio));
    if (cambio > 0) {
      setActivo(true);
    }
  };

  const saltarDescanso = (): void => {
    setTiempoRestante(0);
    setActivo(false);
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
