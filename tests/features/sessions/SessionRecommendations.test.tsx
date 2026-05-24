import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { SessionRecommendationsPage } from '@/features/sessions/SessionRecommendations';
import { recommendationFixtures, sessionFixtures, candidateFixtures, apiErrors } from '@/mocks/fixtures';
import type { RecommendationItem, SessionCandidate } from '@/types/api';

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

describe('SessionRecommendationsPage', () => {
  beforeEach(() => server.resetHandlers());

  function renderPage(sessionId: string) {
    return render(
      <MemoryRouter initialEntries={[`/sessions/${sessionId}/recommendations`]}>
        <Routes>
          <Route path="/sessions/:id/recommendations" element={<SessionRecommendationsPage />} />
        </Routes>
      </MemoryRouter>,
      { wrapper: createWrapper() },
    );
  }

  it('renders session recommendations with restaurant names', async () => {
    const session = sessionFixtures.find((s) => s.id === 'session-friday')!;
    const sessionCandidates = candidateFixtures.filter((c) => c.sessionId === 'session-friday');
    server.use(
      http.get(`${BASE}/sessions/:id`, () => HttpResponse.json(session)),
      http.get(`${BASE}/sessions/:id/candidates`, () => HttpResponse.json(sessionCandidates)),
      http.get(`${BASE}/sessions/:id/recommendations`, () => HttpResponse.json(cursorPage(recommendationFixtures))),
    );
    renderPage('session-friday');
    await waitFor(() => {
      expect(screen.getByText('Recommandations pour Friday Dinner')).toBeInTheDocument();
    });
    expect(screen.getByText('Au Vieux Lille Gastronomique')).toBeInTheDocument();
    expect(screen.getByText('Le Petit Bistrot Lillois')).toBeInTheDocument();
  });

  it('shows empty state when no candidates exist', async () => {
    const session = sessionFixtures.find((s) => s.id === 'session-impromptu')!;
    const noCandidates: SessionCandidate[] = [];
    server.use(
      http.get(`${BASE}/sessions/:id`, () => HttpResponse.json(session)),
      http.get(`${BASE}/sessions/:id/candidates`, () => HttpResponse.json(noCandidates)),
      http.get(`${BASE}/sessions/:id/recommendations`, () => HttpResponse.json(cursorPage<RecommendationItem>([]))),
    );
    renderPage('session-impromptu');
    await waitFor(() => {
      expect(screen.getByText('Ajoutez des candidats pour obtenir des recommandations.')).toBeInTheDocument();
    });
  });

  it('shows completed message when session is done', async () => {
    const session = sessionFixtures.find((s) => s.id === 'session-monday')!;
    const sessionCandidates = candidateFixtures.filter((c) => c.sessionId === 'session-monday');
    server.use(
      http.get(`${BASE}/sessions/:id`, () => HttpResponse.json(session)),
      http.get(`${BASE}/sessions/:id/candidates`, () => HttpResponse.json(sessionCandidates)),
      http.get(`${BASE}/sessions/:id/recommendations`, () => HttpResponse.json(cursorPage(recommendationFixtures))),
    );
    renderPage('session-monday');
    await waitFor(() => {
      expect(screen.getByText(/Cette session est terminee/)).toBeInTheDocument();
    });
  });

  it('shows advisor text about choice being up to user', async () => {
    const session = sessionFixtures.find((s) => s.id === 'session-friday')!;
    const sessionCandidates = candidateFixtures.filter((c) => c.sessionId === 'session-friday');
    server.use(
      http.get(`${BASE}/sessions/:id`, () => HttpResponse.json(session)),
      http.get(`${BASE}/sessions/:id/candidates`, () => HttpResponse.json(sessionCandidates)),
      http.get(`${BASE}/sessions/:id/recommendations`, () => HttpResponse.json(cursorPage(recommendationFixtures))),
    );
    renderPage('session-friday');
    await waitFor(() => {
      expect(screen.getByText(/Le choix final vous appartient/)).toBeInTheDocument();
    });
  });

  it('has link back to session detail', async () => {
    const session = sessionFixtures.find((s) => s.id === 'session-friday')!;
    const sessionCandidates = candidateFixtures.filter((c) => c.sessionId === 'session-friday');
    server.use(
      http.get(`${BASE}/sessions/:id`, () => HttpResponse.json(session)),
      http.get(`${BASE}/sessions/:id/candidates`, () => HttpResponse.json(sessionCandidates)),
      http.get(`${BASE}/sessions/:id/recommendations`, () => HttpResponse.json(cursorPage(recommendationFixtures))),
    );
    renderPage('session-friday');
    await waitFor(() => {
      const link = screen.getByText('Retour a la session');
      expect(link.getAttribute('href')).toBe(`/sessions/session-friday`);
    });
  });

  it('shows loading state', () => {
    server.use(
      http.get(`${BASE}/sessions/:id`, async () => new Promise(() => {})),
      http.get(`${BASE}/sessions/:id/candidates`, async () => new Promise(() => {})),
      http.get(`${BASE}/sessions/:id/recommendations`, async () => new Promise(() => {})),
    );
    renderPage('session-loading');
    expect(screen.getByRole('status')).toHaveTextContent('Chargement de la session');
  });

  it('shows error state', async () => {
    server.use(
      http.get(`${BASE}/sessions/:id`, () => HttpResponse.json(apiErrors.notFound('Session'), { status: 404 })),
      http.get(`${BASE}/sessions/:id/candidates`, () => HttpResponse.json([])),
      http.get(`${BASE}/sessions/:id/recommendations`, () => HttpResponse.json(apiErrors.notFound('Recommendations'), { status: 404 })),
    );
    renderPage('nonexistent');
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
