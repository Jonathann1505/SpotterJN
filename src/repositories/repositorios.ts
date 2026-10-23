import type { PerfilUsuario, RespuestasSalud, RutinaAsignada } from '../types/perfil';
import type { AjustesRecordatorios } from '../types/recordatorios';

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

export interface FichasVistasRepositorio {
  obtener(): Promise<string[]>;
  marcarVista(idEjercicio: string): Promise<void>;
}

export interface RecordatoriosRepositorio {
  obtener(): Promise<AjustesRecordatorios>;
  guardar(ajustes: AjustesRecordatorios): Promise<void>;
}
