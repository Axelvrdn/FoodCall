import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { paginate, restaurantFixtures, reviewFixtures } from '@/mocks/fixtures';
import { ReviewsPage } from './ReviewsPage';

const BASE = 'http://localhost:3000/api';

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

describe('ReviewsPage', () => {
  it('renders the page title "Avis de la communauté"', () => {
    render(<ReviewsPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Avis de la communauté')).toBeInTheDocument();
  });

  it('does not render the stale P2 placeholder or a fake global review feed', () => {
    render(<ReviewsPage />, { wrapper: createWrapper() });

    expect(screen.queryByText(/placeholder p2/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Bento Volcan')).not.toBeInTheDocument();
    expect(screen.getAllByText(/flux global/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/endpoint backend global/i)).toBeInTheDocument();
  });

  it('loads restaurant-scoped reviews after selecting a restaurant', async () => {
    const user = userEvent.setup();
    const restaurant = restaurantFixtures[2];
    const reviews = reviewFixtures.filter((review) => review.restaurantId === restaurant.id);

    server.use(
      http.get(`${BASE}/restaurants/search`, ({ request }) => {
        const q = new URL(request.url).searchParams.get('q');
        const data = q === 'marcel' ? [restaurant] : [];
        return HttpResponse.json(paginate(data));
      }),
      http.get(`${BASE}/restaurants/:id`, () => HttpResponse.json(restaurant)),
      http.get(`${BASE}/restaurants/:id/reviews`, () => HttpResponse.json(paginate(reviews))),
    );

    render(<ReviewsPage />, { wrapper: createWrapper() });

    await user.type(screen.getByLabelText('Rechercher un restaurant'), 'marcel');
    await user.click(await screen.findByRole('button', { name: 'Consulter les avis de Chez Marcel Sandwich' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Chez Marcel Sandwich' })).toBeInTheDocument());
    expect(
      screen.getAllByText((_, element) => element?.textContent?.includes('Note backend : 1.3 sur 5') ?? false).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText('Déçu, la qualité a baissé.')).toBeInTheDocument();
  });
});
