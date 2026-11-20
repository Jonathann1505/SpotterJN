import { cleanup, fireEvent, render } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProveedorPerfil } from '../context/PerfilContext';
import { perfilLocal, rutinaLocal, saludLocal, seriesLocal } from '../repositories/local';
import { asignarRutina, describirSesion } from '../utils/rutina';
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
          <Route path="/sesion">
            <p>pantalla de sesión</p>
          </Route>
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

describe('Hoy', () => {
  beforeEach(async () => {
    await Preferences.clear();
  });
  afterEach(cleanup);

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
    const { findByText } = renderizar();

    expect(await findByText(describirSesion(rutina.dias[0]))).toBeInTheDocument();
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

    expect(await findByText('pantalla de sesión')).toBeInTheDocument();
  });

  it('es una pantalla raíz sin botón atrás', async () => {
    await saludLocal.guardar('usuario-prueba', salud);
    await rutinaLocal.guardar('usuario-prueba', rutina);
    const { container, findByRole } = renderizar();
    await findByRole('heading', { name: rutina.dias[0].nombre });
    expect(container.querySelector('ion-back-button')).toBeNull();
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
});
