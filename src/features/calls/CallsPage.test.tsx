import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { CallsPage } from './CallsPage';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

describe('CallsPage', () => {
  it('renders the page title "Mes calls"', () => {
    render(<CallsPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Mes calls')).toBeInTheDocument();
  });

  it('renders the subtitle about reputation and recommendations', () => {
    render(<CallsPage />, { wrapper: createWrapper() });
    expect(screen.getByText(/recommandations/i)).toBeInTheDocument();
  });

  it('renders the placeholder message about backend endpoint', () => {
    render(<CallsPage />, { wrapper: createWrapper() });
    expect(screen.getByText(/backend fournira/i)).toBeInTheDocument();
  });

  it('does not render a fake score value', () => {
    render(<CallsPage />, { wrapper: createWrapper() });
    expect(screen.queryByText('84')).not.toBeInTheDocument();
    expect(screen.getByText(/score non calculé/i)).toBeInTheDocument();
  });

  it('renders honest calls guidance and useful CTAs', () => {
    render(<CallsPage />, { wrapper: createWrapper() });
    expect(screen.getByText(/aucun endpoint utilisateur ne liste encore tes calls/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /voir mes groupes/i })).toHaveAttribute('href', '/groupes');
    expect(screen.getByRole('link', { name: /découvrir des restaurants/i })).toHaveAttribute('href', '/decouvrir');
  });
});
