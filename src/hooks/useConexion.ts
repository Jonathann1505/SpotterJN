import { useEffect, useState } from 'react';

export function useConexion(): boolean {
  const [hayConexion, setHayConexion] = useState(() => navigator.onLine);

  useEffect(() => {
    const alConectar = (): void => setHayConexion(true);
    const alDesconectar = (): void => setHayConexion(false);

    window.addEventListener('online', alConectar);
    window.addEventListener('offline', alDesconectar);

    return () => {
      window.removeEventListener('online', alConectar);
      window.removeEventListener('offline', alDesconectar);
    };
  }, []);

  return hayConexion;
}
