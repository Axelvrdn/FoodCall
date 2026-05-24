import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { GroupRecommendationsPage } from '@/features/groups/GroupRecommendations';
import { recommendationFixtures, groupFixtures, apiErrors } from '@/mocks/fixtures';
import type { RecommendationItem } from '@/types/api';

const BASE = 'http://localhost:3000/api';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: qc }, children);
  };
}

function cursorPage<T>(items: T[], nextCursor: string | null = null) {
  return { data: items, meta: { nextCursor } };
}

describe('GroupRecommendationsPage', () => {
  beforeEach(() => server.resetHandlers());

  function renderPage(groupId: string) {
    return render(
      <MemoryRouter initialEntries={[`/groupes/${groupId}/recommendations`]}>
        <Routes>
          <Route path="/groupes/:id/recommendations" element={<GroupRecommendationsPage />} />
        </Routes>
      </MemoryRouter>,
      { wrapper: createWrapper() },
    );
  }

  it('renders group recommendations with restaurant names', async () => {
    const group = groupFixtures[0];
    server.use(
      http.get(`${BASE}/groups/:id`, () => HttpResponse.json(group)),
      http.get(`${BASE}/groups/:id/recommendations`, () => HttpResponse.json(cursorPage(recommendationFixtures))),
    );
    renderPage('group-lille');
    await waitFor(() => {
      expect(screen.getByText('Recommandations pour Lille Lunch Crew')).toBeInTheDocument();
    });
    expect(screen.getByText('Au Vieux Lille Gastronomique')).toBeInTheDocument();
  });

  it('shows location setup message when no default start location', async () => {
    const group = groupFixtures[2]; // group-lyon: no location
    server.use(
      http.get(`${BASE}/groups/:id`, () => HttpResponse.json(group)),
      http.get(`${BASE}/groups/:id/recommendations`, () => HttpResponse.json(cursorPage<RecommendationItem>([]))),
    );
    renderPage('group-lyon');
    await waitFor(() => {
      expect(screen.getByText(/Definissez un lieu de depart par defaut/)).toBeInTheDocument();
    });
  });

  it('has link back to group detail', async () => {
    const group = groupFixtures[0];
    server.use(
      http.get(`${BASE}/groups/:id`, () => HttpResponse.json(group)),
      http.get(`${BASE}/groups/:id/recommendations`, () => HttpResponse.json(cursorPage(recommendationFixtures))),
    );
    renderPage('group-lille');
    await waitFor(() => {
      const link = screen.getByText('Retour au groupe');
      expect(link.getAttribute('href')).toBe('/groupes/group-lille');
    });
  });

  it('shows advisory text', async () => {
    const group = groupFixtures[0];
    server.use(
      http.get(`${BASE}/groups/:id`, () => HttpResponse.json(group)),
      http.get(`${BASE}/groups/:id/recommendations`, () => HttpResponse.json(cursorPage(recommendationFixtures))),
    );
    renderPage('group-lille');
    await waitFor(() => {
      expect(screen.getByText(/voici les restaurants a proximite/)).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    server.use(
      http.get(`${BASE}/groups/:id`, async () => new Promise(() => {})),
      http.get(`${BASE}/groups/:id/recommendations`, async () => new Promise(() => {})),
    );
    renderPage('group-loading');
    expect(screen.getByRole('status')).toHaveTextContent('Chargement du groupe');
  });

  it('shows error state', async () => {
    server.use(
      http.get(`${BASE}/groups/:id`, () => HttpResponse.json(apiErrors.notFound('Group'), { status: 404 })),
      http.get(`${BASE}/groups/:id/recommendations`, () => HttpResponse.json(apiErrors.notFound('Recommendations'), { status: 404 })),
    );
    renderPage('nonexistent');
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
