import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Registro from './Registro';
import { registrar } from '../services/auth';

vi.mock('../services/auth', () => ({
  registrar: vi.fn(),
}));

const estadoConsentimientos = {
  mayorEdad: true as const,
  terminosAceptados: true as const,
  datosSaludAutorizados: false,
};

function renderRegistro() {
  return render(
    <IonApp>
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/registro',
            state: { consentimientos: estadoConsentimientos },
          },
        ]}
      >
        <Registro />
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

function RutaActual() {
  const location = useLocation();
  return <span data-testid="ruta-actual">{location.pathname}</span>;
}

describe('Registro', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('habilita crear cuenta solo con correo y contraseña válidos', () => {
    const { container } = renderRegistro();
    const boton = container.querySelector('ion-button[type="submit"]');
    const [correo, contrasena] = container.querySelectorAll('ion-input');

    expect(boton).toHaveAttribute('disabled');
    escribirEnCampo(correo, 'persona@dominio.com');
    escribirEnCampo(contrasena, 'valida123');
    expect(boton).toHaveAttribute('disabled', 'false');
  });

  it('muestra un mensaje claro cuando el correo ya está registrado', async () => {
    vi.mocked(registrar).mockResolvedValue({
      ok: false,
      mensaje: 'Ya existe una cuenta con este correo electrónico.',
    });
    const { container } = renderRegistro();
    const [correo, contrasena] = container.querySelectorAll('ion-input');
    escribirEnCampo(correo, 'persona@dominio.com');
    escribirEnCampo(contrasena, 'valida123');

    const formulario = container.querySelector('form');
    if (!formulario) {
      throw new Error('No se encontró el formulario de registro.');
    }
    fireEvent.submit(formulario);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ya existe una cuenta con este correo electrónico.',
    );
  });

  it('redirige a Consentimientos si se abre sin su estado de navegación', async () => {
    render(
      <IonApp>
        <MemoryRouter initialEntries={['/registro']}>
          <Registro />
          <RutaActual />
        </MemoryRouter>
      </IonApp>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('ruta-actual')).toHaveTextContent('/consentimientos');
    });
  });
});
