import { Preferences } from '@capacitor/preferences';

export async function leerJson<T>(
  clave: string,
  esValido: (valor: unknown) => valor is T,
): Promise<T | null> {
  const { value } = await Preferences.get({ key: clave });
  if (value === null) {
    return null;
  }

  try {
    const valor: unknown = JSON.parse(value);
    return esValido(valor) ? valor : null;
  } catch {
    return null;
  }
}

export async function guardarJson<T>(clave: string, valor: T): Promise<void> {
  await Preferences.set({ key: clave, value: JSON.stringify(valor) });
}
