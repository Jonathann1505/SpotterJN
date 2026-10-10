import { describe, expect, it } from 'vitest';
import { esContrasenaValida, esCorreoValido } from './validaciones';

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
