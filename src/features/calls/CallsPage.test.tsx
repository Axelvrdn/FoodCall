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

  it('renders the score ring with value 84', () => {
    render(<CallsPage />, { wrapper: createWrapper() });
    expect(screen.getByText('84')).toBeInTheDocument();
  });

  it('renders the badge card for "Call fiable"', () => {
    render(<CallsPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Call fiable')).toBeInTheDocument();
  });
});
