import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactMemoryRouter } from '@ionic/react-router';
import { createMemoryHistory } from 'history';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { botonAtras, pulsarAtras } from '../test/navegacion';
import { EncabezadoSJ, MarcoAccesoSJ, PantallaSJ } from './PantallaSJ';

function renderEnRouter(contenido: JSX.Element) {
  return render(
    <IonApp>
      <MemoryRouter>{contenido}</MemoryRouter>
    </IonApp>,
  );
}

describe('EncabezadoSJ', () => {
  afterEach(cleanup);

  it('muestra el botón atrás nativo con la ruta por defecto, texto de iOS y etiqueta accesible', async () => {
    const { container } = renderEnRouter(<EncabezadoSJ defaultHref="/perfil" />);
    const boton = botonAtras(container);

    expect(container.querySelector('ion-header.sj-encabezado')).toHaveClass('ion-no-border');
    expect(boton.closest('ion-buttons')).toHaveAttribute('slot', 'start');
    expect(boton).toHaveAttribute('default-href', '/perfil');
    expect(boton).toHaveAttribute('text', 'Atrás');
    await waitFor(() => {
      expect(boton.shadowRoot?.querySelector('button')).toHaveAttribute('aria-label', 'Volver');
    });
  });

  it('muestra el título solo cuando se indica', () => {
    const { container, rerender } = renderEnRouter(<EncabezadoSJ defaultHref="/hoy" />);
    expect(container.querySelector('ion-title')).toBeNull();

    rerender(
      <IonApp>
        <MemoryRouter>
          <EncabezadoSJ defaultHref="/hoy" titulo="Glosario" />
        </MemoryRouter>
      </IonApp>,
    );
    expect(container.querySelector('ion-title')).toHaveTextContent('Glosario');
  });

  it('navega a la ruta por defecto cuando no hay historial previo', async () => {
    const historial = createMemoryHistory({ initialEntries: ['/glosario'] });
    const { container } = render(
      <IonApp>
        <IonReactMemoryRouter history={historial}>
          <IonRouterOutlet>
            <Route exact path="/glosario">
              <PantallaSJ atras="/perfil" titulo="Glosario">{null}</PantallaSJ>
            </Route>
            <Route exact path="/perfil">
              <PantallaSJ titulo="Perfil">{null}</PantallaSJ>
            </Route>
          </IonRouterOutlet>
        </IonReactMemoryRouter>
      </IonApp>,
    );
    await screen.findByRole('heading', { name: 'Glosario' });

    pulsarAtras(container);

    expect(await screen.findByRole('heading', { name: 'Perfil' })).toBeInTheDocument();
    expect(historial.location.pathname).toBe('/perfil');
  });
});

describe('PantallaSJ y MarcoAccesoSJ', () => {
  afterEach(cleanup);

  it('las pantallas raíz no tienen encabezado ni botón atrás', () => {
    const { container } = renderEnRouter(<PantallaSJ titulo="Hoy">{null}</PantallaSJ>);

    expect(container.querySelector('ion-header')).toBeNull();
    expect(container.querySelector('ion-back-button')).toBeNull();
    expect(container.querySelector('.sj-layout')).not.toHaveClass('sj-con-encabezado');
  });

  it('las pantallas secundarias muestran el encabezado y evitan duplicar el área segura', () => {
    const { container } = renderEnRouter(
      <PantallaSJ atras="/hoy" titulo="Perfil">
        {null}
      </PantallaSJ>,
    );

    expect(botonAtras(container)).toHaveAttribute('default-href', '/hoy');
    expect(container.querySelector('.sj-layout')).toHaveClass('sj-con-encabezado');
  });

  it('el marco de acceso solo muestra atrás cuando se indica', () => {
    const { container, rerender } = renderEnRouter(<MarcoAccesoSJ activa="login">{null}</MarcoAccesoSJ>);
    expect(container.querySelector('ion-back-button')).toBeNull();

    rerender(
      <IonApp>
        <MemoryRouter>
          <MarcoAccesoSJ activa="login" atras="/login">
            {null}
          </MarcoAccesoSJ>
        </MemoryRouter>
      </IonApp>,
    );
    expect(botonAtras(container)).toHaveAttribute('default-href', '/login');
    expect(container.querySelector('.sj-acceso-layout')).toHaveClass('sj-con-encabezado');
  });
});
