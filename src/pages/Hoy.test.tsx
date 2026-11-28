import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProveedorPerfil } from '../context/PerfilContext';
import { ajustesPesoLocal, perfilLocal, rutinaLocal, saludLocal, seriesLocal } from '../repositories/local';
import { asignarRutina, partesDeLaSesion } from '../utils/rutina';
import Hoy from './Hoy';

vi.mock('../services/auth', () => ({ cerrarSesion: vi.fn() }));

vi.mock('../context/SesionContext', () => ({
  useSesion: () => ({ sesion: { user: { id: 'usuario-prueba' } } }),
}));

function renderizar() {
  return render(
    <IonApp>
      <ProveedorPerfil>
        <MemoryRouter initialEntries={['/hoy']}>
          <Route path="/hoy" component={Hoy} />
          <Route path="/aviso-medico">
            <p>aviso médico</p>
          </Route>
          <Route path="/cuestionario-rutina">
            <p>cuestionario de rutina</p>
          </Route>
          <Route
            path="/sesion"
            render={({ location }) => <p>pantalla de sesión {JSON.stringify(location.state)}</p>}
          />
          <Route path="/ejercicio/:id">
            <p>ficha de ejercicio</p>
          </Route>
        </MemoryRouter>
      </ProveedorPerfil>
    </IonApp>,
  );
}

const salud = { condiciones: [], respondidoEn: '2026-10-09T10:00:00.000Z' };
const rutina = asignarRutina({ experiencia: 'ninguna', diasPorSemana: 3, equipo: ['maquinas'] });

// Noviembre de 2026: 16 es lunes, 17 martes y 18 miércoles; con 3 días se entrena lunes, miércoles y viernes.
function simularFecha(dia: number): void {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, dia, 9, 0));
}

describe('Hoy', () => {
  beforeEach(async () => {
    simularFecha(16);
    await Preferences.clear();
  });
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('envía al aviso médico si no hay respuestas de salud', async () => {
    const { findByText } = renderizar();
    expect(await findByText('aviso médico')).toBeInTheDocument();
  });

  it('envía al cuestionario de rutina si no hay rutina asignada', async () => {
    await saludLocal.guardar('usuario-prueba', salud);
    const { findByText } = renderizar();
    expect(await findByText('cuestionario de rutina')).toBeInTheDocument();
  });

  it('muestra la próxima sesión con ejercicios, series y pesos', async () => {
    await saludLocal.guardar('usuario-prueba', salud);
    await rutinaLocal.guardar('usuario-prueba', rutina);
    const { findByRole, getAllByText, getByText } = renderizar();

    expect(await findByRole('heading', { name: rutina.dias[0].nombre })).toBeInTheDocument();
    expect(getAllByText('3x12').length).toBeGreaterThan(0);
    expect(getByText('Empezar entrenamiento')).toBeInTheDocument();
  });

  it('saluda por el nombre del perfil', async () => {
    await perfilLocal.guardar('usuario-prueba', { nombre: 'Nayeli', meta: 'fuerza', unidadPeso: 'kg' });
    await saludLocal.guardar('usuario-prueba', salud);
    await rutinaLocal.guardar('usuario-prueba', rutina);
    const { findByText } = renderizar();

    expect(await findByText('Hola, Nayeli. Esta es tu sesión de hoy.')).toBeInTheDocument();
  });

  it('resume la sesión con ejercicios, series y minutos aproximados', async () => {
    await saludLocal.guardar('usuario-prueba', salud);
    await rutinaLocal.guardar('usuario-prueba', rutina);
    const { findByRole } = renderizar();

    const chips = await findByRole('list', { name: 'Resumen de la sesión' });
    expect(within(chips).getAllByRole('listitem').map((chip) => chip.textContent)).toEqual(
      partesDeLaSesion(rutina.dias[0]),
    );
  });

  it('pone «Empezar entrenamiento» dentro de la tarjeta de la sesión, antes de los ejercicios', async () => {
    await saludLocal.guardar('usuario-prueba', salud);
    await rutinaLocal.guardar('usuario-prueba', rutina);
    const { findByRole, getByRole } = renderizar();

    const tarjeta = await findByRole('region', { name: 'Tu sesión' });
    expect(within(tarjeta).getByText('Empezar entrenamiento')).toBeInTheDocument();
    const ejercicios = getByRole('list', { name: 'Ejercicios' });
    expect(tarjeta.compareDocumentPosition(ejercicios) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('muestra los pesos en libras si el perfil usa lb', async () => {
    await saludLocal.guardar('usuario-prueba', salud);
    await rutinaLocal.guardar('usuario-prueba', rutina);
    await perfilLocal.guardar('usuario-prueba', { nombre: 'Nayeli', meta: 'fuerza', unidadPeso: 'lb' });
    const { findAllByText } = renderizar();

    expect((await findAllByText('lb', { exact: false, selector: 'small' })).length).toBeGreaterThan(0);
  });

  it('abre la ficha del ejercicio desde el botón de ayuda', async () => {
    await saludLocal.guardar('usuario-prueba', salud);
    await rutinaLocal.guardar('usuario-prueba', rutina);
    const { findByRole, findByText } = renderizar();

    const primero = rutina.dias[0].ejercicios[0];
    fireEvent.click(await findByRole('button', { name: `Ver la ficha de ${primero.nombre}` }));

    expect(await findByText('ficha de ejercicio')).toBeInTheDocument();
  });

  it('lleva a la sesión de entrenamiento al pulsar «Empezar entrenamiento»', async () => {
    await saludLocal.guardar('usuario-prueba', salud);
    await rutinaLocal.guardar('usuario-prueba', rutina);
    const { findByText } = renderizar();

    fireEvent.click(await findByText('Empezar entrenamiento'));

    expect(await findByText(/pantalla de sesión/)).toBeInTheDocument();
  });

  it('muestra la sesión que toca según el día de la semana', async () => {
    simularFecha(18);
    await saludLocal.guardar('usuario-prueba', salud);
    await rutinaLocal.guardar('usuario-prueba', rutina);
    const { findByRole, findByText } = renderizar();

    expect(await findByRole('heading', { name: rutina.dias[1].nombre })).toBeInTheDocument();
    expect(await findByText('Hoy toca')).toBeInTheDocument();
  });

  it('en un día de descanso muestra la próxima sesión y cuándo es', async () => {
    simularFecha(17);
    await saludLocal.guardar('usuario-prueba', salud);
    await rutinaLocal.guardar('usuario-prueba', rutina);
    const { findByRole, findByText } = renderizar();

    expect(await findByRole('heading', { name: rutina.dias[1].nombre })).toBeInTheDocument();
    expect(await findByText('Próxima sesión · miércoles')).toBeInTheDocument();
    expect(await findByText('Hoy descansas. Tu próxima sesión es el miércoles.')).toBeInTheDocument();
  });

  it('empieza el entrenamiento con la sesión que toca', async () => {
    simularFecha(18);
    await saludLocal.guardar('usuario-prueba', salud);
    await rutinaLocal.guardar('usuario-prueba', rutina);
    const { findByText } = renderizar();

    fireEvent.click(await findByText('Empezar entrenamiento'));

    expect(await findByText('pantalla de sesión {"indiceDia":1}')).toBeInTheDocument();
  });

  it('es una pantalla raíz sin botón atrás', async () => {
    await saludLocal.guardar('usuario-prueba', salud);
    await rutinaLocal.guardar('usuario-prueba', rutina);
    const { container, findByRole } = renderizar();
    await findByRole('heading', { name: rutina.dias[0].nombre });
    expect(container.querySelector('ion-back-button')).toBeNull();
  });

  describe('elegir otro día', () => {
    const opcion = (nombre: RegExp | string) => screen.getByRole('radio', { name: nombre });

    /** Guarda series del día: todas (sesión completa) o solo la primera (sesión a medias). */
    async function guardarSesionDelDia(indice: number, fecha: Date, soloUna = false): Promise<void> {
      for (const ejercicio of rutina.dias[indice].ejercicios) {
        for (let numeroSerie = 1; numeroSerie <= ejercicio.series; numeroSerie += 1) {
          await seriesLocal.guardar('usuario-prueba', {
            id: `serie-dia-${indice}-${ejercicio.id}-${numeroSerie}`,
            registradaEn: fecha.toISOString(),
            idEjercicio: ejercicio.id,
            nombreEjercicio: ejercicio.nombre,
            dia: rutina.dias[indice].nombre,
            numeroSerie,
            peso: ejercicio.pesoInicialKg,
            unidad: 'kg',
            repeticiones: ejercicio.repeticiones,
            autoevaluacion: 'normal',
            estado: 'completada',
          });
          if (soloUna) {
            return;
          }
        }
      }
    }

    beforeEach(async () => {
      await saludLocal.guardar('usuario-prueba', salud);
      await rutinaLocal.guardar('usuario-prueba', rutina);
    });

    it('lista los días de la rutina con su día de la semana y marca el que toca', async () => {
      const { findByRole } = renderizar();
      await findByRole('radiogroup', { name: 'Elegir otro día' });

      expect(opcion(new RegExp(`${rutina.dias[0].nombre} · lunes — Hoy toca`))).toHaveAttribute('aria-checked', 'true');
      expect(opcion(new RegExp(`${rutina.dias[1].nombre} · miércoles$`))).toHaveAttribute('aria-checked', 'false');
      expect(opcion(new RegExp(`${rutina.dias[2].nombre} · viernes$`))).toHaveAttribute('aria-checked', 'false');
    });

    it('al escoger otro día cambia la sesión y empieza ese día', async () => {
      const { findByRole, findByText } = renderizar();
      await findByRole('radiogroup', { name: 'Elegir otro día' });

      fireEvent.click(opcion(new RegExp(rutina.dias[2].nombre)));

      expect(await findByRole('heading', { name: rutina.dias[2].nombre })).toBeInTheDocument();
      expect(await findByText('Elegiste esta sesión.')).toBeInTheDocument();
      expect(await findByText('Sesión elegida')).toBeInTheDocument();
      fireEvent.click(await findByText('Empezar entrenamiento'));
      expect(await findByText('pantalla de sesión {"indiceDia":2}')).toBeInTheDocument();
    });

    it('avisa de la sesión que faltó esta semana y la marca para hacerla', async () => {
      simularFecha(20);
      const { findByRole, findByText } = renderizar();
      await findByRole('radiogroup', { name: 'Elegir otro día' });

      expect(await findByText(/Te faltaron/)).toHaveTextContent(rutina.dias[0].nombre);
      expect(opcion(new RegExp(`${rutina.dias[1].nombre} · miércoles — Te faltó`))).toBeInTheDocument();

      fireEvent.click(opcion(new RegExp(rutina.dias[1].nombre)));
      fireEvent.click(await findByText('Empezar entrenamiento'));
      expect(await findByText('pantalla de sesión {"indiceDia":1}')).toBeInTheDocument();
    });

    it('marca como hecho el día con series de esta semana y no avisa de él', async () => {
      simularFecha(18);
      await guardarSesionDelDia(0, new Date(2026, 10, 16, 18, 0));
      const { findByRole, queryByRole } = renderizar();
      await findByRole('radiogroup', { name: 'Elegir otro día' });

      expect(opcion(new RegExp(`${rutina.dias[0].nombre} · lunes — Hecho`))).toBeInTheDocument();
      expect(queryByRole('status')).toBeNull();
    });

    it('la tira muestra los siete días de lunes a domingo con su fecha', async () => {
      const { findByRole } = renderizar();
      const tira = await findByRole('radiogroup', { name: 'Elegir otro día' });

      const celdas = Array.from(tira.children);
      expect(celdas.map((celda) => celda.querySelector('.sj-tira-inicial')?.textContent)).toEqual([
        'L', 'M', 'X', 'J', 'V', 'S', 'D',
      ]);
      expect(celdas.map((celda) => celda.querySelector('.sj-tira-numero')?.textContent)).toEqual([
        '16', '17', '18', '19', '20', '21', '22',
      ]);
    });

    it('solo deja elegir los días de entrenamiento y marca el de hoy', async () => {
      simularFecha(17);
      const { findByRole } = renderizar();
      const tira = await findByRole('radiogroup', { name: 'Elegir otro día' });

      expect(within(tira).getAllByRole('radio')).toHaveLength(rutina.dias.length);
      const hoy = tira.querySelector('.sj-tira-hoy') as HTMLElement;
      expect(hoy.querySelector('.sj-tira-numero')).toHaveTextContent('17');
      expect(hoy).toHaveClass('sj-tira-descanso');
      expect(hoy).toHaveAttribute('aria-hidden', 'true');
    });

    it('el aviso de faltas indica que se elige en la semana', async () => {
      simularFecha(18);
      const { findByText } = renderizar();

      const aviso = await findByText(/Te faltó/);
      expect(aviso.closest('[role="status"]')).toHaveTextContent(
        `Te faltó ${rutina.dias[0].nombre} (lunes). Puedes hacerla hoy: elígela en tu semana.`,
      );
    });

    it('una sesión a medias no se marca como hecha', async () => {
      simularFecha(18);
      await guardarSesionDelDia(0, new Date(2026, 10, 16, 18, 0), true);
      const { findByRole } = renderizar();
      await findByRole('radiogroup', { name: 'Elegir otro día' });

      expect(opcion(new RegExp(`${rutina.dias[0].nombre} · lunes — Te faltó`))).toBeInTheDocument();
    });

    it('con la sesión de hoy hecha sugiere la próxima en lugar de repetirla', async () => {
      await guardarSesionDelDia(0, new Date(2026, 10, 16, 8, 0));
      const { findByRole, findByText } = renderizar();
      await findByRole('radiogroup', { name: 'Elegir otro día' });

      expect(await findByText('Próxima sesión · miércoles')).toBeInTheDocument();
      expect(await findByText(/Ya completaste la sesión de hoy\. Tu próxima sesión es el miércoles\./)).toBeInTheDocument();
      expect(opcion(new RegExp(`${rutina.dias[0].nombre} · lunes — Hecho`))).toHaveAttribute('aria-checked', 'false');
      expect(opcion(new RegExp(`${rutina.dias[1].nombre} · miércoles$`))).toHaveAttribute('aria-checked', 'true');
      fireEvent.click(await findByText('Empezar entrenamiento'));
      expect(await findByText('pantalla de sesión {"indiceDia":1}')).toBeInTheDocument();
    });

    it('sin días pasados sin hacer no muestra el aviso', async () => {
      const { findByRole, queryByRole } = renderizar();
      await findByRole('radiogroup', { name: 'Elegir otro día' });

      expect(queryByRole('status')).toBeNull();
    });
  });

  describe('peso recomendado por la progresión', () => {
    const [primero, segundo] = rutina.dias[0].ejercicios;

    async function guardarSesionFacil(): Promise<void> {
      for (let numero = 1; numero <= primero.series; numero += 1) {
        await seriesLocal.guardar('usuario-prueba', {
          id: `serie-${numero}`,
          registradaEn: `2026-11-20T18:0${numero}:00.000Z`,
          idEjercicio: primero.id,
          nombreEjercicio: primero.nombre,
          dia: rutina.dias[0].nombre,
          numeroSerie: numero,
          peso: primero.pesoInicialKg,
          unidad: 'kg',
          repeticiones: primero.repeticiones,
          autoevaluacion: 'facil',
          estado: 'completada',
        });
      }
    }

    function pesoMostrado(contenedor: HTMLElement, nombre: string): string {
      const fila = Array.from(contenedor.querySelectorAll('li.sj-fila-ejercicio')).find((li) =>
        li.textContent?.includes(nombre),
      );
      return fila?.querySelector('.sj-peso')?.textContent ?? '';
    }

    it('sin series muestra el peso inicial del catálogo', async () => {
      await saludLocal.guardar('usuario-prueba', salud);
      await rutinaLocal.guardar('usuario-prueba', rutina);
      const { container, findByRole, queryByText } = renderizar();
      await findByRole('heading', { name: rutina.dias[0].nombre });

      expect(pesoMostrado(container, primero.nombre)).toBe(`${primero.pesoInicialKg.toLocaleString('es')} kg`);
      expect(queryByText(/Te sobró fuerza/)).not.toBeInTheDocument();
    });

    it('con series guardadas muestra el peso recomendado y la explicación', async () => {
      await saludLocal.guardar('usuario-prueba', salud);
      await rutinaLocal.guardar('usuario-prueba', rutina);
      await guardarSesionFacil();
      const { container, findByRole, getByText } = renderizar();
      await findByRole('heading', { name: rutina.dias[0].nombre });

      const recomendado = (primero.pesoInicialKg + 2.5).toLocaleString('es');
      expect(pesoMostrado(container, primero.nombre)).toBe(`${recomendado} kg`);
      expect(getByText(`Te sobró fuerza: sube a ${recomendado} kg.`)).toBeInTheDocument();
      // Los ejercicios sin series conservan el valor del catálogo.
      expect(pesoMostrado(container, segundo.nombre)).toBe(
        segundo.pesoInicialKg > 0 ? `${segundo.pesoInicialKg.toLocaleString('es')} kg` : 'Peso corporal',
      );
    });
  });

  describe('ajuste manual del peso (RF-17)', () => {
    const [conPeso, corporal] = rutina.dias[0].ejercicios;
    const pesoInicial = conPeso.pesoInicialKg.toLocaleString('es');

    async function abrirHoy(): Promise<HTMLElement> {
      await saludLocal.guardar('usuario-prueba', salud);
      await rutinaLocal.guardar('usuario-prueba', rutina);
      const { container } = renderizar();
      await screen.findByRole('heading', { name: rutina.dias[0].nombre });
      return container;
    }

    function botonAjustar(nombre: string): HTMLElement {
      return screen.getByRole('button', { name: new RegExp(`^Ajustar peso de ${nombre}`) });
    }

    /** Diálogo del ajuste; se busca por nombre porque Cerrar sesión también tiene un diálogo en el DOM. */
    function dialogoAjuste(): HTMLElement {
      return screen.getByRole('dialog', { name: `Peso de ${conPeso.nombre}` });
    }

    function sinDialogoAjuste(): boolean {
      return screen.queryByRole('dialog', { name: `Peso de ${conPeso.nombre}` }) === null;
    }

    function botonDelDialogo(texto: 'Guardar' | 'Cancelar'): HTMLElement {
      const boton = within(dialogoAjuste()).getByText(texto).closest('ion-button');
      if (!boton) {
        throw new Error(`No se encontró el botón ${texto}.`);
      }
      return boton;
    }

    it('tocar el peso abre el diálogo con el peso actual y el foco en el campo', async () => {
      await abrirHoy();
      fireEvent.click(botonAjustar(conPeso.nombre));

      const dialogo = screen.getByRole('dialog', { name: `Peso de ${conPeso.nombre}` });
      const campo = within(dialogo).getByLabelText('Peso en kg');
      expect(campo).toHaveValue(conPeso.pesoInicialKg);
      expect(campo).toHaveFocus();
    });

    it('Cancelar cierra sin guardar', async () => {
      await abrirHoy();
      fireEvent.click(botonAjustar(conPeso.nombre));
      fireEvent.click(within(dialogoAjuste()).getByRole('button', { name: 'Aumentar peso' }));
      fireEvent.click(botonDelDialogo('Cancelar'));

      expect(sinDialogoAjuste()).toBe(true);
      expect(await ajustesPesoLocal.obtener('usuario-prueba')).toEqual({});
      expect(botonAjustar(conPeso.nombre)).toHaveTextContent(`${pesoInicial} kg`);
      expect(screen.queryByText(/Ajustado por ti/)).not.toBeInTheDocument();
    });

    it('Escape también cierra sin guardar', async () => {
      await abrirHoy();
      fireEvent.click(botonAjustar(conPeso.nombre));
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(sinDialogoAjuste()).toBe(true);
      expect(await ajustesPesoLocal.obtener('usuario-prueba')).toEqual({});
    });

    it('Guardar actualiza el peso mostrado, marca «Ajustado por ti» y lo guarda', async () => {
      await abrirHoy();
      fireEvent.click(botonAjustar(conPeso.nombre));
      const campo = within(dialogoAjuste()).getByLabelText('Peso en kg');
      fireEvent.change(campo, { target: { value: '80' } });
      fireEvent.click(botonDelDialogo('Guardar'));

      await waitFor(() => expect(sinDialogoAjuste()).toBe(true));
      expect(botonAjustar(conPeso.nombre)).toHaveTextContent('80 kg');
      expect(screen.getByText('Ajustado por ti: empieza con 80 kg.')).toBeInTheDocument();
      expect(await ajustesPesoLocal.obtener('usuario-prueba')).toEqual({
        [conPeso.id]: expect.objectContaining({ idEjercicio: conPeso.id, peso: 80, unidad: 'kg' }),
      });
    });

    it('al volver a abrir Hoy conserva el peso ajustado', async () => {
      await ajustesPesoLocal.guardar('usuario-prueba', {
        idEjercicio: conPeso.id,
        peso: 70,
        unidad: 'kg',
        ajustadoEn: new Date().toISOString(),
      });
      await abrirHoy();

      expect(botonAjustar(conPeso.nombre)).toHaveTextContent('70 kg');
      expect(screen.getByText('Ajustado por ti: empieza con 70 kg.')).toBeInTheDocument();
    });

    it('muestra el ajuste convertido si el perfil cambió de unidad', async () => {
      await perfilLocal.guardar('usuario-prueba', { nombre: '', meta: 'fuerza', unidadPeso: 'lb' });
      await ajustesPesoLocal.guardar('usuario-prueba', {
        idEjercicio: conPeso.id,
        peso: 50,
        unidad: 'kg',
        ajustadoEn: new Date().toISOString(),
      });
      await abrirHoy();

      await waitFor(() => expect(botonAjustar(conPeso.nombre)).toHaveTextContent('110 lb'));
    });

    it('si falla el guardado mantiene el diálogo abierto con el error', async () => {
      const guardar = vi.spyOn(ajustesPesoLocal, 'guardar').mockRejectedValueOnce(new Error('sin espacio'));
      await abrirHoy();
      fireEvent.click(botonAjustar(conPeso.nombre));
      fireEvent.click(botonDelDialogo('Guardar'));

      expect(await within(dialogoAjuste()).findByRole('alert')).toHaveTextContent(
        'No se pudo guardar el peso. Inténtalo de nuevo.',
      );
      guardar.mockRestore();
    });

    it('los ejercicios de peso corporal no ofrecen ajuste', async () => {
      await abrirHoy();

      expect(corporal.pesoInicialKg).toBe(0);
      expect(screen.queryByRole('button', { name: new RegExp(`^Ajustar peso de ${corporal.nombre}`) })).toBeNull();
    });
  });
});
