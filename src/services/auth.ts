import type { AuthError, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type ResultadoAuth =
  | { ok: true }
  | { ok: false; mensaje: string };

export type ResultadoRegistro =
  | { ok: true; sesionIniciada: boolean; mensaje?: string }
  | { ok: false; mensaje: string };

export interface OpcionesRegistro {
  correo: string;
  contrasena: string;
  datosSaludAutorizados: boolean;
}

const mensajesPorCodigo: Record<string, string> = {
  email_exists: 'Ya existe una cuenta con este correo electrónico.',
  user_already_exists: 'Ya existe una cuenta con este correo electrónico.',
  invalid_credentials: 'El correo electrónico o la contraseña no son correctos.',
  weak_password: 'La contraseña no cumple los requisitos de seguridad.',
  over_request_rate_limit: 'Has realizado demasiados intentos. Espera un momento e inténtalo de nuevo.',
  email_not_confirmed: 'Debes confirmar tu correo electrónico antes de iniciar sesión.',
};

function traducirError(error: AuthError): string {
  return error.code
    ? mensajesPorCodigo[error.code] ?? 'No se pudo completar la operación. Inténtalo de nuevo.'
    : 'No se pudo completar la operación. Inténtalo de nuevo.';
}

export async function registrar({
  correo,
  contrasena,
  datosSaludAutorizados,
}: OpcionesRegistro): Promise<ResultadoRegistro> {
  const { data, error } = await supabase.auth.signUp({
    email: correo,
    password: contrasena,
    options: {
      data: {
        aceptado_en: new Date().toISOString(),
        datos_salud_autorizados: datosSaludAutorizados,
      },
    },
  });

  if (error) {
    return { ok: false, mensaje: traducirError(error) };
  }

  if (!data.session) {
    return {
      ok: true,
      sesionIniciada: false,
      mensaje: 'La cuenta se creó. Revisa tu correo para continuar.',
    };
  }

  return { ok: true, sesionIniciada: true };
}

export async function iniciarSesion(
  correo: string,
  contrasena: string,
): Promise<ResultadoAuth> {
  const { error } = await supabase.auth.signInWithPassword({
    email: correo,
    password: contrasena,
  });

  return error
    ? { ok: false, mensaje: traducirError(error) }
    : { ok: true };
}

export async function cerrarSesion(): Promise<ResultadoAuth> {
  const { error } = await supabase.auth.signOut();

  return error
    ? { ok: false, mensaje: traducirError(error) }
    : { ok: true };
}

export async function obtenerSesion(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(traducirError(error));
  }

  return data.session;
}

export function escucharSesion(
  alCambiar: (sesion: Session | null) => void,
): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_evento, sesion) => {
    alCambiar(sesion);
  });

  return () => subscription.unsubscribe();
}
