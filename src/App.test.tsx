import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the Ionic app shell and login fields', () => {
    const { container } = render(<App />);
    const inputs = container.querySelectorAll('ion-input');

    expect(container.querySelector('ion-app')).toHaveClass('ion-palette-dark');
    expect(screen.getByRole('heading', { name: /cada repetición te acerca más/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument();
    expect(inputs).toHaveLength(2);
    expect(inputs[0]).toHaveAttribute('type', 'email');
    expect(inputs[0]).toHaveAttribute('autocomplete', 'email');
    expect(inputs[0]).toHaveAttribute('required');
    expect(inputs[1]).toHaveAttribute('type', 'password');
    expect(inputs[1]).toHaveAttribute('autocomplete', 'current-password');
    expect(container.querySelector('ion-button')).toHaveTextContent('Entrar a mi cuenta');
  });
});
