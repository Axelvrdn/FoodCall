import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { server } from '@/mocks/server';
import { canManageGroup, canCreateInvite, canDeleteGroup } from './group-queries';
import { GroupsPage } from './GroupsPage';
import type { GroupListItem, CursorPage } from '@/types/api';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: qc }, createElement(MemoryRouter, null, children));
  };
}

function createRouteWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: qc },
      createElement(MemoryRouter, { initialEntries: ['/groupes'] },
        createElement(Routes, null,
          createElement(Route, { path: '/groupes', element: children }),
          createElement(Route, { path: '/groupes/:id', element: createElement('h1', null, 'Détail groupe ouvert') }),
        ),
      ),
    );
  };
}

const BASE = 'http://localhost:3000/api';

function cursorPage<T>(items: T[], nextCursor: string | null = null): CursorPage<T> {
  return { data: items, meta: { nextCursor } };
}

const ownerGroup: GroupListItem = {
  id: 'g1', name: 'Lille Lunch Crew', description: 'Choisir vite et bien.', role: 'owner', budgetMax: '20.00', createdAt: '2026-04-02T10:00:00.000Z',
};
const adminGroup: GroupListItem = {
  id: 'g2', name: 'Paris Dinner Club', description: 'Dîners entre amis.', role: 'admin', budgetMax: '35.00', createdAt: '2026-04-10T08:00:00.000Z',
};
const memberGroup: GroupListItem = {
  id: 'g3', name: 'Lyon Weekend Bites', description: 'Bonnes adresses.', role: 'member', budgetMax: null, createdAt: '2026-04-20T09:00:00.000Z',
};

describe('canManageGroup', () => {
  it('returns true for owner', () => expect(canManageGroup('owner')).toBe(true));
  it('returns true for admin', () => expect(canManageGroup('admin')).toBe(true));
  it('returns false for member', () => expect(canManageGroup('member')).toBe(false));
});

describe('canCreateInvite', () => {
  it('returns true for owner', () => expect(canCreateInvite('owner')).toBe(true));
  it('returns true for admin', () => expect(canCreateInvite('admin')).toBe(true));
  it('returns false for member', () => expect(canCreateInvite('member')).toBe(false));
});

describe('canDeleteGroup', () => {
  it('returns true for owner', () => expect(canDeleteGroup('owner')).toBe(true));
  it('returns false for admin', () => expect(canDeleteGroup('admin')).toBe(false));
  it('returns false for member', () => expect(canDeleteGroup('member')).toBe(false));
});

describe('GroupsPage', () => {
  beforeEach(() => server.resetHandlers());

  it('shows loading state with role="status"', () => {
    server.use(
      http.get(`${BASE}/groups`, async () => new Promise(() => {})),
    );
    render(createElement(GroupsPage), { wrapper: createWrapper() });
    expect(screen.getByRole('status')).toHaveTextContent('Chargement');
  });

  it('shows empty state when no groups', async () => {
    server.use(
      http.get(`${BASE}/groups`, () => HttpResponse.json(cursorPage<GroupListItem>([]))),
    );
    render(createElement(GroupsPage), { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText('Aucun groupe pour le moment.')).toBeInTheDocument());
    expect(screen.getByText('Créer un groupe')).toBeInTheDocument();
    expect(screen.getByText('Rejoindre un groupe')).toBeInTheDocument();
  });

  it('shows error state with role="alert"', async () => {
    server.use(
      http.get(`${BASE}/groups`, () =>
        HttpResponse.json({ statusCode: 500, message: 'Internal Server Error', error: 'Internal Server Error' }, { status: 500 }),
      ),
    );
    render(createElement(GroupsPage), { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent('Impossible de charger les groupes');
  });

  it('renders group names, roles, and budget on success', async () => {
    server.use(
      http.get(`${BASE}/groups`, () =>
        HttpResponse.json(cursorPage([ownerGroup, adminGroup, memberGroup])),
      ),
    );
    render(createElement(GroupsPage), { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText('Lille Lunch Crew')).toBeInTheDocument());
    expect(screen.getByText('Paris Dinner Club')).toBeInTheDocument();
    expect(screen.getByText('Lyon Weekend Bites')).toBeInTheDocument();
    expect(screen.getByText('Propriétaire')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Membre')).toBeInTheDocument();
    expect(screen.getByText(/20,00\s*€/)).toBeInTheDocument();
    expect(screen.getByText(/35,00\s*€/)).toBeInTheDocument();
  });

  it('shows role-gated actions: owner and admin see Gérer and Inviter, member does not', async () => {
    server.use(
      http.get(`${BASE}/groups`, () =>
        HttpResponse.json(cursorPage([ownerGroup, adminGroup, memberGroup])),
      ),
    );
    render(createElement(GroupsPage), { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText('Lille Lunch Crew')).toBeInTheDocument());
    expect(screen.getAllByText('Gérer')).toHaveLength(2);
    expect(screen.getAllByText('Inviter')).toHaveLength(2);
  });

  it('opens a group detail route from the group list', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(`${BASE}/groups`, () =>
        HttpResponse.json(cursorPage([ownerGroup])),
      ),
    );

    render(createElement(GroupsPage), { wrapper: createRouteWrapper() });
    await waitFor(() => expect(screen.getByText('Lille Lunch Crew')).toBeInTheDocument());

    await user.click(screen.getByRole('link', { name: 'Ouvrir Lille Lunch Crew' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Détail groupe ouvert' })).toBeInTheDocument());
  });

  it('does not show Gérer or Inviter buttons for member role', async () => {
    server.use(
      http.get(`${BASE}/groups`, () =>
        HttpResponse.json(cursorPage([memberGroup])),
      ),
    );
    render(createElement(GroupsPage), { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText('Lyon Weekend Bites')).toBeInTheDocument());
    expect(screen.queryByText('Gérer')).not.toBeInTheDocument();
    expect(screen.queryByText('Inviter')).not.toBeInTheDocument();
  });

  it('shows Afficher plus button when nextCursor is present', async () => {
    server.use(
      http.get(`${BASE}/groups`, () =>
        HttpResponse.json(cursorPage([ownerGroup], 'next-page-cursor')),
      ),
    );
    render(createElement(GroupsPage), { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText('Afficher plus')).toBeInTheDocument());
  });

  it('loads the next cursor page when Afficher plus is clicked', async () => {
    const user = userEvent.setup();
    const nextPageGroup: GroupListItem = {
      id: 'g4', name: 'Bordeaux Tapas Crew', description: 'Petites assiettes.', role: 'member', budgetMax: '28.00', createdAt: '2026-04-22T09:00:00.000Z',
    };

    server.use(
      http.get(`${BASE}/groups`, ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor');
        if (cursor === 'next-page-cursor') {
          return HttpResponse.json(cursorPage([nextPageGroup], null));
        }
        return HttpResponse.json(cursorPage([ownerGroup], 'next-page-cursor'));
      }),
    );

    render(createElement(GroupsPage), { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText('Lille Lunch Crew')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Afficher plus' }));

    await waitFor(() => expect(screen.getByText('Bordeaux Tapas Crew')).toBeInTheDocument());
    expect(screen.getByText('Lille Lunch Crew')).toBeInTheDocument();
  });

  it('does not show Afficher plus when nextCursor is null', async () => {
    server.use(
      http.get(`${BASE}/groups`, () =>
        HttpResponse.json(cursorPage([ownerGroup], null)),
      ),
    );
    render(createElement(GroupsPage), { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText('Lille Lunch Crew')).toBeInTheDocument());
    expect(screen.queryByText('Afficher plus')).not.toBeInTheDocument();
  });
});
