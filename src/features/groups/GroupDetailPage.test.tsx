import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/stores/auth-store';
import { GroupDetailPage } from './GroupDetailPage';
import {
  groupFixtures,
  memberFixtures,
  inviteFixtures,
  sessionFixtures,
  userFixtures,
  apiErrors,
  emptyPage,
} from '@/mocks/fixtures';
import type { Group, CursorPage, VoteSession, GroupInvite } from '@/types/api';

const BASE = 'http://localhost:3000/api';

function createWrapper(initialEntries: string[] = ['/groupes/group-lille']) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: qc },
      createElement(MemoryRouter, { initialEntries },
        createElement(Routes, null,
          createElement(Route, { path: '/groupes/:id', element: children }),
        ),
      ),
    );
  };
}

function setCurrentUser(user: typeof userFixtures[number]) {
  useAuthStore.getState().setUser(user);
}

function cursorPage<T>(items: T[], nextCursor: string | null = null): CursorPage<T> {
  return { data: items, meta: { nextCursor } };
}

describe('GroupDetailPage', () => {
  beforeEach(() => {
    server.resetHandlers();
    useAuthStore.getState().logout();
  });

  it('shows loading state with role="status"', () => {
    server.use(
      http.get(`${BASE}/groups/:id`, async () => new Promise(() => {})),
    );
    setCurrentUser(userFixtures[0]);
    render(createElement(GroupDetailPage), { wrapper: createWrapper() });
    expect(screen.getByRole('status')).toHaveTextContent('Chargement');
  });

  it('shows 404 state when group is not found', async () => {
    server.use(
      http.get(`${BASE}/groups/:id`, () =>
        HttpResponse.json(apiErrors.notFound('Group'), { status: 404 }),
      ),
    );
    setCurrentUser(userFixtures[0]);
    render(createElement(GroupDetailPage), { wrapper: createWrapper(['/groupes/unknown']) });
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent("n'existe pas");
  });

  it('shows generic error state on API failure', async () => {
    server.use(
      http.get(`${BASE}/groups/:id`, () =>
        HttpResponse.json(apiErrors.forbidden(), { status: 403 }),
      ),
    );
    setCurrentUser(userFixtures[0]);
    render(createElement(GroupDetailPage), { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent('Impossible de charger');
  });

  it('renders group name, description, and defaults on success', async () => {
    const group = groupFixtures[0];
    const members = memberFixtures.filter((m) => m.groupId === group.id);
    const sessions = sessionFixtures.filter((s) => s.groupId === group.id);

    server.use(
      http.get(`${BASE}/groups/:id`, ({ params }) => {
        const g = groupFixtures.find((gf) => gf.id === params['id']);
        return g ? HttpResponse.json(g) : HttpResponse.json(apiErrors.notFound('Group'), { status: 404 });
      }),
      http.get(`${BASE}/groups/:id/members`, ({ params }) => {
        return HttpResponse.json(memberFixtures.filter((m) => m.groupId === params['id']));
      }),
      http.get(`${BASE}/groups/:groupId/sessions`, ({ params }) => {
        const list = sessionFixtures.filter((s) => s.groupId === params['groupId']);
        return HttpResponse.json(cursorPage(list));
      }),
    );

    setCurrentUser(userFixtures[0]); // Alice, owner of group-lille
    render(createElement(GroupDetailPage), { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(group.name));
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(group.defaultStartAddress!)).toBeInTheDocument();
    expect(screen.getByText('2 km')).toBeInTheDocument();
    expect(screen.getByText(/20,00/)).toBeInTheDocument();

    for (const member of members) {
      await waitFor(() => expect(screen.getByText(member.user!.displayName)).toBeInTheDocument());
    }

    for (const session of sessions.slice(0, 5)) {
      await waitFor(() => expect(screen.getByText(session.name)).toBeInTheDocument());
    }
  });

  it('shows role-gated panels for owner', async () => {
    server.use(
      http.get(`${BASE}/groups/:id`, ({ params }) => {
        const g = groupFixtures.find((gf) => gf.id === params['id']);
        return g ? HttpResponse.json(g) : HttpResponse.json(apiErrors.notFound('Group'), { status: 404 });
      }),
      http.get(`${BASE}/groups/:id/members`, ({ params }) => {
        return HttpResponse.json(memberFixtures.filter((m) => m.groupId === params['id']));
      }),
      http.get(`${BASE}/groups/:groupId/sessions`, ({ params }) => {
        const list = sessionFixtures.filter((s) => s.groupId === params['groupId']);
        return HttpResponse.json(cursorPage(list));
      }),
    );

    setCurrentUser(userFixtures[0]); // Alice = owner
    render(createElement(GroupDetailPage), { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
    expect(screen.getByText('Modifier le groupe')).toBeInTheDocument();
    expect(screen.getByText('Invitations')).toBeInTheDocument();
  });

  it('does not show edit or invite panels for member', async () => {
    server.use(
      http.get(`${BASE}/groups/:id`, ({ params }) => {
        const g = groupFixtures.find((gf) => gf.id === params['id']);
        return g ? HttpResponse.json(g) : HttpResponse.json(apiErrors.notFound('Group'), { status: 404 });
      }),
      http.get(`${BASE}/groups/:id/members`, ({ params }) => {
        return HttpResponse.json(memberFixtures.filter((m) => m.groupId === params['id']));
      }),
      http.get(`${BASE}/groups/:groupId/sessions`, ({ params }) => {
        const list = sessionFixtures.filter((s) => s.groupId === params['groupId']);
        return HttpResponse.json(cursorPage(list));
      }),
    );

    setCurrentUser(userFixtures[3]); // David = member of group-lille
    render(createElement(GroupDetailPage), { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
    expect(screen.queryByText('Modifier le groupe')).not.toBeInTheDocument();
    expect(screen.queryByText('Invitations')).not.toBeInTheDocument();
  });

  it('shows empty members state when no members returned', async () => {
    server.use(
      http.get(`${BASE}/groups/:id`, ({ params }) => {
        const g = groupFixtures.find((gf) => gf.id === params['id']);
        return g ? HttpResponse.json(g) : HttpResponse.json(apiErrors.notFound('Group'), { status: 404 });
      }),
      http.get(`${BASE}/groups/:id/members`, () => HttpResponse.json([])),
      http.get(`${BASE}/groups/:groupId/sessions`, () => HttpResponse.json(emptyPage<VoteSession>())),
    );

    setCurrentUser(userFixtures[0]);
    render(createElement(GroupDetailPage), { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByText('Aucun membre.')).toBeInTheDocument());
  });

  it('shows empty sessions state when no sessions', async () => {
    server.use(
      http.get(`${BASE}/groups/:id`, ({ params }) => {
        const g = groupFixtures.find((gf) => gf.id === params['id']);
        return g ? HttpResponse.json(g) : HttpResponse.json(apiErrors.notFound('Group'), { status: 404 });
      }),
      http.get(`${BASE}/groups/:id/members`, ({ params }) => {
        return HttpResponse.json(memberFixtures.filter((m) => m.groupId === params['id']));
      }),
      http.get(`${BASE}/groups/:groupId/sessions`, () => HttpResponse.json(emptyPage<VoteSession>())),
    );

    setCurrentUser(userFixtures[0]);
    render(createElement(GroupDetailPage), { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByText('Aucune session pour le moment.')).toBeInTheDocument());
  });

  it('lets an owner update a member role inline', async () => {
    const user = userEvent.setup();
    let capturedRole: string | null = null;

    server.use(
      http.get(`${BASE}/groups/:id`, ({ params }) => {
        const g = groupFixtures.find((gf) => gf.id === params['id']);
        return g ? HttpResponse.json(g) : HttpResponse.json(apiErrors.notFound('Group'), { status: 404 });
      }),
      http.get(`${BASE}/groups/:id/members`, ({ params }) => {
        return HttpResponse.json(memberFixtures.filter((m) => m.groupId === params['id']));
      }),
      http.get(`${BASE}/groups/:groupId/sessions`, () => HttpResponse.json(emptyPage<VoteSession>())),
      http.patch(`${BASE}/groups/:id/members/:userId/role`, async ({ params, request }) => {
        const body = await request.json() as { role: string };
        capturedRole = body.role;
        const member = memberFixtures.find((m) => m.groupId === params['id'] && m.userId === params['userId']);
        return member ? HttpResponse.json({ ...member, role: body.role }) : HttpResponse.json(apiErrors.notFound('Member'), { status: 404 });
      }),
    );

    setCurrentUser(userFixtures[0]);
    render(createElement(GroupDetailPage), { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByText('Ben')).toBeInTheDocument());
    await user.selectOptions(screen.getByLabelText('Rôle de Ben'), 'member');
    await user.click(screen.getByRole('button', { name: 'Mettre à jour le rôle de Ben' }));

    await waitFor(() => expect(capturedRole).toBe('member'));
  });

  it('keeps a default MSW member role update visible after success', async () => {
    const user = userEvent.setup();

    setCurrentUser(userFixtures[0]);
    render(createElement(GroupDetailPage), { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByText('Ben')).toBeInTheDocument());
    await user.selectOptions(screen.getByLabelText('Rôle de Ben'), 'member');
    await user.click(screen.getByRole('button', { name: 'Mettre à jour le rôle de Ben' }));

    await waitFor(() => expect(screen.getByText('Rôle de Ben mis à jour.')).toBeInTheDocument());
    expect(screen.getByLabelText('Rôle de Ben')).toHaveValue('member');
    expect(within(screen.getByRole('group', { name: 'Membre Ben' })).getAllByText('Membre').length).toBeGreaterThan(0);
  });

  it('lets an owner remove a member inline after confirmation', async () => {
    const user = userEvent.setup();
    let removedUserId: string | null = null;

    server.use(
      http.get(`${BASE}/groups/:id`, ({ params }) => {
        const g = groupFixtures.find((gf) => gf.id === params['id']);
        return g ? HttpResponse.json(g) : HttpResponse.json(apiErrors.notFound('Group'), { status: 404 });
      }),
      http.get(`${BASE}/groups/:id/members`, ({ params }) => {
        const members = memberFixtures.filter((m) => m.groupId === params['id'] && m.userId !== removedUserId);
        return HttpResponse.json(members);
      }),
      http.get(`${BASE}/groups/:groupId/sessions`, () => HttpResponse.json(emptyPage<VoteSession>())),
      http.delete(`${BASE}/groups/:id/members/:userId`, ({ params }) => {
        removedUserId = String(params['userId']);
        return new HttpResponse(null, { status: 204 });
      }),
    );

    setCurrentUser(userFixtures[0]);
    render(createElement(GroupDetailPage), { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByText('Ben')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Retirer Ben' }));
    await user.click(screen.getByRole('button', { name: 'Confirmer le retrait de Ben' }));

    await waitFor(() => expect(removedUserId).toBe('user-ben'));
  });

  it('keeps a default MSW member removal visible after success', async () => {
    const user = userEvent.setup();

    setCurrentUser(userFixtures[0]);
    render(createElement(GroupDetailPage), { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByText('Ben')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Retirer Ben' }));
    await user.click(screen.getByRole('button', { name: 'Confirmer le retrait de Ben' }));

    await waitFor(() => expect(screen.getByText('Ben retiré du groupe.')).toBeInTheDocument());
    expect(screen.queryByText('ben@example.com')).not.toBeInTheDocument();
  });

  it('does not expose member management controls to admins', async () => {
    server.use(
      http.get(`${BASE}/groups/:id`, ({ params }) => {
        const g = groupFixtures.find((gf) => gf.id === params['id']);
        return g ? HttpResponse.json(g) : HttpResponse.json(apiErrors.notFound('Group'), { status: 404 });
      }),
      http.get(`${BASE}/groups/:id/members`, ({ params }) => {
        return HttpResponse.json(memberFixtures.filter((m) => m.groupId === params['id']));
      }),
      http.get(`${BASE}/groups/:groupId/sessions`, () => HttpResponse.json(emptyPage<VoteSession>())),
    );

    setCurrentUser(userFixtures[1]);
    render(createElement(GroupDetailPage), { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByText('Chloe')).toBeInTheDocument());
    expect(screen.queryByLabelText('Rôle de Chloe')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retirer Chloe' })).not.toBeInTheDocument();
  });

  it('creates and displays an invite with copy', async () => {
    const user = userEvent.setup();
    const customInvite: GroupInvite = {
      ...inviteFixtures[0],
      code: 'ABC12345',
    };

    server.use(
      http.get(`${BASE}/groups/:id`, ({ params }) => {
        const g = groupFixtures.find((gf) => gf.id === params['id']);
        return g ? HttpResponse.json(g) : HttpResponse.json(apiErrors.notFound('Group'), { status: 404 });
      }),
      http.get(`${BASE}/groups/:id/members`, ({ params }) => {
        return HttpResponse.json(memberFixtures.filter((m) => m.groupId === params['id']));
      }),
      http.get(`${BASE}/groups/:groupId/sessions`, () => HttpResponse.json(emptyPage<VoteSession>())),
      http.post(`${BASE}/groups/:id/invites`, () =>
        HttpResponse.json(customInvite, { status: 201 }),
      ),
    );

    setCurrentUser(userFixtures[0]);
    render(createElement(GroupDetailPage), { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByText('Invitations')).toBeInTheDocument());

    const createButton = screen.getByRole('button', { name: /Générer un code/ });
    await user.click(createButton);

    await waitFor(() => expect(screen.getByText('ABC12345')).toBeInTheDocument());
    expect(screen.getByText(/Utilisations/)).toBeInTheDocument();
    expect(screen.getByText(/Expire le/)).toBeInTheDocument();

    const copyButton = screen.getByRole('button', { name: 'Copier' });
    await user.click(copyButton);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Copié' })).toBeInTheDocument());
  });

  it('joins a group with a valid invite code', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`${BASE}/groups/:id`, ({ params }) => {
        const g = groupFixtures.find((gf) => gf.id === params['id']);
        return g ? HttpResponse.json(g) : HttpResponse.json(apiErrors.notFound('Group'), { status: 404 });
      }),
      http.get(`${BASE}/groups/:id/members`, ({ params }) => {
        return HttpResponse.json(memberFixtures.filter((m) => m.groupId === params['id']));
      }),
      http.get(`${BASE}/groups/:groupId/sessions`, () => HttpResponse.json(emptyPage<VoteSession>())),
      http.post(`${BASE}/groups/join`, async ({ request }) => {
        const body = await request.json() as { code: string };
        if (body.code === 'ABC12345') {
          return HttpResponse.json(groupFixtures[0]);
        }
        return HttpResponse.json(apiErrors.notFound('Invite'), { status: 404 });
      }),
    );

    setCurrentUser(userFixtures[0]);
    render(createElement(GroupDetailPage), { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByText('Invitations')).toBeInTheDocument());

    const joinInput = screen.getByLabelText("Code d'invitation");
    await user.type(joinInput, 'ABC12345');

    const joinButton = screen.getByRole('button', { name: 'Rejoindre' });
    await user.click(joinButton);

    await waitFor(() =>
      expect(screen.getByText('Vous avez rejoint le groupe avec succès.')).toBeInTheDocument(),
    );
  });

  it('shows join error for invalid code (404)', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`${BASE}/groups/:id`, ({ params }) => {
        const g = groupFixtures.find((gf) => gf.id === params['id']);
        return g ? HttpResponse.json(g) : HttpResponse.json(apiErrors.notFound('Group'), { status: 404 });
      }),
      http.get(`${BASE}/groups/:id/members`, ({ params }) => {
        return HttpResponse.json(memberFixtures.filter((m) => m.groupId === params['id']));
      }),
      http.get(`${BASE}/groups/:groupId/sessions`, () => HttpResponse.json(emptyPage<VoteSession>())),
      http.post(`${BASE}/groups/join`, () =>
        HttpResponse.json(apiErrors.notFound('Invite'), { status: 404 }),
      ),
    );

    setCurrentUser(userFixtures[0]);
    render(createElement(GroupDetailPage), { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByText('Invitations')).toBeInTheDocument());

    const joinInput = screen.getByLabelText("Code d'invitation");
    await user.type(joinInput, 'ABC12345');

    const joinButton = screen.getByRole('button', { name: 'Rejoindre' });
    await user.click(joinButton);

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent("introuvable"),
    );
  });

  it('shows join error for conflict (409)', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`${BASE}/groups/:id`, ({ params }) => {
        const g = groupFixtures.find((gf) => gf.id === params['id']);
        return g ? HttpResponse.json(g) : HttpResponse.json(apiErrors.notFound('Group'), { status: 404 });
      }),
      http.get(`${BASE}/groups/:id/members`, ({ params }) => {
        return HttpResponse.json(memberFixtures.filter((m) => m.groupId === params['id']));
      }),
      http.get(`${BASE}/groups/:groupId/sessions`, () => HttpResponse.json(emptyPage<VoteSession>())),
      http.post(`${BASE}/groups/join`, () =>
        HttpResponse.json(apiErrors.conflict('Already a member'), { status: 409 }),
      ),
    );

    setCurrentUser(userFixtures[0]);
    render(createElement(GroupDetailPage), { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByText('Invitations')).toBeInTheDocument());

    const joinInput = screen.getByLabelText("Code d'invitation");
    await user.type(joinInput, 'ABC12345');

    const joinButton = screen.getByRole('button', { name: 'Rejoindre' });
    await user.click(joinButton);

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('déjà membre'),
    );
  });

  it('shows join error for auth (401)', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`${BASE}/groups/:id`, ({ params }) => {
        const g = groupFixtures.find((gf) => gf.id === params['id']);
        return g ? HttpResponse.json(g) : HttpResponse.json(apiErrors.notFound('Group'), { status: 404 });
      }),
      http.get(`${BASE}/groups/:id/members`, ({ params }) => {
        return HttpResponse.json(memberFixtures.filter((m) => m.groupId === params['id']));
      }),
      http.get(`${BASE}/groups/:groupId/sessions`, () => HttpResponse.json(emptyPage<VoteSession>())),
      http.post(`${BASE}/groups/join`, () =>
        HttpResponse.json(apiErrors.unauthorized(), { status: 401 }),
      ),
    );

    setCurrentUser(userFixtures[0]);
    render(createElement(GroupDetailPage), { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByText('Invitations')).toBeInTheDocument());

    const joinInput = screen.getByLabelText("Code d'invitation");
    await user.type(joinInput, 'ABCDEF12');

    const joinButton = screen.getByRole('button', { name: 'Rejoindre' });
    await user.click(joinButton);

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Authentification requise'),
    );
  });

  it('shows join error for permission (403)', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`${BASE}/groups/:id`, ({ params }) => {
        const g = groupFixtures.find((gf) => gf.id === params['id']);
        return g ? HttpResponse.json(g) : HttpResponse.json(apiErrors.notFound('Group'), { status: 404 });
      }),
      http.get(`${BASE}/groups/:id/members`, ({ params }) => {
        return HttpResponse.json(memberFixtures.filter((m) => m.groupId === params['id']));
      }),
      http.get(`${BASE}/groups/:groupId/sessions`, () => HttpResponse.json(emptyPage<VoteSession>())),
      http.post(`${BASE}/groups/join`, () =>
        HttpResponse.json(apiErrors.forbidden('Not allowed to join this group'), { status: 403 }),
      ),
    );

    setCurrentUser(userFixtures[0]);
    render(createElement(GroupDetailPage), { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByText('Invitations')).toBeInTheDocument());

    const joinInput = screen.getByLabelText("Code d'invitation");
    await user.type(joinInput, 'ABCDEF12');

    const joinButton = screen.getByRole('button', { name: 'Rejoindre' });
    await user.click(joinButton);

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('permission'),
    );
  });

  it('shows create invite error for validation (400)', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`${BASE}/groups/:id`, ({ params }) => {
        const g = groupFixtures.find((gf) => gf.id === params['id']);
        return g ? HttpResponse.json(g) : HttpResponse.json(apiErrors.notFound('Group'), { status: 404 });
      }),
      http.get(`${BASE}/groups/:id/members`, ({ params }) => {
        return HttpResponse.json(memberFixtures.filter((m) => m.groupId === params['id']));
      }),
      http.get(`${BASE}/groups/:groupId/sessions`, () => HttpResponse.json(emptyPage<VoteSession>())),
      http.post(`${BASE}/groups/:id/invites`, () =>
        HttpResponse.json(apiErrors.validation({ maxUses: 'Must be positive' }), { status: 400 }),
      ),
    );

    setCurrentUser(userFixtures[0]);
    render(createElement(GroupDetailPage), { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByText('Invitations')).toBeInTheDocument());

    const createButton = screen.getByRole('button', { name: /Générer un code/ });
    await user.click(createButton);

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Validation failed'),
    );
  });

  it('shows create invite error for auth (401)', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`${BASE}/groups/:id`, ({ params }) => {
        const g = groupFixtures.find((gf) => gf.id === params['id']);
        return g ? HttpResponse.json(g) : HttpResponse.json(apiErrors.notFound('Group'), { status: 404 });
      }),
      http.get(`${BASE}/groups/:id/members`, ({ params }) => {
        return HttpResponse.json(memberFixtures.filter((m) => m.groupId === params['id']));
      }),
      http.get(`${BASE}/groups/:groupId/sessions`, () => HttpResponse.json(emptyPage<VoteSession>())),
      http.post(`${BASE}/groups/:id/invites`, () =>
        HttpResponse.json(apiErrors.unauthorized(), { status: 401 }),
      ),
    );

    setCurrentUser(userFixtures[0]);
    render(createElement(GroupDetailPage), { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByText('Invitations')).toBeInTheDocument());

    const createButton = screen.getByRole('button', { name: /Générer un code/ });
    await user.click(createButton);

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Authentication required'),
    );
  });

  it('shows create invite error for permission (403)', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`${BASE}/groups/:id`, ({ params }) => {
        const g = groupFixtures.find((gf) => gf.id === params['id']);
        return g ? HttpResponse.json(g) : HttpResponse.json(apiErrors.notFound('Group'), { status: 404 });
      }),
      http.get(`${BASE}/groups/:id/members`, ({ params }) => {
        return HttpResponse.json(memberFixtures.filter((m) => m.groupId === params['id']));
      }),
      http.get(`${BASE}/groups/:groupId/sessions`, () => HttpResponse.json(emptyPage<VoteSession>())),
      http.post(`${BASE}/groups/:id/invites`, () =>
        HttpResponse.json(apiErrors.forbidden('Only owner or admin can create invites'), { status: 403 }),
      ),
    );

    setCurrentUser(userFixtures[0]);
    render(createElement(GroupDetailPage), { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByText('Invitations')).toBeInTheDocument());

    const createButton = screen.getByRole('button', { name: /Générer un code/ });
    await user.click(createButton);

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Only owner or admin'),
    );
  });

  it('shows create invite error for not found (404)', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`${BASE}/groups/:id`, ({ params }) => {
        const g = groupFixtures.find((gf) => gf.id === params['id']);
        return g ? HttpResponse.json(g) : HttpResponse.json(apiErrors.notFound('Group'), { status: 404 });
      }),
      http.get(`${BASE}/groups/:id/members`, ({ params }) => {
        return HttpResponse.json(memberFixtures.filter((m) => m.groupId === params['id']));
      }),
      http.get(`${BASE}/groups/:groupId/sessions`, () => HttpResponse.json(emptyPage<VoteSession>())),
      http.post(`${BASE}/groups/:id/invites`, () =>
        HttpResponse.json(apiErrors.notFound('Group'), { status: 404 }),
      ),
    );

    setCurrentUser(userFixtures[0]);
    render(createElement(GroupDetailPage), { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByText('Invitations')).toBeInTheDocument());

    const createButton = screen.getByRole('button', { name: /Générer un code/ });
    await user.click(createButton);

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Group not found'),
    );
  });

  it('shows create invite error for conflict (409)', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`${BASE}/groups/:id`, ({ params }) => {
        const g = groupFixtures.find((gf) => gf.id === params['id']);
        return g ? HttpResponse.json(g) : HttpResponse.json(apiErrors.notFound('Group'), { status: 404 });
      }),
      http.get(`${BASE}/groups/:id/members`, ({ params }) => {
        return HttpResponse.json(memberFixtures.filter((m) => m.groupId === params['id']));
      }),
      http.get(`${BASE}/groups/:groupId/sessions`, () => HttpResponse.json(emptyPage<VoteSession>())),
      http.post(`${BASE}/groups/:id/invites`, () =>
        HttpResponse.json(apiErrors.conflict('Invite limit reached'), { status: 409 }),
      ),
    );

    setCurrentUser(userFixtures[0]);
    render(createElement(GroupDetailPage), { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByText('Invitations')).toBeInTheDocument());

    const createButton = screen.getByRole('button', { name: /Générer un code/ });
    await user.click(createButton);

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Invite limit reached'),
    );
  });

  it('submits the edit form and invalidates queries', async () => {
    const user = userEvent.setup();
    let detailCallCount = 0;

    server.use(
      http.get(`${BASE}/groups/:id`, ({ params }) => {
        detailCallCount++;
        const g = groupFixtures.find((gf) => gf.id === params['id']);
        return g ? HttpResponse.json(g) : HttpResponse.json(apiErrors.notFound('Group'), { status: 404 });
      }),
      http.get(`${BASE}/groups/:id/members`, ({ params }) => {
        return HttpResponse.json(memberFixtures.filter((m) => m.groupId === params['id']));
      }),
      http.get(`${BASE}/groups/:groupId/sessions`, () => HttpResponse.json(emptyPage<VoteSession>())),
      http.patch(`${BASE}/groups/:id`, async ({ params, request }) => {
        const body = await request.json() as Partial<Group>;
        const g = groupFixtures.find((gf) => gf.id === params['id']);
        if (!g) return HttpResponse.json(apiErrors.notFound('Group'), { status: 404 });
        return HttpResponse.json({ ...g, ...body, budgetMax: body.budgetMax != null ? String(body.budgetMax) : g.budgetMax });
      }),
    );

    setCurrentUser(userFixtures[0]);
    render(createElement(GroupDetailPage), { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());

    const nameInput = screen.getByLabelText('Nom du groupe');
    const budgetInput = screen.getByLabelText('Budget maximum (EUR)');
    const submitButton = screen.getByRole('button', { name: 'Enregistrer les modifications' });

    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Name');
    await user.clear(budgetInput);
    await user.type(budgetInput, '30');

    const initialDetailCalls = detailCallCount;
    await user.click(submitButton);

    await waitFor(() => expect(detailCallCount).toBeGreaterThan(initialDetailCalls));
  });

  it('keeps a default MSW group update visible after success', async () => {
    const user = userEvent.setup();

    setCurrentUser(userFixtures[0]);
    render(createElement(GroupDetailPage), { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Lille Lunch Crew'));

    const nameInput = screen.getByLabelText('Nom du groupe');
    await user.clear(nameInput);
    await user.type(nameInput, 'Lille Lunch Crew Updated');
    await user.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    await waitFor(() => expect(screen.getByText('Groupe mis à jour.')).toBeInTheDocument());
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Lille Lunch Crew Updated');
  });

  it('shows coordinate validation error when only latitude is filled', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`${BASE}/groups/:id`, ({ params }) => {
        const g = groupFixtures.find((gf) => gf.id === params['id']);
        return g ? HttpResponse.json(g) : HttpResponse.json(apiErrors.notFound('Group'), { status: 404 });
      }),
      http.get(`${BASE}/groups/:id/members`, ({ params }) => {
        return HttpResponse.json(memberFixtures.filter((m) => m.groupId === params['id']));
      }),
      http.get(`${BASE}/groups/:groupId/sessions`, () => HttpResponse.json(emptyPage<VoteSession>())),
    );

    setCurrentUser(userFixtures[0]);
    render(createElement(GroupDetailPage), { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());

    const latInput = screen.getByLabelText('Latitude');
    const lngInput = screen.getByLabelText('Longitude');
    const submitButton = screen.getByRole('button', { name: 'Enregistrer les modifications' });

    await user.clear(lngInput);
    await user.clear(latInput);
    await user.type(latInput, '50.123');
    await user.click(submitButton);

    await waitFor(() =>
      expect(screen.getByText(/latitude et la longitude doivent être renseignées ensemble/)).toBeInTheDocument(),
    );
  });

  it('shows rate-limit error on 429 from group detail fetch', async () => {
    server.use(
      http.get(`${BASE}/groups/:id`, () =>
        HttpResponse.json(apiErrors.rateLimit(), { status: 429 }),
      ),
    );
    setCurrentUser(userFixtures[0]);
    render(createElement(GroupDetailPage), { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent('Impossible de charger');
  });

  it('shows generic error state on 5xx from group detail fetch', async () => {
    server.use(
      http.get(`${BASE}/groups/:id`, () =>
        HttpResponse.json(apiErrors.providerFailure(), { status: 503 }),
      ),
    );
    setCurrentUser(userFixtures[0]);
    render(createElement(GroupDetailPage), { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent('Impossible de charger');
  });

  it('shows name validation error when name is empty', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`${BASE}/groups/:id`, ({ params }) => {
        const g = groupFixtures.find((gf) => gf.id === params['id']);
        return g ? HttpResponse.json(g) : HttpResponse.json(apiErrors.notFound('Group'), { status: 404 });
      }),
      http.get(`${BASE}/groups/:id/members`, ({ params }) => {
        return HttpResponse.json(memberFixtures.filter((m) => m.groupId === params['id']));
      }),
      http.get(`${BASE}/groups/:groupId/sessions`, () => HttpResponse.json(emptyPage<VoteSession>())),
    );

    setCurrentUser(userFixtures[0]);
    render(createElement(GroupDetailPage), { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());

    const nameInput = screen.getByLabelText('Nom du groupe');
    const submitButton = screen.getByRole('button', { name: 'Enregistrer les modifications' });

    await user.clear(nameInput);
    await user.click(submitButton);

    await waitFor(() =>
      expect(screen.getByText('Le nom du groupe est requis.')).toBeInTheDocument(),
    );
  });
});
