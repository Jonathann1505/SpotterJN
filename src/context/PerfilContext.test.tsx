import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { PerfilRepositorio } from '../repositories/repositorios';
import type { PerfilUsuario } from '../types/perfil';
import { PERFIL_INICIAL, ProveedorPerfil, usePerfil } from './PerfilContext';

function repositorioEnMemoria(inicial: PerfilUsuario | null): PerfilRepositorio & { guardado: PerfilUsuario | null } {
  const repo = {
    guardado: inicial,
    obtener: async () => repo.guardado,
    guardar: async (perfil: PerfilUsuario) => {
      repo.guardado = perfil;
    },
  };
  return repo;
}

let capturado: ReturnType<typeof usePerfil> | null = null;

function Sonda() {
  capturado = usePerfil();
  return <p>{capturado.perfil.unidadPeso}</p>;
}

describe('ProveedorPerfil', () => {
  afterEach(() => {
    cleanup();
    capturado = null;
  });

  it('usa el perfil inicial si no hay datos guardados', async () => {
    render(
      <ProveedorPerfil repositorio={repositorioEnMemoria(null)}>
        <Sonda />
      </ProveedorPerfil>,
    );

    await waitFor(() => expect(capturado?.cargando).toBe(false));
    expect(capturado?.perfil).toEqual(PERFIL_INICIAL);
  });

  it('carga el perfil guardado', async () => {
    const guardado: PerfilUsuario = { nombre: 'Nayeli', meta: 'tonificar', unidadPeso: 'lb' };
    const { findByText } = render(
      <ProveedorPerfil repositorio={repositorioEnMemoria(guardado)}>
        <Sonda />
      </ProveedorPerfil>,
    );

    expect(await findByText('lb')).toBeInTheDocument();
  });

  it('guarda y actualiza el perfil al instante', async () => {
    const repo = repositorioEnMemoria(null);
    const { findByText } = render(
      <ProveedorPerfil repositorio={repo}>
        <Sonda />
      </ProveedorPerfil>,
    );
    await waitFor(() => expect(capturado?.cargando).toBe(false));

    await act(async () => {
      await capturado?.guardarPerfil({ nombre: 'Nayeli', meta: 'fuerza', unidadPeso: 'lb' });
    });

    expect(await findByText('lb')).toBeInTheDocument();
    expect(repo.guardado?.unidadPeso).toBe('lb');
  });
});
