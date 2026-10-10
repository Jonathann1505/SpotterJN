import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { escucharSesion, obtenerSesion } from '../services/auth';

interface EstadoSesion {
  sesion: Session | null;
  cargando: boolean;
  error: string | null;
  recargarSesion: () => Promise<void>;
}

const ContextoSesion = createContext<EstadoSesion | null>(null);

export function ProveedorSesion({ children }: PropsWithChildren) {
  const [sesion, setSesion] = useState<Session | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargarSesion = useCallback(async (): Promise<void> => {
    setCargando(true);
    setError(null);

    try {
      setSesion(await obtenerSesion());
    } catch (errorDesconocido: unknown) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : 'No se pudo cargar la sesión. Inténtalo de nuevo.',
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    let activo = true;
    let cambioRecibido = false;

    const cancelarEscucha = escucharSesion((nuevaSesion) => {
      cambioRecibido = true;
      if (activo) {
        setSesion(nuevaSesion);
        setError(null);
        setCargando(false);
      }
    });

    void obtenerSesion()
      .then((sesionInicial) => {
        if (activo && !cambioRecibido) {
          setSesion(sesionInicial);
        }
      })
      .catch((errorDesconocido: unknown) => {
        if (activo && !cambioRecibido) {
          setError(
            errorDesconocido instanceof Error
              ? errorDesconocido.message
              : 'No se pudo cargar la sesión. Inténtalo de nuevo.',
          );
        }
      })
      .finally(() => {
        if (activo) {
          setCargando(false);
        }
      });

    return () => {
      activo = false;
      cancelarEscucha();
    };
  }, []);

  const valor = useMemo(
    () => ({ sesion, cargando, error, recargarSesion }),
    [sesion, cargando, error, recargarSesion],
  );

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>;
}

export function useSesion(): EstadoSesion {
  const contexto = useContext(ContextoSesion);

  if (!contexto) {
    throw new Error('useSesion debe usarse dentro de ProveedorSesion.');
  }

  return contexto;
}
