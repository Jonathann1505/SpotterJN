import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { Preferences } from '@capacitor/preferences';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProveedorPerfil, usePerfil } from '../context/PerfilContext';
import { perfilLocal, rutinaLocal, saludLocal, seriesLocal } from '../repositories/local';
import BorrarDatos from './BorrarDatos';

const mocks = vi.hoisted(() => ({
  desactivarRecordatorios: vi.fn(),
  mostrarToast: vi.fn(),
}));

vi.mock('../services/recordatorios', () => ({ desactivarRecordatorios: mocks.desactivarRecordatorios }));

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
    useIonToast: () => [mocks.mostrarToast],
  };
});

function NombreDelPerfil() {
  const { perfil } = usePerfil();
  return <p>nombre: {perfil.nombre || 'vacío'}</p>;
}

function renderizar() {
  return render(
    <IonApp>
      <ProveedorPerfil>
        <NombreDelPerfil />
        <MemoryRouter initialEntries={['/perfil']}>
          <Route exact path="/perfil">
            <BorrarDatos />
          </Route>
          <Route exact path="/aviso-medico">
            <h1>Aviso médico</h1>
          </Route>
        </MemoryRouter>
      </ProveedorPerfil>
    </IonApp>,
  );
}

async function guardarDatos(): Promise<void> {
  await perfilLocal.guardar('usuario-prueba', { nombre: 'Nayeli', meta: 'fuerza', unidadPeso: 'kg' });
  await saludLocal.guardar('usuario-prueba', { condiciones: [], respondidoEn: '2026-11-01T10:00:00.000Z' });
  await rutinaLocal.guardar('usuario-prueba', {
    cuestionario: { experiencia: 'ninguna', diasPorSemana: 2, equipo: ['maquinas'] },
    dias: [],
    asignadaEn: '2026-11-01T10:00:00.000Z',
  });
  await seriesLocal.guardar('usuario-prueba', {
    id: 'serie-1',
    registradaEn: '2026-11-02T10:00:00.000Z',
    idEjercicio: 'press-banca',
    nombreEjercicio: 'Press de banca',
    dia: 'Día 1',
    numeroSerie: 1,
    peso: 20,
    unidad: 'kg',
    repeticiones: 12,
    autoevaluacion: 'normal',
    estado: 'completada',
  });
}

describe('BorrarDatos', () => {
  beforeEach(async () => {
    await Preferences.clear();
    mocks.desactivarRecordatorios.mockResolvedValue({ ok: true });
    mocks.mostrarToast.mockResolvedValue(undefined);
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('pide confirmación y no borra nada al cancelar', async () => {
    await guardarDatos();
    renderizar();

    fireEvent.click(screen.getByText('Borrar mis datos de este dispositivo'));
    expect(screen.getByRole('alertdialog', { name: 'Borrar mis datos' })).toHaveTextContent(/Tu cuenta no se elimina/);
    fireEvent.click(screen.getByText('Cancelar'));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(await perfilLocal.obtener('usuario-prueba')).not.toBeNull();
    expect(await seriesLocal.listar('usuario-prueba')).toHaveLength(1);
  });

  it('al confirmar borra los datos, cancela los recordatorios y vuelve al aviso médico', async () => {
    await guardarDatos();
    renderizar();
    await screen.findByText('nombre: Nayeli');

    fireEvent.click(screen.getByText('Borrar mis datos de este dispositivo'));
    fireEvent.click(screen.getByText('Borrar'));

    expect(await screen.findByRole('heading', { name: 'Aviso médico' })).toBeInTheDocument();
    expect(await perfilLocal.obtener('usuario-prueba')).toBeNull();
    expect(await saludLocal.obtener('usuario-prueba')).toBeNull();
    expect(await rutinaLocal.obtener('usuario-prueba')).toBeNull();
    expect(await seriesLocal.listar('usuario-prueba')).toEqual([]);
    expect(mocks.desactivarRecordatorios).toHaveBeenCalledTimes(1);
    expect(mocks.mostrarToast).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/Se borraron tus datos/) }));
  });

  it('reinicia el perfil que se muestra en pantalla', async () => {
    await guardarDatos();
    renderizar();
    // El perfil en memoria sigue visible hasta que se confirma el borrado.
    await screen.findByText('nombre: Nayeli');

    fireEvent.click(screen.getByText('Borrar mis datos de este dispositivo'));
    fireEvent.click(screen.getByText('Borrar'));

    expect(await screen.findByText('nombre: vacío')).toBeInTheDocument();
  });
});
