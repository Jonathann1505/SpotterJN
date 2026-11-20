import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fichasVistasLocal, rutinaLocal } from '../repositories/local';
import type { RutinaAsignada } from '../types/perfil';
import { asignarRutina } from '../utils/rutina';
import FichaEjercicio from './FichaEjercicio';
import { botonAtras } from '../test/navegacion';

vi.mock('../context/SesionContext', () => ({
  useSesion: () => ({ sesion: { user: { id: 'usuario-prueba' } } }),
}));

function renderizar(ruta: string) {
  return render(
    <IonApp>
      <MemoryRouter initialEntries={['/hoy', ruta]} initialIndex={1}>
        <Route path="/ejercicio/:id" component={FichaEjercicio} />
        <Route path="/hoy">
          <p>pantalla hoy</p>
        </Route>
        <Route path="/sesion">
          <p>pantalla de sesión</p>
        </Route>
      </MemoryRouter>
    </IonApp>,
  );
}

function rutinaManual(equipo: RutinaAsignada['cuestionario']['equipo']): RutinaAsignada {
  const ejercicio = (id: string, nombre: string, pesoInicialKg: number) => ({
    id,
    nombre,
    series: 3,
    repeticiones: 12,
    pesoInicialKg,
  });

  return {
    cuestionario: { experiencia: 'ninguna', diasPorSemana: 2, equipo },
    dias: [
      {
        nombre: 'Día 1 – Cuerpo completo',
        ejercicios: [
          ejercicio('press-banca', 'Press de banca', 20),
          ejercicio('remo-maquina', 'Remo en máquina', 20),
          ejercicio('flexiones', 'Flexiones', 0),
        ],
      },
      {
        nombre: 'Día 2 – Cuerpo completo',
        ejercicios: [ejercicio('press-banca', 'Press de banca', 20), ejercicio('prensa-piernas', 'Prensa de piernas', 40)],
      },
    ],
    asignadaEn: '2026-11-20T10:00:00.000Z',
  };
}

async function guardarRutinaCon(...ids: string[]): Promise<void> {
  await rutinaLocal.guardar('usuario-prueba', {
    cuestionario: { experiencia: 'ninguna', diasPorSemana: 2, equipo: ['barra', 'maquinas'] },
    dias: [
      {
        nombre: 'Día 1 – Cuerpo completo',
        ejercicios: ids.map((id) => ({ id, nombre: id, series: 3, repeticiones: 12, pesoInicialKg: 0 })),
      },
    ],
    asignadaEn: '2026-11-20T10:00:00.000Z',
  });
}

describe('FichaEjercicio', () => {
  beforeEach(async () => {
    await Preferences.clear();
  });
  afterEach(cleanup);

  it('muestra la ficha completa la primera vez', async () => {
    await rutinaLocal.guardar(
      'usuario-prueba',
      asignarRutina({ experiencia: 'ninguna', diasPorSemana: 3, equipo: ['barra', 'maquinas'] }),
    );
    const { findByRole, getByText, getByTitle, container } = renderizar('/ejercicio/press-banca');

    expect(await findByRole('heading', { name: 'Press de banca' })).toBeInTheDocument();
    expect(getByText(/Primera vez con este ejercicio/)).toBeInTheDocument();
    expect(getByText('1. Cómo preparar el equipo')).toBeInTheDocument();
    expect(getByText('2. Cómo hacer el movimiento')).toBeInTheDocument();
    expect(getByText(/Zona de peso libre/)).toBeInTheDocument();
    expect(getByTitle(/Animación del ejercicio/)).toBeInTheDocument();
    expect(container.querySelector('.sj-eyebrow')).toHaveTextContent(/^Pecho/);
    expect(container.querySelector('ion-button.sj-boton')).toHaveTextContent('Listo, empezar series');
  });

  it('marca la ficha como vista al continuar y lleva a la sesión', async () => {
    await guardarRutinaCon('press-banca');
    const { container, findByRole, findByText } = renderizar('/ejercicio/press-banca');
    await findByRole('heading', { name: 'Press de banca' });

    fireEvent.click(container.querySelector('ion-button.sj-boton') as Element);

    expect(await findByText('pantalla de sesión')).toBeInTheDocument();
    await waitFor(async () => {
      expect(await fichasVistasLocal.obtener('usuario-prueba')).toEqual(['press-banca']);
    });
  });

  it('no repite el aviso de primera vez cuando ya se vio y permite volver', async () => {
    await fichasVistasLocal.marcarVista('usuario-prueba', 'press-banca');
    const { container, findByRole, queryByText, findByText } = renderizar('/ejercicio/press-banca');

    await findByRole('heading', { name: 'Press de banca' });
    expect(queryByText(/Primera vez con/)).not.toBeInTheDocument();
    expect(container.querySelector('ion-button.sj-boton')).toHaveTextContent('Entendido');

    fireEvent.click(container.querySelector('ion-button.sj-boton') as Element);
    expect(await findByText('pantalla hoy')).toBeInTheDocument();
  });

  it('muestra la guía y un aviso si el ejercicio todavía no tiene animación', async () => {
    const { findByRole, queryByTitle, getByText } = renderizar('/ejercicio/remo-maquina');

    expect(await findByRole('heading', { name: 'Remo en máquina' })).toBeInTheDocument();
    expect(queryByTitle(/Animación del ejercicio/)).not.toBeInTheDocument();
    expect(getByText('Animación próximamente')).toBeInTheDocument();
    expect(getByText(/Ajusta el asiento para que las asas/)).toBeInTheDocument();
  });

  it('muestra el video de un ejercicio con animación en MP4', async () => {
    const { findByRole, container, queryByText } = renderizar('/ejercicio/flexiones');

    expect(await findByRole('heading', { name: 'Flexiones' })).toBeInTheDocument();
    expect(container.querySelector('video')?.getAttribute('src')).toBe('/ejercicios/flexiones.mp4');
    expect(queryByText('Animación próximamente')).not.toBeInTheDocument();
  });

  it('habla de «máquina» solo en ejercicios de máquina o polea', async () => {
    await guardarRutinaCon('remo-maquina');
    const { findByRole, getByText } = renderizar('/ejercicio/remo-maquina');

    await findByRole('heading', { name: 'Remo en máquina' });
    expect(getByText(/Primera vez con esta máquina/)).toBeInTheDocument();
    expect(getByText('1. Cómo ajustar la máquina')).toBeInTheDocument();
  });

  it('usa «prepararte» y «este ejercicio» en los ejercicios de peso corporal', async () => {
    await guardarRutinaCon('zancadas');
    const { findByRole, getByText, queryByText } = renderizar('/ejercicio/zancadas');

    await findByRole('heading', { name: 'Zancadas' });
    expect(getByText(/Primera vez con este ejercicio/)).toBeInTheDocument();
    expect(getByText('1. Cómo prepararte')).toBeInTheDocument();
    expect(queryByText(/máquina/i, { selector: 'h2' })).not.toBeInTheDocument();
  });

  it('si el ejercicio no está en la rutina solo se consulta: sin aviso de primera vez ni inicio de series', async () => {
    await guardarRutinaCon('press-banca');
    const { container, findByRole, queryByText } = renderizar('/ejercicio/zancadas');

    await findByRole('heading', { name: 'Zancadas' });

    expect(queryByText(/Primera vez con/)).not.toBeInTheDocument();
    expect(container.querySelector('ion-button.sj-boton')).toHaveTextContent('Entendido');
    expect(queryByText('Listo, empezar series')).not.toBeInTheDocument();
  });

  it('muestra los errores comunes y la respiración del ejercicio', async () => {
    await guardarRutinaCon('press-banca');
    const { findByRole, getByText } = renderizar('/ejercicio/press-banca');

    await findByRole('heading', { name: 'Press de banca' });

    expect(getByText('3. Errores comunes')).toBeInTheDocument();
    expect(getByText(/Arquear mucho la espalda/)).toBeInTheDocument();
    expect(getByText('4. Respiración')).toBeInTheDocument();
    expect(getByText(/Inhala al bajar la barra/)).toBeInTheDocument();
  });

  it('redirige a Hoy si el ejercicio no existe', async () => {
    const { findByText } = renderizar('/ejercicio/no-existe');
    expect(await findByText('pantalla hoy')).toBeInTheDocument();
  });

  it('usa el encabezado con atrás hacia Hoy', async () => {
    await rutinaLocal.guardar(
      'usuario-prueba',
      asignarRutina({ experiencia: 'ninguna', diasPorSemana: 3, equipo: ['barra', 'maquinas'] }),
    );
    const { container, findByRole, queryByText } = renderizar('/ejercicio/press-banca');
    await findByRole('heading', { name: 'Press de banca' });
    expect(botonAtras(container)).toHaveAttribute('default-href', '/hoy');
    expect(queryByText('Volver')).not.toBeInTheDocument();
  });

  describe('cambiar el ejercicio (RF-14)', () => {
    it('reemplaza el ejercicio en la rutina guardada con la alternativa elegida', async () => {
      await rutinaLocal.guardar('usuario-prueba', rutinaManual(['barra', 'maquinas']));
      const { findByRole, findByText, getByRole } = renderizar('/ejercicio/press-banca');

      await findByRole('heading', { name: 'Press de banca' });
      fireEvent.click(getByRole('button', { name: 'No puedo hacer este ejercicio' }));
      fireEvent.click(await findByText('Press de pecho en máquina'));

      expect(await findByRole('heading', { name: 'Press de pecho en máquina' })).toBeInTheDocument();
      expect(await findByText(/Cambiamos «Press de banca» por este ejercicio/)).toBeInTheDocument();
      const guardada = await rutinaLocal.obtener('usuario-prueba');
      const ids = guardada?.dias.flatMap((dia) => dia.ejercicios.map((e) => e.id));
      expect(ids).toContain('press-pecho-maquina');
      expect(ids).not.toContain('press-banca');
    });

    it('ofrece «No tengo esta máquina» solo si el ejercicio usa equipo', async () => {
      await rutinaLocal.guardar('usuario-prueba', rutinaManual(['barra', 'maquinas']));
      const maquina = renderizar('/ejercicio/prensa-piernas');
      await maquina.findByRole('heading', { name: 'Prensa de piernas' });
      expect(maquina.getByRole('button', { name: 'No tengo esta máquina' })).toBeInTheDocument();
      cleanup();

      const corporal = renderizar('/ejercicio/flexiones');
      await corporal.findByRole('heading', { name: 'Flexiones' });
      expect(corporal.getByRole('button', { name: 'No puedo hacer este ejercicio' })).toBeInTheDocument();
      expect(corporal.queryByRole('button', { name: /No tengo/ })).not.toBeInTheDocument();
    });

    it('con «No tengo esta máquina» no propone otra máquina', async () => {
      await rutinaLocal.guardar('usuario-prueba', rutinaManual(['barra', 'maquinas', 'mancuernas']));
      const { findByRole, getByRole, queryByText } = renderizar('/ejercicio/prensa-piernas');

      await findByRole('heading', { name: 'Prensa de piernas' });
      fireEvent.click(getByRole('button', { name: 'No tengo esta máquina' }));

      expect(await findByRole('group', { name: 'Alternativas sugeridas' })).toBeInTheDocument();
      expect(queryByText('Curl femoral en máquina')).not.toBeInTheDocument();
    });

    it('avisa cuando no hay otra opción con el equipo declarado', async () => {
      await rutinaLocal.guardar('usuario-prueba', rutinaManual([]));
      const { findByRole, findByText, getByRole } = renderizar('/ejercicio/flexiones');

      await findByRole('heading', { name: 'Flexiones' });
      fireEvent.click(getByRole('button', { name: 'No puedo hacer este ejercicio' }));

      expect(await findByText(/No encontramos otra opción con tu equipo/)).toBeInTheDocument();
    });

    it('no ofrece el cambio si el ejercicio no está en la rutina de la persona', async () => {
      await rutinaLocal.guardar('usuario-prueba', rutinaManual(['barra', 'maquinas']));
      const { findByRole, queryByText } = renderizar('/ejercicio/zancadas');

      await findByRole('heading', { name: 'Zancadas' });

      expect(queryByText('¿No puedes hacerlo?')).not.toBeInTheDocument();
    });
  });
});
