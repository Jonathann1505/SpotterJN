export function esCorreoValido(correo: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(correo.trim());
}

export function esContrasenaValida(contrasena: string): boolean {
  return (
    contrasena.length >= 8 &&
    /\p{L}/u.test(contrasena) &&
    /\d/u.test(contrasena)
  );
}

export const LONGITUD_MAXIMA_NOMBRE = 40;

export function esNombreValido(nombre: string): boolean {
  const limpio = nombre.trim();
  return limpio.length > 0 && limpio.length <= LONGITUD_MAXIMA_NOMBRE;
}
