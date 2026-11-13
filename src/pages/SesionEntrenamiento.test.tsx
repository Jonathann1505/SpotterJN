import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactMemoryRouter } from '@ionic/react-router';
import { createMemoryHistory } from 'history';
import { Preferences } from '@capacitor/preferences';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route } from 'react-router-dom';
import { ProveedorPerfil } from '../context/PerfilContext';
import { rutinaLocal } from '../repositories/local';
import type { RutinaAsignada } from '../types/perfil';
import { asignarRutina } from '../utils/rutina';
import { botonAtras, pulsarAtras } from '../test/navegacion';
import SesionEntrenamiento from './SesionEntrenamiento';

vi.mock('../context/SesionContext', () => ({
  useSesion: () => ({ sesion: { user: { id: 'usuario-prueba' } } }),
}));

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

function renderizar() {
  return render(
    <IonApp>
      <ProveedorPerfil>
        <MemoryRouter initialEntries={['/sesion']}>
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

    function guardarCon(opcion: 'Fácil' | 'Normal' | 'Difícil'): void {
      fireEvent.click(screen.getByRole('radio', { name: opcion }));
      fireEvent.click(botonGuardar());
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

      guardarCon('Difícil');

      expect(screen.getByText('Serie 2 de 2')).toBeInTheDocument();
      for (const opcion of ['Fácil', 'Normal', 'Difícil']) {
        expect(screen.getByRole('radio', { name: opcion })).toHaveAttribute('aria-checked', 'false');
      }
      expect(estaDeshabilitado(botonGuardar())).toBe(true);
    });

    it('muestra el contador de peso solo en ejercicios con carga', async () => {
      await iniciar();
      expect(screen.getByLabelText('Repeticiones logradas')).toBeInTheDocument();
      expect(screen.getByLabelText('Peso')).toBeInTheDocument();

      guardarCon('Fácil');
      guardarCon('Normal');

      expect(screen.getByRole('heading', { name: 'Flexiones' })).toBeInTheDocument();
      expect(screen.getByText('Ejercicio 2 de 2')).toBeInTheDocument();
      expect(screen.getByText('Serie 1 de 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Repeticiones logradas')).toBeInTheDocument();
      expect(screen.queryByLabelText('Peso')).not.toBeInTheDocument();
    });

    it('muestra Sesión completada al terminar la última serie y vuelve a Hoy', async () => {
      await iniciar();
      guardarCon('Fácil');
      guardarCon('Normal');
      guardarCon('Difícil');

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
        guardarCon('Fácil');
        fireEvent.click(screen.getByRole('radio', { name: 'Difícil' }));
        expect(screen.getByText('Serie 2 de 2')).toBeInTheDocument();

        pulsarSentiDolor();
        fireEvent.click(
          within(screen.getByRole('alertdialog')).getByRole('button', {
            name: 'Entendido, continuar con otro ejercicio',
          }),
        );

        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Flexiones' })).toBeInTheDocument();
        expect(screen.getByText('Ejercicio 2 de 2')).toBeInTheDocument();
        expect(screen.getByText('Serie 1 de 1')).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: 'Difícil' })).toHaveAttribute('aria-checked', 'false');
        expect(screen.queryByRole('heading', { name: 'Sesión completada' })).not.toBeInTheDocument();
      });

      it('en el último ejercicio termina la sesión con el aviso de molestia', async () => {
        await iniciar();
        guardarCon('Normal');
        guardarCon('Normal');
        expect(screen.getByRole('heading', { name: 'Flexiones' })).toBeInTheDocument();

        pulsarSentiDolor();
        fireEvent.click(
          within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Entendido, terminar la sesión' }),
        );

        expect(screen.getByRole('heading', { name: 'Sesión finalizada' })).toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveTextContent('consulta a un profesional de la salud');
        expect(screen.queryByRole('heading', { name: 'Sesión completada' })).not.toBeInTheDocument();
      });
    });
  });
});
