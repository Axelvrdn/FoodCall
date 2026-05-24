import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { ReviewsList } from '@/components/ReviewsList';
import { reviewFixtures, apiErrors, paginate, emptyPage } from '@/mocks/fixtures';
import type { RestaurantReview } from '@/types/api';

const BASE = 'http://localhost:3000/api';

function createWrapper(qc?: QueryClient) {
  const client = qc ?? new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client }, children);
  };
}

describe('ReviewsList', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('renders loading state while fetching', () => {
    server.use(
      http.get(`${BASE}/restaurants/:id/reviews`, async () => new Promise(() => {})),
    );
    render(
      <ReviewsList restaurantId="rest-marcel" currentUserId="user-alice" />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByRole('status')).toHaveTextContent('Chargement des avis');
  });

  it('renders aggregate rating when reviews exist', async () => {
    const reviews = reviewFixtures.filter((r) => r.restaurantId === 'rest-marcel');
    server.use(
      http.get(`${BASE}/restaurants/:id/reviews`, () =>
        HttpResponse.json(paginate(reviews))),
    );
    render(
      <ReviewsList restaurantId="rest-marcel" currentUserId="user-alice" />,
      { wrapper: createWrapper() },
    );
    await waitFor(() => {
      expect(screen.getByText(/1\.3 \/ 5/)).toBeInTheDocument();
    });
    expect(screen.getByText(/sur 3 avis/)).toBeInTheDocument();
  });

  it('renders "no reviews" when empty', async () => {
    server.use(
      http.get(`${BASE}/restaurants/:id/reviews`, () =>
        HttpResponse.json(emptyPage<RestaurantReview>())),
    );
    render(
      <ReviewsList restaurantId="rest-marcel" currentUserId="user-alice" />,
      { wrapper: createWrapper() },
    );
    await waitFor(() => {
      expect(screen.getByText('Soyez le premier a donner votre avis')).toBeInTheDocument();
    });
  });

  it('renders review text and rating', async () => {
    const reviews = reviewFixtures.filter((r) => r.restaurantId === 'rest-marcel');
    server.use(
      http.get(`${BASE}/restaurants/:id/reviews`, () =>
        HttpResponse.json(paginate(reviews))),
    );
    render(
      <ReviewsList restaurantId="rest-marcel" currentUserId="user-alice" />,
      { wrapper: createWrapper() },
    );
    await waitFor(() => {
      expect(screen.getByText('Déçu, la qualité a baissé.')).toBeInTheDocument();
    });
    expect(screen.getByText('2/5')).toBeInTheDocument();
  });

  it('shows edit and delete buttons only for review author', async () => {
    const reviews = reviewFixtures.filter((r) => r.restaurantId === 'rest-marcel');
    server.use(
      http.get(`${BASE}/restaurants/:id/reviews`, () =>
        HttpResponse.json(paginate(reviews))),
    );
    render(
      <ReviewsList restaurantId="rest-marcel" currentUserId="user-alice" />,
      { wrapper: createWrapper() },
    );
    await waitFor(() => {
      expect(screen.getByText('Déçu, la qualité a baissé.')).toBeInTheDocument();
    });

    // user-alice wrote rev-01, so should see edit/delete on that one
    const editButtons = screen.getAllByRole('button', { name: 'Modifier' });
    const deleteButtons = screen.getAllByRole('button', { name: 'Supprimer' });
    // Only one review belongs to user-alice (rev-01)
    expect(editButtons.length).toBe(1);
    expect(deleteButtons.length).toBe(1);
  });

  it('hides edit/delete for non-author', async () => {
    const reviews = reviewFixtures.filter((r) => r.restaurantId === 'rest-marcel');
    server.use(
      http.get(`${BASE}/restaurants/:id/reviews`, () =>
        HttpResponse.json(paginate(reviews))),
    );
    render(
      <ReviewsList restaurantId="rest-marcel" currentUserId="user-random" />,
      { wrapper: createWrapper() },
    );
    await waitFor(() => {
      expect(screen.getByText('Déçu, la qualité a baissé.')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'Modifier' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Supprimer' })).not.toBeInTheDocument();
  });

  it('delete button triggers mutation', async () => {
    const reviews = reviewFixtures.filter((r) => r.restaurantId === 'rest-marcel');
    let deleteCalled = false;
    server.use(
      http.get(`${BASE}/restaurants/:id/reviews`, () =>
        HttpResponse.json(paginate(reviews))),
      http.delete(`${BASE}/reviews/:id`, () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    render(
      <ReviewsList restaurantId="rest-marcel" currentUserId="user-alice" />,
      { wrapper: createWrapper() },
    );
    await waitFor(() => {
      expect(screen.getByText('Déçu, la qualité a baissé.')).toBeInTheDocument();
    });

    const deleteBtn = screen.getAllByRole('button', { name: 'Supprimer' })[0];
    await userEvent.click(deleteBtn);
    await waitFor(() => {
      expect(deleteCalled).toBe(true);
    });
  });

  it('shows load-more button when nextCursor exists', async () => {
    const manyReviews = Array.from({ length: 5 }, (_, i) => ({
      ...reviewFixtures[0],
      id: `rev-extra-${i}`,
      comment: `Review ${i}`,
    }));
    server.use(
      http.get(`${BASE}/restaurants/:id/reviews`, ({ request }) => {
        const url = new URL(request.url);
        const cursor = url.searchParams.get('cursor') ?? undefined;
        return HttpResponse.json(paginate(manyReviews, cursor, 3));
      }),
    );
    render(
      <ReviewsList restaurantId="rest-marcel" currentUserId="user-alice" />,
      { wrapper: createWrapper() },
    );
    await waitFor(() => {
      expect(screen.getByText("Charger plus d'avis")).toBeInTheDocument();
    });
  });

  it('shows error state with retry button', async () => {
    server.use(
      http.get(`${BASE}/restaurants/:id/reviews`, () =>
        HttpResponse.json(apiErrors.forbidden(), { status: 403 })),
    );
    render(
      <ReviewsList restaurantId="rest-marcel" currentUserId="user-alice" />,
      { wrapper: createWrapper() },
    );
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Reessayer' })).toBeInTheDocument();
  });
});
