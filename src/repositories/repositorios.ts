import type { PerfilUsuario, RespuestasSalud, RutinaAsignada } from '../types/perfil';
import type { AjustesRecordatorios } from '../types/recordatorios';

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

export interface FichasVistasRepositorio {
  obtener(usuarioId: string): Promise<string[]>;
  marcarVista(usuarioId: string, idEjercicio: string): Promise<void>;
}

export interface RecordatoriosRepositorio {
  obtener(usuarioId: string): Promise<AjustesRecordatorios>;
  guardar(usuarioId: string, ajustes: AjustesRecordatorios): Promise<void>;
}
