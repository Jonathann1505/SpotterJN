import type { PerfilUsuario, RespuestasSalud, RutinaAsignada } from '../types/perfil';

export interface PerfilRepositorio {
  obtener(): Promise<PerfilUsuario | null>;
  guardar(perfil: PerfilUsuario): Promise<void>;
}

export interface SaludRepositorio {
  obtener(): Promise<RespuestasSalud | null>;
  guardar(respuestas: RespuestasSalud): Promise<void>;
}

export interface RutinaRepositorio {
  obtener(): Promise<RutinaAsignada | null>;
  guardar(rutina: RutinaAsignada): Promise<void>;
}
