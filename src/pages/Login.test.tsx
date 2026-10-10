import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Login from './Login';
import { iniciarSesion } from '../services/auth';

vi.mock('../services/auth', () => ({
  iniciarSesion: vi.fn(),
}));

function renderLogin() {
  return render(
    <IonApp>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </IonApp>,
  );
}

function escribirEnCampo(campo: Element, valor: string): void {
  fireEvent(
    campo,
    new CustomEvent('ionInput', { bubbles: true, detail: { value: valor } }),
  );
}

describe('Login', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('mantiene el botón deshabilitado hasta que los campos son válidos', () => {
    const { container } = renderLogin();
    const boton = container.querySelector('ion-button[type="submit"]');
    const [correo, contrasena] = container.querySelectorAll('ion-input');

    expect(boton).toHaveAttribute('disabled');
    escribirEnCampo(correo, 'persona@dominio.com');
    escribirEnCampo(contrasena, 'clave');
    expect(boton).toHaveAttribute('disabled', 'false');
  });

  it('muestra el error cuando las credenciales no coinciden', async () => {
    vi.mocked(iniciarSesion).mockResolvedValue({
      ok: false,
      mensaje: 'El correo electrónico o la contraseña no son correctos.',
    });
    const { container } = renderLogin();
    const [correo, contrasena] = container.querySelectorAll('ion-input');
    escribirEnCampo(correo, 'persona@dominio.com');
    escribirEnCampo(contrasena, 'clave');

    const formulario = container.querySelector('form');
    if (!formulario) {
      throw new Error('No se encontró el formulario de acceso.');
    }
    fireEvent.submit(formulario);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El correo electrónico o la contraseña no son correctos.',
    );
  });
});
