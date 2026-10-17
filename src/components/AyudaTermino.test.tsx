import { cleanup, fireEvent, render } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AyudaTermino } from './AyudaTermino';

function renderizar(termino: string, texto?: string) {
  return render(
    <IonApp>
      <p>
        Haz tus <AyudaTermino termino={termino}>{texto}</AyudaTermino>
      </p>
    </IonApp>,
  );
}

describe('AyudaTermino', () => {
  afterEach(cleanup);

  it('muestra la definición al tocar el ícono de ayuda', () => {
    const { getByRole, queryByRole } = renderizar('serie', 'series');

    expect(queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(getByRole('button', { name: '¿Qué es serie?' }));

    const dialogo = getByRole('dialog');
    expect(dialogo).toHaveTextContent('Serie');
    expect(dialogo).toHaveTextContent(/grupo de repeticiones/i);
  });

  it('se cierra con el botón Entendido, con Escape y tocando el fondo', () => {
    const { getByRole, queryByRole } = renderizar('fallo', 'fallo');
    const abrir = () => fireEvent.click(getByRole('button', { name: '¿Qué es fallo?' }));

    abrir();
    fireEvent.click(getByRole('dialog').querySelector('ion-button') as Element);
    expect(queryByRole('dialog')).not.toBeInTheDocument();

    abrir();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(queryByRole('dialog')).not.toBeInTheDocument();

    abrir();
    fireEvent.click(document.querySelector('.sj-dialogo-fondo') as Element);
    expect(queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('no se cierra al tocar dentro del cuadro de la definición', () => {
    const { getByRole } = renderizar('rir', 'RIR');

    fireEvent.click(getByRole('button', { name: '¿Qué es rir?' }));
    fireEvent.click(getByRole('dialog'));

    expect(getByRole('dialog')).toBeInTheDocument();
  });

  it('muestra solo el texto si el término no existe', () => {
    const { queryByRole, getByText } = renderizar('no-existe', 'algo');

    expect(getByText(/algo/)).toBeInTheDocument();
    expect(queryByRole('button')).not.toBeInTheDocument();
  });
});
