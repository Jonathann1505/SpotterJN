// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { erroresEntornoSupabase } from './validarEntornoSupabase';

function jwtConRol(rol: string): string {
  const codificar = (valor: object): string =>
    btoa(JSON.stringify(valor)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${codificar({ alg: 'HS256', typ: 'JWT' })}.${codificar({ role: rol })}.firma`;
}

const urlValida = 'https://proyecto-prueba.supabase.co';

describe('erroresEntornoSupabase', () => {
  it('acepta una URL válida con una clave publicable', () => {
    expect(
      erroresEntornoSupabase({
        VITE_SUPABASE_URL: urlValida,
        VITE_SUPABASE_ANON_KEY: 'sb_publishable_prueba',
      }),
    ).toEqual([]);
  });

  it('acepta una clave anon con formato JWT', () => {
    expect(
      erroresEntornoSupabase({ VITE_SUPABASE_URL: urlValida, VITE_SUPABASE_ANON_KEY: jwtConRol('anon') }),
    ).toEqual([]);
  });

  it('informa ambas variables cuando faltan o están vacías', () => {
    expect(erroresEntornoSupabase({ VITE_SUPABASE_URL: '  ' })).toEqual([
      'Falta configurar la variable VITE_SUPABASE_URL.',
      'Falta configurar la variable VITE_SUPABASE_ANON_KEY.',
    ]);
  });

  it('rechaza una URL sin formato válido', () => {
    expect(
      erroresEntornoSupabase({ VITE_SUPABASE_URL: 'proyecto', VITE_SUPABASE_ANON_KEY: 'sb_publishable_prueba' }),
    ).toEqual([
      'VITE_SUPABASE_URL debe ser una URL válida, por ejemplo https://<proyecto>.supabase.co.',
    ]);
  });

  it.each([
    ['clave sb_secret_', 'sb_secret_prueba'],
    ['JWT con rol service_role', jwtConRol('service_role')],
  ])('rechaza una %s sin incluir su valor en el mensaje', (_descripcion, clave) => {
    const errores = erroresEntornoSupabase({ VITE_SUPABASE_URL: urlValida, VITE_SUPABASE_ANON_KEY: clave });

    expect(errores).toEqual([
      'VITE_SUPABASE_ANON_KEY debe contener una clave pública, nunca una clave secreta ni service_role.',
    ]);
    expect(errores.join(' ')).not.toContain(clave);
  });
});
