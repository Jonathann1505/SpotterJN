import { beforeEach, describe, expect, it } from 'vitest';
import { Preferences } from '@capacitor/preferences';
import { perfilLocal, rutinaLocal, saludLocal } from './local';
import type { PerfilUsuario, RespuestasSalud, RutinaAsignada } from '../types/perfil';

beforeEach(async () => {
  await Preferences.clear();
});

describe('repositorios locales', () => {
  it('devuelve null cuando no hay datos guardados', async () => {
    expect(await perfilLocal.obtener()).toBeNull();
    expect(await saludLocal.obtener()).toBeNull();
    expect(await rutinaLocal.obtener()).toBeNull();
  });

  it('guarda y recupera el perfil', async () => {
    const perfil: PerfilUsuario = { nombre: 'Nayeli', meta: 'fuerza', unidadPeso: 'kg' };
    await perfilLocal.guardar(perfil);
    expect(await perfilLocal.obtener()).toEqual(perfil);
  });

  it('guarda la salud en una clave distinta del perfil', async () => {
    const salud: RespuestasSalud = { condiciones: ['dolor-articular'], respondidoEn: '2026-10-09T10:00:00.000Z' };
    await saludLocal.guardar(salud);
    expect(await saludLocal.obtener()).toEqual(salud);
    expect(await perfilLocal.obtener()).toBeNull();
  });

  it('guarda y recupera la rutina asignada', async () => {
    const rutina: RutinaAsignada = {
      cuestionario: { experiencia: 'ninguna', diasPorSemana: 3, equipo: ['maquinas'] },
      dias: [{ nombre: 'Día 1', ejercicios: [{ id: 'prensa', nombre: 'Prensa', series: 3, repeticiones: 10, pesoInicialKg: 40 }] }],
      asignadaEn: '2026-10-09T10:00:00.000Z',
    };
    await rutinaLocal.guardar(rutina);
    expect(await rutinaLocal.obtener()).toEqual(rutina);
  });

  it('ignora datos corruptos o con forma inválida', async () => {
    await Preferences.set({ key: 'spotter.perfil', value: '{no es json' });
    await Preferences.set({ key: 'spotter.salud', value: JSON.stringify({ condiciones: ['otra'], respondidoEn: 'x' }) });
    expect(await perfilLocal.obtener()).toBeNull();
    expect(await saludLocal.obtener()).toBeNull();
  });
});
