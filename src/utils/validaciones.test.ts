import { describe, expect, it } from 'vitest';
import { esContrasenaValida, esCorreoValido, esNombreValido } from './validaciones';

describe('esCorreoValido', () => {
  it('acepta un correo con usuario y dominio', () => {
    expect(esCorreoValido('persona@dominio.com')).toBe(true);
  });

  it.each(['', 'persona', 'persona@dominio', 'persona @dominio.com'])(
    'rechaza el correo inválido "%s"',
    (correo) => {
      expect(esCorreoValido(correo)).toBe(false);
    },
  );
});

describe('esContrasenaValida', () => {
  it.each([
    ['corta1A', false],
    ['sololetras', false],
    ['12345678', false],
    ['válida123', true],
  ])('valida la contraseña según los requisitos', (contrasena, esperada) => {
    expect(esContrasenaValida(contrasena)).toBe(esperada);
  });
});

describe('esNombreValido', () => {
  it('rechaza nombres vacíos o de solo espacios', () => {
    expect(esNombreValido('')).toBe(false);
    expect(esNombreValido('   ')).toBe(false);
  });

  it('acepta hasta 40 caracteres', () => {
    expect(esNombreValido('Nayeli')).toBe(true);
    expect(esNombreValido('a'.repeat(40))).toBe(true);
    expect(esNombreValido('a'.repeat(41))).toBe(false);
  });
});
