import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Preferences } from '@capacitor/preferences';
import {
  ajustesPesoLocal,
  borrarDatosLocales,
  fichasVistasLocal,
  perfilLocal,
  recordatoriosLocal,
  rutinaLocal,
  saludLocal,
  seriesLocal,
} from './local';
import type { PerfilUsuario, RespuestasSalud, RutinaAsignada } from '../types/perfil';
import type { SerieRegistrada } from '../types/series';
import type { AjustePeso } from '../types/ajustesPeso';
import { LIMITE_SERIES_POR_USUARIO } from './recorteSeries';
import { guardarJson } from './almacenLocal';

// Por defecto llama a la implementación real; permite simular un fallo de escritura puntual.
vi.mock('./almacenLocal', async (importOriginal) => {
  const real = await importOriginal<typeof import('./almacenLocal')>();
  return { ...real, guardarJson: vi.fn(real.guardarJson) };
});

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

describe('borrarDatosLocales', () => {
  it('borra todo lo guardado de una persona sin tocar a las demás', async () => {
    for (const usuario of [USUARIO_A, USUARIO_B]) {
      await perfilLocal.guardar(usuario, { nombre: 'Ana', meta: 'fuerza', unidadPeso: 'kg' });
      await saludLocal.guardar(usuario, { condiciones: [], respondidoEn: '2026-10-09T10:00:00.000Z' });
      await fichasVistasLocal.marcarVista(usuario, 'press-banca');
      await recordatoriosLocal.guardar(usuario, { activo: true, hora: '18:00' });
      await seriesLocal.guardar(usuario, crearSerie());
    }

    await borrarDatosLocales(USUARIO_A);

    expect(await perfilLocal.obtener(USUARIO_A)).toBeNull();
    expect(await saludLocal.obtener(USUARIO_A)).toBeNull();
    expect(await fichasVistasLocal.obtener(USUARIO_A)).toEqual([]);
    expect(await recordatoriosLocal.obtener(USUARIO_A)).toEqual({ activo: false, hora: '18:00' });
    expect(await seriesLocal.listar(USUARIO_A)).toEqual([]);
    expect(await perfilLocal.obtener(USUARIO_B)).not.toBeNull();
    expect(await seriesLocal.listar(USUARIO_B)).toHaveLength(1);
  });

  it('no falla si no había nada guardado y exige un usuario', async () => {
    await expect(borrarDatosLocales(USUARIO_A)).resolves.toBeUndefined();
    await expect(borrarDatosLocales('')).rejects.toThrow(/sesión/i);
  });
});

describe('límite de series guardadas', () => {
  const claveSeries = (usuario: string): string => `spotter.usuario.${usuario}.series`;

  /** Series del mismo ejercicio en días consecutivos: cada una es su propia sesión. */
  function seriesAntiguas(cantidad: number, prefijo = 'antigua'): SerieRegistrada[] {
    return Array.from({ length: cantidad }, (_, indice) =>
      crearSerie({
        id: `${prefijo}-${indice}`,
        registradaEn: new Date(Date.UTC(2020, 0, 1 + indice, 18)).toISOString(),
      }),
    );
  }

  async function sembrar(usuario: string, series: SerieRegistrada[]): Promise<void> {
    await Preferences.set({ key: claveSeries(usuario), value: JSON.stringify(series) });
  }

  it('al pasar el límite descarta la serie más antigua y conserva la recién guardada', async () => {
    await sembrar(USUARIO_A, seriesAntiguas(LIMITE_SERIES_POR_USUARIO));
    const nueva = crearSerie({ id: 'nueva', registradaEn: '2026-11-24T18:00:00.000Z' });

    await seriesLocal.guardar(USUARIO_A, nueva);
    const guardadas = await seriesLocal.listar(USUARIO_A);

    expect(guardadas).toHaveLength(LIMITE_SERIES_POR_USUARIO);
    expect(guardadas.map((serie) => serie.id)).not.toContain('antigua-0');
    expect(guardadas[0].id).toBe('antigua-1');
    expect(guardadas[guardadas.length - 1]).toEqual(nueva);
  });

  it('por debajo del límite no borra nada', async () => {
    await sembrar(USUARIO_A, seriesAntiguas(LIMITE_SERIES_POR_USUARIO - 1));

    await seriesLocal.guardar(USUARIO_A, crearSerie({ id: 'nueva', registradaEn: '2026-11-24T18:00:00.000Z' }));

    const guardadas = await seriesLocal.listar(USUARIO_A);
    expect(guardadas).toHaveLength(LIMITE_SERIES_POR_USUARIO);
    expect(guardadas[0].id).toBe('antigua-0');
  });

  it('no toca las series de otro usuario', async () => {
    const deB = seriesAntiguas(3, 'b');
    await sembrar(USUARIO_B, deB);
    await sembrar(USUARIO_A, seriesAntiguas(LIMITE_SERIES_POR_USUARIO));

    await seriesLocal.guardar(USUARIO_A, crearSerie({ id: 'nueva', registradaEn: '2026-11-24T18:00:00.000Z' }));

    expect(await seriesLocal.listar(USUARIO_B)).toEqual(deB);
  });

  it('si el guardado falla, la lista anterior queda intacta', async () => {
    const previas = seriesAntiguas(LIMITE_SERIES_POR_USUARIO);
    await sembrar(USUARIO_A, previas);
    vi.mocked(guardarJson).mockRejectedValueOnce(new Error('sin espacio'));

    await expect(
      seriesLocal.guardar(USUARIO_A, crearSerie({ id: 'nueva', registradaEn: '2026-11-24T18:00:00.000Z' })),
    ).rejects.toThrow('sin espacio');

    expect(await seriesLocal.listar(USUARIO_A)).toEqual(previas);
  });
});

describe('repositorio local de ajustes manuales de peso', () => {
  const claveAjustes = (usuario: string): string => `spotter.usuario.${usuario}.ajustesPeso`;

  function ajuste(cambios: Partial<AjustePeso> = {}): AjustePeso {
    return { idEjercicio: 'press-banca', peso: 50, unidad: 'kg', ajustadoEn: '2026-11-24T18:00:00.000Z', ...cambios };
  }

  it('devuelve un objeto vacío si no hay ajustes', async () => {
    expect(await ajustesPesoLocal.obtener(USUARIO_A)).toEqual({});
  });

  it('guarda y lee un ajuste por ejercicio y reemplaza el anterior del mismo ejercicio', async () => {
    await ajustesPesoLocal.guardar(USUARIO_A, ajuste());
    await ajustesPesoLocal.guardar(USUARIO_A, ajuste({ idEjercicio: 'remo-barra', peso: 30 }));
    await ajustesPesoLocal.guardar(USUARIO_A, ajuste({ peso: 55, ajustadoEn: '2026-11-25T18:00:00.000Z' }));

    expect(await ajustesPesoLocal.obtener(USUARIO_A)).toEqual({
      'press-banca': ajuste({ peso: 55, ajustadoEn: '2026-11-25T18:00:00.000Z' }),
      'remo-barra': ajuste({ idEjercicio: 'remo-barra', peso: 30 }),
    });
  });

  it('no mezcla los ajustes de distintas cuentas', async () => {
    await ajustesPesoLocal.guardar(USUARIO_A, ajuste({ peso: 60 }));
    await ajustesPesoLocal.guardar(USUARIO_B, ajuste({ peso: 20, unidad: 'lb' }));

    expect(await ajustesPesoLocal.obtener(USUARIO_A)).toEqual({ 'press-banca': ajuste({ peso: 60 }) });
    expect(await ajustesPesoLocal.obtener(USUARIO_B)).toEqual({ 'press-banca': ajuste({ peso: 20, unidad: 'lb' }) });
  });

  it('ignora los ajustes corruptos sin perder los válidos', async () => {
    await Preferences.set({
      key: claveAjustes(USUARIO_A),
      value: JSON.stringify({
        'press-banca': ajuste(),
        'remo-barra': { ...ajuste({ idEjercicio: 'remo-barra' }), unidad: 'oz' },
        sentadilla: { ...ajuste({ idEjercicio: 'sentadilla' }), peso: -5 },
        prensa: { ...ajuste({ idEjercicio: 'prensa' }), ajustadoEn: 'ayer' },
        'otro-id': ajuste({ idEjercicio: 'no-coincide' }),
        texto: 'x',
      }),
    });

    expect(await ajustesPesoLocal.obtener(USUARIO_A)).toEqual({ 'press-banca': ajuste() });
  });

  it('trata como vacío un valor que no es un objeto o no es JSON', async () => {
    await Preferences.set({ key: claveAjustes(USUARIO_A), value: '[1,2]' });
    expect(await ajustesPesoLocal.obtener(USUARIO_A)).toEqual({});

    await Preferences.set({ key: claveAjustes(USUARIO_A), value: 'no es json' });
    expect(await ajustesPesoLocal.obtener(USUARIO_A)).toEqual({});
  });

  it('se borra junto con el resto de datos de la persona', async () => {
    await ajustesPesoLocal.guardar(USUARIO_A, ajuste());

    await borrarDatosLocales(USUARIO_A);

    expect(await ajustesPesoLocal.obtener(USUARIO_A)).toEqual({});
  });
});
