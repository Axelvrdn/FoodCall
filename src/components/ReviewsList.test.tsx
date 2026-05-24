import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/mocks/server';
import { paginate, reviewFixtures } from '@/mocks/fixtures';
import { ReviewsList } from './ReviewsList';

const BASE = 'http://localhost:3000/api';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

describe('ReviewsList', () => {
  it('uses the default MSW restaurant review route as a restaurant-scoped list', async () => {
    render(<ReviewsList restaurantId="rest-marcel" currentUserId="user-alice" />, {
      wrapper: createWrapper(),
    });

    expect(await screen.findByText(/sur 3 avis affichés/i)).toBeInTheDocument();
    expect(screen.getByText('Déçu, la qualité a baissé.')).toBeInTheDocument();
    expect(screen.queryByText('Exceptionnel, comme toujours.')).not.toBeInTheDocument();
  });

  it('labels loaded-page averages as displayed reviews instead of restaurant aggregate truth', async () => {
    const reviews = reviewFixtures.filter((review) => review.restaurantId === 'rest-marcel').slice(0, 2);
    server.use(
      http.get(`${BASE}/restaurants/:id/reviews`, () => HttpResponse.json(paginate(reviews))),
    );

    render(<ReviewsList restaurantId="rest-marcel" currentUserId="user-alice" />, {
      wrapper: createWrapper(),
    });

    expect(await screen.findByText(/avis affichés/i)).toBeInTheDocument();
    expect(screen.queryByText(/^1\.5 \/ 5 sur 2 avis$/)).not.toBeInTheDocument();
  });
});
