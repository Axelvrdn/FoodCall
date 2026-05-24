import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/stores/auth-store';
import { SessionDetailPage } from './SessionDetailPage';
import {
  sessionFixtures,
  groupFixtures,
  userFixtures,
  candidateFixtures,
  voteResultFixtures,
  voteFixtures,
  apiErrors,
} from '@/mocks/fixtures';
import { sessionStatusLabel, sessionStatusTone, canTransitionSession } from './session-queries';
import type { VoteSession } from '@/types/api';

const BASE = 'http://localhost:3000/api';

function createWrapper(initialEntries: string[] = ['/sessions/session-monday']) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: qc },
      createElement(MemoryRouter, { initialEntries },
        createElement(Routes, null,
          createElement(Route, { path: '/sessions/:id', element: children }),
        ),
      ),
    );
  };
}

function setCurrentUser(user: typeof userFixtures[number]) {
  useAuthStore.getState().setUser(user);
}

function setupSuccessHandlers(_session: VoteSession) {
  void _session;
  server.use(
    http.get(`${BASE}/sessions/:id`, ({ params }) => {
      const s = sessionFixtures.find((sf) => sf.id === params['id']);
      return s ? HttpResponse.json(s) : HttpResponse.json(apiErrors.notFound('Session'), { status: 404 });
    }),
    http.get(`${BASE}/groups/:id`, ({ params }) => {
      const g = groupFixtures.find((gf) => gf.id === params['id']);
      return g ? HttpResponse.json(g) : HttpResponse.json(apiErrors.notFound('Group'), { status: 404 });
    }),
  );
}

describe('sessionStatusLabel', () => {
  it('returns French label for each status', () => {
    expect(sessionStatusLabel('draft')).toBe('Brouillon');
    expect(sessionStatusLabel('active')).toBe('Active');
    expect(sessionStatusLabel('voting')).toBe('En cours de vote');
    expect(sessionStatusLabel('completed')).toBe('Terminée');
    expect(sessionStatusLabel('cancelled')).toBe('Annulée');
  });
});

describe('sessionStatusTone', () => {
  it('returns distinct tone classes for each status', () => {
    const tones = new Set([
      sessionStatusTone('draft'),
      sessionStatusTone('active'),
      sessionStatusTone('voting'),
      sessionStatusTone('completed'),
      sessionStatusTone('cancelled'),
    ]);
    expect(tones.size).toBe(5);
  });
});

describe('canTransitionSession', () => {
  it('allows draft to transition to active and cancelled', () => {
    const transitions = canTransitionSession('draft');
    expect(transitions).toContain('active');
    expect(transitions).toContain('voting');
    expect(transitions).toContain('cancelled');
    expect(transitions).not.toContain('completed');
  });

  it('allows active to transition to voting and cancelled', () => {
    const transitions = canTransitionSession('active');
    expect(transitions).toContain('voting');
    expect(transitions).toContain('cancelled');
    expect(transitions).not.toContain('active');
  });

  it('allows voting to transition to completed and cancelled', () => {
    const transitions = canTransitionSession('voting');
    expect(transitions).toContain('completed');
    expect(transitions).toContain('cancelled');
    expect(transitions).not.toContain('active');
  });

  it('returns empty array for completed', () => {
    expect(canTransitionSession('completed')).toEqual([]);
  });

  it('returns empty array for cancelled', () => {
    expect(canTransitionSession('cancelled')).toEqual([]);
  });
});

describe('SessionDetailPage', () => {
  beforeEach(() => {
    server.resetHandlers();
    useAuthStore.getState().logout();
  });

  it('shows loading state with role="status"', () => {
    server.use(
      http.get(`${BASE}/sessions/:id`, async () => new Promise(() => {})),
    );
    setCurrentUser(userFixtures[0]);
    render(createElement(SessionDetailPage), { wrapper: createWrapper() });
    expect(screen.getByRole('status')).toHaveTextContent('Chargement');
  });

  it('shows 404 state when session is not found', async () => {
    server.use(
      http.get(`${BASE}/sessions/:id`, () =>
        HttpResponse.json(apiErrors.notFound('Session'), { status: 404 }),
      ),
    );
    setCurrentUser(userFixtures[0]);
    render(createElement(SessionDetailPage), { wrapper: createWrapper(['/sessions/unknown']) });
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent("n'existe pas");
  });

  it('shows generic error state on API failure', async () => {
    server.use(
      http.get(`${BASE}/sessions/:id`, () =>
        HttpResponse.json(apiErrors.forbidden(), { status: 403 }),
      ),
    );
    setCurrentUser(userFixtures[0]);
    render(createElement(SessionDetailPage), { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent('Impossible de charger');
  });

  it('renders session name, status badge, and description on success', async () => {
    const session = sessionFixtures[0];
    setupSuccessHandlers(session);
    setCurrentUser(userFixtures[0]);
    render(createElement(SessionDetailPage), { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(session.name));
    expect(screen.getByText('Terminée')).toBeInTheDocument();
    expect(screen.getByText(session.description!)).toBeInTheDocument();
  });

  it('displays all detail fields for a completed session', async () => {
    const session = sessionFixtures[0];
    setupSuccessHandlers(session);
    setCurrentUser(userFixtures[0]);
    render(createElement(SessionDetailPage), { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());

    await waitFor(() => expect(screen.getByText('Lille Lunch Crew')).toBeInTheDocument());
    expect(screen.getByText('Approbation')).toBeInTheDocument();
    expect(screen.getByText('Place du Général de Gaulle, Lille')).toBeInTheDocument();
    expect(screen.getByText('2 km')).toBeInTheDocument();
    expect(screen.getByText(/18,00/)).toBeInTheDocument();
    expect(screen.getByText('rest-marcel')).toBeInTheDocument();
  });

  it('shows "not set" messages for null defaults', async () => {
    const session = sessionFixtures[3];
    setupSuccessHandlers(session);
    setCurrentUser(userFixtures[0]);
    render(createElement(SessionDetailPage), { wrapper: createWrapper(['/sessions/session-impromptu']) });

    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());

    await waitFor(() => expect(screen.getByText('Aucune adresse de départ définie.')).toBeInTheDocument());
    expect(screen.getByText('Aucun rayon de recherche défini.')).toBeInTheDocument();
    expect(screen.getByText('Aucun budget maximum défini.')).toBeInTheDocument();
  });

  it('shows creator action buttons for draft session', async () => {
    const session = sessionFixtures[3];
    setupSuccessHandlers(session);
    setCurrentUser(userFixtures[3]);
    render(createElement(SessionDetailPage), { wrapper: createWrapper(['/sessions/session-impromptu']) });

    await waitFor(() => expect(screen.getByText('Actions créateur')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Activer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument();
  });

  it('shows creator action buttons for voting session', async () => {
    const session = sessionFixtures[1];
    setupSuccessHandlers(session);
    setCurrentUser(userFixtures[1]);
    render(createElement(SessionDetailPage), { wrapper: createWrapper(['/sessions/session-friday']) });

    await waitFor(() => expect(screen.getByText('Actions créateur')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Terminer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument();
  });

  it('shows creator action buttons for active session', async () => {
    const session = sessionFixtures[2];
    setupSuccessHandlers(session);
    setCurrentUser(userFixtures[2]);
    render(createElement(SessionDetailPage), { wrapper: createWrapper(['/sessions/session-weekend']) });

    await waitFor(() => expect(screen.getByText('Actions créateur')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Lancer le vote' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument();
  });

  it('does not show creator actions for non-creator user', async () => {
    const session = sessionFixtures[3];
    setupSuccessHandlers(session);
    setCurrentUser(userFixtures[0]);
    render(createElement(SessionDetailPage), { wrapper: createWrapper(['/sessions/session-impromptu']) });

    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
    expect(screen.queryByText('Actions créateur')).not.toBeInTheDocument();
  });

  it('does not show transition buttons for completed session', async () => {
    const session = sessionFixtures[0];
    setupSuccessHandlers(session);
    setCurrentUser(userFixtures[0]);
    render(createElement(SessionDetailPage), { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
    expect(screen.queryByText('Actions créateur')).not.toBeInTheDocument();
  });

  it('does not show transition buttons for cancelled session', async () => {
    const session = sessionFixtures[6];
    setupSuccessHandlers(session);
    setCurrentUser(userFixtures[1]);
    render(createElement(SessionDetailPage), { wrapper: createWrapper(['/sessions/session-cancelled']) });

    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
    expect(screen.queryByText('Actions créateur')).not.toBeInTheDocument();
  });

  it('shows draft status badge', async () => {
    const session = sessionFixtures[3];
    setupSuccessHandlers(session);
    setCurrentUser(userFixtures[0]);
    render(createElement(SessionDetailPage), { wrapper: createWrapper(['/sessions/session-impromptu']) });

    await waitFor(() => expect(screen.getByText('Brouillon')).toBeInTheDocument());
  });

  it('shows cancelled status badge', async () => {
    const session = sessionFixtures[6];
    setupSuccessHandlers(session);
    setCurrentUser(userFixtures[0]);
    render(createElement(SessionDetailPage), { wrapper: createWrapper(['/sessions/session-cancelled']) });

    await waitFor(() => expect(screen.getByText('Annulée')).toBeInTheDocument());
  });

  it('shows active status badge', async () => {
    const session = sessionFixtures[2];
    setupSuccessHandlers(session);
    setCurrentUser(userFixtures[0]);
    render(createElement(SessionDetailPage), { wrapper: createWrapper(['/sessions/session-weekend']) });

    await waitFor(() => expect(screen.getByText('Active')).toBeInTheDocument());
  });

  it('lets a voter remove their own vote inline during voting', async () => {
    const user = userEvent.setup();
    const session = sessionFixtures.find((s) => s.id === 'session-friday')!;
    let deletedVoteId: string | null = null;

    setupSuccessHandlers(session);
    server.use(
      http.get(`${BASE}/sessions/:id/candidates`, () =>
        HttpResponse.json(candidateFixtures.filter((candidate) => candidate.sessionId === 'session-friday')),
      ),
      http.get(`${BASE}/sessions/:id/votes`, () =>
        HttpResponse.json({ data: voteFixtures.filter((vote) => vote.sessionId === 'session-friday'), meta: { nextCursor: null } }),
      ),
      http.delete(`${BASE}/sessions/:id/votes/:voteId`, ({ params }) => {
        deletedVoteId = String(params['voteId']);
        return new HttpResponse(null, { status: 204 });
      }),
    );

    setCurrentUser(userFixtures[1]);
    render(createElement(SessionDetailPage), { wrapper: createWrapper(['/sessions/session-friday']) });

    await screen.findByRole('button', { name: 'Retirer mon vote pour Lille Kebab Express' });
    expect(screen.getByRole('button', { name: 'Voter pour Le Petit Bistrot Lillois' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retirer mon vote pour Lille Kebab Express' }));

    await waitFor(() => expect(deletedVoteId).toBe('vote-fri02'));
  });

  it('keeps a newly cast vote visible after the mutation succeeds', async () => {
    const user = userEvent.setup();
    const session = sessionFixtures.find((s) => s.id === 'session-friday')!;

    setupSuccessHandlers(session);
    setCurrentUser(userFixtures[0]);
    render(createElement(SessionDetailPage), { wrapper: createWrapper(['/sessions/session-friday']) });

    const voteButton = await screen.findByRole('button', { name: 'Voter pour Lille Kebab Express' });
    await user.click(voteButton);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Retirer mon vote pour Lille Kebab Express' })).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Voter pour Lille Kebab Express' })).not.toBeInTheDocument();
  });

  it('replaces existing user votes when casting a new candidate vote', async () => {
    const user = userEvent.setup();
    const session = sessionFixtures.find((s) => s.id === 'session-friday')!;

    setupSuccessHandlers(session);
    setCurrentUser(userFixtures[0]);
    render(createElement(SessionDetailPage), { wrapper: createWrapper(['/sessions/session-friday']) });

    await screen.findByRole('button', { name: 'Retirer mon vote pour Le Petit Bistrot Lillois' });
    await screen.findByRole('button', { name: 'Retirer mon vote pour La Table de Lille' });

    await user.click(screen.getByRole('button', { name: 'Voter pour Lille Kebab Express' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Retirer mon vote pour Lille Kebab Express' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Voter pour Le Petit Bistrot Lillois' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voter pour La Table de Lille' })).toBeInTheDocument();
  });

  it('keeps default MSW vote removals visible for first and last candidates', async () => {
    const user = userEvent.setup();
    const session = sessionFixtures.find((s) => s.id === 'session-friday')!;

    setupSuccessHandlers(session);
    setCurrentUser(userFixtures[0]);
    render(createElement(SessionDetailPage), { wrapper: createWrapper(['/sessions/session-friday']) });

    await user.click(await screen.findByRole('button', { name: 'Retirer mon vote pour Le Petit Bistrot Lillois' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Voter pour Le Petit Bistrot Lillois' })).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Retirer mon vote pour La Table de Lille' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Voter pour La Table de Lille' })).toBeInTheDocument());
  });

  it('persists default MSW vote changes after remounting the session detail', async () => {
    const user = userEvent.setup();
    const session = sessionFixtures.find((s) => s.id === 'session-friday')!;

    setupSuccessHandlers(session);
    setCurrentUser(userFixtures[0]);
    const firstRender = render(createElement(SessionDetailPage), { wrapper: createWrapper(['/sessions/session-friday']) });

    await user.click(await screen.findByRole('button', { name: 'Voter pour Lille Kebab Express' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Retirer mon vote pour Lille Kebab Express' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Voter pour Le Petit Bistrot Lillois' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voter pour La Table de Lille' })).toBeInTheDocument();

    firstRender.unmount();

    render(createElement(SessionDetailPage), { wrapper: createWrapper(['/sessions/session-friday']) });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Retirer mon vote pour Lille Kebab Express' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Voter pour Le Petit Bistrot Lillois' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voter pour La Table de Lille' })).toBeInTheDocument();
  });

  it('renders completed results and selected restaurant name', async () => {
    const session = sessionFixtures[0];

    setupSuccessHandlers(session);
    server.use(
      http.get(`${BASE}/sessions/:id/candidates`, () =>
        HttpResponse.json(candidateFixtures.filter((candidate) => candidate.sessionId === 'session-monday')),
      ),
      http.get(`${BASE}/sessions/:id/results`, () => HttpResponse.json(voteResultFixtures)),
    );
    setCurrentUser(userFixtures[0]);
    render(createElement(SessionDetailPage), { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByText('Résultats')).toBeInTheDocument());
    expect((await screen.findAllByText('Chez Marcel Sandwich')).length).toBeGreaterThan(0);
    expect(screen.getByText('4 votes')).toBeInTheDocument();
    await screen.findByText((content, element) =>
      element?.tagName.toLowerCase() === 'p' && element.textContent === 'Restaurant sélectionné : Chez Marcel Sandwich',
    );
  });
});
