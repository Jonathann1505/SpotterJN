import { beforeEach, describe, expect, it } from 'vitest';
import { Preferences } from '@capacitor/preferences';
import { fichasVistasLocal, perfilLocal, recordatoriosLocal, rutinaLocal, saludLocal, seriesLocal } from './local';
import type { PerfilUsuario, RespuestasSalud, RutinaAsignada } from '../types/perfil';
import type { SerieRegistrada } from '../types/series';

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

  it('registra las fichas de ejercicio vistas sin duplicarlas', async () => {
    expect(await fichasVistasLocal.obtener('ana')).toEqual([]);

    await fichasVistasLocal.marcarVista('ana', 'press-banca');
    await fichasVistasLocal.marcarVista('ana', 'press-banca');
    await fichasVistasLocal.marcarVista('ana', 'remo-maquina');

    expect(await fichasVistasLocal.obtener('ana')).toEqual(['press-banca', 'remo-maquina']);
  });

  it('ignora una lista de fichas vistas corrupta', async () => {
    await Preferences.set({ key: 'spotter.usuario.ana.fichasVistas', value: JSON.stringify([1, 2]) });
    expect(await fichasVistasLocal.obtener('ana')).toEqual([]);
  });

  it('devuelve recordatorios desactivados a las 18:00 si no hay ajustes guardados', async () => {
    expect(await recordatoriosLocal.obtener('ana')).toEqual({ activo: false, hora: '18:00' });
  });

  it('guarda y recupera los ajustes de recordatorios', async () => {
    await recordatoriosLocal.guardar('ana', { activo: true, hora: '07:15' });
    expect(await recordatoriosLocal.obtener('ana')).toEqual({ activo: true, hora: '07:15' });
  });

  it('ignora ajustes de recordatorios con una hora inválida', async () => {
    await Preferences.set({ key: 'spotter.usuario.ana.recordatorios', value: JSON.stringify({ activo: true, hora: '99:99' }) });
    expect(await recordatoriosLocal.obtener('ana')).toEqual({ activo: false, hora: '18:00' });
  });

  it('separa las fichas vistas y los recordatorios de cada usuario', async () => {
    await fichasVistasLocal.marcarVista('ana', 'press-banca');
    await recordatoriosLocal.guardar('ana', { activo: true, hora: '07:15' });

    expect(await fichasVistasLocal.obtener('luis')).toEqual([]);
    expect(await recordatoriosLocal.obtener('luis')).toEqual({ activo: false, hora: '18:00' });
  });

  it('exige un usuario para leer o guardar fichas vistas y recordatorios', async () => {
    await expect(fichasVistasLocal.obtener('')).rejects.toThrow(/sesión/i);
    await expect(recordatoriosLocal.guardar('', { activo: false, hora: '18:00' })).rejects.toThrow(/sesión/i);
  });
});

function crearSerie(cambios: Partial<SerieRegistrada> = {}): SerieRegistrada {
  return {
    id: 'serie-1',
    registradaEn: '2026-11-20T18:00:00.000Z',
    idEjercicio: 'press-banca',
    nombreEjercicio: 'Press de banca',
    dia: 'Día 1 – Empuje',
    numeroSerie: 1,
    peso: 20,
    unidad: 'kg',
    repeticiones: 12,
    autoevaluacion: 'normal',
    estado: 'completada',
    ...cambios,
  };
}

describe('repositorio local de series', () => {
  it('devuelve una lista vacía si no hay series guardadas', async () => {
    expect(await seriesLocal.listar(USUARIO_A)).toEqual([]);
  });

  it('guarda las series en orden y en la clave del usuario', async () => {
    const primera = crearSerie();
    const segunda = crearSerie({ id: 'serie-2', numeroSerie: 2, autoevaluacion: 'dificil' });
    await seriesLocal.guardar(USUARIO_A, primera);
    await seriesLocal.guardar(USUARIO_A, segunda);

    expect(await seriesLocal.listar(USUARIO_A)).toEqual([primera, segunda]);
    const { value } = await Preferences.get({ key: `spotter.usuario.${USUARIO_A}.series` });
    expect(JSON.parse(value ?? '[]')).toHaveLength(2);
  });

  it('no mezcla las series de distintas cuentas', async () => {
    await seriesLocal.guardar(USUARIO_A, crearSerie());
    await seriesLocal.guardar(USUARIO_B, crearSerie({ id: 'serie-b', repeticiones: 8 }));

    expect(await seriesLocal.listar(USUARIO_A)).toEqual([crearSerie()]);
    expect(await seriesLocal.listar(USUARIO_B)).toEqual([crearSerie({ id: 'serie-b', repeticiones: 8 })]);
  });

  it('filtra las series por ejercicio', async () => {
    const banca = crearSerie();
    const flexiones = crearSerie({
      id: 'serie-2',
      idEjercicio: 'flexiones',
      nombreEjercicio: 'Flexiones',
      peso: null,
    });
    await seriesLocal.guardar(USUARIO_A, banca);
    await seriesLocal.guardar(USUARIO_A, flexiones);

    expect(await seriesLocal.listarPorEjercicio(USUARIO_A, 'flexiones')).toEqual([flexiones]);
    expect(await seriesLocal.listarPorEjercicio(USUARIO_A, 'press-banca')).toEqual([banca]);
    expect(await seriesLocal.listarPorEjercicio(USUARIO_A, 'remo-barra')).toEqual([]);
  });

  it('conserva las series interrumpidas por molestia sin autoevaluación', async () => {
    const interrumpida = crearSerie({ estado: 'interrumpida-por-molestia', autoevaluacion: null });
    await seriesLocal.guardar(USUARIO_A, interrumpida);

    expect(await seriesLocal.listar(USUARIO_A)).toEqual([interrumpida]);
  });

  it('ignora las series corruptas sin perder las válidas', async () => {
    const valida = crearSerie();
    await Preferences.set({
      key: `spotter.usuario.${USUARIO_A}.series`,
      value: JSON.stringify([
        valida,
        { ...valida, id: 'sin-unidad', unidad: 'oz' },
        { ...valida, id: 'reps-negativas', repeticiones: -1 },
        { ...valida, id: 'fecha-invalida', registradaEn: 'ayer' },
        { ...valida, id: 'estado-raro', estado: 'perdida' },
        'texto',
        null,
      ]),
    });

    expect(await seriesLocal.listar(USUARIO_A)).toEqual([valida]);

    const nueva = crearSerie({ id: 'serie-2', numeroSerie: 2 });
    await seriesLocal.guardar(USUARIO_A, nueva);
    expect(await seriesLocal.listar(USUARIO_A)).toEqual([valida, nueva]);
  });

  it('trata como vacío un valor que no es una lista o no es JSON', async () => {
    const clave = `spotter.usuario.${USUARIO_A}.series`;
    await Preferences.set({ key: clave, value: '{"id":"x"}' });
    expect(await seriesLocal.listar(USUARIO_A)).toEqual([]);

    await Preferences.set({ key: clave, value: 'no es json' });
    expect(await seriesLocal.listar(USUARIO_A)).toEqual([]);
  });

  it('exige un usuario para leer o guardar series', async () => {
    await expect(seriesLocal.listar('')).rejects.toThrow(/sesión/i);
    await expect(seriesLocal.guardar('', crearSerie())).rejects.toThrow(/sesión/i);
  });
});
