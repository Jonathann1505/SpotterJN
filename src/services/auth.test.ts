import { afterEach, describe, expect, it, vi } from 'vitest';
import { iniciarSesion, registrar } from './auth';

const authMock = vi.hoisted(() => ({
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
}));

vi.mock('./supabase', () => ({
  supabase: { auth: authMock },
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('servicio de autenticación', () => {
  it('envía metadatos de autorización y comunica el registro sin sesión', async () => {
    authMock.signUp.mockResolvedValue({
      data: { session: null, user: null },
      error: null,
    });

    const resultado = await registrar({
      correo: 'persona@dominio.com',
      contrasena: 'valida123',
      datosSaludAutorizados: true,
    });

    expect(resultado).toEqual({
      ok: true,
      sesionIniciada: false,
      mensaje: 'La cuenta se creó. Revisa tu correo para continuar.',
    });
    expect(authMock.signUp).toHaveBeenCalledWith({
      email: 'persona@dominio.com',
      password: 'valida123',
      options: {
        data: {
          aceptado_en: expect.any(String),
          datos_salud_autorizados: true,
        },
      },
    });
  });

  it('traduce errores de Supabase sin exponer su mensaje original', async () => {
    authMock.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: {
        code: 'invalid_credentials',
        message: 'raw provider message',
      },
    });

    await expect(iniciarSesion('persona@dominio.com', 'incorrecta')).resolves.toEqual({
      ok: false,
      mensaje: 'El correo electrónico o la contraseña no son correctos.',
    });
  });

  it('identifica códigos de configuración comunes de Supabase', async () => {
    authMock.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: {
        code: 'invalid_api_key',
        message: 'private provider details',
      },
    });

    await expect(iniciarSesion('persona@dominio.com', 'contrasena')).resolves.toEqual({
      ok: false,
      mensaje: 'La clave pública de Supabase no es válida. Revisa la configuración local de la app.',
    });
  });

  it('indica que no hubo respuesta de red cuando Auth no entrega código ni estado HTTP', async () => {
    authMock.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: {
        code: undefined,
        status: undefined,
        message: 'private network details',
      },
    });

    await expect(iniciarSesion('persona@dominio.com', 'contrasena')).resolves.toEqual({
      ok: false,
      mensaje: 'No se pudo conectar con Supabase. Verifica la URL del proyecto y tu conexión a internet.',
    });
  });

  it('muestra el estado HTTP si el servidor no devuelve un código Auth', async () => {
    authMock.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: {
        code: undefined,
        status: 401,
        message: 'private server details',
      },
    });

    await expect(iniciarSesion('persona@dominio.com', 'contrasena')).resolves.toEqual({
      ok: false,
      mensaje: 'Supabase rechazó la operación (HTTP 401). Revisa la configuración de Auth del proyecto.',
    });
  });

  it('orienta la revisión de URL y proyecto ante una respuesta HTTP 404', async () => {
    authMock.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: {
        code: undefined,
        status: 404,
        message: 'private server details',
      },
    });

    await expect(iniciarSesion('persona@dominio.com', 'contrasena')).resolves.toEqual({
      ok: false,
      mensaje:
        'Supabase no encontró el proyecto o la ruta de Auth (HTTP 404). Verifica la Project URL y que el proyecto siga activo.',
    });
  });

  it('muestra el código desconocido para facilitar el diagnóstico sin mostrar el error crudo', async () => {
    authMock.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: {
        code: 'provider_configuration_issue',
        message: 'private provider details',
      },
    });

    const resultado = await iniciarSesion('persona@dominio.com', 'contrasena');

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.mensaje).toBe(
        'No se pudo completar la operación (código: provider_configuration_issue). Revisa la configuración de Auth en Supabase.',
      );
      expect(resultado.mensaje).not.toContain('private provider details');
    }
  });
});
