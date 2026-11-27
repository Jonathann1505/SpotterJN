import { describe, expect, it, vi } from 'vitest';
import type { SerieRegistrada } from '../types/series';
import type { AjustePeso } from '../types/ajustesPeso';
import {
  PESO_MAXIMO_MANUAL,
  agruparEnSesiones,
  calcularProgresion,
  esPesoManualValido,
  explicarProgresion,
  recomendarParaEjercicio,
  type ObjetivoEjercicio,
} from './progresion';

const OBJETIVO: ObjetivoEjercicio = { series: 3, repeticiones: 12 };

let contador = 0;

function serie(cambios: Partial<SerieRegistrada> = {}): SerieRegistrada {
  contador += 1;
  return {
    id: `serie-${contador}`,
    registradaEn: '2026-11-20T18:00:00.000Z',
    idEjercicio: 'press-banca',
    nombreEjercicio: 'Press de banca',
    dia: 'Día 1 – Empuje',
    numeroSerie: 1,
    peso: 40,
    unidad: 'kg',
    repeticiones: 12,
    autoevaluacion: 'normal',
    estado: 'completada',
    ...cambios,
  };
}

/** Una sesión de 3 series en el día indicado (AAAA-MM-DD), con cambios por serie. */
function sesion(fecha: string, cambios: Partial<SerieRegistrada>[] = [{}, {}, {}]): SerieRegistrada[] {
  return cambios.map((cambio, indice) =>
    serie({
      registradaEn: `${fecha}T18:0${indice}:00.000Z`,
      numeroSerie: indice + 1,
      ...cambio,
    }),
  );
}

describe('agruparEnSesiones', () => {
  it('separa por fecha y cuando el número de serie vuelve a empezar', () => {
    const series = [
      ...sesion('2026-11-18'),
      ...sesion('2026-11-20', [{}, {}]),
      ...sesion('2026-11-20', [{ registradaEn: '2026-11-20T20:00:00.000Z' }]),
    ];

    expect(agruparEnSesiones(series).map((grupo) => grupo.series.length)).toEqual([3, 2, 1]);
  });

  it('ordena por fecha aunque las series lleguen desordenadas', () => {
    const series = sesion('2026-11-20');
    expect(agruparEnSesiones([...series].reverse())[0].series.map((s) => s.numeroSerie)).toEqual([1, 2, 3]);
  });
});

describe('calcularProgresion', () => {
  it('sin series usa el peso inicial y lo explica', () => {
    const resultado = calcularProgresion({ series: [], objetivo: OBJETIVO, pesoActual: 20, unidad: 'kg' });

    expect(resultado).toMatchObject({ accion: 'mantiene', motivo: 'sin-series', peso: 20, repeticiones: 12 });
    expect(resultado.explicacion).toBe('Empieza con 20 kg: es el punto de partida recomendado.');
  });

  it('sube 2,5 kg cuando todo fue Fácil o Normal y se alcanzaron las repeticiones', () => {
    const series = sesion('2026-11-20', [{ autoevaluacion: 'facil' }, {}, { autoevaluacion: 'facil', repeticiones: 13 }]);
    const resultado = calcularProgresion({ series, objetivo: OBJETIVO, pesoActual: 20, unidad: 'kg' });

    expect(resultado).toMatchObject({ accion: 'sube', motivo: 'todo-bien', peso: 42.5 });
    expect(resultado.explicacion).toBe('Te sobró fuerza: sube a 42,5 kg.');
  });

  it('sube 5 lb como máximo en libras', () => {
    const series = sesion('2026-11-20', [{ peso: 90, unidad: 'lb' }, { peso: 90, unidad: 'lb' }, { peso: 90, unidad: 'lb' }]);
    const resultado = calcularProgresion({ series, objetivo: OBJETIVO, pesoActual: 45, unidad: 'lb' });

    expect(resultado).toMatchObject({ accion: 'sube', peso: 95, unidad: 'lb' });
    expect(resultado.explicacion).toBe('Te sobró fuerza: sube a 95 lb.');
  });

  it('no recomienda subir cuando el peso ya llegó al máximo admitido', () => {
    const series = sesion('2026-11-20', [{ peso: 300 }, { peso: 300 }, { peso: 300 }]);
    const resultado = calcularProgresion({ series, objetivo: OBJETIVO, pesoActual: 300, unidad: 'kg' });

    expect(resultado).toMatchObject({ accion: 'mantiene', motivo: 'peso-maximo', peso: 300 });
    expect(resultado.explicacion).toBe('Llegaste al peso máximo que admite la app: mantén 300 kg.');
  });

  it('con un peso guardado fuera de rango recomienda el máximo en vez de subir', () => {
    const series = sesion('2026-11-20', [{ peso: 9999.999 }, { peso: 9999.999 }, { peso: 9999.999 }]);
    const resultado = calcularProgresion({ series, objetivo: OBJETIVO, pesoActual: 40, unidad: 'kg' });

    expect(resultado).toMatchObject({ accion: 'mantiene', motivo: 'peso-maximo', peso: PESO_MAXIMO_MANUAL.kg });
  });

  it('respeta el tope de subida aunque la sesión anterior haya sido muy fácil', () => {
    const series = sesion('2026-11-20', [
      { autoevaluacion: 'facil', repeticiones: 20 },
      { autoevaluacion: 'facil', repeticiones: 20 },
      { autoevaluacion: 'facil', repeticiones: 20 },
    ]);
    const resultado = calcularProgresion({ series, objetivo: OBJETIVO, pesoActual: 20, unidad: 'kg' });

    expect(resultado.peso).toBe(42.5);
    expect((resultado.peso ?? 0) - 40).toBeLessThanOrEqual(2.5);
  });

  it('mantiene si alguna serie fue Difícil', () => {
    const series = sesion('2026-11-20', [{}, { autoevaluacion: 'dificil' }, {}]);
    const resultado = calcularProgresion({ series, objetivo: OBJETIVO, pesoActual: 20, unidad: 'kg' });

    expect(resultado).toMatchObject({ accion: 'mantiene', motivo: 'dificil', peso: 40 });
    expect(resultado.explicacion).toBe('Te costó un poco: repite 40 kg para afianzarlo.');
  });

  it('mantiene si no alcanzó las repeticiones objetivo', () => {
    const series = sesion('2026-11-20', [{}, {}, { repeticiones: 9 }]);
    expect(calcularProgresion({ series, objetivo: OBJETIVO, pesoActual: 20, unidad: 'kg' })).toMatchObject({
      accion: 'mantiene',
      motivo: 'dificil',
      peso: 40,
    });
  });

  it('mantiene sin contarlo como fallo si no completó todas las series', () => {
    const series = sesion('2026-11-20', [{}, {}]);
    expect(calcularProgresion({ series, objetivo: OBJETIVO, pesoActual: 20, unidad: 'kg' })).toMatchObject({
      accion: 'mantiene',
      motivo: 'incompleta',
      peso: 40,
    });
  });

  it('baja un 10 % redondeado a 2,5 kg tras 3 sesiones fallidas seguidas con el mismo peso', () => {
    const fallida = [{}, { autoevaluacion: 'dificil' as const }, {}];
    const series = [...sesion('2026-11-16', fallida), ...sesion('2026-11-18', fallida), ...sesion('2026-11-20', fallida)];
    const resultado = calcularProgresion({ series, objetivo: OBJETIVO, pesoActual: 20, unidad: 'kg' });

    expect(resultado).toMatchObject({ accion: 'baja', motivo: 'tres-fallos', peso: 35 });
    expect(resultado.explicacion).toBe('Llevas 3 sesiones difíciles con este peso: baja a 35 kg y vuelve a subir.');
  });

  it('baja redondeando a 5 lb en libras', () => {
    const fallida = [{ peso: 100, unidad: 'lb' as const, repeticiones: 8 }, { peso: 100, unidad: 'lb' as const }, { peso: 100, unidad: 'lb' as const }];
    const series = [...sesion('2026-11-16', fallida), ...sesion('2026-11-18', fallida), ...sesion('2026-11-20', fallida)];

    expect(calcularProgresion({ series, objetivo: OBJETIVO, pesoActual: 45, unidad: 'lb' })).toMatchObject({
      accion: 'baja',
      peso: 90,
    });
  });

  it('no baja si los 3 fallos no fueron con el mismo peso', () => {
    const fallida = (peso: number) => [{ peso }, { peso, autoevaluacion: 'dificil' as const }, { peso }];
    const series = [...sesion('2026-11-16', fallida(37.5)), ...sesion('2026-11-18', fallida(40)), ...sesion('2026-11-20', fallida(40))];

    expect(calcularProgresion({ series, objetivo: OBJETIVO, pesoActual: 20, unidad: 'kg' }).accion).toBe('mantiene');
  });

  it('no baja con solo 2 sesiones fallidas', () => {
    const fallida = [{}, { autoevaluacion: 'dificil' as const }, {}];
    const series = [...sesion('2026-11-18', fallida), ...sesion('2026-11-20', fallida)];

    expect(calcularProgresion({ series, objetivo: OBJETIVO, pesoActual: 20, unidad: 'kg' }).accion).toBe('mantiene');
  });

  it('con molestia en la última sesión mantiene el peso aunque el resto fuera bien', () => {
    const series = sesion('2026-11-20', [
      { autoevaluacion: 'facil' },
      { autoevaluacion: null, estado: 'interrumpida-por-molestia' },
    ]);
    const resultado = calcularProgresion({ series, objetivo: OBJETIVO, pesoActual: 20, unidad: 'kg' });

    expect(resultado).toMatchObject({ accion: 'mantiene', motivo: 'molestia', peso: 40 });
    expect(resultado.explicacion).toBe('Sentiste molestia: mantén 40 kg y cuídate.');
  });

  it('las sesiones con molestia no cuentan como fallo para bajar', () => {
    const fallida = [{}, { autoevaluacion: 'dificil' as const }, {}];
    const series = [
      ...sesion('2026-11-14', fallida),
      ...sesion('2026-11-16', fallida),
      ...sesion('2026-11-18', [{ autoevaluacion: null, estado: 'interrumpida-por-molestia' }]),
      ...sesion('2026-11-20', [{ autoevaluacion: 'facil' }, { autoevaluacion: 'facil' }, { autoevaluacion: 'facil' }]),
    ];

    expect(calcularProgresion({ series, objetivo: OBJETIVO, pesoActual: 20, unidad: 'kg' }).accion).toBe('sube');
  });

  it('ignora las series por molestia de sesiones anteriores al evaluar la última', () => {
    const series = [
      ...sesion('2026-11-18', [{ autoevaluacion: null, estado: 'interrumpida-por-molestia' }]),
      ...sesion('2026-11-20', [{ autoevaluacion: 'facil' }, { autoevaluacion: 'facil' }, { autoevaluacion: 'facil' }]),
    ];

    expect(calcularProgresion({ series, objetivo: OBJETIVO, pesoActual: 20, unidad: 'kg' })).toMatchObject({
      accion: 'sube',
      peso: 42.5,
    });
  });

  it('convierte el peso si la serie se guardó en otra unidad', () => {
    const series = sesion('2026-11-20', [{ peso: 88, unidad: 'lb' }, { peso: 88, unidad: 'lb' }, { peso: 88, unidad: 'lb' }]);

    expect(calcularProgresion({ series, objetivo: OBJETIVO, pesoActual: 20, unidad: 'kg' }).peso).toBe(42.5);
  });

  describe('peso corporal', () => {
    const corporal = (cambios: Partial<SerieRegistrada>[]) => sesion('2026-11-20', cambios.map((c) => ({ peso: null, ...c })));

    it('sube 2 repeticiones sobre lo logrado si todo fue Fácil o Normal', () => {
      const resultado = calcularProgresion({
        series: corporal([{ repeticiones: 12 }, { repeticiones: 13 }, { repeticiones: 12 }]),
        objetivo: OBJETIVO,
        pesoActual: null,
        unidad: 'kg',
      });

      expect(resultado).toMatchObject({ accion: 'sube', peso: null, repeticiones: 15 });
      expect(resultado.explicacion).toBe('Te sobró fuerza: sube a 15 repeticiones.');
    });

    it('mantiene si alguna serie fue Difícil y nunca baja', () => {
      const fallida = (fecha: string) => sesion(fecha, [{ peso: null }, { peso: null, autoevaluacion: 'dificil' }, { peso: null }]);
      const resultado = calcularProgresion({
        series: [...fallida('2026-11-16'), ...fallida('2026-11-18'), ...fallida('2026-11-20')],
        objetivo: OBJETIVO,
        pesoActual: null,
        unidad: 'kg',
      });

      expect(resultado).toMatchObject({ accion: 'mantiene', peso: null, repeticiones: 12 });
    });

    it('sin series usa las repeticiones de la rutina', () => {
      const resultado = calcularProgresion({ series: [], objetivo: OBJETIVO, pesoActual: null, unidad: 'kg' });
      expect(resultado.explicacion).toBe('Empieza con 12 repeticiones: es el punto de partida recomendado.');
    });
  });

  it('permite cambiar el generador de frases (por ejemplo, por IA más adelante)', () => {
    const explicar = vi.fn(() => 'frase personalizada');
    const resultado = calcularProgresion({ series: [], objetivo: OBJETIVO, pesoActual: 20, unidad: 'kg' }, explicar);

    expect(resultado.explicacion).toBe('frase personalizada');
    expect(explicar).toHaveBeenCalledWith(expect.objectContaining({ motivo: 'sin-series', peso: 20 }));
  });

  it('las frases fijas cubren las seis situaciones', () => {
    const motivos = ['sin-series', 'todo-bien', 'dificil', 'incompleta', 'molestia', 'tres-fallos'] as const;
    const frases = motivos.map((motivo) =>
      explicarProgresion({ accion: 'mantiene', motivo, peso: 40, repeticiones: 12, unidad: 'kg' }),
    );
    expect(new Set(frases).size).toBe(6);
    frases.forEach((frase) => expect(frase).toContain('40 kg'));
  });
});

describe('ajuste manual del peso (RF-17)', () => {
  function ajuste(cambios: Partial<AjustePeso> = {}): AjustePeso {
    return { idEjercicio: 'press-banca', peso: 50, unidad: 'kg', ajustadoEn: '2026-11-22T10:00:00.000Z', ...cambios };
  }
  const sesionFacil = () =>
    sesion('2026-11-20', [{ autoevaluacion: 'facil' }, { autoevaluacion: 'facil' }, { autoevaluacion: 'facil' }]);

  it('con un ajuste más reciente que la última sesión usa el peso ajustado', () => {
    const resultado = calcularProgresion({
      series: sesionFacil(),
      objetivo: OBJETIVO,
      pesoActual: 20,
      unidad: 'kg',
      ajuste: ajuste(),
    });

    expect(resultado).toMatchObject({ motivo: 'ajuste-manual', peso: 50 });
    expect(resultado.explicacion).toBe('Ajustado por ti: empieza con 50 kg.');
  });

  it('sin series también usa el ajuste en lugar del peso inicial', () => {
    expect(
      calcularProgresion({ series: [], objetivo: OBJETIVO, pesoActual: 20, unidad: 'kg', ajuste: ajuste({ peso: 25 }) }).peso,
    ).toBe(25);
  });

  it('el ajuste manual no tiene el tope de subida automática', () => {
    // Última sesión con 40 kg: la regla automática subiría como máximo a 42,5 kg.
    const resultado = calcularProgresion({
      series: sesionFacil(),
      objetivo: OBJETIVO,
      pesoActual: 20,
      unidad: 'kg',
      ajuste: ajuste({ peso: 60 }),
    });
    expect(resultado.peso).toBe(60);
  });

  it('después de una nueva sesión vuelve a las reglas desde el peso de esa sesión', () => {
    const conAjuste = sesion('2026-11-23', [
      { peso: 50, autoevaluacion: 'facil' },
      { peso: 50, autoevaluacion: 'facil' },
      { peso: 50, autoevaluacion: 'facil' },
    ]);
    const resultado = calcularProgresion({
      series: [...sesionFacil(), ...conAjuste],
      objetivo: OBJETIVO,
      pesoActual: 20,
      unidad: 'kg',
      ajuste: ajuste(),
    });

    expect(resultado).toMatchObject({ accion: 'sube', motivo: 'todo-bien', peso: 52.5 });
  });

  it('convierte el ajuste a la unidad actual del perfil', () => {
    const resultado = calcularProgresion({
      series: [],
      objetivo: OBJETIVO,
      pesoActual: 20,
      unidad: 'kg',
      ajuste: ajuste({ peso: 100, unidad: 'lb' }),
    });

    expect(resultado.peso).toBe(45.5);
    expect(resultado.explicacion).toBe('Ajustado por ti: empieza con 45,5 kg.');
  });

  it('en peso corporal ignora cualquier ajuste', () => {
    expect(
      calcularProgresion({ series: [], objetivo: OBJETIVO, pesoActual: null, unidad: 'kg', ajuste: ajuste() }),
    ).toMatchObject({ motivo: 'sin-series', peso: null });
  });

  it('recomendarParaEjercicio solo aplica el ajuste del mismo ejercicio', () => {
    const ejercicio = { id: 'press-banca', nombre: 'Press de banca', series: 3, repeticiones: 12, pesoInicialKg: 20 };

    expect(recomendarParaEjercicio(ejercicio, [], 'kg', explicarProgresion, ajuste()).peso).toBe(50);
    expect(recomendarParaEjercicio(ejercicio, [], 'kg', explicarProgresion, ajuste({ idEjercicio: 'otro' })).peso).toBe(20);
  });

  it('valida el peso manual: sin negativos y con un máximo de 300 kg o 660 lb', () => {
    expect(PESO_MAXIMO_MANUAL).toEqual({ kg: 300, lb: 660 });
    expect(esPesoManualValido(0, 'kg')).toBe(true);
    expect(esPesoManualValido(300, 'kg')).toBe(true);
    expect(esPesoManualValido(300.5, 'kg')).toBe(false);
    expect(esPesoManualValido(660, 'lb')).toBe(true);
    expect(esPesoManualValido(661, 'lb')).toBe(false);
    expect(esPesoManualValido(-1, 'kg')).toBe(false);
    expect(esPesoManualValido(Number.NaN, 'kg')).toBe(false);
  });
});
