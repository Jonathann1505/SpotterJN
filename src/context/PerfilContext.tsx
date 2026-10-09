import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { perfilLocal } from '../repositories/local';
import type { PerfilRepositorio } from '../repositories/repositorios';
import type { PerfilUsuario } from '../types/perfil';

export const PERFIL_INICIAL: PerfilUsuario = { nombre: '', meta: 'fuerza', unidadPeso: 'kg' };

interface EstadoPerfil {
  perfil: PerfilUsuario;
  cargando: boolean;
  guardarPerfil: (perfil: PerfilUsuario) => Promise<void>;
}

const ContextoPerfil = createContext<EstadoPerfil | null>(null);

interface PropiedadesProveedor extends PropsWithChildren {
  repositorio?: PerfilRepositorio;
}

export function ProveedorPerfil({ children, repositorio = perfilLocal }: PropiedadesProveedor) {
  const [perfil, setPerfil] = useState<PerfilUsuario>(PERFIL_INICIAL);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    void repositorio
      .obtener()
      .then((guardado) => {
        if (activo && guardado) {
          setPerfil(guardado);
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
  }, [repositorio]);

  const guardarPerfil = useCallback(
    async (nuevo: PerfilUsuario): Promise<void> => {
      await repositorio.guardar(nuevo);
      setPerfil(nuevo);
    },
    [repositorio],
  );

  const valor = useMemo(() => ({ perfil, cargando, guardarPerfil }), [perfil, cargando, guardarPerfil]);

  return <ContextoPerfil.Provider value={valor}>{children}</ContextoPerfil.Provider>;
}

export function usePerfil(): EstadoPerfil {
  const contexto = useContext(ContextoPerfil);

  if (!contexto) {
    throw new Error('usePerfil debe usarse dentro de ProveedorPerfil.');
  }

  return contexto;
}
