import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { server } from '@/mocks/server';
import { GroupJoinPage } from './GroupJoinPage';
import { GroupsPage } from './GroupsPage';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: qc },
      createElement(MemoryRouter, { initialEntries: ['/groupes/rejoindre'] },
        createElement(Routes, null,
          createElement(Route, { path: '/groupes/rejoindre', element: children }),
          createElement(Route, { path: '/groupes', element: createElement(GroupsPage) }),
          createElement(Route, { path: '/groupes/:id', element: createElement('h1', null, 'Groupe rejoint ouvert') }),
        ),
      ),
    );
  };
}

describe('GroupJoinPage', () => {
  beforeEach(() => server.resetHandlers());

  it('rejects non backend invite-code formats before mutation', async () => {
    const user = userEvent.setup();
    render(createElement(GroupJoinPage), { wrapper: createWrapper() });

    await user.type(screen.getByLabelText("Code d'invitation"), 'FC-LILLE');
    await user.click(screen.getByRole('button', { name: 'Rejoindre le groupe' }));

    expect(screen.getByRole('alert')).toHaveTextContent('exactement 8 caractères alphanumériques');
  });

  it('joins with a backend invite code and opens the joined group', async () => {
    const user = userEvent.setup();
    render(createElement(GroupJoinPage), { wrapper: createWrapper() });

    await user.type(screen.getByLabelText("Code d'invitation"), 'FCPARIS1');
    await user.click(screen.getByRole('button', { name: 'Rejoindre le groupe' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Groupe rejoint ouvert' })).toBeInTheDocument());
  });
});
