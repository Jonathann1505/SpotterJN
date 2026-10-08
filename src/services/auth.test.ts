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
});
