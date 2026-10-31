import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RecuperarContrasena from './RecuperarContrasena';
import { solicitarRecuperacion } from '../services/auth';

vi.mock('../services/auth', () => ({
  solicitarRecuperacion: vi.fn(),
}));

function renderRecuperarContrasena() {
  return render(
    <IonApp>
      <MemoryRouter>
        <RecuperarContrasena />
      </MemoryRouter>
    </IonApp>,
  );
}

function escribirCorreo(campo: Element, valor: string): void {
  fireEvent(
    campo,
    new CustomEvent('ionInput', { bubbles: true, detail: { value: valor } }),
  );
}

describe('RecuperarContrasena', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('mantiene el botón deshabilitado hasta que el correo sea válido', () => {
    const { container } = renderRecuperarContrasena();
    const boton = container.querySelector('ion-button.sj-acceso-submit[type="submit"]');
    const correo = container.querySelector('ion-input.sj-campo');

    expect(correo).not.toBeNull();
    expect(boton).toHaveAttribute('disabled');
    if (correo) {
      escribirCorreo(correo, 'persona@dominio.com');
    }
    expect(boton).toHaveAttribute('disabled', 'false');
  });

  it('permite volver al inicio de sesión desde el diseño de acceso', () => {
    renderRecuperarContrasena();

    expect(screen.getByRole('link', { name: 'Volver a iniciar sesión' })).toHaveAttribute(
      'href',
      '/login',
    );
  });

  it('muestra una confirmación genérica sin revelar si el correo existe', async () => {
    vi.mocked(solicitarRecuperacion).mockResolvedValue({ ok: true });
    const { container } = renderRecuperarContrasena();
    const correo = container.querySelector('ion-input');
    if (!correo) {
      throw new Error('No se encontró el campo de correo.');
    }
    escribirCorreo(correo, 'persona@dominio.com');

    const formulario = container.querySelector('form');
    if (!formulario) {
      throw new Error('No se encontró el formulario de recuperación.');
    }
    fireEvent.submit(formulario);

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Si el correo existe, te enviamos un enlace',
    );
  });
});
