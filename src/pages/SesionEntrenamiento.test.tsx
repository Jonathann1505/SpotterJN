import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactMemoryRouter } from '@ionic/react-router';
import { createMemoryHistory } from 'history';
import { Preferences } from '@capacitor/preferences';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route } from 'react-router-dom';
import { ProveedorPerfil } from '../context/PerfilContext';
import { ajustesPesoLocal, rutinaLocal, seriesLocal } from '../repositories/local';
import type { RutinaAsignada } from '../types/perfil';
import { asignarRutina } from '../utils/rutina';
import { botonAtras, pulsarAtras } from '../test/navegacion';
import SesionEntrenamiento from './SesionEntrenamiento';

vi.mock('../context/SesionContext', () => ({
  useSesion: () => ({ sesion: { user: { id: 'usuario-prueba' } } }),
}));

const avisos = vi.hoisted(() => ({
  estadoAvisoDescanso: vi.fn(async (): Promise<'preguntar' | 'concedido' | 'no-disponible'> => 'no-disponible'),
  pedirPermisoAvisoDescanso: vi.fn(async () => false),
  programarAvisoDescanso: vi.fn(async (_finEn: Date, _mensaje: string): Promise<void> => undefined),
  cancelarAvisoDescanso: vi.fn(async () => undefined),
}));

vi.mock('../services/notificaciones', () => avisos);

vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();

  interface BotonAlerta {
    text: string;
    handler?: () => boolean | void;
  }

  return {
    ...actual,
    IonAlert: ({
      isOpen,
      header,
      message,
      buttons,
    }: {
      isOpen: boolean;
      header: string;
      message: string;
      buttons: BotonAlerta[];
    }) =>
      isOpen ? (
        <div role="alertdialog" aria-label={header}>
          <p>{message}</p>
          {buttons.map((boton) => (
            <button key={boton.text} type="button" onClick={() => boton.handler?.()}>
              {boton.text}
            </button>
          ))}
        </div>
      ) : null,
  };
});

function renderizar(estado?: { indiceDia: number }) {
  return render(
    <IonApp>
      <ProveedorPerfil>
        <MemoryRouter initialEntries={[{ pathname: '/sesion', state: estado }]}>
          <Route exact path="/sesion" component={SesionEntrenamiento} />
          <Route exact path="/hoy">
            <h1>Hoy</h1>
          </Route>
          <Route exact path="/cuestionario-rutina">
            <h1>Cuestionario de rutina</h1>
          </Route>
        </MemoryRouter>
      </ProveedorPerfil>
    </IonApp>,
  );
}

describe('SesionEntrenamiento', () => {
  beforeEach(async () => {
    await Preferences.clear();
  });

  afterEach(cleanup);

  it('muestra la primera jornada con su primer ejercicio como ejercicio actual', async () => {
    const rutina = asignarRutina({
      experiencia: 'ninguna',
      diasPorSemana: 3,
      equipo: ['maquinas'],
    });
    await rutinaLocal.guardar('usuario-prueba', rutina);
    const [primero] = rutina.dias[0].ejercicios;

    const { container } = renderizar();

    expect(await screen.findByRole('heading', { name: rutina.dias[0].nombre })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: primero.nombre })).toBeInTheDocument();
    expect(screen.getByText(`Ejercicio 1 de ${rutina.dias[0].ejercicios.length}`)).toBeInTheDocument();
    expect(screen.getByText(`Serie 1 de ${primero.series}`)).toBeInTheDocument();
    expect(botonAtras(container)).toHaveAttribute('default-href', '/hoy');
    expect(within(container).queryByText('Volver')).not.toBeInTheDocument();
  });

  it('vuelve a Hoy sin registrar la sesión', async () => {
    const rutina = asignarRutina({
      experiencia: 'ninguna',
      diasPorSemana: 2,
      equipo: ['maquinas'],
    });
    await rutinaLocal.guardar('usuario-prueba', rutina);

    const { container } = render(
      <IonApp>
        <ProveedorPerfil>
          <IonReactMemoryRouter history={createMemoryHistory({ initialEntries: ['/sesion'] })}>
            <IonRouterOutlet>
              <Route exact path="/sesion" component={SesionEntrenamiento} />
              <Route exact path="/hoy">
                <h1>Hoy</h1>
              </Route>
            </IonRouterOutlet>
          </IonReactMemoryRouter>
        </ProveedorPerfil>
      </IonApp>,
    );

    await screen.findByRole('heading', { name: rutina.dias[0].nombre });
    pulsarAtras(container);

    expect(await screen.findByRole('heading', { name: 'Hoy' })).toBeInTheDocument();
    expect(await rutinaLocal.obtener('usuario-prueba')).toEqual(rutina);
  });

  it('arranca con la sesión indicada al navegar y con la primera si no se indica', async () => {
    const rutina = asignarRutina({ experiencia: 'ninguna', diasPorSemana: 3, equipo: ['maquinas'] });
    await rutinaLocal.guardar('usuario-prueba', rutina);
    renderizar({ indiceDia: 1 });

    expect(await screen.findByRole('heading', { name: new RegExp(rutina.dias[1].ejercicios[0].nombre) })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: new RegExp(rutina.dias[0].ejercicios[0].nombre) })).not.toBeInTheDocument();
  });

  it('redirige al cuestionario si no existe rutina', async () => {
    renderizar();

    expect(await screen.findByRole('heading', { name: 'Cuestionario de rutina' })).toBeInTheDocument();
  });

  describe('registro de serie', () => {
    const rutinaFija: RutinaAsignada = {
      cuestionario: { experiencia: 'ninguna', diasPorSemana: 2, equipo: ['maquinas'] },
      asignadaEn: '2026-11-13T00:00:00.000Z',
      dias: [
        {
          nombre: 'Día 1 – Prueba',
          ejercicios: [
            { id: 'press-pecho-maquina', nombre: 'Press de pecho en máquina', series: 2, repeticiones: 12, pesoInicialKg: 15 },
            { id: 'flexiones', nombre: 'Flexiones', series: 1, repeticiones: 10, pesoInicialKg: 0 },
          ],
        },
      ],
    };

    function botonGuardar(): HTMLElement {
      const boton = screen.getByText('Guardar serie').closest('ion-button');
      if (!boton) {
        throw new Error('No se encontró el botón Guardar serie.');
      }
      return boton;
    }

    /** ion-button refleja disabled como "" o "true" cuando está deshabilitado y "false" cuando no. */
    function estaDeshabilitado(boton: HTMLElement): boolean {
      const valor = boton.getAttribute('disabled');
      return valor !== null && valor !== 'false';
    }

    async function iniciar(): Promise<void> {
      await rutinaLocal.guardar('usuario-prueba', rutinaFija);
      renderizar();
      await screen.findByRole('heading', { name: 'Press de pecho en máquina' });
    }

    /** Elige la autoevaluación, guarda y espera a que termine el guardado en el dispositivo. */
    async function guardarCon(opcion: 'Fácil' | 'Normal' | 'Difícil'): Promise<void> {
      fireEvent.click(screen.getByRole('radio', { name: opcion }));
      fireEvent.click(botonGuardar());
      await waitFor(() => expect(screen.queryByText('Guardando…')).not.toBeInTheDocument());
      // Entre series aparece el descanso (RF-11); estas pruebas lo saltan para seguir registrando.
      const saltar = screen.queryByText('Saltar descanso');
      if (saltar) {
        fireEvent.click(saltar);
      }
    }

    it('deshabilita Guardar serie hasta elegir una autoevaluación', async () => {
      await iniciar();

      expect(screen.getByRole('radiogroup', { name: '¿Cómo se sintió esta serie?' })).toBeInTheDocument();
      expect(estaDeshabilitado(botonGuardar())).toBe(true);

      fireEvent.click(screen.getByRole('radio', { name: 'Normal' }));

      expect(screen.getByRole('radio', { name: 'Normal' })).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByRole('radio', { name: 'Fácil' })).toHaveAttribute('aria-checked', 'false');
      expect(estaDeshabilitado(botonGuardar())).toBe(false);
    });

    it('avanza la serie y reinicia la autoevaluación al guardar', async () => {
      await iniciar();
      expect(screen.getByText('Serie 1 de 2')).toBeInTheDocument();

      await guardarCon('Difícil');

      expect(screen.getByText('Serie 2 de 2')).toBeInTheDocument();
      for (const opcion of ['Fácil', 'Normal', 'Difícil']) {
        expect(screen.getByRole('radio', { name: opcion })).toHaveAttribute('aria-checked', 'false');
      }
      expect(estaDeshabilitado(botonGuardar())).toBe(true);
    });

    it('limita el peso al máximo admitido y no deja capturar 9999.999', async () => {
      await iniciar();
      const peso = screen.getByLabelText('Peso');

      expect(peso).toHaveAttribute('max', '300');
      fireEvent.change(peso, { target: { value: '9999.999' } });
      fireEvent.blur(peso);

      await waitFor(() => expect(Number((screen.getByLabelText('Peso') as HTMLInputElement).value)).toBeLessThanOrEqual(300));
    });

    it('muestra el contador de peso solo en ejercicios con carga', async () => {
      await iniciar();
      expect(screen.getByLabelText('Repeticiones logradas')).toBeInTheDocument();
      expect(screen.getByLabelText('Peso')).toBeInTheDocument();

      await guardarCon('Fácil');
      await guardarCon('Normal');

      expect(screen.getByRole('heading', { name: 'Flexiones' })).toBeInTheDocument();
      expect(screen.getByText('Ejercicio 2 de 2')).toBeInTheDocument();
      expect(screen.getByText('Serie 1 de 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Repeticiones logradas')).toBeInTheDocument();
      expect(screen.queryByLabelText('Peso')).not.toBeInTheDocument();
    });

    it('muestra Sesión completada al terminar la última serie y vuelve a Hoy', async () => {
      await iniciar();
      await guardarCon('Fácil');
      await guardarCon('Normal');
      await guardarCon('Difícil');

      expect(screen.getByRole('heading', { name: 'Sesión completada' })).toBeInTheDocument();
      const volver = screen.getByText('Volver a Hoy').closest('ion-button');
      if (!volver) {
        throw new Error('No se encontró Volver a Hoy.');
      }
      fireEvent.click(volver);

      expect(await screen.findByRole('heading', { name: 'Hoy' })).toBeInTheDocument();
    });

    describe('Sentí dolor', () => {
      function pulsarSentiDolor(): void {
        const boton = screen.getByText('Sentí dolor').closest('ion-button');
        if (!boton) {
          throw new Error('No se encontró el botón Sentí dolor.');
        }
        fireEvent.click(boton);
      }

      it('muestra un botón secundario con ícono y abre la recomendación', async () => {
        await iniciar();
        const boton = screen.getByText('Sentí dolor').closest('ion-button');
        expect(boton).toHaveClass('sj-boton-secundario');
        expect(boton?.querySelector('ion-icon')).toBeInTheDocument();
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

        pulsarSentiDolor();

        const dialogo = screen.getByRole('alertdialog', { name: 'Detén este ejercicio' });
        expect(dialogo).toHaveTextContent('consulta a un profesional de la salud');
        expect(dialogo).toHaveTextContent('Esta serie no cuenta como fallida');
      });

      it('pasa al siguiente ejercicio sin contar la serie en curso', async () => {
        await iniciar();
        await guardarCon('Fácil');
        fireEvent.click(screen.getByRole('radio', { name: 'Difícil' }));
        expect(screen.getByText('Serie 2 de 2')).toBeInTheDocument();

        pulsarSentiDolor();
        fireEvent.click(
          within(screen.getByRole('alertdialog')).getByRole('button', {
            name: 'Entendido, continuar con otro ejercicio',
          }),
        );

        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
        expect(await screen.findByRole('heading', { name: 'Flexiones' })).toBeInTheDocument();
        expect(screen.getByText('Ejercicio 2 de 2')).toBeInTheDocument();
        expect(screen.getByText('Serie 1 de 1')).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: 'Difícil' })).toHaveAttribute('aria-checked', 'false');
        expect(screen.queryByRole('heading', { name: 'Sesión completada' })).not.toBeInTheDocument();
      });

      it('en el último ejercicio termina la sesión con el aviso de molestia', async () => {
        await iniciar();
        await guardarCon('Normal');
        await guardarCon('Normal');
        expect(screen.getByRole('heading', { name: 'Flexiones' })).toBeInTheDocument();

        pulsarSentiDolor();
        fireEvent.click(
          within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Entendido, terminar la sesión' }),
        );

        expect(await screen.findByRole('heading', { name: 'Sesión finalizada' })).toBeInTheDocument();
        expect(screen.getByText(/Detuviste la sesión por una molestia/)).toHaveTextContent(
          'consulta a un profesional de la salud',
        );
        expect(screen.queryByRole('heading', { name: 'Sesión completada' })).not.toBeInTheDocument();
      });
    });

    describe('guardado de series en el dispositivo', () => {
      afterEach(() => {
        vi.restoreAllMocks();
      });

      it('guarda la serie con sus datos y después avanza', async () => {
        await iniciar();
        fireEvent.click(screen.getByRole('radio', { name: 'Difícil' }));
        fireEvent.click(botonGuardar());

        expect(await screen.findByText('Serie 2 de 2')).toBeInTheDocument();
        const [serie] = await seriesLocal.listar('usuario-prueba');
        expect(serie).toMatchObject({
          idEjercicio: 'press-pecho-maquina',
          nombreEjercicio: 'Press de pecho en máquina',
          dia: 'Día 1 – Prueba',
          numeroSerie: 1,
          peso: 15,
          unidad: 'kg',
          repeticiones: 12,
          autoevaluacion: 'dificil',
          estado: 'completada',
        });
        expect(serie.id).not.toBe('');
        expect(Number.isNaN(Date.parse(serie.registradaEn))).toBe(false);
      });

      it('guarda peso null en los ejercicios de peso corporal', async () => {
        await iniciar();
        await guardarCon('Fácil');
        await guardarCon('Normal');
        await guardarCon('Difícil');

        const flexiones = await seriesLocal.listarPorEjercicio('usuario-prueba', 'flexiones');
        expect(flexiones).toHaveLength(1);
        expect(flexiones[0]).toMatchObject({ peso: null, repeticiones: 10, numeroSerie: 1 });
        expect(await seriesLocal.listar('usuario-prueba')).toHaveLength(3);
      });

      it('si falla, muestra el error, no avanza y conserva lo elegido', async () => {
        vi.spyOn(seriesLocal, 'guardar').mockRejectedValueOnce(new Error('sin espacio'));
        await iniciar();
        fireEvent.click(screen.getByRole('radio', { name: 'Normal' }));
        fireEvent.click(botonGuardar());

        expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo guardar la serie. Inténtalo de nuevo.');
        expect(screen.getByText('Serie 1 de 2')).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: 'Normal' })).toHaveAttribute('aria-checked', 'true');
        expect(estaDeshabilitado(botonGuardar())).toBe(false);

        fireEvent.click(botonGuardar());
        expect(await screen.findByText('Serie 2 de 2')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });

      it('no guarda dos veces con un doble toque', async () => {
        let terminar: () => void = () => undefined;
        const guardar = vi.spyOn(seriesLocal, 'guardar').mockImplementation(
          () =>
            new Promise<void>((resolver) => {
              terminar = resolver;
            }),
        );
        await iniciar();
        fireEvent.click(screen.getByRole('radio', { name: 'Fácil' }));
        const boton = botonGuardar();
        fireEvent.click(boton);
        fireEvent.click(boton);

        expect(await screen.findByText('Guardando…')).toBeInTheDocument();
        expect(guardar).toHaveBeenCalledTimes(1);

        terminar();
        expect(await screen.findByText('Serie 2 de 2')).toBeInTheDocument();
        expect(guardar).toHaveBeenCalledTimes(1);
      });

      it('Sentí dolor guarda la serie marcada como interrumpida por molestia', async () => {
        await iniciar();
        fireEvent.click(screen.getByRole('radio', { name: 'Difícil' }));
        const sentiDolor = screen.getByText('Sentí dolor').closest('ion-button');
        if (!sentiDolor) {
          throw new Error('No se encontró el botón Sentí dolor.');
        }
        fireEvent.click(sentiDolor);
        fireEvent.click(
          within(screen.getByRole('alertdialog')).getByRole('button', {
            name: 'Entendido, continuar con otro ejercicio',
          }),
        );

        expect(await screen.findByRole('heading', { name: 'Flexiones' })).toBeInTheDocument();
        expect(await seriesLocal.listar('usuario-prueba')).toEqual([
          expect.objectContaining({
            idEjercicio: 'press-pecho-maquina',
            numeroSerie: 1,
            autoevaluacion: 'dificil',
            estado: 'interrumpida-por-molestia',
          }),
        ]);
      });

      it('si falla el registro de la molestia, avanza igual y lo informa', async () => {
        vi.spyOn(seriesLocal, 'guardar').mockRejectedValueOnce(new Error('sin espacio'));
        await iniciar();
        const sentiDolor = screen.getByText('Sentí dolor').closest('ion-button');
        if (!sentiDolor) {
          throw new Error('No se encontró el botón Sentí dolor.');
        }
        fireEvent.click(sentiDolor);
        fireEvent.click(
          within(screen.getByRole('alertdialog')).getByRole('button', {
            name: 'Entendido, continuar con otro ejercicio',
          }),
        );

        expect(await screen.findByRole('heading', { name: 'Flexiones' })).toBeInTheDocument();
        expect(screen.getByRole('alert')).toHaveTextContent(
          'No se pudo guardar el registro de la molestia en este dispositivo.',
        );
      });
    });

    describe('descanso entre series (RF-11)', () => {
      async function guardarSinSaltar(opcion: 'Fácil' | 'Normal' | 'Difícil'): Promise<void> {
        fireEvent.click(screen.getByRole('radio', { name: opcion }));
        fireEvent.click(botonGuardar());
        await waitFor(() => expect(screen.queryByText('Guardando…')).not.toBeInTheDocument());
      }

      it('muestra el descanso con la serie anterior como referencia y oculta el registro', async () => {
        await iniciar();
        await guardarSinSaltar('Normal');

        expect(await screen.findByRole('heading', { name: 'Descanso' })).toBeInTheDocument();
        expect(screen.getByText(/Serie anterior: 12 repeticiones · 15 kg/)).toBeInTheDocument();
        expect(screen.getByRole('timer')).toBeInTheDocument();
        expect(screen.getByText('Serie 2 de 2')).toBeInTheDocument();
        expect(screen.queryByText('Guardar serie')).not.toBeInTheDocument();
        expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
      });

      it('Saltar descanso vuelve al registro de la siguiente serie', async () => {
        await iniciar();
        await guardarSinSaltar('Normal');
        fireEvent.click(await screen.findByRole('button', { name: 'Saltar descanso' }));

        expect(screen.queryByRole('heading', { name: 'Descanso' })).not.toBeInTheDocument();
        expect(screen.getByText('Serie 2 de 2')).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: 'Normal' })).toHaveAttribute('aria-checked', 'false');
        expect(estaDeshabilitado(botonGuardar())).toBe(true);
      });

      it('no muestra descanso después de la última serie del ejercicio ni de la sesión', async () => {
        await iniciar();
        await guardarCon('Fácil');
        await guardarSinSaltar('Normal');

        expect(await screen.findByRole('heading', { name: 'Flexiones' })).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Descanso' })).not.toBeInTheDocument();

        await guardarSinSaltar('Difícil');
        expect(await screen.findByRole('heading', { name: 'Sesión completada' })).toBeInTheDocument();
        expect(screen.queryByRole('timer')).not.toBeInTheDocument();
      });

      it('Sentí dolor durante el descanso cierra el descanso y pasa al siguiente ejercicio', async () => {
        await iniciar();
        await guardarSinSaltar('Normal');
        await screen.findByRole('heading', { name: 'Descanso' });

        const sentiDolor = screen.getByText('Sentí dolor').closest('ion-button');
        if (!sentiDolor) {
          throw new Error('No se encontró el botón Sentí dolor.');
        }
        fireEvent.click(sentiDolor);
        fireEvent.click(
          within(screen.getByRole('alertdialog')).getByRole('button', {
            name: 'Entendido, continuar con otro ejercicio',
          }),
        );

        expect(await screen.findByRole('heading', { name: 'Flexiones' })).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Descanso' })).not.toBeInTheDocument();
        expect(screen.getByText('Guardar serie')).toBeInTheDocument();
      });
    });

    describe('resumen al terminar (RF-19)', () => {
      function filaResumen(nombre: string): HTMLElement {
        return screen.getByRole('listitem', { name: `Resumen de ${nombre}` });
      }

      it('aparece al terminar el último ejercicio con lo hecho, la acción, la carga y la frase', async () => {
        await iniciar();
        await guardarCon('Fácil');
        await guardarCon('Normal');
        await guardarCon('Difícil');

        expect(await screen.findByRole('heading', { name: 'Sesión completada' })).toBeInTheDocument();
        expect(await screen.findByRole('heading', { name: 'Resumen y próxima vez' })).toBeInTheDocument();

        const press = filaResumen('Press de pecho en máquina');
        expect(press).toHaveTextContent('2 series · 12, 12 repeticiones · 15 kg.');
        expect(press).toHaveTextContent('Sube 17,5 kg');
        expect(press).toHaveTextContent('Te sobró fuerza: sube a 17,5 kg.');

        const flexiones = filaResumen('Flexiones');
        expect(flexiones).toHaveTextContent('1 serie · 10 repeticiones · peso corporal.');
        expect(flexiones).toHaveTextContent('Mantén 10 repeticiones');
        expect(flexiones).toHaveTextContent('Te costó un poco: repite 10 repeticiones para afianzarlo.');

        expect(screen.getByText('Volver a Hoy')).toBeInTheDocument();
      });

      it('no aparece mientras quedan ejercicios', async () => {
        await iniciar();
        await guardarCon('Fácil');
        await guardarCon('Normal');

        expect(await screen.findByRole('heading', { name: 'Flexiones' })).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Resumen y próxima vez' })).not.toBeInTheDocument();
      });

      it('tras Sentí dolor en el último ejercicio recomienda mantener y cuidarse', async () => {
        await iniciar();
        await guardarCon('Fácil');
        await guardarCon('Fácil');
        const sentiDolor = screen.getByText('Sentí dolor').closest('ion-button');
        if (!sentiDolor) {
          throw new Error('No se encontró el botón Sentí dolor.');
        }
        fireEvent.click(sentiDolor);
        fireEvent.click(
          within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Entendido, terminar la sesión' }),
        );

        expect(await screen.findByRole('heading', { name: 'Sesión finalizada' })).toBeInTheDocument();
        await screen.findByRole('heading', { name: 'Resumen y próxima vez' });
        const flexiones = filaResumen('Flexiones');
        expect(flexiones).toHaveTextContent('Interrumpido por molestia.');
        expect(flexiones).toHaveTextContent('Sentiste molestia: mantén 10 repeticiones y cuídate.');
        expect(filaResumen('Press de pecho en máquina')).toHaveTextContent('Sube 17,5 kg');
      });
    });

    describe('peso de partida (RF-15, RF-17)', () => {
      async function sesionAnteriorFacil(): Promise<void> {
        for (const numero of [1, 2]) {
          await seriesLocal.guardar('usuario-prueba', {
            id: `previa-${numero}`,
            registradaEn: `2026-01-10T18:0${numero}:00.000Z`,
            idEjercicio: 'press-pecho-maquina',
            nombreEjercicio: 'Press de pecho en máquina',
            dia: 'Día 1 – Prueba',
            numeroSerie: numero,
            peso: 15,
            unidad: 'kg',
            repeticiones: 12,
            autoevaluacion: 'facil',
            estado: 'completada',
          });
        }
      }

      it('sin historial empieza con el peso inicial del catálogo', async () => {
        await iniciar();

        expect(screen.getByLabelText('Peso en kg')).toHaveValue(15);
      });

      it('empieza con el peso que recomienda la progresión', async () => {
        await sesionAnteriorFacil();
        await iniciar();

        expect(screen.getByLabelText('Peso en kg')).toHaveValue(17.5);
      });

      it('empieza con el peso ajustado a mano y lo guarda en la serie', async () => {
        await sesionAnteriorFacil();
        await ajustesPesoLocal.guardar('usuario-prueba', {
          idEjercicio: 'press-pecho-maquina',
          peso: 25,
          unidad: 'kg',
          ajustadoEn: new Date().toISOString(),
        });
        await iniciar();

        expect(screen.getByLabelText('Peso en kg')).toHaveValue(25);
        await guardarCon('Normal');
        const guardadas = await seriesLocal.listar('usuario-prueba');
        expect(guardadas[guardadas.length - 1]).toMatchObject({ peso: 25, numeroSerie: 1 });
      });
    });

    describe('aviso de fin de descanso (RF-11)', () => {
      beforeEach(() => {
        // Se limpia al empezar: el desmontaje de la prueba anterior también cancela su aviso.
        vi.clearAllMocks();
        avisos.estadoAvisoDescanso.mockResolvedValue('no-disponible');
        avisos.pedirPermisoAvisoDescanso.mockResolvedValue(false);
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      async function empezarDescanso(): Promise<void> {
        await iniciar();
        fireEvent.click(screen.getByRole('radio', { name: 'Normal' }));
        fireEvent.click(botonGuardar());
        await screen.findByRole('heading', { name: 'Descanso' });
      }

      function ultimoFinProgramado(): number {
        const llamadas = avisos.programarAvisoDescanso.mock.calls;
        const llamada = llamadas[llamadas.length - 1];
        if (!llamada) {
          throw new Error('No se programó ningún aviso.');
        }
        return llamada[0].getTime();
      }

      it('programa el aviso al empezar el descanso, también con la app abierta', async () => {
        const antes = Date.now();
        await empezarDescanso();

        await vi.waitFor(() =>
          expect(avisos.programarAvisoDescanso).toHaveBeenCalledWith(
            expect.any(Date),
            'Descanso terminado. Vamos con la serie 2 de 2.',
          ),
        );
        const fin = ultimoFinProgramado();
        expect(fin).toBeGreaterThanOrEqual(antes + 90_000);
        expect(fin).toBeLessThanOrEqual(Date.now() + 90_000);
      });

      it('no cancela el aviso cuando el tiempo del descanso termina solo', async () => {
        vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
        await empezarDescanso();
        await vi.waitFor(() => expect(avisos.programarAvisoDescanso).toHaveBeenCalled());

        act(() => {
          vi.advanceTimersByTime(91_000);
        });

        expect(screen.queryByRole('heading', { name: 'Descanso' })).not.toBeInTheDocument();
        expect(avisos.cancelarAvisoDescanso).not.toHaveBeenCalled();
      });

      it('+30 s y -30 s reprograman el aviso con la nueva hora de fin', async () => {
        await empezarDescanso();
        await vi.waitFor(() => expect(avisos.programarAvisoDescanso).toHaveBeenCalled());
        const finInicial = ultimoFinProgramado();

        fireEvent.click(screen.getByRole('button', { name: 'Sumar 30 segundos' }));
        await vi.waitFor(() => expect(ultimoFinProgramado() - finInicial).toBeGreaterThanOrEqual(29_000));

        fireEvent.click(screen.getByRole('button', { name: 'Restar 30 segundos' }));
        fireEvent.click(screen.getByRole('button', { name: 'Restar 30 segundos' }));
        await vi.waitFor(() => expect(ultimoFinProgramado()).toBeLessThan(finInicial));
      });

      it('Saltar descanso cancela el aviso', async () => {
        await empezarDescanso();

        fireEvent.click(screen.getByRole('button', { name: 'Saltar descanso' }));

        expect(avisos.cancelarAvisoDescanso).toHaveBeenCalled();
        expect(screen.getByText('Guardar serie')).toBeInTheDocument();
      });

      it('Sentí dolor durante el descanso cancela el aviso', async () => {
        await empezarDescanso();

        const sentiDolor = screen.getByText('Sentí dolor').closest('ion-button');
        if (!sentiDolor) {
          throw new Error('No se encontró el botón Sentí dolor.');
        }
        fireEvent.click(sentiDolor);
        fireEvent.click(
          within(screen.getByRole('alertdialog')).getByRole('button', {
            name: 'Entendido, continuar con otro ejercicio',
          }),
        );

        await screen.findByRole('heading', { name: 'Flexiones' });
        expect(avisos.cancelarAvisoDescanso).toHaveBeenCalled();
      });

      it('salir de la sesión durante el descanso cancela el aviso', async () => {
        await empezarDescanso();

        cleanup();

        expect(avisos.cancelarAvisoDescanso).toHaveBeenCalled();
      });

      it('la primera vez que empieza un descanso ofrece el aviso y respeta «Ahora no»', async () => {
        avisos.estadoAvisoDescanso.mockResolvedValue('preguntar');
        await empezarDescanso();

        const dialogo = await screen.findByRole('alertdialog', { name: 'Aviso de fin de descanso' });
        fireEvent.click(within(dialogo).getByRole('button', { name: 'Ahora no' }));

        expect(avisos.pedirPermisoAvisoDescanso).toHaveBeenCalledWith(false);
        expect(screen.getByRole('timer')).toBeInTheDocument();
      });

      it('si se acepta el permiso, programa el aviso del descanso en curso', async () => {
        avisos.estadoAvisoDescanso.mockResolvedValue('preguntar');
        avisos.pedirPermisoAvisoDescanso.mockResolvedValue(true);
        await empezarDescanso();
        await vi.waitFor(() => expect(avisos.programarAvisoDescanso).toHaveBeenCalledTimes(1));

        const dialogo = await screen.findByRole('alertdialog', { name: 'Aviso de fin de descanso' });
        fireEvent.click(within(dialogo).getByRole('button', { name: 'Activar' }));

        expect(avisos.pedirPermisoAvisoDescanso).toHaveBeenCalledWith(true);
        await vi.waitFor(() => expect(avisos.programarAvisoDescanso).toHaveBeenCalledTimes(2));
      });

      it('sin aviso disponible no pregunta y el descanso funciona igual', async () => {
        await empezarDescanso();

        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Saltar descanso' }));
        expect(screen.getByText('Guardar serie')).toBeInTheDocument();
      });
    });
  });
});
