import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProveedorPerfil } from '../context/PerfilContext';
import { perfilLocal, rutinaLocal, seriesLocal } from '../repositories/local';
import { asignarRutina } from '../utils/rutina';
import Perfil from './Perfil';
import { botonAtras } from '../test/navegacion';

vi.mock('../services/auth', () => ({ cerrarSesion: vi.fn() }));

vi.mock('../context/SesionContext', () => ({
  useSesion: () => ({ sesion: { user: { id: 'usuario-prueba' } } }),
}));

function escribirNombre(contenedor: HTMLElement, valor: string): void {
  const campo = contenedor.querySelector('ion-input') as Element;
  fireEvent(campo, new CustomEvent('ionInput', { bubbles: true, detail: { value: valor } }));
}

function renderizar() {
  return render(
    <IonApp>
      <ProveedorPerfil>
        <MemoryRouter initialEntries={['/perfil']}>
          <Route path="/perfil" component={Perfil} />
          <Route path="/rutina">
            <p>pantalla rutina</p>
          </Route>
          <Route path="/editar-salud">
            <p>pantalla salud</p>
          </Route>
          <Route path="/progreso">
            <p>pantalla progreso</p>
          </Route>
          <Route path="/ejercicios">
            <p>pantalla biblioteca</p>
          </Route>
        </MemoryRouter>
      </ProveedorPerfil>
    </IonApp>,
  );
}

describe('Perfil', () => {
  beforeEach(async () => {
    await Preferences.clear();
  });
  afterEach(cleanup);

  it('no guarda un nombre vacío y muestra el error', async () => {
    const { container, findByRole } = renderizar();

    fireEvent.click(container.querySelector('ion-button.sj-boton') as Element);

    expect(await findByRole('alert')).toHaveTextContent(/nombre es obligatorio/i);
    expect(await perfilLocal.obtener('usuario-prueba')).toBeNull();
  });

  it('no guarda un nombre de más de 40 caracteres', async () => {
    const { container, findByRole } = renderizar();

    escribirNombre(container, 'a'.repeat(41));
    fireEvent.click(container.querySelector('ion-button.sj-boton') as Element);

    expect(await findByRole('alert')).toBeInTheDocument();
    expect(await perfilLocal.obtener('usuario-prueba')).toBeNull();
  });

  it('guarda nombre y meta', async () => {
    const { container, getByRole, findByRole } = renderizar();

    escribirNombre(container, '  Nayeli  ');
    fireEvent.click(getByRole('radio', { name: 'Tonificar' }));
    fireEvent.click(container.querySelector('ion-button.sj-boton') as Element);

    expect(await findByRole('status')).toHaveTextContent('Perfil actualizado.');
    expect(await perfilLocal.obtener('usuario-prueba')).toEqual({
      nombre: 'Nayeli',
      meta: 'tonificar',
      unidadPeso: 'kg',
    });
  });

  it('cambia la unidad de peso de inmediato', async () => {
    const { getByRole } = renderizar();

    await act(async () => {
      fireEvent.click(getByRole('radio', { name: 'lb' }));
    });

    await waitFor(async () => {
      expect((await perfilLocal.obtener('usuario-prueba'))?.unidadPeso).toBe('lb');
    });
  });

  it('abre la rutina asignada desde el botón «Mi rutina»', async () => {
    const { findByText } = renderizar();

    fireEvent.click(await findByText('Mi rutina'));

    expect(await findByText('pantalla rutina')).toBeInTheDocument();
  });

  it('usa el encabezado con atrás hacia Hoy en lugar del botón Volver', async () => {
    const { container, queryByText } = renderizar();
    expect(botonAtras(container)).toHaveAttribute('default-href', '/hoy');
    expect(queryByText('Volver')).not.toBeInTheDocument();
  });

  it('resume la rutina actual con días, experiencia y equipo', async () => {
    await rutinaLocal.guardar(
      'usuario-prueba',
      asignarRutina({ experiencia: 'mas-6-meses', diasPorSemana: 4, equipo: ['barra', 'poleas'] }),
    );
    const { findByText } = renderizar();

    expect(await findByText(/4 días por semana · Experiencia: más de 6 meses/)).toBeInTheDocument();
    expect(await findByText('Equipo: barra y discos, poleas')).toBeInTheDocument();
  });

  it('no muestra el resumen si todavía no hay rutina', async () => {
    const { queryByText } = renderizar();

    await waitFor(() => expect(queryByText('Tu rutina actual')).not.toBeInTheDocument());
  });

  it('abre la biblioteca de ejercicios', async () => {
    const { findByText } = renderizar();

    fireEvent.click(await findByText('Biblioteca de ejercicios'));

    expect(await findByText('pantalla biblioteca')).toBeInTheDocument();
  });

  it('abre el historial de progreso', async () => {
    const { findByText } = renderizar();

    fireEvent.click(await findByText('Mi progreso'));

    expect(await findByText('pantalla progreso')).toBeInTheDocument();
  });

  it('ofrece borrar los datos de este dispositivo', async () => {
    const { findByText } = renderizar();

    expect(await findByText('Borrar mis datos de este dispositivo')).toBeInTheDocument();
  });

  it('abre las respuestas de salud para editarlas', async () => {
    const { findByText } = renderizar();

    fireEvent.click(await findByText('Mis respuestas de salud'));

    expect(await findByText('pantalla salud')).toBeInTheDocument();
  });

  describe('cabecera y secciones', () => {
    it('muestra el avatar con las iniciales, la meta y las cifras de la cuenta', async () => {
      await perfilLocal.guardar('usuario-prueba', { nombre: 'Jonathan Escobar', meta: 'tonificar', unidadPeso: 'lb' });
      await rutinaLocal.guardar(
        'usuario-prueba',
        asignarRutina({ experiencia: 'ninguna', diasPorSemana: 4, equipo: ['maquinas'] }),
      );
      for (const [indice, fecha] of ['2026-11-20T18:00:00', '2026-11-22T18:00:00'].entries()) {
        await seriesLocal.guardar('usuario-prueba', {
          id: `serie-${indice}`,
          registradaEn: fecha,
          idEjercicio: 'prensa-piernas',
          nombreEjercicio: 'Prensa de piernas',
          dia: 'Día 1 – Piernas',
          numeroSerie: 1,
          peso: 40,
          unidad: 'kg',
          repeticiones: 12,
          autoevaluacion: 'normal',
          estado: 'completada',
        });
      }
      const { findByText, getByRole } = renderizar();

      expect(await findByText('Jonathan Escobar')).toBeInTheDocument();
      expect(await findByText('JE')).toBeInTheDocument();
      const resumen = getByRole('region', { name: 'Resumen de tu cuenta' });
      expect(resumen).toHaveTextContent('Tonificar');
      await waitFor(() => expect(resumen).toHaveTextContent('Días por semana4'));
      expect(resumen).toHaveTextContent('Sesiones2');
      expect(resumen).toHaveTextContent('Unidadlb');
      expect(await findByText('2 sesiones registradas')).toBeInTheDocument();
    });

    it('con nombre guardado el bloque de edición empieza cerrado y se abre al tocarlo', async () => {
      await perfilLocal.guardar('usuario-prueba', { nombre: 'Nayeli', meta: 'fuerza', unidadPeso: 'kg' });
      const { findByText, getByRole, queryByRole } = renderizar();
      await findByText('Nayeli');

      const editar = getByRole('button', { name: /Editar perfil/ });
      await waitFor(() => expect(editar).toHaveAttribute('aria-expanded', 'false'));
      expect(queryByRole('radiogroup', { name: 'Meta principal' })).not.toBeInTheDocument();

      fireEvent.click(editar);

      expect(editar).toHaveAttribute('aria-expanded', 'true');
      expect(getByRole('radiogroup', { name: 'Meta principal' })).toBeInTheDocument();
    });

    it('sin nombre invita a completar el perfil con el bloque de edición abierto', async () => {
      const { findByText, getByRole } = renderizar();

      expect(await findByText('Completa tu perfil')).toBeInTheDocument();
      expect(getByRole('button', { name: /Editar perfil/ })).toHaveAttribute('aria-expanded', 'true');
    });

    it('agrupa los accesos en secciones', async () => {
      const { findByRole, getByRole } = renderizar();

      const entrenamiento = await findByRole('list', { name: 'Tu entrenamiento' });
      expect(entrenamiento).toHaveTextContent('Mi rutina');
      expect(entrenamiento).toHaveTextContent('Mi progreso');
      expect(entrenamiento).toHaveTextContent('Biblioteca de ejercicios');
      const preferencias = getByRole('list', { name: 'Preferencias' });
      expect(preferencias).toHaveTextContent('Unidad de peso');
      expect(preferencias).toHaveTextContent('Recordatorios');
      expect(preferencias).toHaveTextContent('Mis respuestas de salud');
      expect(getByRole('list', { name: 'Ayuda' })).toHaveTextContent('Glosario');
    });
  });
});
