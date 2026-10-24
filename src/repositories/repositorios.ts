import type { PerfilUsuario, RespuestasSalud, RutinaAsignada } from '../types/perfil';

export interface PerfilRepositorio {
  obtener(usuarioId: string): Promise<PerfilUsuario | null>;
  guardar(usuarioId: string, perfil: PerfilUsuario): Promise<void>;
}

export interface SaludRepositorio {
  obtener(usuarioId: string): Promise<RespuestasSalud | null>;
  guardar(usuarioId: string, respuestas: RespuestasSalud): Promise<void>;
}

export interface RutinaRepositorio {
  obtener(usuarioId: string): Promise<RutinaAsignada | null>;
  guardar(usuarioId: string, rutina: RutinaAsignada): Promise<void>;
}
