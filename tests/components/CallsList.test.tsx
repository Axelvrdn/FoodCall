import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { CallsList } from '@/components/CallsList';
import { useAuthStore } from '@/stores/auth-store';
import { callFixtures, sessionFixtures, userFixtures, apiErrors, paginate, emptyPage } from '@/mocks/fixtures';
import type { FoodCall } from '@/types/api';

const BASE = 'http://localhost:3000/api';

function createWrapper(qc?: QueryClient) {
  const client = qc ?? new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client }, children);
  };
}

describe('CallsList', () => {
  beforeEach(() => {
    server.resetHandlers();
    useAuthStore.getState().logout();
  });

  it('renders loading state while fetching', () => {
    server.use(
      http.get(`${BASE}/sessions/:id/calls`, async () => new Promise(() => {})),
    );
    render(
      <CallsList sessionId="session-monday" sessionState="completed" currentUserId="user-alice" />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByRole('status')).toHaveTextContent('Chargement des calls');
  });

  it('renders empty state when no calls', async () => {
    server.use(
      http.get(`${BASE}/sessions/:id/calls`, () =>
        HttpResponse.json(emptyPage<FoodCall>())),
    );
    render(
      <CallsList sessionId="session-empty" sessionState="active" currentUserId="user-alice" />,
      { wrapper: createWrapper() },
    );
    await waitFor(() => {
      expect(screen.getByText('Aucun call pour cette session.')).toBeInTheDocument();
    });
  });

  it('renders calls with restaurant name and pitch', async () => {
    const sessionCalls = callFixtures.filter((c) => c.sessionId === 'session-monday');
    server.use(
      http.get(`${BASE}/sessions/:id/calls`, () =>
        HttpResponse.json(paginate(sessionCalls))),
    );
    render(
      <CallsList sessionId="session-monday" sessionState="completed" currentUserId="user-alice" />,
      { wrapper: createWrapper() },
    );
    await waitFor(() => {
      expect(screen.getByText('Lille Kebab Express')).toBeInTheDocument();
    });
    expect(screen.getByText(callFixtures[0].pitch)).toBeInTheDocument();
    expect(screen.getByText('Chez Marcel Sandwich')).toBeInTheDocument();
  });

  it('shows delete button for author in active state', async () => {
    const sessionCalls = callFixtures.filter((c) => c.sessionId === 'session-monday');
    server.use(
      http.get(`${BASE}/sessions/:id/calls`, () =>
        HttpResponse.json(paginate(sessionCalls))),
    );
    const currentUserId = callFixtures[0].userId;
    render(
      <CallsList sessionId="session-monday" sessionState="active" currentUserId={currentUserId} />,
      { wrapper: createWrapper() },
    );
    await waitFor(() => {
      expect(screen.getByText('Lille Kebab Express')).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByRole('button', { name: 'Supprimer' });
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  it('shows delete button for author in voting state', async () => {
    const sessionCalls = callFixtures.filter((c) => c.sessionId === 'session-monday');
    server.use(
      http.get(`${BASE}/sessions/:id/calls`, () =>
        HttpResponse.json(paginate(sessionCalls))),
    );
    const currentUserId = callFixtures[0].userId;
    render(
      <CallsList sessionId="session-monday" sessionState="voting" currentUserId={currentUserId} />,
      { wrapper: createWrapper() },
    );
    await waitFor(() => {
      expect(screen.getByText('Lille Kebab Express')).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByRole('button', { name: 'Supprimer' });
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  it('hides delete button in completed state', async () => {
    const sessionCalls = callFixtures.filter((c) => c.sessionId === 'session-monday');
    server.use(
      http.get(`${BASE}/sessions/:id/calls`, () =>
        HttpResponse.json(paginate(sessionCalls))),
    );
    const currentUserId = callFixtures[0].userId;
    render(
      <CallsList sessionId="session-monday" sessionState="completed" currentUserId={currentUserId} />,
      { wrapper: createWrapper() },
    );
    await waitFor(() => {
      expect(screen.getByText('Lille Kebab Express')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'Supprimer' })).not.toBeInTheDocument();
  });

  it('hides delete button in cancelled state', async () => {
    const sessionCalls = callFixtures.filter((c) => c.sessionId === 'session-monday');
    server.use(
      http.get(`${BASE}/sessions/:id/calls`, () =>
        HttpResponse.json(paginate(sessionCalls))),
    );
    const currentUserId = callFixtures[0].userId;
    render(
      <CallsList sessionId="session-monday" sessionState="cancelled" currentUserId={currentUserId} />,
      { wrapper: createWrapper() },
    );
    await waitFor(() => {
      expect(screen.getByText('Lille Kebab Express')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'Supprimer' })).not.toBeInTheDocument();
  });

  it('hides delete button in draft state', async () => {
    const sessionCalls = callFixtures.filter((c) => c.sessionId === 'session-monday');
    server.use(
      http.get(`${BASE}/sessions/:id/calls`, () =>
        HttpResponse.json(paginate(sessionCalls))),
    );
    const currentUserId = callFixtures[0].userId;
    render(
      <CallsList sessionId="session-monday" sessionState="draft" currentUserId={currentUserId} />,
      { wrapper: createWrapper() },
    );
    await waitFor(() => {
      expect(screen.getByText('Lille Kebab Express')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'Supprimer' })).not.toBeInTheDocument();
  });

  it('hides delete button for non-author', async () => {
    const sessionCalls = callFixtures.filter((c) => c.sessionId === 'session-monday');
    server.use(
      http.get(`${BASE}/sessions/:id/calls`, () =>
        HttpResponse.json(paginate(sessionCalls))),
    );
    render(
      <CallsList sessionId="session-monday" sessionState="active" currentUserId="user-random" />,
      { wrapper: createWrapper() },
    );
    await waitFor(() => {
      expect(screen.getByText('Lille Kebab Express')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'Supprimer' })).not.toBeInTheDocument();
  });

  it('delete button triggers mutation', async () => {
    const sessionCalls = callFixtures.filter((c) => c.sessionId === 'session-monday');
    let deleteCalled = false;
    server.use(
      http.get(`${BASE}/sessions/:id/calls`, () =>
        HttpResponse.json(paginate(sessionCalls))),
      http.delete(`${BASE}/calls/:id`, () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const currentUserId = callFixtures[0].userId;
    render(
      <CallsList sessionId="session-monday" sessionState="active" currentUserId={currentUserId} />,
      { wrapper: createWrapper() },
    );
    await waitFor(() => {
      expect(screen.getByText('Lille Kebab Express')).toBeInTheDocument();
    });
    const deleteBtn = screen.getAllByRole('button', { name: 'Supprimer' })[0];
    await userEvent.click(deleteBtn);
    await waitFor(() => {
      expect(deleteCalled).toBe(true);
    });
  });

  it('shows load-more button when nextCursor exists', async () => {
    const manyCalls = Array.from({ length: 5 }, (_, i) => ({
      ...callFixtures[0],
      id: `call-extra-${i}`,
    }));
    server.use(
      http.get(`${BASE}/sessions/:id/calls`, ({ request }) => {
        const url = new URL(request.url);
        const cursor = url.searchParams.get('cursor') ?? undefined;
        return HttpResponse.json(paginate(manyCalls, cursor, 3));
      }),
    );
    render(
      <CallsList sessionId="session-monday" sessionState="active" currentUserId="user-alice" />,
      { wrapper: createWrapper() },
    );
    await waitFor(() => {
      expect(screen.getByText('Charger plus de calls')).toBeInTheDocument();
    });
  });

  it('shows error state with retry button', async () => {
    server.use(
      http.get(`${BASE}/sessions/:id/calls`, () =>
        HttpResponse.json(apiErrors.forbidden(), { status: 403 })),
    );
    render(
      <CallsList sessionId="session-monday" sessionState="active" currentUserId="user-alice" />,
      { wrapper: createWrapper() },
    );
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Reessayer' })).toBeInTheDocument();
  });
});
