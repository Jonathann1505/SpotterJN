import { beforeEach, describe, expect, it } from 'vitest';
import { Preferences } from '@capacitor/preferences';
import { perfilLocal, rutinaLocal, saludLocal } from './local';
import type { PerfilUsuario, RespuestasSalud, RutinaAsignada } from '../types/perfil';

const USUARIO_A = 'usuario-a';
const USUARIO_B = 'usuario-b';

beforeEach(async () => {
  await Preferences.clear();
});

describe('repositorios locales', () => {
  it('devuelve null cuando no hay datos guardados', async () => {
    expect(await perfilLocal.obtener(USUARIO_A)).toBeNull();
    expect(await saludLocal.obtener(USUARIO_A)).toBeNull();
    expect(await rutinaLocal.obtener(USUARIO_A)).toBeNull();
  });

  it('guarda y recupera el perfil', async () => {
    const perfil: PerfilUsuario = { nombre: 'Nayeli', meta: 'fuerza', unidadPeso: 'kg' };
    await perfilLocal.guardar(USUARIO_A, perfil);
    expect(await perfilLocal.obtener(USUARIO_A)).toEqual(perfil);
  });

  it('guarda la salud en una clave distinta del perfil', async () => {
    const salud: RespuestasSalud = { condiciones: ['dolor-articular'], respondidoEn: '2026-10-09T10:00:00.000Z' };
    await saludLocal.guardar(USUARIO_A, salud);
    expect(await saludLocal.obtener(USUARIO_A)).toEqual(salud);
    expect(await perfilLocal.obtener(USUARIO_A)).toBeNull();
  });

  it('guarda y recupera la rutina asignada', async () => {
    const rutina: RutinaAsignada = {
      cuestionario: { experiencia: 'ninguna', diasPorSemana: 3, equipo: ['maquinas'] },
      dias: [{ nombre: 'Día 1', ejercicios: [{ id: 'prensa', nombre: 'Prensa', series: 3, repeticiones: 10, pesoInicialKg: 40 }] }],
      asignadaEn: '2026-10-09T10:00:00.000Z',
    };
    await rutinaLocal.guardar(USUARIO_A, rutina);
    expect(await rutinaLocal.obtener(USUARIO_A)).toEqual(rutina);
  });

  it('mantiene separados los datos locales de distintos usuarios', async () => {
    const perfilA: PerfilUsuario = { nombre: 'Ana', meta: 'fuerza', unidadPeso: 'kg' };
    const perfilB: PerfilUsuario = { nombre: 'Luis', meta: 'tonificar', unidadPeso: 'lb' };
    const saludA: RespuestasSalud = { condiciones: [], respondidoEn: '2026-10-09T10:00:00.000Z' };
    const rutinaA: RutinaAsignada = {
      cuestionario: { experiencia: 'ninguna', diasPorSemana: 2, equipo: ['maquinas'] },
      dias: [],
      asignadaEn: '2026-10-09T10:00:00.000Z',
    };

    await perfilLocal.guardar(USUARIO_A, perfilA);
    await perfilLocal.guardar(USUARIO_B, perfilB);
    await saludLocal.guardar(USUARIO_A, saludA);
    await rutinaLocal.guardar(USUARIO_A, rutinaA);

    expect(await perfilLocal.obtener(USUARIO_A)).toEqual(perfilA);
    expect(await perfilLocal.obtener(USUARIO_B)).toEqual(perfilB);
    expect(await saludLocal.obtener(USUARIO_A)).toEqual(saludA);
    expect(await saludLocal.obtener(USUARIO_B)).toBeNull();
    expect(await rutinaLocal.obtener(USUARIO_A)).toEqual(rutinaA);
    expect(await rutinaLocal.obtener(USUARIO_B)).toBeNull();
  });

  it('ignora datos corruptos o con forma inválida', async () => {
    await Preferences.set({ key: 'spotter.perfil', value: '{no es json' });
    await Preferences.set({ key: 'spotter.salud', value: JSON.stringify({ condiciones: ['otra'], respondidoEn: 'x' }) });
    expect(await perfilLocal.obtener(USUARIO_A)).toBeNull();
    expect(await saludLocal.obtener(USUARIO_A)).toBeNull();
  });
});
