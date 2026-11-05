export type EntornoCompilacion = Readonly<Record<string, string | undefined>>;

function decodificarBase64Url(segmento: string): string | null {
  try {
    const base64 = segmento.replace(/-/g, '+').replace(/_/g, '/');
    const relleno = '='.repeat((4 - (base64.length % 4)) % 4);
    return atob(base64 + relleno);
  } catch {
    return null;
  }
}

function esJwtServiceRole(clave: string): boolean {
  const partes = clave.split('.');
  if (partes.length !== 3) {
    return false;
  }

  const contenido = decodificarBase64Url(partes[1]);
  if (contenido === null) {
    return false;
  }

  try {
    const datos: unknown = JSON.parse(contenido);
    return (
      typeof datos === 'object' &&
      datos !== null &&
      'role' in datos &&
      (datos as { role: unknown }).role === 'service_role'
    );
  } catch {
    return false;
  }
}

function esUrlHttp(valor: string): boolean {
  try {
    const url = new URL(valor);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Devuelve los problemas de configuración de Supabase sin incluir nunca los valores.
 */
export function erroresEntornoSupabase(entorno: EntornoCompilacion): string[] {
  const errores: string[] = [];
  const url = entorno.VITE_SUPABASE_URL?.trim() ?? '';
  const clave = entorno.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

  if (url === '') {
    errores.push('Falta configurar la variable VITE_SUPABASE_URL.');
  } else if (!esUrlHttp(url)) {
    errores.push('VITE_SUPABASE_URL debe ser una URL válida, por ejemplo https://<proyecto>.supabase.co.');
  }

  if (clave === '') {
    errores.push('Falta configurar la variable VITE_SUPABASE_ANON_KEY.');
  } else if (clave.startsWith('sb_secret_') || esJwtServiceRole(clave)) {
    errores.push('VITE_SUPABASE_ANON_KEY debe contener una clave pública, nunca una clave secreta ni service_role.');
  }

  return errores;
}
