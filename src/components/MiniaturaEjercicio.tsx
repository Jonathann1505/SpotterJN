import { obtenerGuia } from '../data/guias';

interface PropiedadesMiniatura {
  idEjercicio: string;
  nombre: string;
}

function prefiereMenosMovimiento(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Imagen pequeña de un ejercicio para las listas. Si su animación es un video se muestra en bucle y
 * silenciada (o como cuadro fijo si el sistema pide menos movimiento); si no, un recuadro con la inicial.
 * Es decorativa: el nombre del ejercicio ya aparece como texto junto a ella.
 */
export function MiniaturaEjercicio({ idEjercicio, nombre }: PropiedadesMiniatura) {
  const { animacion } = obtenerGuia(idEjercicio);

  if (animacion?.toLowerCase().endsWith('.mp4')) {
    const sinMovimiento = prefiereMenosMovimiento();
    return (
      <span className="sj-miniatura" aria-hidden="true">
        <video
          src={`${import.meta.env.BASE_URL}${animacion}${sinMovimiento ? '#t=0.1' : ''}`}
          muted
          loop
          playsInline
          autoPlay={!sinMovimiento}
          preload={sinMovimiento ? 'metadata' : 'auto'}
          tabIndex={-1}
        />
      </span>
    );
  }

  return (
    <span className="sj-miniatura sj-miniatura-vacia" aria-hidden="true">
      {nombre.trim().charAt(0).toUpperCase()}
    </span>
  );
}
