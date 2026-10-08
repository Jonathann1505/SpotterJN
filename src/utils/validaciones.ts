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
