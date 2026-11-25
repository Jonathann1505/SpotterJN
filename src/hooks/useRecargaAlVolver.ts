import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Ionic conserva en la pila las páginas anteriores, así que al volver a ellas no se montan de nuevo
 * y sus efectos de carga no se repiten. Este hook devuelve un número que aumenta cada vez que se
 * vuelve a `ruta` después de haber salido de ella; úsalo como dependencia del efecto de carga.
 */
export function useRecargaAlVolver(ruta: string): number {
  const { pathname, key } = useLocation();
  const [recarga, setRecarga] = useState(0);
  const salioDeLaRuta = useRef(false);

  useEffect(() => {
    if (pathname !== ruta) {
      salioDeLaRuta.current = true;
      return;
    }
    if (salioDeLaRuta.current) {
      salioDeLaRuta.current = false;
      setRecarga((actual) => actual + 1);
    }
  }, [pathname, key, ruta]);

  return recarga;
}
