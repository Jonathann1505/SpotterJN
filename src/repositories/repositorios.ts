import type { PerfilUsuario, RespuestasSalud, RutinaAsignada } from '../types/perfil';
import type { AjustesRecordatorios } from '../types/recordatorios';
import type { SerieRegistrada } from '../types/series';
import type { AjustePeso, AjustesPeso } from '../types/ajustesPeso';

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

export interface SeriesRepositorio {
  /** Añade una serie al registro del usuario. */
  guardar(usuarioId: string, serie: SerieRegistrada): Promise<void>;
  /** Todas las series del usuario, en el orden en que se registraron. */
  listar(usuarioId: string): Promise<SerieRegistrada[]>;
  listarPorEjercicio(usuarioId: string, idEjercicio: string): Promise<SerieRegistrada[]>;
}

export interface AjustesPesoRepositorio {
  /** Ajustes manuales de peso del usuario, indexados por id de ejercicio. */
  obtener(usuarioId: string): Promise<AjustesPeso>;
  /** Guarda (o reemplaza) el ajuste de un ejercicio. */
  guardar(usuarioId: string, ajuste: AjustePeso): Promise<void>;
}
