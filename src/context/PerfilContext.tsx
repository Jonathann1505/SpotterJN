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
import { useSesion } from './SesionContext';

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
  const { sesion } = useSesion();
  const usuarioId = sesion?.user.id ?? null;
  const [estado, setEstado] = useState<{
    usuarioId: string | null;
    perfil: PerfilUsuario;
    cargando: boolean;
  }>({ usuarioId: null, perfil: PERFIL_INICIAL, cargando: true });

  useEffect(() => {
    let activo = true;
    if (usuarioId === null) {
      setEstado({ usuarioId: null, perfil: PERFIL_INICIAL, cargando: false });
      return () => {
        activo = false;
      };
    }

    setEstado({ usuarioId, perfil: PERFIL_INICIAL, cargando: true });
    void repositorio
      .obtener(usuarioId)
      .then((guardado) => {
        if (activo) {
          setEstado({
            usuarioId,
            perfil: guardado ?? PERFIL_INICIAL,
            cargando: false,
          });
        }
      })
      .catch(() => {
        if (activo) {
          setEstado({ usuarioId, perfil: PERFIL_INICIAL, cargando: false });
        }
      });

    return () => {
      activo = false;
    };
  }, [repositorio, usuarioId]);

  const guardarPerfil = useCallback(
    async (nuevo: PerfilUsuario): Promise<void> => {
      if (usuarioId === null) {
        throw new Error('No hay una sesión activa para guardar el perfil.');
      }

      await repositorio.guardar(usuarioId, nuevo);
      setEstado({ usuarioId, perfil: nuevo, cargando: false });
    },
    [repositorio, usuarioId],
  );

  const valor = useMemo(
    () => ({
      perfil: estado.usuarioId === usuarioId ? estado.perfil : PERFIL_INICIAL,
      cargando: estado.cargando || estado.usuarioId !== usuarioId,
      guardarPerfil,
    }),
    [estado, guardarPerfil, usuarioId],
  );

  return <ContextoPerfil.Provider value={valor}>{children}</ContextoPerfil.Provider>;
}

export function usePerfil(): EstadoPerfil {
  const contexto = useContext(ContextoPerfil);

  if (!contexto) {
    throw new Error('usePerfil debe usarse dentro de ProveedorPerfil.');
  }

  return contexto;
}
