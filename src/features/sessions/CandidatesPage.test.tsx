import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { CandidatesPage } from './CandidatesPage';
import { useAuthStore } from '@/stores/auth-store';
import { server } from '@/mocks/server';
import { apiErrors, externalRestaurantFixtures, importResponseFixture, restaurantFixtures } from '@/mocks/fixtures';

const BASE = 'http://localhost:3000/api';

function createWrapper(sessionId: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/sessions/${sessionId}/candidates`]}>
        <Routes>
          <Route path="/sessions/:id/candidates" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function setUser(id: string, name: string) {
  useAuthStore.setState({
    user: { id, displayName: name, email: `${name}@foodcall.test`, avatarUrl: null, reputationScore: 42, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
    accessToken: 'mock-access',
    refreshToken: 'mock-refresh',
  });
}

beforeEach(() => {
  server.resetHandlers();
  useAuthStore.getState().logout();
});

describe('CandidatesPage', () => {
  it('renders loading state', () => {
    server.use(
      http.get(`${BASE}/sessions/:id`, async () => new Promise(() => {})),
    );
    setUser('user-chloe', 'Chloe');
    render(<CandidatesPage />, { wrapper: createWrapper('session-weekend') });
    expect(screen.getByRole('status')).toBeDefined();
  });

  it('renders empty state for session with no candidates', async () => {
    setUser('user-david', 'David');
    render(<CandidatesPage />, { wrapper: createWrapper('session-impromptu') });
    await waitFor(() => {
      expect(screen.getByText(/Aucun candidat pour le moment/)).toBeDefined();
    });
  });

  it('renders candidate list with restaurant details', async () => {
    setUser('user-chloe', 'Chloe');
    render(<CandidatesPage />, { wrapper: createWrapper('session-weekend') });
    await waitFor(() => {
      expect(screen.getByText('Sakura Sushi Paris')).toBeDefined();
      expect(screen.getByText('Trattoria Roma')).toBeDefined();
      expect(screen.getByText('Le Burger Atelier')).toBeDefined();
    });
  });

  it('shows add form when session is draft', async () => {
    setUser('user-david', 'David');
    render(<CandidatesPage />, { wrapper: createWrapper('session-impromptu') });
    await waitFor(() => {
      expect(screen.getByText('Ajouter un candidat')).toBeDefined();
    });
  });

  it('adds a candidate from restaurant search instead of a raw restaurant id', async () => {
    const user = userEvent.setup();
    let capturedSearch: string | null = null;
    let capturedRestaurantId: string | null = null;

    server.use(
      http.get(`${BASE}/restaurants/search`, ({ request }) => {
        const url = new URL(request.url);
        capturedSearch = url.searchParams.get('q');
        return HttpResponse.json({ data: [restaurantFixtures[0]], meta: { nextCursor: null } });
      }),
      http.post(`${BASE}/sessions/:id/candidates`, async ({ request }) => {
        const body = await request.json() as { restaurantId: string };
        capturedRestaurantId = body.restaurantId;
        return HttpResponse.json({
          id: 'cand-new',
          sessionId: 'session-impromptu',
          restaurantId: body.restaurantId,
          addedBy: 'user-david',
          createdAt: '2026-05-20T12:00:00.000Z',
          restaurant: restaurantFixtures[0],
        }, { status: 201 });
      }),
    );

    setUser('user-david', 'David');
    render(<CandidatesPage />, { wrapper: createWrapper('session-impromptu') });

    await user.type(await screen.findByLabelText('Rechercher un restaurant'), 'kebab');
    await screen.findByRole('button', { name: 'Choisir Lille Kebab Express' });
    await user.click(screen.getByRole('button', { name: 'Choisir Lille Kebab Express' }));
    await user.click(screen.getByRole('button', { name: 'Ajouter Lille Kebab Express' }));

    await waitFor(() => {
      expect(capturedSearch).toBe('kebab');
      expect(capturedRestaurantId).toBe('rest-kebab');
    });
    expect(screen.queryByLabelText('ID du restaurant')).toBeNull();
  });

  it('keeps a default MSW-added restaurant candidate visible after the mutation succeeds', async () => {
    const user = userEvent.setup();

    setUser('user-david', 'David');
    render(<CandidatesPage />, { wrapper: createWrapper('session-impromptu') });

    await user.type(await screen.findByLabelText('Rechercher un restaurant'), 'kebab');
    await user.click(await screen.findByRole('button', { name: 'Choisir Lille Kebab Express' }));
    await user.click(screen.getByRole('button', { name: 'Ajouter Lille Kebab Express' }));

    await waitFor(() => {
      expect(screen.queryByText(/Aucun candidat pour le moment/)).toBeNull();
      expect(screen.getByText('Lille Kebab Express')).toBeDefined();
    });
  });

  it('imports an external restaurant through the backend with session context', async () => {
    const user = userEvent.setup();
    let capturedImport: { provider?: string; providerPlaceId?: string; sessionId?: string } | null = null;

    server.use(
      http.get(`${BASE}/external-restaurants/search`, () =>
        HttpResponse.json({ data: [externalRestaurantFixtures[0]], meta: { nextCursor: null } }),
      ),
      http.post(`${BASE}/external-restaurants/import`, async ({ request }) => {
        capturedImport = await request.json() as { provider: string; providerPlaceId: string; sessionId?: string };
        return HttpResponse.json(importResponseFixture, { status: 201 });
      }),
    );

    setUser('user-david', 'David');
    render(<CandidatesPage />, { wrapper: createWrapper('session-impromptu') });

    await user.type(await screen.findByLabelText('Rechercher un restaurant externe'), 'panthéon');
    await screen.findByRole('button', { name: 'Importer Le Comptoir du Panthéon' });
    await user.click(screen.getByRole('button', { name: 'Importer Le Comptoir du Panthéon' }));

    await waitFor(() => {
      expect(capturedImport).toEqual({ provider: 'google', providerPlaceId: 'g-place-1', sessionId: 'session-impromptu' });
    });
  });

  it('keeps a backend-imported restaurant candidate visible after the import succeeds', async () => {
    const user = userEvent.setup();

    setUser('user-david', 'David');
    render(<CandidatesPage />, { wrapper: createWrapper('session-impromptu') });

    await user.type(await screen.findByLabelText('Rechercher un restaurant externe'), 'panthéon');
    await user.click(await screen.findByRole('button', { name: 'Importer Le Comptoir du Panthéon' }));

    await waitFor(() => {
      expect(screen.queryByText(/Aucun candidat pour le moment/)).toBeNull();
      expect(screen.getByText('Lille Kebab Express')).toBeDefined();
    });
  });

  it('shows remove button for creator in editable state', async () => {
    setUser('user-chloe', 'Chloe');
    render(<CandidatesPage />, { wrapper: createWrapper('session-weekend') });
    await waitFor(() => {
      expect(screen.getByText('Sakura Sushi Paris')).toBeDefined();
    });
    expect(screen.getAllByText('Retirer').length).toBeGreaterThan(0);
  });

  it('does not show remove button for non-creator', async () => {
    setUser('user-thomas', 'Thomas');
    render(<CandidatesPage />, { wrapper: createWrapper('session-weekend') });
    await waitFor(() => {
      expect(screen.getByText('Sakura Sushi Paris')).toBeDefined();
    });
    expect(screen.queryByText('Retirer')).toBeNull();
  });

  it('renders error state', async () => {
    server.use(
      http.get(`${BASE}/sessions/:id`, () =>
        HttpResponse.json(apiErrors.notFound('Session'), { status: 404 }),
      ),
    );
    setUser('user-thomas', 'Thomas');
    render(<CandidatesPage />, { wrapper: createWrapper('unknown-session') });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
    });
  });

  it('shows vote count when session is voting', async () => {
    setUser('user-ben', 'Ben');
    render(<CandidatesPage />, { wrapper: createWrapper('session-friday') });
    await waitFor(() => {
      expect(screen.getAllByText(/vote/).length).toBeGreaterThan(0);
    });
  });
});
