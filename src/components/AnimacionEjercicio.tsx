import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

interface PropiedadesAnimacion {
  /** Ruta de la animación dentro de public/: un HTML o un video MP4, por ejemplo "ejercicios/flexiones.mp4". */
  archivo: string;
  titulo: string;
}

function prefiereMenosMovimiento(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function esVideo(archivo: string): boolean {
  return archivo.toLowerCase().endsWith('.mp4');
}

function VideoEjercicio({ src, titulo }: { src: string; titulo: string }) {
  const referencia = useRef<HTMLVideoElement>(null);
  const [pausado, setPausado] = useState(prefiereMenosMovimiento);

  useEffect(() => {
    // React no refleja `muted` como atributo; sin esto algunos navegadores bloquean el inicio automático.
    if (referencia.current) {
      referencia.current.muted = true;
    }
  }, []);

  const alternar = (): void => {
    const video = referencia.current;
    if (!video) {
      return;
    }

    if (video.paused) {
      void Promise.resolve(video.play()).catch(() => setPausado(true));
    } else {
      video.pause();
    }
  };

  const alPulsarTecla = (evento: KeyboardEvent<HTMLDivElement>): void => {
    if (evento.key === ' ' || evento.key === 'Enter') {
      evento.preventDefault();
      alternar();
    }
  };

  return (
    <div
      className="sj-animacion sj-animacion-video"
      role="button"
      tabIndex={0}
      aria-label={`Animación del ejercicio: ${titulo}. Toca para pausar o reanudar.`}
      aria-pressed={pausado}
      onClick={alternar}
      onKeyDown={alPulsarTecla}
    >
      <video
        ref={referencia}
        className="sj-animacion-marco"
        src={src}
        muted
        loop
        playsInline
        autoPlay={!pausado}
        preload="auto"
        onPlay={() => setPausado(false)}
        onPause={() => setPausado(true)}
      />
      {pausado ? <span className="sj-animacion-reproducir" aria-hidden="true">▶</span> : null}
    </div>
  );
}

/**
 * Muestra la animación de un ejercicio. Los HTML van en un iframe aislado (sin acceso al origen de la app);
 * los MP4, en un video silenciado y en bucle. En ambos casos se pausa o reanuda al tocarla y no se inicia
 * sola si el usuario prefiere menos movimiento.
 */
export function AnimacionEjercicio({ archivo, titulo }: PropiedadesAnimacion) {
  const ruta = `${import.meta.env.BASE_URL}${archivo}`;

  if (esVideo(archivo)) {
    return <VideoEjercicio src={ruta} titulo={titulo} />;
  }

  const consulta = prefiereMenosMovimiento() ? '?autoplay=0' : '';

  return (
    <div className="sj-animacion">
      <iframe
        className="sj-animacion-marco"
        title={`Animación del ejercicio: ${titulo}`}
        src={`${ruta}${consulta}`}
        sandbox="allow-scripts"
        loading="lazy"
      />
    </div>
  );
}
